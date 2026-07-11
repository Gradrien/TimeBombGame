import {useEffect, useState} from 'react';
import {VT323} from 'next/font/google';
import type {BombTimerProps} from './types';

const digitalFont = VT323({weight: '400', subsets: ['latin']});

function secondsLeft(endTime: number | null): number {
  return endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
}

export function BombTimer({endTime, isPaused = false}: BombTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => secondsLeft(endTime));

  // New turn: realign the counter during render ("adjusting state during
  // render" pattern); the interval below only keeps it ticking.
  const [prevEndTime, setPrevEndTime] = useState(endTime);
  if (endTime !== prevEndTime) {
    setPrevEndTime(endTime);
    setTimeLeft(secondsLeft(endTime));
  }

  useEffect(() => {
    if (!endTime || isPaused) return;
    const interval = setInterval(() => setTimeLeft(secondsLeft(endTime)), 100);
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
