'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { languageOptions, Config } from '../types';
import { CollectionList } from '../CollectionList';
import { OnboardingLanguageSelect } from '../components/OnboardingLanguageSelect';

const firestore = getFirestore();

interface TemplatePhrase {
    translated?: string;
    audioUrl?: string;
    duration?: number;
    romanized?: string;
    voice?: string;
}

// TODO - generate these types from the backend
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

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [inputLang, setInputLang] = useState('en-GB');
    const [targetLang, setTargetLang] = useState('it-IT');
    const hasInitialFetch = useRef(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const fetchTemplates = async (currentInputLang?: string, currentTargetLang?: string) => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Use the passed values or fall back to state values
        const inputLangToUse = currentInputLang || inputLang;
        const targetLangToUse = currentTargetLang || targetLang;

        setLoading(true);

        try {
            const templatesRef = collection(firestore, 'templates');

            // Create two separate queries for OR logic
            const query1 = query(
                templatesRef,
                where('lang', '==', inputLangToUse)
            );

            const query2 = query(
                templatesRef,
                where('lang', '==', targetLangToUse)
            );

            // Execute both queries
            const [querySnapshot1, querySnapshot2] = await Promise.all([
                getDocs(query1),
                getDocs(query2)
            ]);

            const templatesData: Template[] = [];
            const seenIds = new Set<string>();

            // Process first query results
            querySnapshot1.forEach((doc) => {
                if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id);
                    templatesData.push({
                        id: doc.id,
                        ...doc.data()
                    } as Template);
                }
            });

            // Process second query results (avoiding duplicates)
            querySnapshot2.forEach((doc) => {
                if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id);
                    templatesData.push({
                        id: doc.id,
                        ...doc.data()
                    } as Template);
                }
            });

            // Group by groupId and check for templates in both languages
            const templatesByGroup = templatesData.reduce((acc, template) => {
                if (!acc[template.groupId]) {
                    acc[template.groupId] = [];
                }
                acc[template.groupId].push(template);
                return acc;
            }, {} as Record<string, Template[]>);

            console.log('Templates by group:', templatesByGroup);
            console.log('Input lang:', inputLangToUse, 'Target lang:', targetLangToUse);

            // Only keep templates that have entries in both languages
            const uniqueTemplates = Object.values(templatesByGroup)
                .filter(groupTemplates => {
                    const hasInputLang = groupTemplates.some(t => t.lang === inputLangToUse);
                    const hasTargetLang = groupTemplates.some(t => t.lang === targetLangToUse);
                    console.log(`Group ${groupTemplates[0]?.groupId}: hasInputLang=${hasInputLang}, hasTargetLang=${hasTargetLang}, languages=${groupTemplates.map(t => t.lang).join(', ')}`);
                    return hasInputLang && hasTargetLang;
                })
                .map(groupTemplates => {
                    // Return the template in the input language, or the first one if not found
                    return groupTemplates.find(t => t.lang === inputLangToUse) || groupTemplates[0];
                });

            console.log('Final unique templates:', uniqueTemplates);

            // Sort by newest first
            const sortedTemplates = uniqueTemplates.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            setTemplates(sortedTemplates);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setTemplates([]); // Clear templates on error
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch when user is available (only once)
    useEffect(() => {
        if (user && !hasInitialFetch.current) {
            hasInitialFetch.current = true;
            fetchTemplates();
        }
    }, [user]);

    // Handle language changes
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
        return languageOptions.find(option => option.code === value)?.label || value;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
                    <p>Please sign in to view templates.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold">Templates</h1>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back to Home
                        </button>
                    </div>
                    <p className="text-muted-foreground mb-6">
                        Select languages to view available templates
                    </p>

                    {/* Language Selection */}
                    <OnboardingLanguageSelect
                        inputLang={inputLang}
                        setInputLang={handleInputLangChange}
                        targetLang={targetLang}
                        setTargetLang={handleTargetLangChange}
                    />
                </div>

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
                        templates.forEach(t => templateByGroup.set(t.groupId, t));
                        const mapped: Config[] = templates.map((t) => ({
                            id: t.groupId,
                            name: t.name || t.groupId,
                            phrases: [],
                            created_at: t.createdAt?.toDate?.()?.toISOString(),
                        }));
                        return (
                            <CollectionList
                                title="Templates"
                                showAllButton={false}
                                itemVariant="card"
                                layout="horizontal"
                                savedCollections={mapped}
                                selectedCollection={undefined}
                                loading={false}
                                getPhraseCount={(c) => templateByGroup.get(c.id)?.phraseCount || 0}
                                getLanguagePair={() => ({ inputLang, targetLang })}
                                onLoadCollection={(c) => router.push(`/templates/${c.id}?inputLang=${inputLang}&targetLang=${targetLang}`)}
                            />
                        );
                    })()
                )}
            </div>
        </div>
    );
} 