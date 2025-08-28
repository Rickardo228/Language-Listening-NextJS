import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { Phrase } from "../types";
import { useRef, useState, useEffect } from "react";
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

// Debug mode for testing streaks - ONLY for development, never in production
const DEBUG_STREAK_MODE = process.env.NODE_ENV === 'development' && false;

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
    let checkDate = new Date();

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

export const useUpdateUserStats = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [countToShow, setCountToShow] = useState(0);
  const [persistUntilInteraction, setPersistUntilInteraction] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const phrasesListenedRef = useRef(0);
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
  const [previousStreak, setPreviousStreak] = useState(0);
  const [showStreakIncrement, setShowStreakIncrement] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Clean up old session storage entries for streak calculation
    const cleanupOldStreakSessions = () => {
      const userTimezone = getUserTimezone();
      const today = getUserLocalDateBoundary(userTimezone);
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('streakCalculated_') && !key.includes(today)) {
          sessionStorage.removeItem(key);
          console.log(`🧹 Cleaned up old streak session: ${key}`);
        }
      });
    };

    cleanupOldStreakSessions();

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
        console.log("🔄 DEBUG MODE: Starting from 0 phrases");
        return;
      }

      try {
        const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
        const { getDoc } = await import("firebase/firestore");
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
          const data = statsDoc.data();
          const total = data.phrasesListened || 0;
          totalPhrasesRef.current = total;
          phraseCountSinceLastSync.current = 0;
          console.log("🔄 Initial total phrases loaded:", total);
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
  }, [showPopup, persistUntilInteraction]);

  // Smart sync function - only fetches when needed
  const syncTotalIfNeeded = async (force: boolean = false): Promise<void> => {
    if (!user) return;

    // Skip syncing in debug mode to avoid overwriting debug counts
    if (DEBUG_MILESTONE_MODE) {
      console.log("🐛 DEBUG MODE: Skipping sync to preserve debug milestone testing");
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
        const dbTotal = data.phrasesListened || 0;

        // If database has more than our local count, update our local count
        // This handles cases where user used app on another device
        if (dbTotal > totalPhrasesRef.current) {
          console.log(`Syncing total: local=${totalPhrasesRef.current}, db=${dbTotal}`);
          totalPhrasesRef.current = dbTotal;
        }

        phraseCountSinceLastSync.current = 0;
      }
    } catch (error) {
      console.error("Error syncing total:", error);
    }
  };

  // Force sync on collection/session changes
  const forceSyncTotal = () => {
    syncTotalIfNeeded(true);
  };

  const updateUserStats = async (
    phrases: Phrase[],
    currentPhraseIndex: number
  ) => {
    console.log("🚀 updateUserStats called with:", {
      phrasesListenedRef: phrasesListenedRef.current,
      currentPhraseIndex,
      user: user?.uid,
      phrasesLength: phrases.length
    });

    if (!user) {
      console.log("❌ No user found, returning early");
      return;
    }

    // Smart sync: every N phrases or when forced
    await syncTotalIfNeeded();

    // Use local tracking for milestone detection (much faster!)
    const currentTotal = totalPhrasesRef.current;
    const newTotal = currentTotal + 1;

    console.log("📊 Stats update:", { currentTotal, newTotal });

    // Check for milestone achievement
    const currentRank = getPhraseRankTitle(currentTotal, DEBUG_MILESTONE_MODE);
    const newRank = getPhraseRankTitle(newTotal, DEBUG_MILESTONE_MODE);
    console.log("Milestone check:", { currentTotal, newTotal, currentRank: currentRank.title, newRank: newRank.title });
    const milestoneReached = currentRank.title !== newRank.title;
    console.log("Milestone reached?", milestoneReached);

    if (milestoneReached) {
      console.log("🎯 MILESTONE TRIGGERED!", newRank.title);
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

    // Increment the session ref counter
    phrasesListenedRef.current += 1;

    const now = new Date();
    const userTimezone = getUserTimezone();
    const todayLocal = getUserLocalDateBoundary(userTimezone);
    // Store the user's local date boundary for accurate timezone handling
    const todayLocalAsUTC = todayLocal; // Keep as local date for consistency

    console.log("📅 Date handling (User timezone, Local date):", {
      now: now.toISOString(),
      todayLocal: todayLocal,
      userTimezone: userTimezone,
      localTime: now.toLocaleString()
    });

    // Get current phrase's languages
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) {
      console.log("❌ No current phrase found");
      return;
    }
    const { inputLang, targetLang } = currentPhrase;

    console.log("🌍 Language pair:", { inputLang, targetLang });

    try {
      console.log("💾 Updating main stats document...");
      // Update the main stats document
      const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
      await updateDoc(statsRef, {
        phrasesListened: increment(1),
        lastListenedAt: now.toISOString(),
      });
      console.log("✅ Main stats updated successfully");

      console.log("📊 Updating daily stats document...");
      // Update the daily stats - store with full timestamp for timezone accuracy
      const dailyStatsRef = doc(
        firestore,
        "users",
        user.uid,
        "stats",
        "listening",
        "daily",
        todayLocalAsUTC
      );
      await updateDoc(dailyStatsRef, {
        count: increment(1),
        lastUpdated: now.toISOString(),
        timestamp: now.toISOString(), // Store full timestamp for timezone accuracy
      }).catch(async (err: unknown) => {
        // If the daily document doesn't exist, create it
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "not-found"
        ) {
          console.log("📄 Daily stats document doesn't exist, creating new one...");
          await setDoc(dailyStatsRef, {
            count: 1,
            lastUpdated: now.toISOString(),
            date: todayLocalAsUTC, // Store UTC date (converted from local)
            dateLocal: todayLocal, // Store local date for reference
            timestamp: now.toISOString(), // Store full timestamp for timezone accuracy
          });
          console.log("✅ Daily stats document created successfully");
        } else {
          console.error("❌ Error updating daily stats:", err);
        }
      });
      console.log("✅ Daily stats updated successfully");

      console.log("🌍 Updating language stats document...");
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
      await updateDoc(languageStatsRef, {
        count: increment(1),
        lastUpdated: now.toISOString(),
        inputLang,
        targetLang,
      }).catch(async (err: unknown) => {
        // If the language document doesn't exist, create it
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "not-found"
        ) {
          console.log("📄 Language stats document doesn't exist, creating new one...");
          await setDoc(languageStatsRef, {
            count: 1,
            lastUpdated: now.toISOString(),
            inputLang,
            targetLang,
            firstListened: now.toISOString(),
          });
          console.log("✅ Language stats document created successfully");
        } else {
          console.error("❌ Error updating language stats:", err);
        }
      });
      console.log("✅ Language stats updated successfully");

    } catch (err: unknown) {
      console.error("❌ Error in main stats update:", err);
      // If the main stats document doesn't exist, create it
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "not-found"
      ) {
        console.log("📄 Main stats document doesn't exist, creating new one...");
        const statsRef = doc(
          firestore,
          "users",
          user.uid,
          "stats",
          "listening"
        );
        await setDoc(statsRef, {
          phrasesListened: 1,
          lastListenedAt: now.toISOString(),
        });

        // Create the daily stats document
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
          count: 1,
          lastUpdated: now.toISOString(),
          date: todayLocalAsUTC,
        });

        // Create the language stats document
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
          count: 1,
          lastUpdated: now.toISOString(),
          inputLang,
          targetLang,
          firstListened: now.toISOString(),
        });
        console.log("✅ All stats documents created successfully");
      } else {
        console.error("❌ Error updating user stats:", err);
      }
    }

    console.log("🔥 Starting streak calculation...");
    // Smart incremental streak calculation - only update when streak actually changes
    try {
      // Use Firestore transaction to prevent race conditions and double increments
      const statsRef = doc(firestore, "users", user.uid, "stats", "listening");

      // Check if we already calculated the streak for today in this session
      const todayKey = `streakCalculated_${todayLocal}`;
      if (sessionStorage.getItem(todayKey)) {
        console.log(`📅 Streak already calculated for today in this session`);
        return;
      }

      // Use a transaction to ensure atomic streak updates
      await runTransaction(firestore, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const currentStats = statsDoc.exists() ? statsDoc.data() : {};

        console.log("📊 Current stats from transaction:", currentStats);

        // Check if streak was already calculated today by another process
        const lastCalculation = currentStats.lastStreakCalculation;
        const lastCalculationDate = lastCalculation ?
          getUserLocalDateBoundary(userTimezone, new Date(lastCalculation)) : null;

        if (lastCalculationDate === todayLocal) {
          console.log(`📅 Streak already calculated today by another process`);
          return; // Exit transaction early
        }

        let newStreak = currentStats.currentStreak || 0;
        let streakChanged = false;
        let streakChangeReason = '';

        const lastActivityDate = currentStats.lastListenedAt ?
          getUserLocalDateBoundary(userTimezone, new Date(currentStats.lastListenedAt)) : null;

        console.log("📅 Streak calculation:", {
          lastActivityDate,
          todayLocal,
          currentStreak: currentStats.currentStreak,
          newStreak
        });

        if (lastActivityDate !== todayLocal) {
          // Check if yesterday had activity
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getUserLocalDateBoundary(userTimezone, yesterday);

          if (lastActivityDate === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak++;
            streakChanged = true;
            streakChangeReason = 'incremented';
            console.log(`🔥 Streak incremented: ${newStreak} days`);
          } else if (lastActivityDate !== todayLocal) {
            // Gap found - reset streak to 1
            newStreak = 1;
            streakChanged = true;
            streakChangeReason = 'reset';
            console.log(`🔄 Streak reset: New streak started (1 day)`);
          }
        } else {
          // Same day - streak continues unchanged
          console.log(`📅 Same day activity - streak maintained: ${newStreak} days`);
        }

        // Only update streak data if it actually changed
        if (streakChanged) {
          console.log(`💾 Updating streak data: ${streakChangeReason} to ${newStreak} days`);

          // Update main stats with new streak and metadata
          transaction.update(statsRef, {
            currentStreak: newStreak,
            lastStreakCalculation: now.toISOString(),
            longestStreak: Math.max(newStreak, currentStats.longestStreak || 0),
            streakStartDate: newStreak === 1 ? todayLocal : (currentStats.streakStartDate || todayLocal)
          });

          // Update UI state for streak increment animation
          setPreviousStreak(currentStreak);
          setCurrentStreak(newStreak);
          setShowStreakIncrement(true);
        } else {
          // Streak unchanged - just update local state
          setCurrentStreak(newStreak);
        }

        // Mark that we've calculated the streak for today in this session
        sessionStorage.setItem(todayKey, 'true');

        console.log(`📊 Current streak: ${newStreak} days`);
        if (streakChanged) {
          console.log(`🏆 Longest streak: ${Math.max(newStreak, currentStats.longestStreak || 0)} days`);
          console.log(`📅 Streak start date: ${newStreak === 1 ? todayLocal : (currentStats.streakStartDate || todayLocal)}`);
        }
      });

      console.log("✅ Streak calculation completed successfully");

    } catch (error) {
      console.error("❌ Error calculating streak:", error);
    }

    console.log("🎉 Stats update completed successfully!");
  };

  const showStatsUpdate = (shouldPersistUntilInteraction: boolean = false) => {
    if (phrasesListenedRef.current > 0) {
      const phrasesCount = phrasesListenedRef.current;
      setShowPopup(true);
      setCountToShow(phrasesCount);
      setPersistUntilInteraction(shouldPersistUntilInteraction);

      // Track popup show event
      trackPhrasesListenedPopup(
        "show",
        phrasesCount,
        shouldPersistUntilInteraction,
        shouldPersistUntilInteraction ? "natural" : "manual"
      );

      phrasesListenedRef.current = 0;
    }

    if (!shouldPersistUntilInteraction) {
      setTimeout(() => {
        setShowPopup(false);
        setPersistUntilInteraction(false);
        setShowStreakIncrement(false); // Hide streak when popup auto-hides
      }, 2000);
    }
  };

  const closeStatsPopup = (source: "continue" | "escape" = "continue") => {
    // Track close action before closing
    if (showPopup) {
      trackPhrasesListenedPopup(
        source === "continue" ? "continue" : "escape_dismiss",
        countToShow,
        persistUntilInteraction
      );
    }

    setShowPopup(false);
    setPersistUntilInteraction(false);
    // Clear recent milestones when user dismisses the popup
    setRecentMilestones([]);
    // Also hide streak increment when popup is closed
    setShowStreakIncrement(false);
  };

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
    // Also hide streak increment when opening stats modal
    setShowStreakIncrement(false);
  };
  const StatsPopups = mounted ? createPortal(
    <AnimatePresence mode="multiple">
      {/* Pause Stats Popup */}
      {showPopup && (
        <motion.div
          key="pause-popup"
          className="fixed inset-0 z-50 flex items-center justify-center md:items-center md:justify-center sm:items-end sm:justify-end sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm mx-4 sm:mx-0"
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
            <div className="space-y-3">
              {/* Main achievement header */}
              <div className="flex items-center justify-center space-x-3">
                <motion.svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </motion.svg>
                <motion.span
                  className="font-bold text-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {countToShow} phrase{countToShow !== 1 ? 's' : ''} listened!
                </motion.span>
              </div>

              {/* Streak display - only show when incrementing */}
              {showStreakIncrement && currentStreak > 0 && (() => {
                const streakData = getStreakMessage(currentStreak);
                return (
                  <motion.div
                    className="relative flex items-center justify-center space-x-3 p-3 bg-white/10 dark:bg-black/20 rounded-lg border border-white/20"
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
                      <motion.div className="text-lg font-bold text-white flex items-center space-x-1">
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
                        className="text-xs font-medium text-white/80 uppercase tracking-wide"
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

              {/* Show recent milestones in the persistent popup */}
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
                      className="w-full px-4 py-2 bg-yellow-800 hover:bg-yellow-900 text-white rounded text-sm font-medium transition-colors"
                      onClick={openStatsModal}
                    >
                      View Stats
                    </button>
                  )}
                  <button
                    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors shadow-md"
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

  return {
    updateUserStats,
    StatsPopups,
    StatsModal,
    showStatsUpdate,
    closeStatsPopup,
    forceSyncTotal,
    phrasesListened: phrasesListenedRef.current,
    currentStreak,
  };
};
