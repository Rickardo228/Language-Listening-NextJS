'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { useUser } from '../contexts/UserContext';

interface ContentPreference {
    id: string;
    label: string;
    emoji: string;
}

const contentOptions: ContentPreference[] = [
    { id: 'business', label: 'Business & Career', emoji: '🏢' },
    { id: 'travel', label: 'Travel & Tourism', emoji: '✈️' },
    { id: 'food', label: 'Food & Cooking', emoji: '🍽️' },
    { id: 'technology', label: 'Technology', emoji: '💻' },
    { id: 'music', label: 'Music & Entertainment', emoji: '🎵' },
    { id: 'education', label: 'Education & Learning', emoji: '📚' },
    { id: 'sports', label: 'Sports & Fitness', emoji: '⚽' },
    { id: 'arts', label: 'Arts & Culture', emoji: '🎨' },
    { id: 'finance', label: 'Finance', emoji: '💰' },
    { id: 'health', label: 'Health & Medicine', emoji: '🏥' }
];

interface ContentPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export function ContentPreferencesModal({ isOpen, onClose, user }: ContentPreferencesModalProps) {
    const { userProfile, refreshUserProfile } = useUser();
    const [contentPreferences, setContentPreferences] = useState<string[]>(
        userProfile?.contentPreferences || []
    );
    const [isLoading, setIsLoading] = useState(false);

    // Update local state when userProfile changes
    useEffect(() => {
        if (userProfile?.contentPreferences) {
            setContentPreferences(userProfile.contentPreferences);
        }
    }, [userProfile]);

    const handleTogglePreference = (preferenceId: string) => {
        if (isLoading) return;
        
        const isSelected = contentPreferences.includes(preferenceId);
        if (isSelected) {
            setContentPreferences(prev => prev.filter(id => id !== preferenceId));
        } else {
            setContentPreferences(prev => [...prev, preferenceId]);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await createOrUpdateUserProfile(user.uid, {
                contentPreferences
            });
            
            // Refresh user profile to get updated data
            await refreshUserProfile();
            
            onClose();
        } catch (error) {
            console.error('Error saving content preferences:', error);
            alert('Failed to save content preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset to original values if user cancels
        if (userProfile?.contentPreferences) {
            setContentPreferences(userProfile.contentPreferences);
        }
        onClose();
    };

    const isMinimumSelected = contentPreferences.length >= 3;
    const hasChanges = JSON.stringify(contentPreferences.sort()) !== JSON.stringify((userProfile?.contentPreferences || []).sort());

    if (!isOpen) return null;

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
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Content Preferences
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
                            Choose topics you're interested in to personalize your learning content
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                                Select at least three topics you'd like to learn about
                            </p>
                            <div className="mt-2">
                                <span className={`text-sm ${isMinimumSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                    {contentPreferences.length} selected {isMinimumSelected && '✓'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
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
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.emoji}</span>
                                            <div className="flex-1">
                                                <div className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {option.label}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="text-blue-500">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
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
                            disabled={isLoading || !isMinimumSelected || !hasChanges}
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