import type {IconActionButtonProps} from './types';

export function IconActionButton({icon, label, onClick, danger = false}: IconActionButtonProps) {
  return (
      <button
          onClick={onClick}
          title={label}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95
          ${danger
              ? 'border-copper/50 bg-rust/30 text-parchment hover:bg-rust/60'
              : 'border-brass/50 bg-black/30 text-cream hover:border-gold hover:bg-black/50'}`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
  );
}
