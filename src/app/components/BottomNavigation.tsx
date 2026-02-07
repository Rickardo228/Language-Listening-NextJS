'use client'

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, Plus } from 'lucide-react';
import { track } from '../../lib/mixpanelClient';
import { ROUTES } from '../routes';
import { useTour } from '@reactour/tour';

const LAST_TAB_KEY = 'bottom-nav-last-tab';

/**
 * YouTube-style Bottom Navigation Component
 *
 * Key features:
 * - Solid backgrounds (no blur, no transparency): bg-white / dark:bg-[#1C1C1E]
 * - Clear active states: active = black/white, inactive = grey
 * - Accessible: proper ARIA labels, aria-current, large touch targets (min 44x44px)
 * - Safe area aware for notched devices
 */

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const tour = useTour();
  const isHomePath = pathname === ROUTES.HOME || pathname === ROUTES.TEMPLATES;
  const isLibraryPath = pathname === ROUTES.LIBRARY;

  // Redirect to last selected tab when landing on home (mobile only)
  useEffect(() => {
    if (!isHomePath || window.innerWidth >= 1024) return;
    const lastTab = localStorage.getItem(LAST_TAB_KEY);
    if (lastTab === 'library') {
      router.replace(ROUTES.LIBRARY);
    }
  }, [isHomePath, router]);

  const handleHomeClick = () => {
    localStorage.setItem(LAST_TAB_KEY, 'home');
    track('Bottom Nav Home Clicked');
    router.push(ROUTES.HOME);
  };

  const handleCreateClick = () => {
    if (tour.isOpen) track('Create List Tour CTA Clicked', { platform: 'mobile' });
    tour.setIsOpen(false);
    track('Bottom Nav Create Clicked');
    router.push(ROUTES.LIBRARY + '?create=true');
  };

  const handleLibraryClick = () => {
    localStorage.setItem(LAST_TAB_KEY, 'library');
    track('Bottom Nav Library Clicked');
    router.push(ROUTES.LIBRARY);
  };

  // Shared classes for nav items
  // Touch target: h-full ensures ~64px height (16 * 4 = 64px base container)
  const navItemBase = "flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors";

  // Active state: black in light mode, white in dark mode
  const activeClasses = "text-black dark:text-white";

  // Inactive state: medium grey in light mode, light grey in dark mode
  const inactiveClasses = "text-gray-600 dark:text-gray-400";

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-gray-800 z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {/* Home Tab */}
        <button
          onClick={handleHomeClick}
          className={`${navItemBase} ${isHomePath ? activeClasses : inactiveClasses}`}
          aria-label="Home"
          aria-current={isHomePath ? 'page' : undefined}
        >
          <Home
            className="w-6 h-6"
            fill={isHomePath ? 'currentColor' : 'none'}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className={`text-xs mt-1 ${isHomePath ? 'font-medium' : 'font-normal'}`}>
            Home
          </span>
        </button>

        {/* Create Button */}
        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center -mt-5"
          aria-label="Create list"
          data-tour="create-list-mobile"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-lg">
            <Plus className="w-6 h-6 text-white" strokeWidth={2} aria-hidden="true" />
          </div>
        </button>

        {/* Library Tab */}
        <button
          onClick={handleLibraryClick}
          className={`${navItemBase} ${isLibraryPath ? activeClasses : inactiveClasses}`}
          aria-label="Library"
          aria-current={isLibraryPath ? 'page' : undefined}
        >
          <Library
            className="w-6 h-6"
            fill={isLibraryPath ? 'currentColor' : 'none'}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className={`text-xs mt-1 ${isLibraryPath ? 'font-medium' : 'font-normal'}`}>
            Library
          </span>
        </button>
      </div>
    </div>
  );
}
