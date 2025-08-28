'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingLanguageSelect } from './OnboardingLanguageSelect';
import { OnboardingAbilitySelect } from './OnboardingAbilitySelect';
import { OnboardingContentPreferences } from './OnboardingContentPreferences';
import { languageOptions, Phrase, CollectionType as CollectionTypeEnum } from '../types';
import { saveOnboardingData } from '../utils/userPreferences';
import { trackOnboardingCompleted, trackCreateList } from '../../lib/mixpanelClient';
import { useUser } from '../contexts/UserContext';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { defaultPresentationConfig, defaultPresentationConfigs } from '../defaultConfig';
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

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
    preselectedInputLang?: string;
    preselectedTargetLang?: string;
}

export function OnboardingModal({
    isOpen,
    onComplete,
    preselectedInputLang,
    preselectedTargetLang
}: OnboardingModalProps) {
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState<'languages' | 'ability' | 'preferences' | 'complete'>('languages');
    const [inputLang, setInputLang] = useState(
        preselectedInputLang || languageOptions[0]?.code || 'en-GB'
    );
    const [targetLang, setTargetLang] = useState(
        preselectedTargetLang || 'it-IT'
    );
    const [abilityLevel, setAbilityLevel] = useState('beginner');
    const [contentPreferences, setContentPreferences] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Update languages if preselected values change
    useEffect(() => {
        if (preselectedInputLang) setInputLang(preselectedInputLang);
        if (preselectedTargetLang) setTargetLang(preselectedTargetLang);
    }, [preselectedInputLang, preselectedTargetLang]);

    const handleCreateCollection = async (phrases: Phrase[], prompt?: string, collectionType?: CollectionTypeEnum, userArg?: User) => {
        const userId = userArg?.uid || user?.uid;
        if (!userId) return;
        const generatedName = prompt || 'New List';
        const now = new Date().toISOString();
        const newCollection = {
            name: generatedName,
            phrases: phrases.map(phrase => ({
                ...phrase,
                created_at: now
            })),
            created_at: now,
            collectionType: collectionType || 'phrases',
            presentationConfig: {
                ...(collectionType ? defaultPresentationConfigs[collectionType] : defaultPresentationConfig),
                name: generatedName
            }
        };
        const colRef = collection(firestore, 'users', userId, 'collections');
        const docRef = await addDoc(colRef, newCollection);

        trackCreateList(
            docRef.id,
            generatedName,
            phrases.length,
            collectionType || 'phrases',
            phrases[0]?.inputLang || 'unknown',
            phrases[0]?.targetLang || 'unknown'
        );

        return docRef.id;
    };

    const handleComplete = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Save onboarding data to Firestore with complete user profile
            await saveOnboardingData(user.uid, {
                abilityLevel,
                inputLang,
                targetLang,
                contentPreferences
            }, user); // Pass Firebase user for complete profile data

            // Check if user has any collections, create default if none
            const colRef = collection(firestore, 'users', user.uid, 'collections');
            const q = query(colRef, orderBy('created_at', 'desc'), fbLimit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Always create default phrases with user's preferred languages
                const defaultPhrases = getDefaultPhrasesForLanguages(inputLang, targetLang);
                await handleCreateCollection(defaultPhrases, "My List", "phrases", user);
            }

            // Track completion in analytics
            trackOnboardingCompleted(user.uid, abilityLevel, inputLang, targetLang);

            // Move to complete step - DON'T close modal yet
            setCurrentStep('complete');

        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalClose = () => {
        // This is called by the "Start Learning" button on the final step
        onComplete();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="p-8 pb-6 text-center border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-3xl">🎯</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Welcome to Language Shadowing!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {`Let's personalise your learning experience in just a few steps`}
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="px-8 pt-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'languages' ? 'bg-blue-600 text-white' :
                                ['ability', 'preferences', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' :
                                    'bg-gray-200 text-gray-600'
                                }`}>
                                1
                            </div>
                            <div className={`flex-1 h-2 mx-2 rounded ${['ability', 'preferences', 'complete'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-200'
                                }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'ability' ? 'bg-blue-600 text-white' :
                                ['preferences', 'complete'].includes(currentStep) ? 'bg-green-600 text-white' :
                                    'bg-gray-200 text-gray-600'
                                }`}>
                                2
                            </div>
                            <div className={`flex-1 h-2 mx-2 rounded ${['preferences', 'complete'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-200'
                                }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'preferences' ? 'bg-blue-600 text-white' :
                                currentStep === 'complete' ? 'bg-green-600 text-white' :
                                    'bg-gray-200 text-gray-600'
                                }`}>
                                3
                            </div>
                            <div className={`flex-1 h-2 mx-2 rounded ${currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-200'
                                }`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                ✓
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8">
                        <AnimatePresence mode="wait">
                            {currentStep === 'languages' && (
                                <motion.div
                                    key="languages"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                            Choose Your Languages
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {preselectedInputLang && preselectedTargetLang
                                                ? "We've pre-selected your languages from sign-up. You can change them if needed."
                                                : "Select the languages you want to practice with"
                                            }
                                        </p>
                                    </div>

                                    <OnboardingLanguageSelect
                                        inputLang={inputLang}
                                        setInputLang={setInputLang}
                                        targetLang={targetLang}
                                        setTargetLang={setTargetLang}
                                        disabled={isLoading}
                                    />

                                    <button
                                        onClick={() => setCurrentStep('ability')}
                                        disabled={isLoading}
                                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                                    >
                                        Continue
                                    </button>
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
                                            onClick={() => setCurrentStep('languages')}
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => setCurrentStep('preferences')}
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
                                            onClick={() => setCurrentStep('ability')}
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleComplete}
                                            disabled={isLoading || contentPreferences.length < 3}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                'Complete Setup'
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
                                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
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
                                            onClick={handleFinalClose}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Start Learning
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}