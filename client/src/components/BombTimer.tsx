import { useEffect, useState } from 'react';
import { VT323 } from 'next/font/google';

const digitalFont = VT323({ weight: '400', subsets: ['latin'] });

interface BombTimerProps {
  endTime: number | null;
  isPaused?: boolean;
}

export function BombTimer({ endTime, isPaused = false }: BombTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
	if (!endTime) {
	  setTimeLeft(0);
	  return;
	}

	const updateTimer = () => {
	  if (isPaused) {
		return;
	  }

	  const now = Date.now();
	  const diff = Math.max(0, Math.ceil((endTime - now) / 1000));
	  setTimeLeft(diff);
	};

	updateTimer();
	const interval = setInterval(updateTimer, 100);

	return () => clearInterval(interval);
  }, [endTime, isPaused]);

  if (!endTime || timeLeft === 0) return null;

  const seconds = timeLeft.toString().padStart(2, '0');
  const isDanger = timeLeft <= 5 && !isPaused;

  return (
	  <div
		  className={`flex items-center justify-center pointer-events-none shrink-0 ${digitalFont.className} ${isPaused ? 'opacity-60 transition-opacity duration-300' : ''}`}
	  >
		<div
			className={`
          px-3 py-0.5 sm:px-4 sm:py-1 rounded-md bg-black/95 border-2
          text-3xl sm:text-4xl tracking-[0.15em] tabular-nums leading-none
          transition-colors duration-300 backdrop-blur-md flex items-center
          ${isDanger
				? 'text-red-500 border-red-600 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]'
				: 'text-amber-500 border-amber-900/60 shadow-[0_0_10px_rgba(0,0,0,0.8)]'
			}
        `}
		>
		  00:{seconds}
		</div>
	  </div>
  );
}
