'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { User } from 'firebase/auth';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { useUser } from '../contexts/UserContext';
import { Modal, Button } from './ui';
import { toast } from 'sonner';
import { contentOptions } from '../utils/contentPreferences';

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
            toast.error('Failed to save content preferences. Please try again.');
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Content Preferences"
            subtitle="Choose topics you're interested in to personalize your learning content"
            size="lg"
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
                        disabled={!isMinimumSelected || !hasChanges}
                    >
                        Save Changes
                    </Button>
                </>
            }
        >
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
        </Modal>
    );
}
