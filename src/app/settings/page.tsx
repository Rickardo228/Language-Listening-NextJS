"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { EmailNotificationPreferencesModal } from '../components/EmailNotificationPreferencesModal';
import { track } from '../../lib/mixpanelClient';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      
      // Auto-open modal when user is loaded
      if (user) {
        setModalOpen(true);
        track('Settings Page Viewed');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClose = () => {
    setModalOpen(false);
    // Redirect to home after closing
    setTimeout(() => router.push('/'), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your settings.
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

  return (
    <>
      {/* Empty page - modal will overlay */}
      <div className="min-h-screen bg-background" />
      
      {/* Email preferences modal */}
      {user && (
        <EmailNotificationPreferencesModal
          isOpen={modalOpen}
          onClose={handleClose}
          user={user}
        />
      )}
    </>
  );
}


