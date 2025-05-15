import { useRef, useEffect, useState } from 'react';
import { User, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface UserAvatarProps {
    user: User | null;
    avatarDialogOpen: boolean;
    setAvatarDialogOpen: (open: boolean) => void;
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

// Utility function to convert language code to flag emoji
function getFlagEmoji(languageCode: string): string {
    // Extract the country code from the language code (e.g., "en-US" -> "US")
    const countryCode = languageCode.split('-')[1];
    if (!countryCode) return '🌐';

    // Convert country code to regional indicator symbols
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

function UserStatsModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: User }) {
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

export function UserAvatar({ user, avatarDialogOpen, setAvatarDialogOpen }: UserAvatarProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [statsModalOpen, setStatsModalOpen] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                setAvatarDialogOpen(false);
            }
        }

        if (avatarDialogOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [avatarDialogOpen, setAvatarDialogOpen]);

    return (
        <div className="relative" ref={dialogRef}>
            {user ? (
                <button
                    className="flex items-center gap-2 focus:outline-none"
                    onClick={() => setAvatarDialogOpen(true)}
                    title={user.displayName || user.email || "Account"}
                >
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">
                            {user.displayName?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}
                </button>
            ) : (
                <button
                    className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                    onClick={() => {
                        const provider = new GoogleAuthProvider();
                        signInWithPopup(auth, provider).catch(console.error);
                    }}
                >
                    Sign In / Create Account
                </button>
            )}

            {/* Dialog */}
            {avatarDialogOpen && user && (
                <div className="absolute right-0 mt-2 w-48 bg-background border rounded shadow-lg z-50">
                    <div className="p-4 border-b">
                        <div className="font-semibold">{user.displayName || user.email}</div>
                    </div>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-secondary"
                        onClick={() => {
                            setStatsModalOpen(true);
                            setAvatarDialogOpen(false);
                        }}
                    >
                        View Stats
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-secondary"
                        onClick={() => {
                            signOut(auth);
                            setAvatarDialogOpen(false);
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            )}

            <UserStatsModal
                isOpen={statsModalOpen}
                onClose={() => setStatsModalOpen(false)}
                user={user!}
            />
        </div>
    );
} 