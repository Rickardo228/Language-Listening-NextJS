'use client'

import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';
import { track } from '../../../lib/mixpanelClient';
import { LibraryManager } from '../../components/LibraryManager';
import { ROUTES } from '../../routes';

export default function LibraryPage() {
  const router = useRouter();
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
          <p>Please sign in to view your library.</p>
          <button
            onClick={() => {
              track('Back to Home From Library Clicked');
              router.push(ROUTES.HOME);
            }}
            className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 max-w-[600px] mx-auto">
      <LibraryManager mode="page" />
    </div>
  );
}
