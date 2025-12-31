'use client'

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getFlagEmoji, getLanguageName } from '../utils/languageUtils';
import { useUser } from '../contexts/UserContext';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { track } from '../../lib/mixpanelClient';
import { languageOptions } from '../types';
import { Modal, Button, Select } from './ui';

interface StatsSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

const SUPPORTED_LANGUAGES = languageOptions.map(lang => lang.code);

export function StatsSettingsModal({ isOpen, onClose, user }: StatsSettingsModalProps) {
    const { userProfile, refreshUserProfile } = useUser();
    const [selectedNativeLanguage, setSelectedNativeLanguage] = useState(userProfile?.nativeLanguage || userProfile?.preferredInputLang || 'en-GB');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userProfile?.nativeLanguage) {
            setSelectedNativeLanguage(userProfile.nativeLanguage);
        } else if (userProfile?.preferredInputLang) {
            setSelectedNativeLanguage(userProfile.preferredInputLang);
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const previousLanguage = userProfile?.nativeLanguage;
            await createOrUpdateUserProfile(user.uid, {
                nativeLanguage: selectedNativeLanguage
            });

            // Track the settings change
            track('Native Language Setting Changed', {
                previousLanguage: previousLanguage || 'none',
                newLanguage: selectedNativeLanguage,
                wasFirstTime: !previousLanguage
            });

            // Refresh user profile to get updated data
            await refreshUserProfile();

            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const nativeLanguageOptions = SUPPORTED_LANGUAGES.map((lang) => ({
        value: lang,
        label: `${getFlagEmoji(lang)} ${getLanguageName(lang)}`,
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Stats Settings"
            size="sm"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isLoading}
                        loadingText="Saving..."
                        className="flex-1"
                    >
                        Save
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Native Language
                    </label>
                    <p className="text-sm text-foreground/60 mb-3">
                        Your native language determines which languages appear in your statistics. Languages matching your native language are filtered out from the &quot;Languages You&apos;re Learning&quot; section.
                    </p>

                    <Select
                        value={selectedNativeLanguage}
                        onChange={(e) => setSelectedNativeLanguage(e.target.value)}
                        options={nativeLanguageOptions}
                    />
                </div>
            </div>
        </Modal>
    );
}