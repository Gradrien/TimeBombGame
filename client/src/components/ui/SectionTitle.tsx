import type {SectionTitleProps} from './types';

export function SectionTitle({children, noMargin = false}: SectionTitleProps) {
  return (
      <h2 className={`font-serif text-sm font-bold uppercase tracking-[0.2em] text-gold ${noMargin ? '' : 'mb-4'}`}>
        {children}
      </h2>
  );
}
