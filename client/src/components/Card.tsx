import Image from 'next/image';
import {getCardImage, ASSETS} from '@/utils/assets';
import type {CardProps} from "@/types/types";

export function Card({card, isInteractable, onAction, forceFaceUp}: CardProps) {
  const isFlipped = card.isRevealed || card.isPublic || forceFaceUp;

  return (
	  <button
		  onClick={() => onAction(card.id)}
		  disabled={!isInteractable || card.isRevealed}
		  className={`
        relative rounded-lg overflow-hidden transition-all duration-300 shrink-0
        w-24 h-36 
        sm:w-32 sm:h-48 
        sm:landscape:w-20 sm:landscape:h-28 
        lg:landscape:w-24 lg:landscape:h-36
        ${isInteractable ? 'hover:-translate-y-2 cursor-pointer shadow-lg' : 'cursor-default shadow-md'}
      `}
		  style={{perspective: '1000px'}}
	  >
		<div
			className="relative w-full h-full transition-transform duration-500 rounded-xl"
			style={{
			  transformStyle: 'preserve-3d',
			  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
			}}
		>
		  <div className="absolute inset-0" style={{backfaceVisibility: 'hidden'}}>
			<Image src={ASSETS.CARD_BACK} alt="Câble" fill className="object-contain"/>
		  </div>
		  <div className="absolute inset-0" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
			<Image src={getCardImage(card.type)} alt={card.type} fill className="object-contain"/>
		  </div>
		</div>
	  </button>
  );
}
