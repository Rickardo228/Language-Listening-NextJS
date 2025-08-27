'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import clarity from '@microsoft/clarity';
import { trackLogin, identifyUser } from '../../lib/mixpanelClient';

interface UserClaims {
    admin?: boolean;
    [key: string]: any; // Allow for other custom claims
}

interface UserContextType {
    user: User | null;
    isAuthLoading: boolean;
    hasInitialisedForUser: React.MutableRefObject<boolean>;
    userClaims: UserClaims | null;
    isAdmin: boolean;
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
    const hasInitialisedForUser = useRef(false);

    // Initialize Clarity on mount (only in production)
    useEffect(() => {
        // Only initialize Clarity if not on localhost
        if (typeof window !== 'undefined' && !window?.location?.hostname?.includes('localhost')) {
            // Initialize Clarity with your project ID
            clarity.init("rmwvuwqm9k");
        }
    }, []);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("onAuthStateChanged", firebaseUser);
            console.log("hasInitialisedForUser", hasInitialisedForUser?.current);

            if (firebaseUser) {
                // Extract custom claims from ID token
                try {
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    const claims = idTokenResult.claims as UserClaims;
                    console.log("Custom claims:", claims);
                    setUserClaims(claims);
                } catch (error) {
                    console.error("Error getting custom claims:", error);
                    setUserClaims(null);
                }

                if (!hasInitialisedForUser.current) {
                    console.log("onAuthStateChanged 2", firebaseUser);
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
                // User is signed out, clear claims
                setUserClaims(null);
            }

            setUser(firebaseUser);
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value: UserContextType = {
        user,
        isAuthLoading,
        hasInitialisedForUser,
        userClaims,
        isAdmin: Boolean(userClaims?.admin),
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}; 