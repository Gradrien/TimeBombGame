import type {DividerProps} from './types';

export function Divider({className = ''}: DividerProps) {
  return <div className={`my-4 h-px w-full bg-gold/15 ${className}`}/>;
}
