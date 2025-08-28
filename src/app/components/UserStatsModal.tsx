import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFlagEmoji } from '../utils/languageUtils';
import { useUser } from '../contexts/UserContext';

interface UserStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

interface UserStats {
    phrasesListened: number;
    lastListenedAt: string;
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
function DailyStatsChart({ dailyStats }: { dailyStats: DailyStats[] }) {
    if (dailyStats.length === 0) return null;

    const maxCount = Math.max(...dailyStats.map(d => d.count));
    const chartHeight = 120;

    return (
        <div className="mt-2">
            <div className="flex items-end justify-between h-[120px] gap-1">
                {dailyStats.map((day, index) => {
                    const height = maxCount > 0 ? (day.count / maxCount) * chartHeight : 0;
                    const minHeight = 4; // Minimum height for 0 values to be visible
                    const finalHeight = Math.max(height, minHeight);
                    const isToday = new Date(day.date).toDateString() === new Date().toDateString();

                    return (
                        <div key={day.date} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-full rounded-t transition-all duration-300 ${isToday
                                    ? 'bg-primary'
                                    : 'bg-secondary/40 hover:bg-secondary/60'
                                    }`}
                                style={{ height: `${finalHeight}px` }}
                            />
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

// Ranking system for total phrases - Based on dedication and effort, not ability
function getPhraseRankTitle(totalPhrases: number): { title: string; color: string; nextMilestone: number; description: string } {
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

// Ranking system for individual language pairs - Based on practice time and effort
function getLanguageRankTitle(count: number): { title: string; color: string; nextMilestone: number; description: string } {
    if (count >= 15000) {
        return {
            title: "Extremely Dedicated",
            color: "text-amber-500",
            nextMilestone: 0,
            description: "Your dedication to this language is extraordinary"
        };
    } else if (count >= 10000) {
        return {
            title: "Highly Dedicated",
            color: "text-purple-600",
            nextMilestone: 15000,
            description: "You're deeply committed to practicing this language"
        };
    } else if (count >= 7500) {
        return {
            title: "Very Dedicated",
            color: "text-blue-600",
            nextMilestone: 10000,
            description: "You're showing strong commitment to this language"
        };
    } else if (count >= 5000) {
        return {
            title: "Dedicated",
            color: "text-green-600",
            nextMilestone: 7500,
            description: "You're building solid practice habits in this language"
        };
    } else if (count >= 3000) {
        return {
            title: "Consistent",
            color: "text-green-500",
            nextMilestone: 5000,
            description: "You're developing consistent practice in this language"
        };
    } else if (count >= 1500) {
        return {
            title: "Regular",
            color: "text-yellow-600",
            nextMilestone: 3000,
            description: "You're practicing this language regularly"
        };
    } else if (count >= 750) {
        return {
            title: "Active",
            color: "text-yellow-500",
            nextMilestone: 1500,
            description: "You're actively practicing this language"
        };
    } else if (count >= 300) {
        return {
            title: "Getting Into It",
            color: "text-orange-600",
            nextMilestone: 750,
            description: "You're developing interest in this language"
        };
    } else if (count >= 100) {
        return {
            title: "New to This",
            color: "text-orange-500",
            nextMilestone: 300,
            description: "You're just starting to explore this language"
        };
    } else {
        return {
            title: "First Time",
            color: "text-gray-600",
            nextMilestone: 100,
            description: "Your first steps with this language"
        };
    }
}

// Custom language pair symbol component - using flag emojis with target language prominence
function LanguagePairSymbol({ lang1, lang2, inputCount, outputCount, userPreferredLang }: {
    lang1: string;
    lang2: string;
    inputCount: number;
    outputCount: number;
    userPreferredLang?: string;
}) {
    // Determine which language is the target (learning) language
    // If user has a preferred language, the other language is the target
    const isLang1Target = userPreferredLang === lang2 && lang1 !== userPreferredLang;
    const isLang2Target = userPreferredLang === lang1 && lang2 !== userPreferredLang;

    // If neither language is the target, both should be XL
    const isNeitherTarget = !isLang1Target && !isLang2Target;

    return (
        <div className="relative w-16 h-10 flex-shrink-0">
            <div className="flex w-full h-full">
                {/* Left half - first language flag */}
                <div className="w-1/2 h-full flex items-center justify-center relative">
                    <span className={`transition-all duration-200 ${isLang1Target || isNeitherTarget ? 'text-2xl' : 'text-lg'}`}>
                        {getFlagEmoji(lang1)}
                    </span>

                </div>
                {/* Right half - second language flag */}
                <div className="w-1/2 h-full flex items-center justify-center relative">
                    <span className={`transition-all duration-200 ${isLang2Target || isNeitherTarget ? 'text-2xl' : 'text-lg'}`}>
                        {getFlagEmoji(lang2)}
                    </span>

                </div>
            </div>
            {/* Center line separator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400"></div>
        </div>
    );
}

// Function to combine bidirectional language pairs
function combineLanguagePairs(languageStats: LanguageStats[]): Array<{
    languages: string[];
    totalCount: number;
    firstListened: string;
    inputCount: number;
    outputCount: number;
}> {
    const combinedMap = new Map<string, {
        languages: string[];
        totalCount: number;
        firstListened: string;
        inputCount: number;
        outputCount: number;
    }>();

    languageStats.forEach(stat => {
        // Create a unique key for the language pair (sorted alphabetically)
        const sortedLangs = [stat.inputLang, stat.targetLang].sort();
        const key = sortedLangs.join('-');

        if (combinedMap.has(key)) {
            const existing = combinedMap.get(key)!;
            existing.totalCount += stat.count;
            existing.inputCount += stat.inputLang === sortedLangs[0] ? stat.count : 0;
            existing.outputCount += stat.targetLang === sortedLangs[1] ? stat.count : 0;
            // Keep the earliest first listened date
            if (new Date(stat.firstListened) < new Date(existing.firstListened)) {
                existing.firstListened = stat.firstListened;
            }
        } else {
            combinedMap.set(key, {
                languages: sortedLangs,
                totalCount: stat.count,
                firstListened: stat.firstListened,
                inputCount: stat.inputLang === sortedLangs[0] ? stat.count : 0,
                outputCount: stat.targetLang === sortedLangs[1] ? stat.count : 0
            });
        }
    });

    return Array.from(combinedMap.values()).sort((a, b) => b.totalCount - a.totalCount);
}

export function UserStatsModal({ isOpen, onClose, user }: UserStatsModalProps) {
    const { userProfile } = useUser();
    const [mainStats, setMainStats] = useState<UserStats | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchStats = async () => {
            try {
                const firestore = getFirestore();

                // Fetch main stats
                const statsRef = doc(firestore, 'users', user.uid, 'stats', 'listening');
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    setMainStats(statsDoc.data() as UserStats);
                }

                // Fetch daily stats (last 7 days)
                const dailyStatsRef = collection(firestore, 'users', user.uid, 'stats', 'listening', 'daily');
                const dailyQuery = query(dailyStatsRef, orderBy('date', 'desc'), limit(7));
                const dailySnapshot = await getDocs(dailyQuery);
                const dailyData = dailySnapshot.docs.map(doc => doc.data() as DailyStats);

                // Fill in missing days with 0 counts to ensure we always show 7 days
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateString = date.toISOString().split('T')[0];

                    const existingDay = dailyData.find(day => day.date === dateString);
                    if (existingDay) {
                        last7Days.push(existingDay);
                    } else {
                        last7Days.push({
                            date: dateString,
                            count: 0,
                            lastUpdated: date.toISOString()
                        });
                    }
                }

                setDailyStats(last7Days);

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

    // Get today's stats
    const todayStats = dailyStats.find(day =>
        new Date(day.date).toDateString() === new Date().toDateString()
    );
    const todayCount = todayStats?.count || 0;

    // Get yesterday's stats for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStats = dailyStats.find(day =>
        new Date(day.date).toDateString() === yesterday.toDateString()
    );
    const yesterdayCount = yesterdayStats?.count || 0;

    // Calculate trend
    const trend = todayCount > yesterdayCount ? 'up' : todayCount < yesterdayCount ? 'down' : 'same';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Your Stats</h2>
                    <button
                        onClick={onClose}
                        className="text-foreground/60 hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-4">Loading stats...</div>
                ) : mainStats ? (
                    <div className="space-y-6">
                        {/* Today's Focus - Prominent Display */}
                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
                            <h3 className="text-lg font-semibold mb-3">Today's Progress</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary">{todayCount}</div>
                                    <div className="text-sm text-foreground/60">Phrases Today</div>
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
                                        vs Yesterday ({yesterdayCount})
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Chart */}
                        {dailyStats.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-4">Last 7 Days</h3>
                                <DailyStatsChart dailyStats={dailyStats} />
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
                                {languageStats.length > 1 && (
                                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-lg border border-purple-300/30 mb-3">
                                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                                            🌍 Polyglot Learner
                                        </div>
                                        <div className="text-xs text-foreground/70">
                                            You're practicing {languageStats.length} different language pairs
                                        </div>
                                    </div>
                                )}

                                {getPhraseRankTitle(mainStats.phrasesListened).nextMilestone > 0 && (
                                    <div className="text-sm text-foreground/60">
                                        Next milestone: {getPhraseRankTitle(mainStats.phrasesListened).nextMilestone.toLocaleString()} phrases
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Language Pairs with Ranking */}
                        {languageStats.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Language Pairs</h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const combinedPairs = combineLanguagePairs(languageStats);
                                        return combinedPairs.map((pair, index) => {
                                            const rankInfo = getLanguageRankTitle(pair.totalCount);
                                            return (
                                                <div key={pair.languages.join('-')} className="bg-secondary/20 p-3 rounded">
                                                    <div className="flex items-center gap-3">
                                                        <LanguagePairSymbol
                                                            lang1={pair.languages[0]}
                                                            lang2={pair.languages[1]}
                                                            inputCount={pair.inputCount}
                                                            outputCount={pair.outputCount}
                                                            userPreferredLang={userProfile?.preferredInputLang}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">
                                                                    {pair.languages[0]} ↔ {pair.languages[1]}
                                                                </span>
                                                                <span className="font-semibold">{pair.totalCount.toLocaleString()} phrases</span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-1">
                                                                <div className="text-sm text-foreground/60">
                                                                    First practiced: {new Date(pair.firstListened).toLocaleDateString()}
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
        </div>
    );
}