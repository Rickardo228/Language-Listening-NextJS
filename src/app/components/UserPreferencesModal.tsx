'use client'

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { User } from 'firebase/auth';
import { languageOptions } from '../types';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { useUser } from '../contexts/UserContext';
import { LanguageSelector } from './LanguageSelector';
import { OnboardingAbilitySelect } from './OnboardingAbilitySelect';
import { AbilityLevel } from '../utils/contentRecommendations';
import { Modal, Button } from './ui';
import { toast } from 'sonner';
import { contentOptions } from '../utils/contentPreferences';

type PreferencesSection = 'language' | 'difficulty' | 'content';

interface UserPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    initialSection?: PreferencesSection;
}

export function UserPreferencesModal({
    isOpen,
    onClose,
    user,
    initialSection = 'language',
}: UserPreferencesModalProps) {
    const { userProfile, refreshUserProfile } = useUser();
    const [activeSection, setActiveSection] = useState<PreferencesSection>(initialSection);
    const [inputLang, setInputLang] = useState(userProfile?.preferredInputLang || 'en-GB');
    const [targetLang, setTargetLang] = useState(userProfile?.preferredTargetLang || 'it-IT');
    const [abilityLevel, setAbilityLevel] = useState<AbilityLevel>(userProfile?.abilityLevel || 'beginner');
    const [contentPreferences, setContentPreferences] = useState<string[]>(
        userProfile?.contentPreferences || []
    );
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setActiveSection(initialSection);
    }, [initialSection, isOpen]);

    useEffect(() => {
        if (!userProfile) return;
        setInputLang(userProfile.preferredInputLang);
        setTargetLang(userProfile.preferredTargetLang);
        setAbilityLevel(userProfile.abilityLevel);
        setContentPreferences(userProfile.contentPreferences || []);
    }, [userProfile]);

    const handleTogglePreference = (preferenceId: string) => {
        if (isLoading) return;

        const isSelected = contentPreferences.includes(preferenceId);
        if (isSelected) {
            setContentPreferences(prev => prev.filter(id => id !== preferenceId));
            return;
        }

        setContentPreferences(prev => [...prev, preferenceId]);
    };

    const handleClose = () => {
        if (userProfile) {
            setInputLang(userProfile.preferredInputLang);
            setTargetLang(userProfile.preferredTargetLang);
            setAbilityLevel(userProfile.abilityLevel);
            setContentPreferences(userProfile.contentPreferences || []);
        }
        onClose();
    };

    const inputLanguage = languageOptions.find(l => l.code === inputLang);
    const targetLanguage = languageOptions.find(l => l.code === targetLang);
    const isMinimumSelected = contentPreferences.length >= 3;

    const currentContent = [...contentPreferences].sort();
    const existingContent = [...(userProfile?.contentPreferences || [])].sort();
    const hasContentChanges = JSON.stringify(currentContent) !== JSON.stringify(existingContent);
    const hasLanguageChanges = inputLang !== userProfile?.preferredInputLang ||
        targetLang !== userProfile?.preferredTargetLang ||
        abilityLevel !== userProfile?.abilityLevel;
    const hasChanges = hasLanguageChanges || hasContentChanges;
    const canSave = hasChanges && (!hasContentChanges || isMinimumSelected);

    const handleSave = async () => {
        if (!canSave) return;

        setIsLoading(true);
        try {
            await createOrUpdateUserProfile(user.uid, {
                preferredInputLang: inputLang,
                preferredTargetLang: targetLang,
                abilityLevel,
                contentPreferences,
            });

            await refreshUserProfile();
            onClose();
        } catch (error) {
            console.error('Error saving user preferences:', error);
            toast.error('Failed to save preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Preferences"
            subtitle="Choose your language and content settings"
            size="lg"
            enableBlur
            animationVariant="scale"
            closeOnBackdropClick
            className="space-y-6"
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isLoading}
                        loadingText="Saving..."
                        disabled={!canSave}
                    >
                        Save Changes
                    </Button>
                </>
            }
        >
            <div className="inline-flex rounded-lg border border-border p-1">
                <button
                    type="button"
                    onClick={() => setActiveSection('language')}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        activeSection === 'language'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Language
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection('difficulty')}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        activeSection === 'difficulty'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Difficulty
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection('content')}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        activeSection === 'content'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Content Interests
                </button>
            </div>

            {activeSection === 'language' ? (
                <>
                    <LanguageSelector
                        inputLang={inputLang}
                        setInputLang={setInputLang}
                        targetLang={targetLang}
                        setTargetLang={setTargetLang}
                        direction="column"
                        gap="lg"
                        inputLabel="Input Language (what you speak)"
                        targetLabel="Target Language (what you want to learn)"
                        disabled={isLoading}
                    />

                    <div className="bg-secondary/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{inputLanguage?.label}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">{targetLanguage?.label}</span>
                        </div>
                    </div>
                </>
            ) : activeSection === 'difficulty' ? (
                <div className="border-t border-border pt-6">
                    <OnboardingAbilitySelect
                        selectedLevel={abilityLevel}
                        onLevelChange={(level) => setAbilityLevel(level as AbilityLevel)}
                        targetLanguage={targetLanguage?.label || targetLang}
                        disabled={isLoading}
                    />
                </div>
            ) : (
                <>
                    <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                            Select at least three topics you&apos;d like to learn about
                        </p>
                        <div className="mt-2">
                            <span className={`text-sm flex items-center justify-center gap-1 ${isMinimumSelected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {contentPreferences.length} selected {isMinimumSelected && <Check className="w-4 h-4" />}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {contentOptions.map((option) => {
                            const isSelected = contentPreferences.includes(option.id);
                            return (
                                <motion.button
                                    key={option.id}
                                    onClick={() => handleTogglePreference(option.id)}
                                    disabled={isLoading}
                                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                                    className={`
                                        p-4 rounded-lg border-2 transition-all duration-200 text-left
                                        ${isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-muted-foreground'
                                        }
                                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{option.emoji}</span>
                                        <div className="flex-1">
                                            <div className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                {option.label}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="text-primary">
                                                <Check className="w-5 h-5" strokeWidth={2.5} />
                                            </div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </>
            )}
        </Modal>
    );
}
