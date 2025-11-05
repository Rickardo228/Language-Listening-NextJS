import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveOnboardingData } from '../../utils/userPreferences';
import { identifyUser } from '../../../lib/mixpanelClient';
import { getDoc } from 'firebase/firestore';

// Mock modules
vi.mock('../../../lib/mixpanelClient');
vi.mock('firebase/firestore');

describe('userPreferences - AB Test Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should notify Mixpanel with AB test variant after onboarding', async () => {
    // Mock getUserProfile to return a user with an AB variant
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'test-user-123',
        email: 'test@example.com',
        abTestVariant: 'variantB',
        defaultPresentationConfig: {},
      }),
    } as any);

    // Call saveOnboardingData
    await saveOnboardingData(
      'test-user-123',
      {
        abilityLevel: 'intermediate',
        inputLang: 'en-GB',
        targetLang: 'es-ES',
      },
      { email: 'test@example.com' } as any
    );

    // Verify Mixpanel was notified with the AB variant
    expect(identifyUser).toHaveBeenCalledWith(
      'test-user-123',
      'test@example.com',
      'variantB'
    );
  });
});
