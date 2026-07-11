import {
  Card,
  CHAOS_PROBABILITIES,
  DEFAULT_TURN_SECONDS,
  GAME_CONFIG,
  GameState,
  isValidPlayerCount,
  LOUPE_MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_ROUNDS,
  MIN_PLAYERS,
  Player,
  Role,
  shuffleArray,
  ValidPlayerCount,
} from '@timebomb/shared';
import {randomUUID} from 'crypto';
import {recordCut, recordRoundEnd} from './services/statsService';

// ---------------------------------------------------------------------------
// Room creation / reset
// ---------------------------------------------------------------------------

export function createInitialRoomState(roomId: string): GameState {
  return {
	roomId,
	phase: 'NOT_STARTED',
	status: 'LOBBY',
	players: [],
	currentRound: 1,
	cardsRevealedThisRound: 0,
	totalDefusesFound: 0,
	totalDefusesNeeded: 0,
	playerWithClippers: '',
	isLoupeModeEnabled: false,
	isTimerModeEnabled: false,
	isChaosModeEnabled: false,
	timerDuration: DEFAULT_TURN_SECONDS,
	teamHasLoupe: false,
	revealedCards: [],
	readyPlayers: [],
	surrenderVotes: [],
  };
}

/** Puts a room back in the lobby state. Shared by "Rejouer" and surrender. */
export function resetRoomToLobby(room: GameState): void {
  room.status = 'LOBBY';
  room.phase = 'NOT_STARTED';
  room.readyPlayers = [];
  room.restartReady = [];
  room.revealedCards = [];
  room.currentRound = 1;
  room.cardsRevealedThisRound = 0;
  room.totalDefusesFound = 0;
  room.teamHasLoupe = false;
  room.surrenderVotes = [];
  delete room.stats;

  room.players.forEach(p => {
	p.cards = [];
	p.secretCards = [];
	delete p.role;
  });
}

/**
 * True once every player still present has either gone back to the menus
 * ("Rejouer") or is disconnected — i.e. nobody connected is left on the end
 * screen. Used to decide when the whole room may return to the lobby.
 */
export function everyoneReadyToRestart(room: GameState): boolean {
  if (room.players.length === 0) return false;
  const ready = room.restartReady ?? [];
  return room.players.every(p => ready.includes(p.id) || p.connected === false);
}

// ---------------------------------------------------------------------------
// Role and card distribution
// ---------------------------------------------------------------------------

function assertValidPlayerCount(count: number): asserts count is ValidPlayerCount {
  if (!isValidPlayerCount(count)) {
	throw new Error(`Le nombre de joueurs doit être entre ${MIN_PLAYERS} et ${MAX_PLAYERS}`);
  }
}

export function assignRoles(players: Player[], useLoupe: boolean = false): void {
  const count = players.length;
  assertValidPlayerCount(count);

  const rolePool: Role[] = shuffleArray(GAME_CONFIG[count].roles);

  // With the loupe active (and 5+ players), one Moriarty becomes a Brouilleur.
  if (useLoupe && count >= LOUPE_MIN_PLAYERS) {
	const moriartyIndex = rolePool.indexOf('MORIARTY');
	if (moriartyIndex !== -1) {
	  rolePool[moriartyIndex] = 'BROUILLEUR';
	}
  }

  players.forEach((player, index) => {
	player.role = rolePool[index];
  });
}

/**
 * Chaos mode: role distribution follows one of the `CHAOS_PROBABILITIES`
 * scenarios (see shared/config.ts, also shown to players in the lobby wiki).
 *
 * If the loupe is also active, one of the designated Moriarty is randomly
 * promoted to Brouilleur.
 */
export function assignRolesChaos(players: Player[], useLoupe: boolean = false): void {
  const count = players.length;
  assertValidPlayerCount(count);

  const roll = Math.random();
  const {ALL_MORIARTY, ALL_SHERLOCK, LONE_SHERLOCK} = CHAOS_PROBABILITIES;

  if (roll < ALL_MORIARTY) {
	players.forEach(player => {
	  player.role = 'MORIARTY';
	});
  } else if (roll < ALL_MORIARTY + ALL_SHERLOCK) {
	players.forEach(player => {
	  player.role = 'SHERLOCK';
	});
  } else if (roll < ALL_MORIARTY + ALL_SHERLOCK + LONE_SHERLOCK) {
	const sherlockIndex = Math.floor(Math.random() * players.length);
	players.forEach((player, index) => {
	  player.role = index === sherlockIndex ? 'SHERLOCK' : 'MORIARTY';
	});
  } else {
	players.forEach(player => {
	  player.role = Math.random() < 0.5 ? 'SHERLOCK' : 'MORIARTY';
	});
  }

  // With the loupe active (and 5+ players), promote a random Moriarty to Brouilleur.
  if (useLoupe && count >= LOUPE_MIN_PLAYERS) {
	const moriartys = players.filter(p => p.role === 'MORIARTY');
	if (moriartys.length > 0) {
	  const chosen = moriartys[Math.floor(Math.random() * moriartys.length)];
	  chosen.role = 'BROUILLEUR';
	}
  }
}

export function generateInitialDeck(playerCount: ValidPlayerCount, useLoupe: boolean = false): Card[] {
  const config = GAME_CONFIG[playerCount];
  const deck: Card[] = [];

  let safeCount: number = config.safe;
  let loupeCount = 0;

  // Loupe rule: replaces one Safe cable when enabled with at least 5 players.
  if (useLoupe && playerCount >= LOUPE_MIN_PLAYERS) {
	loupeCount = 1;
	safeCount -= 1;
  }

  for (let i = 0; i < safeCount; i++) deck.push({id: randomUUID(), type: 'SAFE', isRevealed: false});
  for (let i = 0; i < config.defuse; i++) deck.push({id: randomUUID(), type: 'DEFUSE', isRevealed: false});
  deck.push({id: randomUUID(), type: 'BOMB', isRevealed: false});
  for (let i = 0; i < loupeCount; i++) deck.push({id: randomUUID(), type: 'LOUPE', isRevealed: false});

  return shuffleArray(deck);
}

export function distributeCards(deck: Card[], players: Player[]): void {
  const cardsPerPlayer = deck.length / players.length;

  players.forEach((player, index) => {
	const startIndex = index * cardsPerPlayer;
	player.cards = deck.slice(startIndex, startIndex + cardsPerPlayer);
  });
}

export function gatherAndShuffleRemainingCards(players: Player[]): Card[] {
  const remainingCards: Card[] = [];

  players.forEach(player => {
	const unrevealed = player.cards.filter(card => !card.isRevealed);

	unrevealed.forEach(card => {
	  card.isPublic = false;
	});

	remainingCards.push(...unrevealed);
	player.cards = [];
  });

  return shuffleArray(remainingCards);
}

// ---------------------------------------------------------------------------
// The cut: core of the game rules
// ---------------------------------------------------------------------------

export interface CutOutcome {
  /** The card that was just revealed. */
  card: Card;
  /** True if this cut ends the game (one camp wins). */
  finished: boolean;
}

/**
 * Applies a cut if it is legal, advances the round and detects wins. Touches
 * neither timers nor sockets — orchestration (clock, broadcast, achievements)
 * belongs to the caller.
 *
 * @returns the cut outcome, or `null` if the cut is illegal (wrong turn,
 *          card already revealed, self-cut…).
 */
export function applyCut(
	room: GameState,
	sourcePlayerId: string,
	targetPlayerId: string,
	cardId: string,
): CutOutcome | null {
  if (room.status !== 'PLAYING' || room.phase !== 'PLAYING') return null;
  if (room.playerWithClippers !== sourcePlayerId) return null;
  if (sourcePlayerId === targetPlayerId) return null;

  const targetPlayer = room.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return null;

  const cardIndex = targetPlayer.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return null;

  const card = targetPlayer.cards[cardIndex];
  if (card.isRevealed) return null;

  card.isRevealed = true;
  room.revealedCards.push(card);
  targetPlayer.cards.splice(cardIndex, 1);
  room.cardsRevealedThisRound++;
  room.playerWithClippers = targetPlayerId;

  if (room.stats) {
	recordCut(room.stats, sourcePlayerId, targetPlayerId, card.type, room.currentRound, room.cardsRevealedThisRound);
  }

  // Win detection
  if (card.type === 'BOMB') {
	room.status = 'FINISHED';
	room.winner = 'MORIARTY';
  } else if (card.type === 'DEFUSE') {
	room.totalDefusesFound++;
	if (room.totalDefusesFound === room.totalDefusesNeeded) {
	  room.status = 'FINISHED';
	  room.winner = 'SHERLOCK';
	}
  } else if (card.type === 'LOUPE') {
	room.teamHasLoupe = true;
  }

  // End-of-round detection
  if (room.status === 'PLAYING' && room.cardsRevealedThisRound === room.players.length) {
	if (room.stats) {
	  const defusesThisRound = room.revealedCards.slice(-room.players.length).filter(c => c.type === 'DEFUSE').length;
	  recordRoundEnd(room.stats, defusesThisRound, false);
	}

	if (room.currentRound === MAX_ROUNDS) {
	  // Last round elapsed without a full defuse: Moriarty wins.
	  room.status = 'FINISHED';
	  room.winner = 'MORIARTY';
	} else {
	  room.currentRound++;
	  room.cardsRevealedThisRound = 0;
	  room.phase = 'CARD_REVEAL';
	  room.readyPlayers = [];
	  const newDeck = gatherAndShuffleRemainingCards(room.players);
	  distributeCards(newDeck, room.players);
	}
  }

  return {card, finished: room.status === 'FINISHED'};
}

// ---------------------------------------------------------------------------
// Per-player filtered view of the state
// ---------------------------------------------------------------------------

/**
 * Produces the state copy sent to ONE player: their own hidden cards are
 * delivered through `secretCards`, everyone else's are anonymized (type
 * replaced) and roles stripped until the game is finished.
 */
export function sanitizeStateForPlayer(gameState: GameState, targetPlayerId: string): GameState {
  const sanitized = structuredClone(gameState);

  sanitized.players = sanitized.players.map(p => {
	if (p.id === targetPlayerId) {
	  p.secretCards = p.cards.filter(c => !c.isRevealed).map(c => c.type);
	} else {
	  if (sanitized.status !== 'FINISHED') delete p.role;
	  p.cards = p.cards.map(c => (c.isRevealed || c.isPublic) ? c : {...c, type: 'SAFE'});
	}
	return p;
  });

  return sanitized;
}
