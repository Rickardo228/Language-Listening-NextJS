'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import clarity from '@microsoft/clarity';
import { trackLogin, identifyUser } from '../../lib/mixpanelClient';
import { getUserProfile, UserProfile } from '../utils/userPreferences';

interface UserClaims {
    admin?: boolean;
    [key: string]: unknown; // Allow for other custom claims
}

interface UserContextType {
    user: User | null;
    isAuthLoading: boolean;
    hasInitialisedForUser: React.MutableRefObject<boolean>;
    userClaims: UserClaims | null;
    isAdmin: boolean;
    userProfile: UserProfile | null;
    needsOnboarding: boolean;
    refreshUserProfile: () => Promise<void>;
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Extract custom claims from ID token
                try {
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    const claims = idTokenResult.claims as UserClaims;
                    setUserClaims(claims);
                } catch (error) {
                    console.error("Error getting custom claims:", error);
                    setUserClaims(null);
                }

                // Load user profile
                try {
                    const profile = await getUserProfile(firebaseUser.uid);
                    setUserProfile(profile);
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

                    // Identify user in Mixpanel with email
                    identifyUser(firebaseUser.uid, firebaseUser.email || undefined);

                    // Track login event
                    trackLogin(firebaseUser.uid, firebaseUser.providerData[0]?.providerId || 'email');
                }
            } else {
                // User is signed out, clear claims and profile
                setUserClaims(null);
                setUserProfile(null);
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
        userProfile,
        needsOnboarding: Boolean(user && (!userProfile || !userProfile.onboardingCompleted)),
        refreshUserProfile,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}; 