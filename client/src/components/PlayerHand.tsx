// client/src/components/PlayerHand.tsx
import { Player } from '@timebomb/shared';
import { Card } from './Card';

interface PlayerHandProps {
  player: Player;
  isMe: boolean;
  hasClippers: boolean;
  iHaveClippers: boolean; // Pour savoir si JE peux cliquer sur SES cartes
  onCutCard: (targetPlayerId: string, cardId: string) => void;
}

export function PlayerHand({ player, isMe, hasClippers, iHaveClippers, onCutCard }: PlayerHandProps) {
  return (
	  <div className={`p-4 rounded-xl border-2 flex flex-col items-center ${isMe ? 'bg-zinc-800 border-amber-600/50' : 'bg-zinc-800/50 border-zinc-700'}`}>

		{/* En-tête du joueur */}
		<div className="flex items-center gap-2 mb-4">
		  <h3 className="font-bold text-lg">{player.name} {isMe && '(Toi)'}</h3>
		  {hasClippers && <span className="text-2xl animate-bounce" title="A la pince coupante !">✂️</span>}
		</div>

		{/* Les Cartes */}
		<div className="flex flex-wrap justify-center gap-2">
		  {player.cards.map((card) => (
			  <Card
				  key={card.id}
				  card={card}
				  // On peut interagir seulement si on a la pince, que ce n'est pas nous-même, et que la carte est cachée
				  isInteractable={iHaveClippers && !isMe}
				  onCut={(cardId) => onCutCard(player.id, cardId)}
			  />
		  ))}
		</div>

	  </div>
  );
}
