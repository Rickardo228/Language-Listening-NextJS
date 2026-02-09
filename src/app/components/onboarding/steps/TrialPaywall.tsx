'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../ui/Button';
import { OnboardingData } from '../types';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL } from '../../../consts';
import { ROUTES } from '../../../routes';
import { track } from '../../../../lib/mixpanelClient';
import { trackMetaPixel } from '../../../../lib/metaPixel';
import { FeatureHighlights } from './FeatureHighlights';
import { TrialReminder } from './TrialReminder';
import { GoalSetting } from './GoalSetting';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  showBack?: boolean;
}

type PaywallStep = 'welcome' | 'reminder' | 'goal' | 'starting';

export function TrialPaywall({ data, updateData, onNext, onBack, showBack = true }: Props) {
  const router = useRouter();
  const [internalStep, setInternalStep] = useState<PaywallStep>('welcome');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const { user, hasTrialed, refreshUserClaims } = useUser();
  const trialStartedRef = useRef(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Track internal step views
  useEffect(() => {
    const stepNames: Record<PaywallStep, string> = {
      welcome: 'Paywall Welcome Viewed',
      reminder: 'Paywall Reminder Viewed',
      goal: 'Paywall Goal Viewed',
      starting: 'Trial Starting',
    };

    track(stepNames[internalStep], {
      step: internalStep,
      hasTrialed,
      nativeLanguage: data.nativeLanguage,
      targetLanguage: data.targetLanguage,
      abilityLevel: data.abilityLevel,
      variant: 'trial',
    });
  }, [internalStep]);

  const waitForClaimsUpdate = useCallback(async () => {
    if (!user) return;
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims as { subscribed?: boolean; trialed?: boolean };
      if (claims.subscribed || claims.trialed) {
        await refreshUserClaims();
        return;
      }
      await sleep(750);
    }
    await refreshUserClaims();
  }, [user, refreshUserClaims]);

  // Auto-start trial when entering 'starting' step
  useEffect(() => {
    if (internalStep !== 'starting') return;
    if (trialStartedRef.current) return;
    trialStartedRef.current = true;

    const startTrial = async () => {
      if (!user?.email) {
        setErrorMessage('Email is required to start a free trial.');
        return;
      }

      setErrorMessage(null);
      setLoadingStage('Getting things ready...');

      try {
        track('Paywall Free Trial Attempt', {
          hasTrialed,
          userId: user.uid,
          email: user.email,
          variant: 'trial-no-plan-selection',
        });

        setLoadingStage('Setting up your access...');
        const response = await fetch(`${API_BASE_URL}/api/start-free-trial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, plan: 'yearly' }),
        });

        setLoadingStage('Almost there...');
        const responseData = await response.json();

        if (!response.ok) {
          // If user already has a subscription, treat it as success since they're authenticated
          const errorMessage = responseData?.error || '';
          if (errorMessage.toLowerCase().includes('already has an active subscription')) {
            track('Paywall Already Has Subscription', {
              hasTrialed,
              userId: user.uid,
              variant: 'trial-no-plan-selection',
              context: 'onboarding',
            });
            // User is authenticated and has a subscription - proceed as success
            router.push(`${ROUTES.HOME}?checkout=success`);
            return;
          }
          throw new Error(errorMessage || 'Failed to start free trial.');
        }

        setLoadingStage('Finishing up...');
        await waitForClaimsUpdate();

        trackMetaPixel('StartTrial', {
          value: '0.00',
          currency: 'USD',
        });

        track('Paywall Free Trial Succeeded', {
          hasTrialed,
          userId: user.uid,
          variant: 'trial-no-plan-selection',
        });

        router.push(`${ROUTES.HOME}?checkout=success`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start free trial.';
        track('Paywall Free Trial Failed', {
          hasTrialed,
          error: message,
          userId: user?.uid,
          variant: 'trial-no-plan-selection',
        });
        setErrorMessage(message);
        setLoadingStage(null);
      }
    };

    startTrial();
  }, [internalStep, user, hasTrialed, router, waitForClaimsUpdate]);

  const renderStartingStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-3xl md:text-4xl">
          Starting your
        </h1>
        <h1 className="text-3xl md:text-4xl text-green-500 mt-1">
          7 day free trial
        </h1>
      </div>

      {loadingStage && (
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          <span>{loadingStage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="space-y-4">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <Button
            onClick={() => {
              trialStartedRef.current = false;
              setInternalStep('reminder');
            }}
            variant="outline"
            size="md"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={internalStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {internalStep === 'welcome' && (
          <FeatureHighlights onNext={() => setInternalStep('reminder')} />
        )}
        {internalStep === 'reminder' && (
          <TrialReminder onNext={() => setInternalStep('goal')} />
        )}
        {internalStep === 'goal' && (
          <GoalSetting onNext={(goal) => {
            updateData({ dailyGoal: goal });
            track('Paywall Goal Selected', { goal, variant: 'trial' });
            setInternalStep('starting');
          }} />
        )}
        {internalStep === 'starting' && renderStartingStep()}
      </motion.div>
    </AnimatePresence>
  );
}
