'use client'

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingFlow } from '@/app/components/OnboardingFlow';
import { ROUTES } from '@/app/routes';
import { languageOptions } from '@/app/types';

export default function GetStartedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
            <GetStartedContent />
        </Suspense>
    );
}

function GetStartedContent() {
    const router = useRouter();
    const locale = useLocale();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);

    const preselectedTargetLang = useMemo(() => {
        const targetParam = searchParams.get('targetLanguage');
        if (!targetParam) return undefined;
        const isValid = languageOptions.some((lang) => lang.code === targetParam);
        return isValid ? targetParam : undefined;
    }, [searchParams]);

    const preselectedInputLang = useMemo(() => {
        const defaultByLocale: Record<string, string> = {
            en: 'en-US',
            pt: 'pt-BR',
        };

        const normalizedLocale = locale.split('-')[0];
        const mappedDefault = defaultByLocale[normalizedLocale];
        if (mappedDefault && languageOptions.some((lang) => lang.code === mappedDefault)) {
            return mappedDefault;
        }

        const fallback = languageOptions.find((lang) => lang.code.startsWith(`${normalizedLocale}-`));
        return fallback?.code ?? 'en-US';
    }, [locale]);

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
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set('step', String(newStep));
        router.push(`${ROUTES.GET_STARTED}?${nextParams.toString()}`, { scroll: false });
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
                preselectedInputLang={preselectedInputLang}
                preselectedTargetLang={preselectedTargetLang}
                onComplete={handleComplete}
                showProgressIndicator={true}
            />
        </div>
    );
}
