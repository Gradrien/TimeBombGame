import {useState, useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';
import {RoleReveal} from '@/components/RoleReveal';
import {CardReveal} from '@/components/CardReveal';
import SteampunkButton from "@/components/Button";
import { shuffleArray } from '@timebomb/shared';

export function PhaseView() {
  const {gameState, socket, playerId} = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [shuffledCards, setShuffledCards] = useState<string[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
	setRevealed(false);
	setFlippedIndices([]);
	setIsShuffling(false);
	setIsConfirming(false);

	if (gameState?.phase === 'CARD_REVEAL') {
	  const me = gameState.players.find(p => p.id === playerId);
	  if (me?.secretCards) {
		setShuffledCards(shuffleArray([...me.secretCards]));
	  }
	}
  }, [gameState?.phase, gameState?.currentRound, playerId]);

  if (!gameState || !socket) return null;

  const me = gameState.players.find(p => p.id === playerId);
  if (!me) return null;

  const isReady = gameState.readyPlayers.includes(playerId) || isConfirming;
  const isFlipping = gameState.phase === 'CARD_REVEAL' && revealed && flippedIndices.length < shuffledCards.length;

  const myPlayerIndex = gameState.players.findIndex(p => p.id === playerId);

  let mySkinIndex = 1;
  if (me.role === 'SHERLOCK') {
	mySkinIndex = (myPlayerIndex % 5) + 1; // Boucle entre 1 et 5
  } else if (me.role === 'MORIARTY') {
	mySkinIndex = (myPlayerIndex % 3) + 1; // Boucle entre 1 et 3
  }

  const revealCardsOneByOne = () => {
	if (!shuffledCards.length || isShuffling || isReady) return;
	setRevealed(true);
	shuffledCards.forEach((_, i) => setTimeout(() => setFlippedIndices(prev => [...prev, i]), i * 150));
  };

  const handleConfirm = () => {
	setIsConfirming(true);
	if (gameState.phase === 'ROLE_REVEAL') {
	  setRevealed(false);
	  setTimeout(() => socket.emit('confirmRole', gameState.roomId), 500);
	} else {
	  setFlippedIndices([]);

	  setTimeout(() => {
		setIsShuffling(true);

		setTimeout(() => {
		  socket.emit('confirmCards', gameState.roomId);
		}, 800);
	  }, 400);
	}
  };

  const bgClass = gameState.phase === 'ROLE_REVEAL' ? 'bg-black/70' : 'bg-black/40';

  return (
	  <div
		  className={`flex flex-col h-dvh w-full text-white overflow-hidden select-none backdrop-blur-[2px] ${bgClass}`}>

		{/* CONTENU CENTRAL */}
		<div className="flex-1 w-full flex items-center justify-center z-10">
		  {gameState.phase === 'ROLE_REVEAL' ? (
			  <RoleReveal
				  role={me.role || 'SHERLOCK'}
				  revealed={revealed}
				  isConfirming={isConfirming}
				  skinIndex={mySkinIndex}
				  onReveal={() => setRevealed(true)}
				  onConfirm={handleConfirm}
			  />
		  ) : (
			  <CardReveal
				  cards={shuffledCards}
				  flippedIndices={flippedIndices}
				  isShuffling={isShuffling}
			  />
		  )}
		</div>

		{/* FOOTER */}
		<div
			className="shrink-0 flex flex-col items-center justify-center gap-3 sm:gap-4 w-full pb-6 sm:pb-10 landscape:pb-4 pt-2 z-20 pointer-events-none">

		  {/* LOGIQUE DES BOUTONS SÉPARÉE PAR PHASE */}
		  {gameState.phase === 'ROLE_REVEAL' ? (
			  // En phase de rôle, le bouton est géré par RoleReveal. On laisse juste l'espace vide pour les points.
			  <div className="h-10 sm:h-14 landscape:h-8"/>
		  ) : !revealed && gameState.phase === 'CARD_REVEAL' && !isReady ? (
			  <div className="pointer-events-auto">
				<SteampunkButton
					onClick={revealCardsOneByOne}
					variant="neutral"
					size="lg"
				>
				  VÉRIFIER MES CÂBLES
				</SteampunkButton>
			  </div>
		  ) : revealed ? (
			  <div className="pointer-events-auto">
				<SteampunkButton
					disabled={isReady || isConfirming || isFlipping}
					onClick={handleConfirm}
					variant={isConfirming ? 'neutral' : isFlipping ? 'neutral' : 'sherlock'}
					size="lg"
				>
				  {isConfirming ? 'ATTENTE DES AUTRES...' : isFlipping ? 'RÉVÉLATION...' : "J'AI COMPRIS"}
				</SteampunkButton>
			  </div>
		  ) : (
			  <div className="h-10 sm:h-14 landscape:h-8"/>
		  )}

		  {/* POINTS DE STATUT */}
		  <div className="flex gap-2 sm:gap-3 z-10 mt-1 pointer-events-auto">
			{gameState.players.map(p => (
				<div key={p.id}
					 className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500 ${gameState.readyPlayers.includes(p.id) ? 'bg-amber-500 scale-125 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-900/30'}`}/>
			))}
		  </div>
		</div>

	  </div>
  );
}
