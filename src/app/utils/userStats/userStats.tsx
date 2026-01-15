import {
  getFirestore,
  doc,
  increment,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { Phrase } from "../../types";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../../contexts/UserContext";
import { AnimatePresence } from "framer-motion";
import { UserStatsModal } from "../../components/UserStatsModal";
import { ListCompletionScreen } from "../../components/ListCompletionScreen";
import { trackPhrasesListenedPopup } from "../../../lib/mixpanelClient";
import { getPhraseRankTitle, DEBUG_MILESTONE_THRESHOLDS } from "../rankingSystem";
import { useRouter } from "next/navigation";
import { createOrUpdateUserProfile } from "../userPreferences";
import { Check } from "lucide-react";
import { SnackbarPopup } from "./SnackbarPopup";
import { MilestoneCelebrationPopup } from "./MilestoneCelebrationPopup";
import { MilestoneInfo } from "./types";

const firestore = getFirestore();

// Utility function for timezone-aware date handling
// Always returns ISO format (YYYY-MM-DD) regardless of browser locale
export function getUserLocalDateBoundary(timezone?: string, date?: Date): string {
  const targetDate = date || new Date();

  // Use provided timezone or detect from browser
  const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Use Intl.DateTimeFormat with 'en-US' locale to ensure consistent numeric output
  // This ensures we always get "2025" not "2025年" regardless of browser locale
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: userTimezone,
    calendar: 'gregory', // Ensure Gregorian calendar
  });

  // Format the date and extract parts
  const parts = formatter.formatToParts(targetDate);

  // Extract parts and ensure proper formatting
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';

  // Return in YYYY-MM-DD format (always ISO, regardless of browser locale)
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Debug mode for testing milestones - ONLY for development, never in production
const DEBUG_MILESTONE_MODE = process.env.NODE_ENV === 'development' && false;

// Use the shared debug milestone thresholds (unused in this file but kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEBUG_MILESTONES = DEBUG_MILESTONE_THRESHOLDS;

// Dynamic streak messaging system
export function getStreakMessage(streakCount: number): { emoji: string; message: string } {
  const messages = [
    // Day 1-7: First week - daily changes
    { range: [1, 1], emoji: "🌱", message: "STREAK STARTED!" },
    { range: [2, 2], emoji: "💪", message: "BUILDING MOMENTUM!" },
    { range: [3, 3], emoji: "⚡", message: "GAINING POWER!" },
    { range: [4, 4], emoji: "🔥", message: "ON FIRE!" },
    { range: [5, 5], emoji: "🚀", message: "ROCKETING UP!" },
    { range: [6, 6], emoji: "⭐", message: "SHINING BRIGHT!" },
    { range: [7, 7], emoji: "👑", message: "WEEK CHAMPION!" },

    // Day 8-14: Second week
    { range: [8, 8], emoji: "💎", message: "DIAMOND STREAK!" },
    { range: [9, 9], emoji: "🎯", message: "PRECISION MODE!" },
    { range: [10, 10], emoji: "🌪️", message: "TORNADO POWER!" },
    { range: [11, 11], emoji: "🏆", message: "TROPHY LEVEL!" },
    { range: [12, 12], emoji: "🎨", message: "MASTERY MODE!" },
    { range: [13, 13], emoji: "⚔️", message: "WARRIOR SPIRIT!" },
    { range: [14, 14], emoji: "🎪", message: "TWO WEEK CIRCUS!" },

    // Day 15-21: Third week
    { range: [15, 15], emoji: "🌟", message: "SUPERSTAR!" },
    { range: [16, 16], emoji: "🎭", message: "PERFORMANCE PEAK!" },
    { range: [17, 17], emoji: "🎸", message: "ROCKSTAR LEVEL!" },
    { range: [18, 18], emoji: "🎲", message: "LUCKY STREAK!" },
    { range: [19, 19], emoji: "🎊", message: "CELEBRATION TIME!" },
    { range: [20, 20], emoji: "🎯", message: "BULLSEYE PRECISION!" },
    { range: [21, 21], emoji: "🎪", message: "THREE WEEK SHOW!" },

    // Day 22-30: Month milestone
    { range: [22, 24], emoji: "🔮", message: "CRYSTAL CLEAR!" },
    { range: [25, 27], emoji: "🎨", message: "ARTISTIC GENIUS!" },
    { range: [28, 30], emoji: "🏰", message: "MONTH KINGDOM!" },

    // Day 31-60: Habit formation
    { range: [31, 35], emoji: "👑", message: "HABIT ROYALTY!" },
    { range: [36, 40], emoji: "🎭", message: "MASTER PERFORMER!" },
    { range: [41, 45], emoji: "🎪", message: "CIRCUS DIRECTOR!" },
    { range: [46, 50], emoji: "🌟", message: "CONSTELLATION!" },
    { range: [51, 55], emoji: "🏅", message: "OLYMPIC LEVEL!" },
    { range: [56, 60], emoji: "🚀", message: "SPACE MISSION!" },

    // Day 61-100: Elite tier
    { range: [61, 70], emoji: "💫", message: "COSMIC POWER!" },
    { range: [71, 80], emoji: "🌌", message: "GALAXY MASTER!" },
    { range: [81, 90], emoji: "⭐", message: "STELLAR PERFORMANCE!" },
    { range: [91, 100], emoji: "🌈", message: "RAINBOW WARRIOR!" },

    // Day 101-365: Legendary
    { range: [101, 150], emoji: "🏛️", message: "TEMPLE GUARDIAN!" },
    { range: [151, 200], emoji: "🗿", message: "MONUMENT STATUS!" },
    { range: [201, 250], emoji: "🏔️", message: "MOUNTAIN CLIMBER!" },
    { range: [251, 300], emoji: "🌋", message: "VOLCANO POWER!" },
    { range: [301, 365], emoji: "🎆", message: "YEAR-LONG LEGEND!" },

    // Day 366+: Mythical
    { range: [366, 500], emoji: "🔥", message: "ETERNAL FLAME!" },
    { range: [501, 750], emoji: "⚡", message: "LIGHTNING DEITY!" },
    { range: [751, 1000], emoji: "🌟", message: "CELESTIAL BEING!" },
    { range: [1001, Infinity], emoji: "🌈", message: "TRANSCENDENT!" }
  ];

  for (const msg of messages) {
    if (streakCount >= msg.range[0] && streakCount <= msg.range[1]) {
      return { emoji: msg.emoji, message: msg.message };
    }
  }

  // Fallback
  return { emoji: "🔥", message: "ON FIRE!" };
}

// Function to get appropriate background style based on rank color - solid and readable
// For standalone milestone popups (high contrast needed)
function getMilestoneBackgroundStyle(color: string): string {
  if (color.includes('amber') || color.includes('yellow')) {
    return 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-400 dark:from-amber-900 dark:to-yellow-800 dark:border-amber-600';
  } else if (color.includes('purple')) {
    return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400 dark:from-purple-900 dark:to-purple-800 dark:border-purple-600';
  } else if (color.includes('blue')) {
    return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 dark:from-blue-900 dark:to-blue-800 dark:border-blue-600';
  } else if (color.includes('green')) {
    return 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 dark:from-green-900 dark:to-green-800 dark:border-green-600';
  } else if (color.includes('orange')) {
    return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400 dark:from-orange-900 dark:to-orange-800 dark:border-orange-600';
  } else {
    return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 dark:from-gray-800 dark:to-gray-700 dark:border-gray-500';
  }
}

// Function to get text color that ensures good contrast on milestone backgrounds
function getMilestoneTextColor(color: string): string {
  if (color.includes('amber') || color.includes('yellow')) {
    return 'text-amber-900 dark:text-amber-100';
  } else if (color.includes('purple')) {
    return 'text-purple-900 dark:text-purple-100';
  } else if (color.includes('blue')) {
    return 'text-blue-900 dark:text-blue-100';
  } else if (color.includes('green')) {
    return 'text-green-900 dark:text-green-100';
  } else if (color.includes('orange')) {
    return 'text-orange-900 dark:text-orange-100';
  } else {
    return 'text-gray-900 dark:text-gray-100';
  }
}

// Function to get background style for recent milestones in phrases popup
// Uses darker, more saturated colors to stand out against gold/blue popup backgrounds
function getRecentMilestoneBackgroundStyle(color: string, popupType: 'listened' | 'viewed'): string {
  const isListened = popupType === 'listened';

  if (color.includes('amber') || color.includes('yellow')) {
    // For yellow/amber milestones, use darker colors to contrast with gold popup
    if (isListened) {
      // On gold background, use darker amber/orange tones
      return 'bg-gradient-to-br from-amber-600 to-orange-600 border-amber-700 dark:from-amber-800 dark:to-orange-800 dark:border-amber-900';
    } else {
      // On blue background, amber/yellow works fine
      return 'bg-gradient-to-br from-amber-500 to-yellow-500 border-amber-600 dark:from-amber-700 dark:to-yellow-700 dark:border-amber-800';
    }
  } else if (color.includes('purple')) {
    return 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-700 dark:from-purple-700 dark:to-purple-800 dark:border-purple-900';
  } else if (color.includes('blue')) {
    // For blue milestones on blue popup, use darker shade
    if (!isListened) {
      return 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-800 dark:from-blue-800 dark:to-blue-900 dark:border-blue-950';
    } else {
      return 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-700 dark:from-blue-700 dark:to-blue-800 dark:border-blue-900';
    }
  } else if (color.includes('green')) {
    return 'bg-gradient-to-br from-green-500 to-green-600 border-green-700 dark:from-green-700 dark:to-green-800 dark:border-green-900';
  } else if (color.includes('orange')) {
    return 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-700 dark:from-orange-700 dark:to-orange-800 dark:border-orange-900';
  } else {
    return 'bg-gradient-to-br from-gray-500 to-gray-600 border-gray-700 dark:from-gray-700 dark:to-gray-800 dark:border-gray-900';
  }
}

// Function to get text color for recent milestones (always white for contrast on darker backgrounds)
function getRecentMilestoneTextColor(): string {
  return 'text-white';
}

// Function to calculate current streak from daily stats
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function calculateStreak(userId: string): Promise<number> {
  try {
    const { collection, query, orderBy, limit, getDocs } = await import("firebase/firestore");
    const dailyStatsRef = collection(firestore, 'users', userId, 'stats', 'listening', 'daily');
    const recentQuery = query(dailyStatsRef, orderBy('date', 'desc'), limit(90)); // Check last 90 days for streak
    const snapshot = await getDocs(recentQuery);

    const dailyData = snapshot.docs.map(doc => ({
      date: doc.data().date,
      count: doc.data().count
    })).sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending

    let streak = 0;
    const userTimezone = getUserTimezone();
    const today = getUserLocalDateBoundary(userTimezone);
    const checkDate = new Date();

    for (let i = 0; i < 90; i++) {
      const dateStr = getUserLocalDateBoundary(userTimezone, checkDate);
      const dayData = dailyData.find(d => d.date === dateStr);

      if (dayData && dayData.count > 0) {
        streak++;
      } else if (dateStr === today) {
        // If today has no activity yet, don't break streak
        // Continue checking previous days
      } else {
        // Gap found, streak is broken
        break;
      }

      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// Sound playback utility
const playCompletionSound = () => {
  try {
    const audio = new Audio('/sounds/completion.wav');
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch(() => {
      // Silently fail - sound playback is non-critical
    });
  } catch {
    // Silently fail - sound initialization is non-critical
  }
};

export const useUpdateUserStats = () => {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [countToShow, setCountToShow] = useState(0);
  const [persistUntilInteraction, setPersistUntilInteraction] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [popupEventType, setPopupEventType] = useState<'listened' | 'viewed'>('listened');
  const [isListCompleted, setIsListCompleted] = useState(false);
  const [onGoAgainCallback, setOnGoAgainCallback] = useState<(() => void | Promise<void>) | null>(null);
  const [onGoNextCallback, setOnGoNextCallback] = useState<(() => void | Promise<void>) | null>(null);

  const phrasesListenedRef = useRef(0);
  const phrasesViewedRef = useRef(0);
  const isListCompletedRef = useRef(false);
  const popupCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const milestoneCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const { user, userProfile } = useUser();

  // New state for milestone celebration
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(true);
  const [milestoneInfo, setMilestoneInfo] = useState<MilestoneInfo | null>({
    // threshold: 0,
    title: "Welcome Aboard",
    color: "text-gray-400",
    count: 10,
    // nextMilestone: 10,
    description: "Every tap counts. Let's go.",
  });
  const [recentMilestones, setRecentMilestones] = useState<Array<MilestoneInfo>>([]);
  const totalPhrasesRef = useRef(0);
  const phraseCountSinceLastSync = useRef(0);
  const SYNC_AFTER_PHRASES = 10; // Re-sync every 10 phrases
  const [currentStreak, setCurrentStreak] = useState(0);
  const [, setPreviousStreak] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      // Clear any pending timeouts on unmount
      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }
      if (milestoneCloseTimeoutRef.current) {
        clearTimeout(milestoneCloseTimeoutRef.current);
        milestoneCloseTimeoutRef.current = null;
      }
    };
  }, []);

  // Initial fetch of total phrases count when user changes
  useEffect(() => {
    const fetchInitialTotal = async () => {
      if (!user) {
        totalPhrasesRef.current = 0;
        return;
      }

      if (DEBUG_MILESTONE_MODE) {
        // In debug mode, start from 0 regardless of database
        totalPhrasesRef.current = 0;
        phraseCountSinceLastSync.current = 0;
        return;
      }

      try {
        const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
        const { getDoc } = await import("firebase/firestore");
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
          const data = statsDoc.data();
          const listened = data.phrasesListened || 0;
          const viewed = data.phrasesViewed || 0;
          const total = listened + viewed;
          totalPhrasesRef.current = total;
          phraseCountSinceLastSync.current = 0;
        } else {
          totalPhrasesRef.current = 0;
          phraseCountSinceLastSync.current = 0;
        }
      } catch (error) {
        console.error("Error fetching initial total:", error);
        totalPhrasesRef.current = 0;
      }
    };

    fetchInitialTotal();
  }, [user]);

  const showStatsUpdate = useCallback((shouldPersistUntilInteraction: boolean = false, eventType: 'listened' | 'viewed' | 'both' = 'listened', listCompleted: boolean = false, onGoAgain?: () => void | Promise<void>, onGoNext?: () => void | Promise<void>) => {
    const listenedCount = phrasesListenedRef.current;
    const viewedCount = phrasesViewedRef.current;

    let shouldShowPopup = false;
    let displayCount = 0;
    let displayType = '';

    // List completion popups should always show, regardless of counter
    if (listCompleted) {
      shouldShowPopup = true;

      // Respect the eventType parameter - use appropriate counter and display type
      if (eventType === 'viewed') {
        displayCount = viewedCount > 0 ? viewedCount : 1;
        displayType = 'viewed';
        console.log('📊 List completed - showing completion popup with count:', viewedCount, '(viewed)');
        // Don't reset viewed counter
      } else {
        // Default to listened for 'listened' or 'both' event types
        displayCount = listenedCount > 0 ? listenedCount : 1;
        displayType = 'listened';
        console.log('📊 List completed - showing completion popup with count:', listenedCount, '(listened)');

      }
    } else if (eventType === 'listened' && listenedCount > 0) {
      shouldShowPopup = true;
      displayCount = listenedCount;
      displayType = 'listened';

    } else if (eventType === 'viewed' && viewedCount > 0) {
      shouldShowPopup = true;
      displayCount = viewedCount;
      displayType = 'viewed';
      // Don't reset viewed count - keep accumulating
    } else if (eventType === 'both' && (listenedCount > 0 || viewedCount > 0)) {
      shouldShowPopup = true;
      if (listenedCount > 0) {
        displayCount = listenedCount;
        displayType = 'listened';
      } else {
        displayCount = viewedCount;
        displayType = 'viewed';
      }
    }

    // Guard: Don't allow non-persistent popups to override list completion popups
    // This prevents milestone snackbars from closing the list completion modal
    if (isListCompletedRef.current && !listCompleted && !shouldPersistUntilInteraction) {
      return;
    }

    if (shouldShowPopup) {
      // Clear any pending close timeout from previous popups
      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }

      setShowPopup(true);
      setCountToShow(displayCount);
      setPersistUntilInteraction(shouldPersistUntilInteraction);
      setIsListCompleted(listCompleted);
      isListCompletedRef.current = listCompleted; // Sync ref for guard checks
      // Store the go again callback if provided (wrap in function to avoid React treating it as lazy initializer)
      setOnGoAgainCallback(listCompleted && onGoAgain ? () => onGoAgain : () => null);
      // Store the go next callback if provided (wrap in function to avoid React treating it as lazy initializer)
      setOnGoNextCallback(listCompleted && onGoNext ? () => onGoNext : () => null);

      // Store the event type for display purposes
      setPopupEventType(displayType as 'listened' | 'viewed');

      // Play completion sound if list is completed
      if (listCompleted) {
        playCompletionSound();
      }

      // Track popup show event (keep existing tracking for listened events)
      if (displayType === 'listened') {
        trackPhrasesListenedPopup(
          "show",
          displayCount,
          shouldPersistUntilInteraction,
          shouldPersistUntilInteraction ? "natural" : "manual"
        );
      }

      // Set up auto-close timeout for non-persistent popups
      if (!shouldPersistUntilInteraction) {
        const timeoutId = setTimeout(() => {
          setShowPopup(false);
          setPersistUntilInteraction(false);
          setIsListCompleted(false);
          isListCompletedRef.current = false; // Reset ref
          setOnGoAgainCallback(() => null);
          setOnGoNextCallback(() => null);
          popupCloseTimeoutRef.current = null;
        }, 2000);
        popupCloseTimeoutRef.current = timeoutId;
      }
    }
  }, []);

  // Function to increment viewed count and show popup at milestones
  const incrementViewedAndCheckMilestone = useCallback((threshold: number = 5) => {
    // Increment the counter immediately
    phrasesViewedRef.current += 1;
    const newCount = phrasesViewedRef.current;

    // Show popup on exact multiples of threshold (5, 10, 15, etc.)
    if (newCount % threshold === 0) {
      showStatsUpdate(false, 'viewed');
    }

    return newCount;
  }, [showStatsUpdate]);

  const closeStatsPopup = useCallback((source: "continue" | "escape" = "continue") => {
    // Track close action before closing
    if (showPopup) {
      trackPhrasesListenedPopup(
        source === "continue" ? "continue" : "escape_dismiss",
        countToShow,
        persistUntilInteraction
      );
    }

    // If this was a persistent popup with a streak shown, mark it as shown today
    if (persistUntilInteraction && currentStreak > 0) {
      const lastStreakShownDate = localStorage.getItem('lastStreakShownDate');
      const todayLocal = new Date().toLocaleDateString();
      // Only set if we haven't shown it today (meaning it was actually displayed in this popup)
      if (lastStreakShownDate !== todayLocal) {
        localStorage.setItem('lastStreakShownDate', todayLocal);
      }
    }

    // Clear any pending close timeout
    if (popupCloseTimeoutRef.current) {
      clearTimeout(popupCloseTimeoutRef.current);
      popupCloseTimeoutRef.current = null;
    }

    setShowPopup(false);
    setPersistUntilInteraction(false);
    setIsListCompleted(false);
    isListCompletedRef.current = false; // Reset ref
    setOnGoAgainCallback(() => null);
    setOnGoNextCallback(() => null);
    // Clear recent milestones when user dismisses the popup
    setRecentMilestones([]);
    phrasesListenedRef.current = 0;
    phrasesViewedRef.current = 0;
  }, [showPopup, countToShow, persistUntilInteraction, currentStreak]);

  const closeMilestoneCelebration = useCallback(() => {
    if (milestoneCloseTimeoutRef.current) {
      clearTimeout(milestoneCloseTimeoutRef.current);
      milestoneCloseTimeoutRef.current = null;
    }
    setShowMilestoneCelebration(false);
  }, []);

  const openStatsModal = () => {
    // Track view stats action before closing popup
    if (showPopup) {
      trackPhrasesListenedPopup(
        "view_stats",
        countToShow,
        persistUntilInteraction
      );
    }

    // Clear any pending close timeout
    if (popupCloseTimeoutRef.current) {
      clearTimeout(popupCloseTimeoutRef.current);
      popupCloseTimeoutRef.current = null;
    }

    setShowStatsModal(true);
    setShowPopup(false);
    setPersistUntilInteraction(false);
    isListCompletedRef.current = false; // Reset ref
    setOnGoNextCallback(() => null);
    // Clear recent milestones when user opens stats modal
    setRecentMilestones([]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopup && persistUntilInteraction) {
        closeStatsPopup("escape");
      }
    };

    if (showPopup && persistUntilInteraction) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopup, persistUntilInteraction, closeStatsPopup]);

  // Smart sync function - only fetches when needed
  const syncTotalIfNeeded = useCallback(async (force: boolean = false): Promise<void> => {
    if (!user) return;

    // Skip syncing in debug mode to avoid overwriting debug counts
    if (DEBUG_MILESTONE_MODE) {
      return;
    }

    // Only sync if forced or we've heard enough phrases since last sync
    if (!force && phraseCountSinceLastSync.current < SYNC_AFTER_PHRASES) {
      return;
    }

    try {
      const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
      const { getDoc } = await import("firebase/firestore");
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const data = statsDoc.data();
        const listened = data.phrasesListened || 0;
        const viewed = data.phrasesViewed || 0;
        const dbTotal = listened + viewed;

        // If database has more than our local count, update our local count
        // This handles cases where user used app on another device
        if (dbTotal > totalPhrasesRef.current) {
          totalPhrasesRef.current = dbTotal;
        }

        phraseCountSinceLastSync.current = 0;
      }
    } catch (error) {
      console.error("Error syncing total:", error);
    }
  }, [user]);

  // Force sync on collection/session changes
  const forceSyncTotal = useCallback(() => {
    syncTotalIfNeeded(true);
  }, [syncTotalIfNeeded]);

  const updateUserStats = useCallback(async (
    phrases: Phrase[],
    currentPhraseIndex: number,
    eventType: 'listened' | 'viewed' = 'listened',
    skipSessionIncrement: boolean = false
  ) => {
    if (!user) {
      return;
    }

    // Increment the session ref counter FIRST (before dev check) to ensure UI popups work in dev mode
    if (!skipSessionIncrement) {
      if (eventType === 'listened') {
        phrasesListenedRef.current += 1;
        const newListenedCount = phrasesListenedRef.current;

        // Show snackbar popup every 5 phrases listened
        if (newListenedCount % 5 === 0) {
          // Use setTimeout to avoid showing popup during the same render cycle
          setTimeout(() => {
            showStatsUpdate(false, 'listened');
          }, 100);
        }
      } else if (eventType === 'viewed') {
        phrasesViewedRef.current += 1;
      }
    }

    // // Skip Firestore updates in development environment (but keep session counters above)
    // if (process.env.NODE_ENV === 'development') {
    //   return;
    // }

    // Smart sync: every N phrases or when forced
    await syncTotalIfNeeded();

    // Use local tracking for milestone detection (much faster!)
    const currentTotal = totalPhrasesRef.current;
    const newTotal = currentTotal + 1;

    // Check for milestone achievement
    const currentRank = getPhraseRankTitle(currentTotal, DEBUG_MILESTONE_MODE);
    const newRank = getPhraseRankTitle(newTotal, DEBUG_MILESTONE_MODE);
    const milestoneReached = currentRank.title !== newRank.title;

    if (milestoneReached) {
      // Store milestone info for celebration
      const milestoneData = {
        title: newRank.title,
        color: newRank.color,
        description: newRank.description,
        count: newTotal
      };

      setMilestoneInfo(milestoneData);
      setRecentMilestones(prev => [milestoneData, ...prev.slice(0, 4)]); // Keep only last 5 milestones

      // Only show popup if autoplay is not active - prevents multiple interruptions
      // Milestones are still tracked and will show in list completion screen
      if (!isAutoplayActive) {
        setShowMilestoneCelebration(true);

        // Auto-close after 4 seconds
        if (milestoneCloseTimeoutRef.current) {
          clearTimeout(milestoneCloseTimeoutRef.current);
        }
        milestoneCloseTimeoutRef.current = setTimeout(() => {
          // setShowMilestoneCelebration(false);
        }, 4000);
      }
    }

    // Update total phrases ref
    totalPhrasesRef.current = newTotal;

    // Track phrases since last sync for smart syncing
    phraseCountSinceLastSync.current += 1;

    const now = new Date();
    const userTimezone = getUserTimezone();
    const todayLocal = getUserLocalDateBoundary(userTimezone);
    // Store the user's local date boundary for accurate timezone handling
    const todayLocalAsUTC = todayLocal; // Keep as local date for consistency

    // Get current phrase's languages
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) {
      return;
    }
    const { inputLang, targetLang } = currentPhrase;

    // Update lastActiveAt and timezone (only once per day or if timezone changed)
    try {
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const shouldUpdate = (() => {
        // Always update if no profile data
        if (!userProfile?.lastActiveAt) return true;

        // Update if timezone changed
        if (userProfile.timezone !== currentTimezone) return true;

        // Check if lastActiveAt is from a different day
        const lastActiveDate = getUserLocalDateBoundary(userTimezone, new Date(userProfile.lastActiveAt));
        const todayDate = getUserLocalDateBoundary(userTimezone);

        // Only update if it's a new day
        return lastActiveDate !== todayDate;
      })();

      if (shouldUpdate) {
        await createOrUpdateUserProfile(user.uid, {
          lastActiveAt: now.toISOString(),
          timezone: currentTimezone,
        });
      }
    } catch (error: unknown) {
      console.error('❌ Error updating user profile:', error);
      // Continue with stats update even if profile update fails
    }

    // Database-driven streak calculation BEFORE updating stats - no session storage dependency
    try {
      const statsRef = doc(firestore, "users", user.uid, "stats", "listening");

      // Use a transaction to ensure atomic streak updates
      await runTransaction(firestore, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const currentStats = statsDoc.exists() ? statsDoc.data() : {};

        // Check if streak was already calculated today by checking lastStreakCalculation
        const lastCalculation = currentStats.lastStreakCalculation;
        const lastCalculationDate = lastCalculation ?
          getUserLocalDateBoundary(userTimezone, new Date(lastCalculation)) : null;

        // Get the PREVIOUS activity date before we update it
        // CRITICAL: Use lastStreakCalculation instead of lastListenedAt for streak logic
        // because lastListenedAt gets updated multiple times per day, but lastStreakCalculation
        // only gets updated once per day when we actually calculate the streak
        const lastActivityDate = currentStats.lastStreakCalculation ?
          getUserLocalDateBoundary(userTimezone, new Date(currentStats.lastStreakCalculation)) : null;

        // Calculate streak based on database state
        let newStreak = currentStats.currentStreak || 0;
        let streakChangeReason = '';
        let newStreakStartDate = currentStats.streakStartDate || todayLocal;

        // Only recalculate streak if we haven't calculated for today yet
        if (lastCalculationDate !== todayLocal) {
          if (lastActivityDate !== todayLocal) {
            // Activity on a new day
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getUserLocalDateBoundary(userTimezone, yesterday);

            if (lastActivityDate === yesterdayStr) {
              // Consecutive day - increment streak
              newStreak = (currentStats.currentStreak || 0) + 1;
              streakChangeReason = 'incremented';
              // Keep existing streak start date (don't change it for consecutive days)
              // If somehow streakStartDate is missing, estimate yesterday's timestamp
              if (!currentStats.streakStartDate) {
                const yesterdayTimestamp = new Date(now);
                yesterdayTimestamp.setDate(yesterdayTimestamp.getDate() - 1);
                newStreakStartDate = yesterdayTimestamp.toISOString();
              } else {
                newStreakStartDate = currentStats.streakStartDate;
              }
            } else if (lastActivityDate === null) {
              // First time user - start streak at 1
              newStreak = 1;
              streakChangeReason = 'first_time';
              newStreakStartDate = now.toISOString();
            } else {
              // Gap found - reset streak to 1
              newStreak = 1;
              streakChangeReason = 'reset';
              newStreakStartDate = now.toISOString();
            }
          } else {
            // Same day activity - check if this is first time today
            if ((currentStats.currentStreak || 0) === 0) {
              // First time user on their first day - start streak at 1
              newStreak = 1;
              streakChangeReason = 'first_time_same_day';
              newStreakStartDate = now.toISOString();
            } else {
              // Same day - streak continues unchanged
              newStreak = currentStats.currentStreak || 0;
            }
          }
        }

        // Update both stats and streak data in one transaction
        // Use set with merge to create document if it doesn't exist (for new users)
        transaction.set(statsRef, {
          currentStreak: newStreak,
          lastStreakCalculation: now.toISOString(),
          streakStartDate: newStreakStartDate,
          streakChangeReason,
          ...(eventType === 'listened' && {
            phrasesListened: increment(1),
            lastListenedAt: now.toISOString()
          }),
          ...(eventType === 'viewed' && {
            phrasesViewed: increment(1),
            lastViewedAt: now.toISOString()
          })
        }, { merge: true });

        // Update UI state for streak display and animation
        setPreviousStreak(currentStats.currentStreak || 0);
        setCurrentStreak(newStreak);
      });
    } catch (err: unknown) {
      console.error("❌ Error updating user stats:", err);
    }

    // Update the daily stats - store with full timestamp for timezone accuracy
    try {
      const dailyStatsRef = doc(
        firestore,
        "users",
        user.uid,
        "stats",
        "listening",
        "daily",
        todayLocalAsUTC
      );
      await setDoc(dailyStatsRef, {
        lastUpdated: now.toISOString(),
        timestamp: now.toISOString(), // Store full timestamp for timezone accuracy
        totalCount: increment(1), // Denormalized field: total of listened + viewed
        date: todayLocalAsUTC, // Add date field for new documents
        dateLocal: todayLocal, // Add dateLocal field for new documents
        count: increment(eventType === 'listened' ? 1 : 0), // Always initialize both fields
        countViewed: increment(eventType === 'viewed' ? 1 : 0), // Always initialize both fields
        ...(eventType === 'listened' && {
          countListened: increment(1) // Duplicate for future migration
        })
      }, { merge: true }).catch((err: unknown) => {
        console.error("❌ Error updating daily stats:", err);
      });

      // Update language stats
      const languageStatsRef = doc(
        firestore,
        "users",
        user.uid,
        "stats",
        "listening",
        "languages",
        `${inputLang}-${targetLang}`
      );
      await setDoc(languageStatsRef, {
        count: increment(1),
        lastUpdated: now.toISOString(),
        inputLang,
        targetLang,
        firstListened: now.toISOString(), // Add firstListened for new documents
      }, { merge: true }).catch((err: unknown) => {
        console.error("❌ Error updating language stats:", err);
      });

    } catch (err: unknown) {
      console.error("❌ Error in main stats update:", err);
    }

    // Stats update completed successfully
  }, [user, userProfile, syncTotalIfNeeded, showStatsUpdate]);

  const StatsPopups = mounted ? createPortal(
    <AnimatePresence mode="wait">
      {/* Milestone Celebration Popup */}
      {/* Fullscreen List Completion - Two Step Flow */}
      {showPopup && isListCompleted && user && (
        <ListCompletionScreen
          key="list-completion"
          isOpen={true}
          onClose={closeStatsPopup}
          currentStreak={currentStreak}
          getStreakMessage={getStreakMessage}
          onGoAgain={onGoAgainCallback || undefined}
          onGoNext={onGoNextCallback || undefined}
          userId={user.uid}
          sessionListened={phrasesListenedRef.current}
          sessionViewed={phrasesViewedRef.current}
          recentMilestones={recentMilestones}
        />
      )}

      {/* Regular Snackbar Popup for non-completion milestones */}
      {showPopup && !isListCompleted && (
        <SnackbarPopup
          key="snackbar-popup"
          eventType={popupEventType}
          count={countToShow}
        />
      )}

      {/* Milestone Celebration Popup */}
      {showMilestoneCelebration && milestoneInfo && (
        <MilestoneCelebrationPopup
          key="milestone-celebration"
          milestoneInfo={milestoneInfo}
          backgroundClass={getMilestoneBackgroundStyle(milestoneInfo.color)}
          textClass={getMilestoneTextColor(milestoneInfo.color)}
          onClose={closeMilestoneCelebration}
          showButton={false}
          autoHide
        />
      )}
    </AnimatePresence>,
    document.body
  ) : null;

  const StatsModal = user && showStatsModal ? (
    <UserStatsModal
      isOpen={showStatsModal}
      onClose={() => setShowStatsModal(false)}
      user={user}
    />
  ) : null;

  // Initialize the viewed counter to 1 (accounts for viewing the first phrase)
  const initializeViewedCounter = useCallback(async (phrases: Phrase[], phraseIndex: number) => {
    phrasesViewedRef.current = 1;
    // Write to Firestore to keep session counter and database in sync
    await updateUserStats(phrases, phraseIndex, 'viewed', true);
  }, [updateUserStats]);

  return {
    updateUserStats,
    StatsPopups,
    StatsModal,
    showStatsUpdate,
    closeStatsPopup,
    forceSyncTotal,
    incrementViewedAndCheckMilestone,
    initializeViewedCounter,
    phrasesListened: phrasesListenedRef.current,
    phrasesViewed: phrasesViewedRef.current,
    currentStreak,
    setIsAutoplayActive,
    recentMilestones,
  };
};
