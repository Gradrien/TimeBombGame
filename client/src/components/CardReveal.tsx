import Image from 'next/image';
import {getCardImage, ASSETS} from '@/utils/assets';
import type {CardRevealProps} from "@/types/types";

export function CardReveal({cards, flippedIndices, isShuffling}: CardRevealProps) {
  return (
	  <div
		  className={`flex flex-wrap justify-center gap-3 sm:gap-6 relative w-full max-w-4xl px-4 transition-all duration-700 ease-in-out ${isShuffling ? 'rotate-180' : 'rotate-0'}`}>
		{cards.map((type: string, i: number) => (
			<div
				key={i}
				className="relative w-20 h-32 sm:w-32 sm:h-48 landscape:w-24 landscape:h-36 transition-all duration-700 ease-in-out"
				style={{
				  transformStyle: 'preserve-3d',
				  // Le transform exact que tu as demandé :
				  transform: `${isShuffling ? 'rotateZ(-180deg)' : 'rotateZ(0deg)'} ${flippedIndices.includes(i) ? 'rotateY(180deg)' : 'rotateY(0deg)'}`
				}}
			>
			  <div className="absolute inset-0" style={{backfaceVisibility: 'hidden'}}>
				<Image src={ASSETS.CARD_BACK} alt="Câble" fill className="object-contain drop-shadow-lg"/>
			  </div>
			  <div className="absolute inset-0" style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
				<Image src={getCardImage(type)} alt="Reveal" fill className="object-contain drop-shadow-xl"/>
			  </div>
			</div>
		))}
	  </div>
  );
}
