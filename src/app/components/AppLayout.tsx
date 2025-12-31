'use client'

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { UserAvatar } from './UserAvatar';
import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import { track } from '../../lib/mixpanelClient';
import { SignInPage } from '../SignInPage';
import { OnboardingGuard } from './OnboardingGuard';
import { BottomNavigation } from './BottomNavigation';
import { shouldHideSidebar, shouldHideBottomNav, getCollectionIdFromPath, ROUTES, isPublicRoute } from '../routes';
import { LibraryManager } from './LibraryManager';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedPathname = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : null);
  const { user, isAuthLoading, userProfile } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const isPublicPath = isPublicRoute(resolvedPathname);

  // Don't show sidebar for certain routes
  const hideSidebar = shouldHideSidebar(resolvedPathname);

  // Extract current collection ID from URL for highlighting in sidebar
  const currentCollectionId = getCollectionIdFromPath(resolvedPathname);


  const handleHome = () => {
    track('Home Button Clicked', { source: 'header' });

    // On mobile, if on a collection page, navigate to library instead of home
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    const isOnCollectionPage = pathname.startsWith('/collection/');

    if (isMobile && isOnCollectionPage) {
      router.push(ROUTES.LIBRARY);
    } else {
      router.push(ROUTES.HOME);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !isPublicPath) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <SignInPage showLanguageSelect={true} />
      </div>
    );
  }

  const sidebarOffsetClass = pathname !== '/templates' && !hideSidebar && user
    ? (isCollapsed ? 'lg:pl-[60px]' : 'lg:pl-[460px]')
    : '';

  return (
    <OnboardingGuard>
      {/* Saved Configs List - hide for certain routes */}
      {pathname !== '/templates' && !hideSidebar && user && (
        <div className={`fixed top-0 h-screen pt-[74px] z-20 group hidden lg:flex flex-col gap-10 bg-background lg:bg-secondary/50 p-5 ${isCollapsed ? 'lg:w-[60px] overflow-hidden' : 'lg:w-[460px] min-w-[300px]'} max-w-[100vw] overflow-visible lg:overflow-y-auto transition-all duration-300`}>
          <LibraryManager
            mode="sidebar"
            currentCollectionId={currentCollectionId}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      )}

      <div className="font-sans min-h-screen flex flex-col bg-background text-foreground">
        {/* Nav */}
        <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-3 text-2xl cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleHome}
              title="Home"
            >
              <img
                src={theme === 'light' ? '/language-shadowing-logo-dark.png' : '/language-shadowing-logo-white.png'}
                alt="Language Shadowing Logo - Learn Languages Through Audio Practice"
                className="w-8 h-8 sm:ml-2 sm:mt-0.5"
              />
              <h1 className="hidden sm:block">Language Shadowing</h1>
            </div>
            <button
              onClick={handleHome}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
              title="Home"
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                track('Theme Toggle Clicked', { newTheme: theme === 'light' ? 'dark' : 'light' });
                toggleTheme();
              }}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Sun className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
            {user && (
              <UserAvatar
                user={user}
              />
            )}
          </div>
        </div>

        {/* Main content */}
        <div className={`flex flex-col-reverse w-full ${sidebarOffsetClass}`}>

          {/* Main Content Area */}
          <div className={`flex-1 ${!shouldHideBottomNav(pathname) && user ? 'pb-20 lg:pb-0' : ''}`}>
            {children}
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        {!shouldHideBottomNav(pathname) && user && <BottomNavigation />}
      </div>
    </OnboardingGuard>
  );
}
