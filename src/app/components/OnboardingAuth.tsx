'use client'

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import { identifyUser, trackSignUp } from '../../lib/mixpanelClient';
import { Input } from './ui';

interface OnboardingAuthProps {
    onAuthSuccess: (user: User) => void;
    disabled?: boolean;
}

export function OnboardingAuth({
    onAuthSuccess,
    disabled = false
}: OnboardingAuthProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(true);
    const [error, setError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);

    const isLoading = isGoogleLoading || isEmailLoading || disabled;

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            if (isSignUp) {
                // Identify user in Mixpanel
                identifyUser(result.user.uid, result.user.email || undefined);
                trackSignUp(result.user.uid, result.user.providerData[0]?.providerId || 'google');
            }

            onAuthSuccess(result.user);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmailLoading(true);
        setError('');

        try {
            let result;
            if (isSignUp) {
                result = await createUserWithEmailAndPassword(auth, email, password);

                // Identify user in Mixpanel
                identifyUser(result.user.uid, result.user.email || undefined);
                trackSignUp(result.user.uid, 'email');
            } else {
                result = await signInWithEmailAndPassword(auth, email, password);
            }

            onAuthSuccess(result.user);
        } catch (error: unknown) {
            console.error('Error with email authentication:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to authenticate. Please try again.');
            }
        } finally {
            setIsEmailLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSignUp
                        ? 'Sign up to save your preferences and start learning'
                        : 'Sign in to continue your language learning journey'
                    }
                </p>
            </div>

            <div className="space-y-4">
                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGoogleLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
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
                    )}
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                    </span>
                </button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with email</span>
                    </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <Input
                        id="email"
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="you@example.com"
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="••••••••"
                        error={error}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isEmailLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>
                            {isEmailLoading
                                ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                                : (isSignUp ? 'Create Account' : 'Sign In')
                            }
                        </span>
                    </button>
                </form>

                {/* Toggle Sign In / Sign Up */}
                <div className="text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        disabled={isLoading}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
