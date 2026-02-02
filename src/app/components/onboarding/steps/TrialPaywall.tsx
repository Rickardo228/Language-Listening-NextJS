'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../ui/Button';
import { OnboardingData } from '../types';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL } from '../../../consts';
import { ROUTES } from '../../../routes';
import { track } from '../../../../lib/mixpanelClient';
import { trackMetaPixel } from '../../../../lib/metaPixel';
import { plans } from './plans';
import { PlanSelector } from './PlanSelector';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  showBack?: boolean;
}

export function TrialPaywall({ data, updateData, onNext, onBack, showBack = true }: Props) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(data.selectedPlan || 'annual');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const { user, hasTrialed, refreshUserClaims } = useUser();
  const paywallTrackedRef = useRef(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    if (paywallTrackedRef.current) return;
    track('Paywall Viewed', {
      selectedPlan,
      hasTrialed,
      nativeLanguage: data.nativeLanguage,
      targetLanguage: data.targetLanguage,
      abilityLevel: data.abilityLevel,
      variant: 'trial',
    });
    paywallTrackedRef.current = true;
  }, [
    selectedPlan,
    hasTrialed,
    data.nativeLanguage,
    data.targetLanguage,
    data.abilityLevel,
  ]);

  const waitForClaimsUpdate = async () => {
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
  };

  const handlePlanSelect = (planId: string) => {
    if (planId === selectedPlan) return;
    setSelectedPlan(planId);
    track('Paywall Plan Selected', { planId, hasTrialed, variant: 'trial' });
  };

  const handleStartTrial = async () => {
    if (!user?.email) {
      setErrorMessage('Email is required to start a free trial.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setLoadingStage('Getting things ready...');
    updateData({ selectedPlan });

    try {
      const plan = selectedPlan === 'annual' ? 'yearly' : 'monthly';
      track('Paywall Free Trial Attempt', {
        planId: selectedPlan,
        plan,
        hasTrialed,
        userId: user.uid,
        email: user.email,
        variant: 'trial',
      });
      setLoadingStage('Setting up your access...');
      const response = await fetch(`${API_BASE_URL}/api/start-free-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan }),
      });

      setLoadingStage('Almost there...');
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to start free trial.');
      }

      setLoadingStage('Finishing up...');
      await waitForClaimsUpdate();
      const planDetails = plans.find((p) => p.id === selectedPlan);
      const ltv = planDetails?.price.replace('$', '') || '0.00';
      trackMetaPixel('StartTrial', {
        value: '0.00',
        currency: 'USD',
        predicted_ltv: ltv,
      });
      track('Paywall Free Trial Succeeded', {
        planId: selectedPlan,
        plan,
        hasTrialed,
        userId: user.uid,
        variant: 'trial',
      });
      router.push(`${ROUTES.HOME}?checkout=success`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start free trial.';
      track('Paywall Free Trial Failed', {
        planId: selectedPlan,
        hasTrialed,
        error: message,
        userId: user?.uid,
        variant: 'trial',
      });
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
      setLoadingStage(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl">
          Choose a plan for after your
        </h1>
        <h1 className="text-3xl md:text-4xl text-green-500 mt-1">
          7 day free trial
        </h1>
      </div>

      <PlanSelector selectedPlan={selectedPlan} onPlanSelect={handlePlanSelect} />

      <div className="space-y-3 pt-2">
        <p className="text-center" style={{ fontFamily: 'var(--font-playpen-sans)' }}>
          <span className="text-green-500">✓</span> No Payment Due Now
        </p>

        <div className="flex gap-3">
          {showBack && (
            <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleStartTrial}
            className="flex-1"
            size="lg"
            disabled={isSubmitting}
            style={{ fontFamily: 'var(--font-playpen-sans)', fontWeight: 700 }}
          >
            {isSubmitting ? 'Starting trial...' : 'START MY FREE 7 DAYS'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <p className="text-center text-sm text-red-600">{errorMessage}</p>
      )}

      {isSubmitting && loadingStage && (
        <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          <span>{loadingStage}</span>
        </div>
      )}
    </div>
  );
}
