import {useCallback} from 'react';
import {useGameStore} from '@/store/useGameStore';
import {resolveSkinAsset} from './resolve';

/**
 * Returns a resolver mapping a default-pack asset path to the player's active
 * pack. Components use it instead of hardcoding `src` so switching skin
 * re-renders them with the new textures.
 */
export function useSkinAsset(): (path: string) => string {
  const activeSkin = useGameStore(state => state.activeSkin);
  return useCallback((path: string) => resolveSkinAsset(path, activeSkin), [activeSkin]);
}
