'use client'

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Home, Sun, Moon, CircleCheck } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { UserAvatar } from './UserAvatar';
import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import { track } from '../../lib/mixpanelClient';
import { SignInPage } from '../SignInPage';
import { OnboardingGuard } from './OnboardingGuard';
import { PaywallGuard } from './PaywallGuard';
import { BottomNavigation } from './BottomNavigation';
import { shouldHideSidebar, shouldHideBottomNav, shouldHideTopNav, getCollectionIdFromPath, ROUTES, isPublicRoute, isLandingPage, isTemplatesPage, isCollectionDetailPage } from '../routes';
import { LibraryManager } from './LibraryManager';
import { Button } from './ui/Button';
import { CheckoutSuccessHandler } from './CheckoutSuccessHandler';
import { Modal } from './ui';
import Link from 'next/link';
import { TourProvider, useTour, StepType } from '@reactour/tour';

const createListTourSteps: StepType[] = [
  {
    selector: '[data-tour="create-list"]',
    content: 'Create your own custom phrase list to practice with.',
    position: 'bottom',
  },
];

function CreateListTourController({ shouldOpen, onClose }: { shouldOpen: boolean; onClose: () => void }) {
  const { setIsOpen, isOpen } = useTour();
  const hasOpened = useRef(false);

  useEffect(() => {
    if (shouldOpen && !hasOpened.current) {
      hasOpened.current = true;
      setIsOpen(true);
    }
  }, [shouldOpen, setIsOpen]);

  useEffect(() => {
    if (hasOpened.current && !isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  return null;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedPathname = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : null);
  const { user, isAuthLoading, userProfile, refreshUserClaims, hasTrialed } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [showCreateListTour, setShowCreateListTour] = useState(false);
  const checkoutSuccessTrackedRef = useRef(false);
  const checkoutSuccessSourceRef = useRef<'query_param' | 'cookie' | 'session_storage' | 'unknown' | null>(null);

  const isPublicPath = isPublicRoute(resolvedPathname);
  const isOnLandingPage = isLandingPage(resolvedPathname);

  // Don't show sidebar for certain routes
  const hideSidebar = shouldHideSidebar(resolvedPathname);
  const hideTopNav = shouldHideTopNav(resolvedPathname);

  // Extract current collection ID from URL for highlighting in sidebar
  const currentCollectionId = getCollectionIdFromPath(resolvedPathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(searchParams?.toString() || window.location.search);
    const hasCheckoutSuccessParam = params.get('checkout') === 'success';
    const cookieMatch = document.cookie.match(/(?:^|;\s*)checkout-success=([^;]+)/);
    const hasCheckoutSuccessCookie = cookieMatch?.[1] === '1';
    if (hasCheckoutSuccessParam || hasCheckoutSuccessCookie) {
      if (!checkoutSuccessSourceRef.current) {
        checkoutSuccessSourceRef.current = hasCheckoutSuccessParam ? 'query_param' : 'cookie';
      }
      try {
        sessionStorage.setItem('checkout-success', '1');
      } catch (error) {
        console.warn('Unable to persist checkout success flag:', error);
      }
      if (hasCheckoutSuccessParam) {
        params.delete('checkout');
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
        router.replace(nextUrl);
      }
      if (hasCheckoutSuccessCookie) {
        document.cookie = 'checkout-success=; path=/; max-age=0; SameSite=Lax';
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!user) return;
    let shouldShow = false;
    try {
      shouldShow = sessionStorage.getItem('checkout-success') === '1';
    } catch (error) {
      console.warn('Unable to read checkout success flag:', error);
    }
    if (!shouldShow) return;
    try {
      sessionStorage.removeItem('checkout-success');
    } catch (error) {
      console.warn('Unable to clear checkout success flag:', error);
    }
    if (!checkoutSuccessSourceRef.current) {
      checkoutSuccessSourceRef.current = 'session_storage';
    }
    if (!checkoutSuccessTrackedRef.current) {
      track('Checkout Success', { source: checkoutSuccessSourceRef.current ?? 'unknown' });
      checkoutSuccessTrackedRef.current = true;
    }
    refreshUserClaims();
    setShowCheckoutSuccessModal(true);
  }, [user, refreshUserClaims, pathname, searchParams]);


  const handleCheckoutModalClose = useCallback(() => {
    setShowCheckoutSuccessModal(false);
    // Show create list tour on desktop only for new trial users
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop && !hasTrialed) {
      setTimeout(() => setShowCreateListTour(true), 400);
    }
  }, [hasTrialed]);

  const handleTourClose = useCallback(() => {
    setShowCreateListTour(false);
  }, []);

  const handleHome = () => {
    track('Home Button Clicked', { source: 'header' });

    // If on landing page and not logged in, stay on landing page
    if (isOnLandingPage && !user) {
      router.push(ROUTES.LANDING);
      return;
    }

    // On mobile, if on a collection page, navigate to library instead of home
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    const isOnCollectionPage = isCollectionDetailPage(resolvedPathname);

    if (isMobile && isOnCollectionPage) {
      router.push(ROUTES.LIBRARY);
    } else {
      router.push(ROUTES.HOME);
    }
  };

  // Only show loading spinner for private routes
  // Public routes (like landing page) should render immediately for SSR
  if (isAuthLoading && !isPublicPath) {
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

  const isOnTemplatesPage = isTemplatesPage(resolvedPathname);

  const sidebarOffsetClass = !isOnTemplatesPage && !hideSidebar && user
    ? (isCollapsed ? 'lg:pl-[60px]' : 'lg:pl-[460px]')
    : '';

  return (
    <OnboardingGuard>
      <PaywallGuard>
        <TourProvider
          steps={createListTourSteps}
          onClickMask={({ setIsOpen }) => setIsOpen(false)}
          showBadge={false}
          showCloseButton={true}
          showNavigation={false}
          showDots={false}
          showPrevNextButtons={false}
          disableInteraction={false}
          padding={{ mask: 8, popover: [8, 12] }}
          styles={{
            popover: (base) => ({
              ...base,
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
              maxWidth: '300px',
              border: '1px solid hsl(var(--border))',
            }),
            maskArea: (base) => ({
              ...base,
              rx: 8,
            }),
            maskWrapper: (base) => ({
              ...base,
              color: 'rgba(0, 0, 0, 0.7)',
            }),
            close: (base) => ({
              ...base,
              color: 'hsl(var(--foreground))',
              right: 8,
              top: 8,
            }),
          }}
        >
        <CreateListTourController shouldOpen={showCreateListTour} onClose={handleTourClose} />
        <CheckoutSuccessHandler />
        {/* Saved Configs List - hide for certain routes */}
        {!isOnTemplatesPage && !hideSidebar && user && (
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
          {!hideTopNav && (
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
                {/* Only show home button when not on landing page */}
                {!isOnLandingPage && (
                  <button
                    onClick={handleHome}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
                    title="Home"
                  >
                    <Home className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Landing page CTA buttons when not logged in */}
                {isOnLandingPage && !user && (
                  <>
                    <Link href={`${ROUTES.SIGNIN}?mode=signin`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => track('Landing Page Login Clicked')}
                      >
                        Log in
                      </Button>
                    </Link>
                    <Link href={ROUTES.GET_STARTED}>
                      <Button
                        size="sm"
                        onClick={() => track('Landing Page Get Started Clicked')}
                      >
                        Get started
                      </Button>
                    </Link>
                  </>
                )}

                {/* Theme toggle - always show */}
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

                {/* User avatar when logged in */}
                {user && (
                  <UserAvatar
                    user={user}
                  />
                )}
              </div>
            </div>
          )}

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
        <Modal
          isOpen={showCheckoutSuccessModal}
          onClose={handleCheckoutModalClose}
          title={hasTrialed ? 'You\u2019re all set!' : 'Welcome aboard!'}
          subtitle={hasTrialed
            ? 'Your account is active.'
            : 'Your free trial is active and everything is unlocked.'}
          icon={<CircleCheck className="w-6 h-6 text-green-600" />}
          footer={(
            <Button
              onClick={() => {
                track('Checkout Success Modal Continue Clicked');
                handleCheckoutModalClose();
              }}
            >
              Start learning
            </Button>
          )}
          enableBlur={true}
        >
          <p className="text-sm text-muted-foreground">
            {hasTrialed
              ? 'We updated your account status and opened the full library, unlimited custom phrases, and progress tracking. Jump in whenever you\u2019re ready.'
              : 'We refreshed your account status and unlocked the full library, unlimited custom phrases, and progress tracking. Jump into your first session whenever you are ready.'}
          </p>
        </Modal>
        </TourProvider>
      </PaywallGuard>
    </OnboardingGuard>
  );
}
