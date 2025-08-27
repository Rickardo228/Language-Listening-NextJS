'use client'

import { OnboardingModal } from './OnboardingModal';
import { useUser } from '../contexts/UserContext';
import { useSearchParams } from 'next/navigation';
import { createOrUpdateUserProfile } from '../utils/userPreferences';
import { Suspense } from 'react';

interface OnboardingGuardProps {
    children: React.ReactNode;
}

function OnboardingGuardInner({ children }: OnboardingGuardProps) {
    const { user, isAuthLoading, needsOnboarding, refreshUserProfile } = useUser();
    const searchParams = useSearchParams();
    
    // Developer override: add ?resetOnboarding=true to any URL to force onboarding
    const forceOnboarding = searchParams.get('resetOnboarding') === 'true';
    
    // Get preselected languages from sign-up flow (if any)
    const getPreselectedLanguages = () => {
        if (typeof window === 'undefined') return { inputLang: undefined, targetLang: undefined };
        
        const inputLang = localStorage.getItem('signupInputLang');
        const targetLang = localStorage.getItem('signupTargetLang');
        
        return { inputLang, targetLang };
    };
    
    const { inputLang: preselectedInputLang, targetLang: preselectedTargetLang } = getPreselectedLanguages();
    
    // Reset onboarding if forced
    const handleResetOnboarding = async () => {
        if (user && forceOnboarding) {
            try {
                await createOrUpdateUserProfile(user.uid, {
                    onboardingCompleted: false
                });
                await refreshUserProfile();
            } catch (error) {
                console.error('Error resetting onboarding:', error);
            }
        }
    };

    // Handle completion and clear URL parameter and stored languages
    const handleOnboardingComplete = async () => {
        await refreshUserProfile();
        
        // Clear the URL parameter if it was used
        if (forceOnboarding && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('resetOnboarding');
            window.history.replaceState({}, '', url.toString());
        }
        
        // Clear stored signup languages after onboarding is complete
        if (typeof window !== 'undefined') {
            localStorage.removeItem('signupInputLang');
            localStorage.removeItem('signupTargetLang');
        }
    };

    // Check if we need to reset onboarding
    if (user && forceOnboarding && !needsOnboarding) {
        handleResetOnboarding();
    }

    // Show loading while checking auth/profile
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Not authenticated - let the app handle auth flow
    if (!user) {
        return <>{children}</>;
    }

    // Authenticated but needs onboarding - show modal over children
    if (needsOnboarding || forceOnboarding) {
        return (
            <>
                {children}
                <OnboardingModal 
                    isOpen={true}
                    onComplete={handleOnboardingComplete}
                    preselectedInputLang={preselectedInputLang || undefined}
                    preselectedTargetLang={preselectedTargetLang || undefined}
                />
            </>
        );
    }

    // All good - show normal app
    return <>{children}</>;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <OnboardingGuardInner>{children}</OnboardingGuardInner>
        </Suspense>
    );
}