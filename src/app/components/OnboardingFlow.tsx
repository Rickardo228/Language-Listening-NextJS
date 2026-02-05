'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { default as JSConfettiType } from 'js-confetti';
import { Progress } from './ui/Progress';
import { DreamOutcome } from './onboarding/steps/dream-outcome';
import { PainPoints } from './onboarding/steps/pain-points';
import { LanguagePair } from './onboarding/steps/language-pair';
import { TargetLanguage } from './onboarding/steps/target-language';
import { NativeLanguage } from './onboarding/steps/native-language';
import { AbilityLevel } from './onboarding/steps/ability-level';
import { Interests } from './onboarding/steps/interests';
import { PlanReveal } from './onboarding/steps/plan-reveal';
import { QuickWin } from './onboarding/steps/quick-win';
import { AccountCreation } from './onboarding/steps/account-creation';
import { TrialPaywall } from './onboarding/steps/TrialPaywall';
import { SuccessScreen } from './onboarding/steps/success-screen';
import { OnboardingData } from './onboarding/types';
import { languageOptions, Phrase, CollectionType as CollectionTypeEnum } from '../types';
import { saveOnboardingData } from '../utils/userPreferences';
import { track, trackOnboardingCompleted } from '../../lib/mixpanelClient';
import { createCollection } from '../utils/collectionService';
import { useUser } from '../contexts/UserContext';
import { getFirestore, collection, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import defaultPhrasesData from '../../defaultPhrases.json';
import { User } from 'firebase/auth';

type PhraseData = {
  translated: string;
  audioUrl: string;
  duration: number;
  voice: string;
  romanized: string;
};

type LangData = {
  lang: string;
  data: { [key: string]: PhraseData };
};

const firestore = getFirestore();

type OnboardingStepId =
  | 'dream-outcome'
  | 'pain-points'
  | 'target-language'
  | 'native-language'
  | 'language-pair'
  | 'ability-level'
  | 'interests'
  | 'plan-reveal'
  | 'quick-win'
  | 'account-creation'
  | 'paywall'
  | 'success';

interface OnboardingFlowProps {
  includeAuthStep?: boolean;
  includePaywallStep?: boolean;
  initialStep?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  preselectedInputLang?: string;
  preselectedTargetLang?: string;
  onComplete: () => void;
  onAuthSuccess?: (user: User) => void;
  showProgressIndicator?: boolean;
}

const getDefaultPhrasesForLanguages = (inputLang: string, targetLang: string): Phrase[] => {
  const inputLangData = defaultPhrasesData.find(item => item.lang === inputLang) as LangData | undefined;
  const targetLangData = defaultPhrasesData.find(item => item.lang === targetLang) as LangData | undefined;
  if (!inputLangData || !targetLangData) return [];

  const now = new Date().toISOString();
  return Object.entries(inputLangData.data).map(([input, inputPhraseData]: [string, PhraseData]) => {
    const targetPhraseData = targetLangData.data[input];

    let romanized = '';
    if (targetPhraseData && targetPhraseData.romanized && targetPhraseData.romanized !== 'null') {
      romanized = targetPhraseData.romanized;
    } else if (inputPhraseData.romanized && inputPhraseData.romanized !== 'null') {
      romanized = inputPhraseData.romanized;
    }

    return {
      input,
      translated: targetPhraseData ? targetPhraseData.translated : inputPhraseData.translated,
      inputLang,
      targetLang,
      inputAudio: inputPhraseData.audioUrl ? { audioUrl: inputPhraseData.audioUrl, duration: inputPhraseData.duration } : null,
      outputAudio: targetPhraseData && targetPhraseData.audioUrl ? { audioUrl: targetPhraseData.audioUrl, duration: targetPhraseData.duration } : null,
      romanized,
      inputVoice: inputPhraseData.voice,
      targetVoice: targetPhraseData ? targetPhraseData.voice : undefined,
      created_at: now,
    };
  });
};

export function OnboardingFlow({
  includeAuthStep = true,
  includePaywallStep = true,
  initialStep,
  currentStep: controlledStep,
  onStepChange,
  preselectedInputLang,
  preselectedTargetLang,
  onComplete,
  onAuthSuccess,
  showProgressIndicator = true,
}: OnboardingFlowProps) {
  const { user } = useUser();
  const steps = useMemo(() => {
    const list: OnboardingStepId[] = [
      // 'dream-outcome',
      // 'pain-points',
      'target-language',
      'native-language',
      // 'language-pair',
      'ability-level',
      'interests',
      // 'plan-reveal',
      'quick-win',
    ];

    if (includeAuthStep) list.push('account-creation');
    if (includePaywallStep) list.push('paywall');
    // list.push('success');

    return list;
  }, [includeAuthStep, includePaywallStep]);

  const [internalStep, setInternalStep] = useState(initialStep || 1);
  const [data, setData] = useState<OnboardingData>({
    dreamOutcomes: [],
    painPoints: [],
    nativeLanguage: preselectedInputLang || languageOptions[0]?.code || 'en-GB',
    targetLanguage: preselectedTargetLang || 'it-IT',
    abilityLevel: 'beginner',
    interests: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const confettiInstanceRef = useRef<JSConfettiType | null>(null);

  const resolvedStep = Math.max(1, Math.min(controlledStep || internalStep, steps.length));
  const currentStepId = steps[resolvedStep - 1];

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const changeStep = (nextStep: number) => {
    const clampedStep = Math.max(1, Math.min(nextStep, steps.length));
    if (clampedStep !== resolvedStep) {
      const direction = clampedStep > resolvedStep ? 'forward' : 'back';
      track('Onboarding Step Viewed', {
        fromStepId: currentStepId,
        toStepId: steps[clampedStep - 1],
        fromStepNumber: resolvedStep,
        toStepNumber: clampedStep,
        totalSteps: steps.length,
        direction,
        dreamOutcomes: data.dreamOutcomes,
        painPoints: data.painPoints,
        nativeLanguage: data.nativeLanguage,
        targetLanguage: data.targetLanguage,
        abilityLevel: data.abilityLevel,
        interests: data.interests,
        practiceTime: data.practiceTime || null,
        email: data.email || null,
        accountType: data.accountType || null,
        selectedPlan: data.selectedPlan || null,
      });

      if (direction === 'forward') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }

    if (onStepChange) {
      onStepChange(clampedStep);
    } else {
      setInternalStep(clampedStep);
    }
  };

  const nextStep = () => changeStep(resolvedStep + 1);
  const prevStep = () => changeStep(resolvedStep - 1);

  const progress = (resolvedStep / steps.length) * 100;

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const { default: JSConfetti } = await import('js-confetti');
      if (!isMounted) return;
      confettiInstanceRef.current = new JSConfetti();
    })();

    return () => {
      isMounted = false;
      confettiInstanceRef.current?.clearCanvas();
      confettiInstanceRef.current = null;
    };
  }, []);

  const triggerConfetti = () => {
    confettiInstanceRef.current?.addConfetti({
      confettiNumber: 140,
      confettiRadius: 4,
      confettiColors: [
        '#F87171',
        '#FB923C',
        '#FACC15',
        '#34D399',
        '#38BDF8',
        '#A78BFA',
      ],
    });
  };

  useEffect(() => {
    if (preselectedInputLang) {
      setData((prev) => ({ ...prev, nativeLanguage: preselectedInputLang }));
    }
    if (preselectedTargetLang) {
      setData((prev) => ({ ...prev, targetLanguage: preselectedTargetLang }));
    }
  }, [preselectedInputLang, preselectedTargetLang]);

  useEffect(() => {
    if (resolvedStep > steps.length) {
      changeStep(steps.length);
    }
  }, [resolvedStep, steps.length]);


  const handleCreateCollection = async (
    phrases: Phrase[],
    prompt?: string,
    collectionType?: CollectionTypeEnum,
    userArg?: User,
    skipTracking?: boolean
  ) => {
    return await createCollection(phrases, prompt, collectionType, userArg, user || undefined, { skipTracking });
  };

  const persistOnboardingData = async (authenticatedUser: User) => {
    setIsLoading(true);
    try {
      await saveOnboardingData(
        authenticatedUser.uid,
        {
          abilityLevel: data.abilityLevel,
          inputLang: data.nativeLanguage,
          targetLang: data.targetLanguage,
          contentPreferences: data.interests,
          dreamOutcomes: data.dreamOutcomes,
          painPoints: data.painPoints,
          practiceTime: data.practiceTime,
          defaultPresentationConfig: data.defaultPresentationConfig,
        },
        authenticatedUser
      );

      const colRef = collection(firestore, 'users', authenticatedUser.uid, 'collections');
      const q = query(colRef, orderBy('created_at', 'desc'), fbLimit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const defaultPhrases = getDefaultPhrasesForLanguages(data.nativeLanguage, data.targetLanguage);
        await handleCreateCollection(defaultPhrases, 'My List', 'phrases', authenticatedUser, true);
      }

      trackOnboardingCompleted(
        authenticatedUser.uid,
        data.abilityLevel,
        data.nativeLanguage,
        data.targetLanguage,
        data.dreamOutcomes,
        data.painPoints,
        data.interests,
        data.practiceTime
      );
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestsContinue = async () => {
    if (includeAuthStep && !user) {
      nextStep();
      return;
    }

    if (user) {
      await persistOnboardingData(user);
    }

    onComplete()
    // nextStep();
  };

  const handleAuthSuccessInternal = async (authenticatedUser: User) => {
    if (onAuthSuccess) {
      onAuthSuccess(authenticatedUser);
    }

    await persistOnboardingData(authenticatedUser);
    nextStep();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showProgressIndicator && resolvedStep < steps.length && (
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-slate-300 shrink-0">
                Step {resolvedStep} of {steps.length}
              </span>
              <Progress value={progress} className="flex-1" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepId === 'dream-outcome' && (
                <DreamOutcome data={data} updateData={updateData} onNext={nextStep} />
              )}
              {currentStepId === 'pain-points' && (
                <PainPoints data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
              )}
              {currentStepId === 'target-language' && (
                <TargetLanguage
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  isLoading={isLoading}
                />
              )}
              {currentStepId === 'native-language' && (
                <NativeLanguage
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  isLoading={isLoading}
                />
              )}
              {currentStepId === 'language-pair' && (
                <LanguagePair
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  isLoading={isLoading}
                />
              )}
              {currentStepId === 'ability-level' && (
                <AbilityLevel
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  isLoading={isLoading}
                />
              )}
              {currentStepId === 'interests' && (
                <Interests
                  data={data}
                  updateData={updateData}
                  onNext={handleInterestsContinue}
                  onBack={prevStep}
                  isLoading={isLoading}
                />
              )}
              {currentStepId === 'plan-reveal' && (
                <PlanReveal data={data} onNext={nextStep} onBack={prevStep} />
              )}
              {currentStepId === 'quick-win' && (
                <QuickWin
                  data={data}
                  updateData={updateData}
                  onNext={() => {
                    triggerConfetti();
                    nextStep();
                  }}
                  onBack={prevStep}
                />
              )}
              {currentStepId === 'account-creation' && (
                <AccountCreation
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  onAuthSuccess={handleAuthSuccessInternal}
                  isLoading={isLoading}
                  isAuthenticated={!!user}
                />
              )}
              {currentStepId === 'paywall' && (
                <TrialPaywall
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                  showBack={false}
                />
              )}
              {currentStepId === 'success' && (
                <SuccessScreen data={data} onComplete={onComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
