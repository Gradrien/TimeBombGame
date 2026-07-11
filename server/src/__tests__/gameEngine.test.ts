import {describe, expect, it} from 'vitest';
import type {Card, CardType, GameState, Player} from '@timebomb/shared';
import {GAME_CONFIG, MAX_ROUNDS} from '@timebomb/shared';
import {
  applyCut,
  assignRoles,
  assignRolesChaos,
  createInitialRoomState,
  distributeCards,
  everyoneReadyToRestart,
  gatherAndShuffleRemainingCards,
  generateInitialDeck,
  resetRoomToLobby,
  sanitizeStateForPlayer,
} from '../gameEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextCardId = 0;

function card(type: CardType, overrides: Partial<Card> = {}): Card {
  return {id: `card-${nextCardId++}`, type, isRevealed: false, ...overrides};
}

function player(id: string, cards: Card[] = [], overrides: Partial<Player> = {}): Player {
  return {id, name: `Joueur ${id}`, cards, isHost: id === 'A', connected: true, ...overrides};
}

/** Ongoing 4-player game, 5 cards each, clippers held by A. */
function playingRoom(): GameState {
  const room = createInitialRoomState('TEST42');
  room.status = 'PLAYING';
  room.phase = 'PLAYING';
  room.currentRound = 1;
  room.totalDefusesNeeded = 4;
  room.playerWithClippers = 'A';
  room.players = ['A', 'B', 'C', 'D'].map(id =>
	  player(id, [card('SAFE'), card('SAFE'), card('SAFE'), card('SAFE'), card('SAFE')]),
  );
  return room;
}

// ---------------------------------------------------------------------------
// Role and card distribution
// ---------------------------------------------------------------------------

describe('assignRoles', () => {
  it('donne un rôle du pool officiel à chaque joueur', () => {
	const players = ['A', 'B', 'C', 'D', 'E'].map(id => player(id));
	assignRoles(players);
	const config = GAME_CONFIG[5];
	players.forEach(p => {
	  expect(config.roles).toContain(p.role);
	});
  });

  it('remplace un Moriarty par le Brouilleur quand la loupe est active à 5+ joueurs', () => {
	// Distribution is random: check the invariant over several draws.
	for (let i = 0; i < 50; i++) {
	  const players = ['A', 'B', 'C', 'D', 'E'].map(id => player(id));
	  assignRoles(players, true);
	  const brouilleurs = players.filter(p => p.role === 'BROUILLEUR').length;
	  expect(brouilleurs).toBeLessThanOrEqual(1);
	}
  });

  it("n'introduit jamais de Brouilleur à 4 joueurs (loupe indisponible)", () => {
	for (let i = 0; i < 50; i++) {
	  const players = ['A', 'B', 'C', 'D'].map(id => player(id));
	  assignRoles(players, true);
	  expect(players.some(p => p.role === 'BROUILLEUR')).toBe(false);
	}
  });

  it('rejette un nombre de joueurs hors bornes', () => {
	expect(() => assignRoles([player('A')])).toThrow();
  });
});

describe('assignRolesChaos', () => {
  it('donne toujours un camp à chaque joueur', () => {
	for (let i = 0; i < 100; i++) {
	  const players = ['A', 'B', 'C', 'D', 'E'].map(id => player(id));
	  assignRolesChaos(players);
	  players.forEach(p => {
		expect(['SHERLOCK', 'MORIARTY']).toContain(p.role);
	  });
	}
  });

  it('promeut au plus un Brouilleur quand la loupe est active', () => {
	for (let i = 0; i < 100; i++) {
	  const players = ['A', 'B', 'C', 'D', 'E'].map(id => player(id));
	  assignRolesChaos(players, true);
	  expect(players.filter(p => p.role === 'BROUILLEUR').length).toBeLessThanOrEqual(1);
	}
  });
});

describe('generateInitialDeck / distributeCards', () => {
  it('compose le paquet exactement selon la configuration', () => {
	const deck = generateInitialDeck(6);
	const byType = (type: CardType) => deck.filter(c => c.type === type).length;
	expect(byType('SAFE')).toBe(GAME_CONFIG[6].safe);
	expect(byType('DEFUSE')).toBe(GAME_CONFIG[6].defuse);
	expect(byType('BOMB')).toBe(1);
	expect(byType('LOUPE')).toBe(0);
  });

  it('remplace un câble Safe par la Loupe quand elle est activée', () => {
	const deck = generateInitialDeck(6, true);
	expect(deck.filter(c => c.type === 'LOUPE').length).toBe(1);
	expect(deck.filter(c => c.type === 'SAFE').length).toBe(GAME_CONFIG[6].safe - 1);
	expect(deck.length).toBe(GAME_CONFIG[6].safe + GAME_CONFIG[6].defuse + 1);
  });

  it('distribue le même nombre de cartes à chaque joueur, sans perte', () => {
	const players = ['A', 'B', 'C', 'D'].map(id => player(id));
	const deck = generateInitialDeck(4);
	distributeCards(deck, players);
	players.forEach(p => expect(p.cards.length).toBe(deck.length / 4));
	const distributed = players.flatMap(p => p.cards.map(c => c.id)).sort();
	expect(distributed).toEqual(deck.map(c => c.id).sort());
  });

  it('le paquet est toujours divisible par le nombre de joueurs (avec et sans loupe)', () => {
	(Object.keys(GAME_CONFIG).map(Number) as Array<keyof typeof GAME_CONFIG>).forEach(count => {
	  expect(generateInitialDeck(count).length % count).toBe(0);
	  expect(generateInitialDeck(count, true).length % count).toBe(0);
	});
  });
});

describe('gatherAndShuffleRemainingCards', () => {
  it('écarte les cartes révélées et remet les cartes publiques face cachée', () => {
	const players = [
	  player('A', [card('SAFE', {isRevealed: true}), card('DEFUSE', {isPublic: true})]),
	  player('B', [card('BOMB')]),
	];
	const remaining = gatherAndShuffleRemainingCards(players);
	expect(remaining.length).toBe(2);
	expect(remaining.every(c => !c.isRevealed && !c.isPublic)).toBe(true);
	players.forEach(p => expect(p.cards).toEqual([]));
  });
});

// ---------------------------------------------------------------------------
// applyCut: cutting rules
// ---------------------------------------------------------------------------

describe('applyCut', () => {
  it("refuse la coupe si le joueur n'a pas la pince", () => {
	const room = playingRoom();
	const target = room.players[2].cards[0];
	expect(applyCut(room, 'B', 'C', target.id)).toBeNull();
  });

  it('refuse de couper ses propres cartes', () => {
	const room = playingRoom();
	const own = room.players[0].cards[0];
	expect(applyCut(room, 'A', 'A', own.id)).toBeNull();
  });

  it('refuse une carte déjà révélée ou inconnue', () => {
	const room = playingRoom();
	const target = room.players[1].cards[0];
	target.isRevealed = true;
	expect(applyCut(room, 'A', 'B', target.id)).toBeNull();
	expect(applyCut(room, 'A', 'B', 'id-inexistant')).toBeNull();
  });

  it('révèle la carte et transmet la pince à la cible', () => {
	const room = playingRoom();
	const target = room.players[1].cards[0];

	const outcome = applyCut(room, 'A', 'B', target.id);

	expect(outcome).not.toBeNull();
	expect(outcome!.finished).toBe(false);
	expect(outcome!.card.isRevealed).toBe(true);
	expect(room.playerWithClippers).toBe('B');
	expect(room.cardsRevealedThisRound).toBe(1);
	expect(room.revealedCards).toContain(outcome!.card);
	expect(room.players[1].cards).not.toContain(outcome!.card);
  });

  it('fait gagner Moriarty quand la bombe est coupée', () => {
	const room = playingRoom();
	const bomb = card('BOMB');
	room.players[1].cards[0] = bomb;

	const outcome = applyCut(room, 'A', 'B', bomb.id);

	expect(outcome!.finished).toBe(true);
	expect(room.status).toBe('FINISHED');
	expect(room.winner).toBe('MORIARTY');
  });

  it('fait gagner Sherlock quand le dernier désamorçage est trouvé', () => {
	const room = playingRoom();
	room.totalDefusesFound = room.totalDefusesNeeded - 1;
	const defuse = card('DEFUSE');
	room.players[1].cards[0] = defuse;

	const outcome = applyCut(room, 'A', 'B', defuse.id);

	expect(outcome!.finished).toBe(true);
	expect(room.status).toBe('FINISHED');
	expect(room.winner).toBe('SHERLOCK');
  });

  it("donne la loupe à l'équipe quand la carte Loupe est coupée", () => {
	const room = playingRoom();
	const loupe = card('LOUPE');
	room.players[1].cards[0] = loupe;

	applyCut(room, 'A', 'B', loupe.id);

	expect(room.teamHasLoupe).toBe(true);
  });

  it('termine la manche après une coupe par joueur, et redistribue', () => {
	const room = playingRoom();

	// A→B, B→C, C→D, D→A: 4 cuts = end of round with 4 players.
	const turns: Array<[string, string]> = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']];
	turns.forEach(([source, target]) => {
	  const targetPlayer = room.players.find(p => p.id === target)!;
	  const hidden = targetPlayer.cards.find(c => !c.isRevealed)!;
	  expect(applyCut(room, source, target, hidden.id)).not.toBeNull();
	});

	expect(room.currentRound).toBe(2);
	expect(room.cardsRevealedThisRound).toBe(0);
	expect(room.phase).toBe('CARD_REVEAL');
	// 20 cards - 4 revealed = 16, i.e. 4 per player.
	room.players.forEach(p => expect(p.cards.length).toBe(4));
  });

  it(`fait gagner Moriarty si la manche ${MAX_ROUNDS} se termine sans désamorçage complet`, () => {
	const room = playingRoom();
	room.currentRound = MAX_ROUNDS;
	// Last round: 2 cards per player (20 - 3×4 = 8).
	room.players.forEach(p => {
	  p.cards = [card('SAFE'), card('SAFE')];
	});

	const turns: Array<[string, string]> = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']];
	turns.forEach(([source, target]) => {
	  const targetPlayer = room.players.find(p => p.id === target)!;
	  const hidden = targetPlayer.cards.find(c => !c.isRevealed)!;
	  applyCut(room, source, target, hidden.id);
	});

	expect(room.status).toBe('FINISHED');
	expect(room.winner).toBe('MORIARTY');
  });
});

// ---------------------------------------------------------------------------
// sanitizeStateForPlayer : aucune fuite d'information
// ---------------------------------------------------------------------------

describe('sanitizeStateForPlayer', () => {
  function roomWithSecrets(): GameState {
	const room = playingRoom();
	room.players[0].role = 'SHERLOCK';
	room.players[1].role = 'MORIARTY';
	room.players[1].cards = [card('BOMB'), card('DEFUSE', {isPublic: true}), card('SAFE', {isRevealed: true})];
	return room;
  }

  it("masque les rôles et le type des cartes cachées des autres joueurs", () => {
	const sanitized = sanitizeStateForPlayer(roomWithSecrets(), 'A');
	const other = sanitized.players.find(p => p.id === 'B')!;

	expect(other.role).toBeUndefined();
	// The hidden bomb must be anonymized as SAFE.
	const hidden = other.cards.filter(c => !c.isRevealed && !c.isPublic);
	expect(hidden.every(c => c.type === 'SAFE')).toBe(true);
  });

  it('laisse visibles les cartes révélées ou rendues publiques par la loupe', () => {
	const sanitized = sanitizeStateForPlayer(roomWithSecrets(), 'A');
	const other = sanitized.players.find(p => p.id === 'B')!;

	expect(other.cards.find(c => c.isPublic)!.type).toBe('DEFUSE');
	expect(other.cards.find(c => c.isRevealed)!.type).toBe('SAFE');
  });

  it('fournit au joueur ses propres cartes via secretCards', () => {
	const room = roomWithSecrets();
	const sanitized = sanitizeStateForPlayer(room, 'B');
	const me = sanitized.players.find(p => p.id === 'B')!;

	expect(me.secretCards).toContain('BOMB');
	expect(me.role).toBe('MORIARTY');
  });

  it('révèle les rôles de tout le monde une fois la partie terminée', () => {
	const room = roomWithSecrets();
	room.status = 'FINISHED';
	const sanitized = sanitizeStateForPlayer(room, 'A');
	expect(sanitized.players.find(p => p.id === 'B')!.role).toBe('MORIARTY');
  });

  it("ne mute jamais l'état d'origine", () => {
	const room = roomWithSecrets();
	const before = JSON.stringify(room);
	sanitizeStateForPlayer(room, 'A');
	expect(JSON.stringify(room)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Cycle de vie de la room
// ---------------------------------------------------------------------------

describe('everyoneReadyToRestart', () => {
  it('attend que chaque joueur connecté ait cliqué « Rejouer »', () => {
	const room = playingRoom();
	room.restartReady = ['A', 'B'];
	expect(everyoneReadyToRestart(room)).toBe(false);
  });

  it('ignore les joueurs déconnectés', () => {
	const room = playingRoom();
	room.players[2].connected = false;
	room.players[3].connected = false;
	room.restartReady = ['A', 'B'];
	expect(everyoneReadyToRestart(room)).toBe(true);
  });

  it('est faux pour une room vide', () => {
	const room = createInitialRoomState('EMPTY1');
	expect(everyoneReadyToRestart(room)).toBe(false);
  });
});

describe('resetRoomToLobby', () => {
  it('repart sur un état de lobby vierge en conservant les joueurs', () => {
	const room = playingRoom();
	room.players[0].role = 'SHERLOCK';
	room.winner = 'MORIARTY';
	room.status = 'FINISHED';
	room.stats = undefined;

	resetRoomToLobby(room);

	expect(room.status).toBe('LOBBY');
	expect(room.phase).toBe('NOT_STARTED');
	expect(room.currentRound).toBe(1);
	expect(room.revealedCards).toEqual([]);
	expect(room.players.length).toBe(4);
	room.players.forEach(p => {
	  expect(p.cards).toEqual([]);
	  expect(p.role).toBeUndefined();
	});
  });
});
