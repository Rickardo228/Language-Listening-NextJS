'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

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
}

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<FirebaseUser | null>(null);

    // Fixed languages as specified
    const inputLang = 'en-GB';
    const targetLang = 'it-IT';

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const templatesRef = collection(firestore, 'templates');

                // Create two separate queries for OR logic
                const query1 = query(
                    templatesRef,
                    where('lang', '==', inputLang)
                );

                const query2 = query(
                    templatesRef,
                    where('lang', '==', targetLang)
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

                // Group by groupId and get unique templates
                const uniqueTemplates = templatesData.reduce((acc, template) => {
                    if (!acc.find(t => t.groupId === template.groupId)) {
                        acc.push(template);
                    }
                    return acc;
                }, [] as Template[]);

                setTemplates(uniqueTemplates);
            } catch (err) {
                console.error('Error fetching templates:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [user, inputLang, targetLang]);

    const handleTemplateClick = (template: Template) => {
        router.push(`/templates/${template.groupId}`);
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
                    <h1 className="text-3xl font-bold mb-2">Templates</h1>
                    <p className="text-muted-foreground">
                        English (UK) → Italian templates
                    </p>
                </div>

                {templates.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold mb-2">No templates found</h2>
                        <p className="text-muted-foreground">
                            No templates are available for English (UK) to Italian translation.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => handleTemplateClick(template)}
                                className="p-6 border rounded-lg hover:border-primary cursor-pointer transition-colors bg-card"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            Template Group {template.groupId}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Complexity: {template.complexity}</span>
                                            <span>Phrases: {template.phraseCount}</span>
                                            <span>
                                                Created: {template.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 