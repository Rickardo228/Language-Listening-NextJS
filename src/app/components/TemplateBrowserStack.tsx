'use client'

import { useMemo, useRef, useState, useEffect } from 'react';
import { BookOpen, Newspaper, BookText, Settings, type LucideIcon } from 'lucide-react';
import { TemplatesBrowser } from './TemplatesBrowser';
import { useUser } from '../contexts/UserContext';
import { getRecommendedPaths } from '../utils/contentRecommendations';
import {
    DEFAULT_INPUT_LANG,
    DEFAULT_TARGET_LANG,
    getRecentTemplateBrowserIds,
} from '../utils/templateBrowserRecency';
import { RecentlyViewedTemplates } from './RecentlyViewedTemplates';
import { UserPreferencesModal } from './UserPreferencesModal';
import { CategoryChips } from './CategoryChips';

interface TemplateBrowserStackProps {
    showAllOverride?: boolean;
    className?: string;
}

type TemplateCategory = 'learn' | 'news' | 'stories';

const BEGINNER_PATH_ID = 'beginner_path';
const NEWS_GENERATOR_TAG = 'process:news-generator';
const LAST_CATEGORY_KEY = 'templateBrowserLastCategory';
const CATEGORY_CHIPS: Array<{ id: TemplateCategory; label: string; icon: LucideIcon }> = [
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'stories', label: 'Stories', icon: BookText },
];

export function TemplateBrowserStack({
    showAllOverride = false,
    className = ''
}: TemplateBrowserStackProps) {
    const { user, userProfile } = useUser();
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(LAST_CATEGORY_KEY);
            if (saved && (saved === 'learn' || saved === 'news' || saved === 'stories')) {
                return saved as TemplateCategory;
            }
        }
        return 'learn';
    });
    const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(LAST_CATEGORY_KEY, activeCategory);
    }, [activeCategory]);

    const learningPaths = getRecommendedPaths(userProfile?.abilityLevel);
    const inputLang = userProfile?.preferredInputLang || DEFAULT_INPUT_LANG;
    const targetLang = userProfile?.preferredTargetLang || DEFAULT_TARGET_LANG;
    const shouldUseRecencyRef = useRef<boolean | null>(null);
    if (shouldUseRecencyRef.current === null) {
        shouldUseRecencyRef.current = Boolean(user?.uid && userProfile);
    }
    const shouldUseRecency = shouldUseRecencyRef.current;
    const recentBrowserIds = useMemo(
        () =>
            shouldUseRecency
                ? getRecentTemplateBrowserIds({ userId: user?.uid, inputLang, targetLang })
                : [],
        [shouldUseRecency, user?.uid, inputLang, targetLang]
    );

    const recentOrderMap = new Map(
        recentBrowserIds.map((id, index) => [id, index])
    );

    const defaultBrowsers = [
        ...learningPaths.map((path) => ({
            id: path.id,
            category: path.pathId === BEGINNER_PATH_ID ? 'learn' as const : 'stories' as const,
            element: (
                <TemplatesBrowser
                    key={path.id}
                    pathId={path.pathId}
                    showHeader={false}
                    title={path.title}
                    className="mt-2"
                    noTemplatesComponent={<></>}
                    showAllOverride={showAllOverride}
                    browserId={path.id}
                />
            ),
        })),
        {
            id: 'new_lists',
            category: 'learn' as const,
            element: (
                <TemplatesBrowser
                    key="new_lists"
                    showHeader={false}
                    title="New Lists"
                    excludeTags={[NEWS_GENERATOR_TAG]}
                    showAllOverride={showAllOverride}
                    browserId="new_lists"
                />
            ),
        },
        {
            id: 'recommended_for_you',
            category: 'learn' as const,
            element: (
                <TemplatesBrowser
                    key="recommended_for_you"
                    showHeader={false}
                    title="Recommended for You"
                    tags={userProfile?.contentPreferences || []}
                    excludeTags={[NEWS_GENERATOR_TAG]}
                    noTemplatesComponent={<></>}
                    showAllOverride={showAllOverride}
                    browserId="recommended_for_you"
                />
            ),
        },
        {
            id: 'news_lists',
            category: 'news' as const,
            element: (
                <TemplatesBrowser
                    key="news_lists"
                    showHeader={false}
                    title="News"
                    tags={[NEWS_GENERATOR_TAG]}
                    noTemplatesComponent={<></>}
                    showAllOverride={showAllOverride}
                    browserId="news_lists"
                />
            ),
        },
    ];

    const sortedBrowsers = defaultBrowsers
        .filter((browser) => browser.category === activeCategory)
        .map((browser, defaultIndex) => ({
            ...browser,
            defaultIndex,
            recentIndex: recentOrderMap.get(browser.id),
        }))
        .sort((a, b) => {
            const aRecent = a.recentIndex;
            const bRecent = b.recentIndex;

            if (aRecent == null && bRecent == null) {
                return a.defaultIndex - b.defaultIndex;
            }

            if (aRecent == null) return 1;
            if (bRecent == null) return -1;

            return aRecent - bRecent;
        })
        .map((browser) => browser.element);

    return (
        <div className={`p-4 space-y-12 ${className}`}>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-2">
                    <CategoryChips
                        chips={CATEGORY_CHIPS}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                    />
                    <button
                        type="button"
                        onClick={() => setPreferencesModalOpen(true)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Settings"
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </div>
            {sortedBrowsers}
            <RecentlyViewedTemplates category={activeCategory} />
            {user && (
                <UserPreferencesModal
                    isOpen={preferencesModalOpen}
                    onClose={() => setPreferencesModalOpen(false)}
                    user={user}
                />
            )}
        </div>
    );
}
