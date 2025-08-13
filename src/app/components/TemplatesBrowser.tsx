'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { languageOptions, Config } from '../types';
import { CollectionList } from '../CollectionList';
import { OnboardingLanguageSelect } from './OnboardingLanguageSelect';

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
}

interface TemplatesBrowserProps {
    initialInputLang?: string;
    initialTargetLang?: string;
    showHeader?: boolean;
    className?: string;
}

export function TemplatesBrowser({
    initialInputLang = 'en-GB',
    initialTargetLang = 'it-IT',
    showHeader = true,
    className,
}: TemplatesBrowserProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputLang, setInputLang] = useState(initialInputLang);
    const [targetLang, setTargetLang] = useState(initialTargetLang);
    const hasInitialFetch = useRef(false);

    const fetchTemplates = async (currentInputLang?: string, currentTargetLang?: string) => {
        // Use the passed values or fall back to state values
        const inputLangToUse = currentInputLang || inputLang;
        const targetLangToUse = currentTargetLang || targetLang;

        setLoading(true);

        try {
            const templatesRef = collection(firestore, 'templates');

            const query1 = query(templatesRef, where('lang', '==', inputLangToUse));
            const query2 = query(templatesRef, where('lang', '==', targetLangToUse));

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
                    return hasInput && hasTarget;
                })
                .map((groupTemplates) => groupTemplates.find((t) => t.lang === inputLangToUse) || groupTemplates[0]);

            const sortedTemplates = uniqueTemplates.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            // Limit to top 10
            setTemplates(sortedTemplates.slice(0, 10));
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
            fetchTemplates();
        }
    }, []);

    const handleInputLangChange = (lang: string) => {
        setTemplates([]);
        setInputLang(lang);
        fetchTemplates(lang, targetLang);
    };

    const handleTargetLangChange = (lang: string) => {
        setTemplates([]);
        setTargetLang(lang);
        fetchTemplates(inputLang, lang);
    };

    const getLanguageLabel = (value: string) => {
        return languageOptions.find((option) => option.code === value)?.label || value;
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${showHeader ? 'min-h-screen' : ''} bg-background`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className={`bg-background ${className || ''}`}>
            <div className="max-w-4xl mx-auto">
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

                {templates.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold mb-2">No templates found</h2>
                        <p className="text-muted-foreground">
                            No templates are available for {getLanguageLabel(inputLang)} to {getLanguageLabel(targetLang)} translation.
                        </p>
                    </div>
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
                                title={'Featured'}
                                showAllButton={false}
                                itemVariant="card"
                                layout="horizontal"
                                showFlags={false}
                                savedCollections={mapped}
                                selectedCollection={undefined}
                                loading={false}
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
                            />
                        );
                    })()
                )}
            </div>
        </div>
    );
}

