import { PresentationConfig } from '../types';
import { defaultPresentationConfig } from '../defaultConfig';

export type AbTestVariant = 'control' | 'variantB';

/**
 * Randomly assigns a user to an AB test variant (50/50 split)
 * This should only be called once per user during account creation
 */
export function assignAbTestVariant(): AbTestVariant {
  return 'variantB';
}

/**
 * Returns the default presentation config for a given AB test variant
 *
 * Variant differences:
 * - Control: Current defaults (loop ON, input audio ON, single phrase view, shadow ON)
 * - VariantB: loop OFF, input audio OFF, multi-language view ON, shadow ON
 */
export function getVariantConfig(variant: AbTestVariant): PresentationConfig {
  const baseConfig = { ...defaultPresentationConfig };

  switch (variant) {
    case 'control':
      // Use current defaults
      return baseConfig;

    case 'variantB':
      // Modify specific settings for variant B
      return {
        ...baseConfig,
        enableLoop: false,              // Loop OFF (vs ON in control)
        enableInputPlayback: false,     // Input audio OFF (vs ON in control)
        showAllPhrases: true,           // Multi-language view ON (vs OFF in control)
        // enableOutputDurationDelay stays true (shadow mode ON in both)
      };

    default:
      // Fallback to control
      return baseConfig;
  }
}
