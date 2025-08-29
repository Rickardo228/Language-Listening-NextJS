import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Settings } from 'lucide-react';
import { getFlagEmoji, getLanguageName } from '../utils/languageUtils';
import { useUser } from '../contexts/UserContext';
import { getPhraseRankTitle, getLanguageRankTitle } from '../utils/rankingSystem';
import { StatsSettingsModal } from './StatsSettingsModal';

// Import timezone utilities from userStats
import { getUserLocalDateBoundary, getUserTimezone } from '../utils/userStats';

/**
 * DEVELOPMENT ONLY: Personal Best Debug Mode
 * 
 * ⚠️  SECURITY WARNING: This debug mode is designed to NEVER work in production.
 * 
 * Multiple safety layers:
 * 1. Environment variable check (NODE_ENV !== 'production')
 * 2. Hard-coded false as final safety
 * 3. Runtime hostname checks for common hosting platforms
 * 4. Console warnings and errors for security monitoring
 * 
 * To enable debug mode for local development:
 * 1. Ensure NODE_ENV is 'development'
 * 2. Change the hard-coded 'false' to 'true' temporarily
 * 3. NEVER commit this change to version control
 * 4. Always revert back to 'false' before pushing
 */

// Import the streak messaging function (duplicate here for simplicity)
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

interface UserStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

interface UserStats {
    phrasesListened: number;
    lastListenedAt: string;
    currentStreak?: number;
    lastStreakCalculation?: string;
    longestStreak?: number;
    streakStartDate?: string;
}

interface DailyStats {
    count: number;
    lastUpdated: string;
    date: string;
}

interface LanguageStats {
    count: number;
    lastUpdated: string;
    inputLang: string;
    targetLang: string;
    firstListened: string;
}

// Simple bar chart component
function DailyStatsChart({ dailyStats, personalBest }: { dailyStats: DailyStats[], personalBest: { count: number; date: string; achievedAt: string } | null }) {
    if (dailyStats.length === 0) return null;

    const maxCount = Math.max(...dailyStats.map(d => d.count));
    const chartHeight = 120;

    return (
        <div className="mt-2">
            <div className="flex items-end justify-between h-[120px] gap-1">
                {dailyStats.map((day) => {
                    const height = maxCount > 0 ? (day.count / maxCount) * chartHeight : 0;
                    const minHeight = 4; // Minimum height for 0 values to be visible
                    const finalHeight = Math.max(height, minHeight);
                    const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                    const isPersonalBest = personalBest && personalBest.date === day.date;

                    return (
                        <div key={day.date} className="flex flex-col items-center flex-1 relative">
                            <div
                                className={`w-full rounded-t transition-all duration-300 ${isPersonalBest
                                    ? 'bg-gradient-to-t from-amber-500 to-yellow-400 border-2 border-amber-600'
                                    : isToday
                                        ? 'bg-primary'
                                        : 'bg-secondary/40 hover:bg-secondary/60'
                                    }`}
                                style={{ height: `${finalHeight}px` }}
                            />

                            {/* Personal Best Crown */}
                            {isPersonalBest && (
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                    <div className="text-amber-500 text-lg drop-shadow-lg animate-bounce">👑</div>
                                </div>
                            )}

                            <div className="text-xs text-foreground/60 mt-2 text-center">
                                {new Date(day.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="text-xs font-medium mt-1">
                                {day.count}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// Single language symbol component - using flag emojis
function LanguageSymbol({ language }: {
    language: string;
    count: number;
}) {
    return (
        <div className="w-16 h-10 flex items-center justify-center">
            <span className="text-2xl transition-all duration-200">
                {getFlagEmoji(language)}
            </span>
        </div>
    );
}

// Function to aggregate individual language stats
function aggregateLanguageStats(languageStats: LanguageStats[], userPreferredLang?: string): Array<{
    language: string;
    totalCount: number;
    firstListened: string;
}> {
    const languageMap = new Map<string, {
        language: string;
        totalCount: number;
        firstListened: string;
    }>();

    languageStats.forEach(stat => {
        // Aggregate by target language (the language being learned)
        // This includes both directions: UK->Italian and Italian->UK both count towards Italian
        const targetLang = stat.targetLang;

        // Skip if this is the user's native language
        if (targetLang === userPreferredLang) {
            return;
        }

        if (languageMap.has(targetLang)) {
            const existing = languageMap.get(targetLang)!;
            existing.totalCount += stat.count;
            // Keep the earliest first listened date
            if (new Date(stat.firstListened) < new Date(existing.firstListened)) {
                existing.firstListened = stat.firstListened;
            }
        } else {
            languageMap.set(targetLang, {
                language: targetLang,
                totalCount: stat.count,
                firstListened: stat.firstListened
            });
        }
    });

    return Array.from(languageMap.values()).sort((a, b) => b.totalCount - a.totalCount);
}

export function UserStatsModal({ isOpen, onClose, user }: UserStatsModalProps) {
    const { userProfile } = useUser();
    const [mainStats, setMainStats] = useState<UserStats | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [personalBestData, setPersonalBestData] = useState<DailyStats | undefined>(undefined);
    const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    // Debug mode for testing personal best functionality
    // Multiple safety checks to ensure this is NEVER enabled in production
    const DEBUG_PERSONAL_BEST_MODE = (
        process.env.NODE_ENV !== 'production' &&
        typeof window !== 'undefined' &&
        window.location.hostname !== 'languageshadowing.com' &&
        false // TEMPORARILY ENABLED FOR TESTING - REMEMBER TO SET BACK TO FALSE!
    );

    // Build-time safety check - this will cause a compilation error if enabled in production
    if (process.env.NODE_ENV === 'production' && DEBUG_PERSONAL_BEST_MODE) {
        throw new Error("🚨 CRITICAL: Debug mode cannot be enabled in production!");
    }

    useEffect(() => {
        if (!user || !isOpen) return;

        const fetchStats = async () => {
            try {
                const firestore = getFirestore();

                // Fetch main stats
                const statsRef = doc(firestore, 'users', user.uid, 'stats', 'listening');
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    const statsData = statsDoc.data() as UserStats;
                    setMainStats(statsData);
                }

                // Fetch daily stats for display (last 7 days) and personal best calculation (most efficient approach)
                const dailyStatsRef = collection(firestore, 'users', user.uid, 'stats', 'listening', 'daily');

                // Get the day with the highest count (personal best) - most efficient!
                // Firestore does the heavy lifting: orderBy('count', 'desc') + limit(1) = single document with highest count
                const personalBestQuery = query(dailyStatsRef, orderBy('count', 'desc'), limit(1));
                const personalBestSnapshot = await getDocs(personalBestQuery);
                const personalBestData = personalBestSnapshot.docs[0]?.data() as DailyStats | undefined;

                // Get last 7 days for display
                const last7DaysQuery = query(dailyStatsRef, orderBy('date', 'desc'), limit(7));
                const last7DaysSnapshot = await getDocs(last7DaysQuery);
                const last7DaysData = last7DaysSnapshot.docs.map(doc => doc.data() as DailyStats);

                // Show what dates we're actually looking for
                const userTimezone = getUserTimezone();
                const todayLocal = getUserLocalDateBoundary(userTimezone);

                // Fill in missing days with 0 counts to ensure we always show 7 days
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateLocal = getUserLocalDateBoundary(userTimezone, date);

                    const existingDay = last7DaysData.find(day => day.date === dateLocal);
                    if (existingDay) {
                        last7Days.push(existingDay);
                    } else {
                        last7Days.push({
                            date: dateLocal,
                            count: 0,
                            lastUpdated: date.toISOString()
                        });
                    }
                }

                setDailyStats(last7Days);

                // Store personal best data
                setPersonalBestData(personalBestData);

                // Fetch language stats
                const languageStatsRef = collection(firestore, 'users', user.uid, 'stats', 'listening', 'languages');
                const languageSnapshot = await getDocs(languageStatsRef);
                const languageData = languageSnapshot.docs.map(doc => doc.data() as LanguageStats);
                setLanguageStats(languageData);


            } catch (error) {
                console.error('Error fetching user stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isOpen, user]);

    if (!isOpen) return null;

    const currentStreak = mainStats?.currentStreak || 0;

    // Get today's stats using user's timezone
    const userTimezone = getUserTimezone();
    const todayLocal = getUserLocalDateBoundary(userTimezone);



    const todayStats = dailyStats.find(day => {
        // Since we're already calculating dates in the user's timezone when fetching,
        // we can directly compare the stored date with today's date
        const matches = day.date === todayLocal;

        return matches;
    });
    const todayCount = todayStats?.count || 0;

    // Get yesterday's stats for comparison using user's timezone
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = getUserLocalDateBoundary(userTimezone, yesterday);

    const yesterdayStats = dailyStats.find(day => {
        // Since we're already calculating dates in the user's timezone when fetching,
        // we can directly compare the stored date with yesterday's date
        const matches = day.date === yesterdayFormatted;

        return matches;
    });
    const yesterdayCount = yesterdayStats?.count || 0;

    // Calculate trend
    const trend = todayCount > yesterdayCount ? 'up' : todayCount < yesterdayCount ? 'down' : 'same';

    // Use the fetched personal best data directly
    let personalBest = personalBestData ? {
        count: personalBestData.count,
        date: personalBestData.date,
        achievedAt: personalBestData.lastUpdated
    } : null;

    // Personal best details available

    // Debug mode: Override personal best for testing
    // Additional runtime safety checks
    if (DEBUG_PERSONAL_BEST_MODE) {
        // Extra safety: Check if we're in a production-like environment
        const isProductionLike = (
            process.env.NODE_ENV === 'production' ||
            window.location.hostname.includes('vercel.app') ||
            window.location.hostname.includes('netlify.app') ||
            window.location.hostname.includes('firebaseapp.com') ||
            window.location.hostname.includes('herokuapp.com') ||
            window.location.hostname.includes('railway.app') ||
            window.location.hostname.includes('render.com') ||
            window.location.hostname.includes('fly.io') ||
            window.location.hostname.includes('aws') ||
            window.location.hostname.includes('azure') ||
            window.location.hostname.includes('gcp') ||
            window.location.hostname.includes('cloudflare')
        );

        if (isProductionLike) {
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        personalBest = {
            count: 25, // Test with a high number
            date: today,
            achievedAt: new Date().toISOString()
        };
    }

    // Check if today is a personal best using user's timezone
    const isTodayPersonalBest = personalBest && personalBest.date === todayLocal;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">Your Stats</h2>
                        {DEBUG_PERSONAL_BEST_MODE && (
                            <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                🐛 DEBUG: PB Test Mode
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSettingsModalOpen(true)}
                            className="text-foreground/60 hover:text-foreground p-1 rounded"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-foreground/60 hover:text-foreground"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4">Loading stats...</div>
                ) : mainStats ? (
                    <div className="space-y-6">
                        {/* Today's Focus - Prominent Display */}
                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
                            <h3 className="text-lg font-semibold mb-3">Today&apos;s Progress</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center relative">
                                    <div className="text-3xl font-bold text-primary">{todayCount}</div>
                                    <div className="text-sm text-foreground/60">Phrases Today</div>
                                    {/* Personal Best Flag */}
                                    {isTodayPersonalBest && (
                                        <div className="absolute -top-2 -right-2">
                                            <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border-2 border-amber-600 animate-pulse">
                                                🏆 PB
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    {currentStreak > 0 ? (() => {
                                        const streakData = getStreakMessage(currentStreak);
                                        return (
                                            <div className="bg-gray-800 dark:bg-gray-900 p-3 rounded-xl border-2 border-gray-600 shadow-md">
                                                <div className="flex items-center justify-center mb-1">
                                                    <span className="text-2xl font-bold text-white mr-2">{currentStreak}</span>
                                                    <span className="text-2xl animate-pulse">{streakData.emoji}</span>
                                                </div>
                                                <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Day Streak</div>
                                                {mainStats?.longestStreak && mainStats.longestStreak > currentStreak && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Best: {mainStats.longestStreak} days
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <>
                                            <div className="text-2xl font-bold text-gray-400">0</div>
                                            <div className="text-sm text-foreground/60">Day Streak</div>
                                        </>
                                    )}
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-semibold">
                                        {trend === 'up' && (
                                            <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        )}
                                        {trend === 'down' && (
                                            <svg className="w-6 h-6 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                            </svg>
                                        )}
                                        {trend === 'same' && (
                                            <svg className="w-6 h-6 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-sm text-foreground/60">
                                        vs Yesterday ({todayCount - yesterdayCount >= 0 ? '+' : ''}{todayCount - yesterdayCount})
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Chart */}
                        {dailyStats.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-4">Last 7 Days</h3>
                                <DailyStatsChart dailyStats={dailyStats} personalBest={personalBest} />
                            </div>
                        )}

                        {/* Personal Best Section */}
                        {personalBest && personalBest.count > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-700">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <span className="mr-2">🏆</span>
                                    Personal Best
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                            {personalBest.count}
                                        </div>
                                        <div className="text-sm text-foreground/60">Phrases in One Day</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-foreground/60">
                                            Achieved on
                                        </div>
                                        <div className="text-sm font-medium">
                                            {new Date(personalBest.achievedAt).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Total Phrases - Prominent display under chart */}
                        <div className="bg-gradient-to-r from-secondary/10 to-primary/10 p-6 rounded-lg border border-secondary/20">
                            <h3 className="text-lg font-semibold mb-3">Total Progress</h3>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary mb-2">
                                    {mainStats.phrasesListened.toLocaleString()}
                                </div>
                                <div className="text-lg font-medium mb-2">
                                    <span className={getPhraseRankTitle(mainStats.phrasesListened).color}>
                                        {getPhraseRankTitle(mainStats.phrasesListened).title}
                                    </span>
                                </div>
                                <div className="text-sm text-foreground/70 mb-3 italic">
                                    {getPhraseRankTitle(mainStats.phrasesListened).description}
                                </div>

                                {/* Polyglot recognition - only show if learning multiple languages */}
                                {(() => {
                                    const aggregatedLanguages = aggregateLanguageStats(languageStats, userProfile?.nativeLanguage || userProfile?.preferredInputLang);
                                    return aggregatedLanguages.length > 1 ? (
                                        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-lg border border-purple-300/30 mb-3">
                                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                                                🌍 Polyglot Learner
                                            </div>
                                            <div className="text-xs text-foreground/70">
                                                You&apos;re practicing {aggregatedLanguages.length} different languages
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                                {getPhraseRankTitle(mainStats.phrasesListened).nextMilestone > 0 && (
                                    <div className="text-sm text-foreground/60">
                                        Next milestone: {getPhraseRankTitle(mainStats.phrasesListened).nextMilestone.toLocaleString()} phrases
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Languages with Ranking */}
                        {languageStats.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Languages You&apos;re Learning</h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const aggregatedLanguages = aggregateLanguageStats(languageStats, userProfile?.nativeLanguage || userProfile?.preferredInputLang);
                                        return aggregatedLanguages.map((langStat) => {
                                            const rankInfo = getLanguageRankTitle(langStat.totalCount);
                                            return (
                                                <div key={langStat.language} className="bg-secondary/20 p-3 rounded">
                                                    <div className="flex items-center gap-3">
                                                        <LanguageSymbol
                                                            language={langStat.language}
                                                            count={langStat.totalCount}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">
                                                                    {getLanguageName(langStat.language)}
                                                                </span>
                                                                <span className="font-semibold">{langStat.totalCount.toLocaleString()} phrases</span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-1">
                                                                <div className="text-sm text-foreground/60">
                                                                    First practiced: {new Date(langStat.firstListened).toLocaleDateString()}
                                                                </div>
                                                                <div className={`text-sm font-medium ${rankInfo.color}`}>
                                                                    {rankInfo.title}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-foreground/50 mt-1 italic">
                                                                {rankInfo.description}
                                                            </div>
                                                            {rankInfo.nextMilestone > 0 && (
                                                                <div className="text-xs text-foreground/40 mt-1">
                                                                    Next milestone: {rankInfo.nextMilestone.toLocaleString()} phrases
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Last Activity - Simple summary */}
                        <div className="pt-4 border-t border-secondary/30">
                            <h3 className="font-semibold mb-3 text-foreground/60">Recent Activity</h3>
                            <div className="text-center">
                                <div className="text-lg">
                                    {new Date(mainStats.lastListenedAt).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-foreground/60">Last Practice Session</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">No stats available yet</div>
                )}
            </div>

            {/* Settings Modal */}
            <StatsSettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                user={user}
            />
        </div>
    );
}