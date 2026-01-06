// hooks/usePresentationConfig.ts
import { useMemo } from "react";
import { PresentationConfig } from "../types";
import { defaultPresentationConfig } from "../defaultConfig";

interface UsePresentationConfigOptions {
  userDefaultConfig?: PresentationConfig | null;
  itemPresentationConfig?: PresentationConfig | null;
  isReady?: boolean;
}

/**
 * Hook that calculates the merged presentation config from multiple sources.
 * Uses useMemo to derive state - no internal state management or effects.
 *
 * Priority order (highest priority last):
 * 1. defaultPresentationConfig (base defaults)
 * 2. userDefaultConfig (user's global preferences)
 * 3. itemPresentationConfig (collection/template-specific overrides)
 */
export function usePresentationConfig({
  userDefaultConfig = null,
  itemPresentationConfig = null,
  isReady = true,
}: UsePresentationConfigOptions = {}): PresentationConfig {
  return useMemo(() => {
    if (!isReady) {
      return defaultPresentationConfig;
    }

    return {
      ...defaultPresentationConfig,
      ...(userDefaultConfig || {}),
      ...(itemPresentationConfig || {}),
    } as PresentationConfig;
  }, [userDefaultConfig, itemPresentationConfig, isReady]);
}
