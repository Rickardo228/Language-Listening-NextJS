'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import clarity from '@microsoft/clarity';

interface UserContextType {
    user: User | null;
    isAuthLoading: boolean;
    hasInitialisedForUser: React.MutableRefObject<boolean>;
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
    const hasInitialisedForUser = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("onAuthStateChanged", firebaseUser);
            console.log("hasInitialisedForUser", hasInitialisedForUser?.current);

            if (firebaseUser && !hasInitialisedForUser.current) {
                console.log("onAuthStateChanged 2", firebaseUser);
                hasInitialisedForUser.current = true;
                // Identify user in Clarity
                clarity.identify(firebaseUser.email || firebaseUser.uid);
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
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}; 