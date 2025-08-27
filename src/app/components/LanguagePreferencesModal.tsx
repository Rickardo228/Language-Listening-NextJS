'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { languageOptions } from '../types';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { useUser } from '../contexts/UserContext';

interface LanguagePreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export function LanguagePreferencesModal({ isOpen, onClose, user }: LanguagePreferencesModalProps) {
    const { userProfile, refreshUserProfile } = useUser();
    const [inputLang, setInputLang] = useState(userProfile?.preferredInputLang || 'en-GB');
    const [targetLang, setTargetLang] = useState(userProfile?.preferredTargetLang || 'it-IT');
    const [isLoading, setIsLoading] = useState(false);

    // Update local state when userProfile changes
    useEffect(() => {
        if (userProfile) {
            setInputLang(userProfile.preferredInputLang);
            setTargetLang(userProfile.preferredTargetLang);
        }
    }, [userProfile]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await createOrUpdateUserProfile(user.uid, {
                preferredInputLang: inputLang,
                preferredTargetLang: targetLang
            });
            
            // Refresh user profile to get updated data
            await refreshUserProfile();
            
            onClose();
        } catch (error) {
            console.error('Error saving language preferences:', error);
            alert('Failed to save language preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset to original values if user cancels
        if (userProfile) {
            setInputLang(userProfile.preferredInputLang);
            setTargetLang(userProfile.preferredTargetLang);
        }
        onClose();
    };

    if (!isOpen) return null;

    const inputLanguage = languageOptions.find(l => l.code === inputLang);
    const targetLanguage = languageOptions.find(l => l.code === targetLang);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Language Preferences
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Choose your preferred languages for creating new content
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Input Language */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Input Language (what you speak)
                            </label>
                            <select
                                value={inputLang}
                                onChange={(e) => setInputLang(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {languageOptions.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Target Language */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Language (what you want to learn)
                            </label>
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {languageOptions.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{inputLanguage?.flag} {inputLanguage?.label}</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium">{targetLanguage?.flag} {targetLanguage?.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0 flex gap-3 justify-end">
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || (inputLang === userProfile?.preferredInputLang && targetLang === userProfile?.preferredTargetLang)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}