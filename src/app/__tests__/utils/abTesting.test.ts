import { describe, it, expect } from 'vitest';
import { assignAbTestVariant, getVariantConfig } from '../../utils/abTesting';

describe('abTesting', () => {
  describe('assignAbTestVariant', () => {
    it('should return either control or variantB', () => {
      const variant = assignAbTestVariant();
      expect(['control', 'variantB']).toContain(variant);
    });
  });

  describe('getVariantConfig', () => {
    it('should return correct config for control variant', () => {
      const config = getVariantConfig('control');
      expect(config.enableLoop).toBe(true);
      expect(config.enableInputPlayback).toBe(true);
      expect(config.showAllPhrases).toBe(false);
    });

    it('should return correct config for variantB', () => {
      const config = getVariantConfig('variantB');
      expect(config.enableLoop).toBe(false);
      expect(config.enableInputPlayback).toBe(false);
      expect(config.showAllPhrases).toBe(true);
    });

    it('should keep shadow mode ON in both variants', () => {
      const controlConfig = getVariantConfig('control');
      const variantBConfig = getVariantConfig('variantB');

      expect(controlConfig.enableOutputDurationDelay).toBe(true);
      expect(variantBConfig.enableOutputDurationDelay).toBe(true);
    });

    it('should fall back to control for invalid variant', () => {
      const config = getVariantConfig('invalid' as any);
      expect(config.enableLoop).toBe(true);
      expect(config.enableInputPlayback).toBe(true);
    });
  });
});
