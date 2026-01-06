'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingFlow, OnboardingStep } from '../components/OnboardingFlow';

export default function GetStartedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('languages');

    // Sync step from URL on mount and when URL changes
    useEffect(() => {
        const stepFromUrl = searchParams.get('step') as OnboardingStep | null;
        if (stepFromUrl && ['languages', 'auth', 'ability', 'preferences', 'complete'].includes(stepFromUrl)) {
            setCurrentStep(stepFromUrl);
        }
    }, [searchParams]);

    // Update URL when step changes
    const handleStepChange = (newStep: OnboardingStep) => {
        setCurrentStep(newStep);
        // Update URL without full page reload
        router.push(`/get-started?step=${newStep}`, { scroll: false });
    };

    const handleComplete = () => {
        // Navigate to home page after onboarding completion
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                <OnboardingFlow
                    includeAuthStep={true}
                    initialStep="languages"
                    currentStep={currentStep}
                    onStepChange={handleStepChange}
                    onComplete={handleComplete}
                    showHeader={true}
                    showProgressIndicator={true}
                />
            </div>
        </div>
    );
}
