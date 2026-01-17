'use client'

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingFlow } from '../../components/OnboardingFlow';
import { ROUTES } from '../../routes';

export default function GetStartedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
            <GetStartedContent />
        </Suspense>
    );
}

function GetStartedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);

    // Sync step from URL on mount and when URL changes
    useEffect(() => {
        const stepFromUrl = Number(searchParams.get('step'));
        if (!Number.isNaN(stepFromUrl) && stepFromUrl > 0) {
            setCurrentStep(stepFromUrl);
        }
    }, [searchParams]);

    // Update URL when step changes
    const handleStepChange = (newStep: number) => {
        setCurrentStep(newStep);
        // Update URL without full page reload
        router.push(`/get-started?step=${newStep}`, { scroll: false });
    };

    const handleComplete = () => {
        // Navigate to home page after onboarding completion
        router.push(ROUTES.HOME);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <OnboardingFlow
                includeAuthStep={true}
                initialStep={1}
                currentStep={currentStep}
                onStepChange={handleStepChange}
                onComplete={handleComplete}
                showProgressIndicator={true}
            />
        </div>
    );
}
