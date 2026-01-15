"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, collection, getDocs } from "firebase/firestore";
import { getUserLocalDateBoundary, getUserTimezone } from "../utils/userStats/userStats";
import { getPhraseRankTitle, getLanguageRankTitle, PRODUCTION_PHRASE_RANKS } from "../utils/rankingSystem";
import { getFlagEmoji, getLanguageName } from "../utils/languageUtils";
import { Button } from "./ui/Button";
import { ROUTES } from "../routes";

interface ListCompletionScreenProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  getStreakMessage: (streak: number) => { emoji: string; message: string };
  onGoAgain?: () => void | Promise<void>;
  onGoNext?: () => void | Promise<void>;
  userId: string;
  sessionListened?: number;
  sessionViewed?: number;
  recentMilestones?: Array<{ title: string; color: string; description: string; count: number }>;
}

const firestore = getFirestore();

interface LanguageStats {
  count: number;
  lastUpdated: string;
  inputLang: string;
  targetLang: string;
  firstListened: string;
}

// Animated number component to isolate re-renders
const AnimatedNumber = memo(({
  target,
  startValue = 0,
  className = "",
  duration
}: {
  target: number;
  startValue?: number;
  className?: string;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(startValue);

  useEffect(() => {
    if (target === startValue) {
      setDisplayValue(target);
      return;
    }

    const change = Math.abs(target - startValue);

    // Dynamic duration based on the size of change
    const animationDuration = duration ?? (
      change < 10 ? 1000 :
        change < 50 ? 1100 :
          change < 100 ? 1200 :
            1300
    );

    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Ease-out quad (less aggressive than cubic for small numbers)
      const easeOut = 1 - Math.pow(1 - progress, 2);
      const currentValue = Math.floor(startValue + (target - startValue) * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, startValue, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
});

AnimatedNumber.displayName = "AnimatedNumber";

// Memoized stat card to prevent re-renders
const StatCard = memo(({
  title,
  listenedCount,
  viewedCount,
  startListened = 0,
  startViewed = 0,
  delay,
  xOffset
}: {
  title: string;
  listenedCount: number;
  viewedCount: number;
  startListened?: number;
  startViewed?: number;
  delay: number;
  xOffset: number;
}) => {
  const total = listenedCount + viewedCount;
  const startTotal = startListened + startViewed;

  const borderColors = ['border-fuchsia-500', 'border-emerald-500', 'border-blue-500'];
  const textColors = ['text-fuchsia-400', 'text-emerald-400', 'text-blue-400'];
  const borderIndex = title === "Today" ? 0 : title === "All Time" ? 2 : 1;

  return (
    <motion.div
      className={`bg-slate-800 dark:bg-slate-800 rounded-2xl p-4 md:p-6 border-4 ${borderColors[borderIndex]} shadow-xl w-full max-w-[280px] md:max-w-[320px] overflow-hidden`}
      initial={{ opacity: 0, x: xOffset }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex flex-col items-center justify-center py-4 md:py-8">
        <div className={`${textColors[borderIndex]} font-bold text-sm uppercase tracking-wide mb-4 md:mb-6`}>
          {title}
        </div>
        <div className="min-w-[140px] text-center">
          <AnimatedNumber
            target={total}
            startValue={startTotal}
            className={`text-5xl md:text-7xl font-black ${textColors[borderIndex]}`}
          />
        </div>
        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-3 md:mt-4">
          Phrases
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

// Milestone progress bar component
const MilestoneProgress = memo(({
  title,
  currentCount,
  icon,
  language
}: {
  title: string;
  currentCount: number;
  icon?: string;
  language?: string;
}) => {
  const rankInfo = language
    ? getLanguageRankTitle(currentCount)
    : getPhraseRankTitle(currentCount);

  if (rankInfo.nextMilestone <= 0) return null;

  // Find the last milestone we passed
  let lastMilestone = 0;
  const ranks = PRODUCTION_PHRASE_RANKS;
  for (const rank of ranks) {
    if (rank.threshold <= currentCount && rank.threshold > lastMilestone) {
      lastMilestone = rank.threshold;
    }
  }

  const progressRange = rankInfo.nextMilestone - lastMilestone;
  const currentProgress = currentCount - lastMilestone;
  const progressPercentage = (currentProgress / progressRange) * 100;
  const nextRankTitle = rankInfo.nextMilestone > 0
    ? (language ? getLanguageRankTitle(rankInfo.nextMilestone) : getPhraseRankTitle(rankInfo.nextMilestone)).title
    : "Final Rank";

  return (
    <motion.div
      className="bg-slate-800 dark:bg-slate-800 rounded-2xl p-4 border-4 border-amber-500 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-xl">{icon}</span>}
        {language && <span className="text-2xl">{getFlagEmoji(language)}</span>}
        <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="font-semibold mb-2">{rankInfo.title}</div>

      {/* <div className="flex gap-2 text-sm text-slate-400 mb-2">
        <div className="text-slate-200 font-bold text-lg">{currentCount.toLocaleString()}</div>

        <div className="font-semibold" style={{ alignSelf: 'start' }}>{rankInfo.title}</div>
      </div> */}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-300">
          <span>{lastMilestone.toLocaleString()}</span>
          <span className="font-semibold">{rankInfo.nextMilestone.toLocaleString()}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
            transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-slate-400 text-center">
          {Math.max(0, progressRange - currentProgress).toLocaleString()} to reach {nextRankTitle}
        </div>
      </div>
    </motion.div>
  );
});

MilestoneProgress.displayName = "MilestoneProgress";

export function ListCompletionScreen({
  isOpen,
  onClose,
  currentStreak,
  getStreakMessage,
  onGoAgain,
  onGoNext,
  userId,
  sessionListened = 0,
  sessionViewed = 0,
  recentMilestones = [],
}: ListCompletionScreenProps) {
  const router = useRouter();
  // Step can be 1 (celebration), 2 (stats), "milestone" (showing milestones), or 3 (final)
  const [step, setStep] = useState<1 | 2 | "milestone" | 3>(1);
  const [todayStats, setTodayStats] = useState({ listened: 0, viewed: 0 });
  const [totalStats, setTotalStats] = useState({ listened: 0, viewed: 0 });
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [mostRecentLanguage, setMostRecentLanguage] = useState<{ language: string; count: number } | null>(null);

  // Fetch stats when moving to step 2
  const fetchStats = async () => {
    try {
      const { getDoc } = await import("firebase/firestore");
      const userTimezone = getUserTimezone();
      const todayLocal = getUserLocalDateBoundary(userTimezone);

      // Fetch today's stats
      const dailyStatsRef = doc(firestore, "users", userId, "stats", "listening", "daily", todayLocal);
      const dailyDoc = await getDoc(dailyStatsRef);

      if (dailyDoc.exists()) {
        const data = dailyDoc.data();
        setTodayStats({
          listened: data.countListened || data.count || 0,
          viewed: data.countViewed || 0
        });
      }

      // Fetch total stats
      const statsRef = doc(firestore, "users", userId, "stats", "listening");
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const data = statsDoc.data();
        setTotalStats({
          listened: data.phrasesListened || 0,
          viewed: data.phrasesViewed || 0
        });
      }

      // Fetch language stats
      const languageStatsRef = collection(firestore, "users", userId, "stats", "listening", "languages");
      const languageSnapshot = await getDocs(languageStatsRef);
      const languageData = languageSnapshot.docs.map(doc => doc.data() as LanguageStats);
      setLanguageStats(languageData);

      // Find most recent language
      if (languageData.length > 0) {
        const mostRecent = languageData.reduce((prev, current) =>
          new Date(current.lastUpdated) > new Date(prev.lastUpdated) ? current : prev
        );
        setMostRecentLanguage({
          language: mostRecent.targetLang,
          count: mostRecent.count
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Reset to step 1 when opened, reset session when closed
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
    // Don't reset stats when closing - keep them so next animation starts from previous value
  }, [isOpen]);

  // Handler for navigating from step 2 to milestone or step 3
  const handleStep2Continue = () => {
    if (recentMilestones.length > 0) {
      setStep("milestone");

    } else {
      setStep(3);
    }
  };

  const streakData = getStreakMessage(currentStreak);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - fullscreen on mobile, centered modal on desktop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 md:bg-black/30 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="fixed inset-0 md:relative md:inset-auto md:w-[800px] md:h-[700px] md:rounded-3xl md:overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center p-4 md:shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full max-w-2xl h-full flex items-center justify-center md:py-8">
                {step === 1 ? (
                  // Step 1: Celebration and Streak
                  <motion.div
                    key="step-1"
                    className="space-y-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Celebration Header */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    >
                      <motion.div
                        className="text-6xl md:text-7xl mb-4"
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ delay: 0.3, duration: 0.8, repeat: 1 }}
                      >
                        🎉
                      </motion.div>
                      <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3 drop-shadow-lg">
                        Nice Work!
                      </h1>
                      <p className="text-xl md:text-2xl bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent font-semibold">
                        List completed!
                      </p>
                    </motion.div>

                    {/* Streak Display */}
                    {currentStreak > 0 && (
                      <motion.div
                        className="bg-slate-800 dark:bg-slate-800 rounded-3xl p-4 md:p-6 border-4 border-purple-500 shadow-2xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                      >
                        <motion.div
                          className="text-4xl md:text-5xl mb-2 md:mb-3"
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ delay: 0.6, duration: 0.8, repeat: 2 }}
                        >
                          {streakData.emoji}
                        </motion.div>
                        <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-1 leading-tight">
                          {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
                        </div>
                        <div className="text-lg md:text-xl font-bold text-slate-200 uppercase tracking-wider">
                          {streakData.message}
                        </div>
                      </motion.div>
                    )}

                    {/* Next Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        className="font-black text-2xl py-6 rounded-2xl shadow-2xl uppercase"
                        onClick={() => {
                          fetchStats();
                          setStep(2);
                        }}
                      >
                        Continue
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : step === 2 ? (
                  // Step 2: Stats Cards
                  <motion.div
                    key="step-2"
                    className="space-y-6 w-full"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Title */}
                    <motion.h2
                      className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent text-center mb-2 drop-shadow-lg pb-2"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      Your Progress
                    </motion.h2>

                    {/* Session Summary */}
                    <motion.div
                      className="text-center mb-6"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-slate-700 dark:text-slate-300 text-xl font-semibold">
                        +{sessionListened + sessionViewed} phrases this session
                      </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
                      <StatCard
                        title="Today"
                        listenedCount={todayStats.listened}
                        viewedCount={todayStats.viewed}
                        startListened={Math.max(0, todayStats.listened - sessionListened)}
                        startViewed={Math.max(0, todayStats.viewed - sessionViewed)}
                        delay={0.2}
                        xOffset={-20}
                      />
                      <StatCard
                        title="All Time"
                        listenedCount={totalStats.listened}
                        viewedCount={totalStats.viewed}
                        startListened={Math.max(0, totalStats.listened - sessionListened)}
                        startViewed={Math.max(0, totalStats.viewed - sessionViewed)}
                        delay={0.3}
                        xOffset={20}
                      />
                    </div>

                    {/* Continue to Milestones or Step 3 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        className="font-black text-2xl py-6 rounded-2xl shadow-2xl uppercase"
                        onClick={handleStep2Continue}
                      >
                        Continue
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  // Step 3: Milestone Progress
                  <motion.div
                    key="step-3"
                    className="space-y-6 w-full"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Title */}
                    <motion.h2
                      className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent text-center mb-8 drop-shadow-lg"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      Milestones
                    </motion.h2>

                    {/* Milestone Progress Bars */}
                    <div className="space-y-4">
                      {/* Language-specific progress */}
                      {mostRecentLanguage && (
                        <MilestoneProgress
                          title={`${getLanguageName(mostRecentLanguage.language)} Progress`}
                          currentCount={mostRecentLanguage.count}
                          language={mostRecentLanguage.language}
                        />
                      )}

                      {/* Total progress (all languages) */}
                      <MilestoneProgress
                        title="All Languages"
                        currentCount={totalStats.listened + totalStats.viewed}
                        icon="🎯"
                      />
                    </div>

                    {/* Action Buttons */}
                    <motion.div
                      className="space-y-3 pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {/* Go Next Button (for paths) */}
                      {onGoNext && (
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth
                          className="font-black text-xl py-5 rounded-xl shadow-xl uppercase"
                          onClick={async () => {
                            if (onGoNext) {
                              await onGoNext();
                            }
                            onClose();
                          }}
                        >
                          Go Next
                        </Button>
                      )}

                      {/* Continue Button (was Go Again) */}
                      {onGoAgain && (
                        <Button
                          variant="secondary"
                          size="lg"
                          fullWidth
                          className="font-bold text-lg py-4 rounded-xl shadow-lg"
                          onClick={async () => {
                            if (onGoAgain) {
                              await onGoAgain();
                            }
                            onClose();
                          }}
                        >
                          Continue
                        </Button>
                      )}

                      {/* Home Button (only show if no onGoNext - for non-paths) */}
                      {!onGoNext && (
                        <Button
                          variant="primary"
                          size="lg"
                          fullWidth
                          className="font-bold text-lg py-4 rounded-xl shadow-lg"
                          onClick={async () => {
                            await router.push(ROUTES.HOME);
                            onClose();
                          }}
                        >
                          Home
                        </Button>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
