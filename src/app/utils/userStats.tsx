import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { Phrase } from "../types";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserStatsModal } from "../components/UserStatsModal";
import { trackPhrasesListenedPopup } from "../../lib/mixpanelClient";

// Import the ranking functions from UserStatsModal
function getPhraseRankTitle(totalPhrases: number): { title: string; color: string; nextMilestone: number; description: string } {
  // Debug mode: use simplified thresholds for easy testing
  if (DEBUG_MILESTONE_MODE) {
    const titles = [
      { title: "Getting Started", color: "text-gray-500", description: "Every practice session counts" },
      { title: "First Step", color: "text-gray-600", description: "You're taking your first steps" },
      { title: "Early Learner", color: "text-orange-500", description: "Building momentum" },
      { title: "Getting Into It", color: "text-orange-600", description: "You're developing interest" },
      { title: "Active Learner", color: "text-yellow-500", description: "You're actively engaging" },
      { title: "Regular User", color: "text-yellow-600", description: "Building consistent habits" },
      { title: "Consistent", color: "text-green-500", description: "Developing consistency" },
      { title: "Dedicated", color: "text-green-600", description: "Building solid habits" },
      { title: "Very Dedicated", color: "text-blue-600", description: "Strong commitment" },
      { title: "Highly Committed", color: "text-blue-600", description: "Impressive dedication" },
      { title: "Practice Master", color: "text-purple-600", description: "Mastered consistent practice" },
      { title: "Ultra Dedicated", color: "text-purple-600", description: "Extraordinary commitment" },
      { title: "App Legend", color: "text-amber-500", description: "Legendary status achieved!" },
      { title: "Ultimate Master", color: "text-amber-500", description: "You've transcended!" },
      { title: "Phrase God", color: "text-amber-500", description: "Beyond legendary!" }
    ];

    for (let i = DEBUG_MILESTONES.length - 1; i >= 0; i--) {
      if (totalPhrases >= DEBUG_MILESTONES[i]) {
        return {
          ...titles[i],
          nextMilestone: i < DEBUG_MILESTONES.length - 1 ? DEBUG_MILESTONES[i + 1] : 0
        };
      }
    }

    return {
      title: "Getting Started",
      color: "text-gray-500",
      nextMilestone: DEBUG_MILESTONES[0],
      description: "Every practice session counts"
    };
  }

  // Production mode: use real thresholds
  if (totalPhrases >= 100000) {
    return {
      title: "App Legend",
      color: "text-amber-500",
      nextMilestone: 0,
      description: "You've achieved legendary status in using this app!"
    };
  } else if (totalPhrases >= 75000) {
    return {
      title: "Ultra Dedicated",
      color: "text-purple-600",
      nextMilestone: 100000,
      description: "Your commitment to practice is extraordinary"
    };
  } else if (totalPhrases >= 50000) {
    return {
      title: "Practice Master",
      color: "text-purple-600",
      nextMilestone: 75000,
      description: "You've mastered the art of consistent practice"
    };
  } else if (totalPhrases >= 35000) {
    return {
      title: "Highly Committed",
      color: "text-blue-600",
      nextMilestone: 50000,
      description: "Your dedication to practice is impressive"
    };
  } else if (totalPhrases >= 25000) {
    return {
      title: "Very Dedicated",
      color: "text-blue-600",
      nextMilestone: 35000,
      description: "You're showing exceptional commitment to practice"
    };
  } else if (totalPhrases >= 15000) {
    return {
      title: "Dedicated Practitioner",
      color: "text-green-600",
      nextMilestone: 25000,
      description: "You're building excellent practice habits"
    };
  } else if (totalPhrases >= 10000) {
    return {
      title: "Consistent Practitioner",
      color: "text-green-600",
      nextMilestone: 15000,
      description: "You're developing strong practice routines"
    };
  } else if (totalPhrases >= 5000) {
    return {
      title: "Regular User",
      color: "text-yellow-600",
      nextMilestone: 10000,
      description: "You're building consistent practice habits"
    };
  } else if (totalPhrases >= 2500) {
    return {
      title: "Active Learner",
      color: "text-yellow-500",
      nextMilestone: 5000,
      description: "You're actively engaging with the app"
    };
  } else if (totalPhrases >= 1000) {
    return {
      title: "Getting Into It",
      color: "text-orange-600",
      nextMilestone: 2500,
      description: "You're developing a practice routine"
    };
  } else if (totalPhrases >= 500) {
    return {
      title: "New User",
      color: "text-orange-500",
      nextMilestone: 1000,
      description: "Welcome to the app!"
    };
  } else {
    return {
      title: "Getting Started",
      color: "text-gray-500",
      nextMilestone: 500,
      description: "Every practice session counts"
    };
  }
}

const firestore = getFirestore();

// Debug mode for testing milestones - set to true to use debug thresholds
const DEBUG_MILESTONE_MODE = true;

// Debug milestone thresholds (much lower for easy testing)
const DEBUG_MILESTONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

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
    console.log("updateUserStats", phrasesListenedRef.current)
    if (!user) return;

    // Smart sync: every N phrases or when forced
    await syncTotalIfNeeded();

    // Use local tracking for milestone detection (much faster!)
    const currentTotal = totalPhrasesRef.current;
    const newTotal = currentTotal + 1;

    // Check for milestone achievement
    const currentRank = getPhraseRankTitle(currentTotal);
    const newRank = getPhraseRankTitle(newTotal);
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

      // Show instant celebration for longer
      setShowMilestoneCelebration(true);
      setTimeout(() => setShowMilestoneCelebration(false), 5000); // 5 seconds instead of 3
    }

    // Update total phrases ref
    totalPhrasesRef.current = newTotal;

    // Track phrases since last sync for smart syncing
    phraseCountSinceLastSync.current += 1;

    // Increment the session ref counter
    phrasesListenedRef.current += 1;

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // Get YYYY-MM-DD format

    // Get current phrase's languages
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) return;
    const { inputLang, targetLang } = currentPhrase;


    try {
      // Update the main stats document
      const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
      await updateDoc(statsRef, {
        phrasesListened: increment(1),
        lastListenedAt: now.toISOString(),
      });

      // Update the daily stats
      const dailyStatsRef = doc(
        firestore,
        "users",
        user.uid,
        "stats",
        "listening",
        "daily",
        today
      );
      await updateDoc(dailyStatsRef, {
        count: increment(1),
        lastUpdated: now.toISOString(),
      }).catch(async (err: unknown) => {
        // If the daily document doesn't exist, create it
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "not-found"
        ) {
          await setDoc(dailyStatsRef, {
            count: 1,
            lastUpdated: now.toISOString(),
            date: today,
          });
        } else {
          console.error("Error updating daily stats:", err);
        }
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
          await setDoc(languageStatsRef, {
            count: 1,
            lastUpdated: now.toISOString(),
            inputLang,
            targetLang,
            firstListened: now.toISOString(),
          });
        } else {
          console.error("Error updating language stats:", err);
        }
      });
    } catch (err: unknown) {
      // If the main stats document doesn't exist, create it
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "not-found"
      ) {
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
          today
        );
        await setDoc(dailyStatsRef, {
          count: 1,
          lastUpdated: now.toISOString(),
          date: today,
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
      } else {
        console.error("Error updating user stats:", err);
      }
    }
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
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
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
                  {countToShow} phrase{countToShow !== 1 ? 's' : ''} listened
                </motion.span>
              </div>

              {/* Show recent milestones in the persistent popup */}
              {persistUntilInteraction && recentMilestones.length > 0 && (
                <motion.div
                  className="mt-3 p-3 bg-yellow-600 rounded-lg border border-yellow-400"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <div className="text-sm font-semibold mb-2 flex items-center">
                    <span className="mr-2">🎉</span>
                    Recent Milestone{recentMilestones.length > 1 ? 's' : ''}!
                  </div>
                  {recentMilestones.slice(0, 2).map((milestone, index) => (
                    <motion.div
                      key={index}
                      className="text-sm mb-1 last:mb-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <span className="font-medium">{milestone.title}</span>
                      <span className="ml-2 opacity-90">
                        ({milestone.count.toLocaleString()} total)
                      </span>
                    </motion.div>
                  ))}
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
                  className={`text-3xl font-bold ${milestoneInfo.color}`}
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
  };
};
