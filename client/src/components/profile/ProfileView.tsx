import {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {ArrowLeft, Pencil, LogOut, Check, X} from 'lucide-react';
import type {UserProfile} from '@timebomb/shared';
import {useGameStore} from '@/store/useGameStore';
import {updateSession} from '@/utils/session';
import {Button, COLORS, Panel, Divider, SectionTitle} from '@/components/ui';
import {IconActionButton} from './IconActionButton';
import {StatFigure} from './StatFigure';
import {CampWinRateRow} from './CampWinRateRow';
import {RadialProgress} from './RadialProgress';
import {AchievementCard} from './AchievementCard';
import type {ProfileViewProps} from './types';

export function ProfileView({onBack}: ProfileViewProps) {
  const {playerName, playerId, logout, socket, setPlayerName} = useGameStore();
  const [userData, setUserData] = useState<UserProfile | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    // The server identifies the player through its socket: no id to send.
    if (socket && playerId) {
      socket.emit('getUserProfile', (data) => setUserData(data));
    }
  }, [socket, playerId]);

  const handleUpdateName = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === playerName) {
      setIsEditingName(false);
      return;
    }

    setIsSaving(true);
    setRenameError(null);
    socket?.emit('updateUsername', trimmed, (response) => {
      setIsSaving(false);
      if (response.success) {
        setPlayerName(trimmed);
        updateSession({username: trimmed});
        setIsEditingName(false);
      } else {
        setRenameError(response.error ?? 'Le changement de pseudo a échoué.');
      }
    });
  };

  if (!userData) return (
      <div
          className="flex h-screen items-center justify-center text-gold animate-pulse uppercase tracking-wide text-xs">
        Ouverture du dossier...
      </div>
  );

  const {gamesPlayed, gamesWon, gamesAsSherlock: sherlockGames, gamesAsMoriarty: moriartyGames} = userData;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const totalRoles = sherlockGames + moriartyGames;
  const sherlockShare = totalRoles > 0 ? Math.round((sherlockGames / totalRoles) * 100) : 50;
  const moriartyShare = totalRoles > 0 ? 100 - sherlockShare : 50;

  const {winsSherlock: sherlockWins, winsMoriarty: moriartyWins} = userData;
  const sherlockWinRate = sherlockGames > 0 ? Math.round((sherlockWins / sherlockGames) * 100) : 0;
  const moriartyWinRate = moriartyGames > 0 ? Math.round((moriartyWins / moriartyGames) * 100) : 0;

  const achievements = userData.formattedAchievements;
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completion = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
      <div className="w-full text-white">
        <div className="mx-auto w-full max-w-6xl px-2 py-3 sm:px-4 sm:py-4 flex flex-col gap-4">

          <button
              onClick={onBack}
              className="group flex items-center gap-2 self-start text-gold hover:text-cream transition-colors font-serif uppercase tracking-widest text-xs"
          >
            <span
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-black/30 group-hover:border-gold group-hover:bg-black/50 transition-all">
              <ArrowLeft size={15}/>
            </span>
            Retour
          </button>

          {/* Header: identity + global and per-camp performance (single surface) */}
          <Panel
              as="section"
              motionProps={{initial: {opacity: 0, y: 12}, animate: {opacity: 1, y: 0}, transition: {duration: 0.4}}}
          >
            <div
                className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:gap-8 md:text-left">

              {/* Identity */}
              <div className="flex min-w-0 flex-1 flex-col items-center gap-3 md:items-start">
                {isEditingName ? (
                    <div className="flex w-full max-w-sm flex-col gap-3">
                      <input
                          type="text"
                          value={newName}
                          autoFocus
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                          disabled={isSaving}
                          className="w-full rounded-xl border border-bronze/60 bg-black/50 px-4 py-3 text-center font-bold tracking-wide text-white transition-all focus:border-gold focus:outline-none md:text-left"
                      />
                      {renameError && (
                          <p className="text-center text-xs font-bold uppercase tracking-wide text-moriarty md:text-left">
                            {renameError}
                          </p>
                      )}
                      <div className="flex justify-center gap-3 md:justify-start">
                        <Button variant="sherlock" size="sm" icon={<Check/>} onClick={handleUpdateName}>
                          {isSaving ? '...' : 'Valider'}
                        </Button>
                        <Button variant="moriarty" size="sm" icon={<X/>}
                                onClick={() => {
                                  setIsEditingName(false);
                                  setRenameError(null);
                                }}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                ) : (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/70">Dossier
                        d&apos;enquêteur</p>
                      <h1 className="max-w-full break-words font-serif text-3xl font-bold leading-tight tracking-wide drop-shadow-md sm:text-4xl">
                        {playerName}
                      </h1>
                      <div className="flex justify-center gap-2.5 md:justify-start">
                        <IconActionButton icon={<Pencil size={15}/>} label="Renommer"
                                          onClick={() => {
                                            setIsEditingName(true);
                                            setNewName(playerName);
                                          }}/>
                        <IconActionButton icon={<LogOut size={15}/>} label="Déconnexion" danger onClick={logout}/>
                      </div>
                    </>
                )}
              </div>

              {/* Global performance */}
              {!isEditingName && (
                  <div className="flex items-center gap-5 sm:gap-6">
                    <RadialProgress value={winRate} color={COLORS.gold}/>
                    <div className="flex items-stretch gap-4 sm:gap-6">
                      <StatFigure value={gamesPlayed} label="Parties" accent={COLORS.cream}/>
                      <div className="w-px self-stretch bg-gold/15"/>
                      <StatFigure value={gamesWon} label="Victoires" accent={COLORS.goldBright}/>
                    </div>
                  </div>
              )}
            </div>

            <Divider/>

            {/* Per camp — full width, two columns on wide screens */}
            <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">

              {/* Role distribution */}
              <div className="flex flex-col">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Répartition des rôles</p>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span className="text-sherlock">Sherlock</span>
                  <span className="text-moriarty">Moriarty</span>
                </div>
                <div className="relative flex h-6 w-full overflow-hidden rounded-full border border-black/40 shadow-inner">
                  <motion.div
                      initial={{width: 0}}
                      animate={{width: `${sherlockShare}%`}}
                      transition={{duration: 0.8, ease: 'easeOut'}}
                      className="h-full bg-gradient-to-r from-sherlock-deep to-blue-500"
                  />
                  <div className="h-full flex-1 bg-gradient-to-r from-moriarty-deep to-moriarty"/>
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] font-bold text-white/45">
                  <span>{sherlockShare}% · {sherlockGames} parties</span>
                  <span>{moriartyGames} parties · {moriartyShare}%</span>
                </div>
              </div>

              {/* Win rate per camp */}
              <div className="flex flex-col">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Taux de victoire par
                  camp</p>
                <div className="flex flex-1 flex-col justify-center gap-4">
                  <CampWinRateRow label="Sherlock" rate={sherlockWinRate} wins={sherlockWins} games={sherlockGames}
                                  color={COLORS.sherlock}/>
                  <CampWinRateRow label="Moriarty" rate={moriartyWinRate} wins={moriartyWins} games={moriartyGames}
                                  color={COLORS.moriarty}/>
                </div>
              </div>
            </div>
          </Panel>

          {/* Achievements */}
          <Panel
              as="section"
              motionProps={{
                initial: {opacity: 0, y: 12}, animate: {opacity: 1, y: 0},
                transition: {duration: 0.4, delay: 0.12},
              }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <SectionTitle noMargin>Hauts faits</SectionTitle>
              <span
                  className="whitespace-nowrap rounded-full border border-gold/40 bg-black/40 px-3 py-1 text-xs font-bold text-gold">
                {unlockedCount} / {totalCount}
              </span>
            </div>
            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full border border-bronze/30 bg-black/50">
              <motion.div
                  initial={{width: 0}}
                  animate={{width: `${completion}%`}}
                  transition={{duration: 1, ease: 'easeOut'}}
                  className="h-full bg-gradient-to-r from-bronze to-gold-bright"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {achievements.map((ach) => (
                  <AchievementCard key={ach.id} ach={ach}/>
              ))}
            </div>
          </Panel>
        </div>
      </div>
  );
}
