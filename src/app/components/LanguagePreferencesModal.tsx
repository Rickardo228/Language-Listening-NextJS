'use client'

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { languageOptions } from '../types';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { useUser } from '../contexts/UserContext';
import { LanguageSelector } from './LanguageSelector';
import { OnboardingAbilitySelect } from './OnboardingAbilitySelect';
import { AbilityLevel } from '../utils/contentRecommendations';
import { Modal, Button } from './ui';
import { toast } from 'sonner';


interface LanguagePreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export function LanguagePreferencesModal({ isOpen, onClose, user }: LanguagePreferencesModalProps) {
    const { userProfile, refreshUserProfile } = useUser();
    const [inputLang, setInputLang] = useState(userProfile?.preferredInputLang || 'en-GB');
    const [targetLang, setTargetLang] = useState(userProfile?.preferredTargetLang || 'it-IT');
    const [abilityLevel, setAbilityLevel] = useState<AbilityLevel>(userProfile?.abilityLevel || 'beginner');
    const [isLoading, setIsLoading] = useState(false);

    // Update local state when userProfile changes
    useEffect(() => {
        if (userProfile) {
            setInputLang(userProfile.preferredInputLang);
            setTargetLang(userProfile.preferredTargetLang);
            setAbilityLevel(userProfile.abilityLevel);
        }
    }, [userProfile]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await createOrUpdateUserProfile(user.uid, {
                preferredInputLang: inputLang,
                preferredTargetLang: targetLang,
                abilityLevel: abilityLevel
            });

            // Refresh user profile to get updated data
            await refreshUserProfile();

            onClose();
        } catch (error) {
            console.error('Error saving language preferences:', error);
            toast.error('Failed to save language preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset to original values if user cancels
        if (userProfile) {
            setInputLang(userProfile.preferredInputLang);
            setTargetLang(userProfile.preferredTargetLang);
            setAbilityLevel(userProfile.abilityLevel);
        }
        onClose();
    };

    const inputLanguage = languageOptions.find(l => l.code === inputLang);
    const targetLanguage = languageOptions.find(l => l.code === targetLang);

    const hasChanges = inputLang !== userProfile?.preferredInputLang ||
                       targetLang !== userProfile?.preferredTargetLang ||
                       abilityLevel !== userProfile?.abilityLevel;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Language Preferences"
            subtitle="Choose your preferred languages for creating new content"
            size="sm"
            enableBlur
            animationVariant="scale"
            closeOnBackdropClick
            className="space-y-6"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isLoading}
                        loadingText="Saving..."
                        disabled={!hasChanges}
                    >
                        Save Changes
                    </Button>
                </>
            }
        >
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

            {/* Ability Level Section */}
            <div className="border-t border-border pt-6">
                <OnboardingAbilitySelect
                    selectedLevel={abilityLevel}
                    onLevelChange={(level) => setAbilityLevel(level as AbilityLevel)}
                    targetLanguage={targetLanguage?.label || targetLang}
                    disabled={isLoading}
                />
            </div>

            {/* Preview */}
            <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{inputLanguage?.label}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{targetLanguage?.label}</span>
                </div>
            </div>
        </Modal>
    );
}