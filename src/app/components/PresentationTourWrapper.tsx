'use client';

import { ReactNode, useEffect, useRef, useCallback, useState, createContext, useContext } from 'react';
import { TourProvider, useTour, StepType } from '@reactour/tour';

const TOUR_STORAGE_KEY = 'presentation-tour-completed';

// Toggle this to enable/disable the tour feature
const TOUR_ENABLED = false;

// Context to share tour state with child components
const TourActiveContext = createContext<boolean>(false);

export function useTourActive() {
  return useContext(TourActiveContext);
}

// Desktop tour steps
const desktopSteps: StepType[] = [
  {
    selector: '[data-tour="progress-bar"]',
    content: 'This progress bar shows how far along you are in your phrase list.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="close-button"]',
    content: 'Click here to exit fullscreen mode and return to the main view.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="like-button"]',
    content: 'Save phrases you want to practice more by clicking the heart icon.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="settings-button"]',
    content: 'Access settings to customize your learning experience.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="play-pause-button"]',
    content: 'Pause or resume automatic playback at any time.',
    position: 'top',
  },
  {
    selector: '[data-tour="nav-previous"]',
    content: 'Go back to the previous phrase.',
    position: 'right',
  },
  {
    selector: '[data-tour="nav-next"]',
    content: 'Move to the next phrase. You can also click the right side of the screen.',
    position: 'left',
  },
  {
    selector: '[data-tour="phrase-counter"]',
    content: 'See which phrase you\'re on and how many remain.',
    position: 'top',
  },
];

// Mobile tour steps (simplified)
const mobileSteps: StepType[] = [
  {
    selector: '[data-tour="close-button-mobile"]',
    content: 'Tap here to exit fullscreen.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="play-pause-button"]',
    content: 'Pause or resume playback.',
    position: 'top',
  },
  {
    selector: '[data-tour="nav-buttons-mobile"]',
    content: 'Navigate between phrases. You can also swipe or tap the edges of the screen.',
    position: 'top',
  },
  {
    selector: '[data-tour="phrase-counter"]',
    content: 'Track your progress through the phrase list.',
    position: 'left',
  },
];

interface TourControllerProps {
  fullScreen: boolean;
  isMobile: boolean;
  onTourStateChange: (isOpen: boolean) => void;
}

function TourController({ fullScreen, isMobile, onTourStateChange }: TourControllerProps) {
  const { setIsOpen, setSteps, setCurrentStep, isOpen } = useTour();
  const hasTriggered = useRef(false);

  // Notify parent when tour state changes
  useEffect(() => {
    onTourStateChange(isOpen);
  }, [isOpen, onTourStateChange]);

  const checkShouldShowTour = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    return completed !== 'true';
  }, []);

  const markTourCompleted = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  // Trigger tour when entering fullscreen for the first time
  useEffect(() => {
    if (!TOUR_ENABLED) return;
    if (fullScreen && !hasTriggered.current && checkShouldShowTour()) {
      hasTriggered.current = true;

      // Delay to ensure DOM elements are rendered (especially for portal)
      const timer = setTimeout(() => {
        const steps = isMobile ? mobileSteps : desktopSteps;

        // Filter steps to only include those with existing elements
        const validSteps = steps.filter(step => {
          if (typeof step.selector === 'string') {
            return document.querySelector(step.selector) !== null;
          }
          return true;
        });

        if (validSteps.length > 0 && setSteps && setCurrentStep) {
          setSteps(validSteps);
          setCurrentStep(0);
          setIsOpen(true);
          markTourCompleted();
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [fullScreen, isMobile, checkShouldShowTour, markTourCompleted, setSteps, setCurrentStep, setIsOpen]);

  // Reset trigger when exiting fullscreen
  useEffect(() => {
    if (!fullScreen) {
      hasTriggered.current = false;
      setIsOpen(false);
    }
  }, [fullScreen, setIsOpen]);

  return null;
}

interface PresentationTourWrapperProps {
  children: ReactNode;
  fullScreen: boolean;
}

export function PresentationTourWrapper({ children, fullScreen }: PresentationTourWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTourStateChange = useCallback((isOpen: boolean) => {
    setIsTourOpen(isOpen);
  }, []);

  return (
    <TourProvider
      steps={[]}
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
        badge: (base) => ({
          ...base,
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        }),
        controls: (base) => ({
          ...base,
          marginTop: '16px',
        }),
        close: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
          right: 8,
          top: 8,
        }),
        dot: (base, state) => ({
          ...base,
          backgroundColor: state?.current ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
        }),
        arrow: (base) => ({
          ...base,
          color: 'hsl(var(--foreground))',
        }),
      }}
      padding={{ mask: 8, popover: [8, 12] }}
      showBadge={true}
      showCloseButton={true}
      disableInteraction={false}
      onClickMask={({ setIsOpen }: { setIsOpen: (value: boolean) => void }) => setIsOpen(false)}
    >
      <TourActiveContext.Provider value={isTourOpen}>
        <TourController
          fullScreen={fullScreen}
          isMobile={isMobile}
          onTourStateChange={handleTourStateChange}
        />
        {children}
      </TourActiveContext.Provider>
    </TourProvider>
  );
}

// Export a function to reset the tour (for testing or settings)
export function resetPresentationTour() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }
}

export default PresentationTourWrapper;
