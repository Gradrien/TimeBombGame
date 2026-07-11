import {ToggleSwitch} from './ToggleSwitch';
import {ModeStatusBadge} from './ModeStatusBadge';
import type {ModeRowProps} from './types';

/**
 * One game-mode line: label + info action on the left; on the right, the
 * switch for the host or the state badge for everyone else.
 */
export function ModeRow({label, action, isHost, enabled, disabled = false, onChange, children}: ModeRowProps) {
  return (
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif tracking-wide text-sm text-cream uppercase drop-shadow-md font-bold">
              {label}
            </span>
            {action}
          </div>

          {isHost ? (
              <ToggleSwitch checked={enabled} disabled={disabled} onChange={onChange}/>
          ) : (
              <ModeStatusBadge enabled={enabled}/>
          )}
        </div>
        {children}
      </div>
  );
}
