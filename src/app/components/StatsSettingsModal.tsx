import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getFlagEmoji, getLanguageName } from '../utils/languageUtils';
import { useUser } from '../contexts/UserContext';
import { createOrUpdateUserProfile } from '../utils/userPreferences';

interface StatsSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

const SUPPORTED_LANGUAGES = [
    'en-GB', 'en-US', 'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'pt-PT',
    'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ar-SA', 'hi-IN', 'tr-TR', 'pl-PL',
    'nl-NL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI', 'cs-CZ', 'hu-HU', 'ro-RO', 'el-GR',
    'he-IL', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY', 'tl-PH', 'uk-UA', 'bg-BG', 'hr-HR',
    'sk-SK', 'sl-SI', 'et-EE', 'lv-LV', 'lt-LT', 'mt-MT', 'cy-GB', 'ga-IE', 'is-IS'
];

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
            await createOrUpdateUserProfile(user.uid, {
                nativeLanguage: selectedNativeLanguage
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Stats Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-foreground/60 hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Native Language
                        </label>
                        <p className="text-sm text-foreground/60 mb-3">
                            Your native language determines which languages appear in your statistics. Languages matching your native language are filtered out from the &quot;Languages You&apos;re Learning&quot; section.
                        </p>

                        <select
                            value={selectedNativeLanguage}
                            onChange={(e) => setSelectedNativeLanguage(e.target.value)}
                            className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                    {getFlagEmoji(lang)} {getLanguageName(lang)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}