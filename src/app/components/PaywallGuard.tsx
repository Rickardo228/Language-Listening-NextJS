'use client'

import { useUser } from '../contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paywall } from './onboarding/steps/paywall';
import { ROUTES } from '../routes';

interface PaywallGuardProps {
    children: React.ReactNode;
}

function PaywallGuardInner({ children }: PaywallGuardProps) {
    const { user, isAuthLoading, isSubscribed, isAdmin } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    // Determine if paywall should be shown
    const isGetStartedRoute = pathname?.startsWith(ROUTES.GET_STARTED);
    const showPaywall = user && !isAdmin && !isSubscribed && !isAuthLoading && !isGetStartedRoute;

    // Disable body scroll when paywall is open
    useEffect(() => {
        if (showPaywall) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showPaywall]);

    // Show loading while checking auth
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

    // Render with animated paywall modal
    return (
        <>
            {children}
            <AnimatePresence>
                {showPaywall && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 top-[60px] bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="bg-background rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8"
                        >
                            <Paywall
                                data={{}}
                                updateData={() => { }}
                                onNext={() => { }}
                                onBack={() => router.back()}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export function PaywallGuard({ children }: PaywallGuardProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <PaywallGuardInner>{children}</PaywallGuardInner>
        </Suspense>
    );
}
