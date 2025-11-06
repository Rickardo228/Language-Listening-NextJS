import {
  getFirestore,
  doc,
  increment,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { Phrase } from "../types";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserStatsModal } from "../components/UserStatsModal";
import { trackPhrasesListenedPopup } from "../../lib/mixpanelClient";
import { getPhraseRankTitle, DEBUG_MILESTONE_THRESHOLDS } from "./rankingSystem";

const firestore = getFirestore();

// Utility function for timezone-aware date handling
export function getUserLocalDateBoundary(timezone?: string, date?: Date): string {
  const targetDate = date || new Date();

  // Use provided timezone or detect from browser
  const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a new date object in the user's timezone
  // This approach is more reliable than parsing locale strings
  const year = targetDate.toLocaleDateString(undefined, {
    year: 'numeric',
    timeZone: userTimezone
  });
  const month = targetDate.toLocaleDateString(undefined, {
    month: '2-digit',
    timeZone: userTimezone
  });
  const day = targetDate.toLocaleDateString(undefined, {
    day: '2-digit',
    timeZone: userTimezone
  });

  // Return in YYYY-MM-DD format
  return `${year}-${month}-${day}`;
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
function getStreakMessage(streakCount: number): { emoji: string; message: string } {
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
function getMilestoneBackgroundStyle(color: string): string {
  if (color.includes('amber') || color.includes('yellow')) {
    return 'bg-gradient-to-br from-amber-100 to-yellow-200 border-amber-300 dark:from-amber-800 dark:to-yellow-700 dark:border-amber-600';
  } else if (color.includes('purple')) {
    return 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300 dark:from-purple-800 dark:to-purple-700 dark:border-purple-600';
  } else if (color.includes('blue')) {
    return 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 dark:from-blue-800 dark:to-blue-700 dark:border-blue-600';
  } else if (color.includes('green')) {
    return 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 dark:from-green-800 dark:to-green-700 dark:border-green-600';
  } else if (color.includes('orange')) {
    return 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 dark:from-orange-800 dark:to-orange-700 dark:border-orange-600';
  } else {
    return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:border-gray-500';
  }
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
    audio.play().catch(error => {
      console.log('Sound playback failed:', error);
    });
  } catch (error) {
    console.log('Sound initialization failed:', error);
  }
};

export const useUpdateUserStats = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [countToShow, setCountToShow] = useState(0);
  const [persistUntilInteraction, setPersistUntilInteraction] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [popupEventType, setPopupEventType] = useState<'listened' | 'viewed'>('listened');
  const [isListCompleted, setIsListCompleted] = useState(false);

  const phrasesListenedRef = useRef(0);
  const phrasesViewedRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  // New state for milestone celebration
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [milestoneInfo, setMilestoneInfo] = useState<{ title: string; color: string; description: string; count: number } | null>(null);
  const [recentMilestones, setRecentMilestones] = useState<Array<{ title: string; color: string; description: string; count: number }>>([]);
  const totalPhrasesRef = useRef(0);
  const phraseCountSinceLastSync = useRef(0);
  const SYNC_AFTER_PHRASES = 10; // Re-sync every 10 phrases
  const [currentStreak, setCurrentStreak] = useState(0);
  const [, setPreviousStreak] = useState(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
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

  const showStatsUpdate = useCallback((shouldPersistUntilInteraction: boolean = false, eventType: 'listened' | 'viewed' | 'both' = 'listened', listCompleted: boolean = false) => {
    const listenedCount = phrasesListenedRef.current;
    const viewedCount = phrasesViewedRef.current;

    let shouldShowPopup = false;
    let displayCount = 0;
    let displayType = '';

    if (eventType === 'listened' && listenedCount > 0) {
      shouldShowPopup = true;
      displayCount = listenedCount;
      displayType = 'listened';
      // Only reset counter for persistent popups (end of list, manual pause)
      // For snackbar milestone popups (every 5), keep accumulating
      if (shouldPersistUntilInteraction) {
        phrasesListenedRef.current = 0;
      }
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
        // Only reset if persistent
        if (shouldPersistUntilInteraction) {
          phrasesListenedRef.current = 0;
        }
      } else {
        displayCount = viewedCount;
        displayType = 'viewed';
        // Don't reset viewed count - keep accumulating
      }
    }

    if (shouldShowPopup) {
      setShowPopup(true);
      setCountToShow(displayCount);
      setPersistUntilInteraction(shouldPersistUntilInteraction);
      setIsListCompleted(listCompleted);

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
    }

    if (!shouldPersistUntilInteraction) {
      setTimeout(() => {
        setShowPopup(false);
        setPersistUntilInteraction(false);
        setIsListCompleted(false);
      }, 2000);
    }
  }, []);

  // Function to increment viewed count and show popup at milestones
  const incrementViewedAndCheckMilestone = useCallback((threshold: number = 5) => {
    // Increment the counter immediately
    phrasesViewedRef.current += 1;
    const newCount = phrasesViewedRef.current;

    console.log('viewed count:', JSON.stringify(newCount));

    // Show popup on exact multiples of threshold (5, 10, 15, etc.)
    if (newCount % threshold === 0) {
      console.log('milestone reached:', JSON.stringify(newCount));
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
        console.log('Set lastStreakShownDate to', todayLocal);
      }
    }

    setShowPopup(false);
    setPersistUntilInteraction(false);
    setIsListCompleted(false);
    // Clear recent milestones when user dismisses the popup
    setRecentMilestones([]);
  }, [showPopup, countToShow, persistUntilInteraction, currentStreak]);

  const openStatsModal = () => {
    // Track view stats action before closing popup
    if (showPopup) {
      trackPhrasesListenedPopup(
        "view_stats",
        countToShow,
        persistUntilInteraction
      );
    }

    setShowStatsModal(true);
    setShowPopup(false);
    setPersistUntilInteraction(false);
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

      // Show instant celebration - requires user interaction to dismiss
      setShowMilestoneCelebration(true);
    }

    // Update total phrases ref
    totalPhrasesRef.current = newTotal;

    // Track phrases since last sync for smart syncing
    phraseCountSinceLastSync.current += 1;

    // Increment the session ref counter based on event type (unless skipped)
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
        console.log('update viewed', JSON.stringify(phrasesViewedRef.current));
        phrasesViewedRef.current += 1;
      }
    }

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
  }, [user, syncTotalIfNeeded, showStatsUpdate]);

  const StatsPopups = mounted ? createPortal(
    <AnimatePresence mode="wait">
      {/* Stats Popup - Snackbar for non-persistent, Full popup for persistent */}
      {showPopup && (
        <motion.div
          key="pause-popup"
          className={`fixed z-50 ${!persistUntilInteraction
            ? 'bottom-4 left-1/2 -translate-x-1/2' // Snackbar position for both viewed and listened
            : 'inset-0 flex items-center justify-center md:items-center md:justify-center sm:items-end sm:justify-end sm:p-4' // Full popup
            }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={`${popupEventType === 'viewed' ? 'bg-blue-500' : 'bg-yellow-500'
              } text-white rounded-lg shadow-lg ${isListCompleted
                ? 'px-8 py-6 max-w-md' // Bigger for list completion
                : !persistUntilInteraction
                  ? 'px-5 py-3 max-w-xs' // Compact snackbar for both types
                  : 'px-6 py-4 max-w-sm' // Regular popup
              } mx-4 sm:mx-0`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.3
            }}
          >
            <div className={isListCompleted ? "space-y-4" : "space-y-3"}>
              {/* Nice work header for list completion */}
              {isListCompleted && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <span className="text-2xl font-bold">Nice work!</span>
                </motion.div>
              )}

              {/* Main achievement header */}
              <div className={`flex items-center justify-center ${!persistUntilInteraction ? 'space-x-2' : 'space-x-3'
                }`}>
                {persistUntilInteraction && (
                  <motion.svg
                    className={isListCompleted ? "w-7 h-7" : "w-6 h-6"}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </motion.svg>
                )}
                <motion.span
                  className={`font-bold ${isListCompleted
                    ? 'text-xl'
                    : !persistUntilInteraction
                      ? 'text-sm'
                      : 'text-lg'
                    }`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {!persistUntilInteraction
                    ? `${popupEventType === 'viewed' ? '👀' : '🎧'} ${countToShow} phrase${countToShow !== 1 ? 's' : ''} ${popupEventType}!`
                    : `${popupEventType === 'viewed' ? '👀' : ''} ${countToShow} phrase${countToShow !== 1 ? 's' : ''} ${popupEventType}!`
                  }
                </motion.span>
              </div>

              {/* List completed badge for list completion */}
              {isListCompleted && (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3, type: "spring" }}
                >
                  <span className="px-4 py-2 bg-white/20 dark:bg-black/30 rounded-full text-lg font-semibold border-2 border-white/30">
                    🎉 List completed! 🎉
                  </span>
                </motion.div>
              )}

              {/* Streak display - show once per day in persistent popups */}
              {persistUntilInteraction && currentStreak > 0 && (() => {

                // Check if we should show the streak based on localStorage
                const lastStreakShownDate = localStorage.getItem('lastStreakShownDate');
                const todayLocal = new Date().toLocaleDateString();
                console.log('currentStreak', currentStreak);
                console.log('lastStreakShownDate', lastStreakShownDate);
                console.log('todayLocal', todayLocal);
                console.log('isListCompleted', isListCompleted);
                // Show streak if: we haven't shown today OR it's list completion
                const shouldShowStreak = (lastStreakShownDate !== todayLocal) || isListCompleted;
                console.log('shouldShowStreak', shouldShowStreak);

                if (!shouldShowStreak) {
                  return null;
                }

                // Don't set localStorage here - let closeStatsPopup do it when user clicks continue

                const streakData = getStreakMessage(currentStreak);
                return (
                  <motion.div
                    className="relative flex items-center justify-center space-x-3 p-3 bg-black/10 dark:bg-white/10 rounded-lg border border-black/20 dark:border-white/20"
                    initial={{ opacity: 0, scale: 0.8, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <motion.span
                      className="text-2xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        delay: 0.8,
                        duration: 0.8,
                        repeat: 1,
                        ease: "easeInOut"
                      }}
                    >
                      {streakData.emoji}
                    </motion.span>
                    <motion.div
                      className="flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      <motion.div className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-1">
                        {/* Animated number increment */}
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={currentStreak}
                            initial={{ opacity: 0, y: -20, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.5 }}
                            transition={{
                              delay: 0.9,
                              duration: 0.4,
                              type: "spring",
                              stiffness: 300
                            }}
                          >
                            {currentStreak}
                          </motion.span>
                        </AnimatePresence>
                        <span> day streak</span>
                      </motion.div>
                      <motion.span
                        className="text-xs font-medium text-gray-700 dark:text-white/80 uppercase tracking-wide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.3 }}
                      >
                        {streakData.message}
                      </motion.span>
                    </motion.div>

                    {/* Enhanced sparkle effect for increment */}
                    <motion.div className="absolute -top-1 -right-1">
                      {[...Array(2)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="absolute text-yellow-200 text-sm"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            rotate: [0, 180, 360],
                            x: [0, Math.random() * 20 - 10],
                            y: [0, -Math.random() * 15 - 5]
                          }}
                          transition={{
                            delay: 1.2 + i * 0.2,
                            duration: 1.0,
                            ease: "easeOut"
                          }}
                        >
                          ✨
                        </motion.span>
                      ))}
                    </motion.div>
                  </motion.div>
                );
              })()}

              {/* Show recent milestones in the persistent popup (not in snackbar) */}
              {persistUntilInteraction && recentMilestones.length > 0 && (
                <motion.div
                  className="mt-3 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-300/30"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.div
                    className="text-sm font-bold mb-3 flex items-center text-white"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <motion.span
                      className="mr-2 text-base"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ delay: 0.5, duration: 0.8, repeat: 1 }}
                    >
                      🏆
                    </motion.span>
                    Recent Milestone{recentMilestones.length > 1 ? 's' : ''} Achieved!
                  </motion.div>
                  <div className="space-y-2">
                    {recentMilestones.slice(0, 2).map((milestone, index) => (
                      <motion.div
                        key={index}
                        className={`p-3 rounded-lg border ${getMilestoneBackgroundStyle(milestone.color)} shadow-sm`}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: 0.5 + index * 0.1,
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <motion.div
                              className={`w-3 h-3 rounded-full ${milestone.color.replace('text-', 'bg-')}`}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                delay: 0.7 + index * 0.1,
                                duration: 0.6,
                                repeat: 1
                              }}
                            />
                            <span className={`font-bold text-sm ${milestone.color}`}>
                              {milestone.title}
                            </span>
                          </div>
                          <motion.span
                            className="text-xs font-medium text-foreground/70 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                          >
                            {milestone.count.toLocaleString()} phrases
                          </motion.span>
                        </div>
                        <motion.div
                          className="text-xs text-foreground/60 mt-1 italic"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                        >
                          {milestone.description}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              {persistUntilInteraction && (
                <motion.div
                  className="mt-3 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  {user && (
                    <button
                      className={`w-full px-4 py-2 ${popupEventType === 'viewed' ? 'bg-blue-800 hover:bg-blue-900' : 'bg-yellow-800 hover:bg-yellow-900'} text-white rounded text-sm font-medium transition-colors`}
                      onClick={openStatsModal}
                    >
                      View Stats
                    </button>
                  )}
                  <button
                    className={`w-full px-4 py-2 ${popupEventType === 'viewed' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded text-sm font-medium transition-colors shadow-md`}
                    onClick={() => closeStatsPopup("continue")}
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Milestone Celebration Popup */}
      {showMilestoneCelebration && milestoneInfo && (
        <motion.div
          key="milestone-celebration"
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`${getMilestoneBackgroundStyle(milestoneInfo.color)} text-foreground px-8 py-6 rounded-xl shadow-2xl max-w-md mx-4 border-2 pointer-events-auto`}
            initial={{ scale: 0.6, opacity: 0, y: 50, rotate: -3 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 20,
                duration: 0.6
              }
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              y: -40,
              transition: { duration: 0.4 }
            }}
          >
            <div className="text-center space-y-4">
              <motion.div
                className="flex items-center justify-center space-x-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
              >
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ delay: 0.4, duration: 0.8, repeat: 2 }}
                >
                  🎉
                </motion.span>
                <motion.span
                  className="text-xl font-bold text-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  Milestone Reached!
                </motion.span>
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, -15, 10, 0] }}
                  transition={{ delay: 0.5, duration: 0.8, repeat: 2 }}
                >
                  🎉
                </motion.span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="space-y-2"
              >
                <motion.div
                  className={`text-3xl font-bold text-white px-4 py-2 rounded-lg border-2 ${milestoneInfo.color.replace('text-', 'border-')} bg-gradient-to-r ${milestoneInfo.color.replace('text-', 'from-')}/20 ${milestoneInfo.color.replace('text-', 'to-')}/10`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ delay: 0.6, duration: 0.4, repeat: 1 }}
                >
                  {milestoneInfo.title}
                </motion.div>
                <div className="text-lg font-semibold text-foreground/90">
                  {milestoneInfo.count.toLocaleString()} phrases!
                </div>
                <div className="text-sm text-foreground/70 italic">
                  {milestoneInfo.description}
                </div>
              </motion.div>

              <motion.div
                className="flex justify-center space-x-1 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-xl"
                    animate={{
                      scale: [1, 1.4, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      delay: 0.8 + i * 0.1,
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </motion.div>

              <motion.button
                className="mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                onClick={() => setShowMilestoneCelebration(false)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
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
  };
};
