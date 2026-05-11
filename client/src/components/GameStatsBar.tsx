// client/src/components/GameStatsBar.tsx
import Image from 'next/image';
import {Card as CardType} from '@timebomb/shared';
import {getCardImage, getRoleImage} from '@/utils/assets';
import {useGameStore} from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import {Search} from "lucide-react";

interface Props {
  currentRound: number;
  totalPlayers: number;
  defusesFound: number;
  defusesNeeded: number;
  revealedCards: CardType[];
}

export function GameStatsBar({
							   currentRound,
							   totalPlayers,
							   defusesFound,
							   defusesNeeded,
							   revealedCards
							 }: Props) {
  const {gameState, isScannerActive, setScannerActive} = useGameStore();

  // Logique de distribution des rôles (Standard Time Bomb)
  const getRoleDistribution = () => {
	switch (totalPlayers) {
	  case 4:
		return {blue: "2-3", red: "1-2"}; // Variante avec carte écartée
	  case 5:
		return {blue: "3", red: "2"};
	  case 6:
		return {blue: "4", red: "2"};
	  case 7:
		return {blue: "4-5", red: "2-3"}; // Variante avec carte écartée
	  case 8:
		return {blue: "5", red: "3"};
	  default:
		return {blue: "?", red: "?"};
	}
  };

  const dist = getRoleDistribution();
  const canUseScanner = gameState?.teamHasLoupe && currentRound < 4;

  return (
	  <div
		  className="flex items-center justify-between px-6 py-2 bg-linear-to-b from-black/60 to-transparent border-b border-amber-900/20 shrink-0 h-24">

		{/* HUD Stats & Roles */}
		<div className="flex flex-col gap-1">
		  <div className="flex items-center gap-3">
			<div
				className="flex items-center gap-2 bg-blue-900/40 px-3 py-1 rounded border border-blue-500/40 shadow-inner">
			  <div className="relative w-6 h-8"><Image src={getRoleImage('SHERLOCK')} alt="B" fill
													   className="object-contain"/></div>
			  <span className="text-lg font-black text-blue-400">{dist.blue}</span>
			</div>
			<div
				className="flex items-center gap-2 bg-red-900/40 px-3 py-1 rounded border border-red-500/40 shadow-inner">
			  <div className="relative w-6 h-8"><Image src={getRoleImage('MORIARTY')} alt="R" fill
													   className="object-contain"/></div>
			  <span className="text-lg font-black text-red-400">{dist.red}</span>
			</div>
		  </div>
		  <p className="text-[10px] text-amber-600 uppercase tracking-[0.2em] font-black">MANCHE {currentRound}</p>
		</div>

		{/* CENTRE : BOUTON LOUPE STEAMPUNK */}
		{canUseScanner && (
			<SteampunkButton variant={isScannerActive ? "sherlock" : "neutral"} size="md"
							 onClick={() => setScannerActive(!isScannerActive)} icon={<Search/>}
			>
			  {isScannerActive ? 'SCAN EN COURS...' : 'UTILISER LA LOUPE'}
			</SteampunkButton>
		)}

		{/* Cimetière */}
		<div className="flex flex-col items-end gap-1">
		  <p className="text-[10px] font-black text-green-500 tracking-widest uppercase">DÉSARMÉS: {defusesFound}/{defusesNeeded}</p>
		  <div className="flex overflow-x-auto pl-6 py-1 items-center no-scrollbar max-w-30">
			{revealedCards?.map((card: CardType, i: number) => (
				<div key={i} className="relative w-8 h-12 shrink-0 -ml-5 first:ml-0 drop-shadow-xl" style={{zIndex: i}}>
				  <Image src={getCardImage(card.type)} alt="card" fill className="object-contain"/>
				</div>
			))}
		  </div>
		</div>
	  </div>
  );
}
