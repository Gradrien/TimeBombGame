import {cloneElement, isValidElement, type ReactElement} from 'react';
import {motion} from 'framer-motion';
import type {ButtonProps, ButtonSize, ButtonVariant} from './types';

const SIZE_STYLES: Record<ButtonSize, {
  padding: string;
  text: string;
  icon: number;
  gap: string;
  radius: string;
  innerRadius: string;
  border: string;
}> = {
  sm: {
    padding: 'px-4 py-2',
    text: 'text-xs',
    icon: 16,
    gap: 'gap-1',
    radius: 'rounded-lg',
    innerRadius: 'rounded-md',
    border: 'border-2',
  },
  md: {
    padding: 'px-6 py-3',
    text: 'text-sm',
    icon: 18,
    gap: 'gap-2',
    radius: 'rounded-xl',
    innerRadius: 'rounded-lg',
    border: 'border-[3px]',
  },
  lg: {
    padding: 'px-8 py-4',
    text: 'text-base',
    icon: 20,
    gap: 'gap-3',
    radius: 'rounded-2xl',
    innerRadius: 'rounded-xl',
    border: 'border-[3px]',
  },
};

/* Gradient stops are one-off shades of each variant, intentionally kept as
 * arbitrary values rather than polluting the global theme palette. */
const VARIANT_STYLES: Record<ButtonVariant, {
  background: string;
  border: string;
  text: string;
  glow: string;
  icon: string;
}> = {
  moriarty: {
    background: 'bg-gradient-to-b from-rust via-[#4c1118] to-rust-deep',
    border: 'border-copper',
    text: 'text-parchment',
    glow: 'bg-red-500/10',
    icon: 'text-orange-300',
  },
  sherlock: {
    background: 'bg-gradient-to-b from-sherlock-deep via-[#102a42] to-[#091521]',
    border: 'border-gold',
    text: 'text-[#e7f0f7]',
    glow: 'bg-cyan-400/10',
    icon: 'text-cyan-200',
  },
  neutral: {
    background: 'bg-gradient-to-b from-bronze-dark via-[#3b3127] to-[#221c16]',
    border: 'border-brass',
    text: 'text-cream',
    glow: 'bg-amber-300/10',
    icon: 'text-amber-200',
  },
  ghost: {
    background: 'bg-gradient-to-b from-white/10 via-white/[0.07] to-black/20 backdrop-blur-md',
    border: 'border-white/15',
    text: 'text-[#e8e2d8]',
    glow: 'bg-white/5',
    icon: 'text-[#d7d0c5]',
  },
};

export function Button({
                         children,
                         variant = 'neutral',
                         size = 'md',
                         icon,
                         disabled = false,
                         onClick,
                         className = '',
                       }: ButtonProps) {
  const currentSize = SIZE_STYLES[size];
  const currentVariant = VARIANT_STYLES[variant];

  return (
      <motion.button
          disabled={disabled}
          whileHover={disabled ? undefined : {scale: 1.03}}
          whileTap={disabled ? undefined : {scale: 0.97}}
          onClick={onClick}
          className={`
          ${className}
            relative overflow-hidden
            ${currentSize.padding}
            ${currentSize.radius}
            ${currentSize.border}
            ${currentSize.text}
            ${currentVariant.background}
            ${currentVariant.border}

           ${disabled ?
              `opacity-45
              saturate-50
              cursor-not-allowed
              grayscale-[0.25]` :
              `hover:brightness-110
              active:brightness-95`
          }
            shadow-2xl
            font-semibold
            uppercase
            transition-all duration-300
            select-none

            before:absolute
            before:inset-0
            before:bg-linear-to-b
            before:from-white/8
            before:to-transparent
            before:pointer-events-none
          `}
          style={{
            boxShadow:
                variant === 'ghost'
                    ? `
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -6px 12px rgba(0,0,0,0.35),
            0 4px 18px rgba(0,0,0,0.18)
          `
                    : `
            inset 0 2px 0 rgba(255,255,255,0.15),
            inset 0 -4px 10px rgba(0,0,0,0.5),
            0 10px 25px rgba(0,0,0,0.45)
          `,
          }}
      >
        {/* Texture */}
        <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 35%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 6px)',
            }}
        />

        {/* Inner copper frame */}
        <div
            className={`absolute inset-[4px] ${currentSize.innerRadius} border pointer-events-none`}
            style={{
              borderColor: 'rgba(212, 156, 96, 0.45)',
            }}
        />

        {/* Animated glow */}
        <motion.div
            animate={
              disabled
                  ? {opacity: 0.05}
                  : {opacity: [0.12, 0.3, 0.12]}
            }
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
            className={`
          absolute inset-0 blur-xl pointer-events-none
          ${currentVariant.glow}
        `}
        />

        {/* Metallic shine */}
        <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background:
                  'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)',
            }}
        />

        {/* Content */}
        <div
            className={`relative flex items-center justify-center ${currentSize.gap}`}
        >
          {isValidElement(icon) &&
              cloneElement(icon as ReactElement<{size?: number; className?: string}>, {
                size: currentSize.icon,
                className: `${currentVariant.icon} drop-shadow-sm`,
              })
          }

          <span
              className={`
            ${currentSize.text}
            drop-shadow-md
          `}
              style={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.08em',
              }}
          >
          {children}
        </span>
        </div>
      </motion.button>
  );
}
