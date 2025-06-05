import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import Link from 'next/link';
import { useState, useEffect, ReactElement } from 'react';
import { OnboardingLanguageSelect } from './components/OnboardingLanguageSelect';
import { languageOptions } from './types';

interface Advantage {
    text: string;
    icon?: string;
}

interface SignInPageProps {
    title?: string;
    description?: string | ((isSignUp: boolean) => string | ReactElement);
    showLanguageSelect?: boolean;
    onAuthSuccess?: (user: any) => void;
}

export const defaultAdvantages: Advantage[] = [
    { text: "Translate 28 languages", icon: "🌍" },
    { text: "Organise phrases in Lists", icon: "📂" },
    { text: "Get phrase suggestions", icon: "🤖" },
    { text: "Change voices", icon: "🎤" },
    { text: "It's entirely free", icon: "✅" }
];

export function SignInPage({
    title = "Language Shadowing",
    description = "Master languages through shadowing practice",
    showLanguageSelect,
    onAuthSuccess,
}: SignInPageProps) {
    const [inputLang, setInputLang] = useState(languageOptions[0]?.code || 'en-US');
    const [targetLang, setTargetLang] = useState('it-IT');
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const hasVisited = localStorage.getItem('hasVisitedBefore');
        if (!hasVisited) {
            setIsFirstVisit(true);
            setIsSignUp(true); // Default to sign-up mode on first visit
        }
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // If this is the first visit, store the selected languages
            if (isFirstVisit || isSignUp) {
                localStorage.setItem('hasVisitedBefore', 'true');

                if (onAuthSuccess) {
                    onAuthSuccess(result.user);
                } else {
                    // Default behavior - redirect to home page with query params
                    window.location.href = `/?firstVisit=true&inputLang=${inputLang}&targetLang=${targetLang}`;
                }
            } else if (onAuthSuccess) {
                onAuthSuccess(result.user);
            }
        } catch (error) {
            console.error('Error signing in with Google:', error);
            setError('Failed to sign in with Google. Please try again.');
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            let result;
            if (isSignUp) {
                result = await createUserWithEmailAndPassword(auth, email, password);
                localStorage.setItem('hasVisitedBefore', 'true');
            } else {
                result = await signInWithEmailAndPassword(auth, email, password);
            }

            if (onAuthSuccess) {
                onAuthSuccess(result.user);
            } else if (isSignUp) {
                // Default behavior - redirect to home page with query params
                window.location.href = `/?firstVisit=true&inputLang=${inputLang}&targetLang=${targetLang}`;
            }
        } catch (error: unknown) {
            console.error('Error with email authentication:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to authenticate. Please try again.');
            }
        }
    };

    const getDescription = () => {
        if (typeof description === 'function') {
            return description(isSignUp);
        }
        return isSignUp && showLanguageSelect ? 'Choose the languages you want to practice with' : description;
    };

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">

            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <div className="text-muted-foreground">{getDescription()}</div>

            </div>

            {isSignUp && showLanguageSelect && (
                <OnboardingLanguageSelect
                    inputLang={inputLang}
                    setInputLang={setInputLang}
                    targetLang={targetLang}
                    setTargetLang={setTargetLang}
                />
            )}

            <div className="space-y-4">
                <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span className="text-foreground font-medium">Sign in with Google</span>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-primary hover:underline"
                    >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-6">
                <p>By signing in, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link></p>
            </div>
        </div>
    );
} 