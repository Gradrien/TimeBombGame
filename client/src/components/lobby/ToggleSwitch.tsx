import type {ToggleSwitchProps} from './types';

/** Brass/steel switch — host's view of a game-mode setting. */
export function ToggleSwitch({checked, disabled = false, onChange}: ToggleSwitchProps) {
  return (
      <label
          className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50 saturate-0' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
        />
        <div
            className={`w-14 h-7 rounded-full shadow-inner transition-colors duration-500 relative border ${checked ? 'bg-sherlock-deep/80 border-sherlock/50' : 'bg-black/60 border-bronze/60'}`}>
          <div
              className={`absolute top-0.5 left-0.5 bg-linear-to-b from-cream via-gold to-brass border border-cream/40 rounded-full h-5 w-5 transition-transform duration-500 shadow-md ${checked ? 'translate-x-7' : 'translate-x-0'}`}/>
        </div>
      </label>
  );
}
