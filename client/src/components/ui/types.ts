import type {ComponentProps, ReactNode} from 'react';
import type {motion} from 'framer-motion';

export interface StripesProps {
  className?: string;
}

export interface PanelProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
  motionProps?: ComponentProps<typeof motion.div>;
}

export interface DividerProps {
  className?: string;
}

export interface SectionTitleProps {
  children: ReactNode;
  noMargin?: boolean;
}

export type ButtonVariant = 'moriarty' | 'sherlock' | 'neutral' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}
