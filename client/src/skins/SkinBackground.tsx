'use client';

import {useEffect} from 'react';

import {useGameStore} from '@/store/useGameStore';
import {resolveSkinAsset} from './resolve';

/** Page background declared in `globals.css`, and overridable by a pack. */
const BACKGROUND_ASSET = '/assets/background.png';

/**
 * Applies the active pack's background image to the page.
 *
 * The background lives in a stylesheet rather than in an `<Image>`, so it is
 * out of reach of `useSkinAsset`. It is injected through a custom property
 * instead: `globals.css` keeps the classic asset as the `var()` fallback, so
 * the page still renders correctly before this effect runs (and for a pack
 * that ships no background).
 */
export function SkinBackground() {
  const activeSkin = useGameStore(state => state.activeSkin);

  useEffect(() => {
	const url = resolveSkinAsset(BACKGROUND_ASSET, activeSkin);
	document.documentElement.style.setProperty('--skin-background', `url('${url}')`);
  }, [activeSkin]);

  return null;
}
