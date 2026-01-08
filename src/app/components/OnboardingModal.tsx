'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingFlow } from './OnboardingFlow';

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
                    <OnboardingFlow
                        includeAuthStep={false}
                        includePaywallStep={false}
                        initialStep={1}
                        preselectedInputLang={preselectedInputLang}
                        preselectedTargetLang={preselectedTargetLang}
                        onComplete={onComplete}
                        showProgressIndicator={false}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
