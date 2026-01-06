// hooks/usePresentationConfig.ts
import { useMemo, useCallback, useState, useEffect } from "react";
import { PresentationConfig } from "../types";
import { defaultPresentationConfig } from "../defaultConfig";
import { getUserProfile } from "../utils/userPreferences";
import { getVariantConfig } from "../utils/abTesting";

interface UsePresentationConfigOptions {
  user?: { uid: string } | null;
  itemPresentationConfig?: PresentationConfig | null;
  isItemReady?: boolean;
}

interface UsePresentationConfigReturn {
  presentationConfig: PresentationConfig;
  setPresentationConfig: (updates: Partial<PresentationConfig> | ((prev: PresentationConfig) => PresentationConfig)) => void;
  isReady: boolean;
}

/**
 * Hook that calculates the merged presentation config from multiple sources.
 * Manages loading user config internally and derives the final config.
 *
 * Priority order (highest priority last):
 * 1. defaultPresentationConfig (base defaults)
 * 2. userDefaultConfig (user's global preferences - loaded automatically)
 * 3. itemPresentationConfig (collection/template-specific overrides)
 */
export function usePresentationConfig({
  user = null,
  itemPresentationConfig = null,
  isItemReady = true,
}: UsePresentationConfigOptions = {}): UsePresentationConfigReturn {
  const [userDefaultConfig, setUserDefaultConfig] = useState<PresentationConfig | null>(null);
  const [userConfigLoaded, setUserConfigLoaded] = useState(false);

  // Load user's default presentation config on mount or when user changes
  useEffect(() => {
    const loadUserConfig = async () => {
      if (!user) {
        // If no user, use variant B config
        setUserDefaultConfig(getVariantConfig('variantB'));
        setUserConfigLoaded(true);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile?.defaultPresentationConfig) {
          setUserDefaultConfig(userProfile.defaultPresentationConfig);
        } else {
          setUserDefaultConfig(null);
        }
      } catch (error) {
        console.error('Error loading user config:', error);
        setUserDefaultConfig(null);
      } finally {
        setUserConfigLoaded(true);
      }
    };

    loadUserConfig();
  }, [user]);

  const isReady = userConfigLoaded && isItemReady;

  const presentationConfig = useMemo(() => {
    if (!isReady) {
      return defaultPresentationConfig;
    }

    return {
      ...defaultPresentationConfig,
      ...(userDefaultConfig || {}),
      ...(itemPresentationConfig || {}),
    } as PresentationConfig;
  }, [userDefaultConfig, itemPresentationConfig, isReady]);

  const setPresentationConfig = useCallback((updates: Partial<PresentationConfig> | ((prev: PresentationConfig) => PresentationConfig)) => {
    // Resolve updates if it's a function
    const resolvedUpdates = typeof updates === 'function'
      ? updates(presentationConfig)
      : { ...presentationConfig, ...updates };

    // Update user default config state
    setUserDefaultConfig(resolvedUpdates);
  }, [presentationConfig]);

  return { presentationConfig, setPresentationConfig, isReady };
}
