// client/src/components/Card.tsx
import { Card as CardType } from '@timebomb/shared';
import Image from 'next/image'; // <-- L'import indispensable !

interface CardProps {
  card: CardType;
  isInteractable: boolean;
  onCut: (cardId: string) => void;
}

export function Card({ card, isInteractable, onCut }: CardProps) {
  // Détermination de l'image de la face selon le type (fallback sécurisé)
  const getFaceImage = (type: string) => {
	if (type === 'BOMB') return '/assets/card-bomb.png';
	if (type === 'DEFUSE') return '/assets/card-defuse.png';
	return '/assets/card-safe.png'; // Par défaut : câble sécurisé
  };

  return (
	  <button
		  onClick={() => onCut(card.id)}
		  disabled={!isInteractable || card.isRevealed}
		  className={`
        relative w-16 h-24 sm:w-24 sm:h-36 rounded-lg
        transition-all duration-300
        ${isInteractable && !card.isRevealed ? 'hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/20 cursor-pointer' : 'cursor-default'}
      `}
		  // On utilise du style en ligne pour s'assurer que la 3D passe sans plugin Tailwind
		  style={{ perspective: '1000px' }}
	  >
		<div
			className={`relative w-full h-full transition-transform duration-500 shadow-md rounded-lg overflow-hidden`}
			style={{
			  transformStyle: 'preserve-3d',
			  transform: card.isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
			}}
		>
		  {/* Dos de la carte (Câble non coupé) */}
		  <div
			  className="absolute inset-0 bg-zinc-800"
			  style={{ backfaceVisibility: 'hidden' }}
		  >
			<Image
				src="/assets/card-back.png"
				alt="Dos de carte"
				fill
				className="object-cover"
				sizes="(max-width: 768px) 64px, 96px"
			/>
		  </div>

		  {/* Face de la carte (Résultat) */}
		  <div
			  className="absolute inset-0 bg-zinc-700"
			  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
		  >
			<Image
				src={getFaceImage(card.type)}
				alt={`Carte ${card.type}`}
				fill
				className="object-cover"
				sizes="(max-width: 768px) 64px, 96px"
			/>
		  </div>
		</div>
	  </button>
  );
}
