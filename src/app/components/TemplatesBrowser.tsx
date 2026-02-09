'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy, limit, QuerySnapshot, DocumentSnapshot, } from 'firebase/firestore';
import { languageOptions, Config, PresentationConfig, Template } from '../types';
import { CollectionList, CollectionStatus } from '../CollectionList';
import { LanguageSelector } from './LanguageSelector';
import { useUser } from '../contexts/UserContext';
import { track } from '../../lib/mixpanelClient';
import { loadProgress } from '../utils/progressService';
import { buildTemplateUrl } from '../utils/templateRoutes';
import { recordTemplateBrowserUsage } from '../utils/templateBrowserRecency';
type TemplateWithTimestamp = Template & { createdAt: Timestamp };
import { resetMainScroll } from '../utils/scroll';
import { ROUTES } from '../routes';

const firestore = getFirestore();

interface TemplatesBrowserProps {
    initialInputLang?: string;
    initialTargetLang?: string;
    showHeader?: boolean;
    className?: string;
    tags?: string[];
    excludeTags?: string[];
    title?: string | React.ReactNode;
    noTemplatesComponent?: React.ReactNode;
    pathId?: string;
    showAllOverride?: boolean;
    browserId?: string;
    groupIdQueryOverride?: string[];
    categoryFilter?: 'learn' | 'news' | 'stories';
}

export function TemplatesBrowser({
    initialInputLang = 'en-GB',
    initialTargetLang = 'it-IT',
    showHeader = true,
    className,
    tags = [],
    excludeTags = [],
    title,
    noTemplatesComponent,
    pathId,
    showAllOverride = false,
    browserId,
    groupIdQueryOverride,
    categoryFilter,
}: TemplatesBrowserProps) {
    const router = useRouter();
    const { user, userProfile } = useUser();
    const [templates, setTemplates] = useState<TemplateWithTimestamp[]>([]);
    const [loading, setLoading] = useState(true);
    // For learning paths, we fetch all items initially, so isShowingAll should start as true
    const [isShowingAll, setIsShowingAll] = useState(Boolean(pathId));
    const [templateProgress, setTemplateProgress] = useState<Record<string, { completedAt?: string; listenedCount: number; lastPhraseIndex?: number }>>({});

    // Use user preferences if available, otherwise fall back to props
    const [inputLang, setInputLang] = useState(
        userProfile?.preferredInputLang || initialInputLang
    );
    const [targetLang, setTargetLang] = useState(
        userProfile?.preferredTargetLang || initialTargetLang
    );
    const hasInitialFetch = useRef(false);
    const lastFilterKeyRef = useRef<string | null>(null);
    const normalizeTemplate = (doc: DocumentSnapshot) => {
        const data = doc.data() as Template | undefined;
        const createdAt = (data?.createdAt as Timestamp | undefined) || Timestamp.now();
        return { id: doc.id, ...data, createdAt } as TemplateWithTimestamp;
    };
    const NEWS_GENERATOR_TAG = 'process:news-generator';
    const BEGINNER_PATH_ID = 'beginner_path';
    const matchesCategoryFilter = (template: TemplateWithTimestamp) => {
        if (!categoryFilter) return true;
        const isNews = template.tags?.includes(NEWS_GENERATOR_TAG) ?? false;
        const isStory = Boolean(template.pathId && template.pathId !== BEGINNER_PATH_ID);
        if (categoryFilter === 'news') return isNews;
        if (categoryFilter === 'stories') return isStory;
        return !isNews && !isStory;
    };
    const filterByCategory = (templateList: TemplateWithTimestamp[]) =>
        categoryFilter ? templateList.filter(matchesCategoryFilter) : templateList;
    const hasExcludedTag = (template: TemplateWithTimestamp) =>
        excludeTags.some((tag) => template.tags?.includes(tag));
    const filterExcludedTemplates = (templateList: TemplateWithTimestamp[]) =>
        excludeTags.length > 0 ? templateList.filter((template) => !hasExcludedTag(template)) : templateList;
    const applyTemplateFilters = (templateList: TemplateWithTimestamp[]) =>
        filterExcludedTemplates(filterByCategory(templateList));
    const filterChangeKey = [
        pathId || '',
        tags.join(','),
        excludeTags.join(','),
        (groupIdQueryOverride || []).join(','),
        categoryFilter || '',
    ].join('::');

    // Fetch templates for the current language pair (optionally overridden)
    const fetchTemplates = useCallback(
        async (
            currentInputLang?: string,
            currentTargetLang?: string,
            options?: { fetchAll?: boolean; limitCount?: number }
        ) => {
            // Use the passed values or fall back to state values
            const inputLangToUse = currentInputLang || inputLang;
            const targetLangToUse = currentTargetLang || targetLang;

            setLoading(true);

            try {
                const templatesRef = collection(firestore, 'templates');
                const FETCH_LIMIT = options?.limitCount || 10;

                // Handle groupIdQueryOverride - fetch specific templates by groupId
                if (groupIdQueryOverride && groupIdQueryOverride.length > 0) {
                    const templates: TemplateWithTimestamp[] = [];
                    const batchSize = 30; // Firestore 'in' query limit

                    for (let i = 0; i < groupIdQueryOverride.length; i += batchSize) {
                        const batch = groupIdQueryOverride.slice(i, i + batchSize);
                        const q = query(templatesRef, where('groupId', 'in', batch));
                        const querySnapshot = await getDocs(q);

                        querySnapshot.docs.forEach(doc => {
                            templates.push(normalizeTemplate(doc));
                        });
                    }

                    // Group by groupId and filter for language pair
                    const templatesByGroup = templates.reduce((acc, template) => {
                        if (!acc[template.groupId]) {
                            acc[template.groupId] = [] as TemplateWithTimestamp[];
                        }
                        (acc[template.groupId] as TemplateWithTimestamp[]).push(template);
                        return acc;
                    }, {} as Record<string, TemplateWithTimestamp[]>);

                    const uniqueTemplates = Object.values(templatesByGroup)
                        .filter((groupTemplates) => {
                            const hasInput = groupTemplates.some((t) => t.lang === inputLangToUse);
                            const hasTarget = groupTemplates.some((t) => t.lang === targetLangToUse);
                            return hasInput && hasTarget;
                        })
                        .map((groupTemplates) => groupTemplates.find((t) => t.lang === inputLangToUse) || groupTemplates[0]);

                    // Maintain the order from groupIdQueryOverride
                    const orderedTemplates = groupIdQueryOverride
                        .map(groupId => uniqueTemplates.find(t => t.groupId === groupId))
                        .filter((t): t is TemplateWithTimestamp => t !== undefined);

                    setTemplates(applyTemplateFilters(orderedTemplates));
                    setLoading(false);
                    return;
                }

                // Build base query conditions
                const getPathConditions = () => {
                    if (pathId) {
                        return [where('pathId', '==', pathId)];
                    } else {
                        return [where('is_path', '!=', true)];
                    }
                };

                const pathConditions = getPathConditions();

                // If tags are provided, make multiple queries (one per tag)
                if (tags.length > 0) {
                    const allQueries: Promise<QuerySnapshot>[] = [];

                    // Create queries for each tag
                    for (const tag of tags) {
                        const query1 = query(
                            templatesRef,
                            where('lang', '==', inputLangToUse),
                            where('tags', 'array-contains', tag),
                            ...pathConditions,
                            orderBy(pathId ? 'pathIndex' : 'createdAt', pathId ? 'asc' : 'desc'),
                            ...(options?.fetchAll ? [] as [] : [limit(FETCH_LIMIT)])
                        );

                        const query2 = query(
                            templatesRef,
                            where('lang', '==', targetLangToUse),
                            where('tags', 'array-contains', tag),
                            ...pathConditions,
                            orderBy(pathId ? 'pathIndex' : 'createdAt', pathId ? 'asc' : 'desc'),
                            ...(options?.fetchAll ? [] as [] : [limit(FETCH_LIMIT)])
                        );

                        allQueries.push(getDocs(query1), getDocs(query2));
                    }

                    // Execute all queries in parallel
                    const querySnapshots = await Promise.all(allQueries);

                    // Process all results
                    const templatesData: TemplateWithTimestamp[] = [];
                    const seenIds = new Set<string>();

                    querySnapshots.forEach((querySnapshot: QuerySnapshot) => {
                        querySnapshot.forEach((doc: DocumentSnapshot) => {
                            if (!seenIds.has(doc.id)) {
                                seenIds.add(doc.id);
                                const templateData = normalizeTemplate(doc);
                                templatesData.push(templateData);
                            }
                        });
                    });

                    // Process the results (same as before)
                    const templatesByGroup = templatesData.reduce((acc, template) => {
                        if (!acc[template.groupId]) {
                            acc[template.groupId] = [] as TemplateWithTimestamp[];
                        }
                        (acc[template.groupId] as TemplateWithTimestamp[]).push(template);
                        return acc;
                    }, {} as Record<string, TemplateWithTimestamp[]>);

                    const uniqueTemplates = Object.values(templatesByGroup)
                        .filter((groupTemplates) => {
                            const hasInput = groupTemplates.some((t) => t.lang === inputLangToUse);
                            const hasTarget = groupTemplates.some((t) => t.lang === targetLangToUse);
                            return hasInput && hasTarget;
                        })
                        .map((groupTemplates) => groupTemplates.find((t) => t.lang === inputLangToUse) || groupTemplates[0]);

                    // Randomize templates to ensure variety
                    const randomizedTemplates = uniqueTemplates.sort(() => Math.random() - 0.5);
                    const filteredTemplates = applyTemplateFilters(randomizedTemplates);

                    setTemplates(options?.fetchAll ? filteredTemplates : filteredTemplates.slice(0, FETCH_LIMIT));
                    return;
                }

                // Original logic for when no tags are provided
                const baseConditions1 = [
                    where('lang', '==', inputLangToUse),
                    ...pathConditions,
                    orderBy(pathId ? 'pathIndex' : 'createdAt', pathId ? 'asc' : 'desc'),
                    ...(options?.fetchAll ? [] as [] : [limit(FETCH_LIMIT)])
                ];

                const baseConditions2 = [
                    where('lang', '==', targetLangToUse),
                    ...pathConditions,
                    orderBy(pathId ? 'pathIndex' : 'createdAt', pathId ? 'asc' : 'desc'),
                    ...(options?.fetchAll ? [] as [] : [limit(FETCH_LIMIT)])
                ];

                const query1 = query(templatesRef, ...baseConditions1);
                const query2 = query(templatesRef, ...baseConditions2);

                const [querySnapshot1, querySnapshot2] = await Promise.all([
                    getDocs(query1),
                    getDocs(query2),
                ]);

                const templatesData: TemplateWithTimestamp[] = [];
                const seenIds = new Set<string>();

                querySnapshot1.forEach((doc: DocumentSnapshot) => {
                    if (!seenIds.has(doc.id)) {
                        seenIds.add(doc.id);
                        templatesData.push(normalizeTemplate(doc));
                    }
                });
                querySnapshot2.forEach((doc: DocumentSnapshot) => {
                    if (!seenIds.has(doc.id)) {
                        seenIds.add(doc.id);
                        templatesData.push(normalizeTemplate(doc));
                    }
                });

                const templatesByGroup = templatesData.reduce((acc, template) => {
                    if (!acc[template.groupId]) {
                        acc[template.groupId] = [] as TemplateWithTimestamp[];
                    }
                    (acc[template.groupId] as TemplateWithTimestamp[]).push(template);
                    return acc;
                }, {} as Record<string, TemplateWithTimestamp[]>);

                const uniqueTemplates = Object.values(templatesByGroup)
                    .filter((groupTemplates) => {
                        const hasInput = groupTemplates.some((t) => t.lang === inputLangToUse);
                        const hasTarget = groupTemplates.some((t) => t.lang === targetLangToUse);
                        return hasInput && hasTarget;
                    })
                    .map((groupTemplates) => groupTemplates.find((t) => t.lang === inputLangToUse) || groupTemplates[0]);

                // Sort by pathIndex or createdAt
                const sortedTemplates = applyTemplateFilters(uniqueTemplates).sort((a, b) => {
                    if (pathId) {
                        const indexA = a.pathIndex || 0;
                        const indexB = b.pathIndex || 0;
                        return indexA - indexB;
                    } else {
                        const dateA = a.createdAt?.toDate?.() || new Date(0);
                        const dateB = b.createdAt?.toDate?.() || new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    }
                });

                const finalTemplates = options?.fetchAll ? sortedTemplates : sortedTemplates.slice(0, FETCH_LIMIT);

                setTemplates(finalTemplates);
            } catch (err) {
                console.error('[TemplatesBrowser] Error fetching templates:', err);
                setTemplates([]);
            } finally {
                setLoading(false);
            }
        },
        [inputLang, targetLang, pathId, tags, groupIdQueryOverride, excludeTags, categoryFilter]
    );

    // Update languages when user profile loads/changes
    useEffect(() => {
        if (userProfile?.preferredInputLang && userProfile?.preferredTargetLang) {
            const newInputLang = userProfile.preferredInputLang;
            const newTargetLang = userProfile.preferredTargetLang;

            // Only update if different to avoid infinite loops
            if (inputLang !== newInputLang || targetLang !== newTargetLang) {
                setInputLang(newInputLang);
                setTargetLang(newTargetLang);

                // Refetch templates with new languages
                fetchTemplates(newInputLang, newTargetLang);
            }
        }
    }, [userProfile?.preferredInputLang, userProfile?.preferredTargetLang, inputLang, targetLang, fetchTemplates]);

    useEffect(() => {
        if (!hasInitialFetch.current) {
            hasInitialFetch.current = true;
            lastFilterKeyRef.current = filterChangeKey;
            // For learning paths, load all items to ensure scroll-to-incomplete works
            // For regular templates, load limited set for performance
            fetchTemplates(undefined, undefined, {
                fetchAll: Boolean(pathId),
                limitCount: pathId ? undefined : 10
            });
        }
    }, [pathId, fetchTemplates, filterChangeKey]);

    useEffect(() => {
        if (!hasInitialFetch.current) return;
        if (lastFilterKeyRef.current === filterChangeKey) return;
        lastFilterKeyRef.current = filterChangeKey;
        setTemplates([]);
        setIsShowingAll(Boolean(pathId));
        fetchTemplates(undefined, undefined, {
            fetchAll: Boolean(pathId),
            limitCount: pathId ? undefined : 10
        });
    }, [filterChangeKey, pathId, fetchTemplates]);

    const handleInputLangChange = (lang: string) => {
        setTemplates([]);
        setInputLang(lang);
        setIsShowingAll(false);
        fetchTemplates(lang, targetLang, { fetchAll: false, limitCount: 10 });
    };

    const handleTargetLangChange = (lang: string) => {
        setTemplates([]);
        setTargetLang(lang);
        setIsShowingAll(false);
        fetchTemplates(inputLang, lang, { fetchAll: false, limitCount: 10 });
    };

    const getLanguageLabel = (value: string) => {
        return languageOptions.find((option) => option.code === value)?.label || value;
    };

    const recordBrowserUsage = useCallback(() => {
        if (!browserId) return;
        recordTemplateBrowserUsage({
            browserId,
            userId: user?.uid,
            inputLang,
            targetLang,
        });
    }, [browserId, user?.uid, inputLang, targetLang]);

    // Load progress for visible templates for the current user and language pair
    useEffect(() => {
        const fetchCompletionStatus = async () => {
            if (!user?.uid || templates.length === 0) {
                setTemplateProgress({});
                return;
            }

            const results: Record<string, { completedAt?: string; listenedCount: number; lastPhraseIndex?: number }> = {};

            await Promise.all(
                templates.map(async (template) => {
                    try {
                        const progress = await loadProgress(
                            user.uid,
                            template.groupId,
                            inputLang,
                            targetLang
                        );
                        if (progress) {
                            results[template.groupId] = {
                                completedAt: progress.completedAt,
                                listenedCount: progress.listenedPhraseIndices?.length ?? 0,
                                lastPhraseIndex: progress.lastPhraseIndex,
                            };
                        }
                    } catch (err) {
                        console.error('Error loading completion status for template', template.groupId, err);
                    }
                })
            );

            setTemplateProgress(results);
        };

        fetchCompletionStatus();
    }, [user?.uid, templates, inputLang, targetLang]);

    // Calculate the item before the first incomplete item index for learning paths
    const getFirstIncompleteIndex = (): number | undefined => {
        if (!pathId || loading || templates.length === 0) return undefined;
        if (Object.keys(templateProgress).length === 0) return undefined;

        const firstIncompleteIndex = templates.findIndex((template) => {
            const progress = templateProgress[template.groupId];
            const total = template.phraseCount || 0;

            if (!progress || !total) return true; // No progress means incomplete

            // Check if incomplete (not explicitly completed AND haven't listened to all phrases)
            const isCompleted = Boolean(progress.completedAt) || progress.listenedCount >= total;
            return !isCompleted;
        });

        // Return the first incomplete item if it exists
        return firstIncompleteIndex >= 0 ? firstIncompleteIndex : undefined;
    };

    // No separate loader branch; `CollectionList` will show skeletons when loading is true

    return (
        <div className={`bg-background ${className || ''}`}>
            <div className="max-w-5xl mx-auto">
                {showHeader && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold">Templates</h1>
                            <button
                                onClick={() => {
                                    track('Back to Home From Templates Browser Clicked');
                                    router.push(ROUTES.HOME);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                                Back to Home
                            </button>
                        </div>
                        <p className="text-muted-foreground mb-6">Select languages to view available templates</p>

                        <LanguageSelector
                            inputLang={inputLang}
                            setInputLang={handleInputLangChange}
                            targetLang={targetLang}
                            setTargetLang={handleTargetLangChange}
                            direction="row"
                        />
                    </div>
                )}

                {templates.length === 0 && !loading ? (
                    noTemplatesComponent !== undefined ? noTemplatesComponent : (
                        <div className="text-center py-12">
                            <h2 className="text-xl font-semibold mb-2">No templates found</h2>
                            <p className="text-muted-foreground">
                                No templates are available for {getLanguageLabel(inputLang)} to {getLanguageLabel(targetLang)} translation.
                            </p>
                        </div>
                    )
                ) : (
                    (() => {
                        const templateByGroup = new Map<string, Template>();
                        templates.forEach((t) => templateByGroup.set(t.groupId, t));
                        const mapped: Config[] = templates.map((t) => ({
                            id: t.groupId,
                            name: t.name || t.groupId,
                            phrases: [],
                            created_at: t.createdAt?.toDate?.()?.toISOString(),
                            presentationConfig: t.presentationConfig,
                        }));

                        return (
                            <CollectionList
                                title={title || 'Featured'}
                                showAllButton={!isShowingAll}
                                itemVariant="card"
                                layout="horizontal"
                                showFlags={false}
                                savedCollections={mapped}
                                selectedCollection={undefined}
                                loading={loading}
                                cardBackgroundKey={pathId}
                                showItemIndex={Boolean(pathId)}
                                getPhraseCount={(c) => templateByGroup.get(c.id)?.phraseCount || 0}
                                getLanguagePair={() => ({ inputLang, targetLang })}
                                getHref={(c) => buildTemplateUrl({
                                    groupId: c.id,
                                    inputLang,
                                    targetLang,
                                })}
                                getStatus={(c): CollectionStatus => {
                                    const t = templateByGroup.get(c.id);
                                    const progress = templateProgress[c.id];
                                    const total = t?.phraseCount || 0;

                                    // Treat as completed if we have an explicit completedAt
                                    // OR if we've listened to all phrases in this template
                                    const isCompleted = progress && total && (Boolean(progress.completedAt) || progress.listenedCount >= total);
                                    if (isCompleted) return 'completed';

                                    // Check if this is the first incomplete template in the path (i.e., "next")
                                    // This must be checked BEFORE 'not-started' so the first incomplete item shows as 'next'
                                    if (pathId) {
                                        const firstIncompleteIndex = templates.findIndex((template) => {
                                            const prog = templateProgress[template.groupId];
                                            const tot = template.phraseCount || 0;
                                            if (!prog || !tot) return true;
                                            const completed = Boolean(prog.completedAt) || prog.listenedCount >= tot;
                                            return !completed;
                                        });

                                        const currentIndex = templates.findIndex(template => template.groupId === c.id);
                                        if (currentIndex === firstIncompleteIndex) return 'next';
                                    }

                                    // No progress at all
                                    if (!progress || !total) return 'not-started';

                                    // Has progress but not complete
                                    return 'in-progress';
                                }}
                                getProgressSummary={(c) => {
                                    const t = templateByGroup.get(c.id);
                                    const progress = templateProgress[c.id];
                                    const total = t?.phraseCount || 0;
                                    if (!progress || !total) return null;
                                    const fromLastPlayed = typeof progress.lastPhraseIndex === 'number' && progress.lastPhraseIndex >= 0
                                        ? progress.lastPhraseIndex + 1
                                        : 0;
                                    const completedCount = Math.min(fromLastPlayed, total);
                                    return { completedCount, totalCount: total };
                                }}
                                onLoadCollection={(c) => {
                                    const template = templateByGroup.get(c.id);

                                    // Reset scroll position
                                    resetMainScroll();
                                    recordBrowserUsage();

                                    // Track analytics (non-blocking)
                                    setTimeout(() => {
                                        track('Template Collection Selected', {
                                            templateId: c.id,
                                            templateName: template?.name || c.name,
                                            templateTags: template?.tags || [],
                                            complexity: template?.complexity || null,
                                            phraseCount: template?.phraseCount || null,
                                            pathId: pathId || null,
                                            is_path: template?.is_path || false,
                                            inputLang,
                                            targetLang
                                        });
                                    }, 0);

                                    // Navigation is handled by Link component's href
                                }}
                                onPlayClick={(c) => {
                                    const template = templateByGroup.get(c.id);
                                    recordBrowserUsage();
                                    track('Template Play Clicked', {
                                        templateId: c.id,
                                        templateName: template?.name || c.name,
                                        templateTags: template?.tags || [],
                                        complexity: template?.complexity || null,
                                        phraseCount: template?.phraseCount || null,
                                        pathId: pathId || null,
                                        is_path: template?.is_path || false,
                                        inputLang,
                                        targetLang
                                    });
                                    resetMainScroll();
                                    router.push(buildTemplateUrl({
                                        groupId: c.id,
                                        inputLang,
                                        targetLang,
                                        autoplay: true,
                                    }));
                                }}
                                hideScrollbar
                                enableCarouselControls
                                scrollToIndex={getFirstIncompleteIndex()}
                                scrollBehavior="instant"
                                onShowAllClick={async () => {
                                    track('Show All Templates Clicked', { pathId: pathId || null });
                                    if (showAllOverride) {
                                        router.push('/templates');
                                    } else {
                                        setIsShowingAll(true);
                                        await fetchTemplates(undefined, undefined, { fetchAll: true });
                                    }
                                }}
                            />
                        );
                    })()
                )}
            </div>
        </div>
    );
}
