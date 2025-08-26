import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFlagEmoji } from '../utils/languageUtils';

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

export function UserStatsModal({ isOpen, onClose, user }: UserStatsModalProps) {
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
                setDailyStats(dailyData);

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/20 p-4 rounded">
                                <div className="text-sm text-foreground/60">Total Phrases Listened All Time</div>
                                <div className="text-2xl font-bold">{mainStats.phrasesListened}</div>
                            </div>
                            <div className="bg-secondary/20 p-4 rounded">
                                <div className="text-sm text-foreground/60">Last Activity</div>
                                <div className="text-lg">
                                    {new Date(mainStats.lastListenedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {dailyStats.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Last 7 Days</h3>
                                <div className="space-y-2">
                                    {dailyStats.map((day) => (
                                        <div key={day.date} className="bg-secondary/20 p-3 rounded">
                                            <div className="flex justify-between">
                                                <span>{new Date(day.date).toLocaleDateString()}</span>
                                                <span className="font-semibold">{day.count} phrases</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {languageStats.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Language Pairs</h3>
                                <div className="space-y-2">
                                    {languageStats
                                        .sort((a, b) => b.count - a.count)
                                        .map((data) => (
                                            <div key={`${data.inputLang}-${data.targetLang}`} className="bg-secondary/20 p-3 rounded">
                                                <div className="flex justify-between items-center">
                                                    <span className="flex items-center gap-1">
                                                        {getFlagEmoji(data.inputLang)} → {getFlagEmoji(data.targetLang)}
                                                    </span>
                                                    <span className="font-semibold">{data.count} phrases</span>
                                                </div>
                                                <div className="text-sm text-foreground/60 mt-1">
                                                    First practiced: {new Date(data.firstListened).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4">No stats available yet</div>
                )}
            </div>
        </div>
    );
}