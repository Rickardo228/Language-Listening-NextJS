'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Phrase, languageOptions, PresentationConfig } from '../../types';
import { getFirestore, collection, query, where, getDocs, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { PhrasePlaybackView, PhrasePlaybackMethods } from '../../components/PhrasePlaybackView';
import { CollectionHeader } from '../../CollectionHeader';
import { useUser } from '../../contexts/UserContext';

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
    complexity: string;
    phraseCount: number;
    name: string;
}

// Helper function to get language label from code
const getLanguageLabel = (code: string): string => {
    const option = languageOptions.find(opt => opt.code === code);
    return option ? option.label : code;
};

export default function TemplateDetailPage() {
    const { groupId: rawGroupId } = useParams();
    // Decode the URL-encoded groupId to handle spaces and special characters
    const groupId = rawGroupId ? decodeURIComponent(rawGroupId as string) : null;
    // const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthLoading, isAdmin } = useUser();
    const methodsRef = useRef<PhrasePlaybackMethods | null>(null);
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInputLang, setSelectedInputLang] = useState<string>(searchParams.get('inputLang') || 'en-GB');
    const [selectedTargetLang, setSelectedTargetLang] = useState<string>(searchParams.get('targetLang') || 'it-IT');
    const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
    const [templateData, setTemplateData] = useState<Template | null>(null);
    const [presentationConfig, setPresentationConfig] = useState<PresentationConfig>({
        name: `Template ${groupId}`,
        bgImage: null,
        containerBg: '',
        textBg: '',
        enableSnow: false,
        enableCherryBlossom: false,
        enableLeaves: false,
        enableAutumnLeaves: false,
        enableOrtonEffect: false,
        enableParticles: false,
        enableSteam: false,
        enableOutputBeforeInput: false,
        postProcessDelay: 0,
        delayBetweenPhrases: 0,
        enableInputDurationDelay: false,
        enableOutputDurationDelay: false,
        enableLoop: false,
        inputPlaybackSpeed: 1.0,
        outputPlaybackSpeed: 0.85,
        showAllPhrases: false
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!user || !groupId) {
                setLoading(false);
                return;
            }

            try {
                const templatesRef = collection(firestore, 'templates');

                // Query for input language template
                const inputQuery = query(
                    templatesRef,
                    where('groupId', '==', groupId),
                    where('lang', '==', selectedInputLang)
                );

                // Query for target language template
                const targetQuery = query(
                    templatesRef,
                    where('groupId', '==', groupId),
                    where('lang', '==', selectedTargetLang)
                );

                // Execute both queries
                const [inputSnapshot, targetSnapshot] = await Promise.all([
                    getDocs(inputQuery),
                    getDocs(targetQuery)
                ]);

                // Get input template
                let inputTemplateData: Template | null = null;
                if (!inputSnapshot.empty) {
                    const doc = inputSnapshot.docs[0];
                    inputTemplateData = {
                        id: doc.id,
                        ...doc.data()
                    } as Template;
                }

                // Get target template
                let targetTemplateData: Template | null = null;
                if (!targetSnapshot.empty) {
                    const doc = targetSnapshot.docs[0];
                    targetTemplateData = {
                        id: doc.id,
                        ...doc.data()
                    } as Template;
                }

                // Convert templates to phrases and store in state
                if (inputTemplateData && targetTemplateData) {
                    const inputPhrases = inputTemplateData.phrases;
                    const targetPhrases = targetTemplateData.phrases;

                    const convertedPhrases: Phrase[] = [...Object.keys(inputPhrases)].map((phraseKey) => {
                        const inputPhrase = inputPhrases[phraseKey];
                        const targetPhrase = targetPhrases[phraseKey];

                        return {
                            input: inputPhrase?.translated || '',
                            translated: targetPhrase?.translated || '',
                            inputAudio: inputPhrase ? {
                                audioUrl: inputPhrase.audioUrl || '',
                                duration: inputPhrase.duration || 0
                            } : null,
                            inputLang: inputTemplateData.lang,
                            inputVoice: inputPhrase?.voice || '',
                            outputAudio: targetPhrase ? {
                                audioUrl: targetPhrase.audioUrl || '',
                                duration: targetPhrase.duration || 0
                            } : null,
                            targetLang: targetTemplateData.lang,
                            targetVoice: targetPhrase?.voice || '',
                            romanized: targetPhrase?.romanized || '',
                            created_at: inputTemplateData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
                        };
                    });

                    setPhrases(convertedPhrases);

                    // Store template data for name extraction
                    setTemplateData(inputTemplateData);
                } else {
                    setPhrases([]);
                }

                // Get all available languages for this group
                const allTemplatesQuery = query(templatesRef, where('groupId', '==', groupId));
                const allTemplatesSnapshot = await getDocs(allTemplatesQuery);
                const languages = allTemplatesSnapshot.docs.map(doc => doc.data().lang);
                console.log('languages', languages);
                setAvailableLanguages(languages);

            } catch (err) {
                console.error('Error fetching templates:', err);
                setPhrases([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [user, groupId, selectedInputLang, selectedTargetLang]);

    // Admin-only template deletion function
    const handleDeleteTemplate = async (templateGroupId: string) => {
        if (!isAdmin) {
            alert('Only administrators can delete templates.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the template group "${templateGroupId}"? This action cannot be undone and will delete ALL language variants of this template.`)) {
            return;
        }

        try {
            // Query all templates in this group
            const templatesRef = collection(firestore, 'templates');
            const groupQuery = query(templatesRef, where('groupId', '==', templateGroupId));
            const groupSnapshot = await getDocs(groupQuery);

            // Delete all templates in the group
            const deletePromises = groupSnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(firestore, 'templates', docSnapshot.id))
            );

            await Promise.all(deletePromises);

            alert(`Template group "${templateGroupId}" has been successfully deleted.`);

            // Redirect back to templates list or home
            window.location.href = '/templates';

        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template. Please try again.');
        }
    };

    // Autoplay when requested via query param once phrases are available
    useEffect(() => {
        const shouldAutoplay = searchParams.get('autoplay') === '1' || searchParams.get('autoplay') === 'true';
        if (shouldAutoplay && phrases.length > 0) {
            // small delay to ensure audio element/state ready
            const id = setTimeout(() => {
                methodsRef.current?.handleReplay?.();
            }, 300);
            return () => clearTimeout(id);
        }
    }, [phrases, searchParams]);

    if (isAuthLoading || loading) {
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

    if (availableLanguages.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Template not found</h1>
                    <p>The template you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                </div>
            </div>
        );
    }

    // Create a proper collection config for the template
    const templateAsCollection = {
        id: groupId as string,
        name: templateData?.name || groupId as string, // Use template name if available, fall back to groupId
        phrases: phrases,
        created_at: new Date().toISOString(),
        collectionType: 'phrases' as const,
        presentationConfig: presentationConfig
    };

    // Create the collection header content
    const collectionHeaderContent = (
        <div className="w-full flex items-center p-2">
            <CollectionHeader
                collectionId={groupId as string}
                savedCollections={[templateAsCollection]}
                inputLang={selectedInputLang}
                targetLang={selectedTargetLang}
                className="flex"
                titleClassName="max-w-[250px]"
                onDelete={isAdmin ? handleDeleteTemplate : undefined}
            />

        </div>
    );

    return (
        <div className="h-full">
            {phrases.length > 0 ? (
                <PhrasePlaybackView
                    phrases={phrases}
                    presentationConfig={presentationConfig}
                    collectionName={`${groupId} (${selectedInputLang} → ${selectedTargetLang})`}
                    setPhrases={async (phrases: Phrase[]) => setPhrases(phrases)}
                    setPresentationConfig={async (config: Partial<PresentationConfig>) => setPresentationConfig(prev => ({ ...prev, ...config }))}
                    methodsRef={methodsRef}
                    collectionId={groupId as string}
                    stickyHeaderContent={collectionHeaderContent}
                    showImportPhrases={true}
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">No phrases found</h2>
                        <p className="text-muted-foreground">
                            No phrases available for {getLanguageLabel(selectedInputLang)} to {getLanguageLabel(selectedTargetLang)} translation.
                        </p>
                        {availableLanguages.length > 1 && (
                            <div className="flex items-center gap-4 mt-4 justify-center">
                                <select
                                    value={selectedInputLang}
                                    onChange={(e) => setSelectedInputLang(e.target.value)}
                                    className="px-3 py-2 border rounded-lg bg-background"
                                >
                                    {availableLanguages.map(lang => (
                                        <option key={`input-${lang}`} value={lang}>
                                            {getLanguageLabel(lang)}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-sm">→</span>
                                <select
                                    value={selectedTargetLang}
                                    onChange={(e) => setSelectedTargetLang(e.target.value)}
                                    className="px-3 py-2 border rounded-lg bg-background"
                                >
                                    {availableLanguages.map(lang => (
                                        <option key={`target-${lang}`} value={lang}>
                                            {getLanguageLabel(lang)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 