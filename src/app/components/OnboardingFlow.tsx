'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { OnboardingAbilitySelect } from './OnboardingAbilitySelect';
import { OnboardingContentPreferences } from './OnboardingContentPreferences';
import { OnboardingAuth } from './OnboardingAuth';
import { languageOptions, Phrase, CollectionType as CollectionTypeEnum } from '../types';
import { saveOnboardingData } from '../utils/userPreferences';
import { trackOnboardingCompleted } from '../../lib/mixpanelClient';
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

const getDefaultPhrasesForLanguages = (inputLang: string, targetLang: string): Phrase[] => {
    const inputLangData = defaultPhrasesData.find(item => item.lang === inputLang) as LangData | undefined;
    const targetLangData = defaultPhrasesData.find(item => item.lang === targetLang) as LangData | undefined;
    if (!inputLangData || !targetLangData) return [];

    const now = new Date().toISOString();
    return Object.entries(inputLangData.data).map(([input, inputPhraseData]: [string, { translated: string; romanized: string; audioUrl: string; duration: number; voice: string }]) => {
        const targetPhraseData = targetLangData.data[input];

        let romanized = "";
        if (targetPhraseData && targetPhraseData.romanized && targetPhraseData.romanized !== "null") {
            romanized = targetPhraseData.romanized;
        } else if (inputPhraseData.romanized && inputPhraseData.romanized !== "null") {
            romanized = inputPhraseData.romanized;
        }

        return {
            input,
            translated: targetPhraseData ? targetPhraseData.translated : inputPhraseData.translated,
            inputLang: inputLang,
            targetLang: targetLang,
            inputAudio: inputPhraseData.audioUrl ? { audioUrl: inputPhraseData.audioUrl, duration: inputPhraseData.duration } : null,
            outputAudio: targetPhraseData && targetPhraseData.audioUrl ? { audioUrl: targetPhraseData.audioUrl, duration: targetPhraseData.duration } : null,
            romanized: romanized,
            inputVoice: inputPhraseData.voice,
            targetVoice: targetPhraseData ? targetPhraseData.voice : undefined,
            created_at: now
        };
    });
};

export type OnboardingStep = 'languages' | 'auth' | 'ability' | 'preferences' | 'complete';

interface OnboardingFlowProps {
    // Step configuration
    includeAuthStep?: boolean;
    initialStep?: OnboardingStep;
    currentStep?: OnboardingStep; // Controlled step
    onStepChange?: (step: OnboardingStep) => void; // Callback when step changes

    // Language configuration
    preselectedInputLang?: string;
    preselectedTargetLang?: string;

    // Completion handlers
    onComplete: () => void;
    onAuthSuccess?: (user: User) => void;

    // Styling
    showHeader?: boolean;
    showProgressIndicator?: boolean;
}

export function OnboardingFlow({
    includeAuthStep = false,
    initialStep = 'languages',
    currentStep: controlledStep,
    onStepChange,
    preselectedInputLang,
    preselectedTargetLang,
    onComplete,
    onAuthSuccess,
    showHeader = true,
    showProgressIndicator = true
}: OnboardingFlowProps) {
    const { user } = useUser();
    const [internalStep, setInternalStep] = useState<OnboardingStep>(initialStep);
    const [inputLang, setInputLang] = useState(
        preselectedInputLang || languageOptions[0]?.code || 'en-GB'
    );
    const [targetLang, setTargetLang] = useState(
        preselectedTargetLang || 'it-IT'
    );
    const [abilityLevel, setAbilityLevel] = useState('beginner');
    const [contentPreferences, setContentPreferences] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Use controlled step if provided, otherwise use internal state
    const currentStep = controlledStep !== undefined ? controlledStep : internalStep;

    // Helper to change step (works for both controlled and uncontrolled)
    const changeStep = (newStep: OnboardingStep) => {
        if (onStepChange) {
            onStepChange(newStep);
        } else {
            setInternalStep(newStep);
        }
    };

    // Update languages if preselected values change
    useEffect(() => {
        if (preselectedInputLang) setInputLang(preselectedInputLang);
        if (preselectedTargetLang) setTargetLang(preselectedTargetLang);
    }, [preselectedInputLang, preselectedTargetLang]);

    // No longer need to skip auth step since it's at the end

    const handleCreateCollection = async (phrases: Phrase[], prompt?: string, collectionType?: CollectionTypeEnum, userArg?: User, skipTracking?: boolean) => {
        return await createCollection(phrases, prompt, collectionType, userArg, user || undefined, { skipTracking });
    };

    const handleLanguageContinue = () => {
        // Store languages for later use
        localStorage.setItem('signupInputLang', inputLang);
        localStorage.setItem('signupTargetLang', targetLang);
        changeStep('ability');
    };

    const handleAuthSuccessInternal = async (authenticatedUser: User) => {
        if (onAuthSuccess) {
            onAuthSuccess(authenticatedUser);
        }

        // After auth, save onboarding data and complete setup
        setIsLoading(true);
        try {
            // Save onboarding data to Firestore with complete user profile
            await saveOnboardingData(authenticatedUser.uid, {
                abilityLevel,
                inputLang,
                targetLang,
                contentPreferences
            }, authenticatedUser);

            // Check if user has any collections, create default if none
            const colRef = collection(firestore, 'users', authenticatedUser.uid, 'collections');
            const q = query(colRef, orderBy('created_at', 'desc'), fbLimit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Always create default phrases with user's preferred languages
                const defaultPhrases = getDefaultPhrasesForLanguages(inputLang, targetLang);
                await handleCreateCollection(defaultPhrases, "My List", "phrases", authenticatedUser, true);
            }

            // Track completion in analytics
            trackOnboardingCompleted(authenticatedUser.uid, abilityLevel, inputLang, targetLang);

            // Move to complete step
            changeStep('complete');

        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferencesContinue = () => {
        if (includeAuthStep && !user) {
            // If auth is required and user is not logged in, go to auth
            changeStep('auth');
        } else if (user) {
            // User is already authenticated, complete the setup
            handleCompleteSetupForAuthenticatedUser();
        } else {
            // No auth step required, just complete
            changeStep('complete');
        }
    };

    const handleCompleteSetupForAuthenticatedUser = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Save onboarding data to Firestore with complete user profile
            await saveOnboardingData(user.uid, {
                abilityLevel,
                inputLang,
                targetLang,
                contentPreferences
            }, user);

            // Check if user has any collections, create default if none
            const colRef = collection(firestore, 'users', user.uid, 'collections');
            const q = query(colRef, orderBy('created_at', 'desc'), fbLimit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Always create default phrases with user's preferred languages
                const defaultPhrases = getDefaultPhrasesForLanguages(inputLang, targetLang);
                await handleCreateCollection(defaultPhrases, "My List", "phrases", user, true);
            }

            // Track completion in analytics
            trackOnboardingCompleted(user.uid, abilityLevel, inputLang, targetLang);

            // Move to complete step
            changeStep('complete');

        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate which steps are visible
    const steps: OnboardingStep[] = ['languages', 'ability', 'preferences'];
    if (includeAuthStep) steps.push('auth');
    steps.push('complete');

    const getStepIndex = (step: OnboardingStep) => steps.indexOf(step);
    const currentStepIndex = getStepIndex(currentStep);

    return (
        <>
            {showHeader && currentStep !== 'auth' && (
                <div className="p-8 pb-6 text-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-3xl">🎯</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {currentStep === 'languages' ? 'Welcome to Language Shadowing!' :
                         currentStep === 'complete' ? 'All Set! 🎉' :
                         'Personalize Your Learning'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {currentStep === 'languages' ? 'Choose the languages you want to practice with' :
                         currentStep === 'complete' ? 'Your preferences have been saved. Ready to start learning!' :
                         'Just a few more steps to customize your experience'}
                    </p>
                </div>
            )}

            {showProgressIndicator && currentStep !== 'languages' && currentStep !== 'auth' && (
                <div className="px-8 pt-6">
                    <div className="flex items-center justify-between mb-8">
                        {steps.filter(s => s !== 'auth').map((step, index) => {
                            const stepIndex = getStepIndex(step);
                            const isCompleted = stepIndex < currentStepIndex;
                            const isCurrent = step === currentStep;
                            const isLast = step === 'complete';

                            return (
                                <div key={step} className="flex items-center flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        isCurrent ? 'bg-blue-600 text-white' :
                                        isCompleted ? 'bg-green-600 text-white' :
                                        'bg-gray-200 text-gray-600'
                                    }`}>
                                        {isLast ? '✓' : isCompleted ? '✓' : index + 1}
                                    </div>
                                    {!isLast && (
                                        <div className={`flex-1 h-2 mx-2 rounded ${
                                            isCompleted ? 'bg-green-600' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className={currentStep === 'auth' ? '' : 'px-8 pb-8'}>
                <AnimatePresence mode="wait">
                    {currentStep === 'languages' && (
                        <motion.div
                            key="languages"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <LanguageSelector
                                inputLang={inputLang}
                                setInputLang={setInputLang}
                                targetLang={targetLang}
                                setTargetLang={setTargetLang}
                                direction="row"
                                disabled={isLoading}
                            />

                            <button
                                onClick={handleLanguageContinue}
                                disabled={isLoading}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 'auth' && includeAuthStep && (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <OnboardingAuth
                                onAuthSuccess={handleAuthSuccessInternal}
                                disabled={isLoading}
                            />
                        </motion.div>
                    )}

                    {currentStep === 'ability' && (
                        <motion.div
                            key="ability"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <OnboardingAbilitySelect
                                selectedLevel={abilityLevel}
                                onLevelChange={setAbilityLevel}
                                targetLanguage={languageOptions.find(l => l.code === targetLang)?.label || targetLang}
                                disabled={isLoading}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => changeStep('languages')}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => changeStep('preferences')}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'preferences' && (
                        <motion.div
                            key="preferences"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <OnboardingContentPreferences
                                selectedPreferences={contentPreferences}
                                onPreferencesChange={setContentPreferences}
                                disabled={isLoading}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => changeStep('ability')}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handlePreferencesContinue}
                                    disabled={isLoading || contentPreferences.length < 3}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        includeAuthStep && !user ? 'Continue' : 'Complete Setup'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="text-green-600 dark:text-green-400">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-10 h-10" strokeWidth={3} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    All Set! 🎉
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Your preferences have been saved. Ready to start learning!
                                </p>
                                <button
                                    onClick={onComplete}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    Start Learning
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
