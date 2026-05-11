// client/src/components/PhaseView.tsx
import {useState, useEffect} from 'react';
import {useGameStore} from '@/store/useGameStore';
import {RoleReveal} from './RoleReveal';
import {CardReveal} from './CardReveal';
import SteampunkButton from "@/components/Button";

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
		setShuffledCards([...me.secretCards].sort(() => Math.random() - 0.5));
	  }
	}
  }, [gameState?.phase, gameState?.currentRound, playerId]);

  if (!gameState || !socket) return null;

  const me = gameState.players.find(p => p.id === playerId);
  if (!me) return null;

  const isReady = gameState.readyPlayers.includes(playerId) || isConfirming;
  const isFlipping = gameState.phase === 'CARD_REVEAL' && revealed && flippedIndices.length < shuffledCards.length;

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
	  setFlippedIndices([]); // 1. Retourne face cachée

	  setTimeout(() => {
		setIsShuffling(true); // 2. Lance la rotation orbitale

		setTimeout(() => {
		  socket.emit('confirmCards', gameState.roomId); // 3. Valide côté serveur
		}, 800);
	  }, 400);
	}
  };

  const bgClass = gameState.phase === 'ROLE_REVEAL' ? 'bg-black/70' : 'bg-black/40';

  return (
	  <div
		  className={`flex flex-col h-dvh w-full text-white overflow-hidden select-none backdrop-blur-[2px] ${bgClass}`}>

		{/* CONTENU CENTRAL EXTENSIBLE (Aucun overflow-hidden ici !) */}
		<div className="flex-1 w-full flex items-center justify-center z-10">
		  {gameState.phase === 'ROLE_REVEAL' ? (
			  <RoleReveal
				  role={me.role || ''}
				  revealed={revealed}
				  isReady={isReady}
				  isConfirming={isConfirming}
				  onReveal={() => setRevealed(true)}
			  />
		  ) : (
			  <CardReveal
				  cards={shuffledCards}
				  flippedIndices={flippedIndices}
				  isShuffling={isShuffling}
			  />
		  )}
		</div>

		{/* FOOTER FIXE AVEC PADDING MOBILE FIRST */}
		<div
			className="shrink-0 flex flex-col items-center justify-center gap-3 sm:gap-4 w-full pb-6 sm:pb-10 landscape:pb-4 pt-2 z-20">
		  {!revealed && gameState.phase === 'CARD_REVEAL' && !isReady ? (
			  <SteampunkButton
				  onClick={revealCardsOneByOne}
				  variant="neutral"
				  size="lg"
			  >
				VÉRIFIER MES CÂBLES
			  </SteampunkButton>
		  ) : revealed ? (
			  <SteampunkButton
				  disabled={isReady || isConfirming || isFlipping}
				  onClick={handleConfirm}
				  variant={isConfirming ? 'neutral' : isFlipping ? 'neutral' : 'sherlock'}
				  size="lg"
			  >
				{isConfirming ? 'ATTENTE DES AUTRES...' : isFlipping ? 'RÉVÉLATION...' : "J'AI COMPRIS"}
			  </SteampunkButton>
		  ) : (
			  <div className="h-10 sm:h-14 landscape:h-8"/>
		  )}

		  {/* POINTS DE STATUT */}
		  <div className="flex gap-2 sm:gap-3 z-10 mt-1">
			{gameState.players.map(p => (
				<div key={p.id}
					 className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500 ${gameState.readyPlayers.includes(p.id) ? 'bg-amber-500 scale-125 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-900/30'}`}/>
			))}
		  </div>
		</div>

	  </div>
  );
}
