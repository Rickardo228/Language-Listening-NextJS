"use client"

import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { TemplatesBrowser } from '../components/TemplatesBrowser';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
                    <p>Please sign in to view templates.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return <TemplatesBrowser />;
}