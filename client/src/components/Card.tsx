// client/src/components/Card.tsx
import {Card as CardType} from '@timebomb/shared';
import Image from 'next/image';
import {getCardImage, ASSETS} from '@/utils/assets';

interface CardProps {
  card: CardType;
  isInteractable: boolean;
  forceFaceUp?: boolean;
  onAction: (cardId: string) => void;
}

export function Card({ card, isInteractable, onAction, forceFaceUp }: CardProps) {
  const isFlipped = card.isRevealed || card.isPublic || forceFaceUp;

  return (
	  <button
		  onClick={() => onAction(card.id)}
		  disabled={!isInteractable || card.isRevealed}
		  className={`
        relative w-16 h-24 sm:w-24 sm:h-36 rounded-lg overflow-hidden
        transition-all duration-300
        ${isInteractable ? 'hover:-translate-y-2 cursor-pointer' : 'cursor-default'}
      `}
		  style={{ perspective: '1000px' }}
	  >
		<div
			className="relative w-full h-full transition-transform duration-500 rounded-xl"
			style={{
			  transformStyle: 'preserve-3d',
			  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
			}}
		>
		  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
			<Image src={ASSETS.CARD_BACK} alt="Câble" fill className="object-contain" />
		  </div>
		  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
			<Image src={getCardImage(card.type)} alt={card.type} fill className="object-contain" />
		  </div>
		</div>
	  </button>
  );
}
