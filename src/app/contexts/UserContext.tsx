'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import clarity from '@microsoft/clarity';
import { trackLogin, identifyUser } from '../../lib/mixpanelClient';
import { getUserProfile, UserProfile } from '../utils/userPreferences';

interface UserClaims {
    admin?: boolean;
    subscribed?: boolean;
    subscriptionId?: string;
    subscribedAt?: string;
    trialed?: boolean;
    trialEnd?: string | null;
    [key: string]: unknown; // Allow for other custom claims
}

interface UserContextType {
    user: User | null;
    isAuthLoading: boolean;
    hasInitialisedForUser: React.MutableRefObject<boolean>;
    userClaims: UserClaims | null;
    isAdmin: boolean;
    isSubscribed: boolean;
    hasTrialed: boolean;
    trialEnd: string | null;
    userProfile: UserProfile | null;
    needsOnboarding: boolean;
    refreshUserProfile: () => Promise<void>;
    refreshUserClaims: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserContextProvider');
    }
    return context;
};

interface UserContextProviderProps {
    children: React.ReactNode;
}

export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [userClaims, setUserClaims] = useState<UserClaims | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const hasInitialisedForUser = useRef(false);
    const sessionClaimsRefreshKey = (uid: string) => `claims-refreshed:${uid}`;

    // Note: Clarity initialization is now handled by CookieConsent component for GDPR compliance

    // Function to refresh user profile
    const refreshUserProfile = async () => {
        if (user) {
            try {
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);
            } catch (error) {
                console.error('Error refreshing user profile:', error);
            }
        }
    };

    // Function to refresh user claims (force token refresh)
    const refreshUserClaims = async () => {
        if (user) {
            try {
                // Force token refresh to get latest claims
                const idTokenResult = await user.getIdTokenResult(true);
                const claims = idTokenResult.claims as UserClaims;
                setUserClaims(claims);
                try {
                    sessionStorage.setItem(sessionClaimsRefreshKey(user.uid), '1');
                } catch (storageError) {
                    console.warn('Unable to persist claims refresh flag:', storageError);
                }
            } catch (error) {
                console.error('Error refreshing user claims:', error);
            }
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Set auth-hint cookie for SSR redirect
                // This is an essential cookie for proper authentication routing
                const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
                document.cookie = `auth-hint=1; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;

                // Extract custom claims from ID token
                try {
                    let idTokenResult;
                    let shouldForceRefresh = false;
                    try {
                        shouldForceRefresh = !sessionStorage.getItem(sessionClaimsRefreshKey(firebaseUser.uid));
                    } catch (storageError) {
                        console.warn('Unable to read claims refresh flag:', storageError);
                    }

                    idTokenResult = await firebaseUser.getIdTokenResult(shouldForceRefresh);
                    const claims = idTokenResult.claims as UserClaims;
                    console.log(claims);
                    setUserClaims(claims);
                    if (shouldForceRefresh) {
                        try {
                            sessionStorage.setItem(sessionClaimsRefreshKey(firebaseUser.uid), '1');
                        } catch (storageError) {
                            console.warn('Unable to persist claims refresh flag:', storageError);
                        }
                    }
                } catch (error) {
                    console.error("Error getting custom claims:", error);
                    setUserClaims(null);
                }

                // Load user profile
                let loadedProfile: UserProfile | null = null;
                try {
                    loadedProfile = await getUserProfile(firebaseUser.uid);
                    setUserProfile(loadedProfile);
                } catch (error) {
                    console.error("Error getting user profile:", error);
                    setUserProfile(null);
                }

                if (!hasInitialisedForUser.current) {
                    hasInitialisedForUser.current = true;

                    // Identify user in Clarity
                    if ((window as unknown as { clarity: unknown })?.clarity) {
                        clarity.identify(firebaseUser.email || firebaseUser.uid);
                    }

                    // Identify user in Mixpanel with email and AB test variant
                    identifyUser(
                        firebaseUser.uid,
                        firebaseUser.email || undefined,
                        loadedProfile?.abTestVariant
                    );

                    // Track login event
                    trackLogin(firebaseUser.uid, firebaseUser.providerData[0]?.providerId || 'email');
                }
            } else {
                // User is signed out, clear claims, profile, and auth-hint cookie
                setUserClaims(null);
                setUserProfile(null);
                // Clear the auth-hint cookie by setting it to expire immediately
                const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
                document.cookie = `auth-hint=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
                if (user?.uid) {
                    try {
                        sessionStorage.removeItem(sessionClaimsRefreshKey(user.uid));
                    } catch (storageError) {
                        console.warn('Unable to clear claims refresh flag:', storageError);
                    }
                }
            }

            setUser(firebaseUser);
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [user]); // Add user as dependency to trigger profile refresh

    const value: UserContextType = {
        user,
        isAuthLoading,
        hasInitialisedForUser,
        userClaims,
        isAdmin: Boolean(userClaims?.admin),
        isSubscribed: Boolean(userClaims?.subscribed),
        hasTrialed: Boolean(userClaims?.trialed),
        trialEnd: userClaims?.trialEnd ?? null,
        userProfile,
        needsOnboarding: Boolean(user && (!userProfile || !userProfile.onboardingCompleted)),
        refreshUserProfile,
        refreshUserClaims,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}; 
