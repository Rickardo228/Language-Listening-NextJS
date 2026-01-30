'use client'

import { useState, useEffect } from 'react';
import clarity from '@microsoft/clarity';

export function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const consentStatus = localStorage.getItem('clarity-consent');

        // Always initialize Clarity (cookieless mode by default)
        // Only enable cookie tracking if user has granted consent
        initializeClarity(consentStatus === 'granted');

        // Show banner if user hasn't made a choice yet
        if (!consentStatus) {
            setShowBanner(true);
        }
    }, []);

    const initializeClarity = (hasConsent: boolean) => {
        if (typeof window !== 'undefined') {
            try {
                // Initialize Clarity
                clarity.init("rmwvuwqm9k");
                
                // Send consent signal to Clarity
                if (hasConsent) {
                    clarity.consent();
                }
            } catch (error) {
                console.error('Error initializing Clarity:', error);
            }
        }
    };

    const handleAccept = async () => {
        setIsLoading(true);

        try {
            // Store consent in localStorage
            localStorage.setItem('clarity-consent', 'granted');
            localStorage.setItem('clarity-consent-date', new Date().toISOString());

            // Enable cookie tracking (Clarity is already initialized)
            if (typeof window !== 'undefined') {
                clarity.consent();
            }

            // Hide banner
            setShowBanner(false);
        } catch (error) {
            console.error('Error handling consent:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        setIsLoading(true);

        try {
            // Store rejection in localStorage
            localStorage.setItem('clarity-consent', 'denied');
            localStorage.setItem('clarity-consent-date', new Date().toISOString());

            // Clarity continues running in cookieless mode (already initialized)

            // Hide banner
            setShowBanner(false);
        } catch (error) {
            console.error('Error handling consent rejection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-50 shadow-lg">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Cookie Consent
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            We use analytics cookies to understand how you use our language learning app, so we can fix issues and make it work better for you. 
                            This helps us improve features like audio playback, phrase loading, and the overall learning experience. You can choose to accept or decline these cookies.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                        <button
                            onClick={handleReject}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Decline'}
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Accept All'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}