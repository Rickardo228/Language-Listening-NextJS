'use client'

import { usePathname, useRouter } from 'next/navigation';
import { track } from '../../lib/mixpanelClient';
import { ROUTES } from '../routes';

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const isHomePath = pathname === ROUTES.HOME || pathname === ROUTES.TEMPLATES;
  const isLibraryPath = pathname === ROUTES.LIBRARY;

  const handleHomeClick = () => {
    track('Bottom Nav Home Clicked');
    router.push(ROUTES.HOME);
  };

  const handleLibraryClick = () => {
    track('Bottom Nav Library Clicked');
    router.push(ROUTES.LIBRARY);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isHomePath ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isHomePath ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </button>

        <button
          onClick={handleLibraryClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isLibraryPath ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isLibraryPath ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <rect x="4" y="6" width="3" height="12" rx="0.5" />
            <rect x="9" y="4" width="3" height="16" rx="0.5" />
            <rect x="14" y="8" width="3" height="8" rx="0.5" />
          </svg>
          <span className="text-xs mt-1">Library</span>
        </button>
      </div>
    </div>
  );
}
