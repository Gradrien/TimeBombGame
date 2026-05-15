import React from "react";
import {motion} from "framer-motion";

type SteampunkButtonProps = {
  children: React.ReactNode;
  variant?: "moriarty" | "sherlock" | "neutral" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const sizeStyles = {
  sm: {
	padding: "px-4 py-2",
	text: "text-xs",
	icon: 16,
	gap: "gap-1",
	radius: "rounded-lg",
	innerRadius: "rounded-md",
	border: "border-2",
  },

  md: {
	padding: "px-6 py-3",
	text: "text-sm",
	icon: 18,
	gap: "gap-2",
	radius: "rounded-xl",
	innerRadius: "rounded-lg",
	border: "border-[3px]",
  },

  lg: {
	padding: "px-8 py-4",
	text: "text-base",
	icon: 20,
	gap: "gap-3",
	radius: "rounded-2xl",
	innerRadius: "rounded-xl",
	border: "border-[3px]",
  },
};

export default function SteampunkButton({
										  children,
										  variant = "neutral",
										  size = "md",
										  icon,
										  disabled = false,
										  onClick,
										  className = "",
										}: SteampunkButtonProps) {
  const currentSize = sizeStyles[size];

  const variants = {
	moriarty: {
	  background:
		  "bg-gradient-to-b from-[#6e1d26] via-[#4c1118] to-[#2a080d]",
	  border: "border-[#b77b4a]",
	  text: "text-[#f7d8b5]",
	  glow: "bg-red-500/10",
	  icon: "text-orange-300",
	},

	sherlock: {
	  background:
		  "bg-gradient-to-b from-[#1d4463] via-[#102a42] to-[#091521]",
	  border: "border-[#c9a56d]",
	  text: "text-[#e7f0f7]",
	  glow: "bg-cyan-400/10",
	  icon: "text-cyan-200",
	},

	neutral: {
	  background:
		  "bg-gradient-to-b from-[#5a4b3c] via-[#3b3127] to-[#221c16]",
	  border: "border-[#b08a57]",
	  text: "text-[#f3e7d3]",
	  glow: "bg-amber-300/10",
	  icon: "text-amber-200",
	},
	ghost: {
	  background:
		  "bg-gradient-to-b from-white/10 via-white/[0.07] to-black/20 backdrop-blur-md",
	  border: "border-white/15",
	  text: "text-[#e8e2d8]",
	  glow: "bg-white/5",
	  icon: "text-[#d7d0c5]",
	},
  };

  const currentVariant = variants[variant];

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
				variant === "ghost"
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
				  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 35%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 6px)",
			}}
		/>

		{/* Inner copper frame */}
		<div
			className={`absolute inset-[4px] ${currentSize.innerRadius} border pointer-events-none`}
			style={{
			  borderColor: "rgba(212, 156, 96, 0.45)",
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
				  "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)",
			}}
		/>

		{/* Content */}
		<div
			className={`relative flex items-center justify-center ${currentSize.gap}`}
		>
		  {icon
			  && React.cloneElement(icon as React.ReactElement, {
				// @ts-expect-error - On force la taille de l'icône pour qu'elle s'adapte au design, mais on laisse le développeur libre de passer n'importe quelle icône (même si elle ignore la prop "size")
				size: currentSize.icon,
				className: `
        ${currentVariant.icon}
        drop-shadow-sm
      `,
			  })
		  }

		  <span
			  className={`
            ${currentSize.text}
            drop-shadow-md
          `}
			  style={{
				fontFamily: "'Cinzel', serif",
				letterSpacing: "0.08em",
			  }}
		  >
          {children}
        </span>
		</div>
	  </motion.button>
  );
}
