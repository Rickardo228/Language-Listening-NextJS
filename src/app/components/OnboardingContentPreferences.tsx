'use client'

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

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

interface OnboardingContentPreferencesProps {
    selectedPreferences: string[];
    onPreferencesChange: (preferences: string[]) => void;
    disabled?: boolean;
    showHeader?: boolean;
}

export function OnboardingContentPreferences({
    selectedPreferences,
    onPreferencesChange,
    disabled = false,
    showHeader = true
}: OnboardingContentPreferencesProps) {
    const handleTogglePreference = (preferenceId: string) => {
        if (disabled) return;
        
        const isSelected = selectedPreferences.includes(preferenceId);
        if (isSelected) {
            onPreferencesChange(selectedPreferences.filter(id => id !== preferenceId));
        } else {
            onPreferencesChange([...selectedPreferences, preferenceId]);
        }
    };

    const isMinimumSelected = selectedPreferences.length >= 3;

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        What interests you?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Choose three or more topics you&apos;d like to learn about
                    </p>
                    <div className="mt-2">
                        <span className={`text-sm ${isMinimumSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                            {selectedPreferences.length} selected {isMinimumSelected && '✓'}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contentOptions.map((option) => {
                    const isSelected = selectedPreferences.includes(option.id);
                    return (
                        <motion.button
                            key={option.id}
                            onClick={() => handleTogglePreference(option.id)}
                            disabled={disabled}
                            whileHover={!disabled ? { scale: 1.02 } : {}}
                            whileTap={!disabled ? { scale: 0.98 } : {}}
                            className={`
                                p-4 rounded-lg border-2 transition-all duration-200 text-left
                                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
                                        <Check className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
