'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { languageOptions, Config } from '../types';
import { CollectionList } from '../CollectionList';
import { OnboardingLanguageSelect } from './OnboardingLanguageSelect';
import { useUser } from '../contexts/UserContext';

const firestore = getFirestore();

interface TemplatePhrase {
    translated?: string;
    audioUrl?: string;
    duration?: number;
    romanized?: string;
    voice?: string;
}

interface Template {
    id: string;
    groupId: string;
    lang: string;
    phrases: Record<string, TemplatePhrase>;
    createdAt: Timestamp;
    inputLang: string;
    targetLang: string;
    complexity: string;
    phraseCount: number;
    name?: string;
    tags?: string[];
}

interface TemplatesBrowserProps {
    initialInputLang?: string;
    initialTargetLang?: string;
    showHeader?: boolean;
    className?: string;
    tags?: string[];
    title?: string;
    noTemplatesComponent?: React.ReactNode;
}

export function TemplatesBrowser({
    initialInputLang = 'en-GB',
    initialTargetLang = 'it-IT',
    showHeader = true,
    className,
    tags = [],
    title,
    noTemplatesComponent,
}: TemplatesBrowserProps) {
    const router = useRouter();
    const { userProfile } = useUser();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isShowingAll, setIsShowingAll] = useState(false);
    
    // Use user preferences if available, otherwise fall back to props
    const [inputLang, setInputLang] = useState(
        userProfile?.preferredInputLang || initialInputLang
    );
    const [targetLang, setTargetLang] = useState(
        userProfile?.preferredTargetLang || initialTargetLang
    );
    const hasInitialFetch = useRef(false);

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
    }, [userProfile?.preferredInputLang, userProfile?.preferredTargetLang, inputLang, targetLang]);

    const fetchTemplates = async (
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
            const query1 = query(
                templatesRef,
                where('lang', '==', inputLangToUse),
                orderBy('createdAt', 'desc'),
                ...(options?.fetchAll ? [] as [] : [limit(FETCH_LIMIT)])
            );
            const query2 = query(
                templatesRef,
                where('lang', '==', targetLangToUse),
                orderBy('createdAt', 'desc'),
                ...(options?.fetchAll ? [] as [] : [limit(FETCH_LIMIT)])
            );

            const [querySnapshot1, querySnapshot2] = await Promise.all([
                getDocs(query1),
                getDocs(query2),
            ]);

            const templatesData: Template[] = [];
            const seenIds = new Set<string>();

            querySnapshot1.forEach((doc) => {
                if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id);
                    templatesData.push({ id: doc.id, ...doc.data() } as Template);
                }
            });
            querySnapshot2.forEach((doc) => {
                if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id);
                    templatesData.push({ id: doc.id, ...doc.data() } as Template);
                }
            });

            const templatesByGroup = templatesData.reduce((acc, template) => {
                if (!acc[template.groupId]) {
                    acc[template.groupId] = [] as Template[];
                }
                (acc[template.groupId] as Template[]).push(template);
                return acc;
            }, {} as Record<string, Template[]>);

            const uniqueTemplates = Object.values(templatesByGroup)
                .filter((groupTemplates) => {
                    const hasInput = groupTemplates.some((t) => t.lang === inputLangToUse);
                    const hasTarget = groupTemplates.some((t) => t.lang === targetLangToUse);
                    
                    // If tags are provided, check if any template in the group has matching tags
                    if (tags.length > 0) {
                        const hasMatchingTags = groupTemplates.some((t) => 
                            t.tags && tags.some(tag => t.tags!.includes(tag))
                        );
                        return hasInput && hasTarget && hasMatchingTags;
                    }
                    
                    return hasInput && hasTarget;
                })
                .map((groupTemplates) => groupTemplates.find((t) => t.lang === inputLangToUse) || groupTemplates[0]);

            const sortedTemplates = uniqueTemplates.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            // Limit visible to 10 unless fetching all
            setTemplates(options?.fetchAll ? sortedTemplates : sortedTemplates.slice(0, FETCH_LIMIT));
        } catch (err) {
            console.error('Error fetching templates:', err);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasInitialFetch.current) {
            hasInitialFetch.current = true;
            fetchTemplates(undefined, undefined, { fetchAll: false, limitCount: 10 });
        }
    }, []);

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

    // No separate loader branch; `CollectionList` will show skeletons when loading is true

    return (
        <div className={`bg-background ${className || ''}`}>
            <div className="max-w-5xl mx-auto">
                {showHeader && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold">Templates</h1>
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back to Home
                            </button>
                        </div>
                        <p className="text-muted-foreground mb-6">Select languages to view available templates</p>

                        <OnboardingLanguageSelect
                            inputLang={inputLang}
                            setInputLang={handleInputLangChange}
                            targetLang={targetLang}
                            setTargetLang={handleTargetLangChange}
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
                                getPhraseCount={(c) => templateByGroup.get(c.id)?.phraseCount || 0}
                                getLanguagePair={() => ({ inputLang, targetLang })}
                                onLoadCollection={(c) =>
                                    router.push(`/templates/${c.id}?inputLang=${inputLang}&targetLang=${targetLang}`)
                                }
                                onPlayClick={(c) =>
                                    router.push(
                                        `/templates/${c.id}?inputLang=${inputLang}&targetLang=${targetLang}&autoplay=1`
                                    )
                                }
                                hideScrollbar
                                enableCarouselControls
                                onShowAllClick={async () => {
                                    setIsShowingAll(true);
                                    await fetchTemplates(undefined, undefined, { fetchAll: true });
                                }}
                            />
                        );
                    })()
                )}
            </div>
        </div>
    );
}

