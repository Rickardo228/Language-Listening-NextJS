import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFlagEmoji, getLanguageName } from '../utils/languageUtils';
import { useUser } from '../contexts/UserContext';
import { getPhraseRankTitle, getLanguageRankTitle } from '../utils/rankingSystem';

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


// Single language symbol component - using flag emojis
function LanguageSymbol({ language, count }: {
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

        // Skip if this is the user's native language (preferred input language)
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
                                {(() => {
                                    const aggregatedLanguages = aggregateLanguageStats(languageStats, userProfile?.preferredInputLang);
                                    return aggregatedLanguages.length > 1 ? (
                                        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-lg border border-purple-300/30 mb-3">
                                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                                                🌍 Polyglot Learner
                                            </div>
                                            <div className="text-xs text-foreground/70">
                                                You're practicing {aggregatedLanguages.length} different languages
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
                                <h3 className="font-semibold mb-3">Languages You're Learning</h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const aggregatedLanguages = aggregateLanguageStats(languageStats, userProfile?.preferredInputLang);
                                        return aggregatedLanguages.map((langStat, index) => {
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
        </div>
    );
}