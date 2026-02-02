'use client'

import Link from 'next/link';
import { CheckCircle, ChevronLeft, UserPlus } from 'lucide-react';
import { Button } from '../../ui/Button';
import { OnboardingAuth } from '../../OnboardingAuth';
import { OnboardingData } from '../types';
import { User } from 'firebase/auth';
import { trackMetaPixel } from '../../../../lib/metaPixel';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  onAuthSuccess: (user: User) => void;
  isLoading?: boolean;
  isAuthenticated?: boolean;
}

export function AccountCreation({
  onNext,
  onBack,
  onAuthSuccess,
  isLoading,
  isAuthenticated,
}: Props) {
  const handleAuthSuccess = (user: User) => {
    const providerId = user.providerData?.[0]?.providerId;
    trackMetaPixel('CompleteRegistration', {
      method: providerId || 'email',
    });
    onAuthSuccess(user);
  };

  return (
    <div className="space-y-6">
      {!isAuthenticated && (
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 mx-auto">
            <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
          </div>
          <h1 className="text-3xl md:text-4xl">You're ready to go</h1>
          <p className="text-gray-600 text-lg">
            Save your setup and goals. Unlock the full library. Create your own lists.
          </p>
        </div>
      )}
      {isAuthenticated ? (
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 text-sm font-medium mx-auto">
            <CheckCircle className="w-4 h-4" />
            Signed in
          </div>
          <h1 className="text-3xl md:text-4xl">You're all set</h1>
          <p className="text-gray-600 text-lg">Continue to finish setting up your account.</p>
          <Button onClick={onNext} fullWidth disabled={isLoading}>
            Continue
          </Button>
        </div>
      ) : (
        <>
          <OnboardingAuth onAuthSuccess={handleAuthSuccess} disabled={isLoading} showHeader={false} />
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </>
      )}

      <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2 w-fit" disabled={isLoading}>
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>
    </div>
  );
}
