"use client"

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, createOrUpdateUserProfile } from '../utils/userPreferences';
import { Mail, CheckCircle, Settings, ArrowRight } from 'lucide-react';
import { track } from '../../lib/mixpanelClient';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get email type from URL params
  const emailType = searchParams.get('type'); // 'practice' | 'weekly' | 'all'

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUnsubscribe = async () => {
    if (!user) {
      setError('Please sign in to manage your email preferences');
      return;
    }

    try {
      setUnsubscribing(true);
      setError(null);

      const updates: any = {};

      // Determine what to unsubscribe from
      if (emailType === 'practice') {
        updates.practiceReminderEnabled = false;
        track('Unsubscribed from Practice Reminders', { source: 'email_link' });
      } else if (emailType === 'weekly') {
        updates.weeklyStatsEnabled = false;
        track('Unsubscribed from Weekly Stats', { source: 'email_link' });
      } else {
        // Unsubscribe from all
        updates.emailNotificationsEnabled = false;
        updates.practiceReminderEnabled = false;
        updates.weeklyStatsEnabled = false;
        track('Unsubscribed from All Emails', { source: 'email_link' });
      }

      await createOrUpdateUserProfile(user.uid, updates);
      setSuccess(true);
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError('Failed to update preferences. Please try again.');
      track('Unsubscribe Error', { error: String(err) });
    } finally {
      setUnsubscribing(false);
    }
  };

  const getEmailTypeName = () => {
    if (emailType === 'practice') return 'Daily Practice Reminders';
    if (emailType === 'weekly') return 'Weekly Stats Summaries';
    return 'All Email Notifications';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your email preferences.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Successfully Unsubscribed</h1>
            <p className="text-muted-foreground">
              You've been unsubscribed from <strong>{getEmailTypeName()}</strong>.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You can always change your mind! Manage all your email preferences in settings.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                track('Manage Preferences Clicked', { source: 'unsubscribe_page' });
                router.push('/settings');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage Email Preferences
            </button>

            <button
              onClick={() => {
                track('Back to Home Clicked', { source: 'unsubscribe_page' });
                router.push('/');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Back to Home
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unsubscribe from Emails</h1>
          <p className="text-muted-foreground">
            Are you sure you want to unsubscribe from <strong>{getEmailTypeName()}</strong>?
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {emailType === 'practice' && "You'll no longer receive daily practice reminders to help maintain your streak."}
            {emailType === 'weekly' && "You'll no longer receive weekly summaries of your learning progress."}
            {!emailType || emailType === 'all' ? "You'll stop receiving all emails from Language Shadowing." : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUnsubscribe}
            disabled={unsubscribing}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {unsubscribing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Unsubscribing...
              </>
            ) : (
              'Yes, Unsubscribe'
            )}
          </button>

          <button
            onClick={() => {
              track('Manage Preferences Clicked', { source: 'unsubscribe_page' });
              router.push('/settings');
            }}
            disabled={unsubscribing}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Settings className="w-4 h-4" />
            Manage Preferences Instead
          </button>

          <button
            onClick={() => {
              track('Cancel Unsubscribe Clicked');
              router.push('/');
            }}
            disabled={unsubscribing}
            className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

