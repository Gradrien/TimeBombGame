import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import SteampunkButton from "@/components/Button";
import { getBadgeImage, ASSETS } from '@/utils/assets';
import Image from 'next/image';

export function ProfileView({ onBack }: { onBack: () => void }) {
  const { playerName, playerId, logout, socket, setPlayerName } = useGameStore();
  const [userData, setUserData] = useState<any>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
	if (socket && playerId) {
	  socket.emit('getUserProfile', playerId, (data: any) => setUserData(data));
	}
  }, [socket, playerId]);

  const handleUpdateName = () => {
	const trimmed = newName.trim();
	if (!trimmed || trimmed === playerName) {
	  setIsEditingName(false);
	  return;
	}

	setIsSaving(true);
	socket?.emit('updateUsername', { playerId, newName: trimmed }, (response: any) => {
	  setIsSaving(false);
	  if (response.success) {
		setPlayerName(trimmed);
		const saved = sessionStorage.getItem('timebomb_session');
		if (saved) {
		  const parsed = JSON.parse(saved);
		  parsed.username = trimmed;
		  sessionStorage.setItem('timebomb_session', JSON.stringify(parsed));
		}
		setIsEditingName(false);
	  }
	});
  };

  if (!userData) return (
	  <div className="flex h-screen items-center justify-center text-[#c9a56d] animate-pulse uppercase tracking-wide text-xs">
		Ouverture du dossier...
	  </div>
  );

  const gamesPlayed = userData.gamesPlayed || 0;
  const winRate = gamesPlayed > 0 ? Math.round((userData.gamesWon / gamesPlayed) * 100) : 0;
  const totalRoles = (userData.gamesAsSherlock || 0) + (userData.gamesAsMoriarty || 0);
  const sherlockRate = totalRoles > 0 ? Math.round((userData.gamesAsSherlock / totalRoles) * 100) : 0;
  const moriartyRate = totalRoles > 0 ? 100 - sherlockRate : 0;

  return (
	  <div className="w-full min-h-screen p-4 sm:p-8 md:p-12 overflow-y-auto custom-scrollbar text-white">

		{/* BOUTON RETOUR */}
		<div className="mb-8 max-w-350 mx-auto w-full">
		  <SteampunkButton variant="neutral" onClick={onBack}>
			Retour
		  </SteampunkButton>
		</div>

		<div className="max-w-350 mx-auto flex flex-col lg:flex-row items-start gap-10">

		  {/* --- BLOC GAUCHE : PROFIL & STATS --- */}
		  <div className="w-full lg:w-95 shrink-0 bg-[#1a1510]/40 backdrop-blur-md border border-[#c9a56d]/30 rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden">
			<div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />

			<div className="flex flex-col items-center gap-6 mb-10 text-center relative z-10">
			  {isEditingName ? (
				  <div className="w-full flex flex-col gap-4">
					<input
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						disabled={isSaving}
						className="w-full bg-black/40 border border-[#8a6842]/60 rounded-xl px-4 py-3 text-white text-center font-bold tracking-wide focus:outline-none focus:border-[#c9a56d] transition-all"
					/>
					<div className="flex gap-3">
					  <SteampunkButton variant="neutral" size="sm" onClick={handleUpdateName}>Valider</SteampunkButton>
					  <SteampunkButton variant="moriarty" size="sm" onClick={() => setIsEditingName(false)}>Annuler</SteampunkButton>
					</div>
				  </div>
			  ) : (
				  <>
					<h1 className="text-3xl sm:text-4xl font-bold tracking-wide break-all drop-shadow-md">
					  {playerName}
					</h1>
					<div className="flex  gap-3 w-full">
					  <SteampunkButton variant="neutral" size="sm" onClick={() => { setIsEditingName(true); setNewName(playerName); }}>
						Changer le nom
					  </SteampunkButton>
					  <SteampunkButton variant="moriarty" size="sm" onClick={logout}>
						Déconnexion
					  </SteampunkButton>
					</div>
				  </>
			  )}
			</div>

			<div className="grid grid-cols-2 gap-y-10 gap-x-4 relative z-10">
			  <StatBlock label="parties jouées" value={gamesPlayed} />
			  <StatBlock label="Victoires" value={`${winRate}%`} />
			  <StatBlock label="Sherlock" value={`${sherlockRate}%`} color="text-[#60a5fa]" />
			  <StatBlock label="Moriarty" value={`${moriartyRate}%`} color="text-[#ef4444]" />
			</div>
		  </div>

		  {/* --- BLOC DROITE : BADGES --- */}
		  <div className="w-full flex-1 bg-[#1a1510]/40 backdrop-blur-md border border-[#c9a56d]/30 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
			<div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)" }} />

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-14 relative z-10">
			  {userData.formattedAchievements?.map((ach: any) => {

				// On définit si l'IMAGE doit être en couleur :
				// soit parce qu'elle est débloquée, soit parce qu'on est au palier 2 ou 3
				const isBadgeColored = ach.isUnlocked || (ach.tier && ach.tier > 1);

				return (
					<div key={ach.id} className="flex flex-col items-center w-full group">

					  {/* --- AFFICHAGE DU SPRITE --- */}
					  <div className="w-20 h-20 sm:w-24 sm:h-24 mb-5 shrink-0 relative flex items-center justify-center">
						<Image
							fill
							src={getBadgeImage(ach.id)}
							alt={ach.name}
							onError={(e) => { e.currentTarget.src = ASSETS.BADGE_PLACEHOLDER; }}
							className={`w-full h-full object-contain transition-all duration-500 
                      ${isBadgeColored
								? 'drop-shadow-[0_0_15px_rgba(201,165,109,0.5)] group-hover:scale-110 group-hover:drop-shadow-[0_0_25px_rgba(201,165,109,0.8)]'
								: 'grayscale opacity-50 brightness-50 drop-shadow-md'
							}
                    `}
						/>
					  </div>

					  <h3 className={`text-sm sm:text-base text-center uppercase tracking-wide font-bold mb-2 transition-colors duration-300 ${ach.isUnlocked ? 'text-[#f3e7d3]' : 'text-white/40'}`}>
						{ach.name}
					  </h3>

					  <p className="text-xs text-center text-white/50 leading-relaxed mb-4 px-2 italic">
						{ach.description}
					  </p>

					  <div className="w-full max-w-40 mt-auto">
						{!ach.isOneShot && (
							<div className="flex flex-col gap-2">
							  <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-[#8a6842]/30">
								<div
									className={`h-full transition-all duration-1000 ease-out ${ach.isUnlocked ? 'bg-[#c9a56d]' : 'bg-linear-to-r from-[#5a4b3c] to-[#8a6842]'}`}
									style={{ width: `${ach.isUnlocked ? 100 : ach.percent}%` }}
								/>
							  </div>
							  <div className={`text-xs text-center uppercase tracking-wide font-bold ${ach.isUnlocked ? 'text-[#c9a56d]' : 'text-white/40'}`}>
								{ach.isUnlocked ? 'Accompli' : `${ach.progress} / ${ach.target}`}
							  </div>
							</div>
						)}
					  </div>
					</div>
				)})}
			</div>
		  </div>

		</div>
	  </div>
  );
}

function StatBlock({ label, value, color = "text-[#f3e7d3]" }: { label: string, value: string | number, color?: string }) {
  return (
	  <div className="flex flex-col text-center sm:text-left">
		<div className={`text-4xl font-bold mb-1 ${color} drop-shadow-md`}>{value}</div>
		<div className="text-xs text-white/40 uppercase tracking-wide font-bold">{label}</div>
	  </div>
  );
}
