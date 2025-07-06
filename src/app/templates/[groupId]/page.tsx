'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Config, Phrase, languageOptions } from '../../types';
import { auth } from '../../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { PhrasePlaybackView } from '../../components/PhrasePlaybackView';
import { LanguageFlags } from '../../components/LanguageFlags';

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
}

// Helper function to get language label from code
const getLanguageLabel = (code: string): string => {
    const option = languageOptions.find(opt => opt.code === code);
    return option ? option.label : code;
};

export default function TemplateDetailPage() {
    const { groupId } = useParams();
    const router = useRouter();
    const [inputTemplate, setInputTemplate] = useState<Template | null>(null);
    const [targetTemplate, setTargetTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [selectedInputLang, setSelectedInputLang] = useState<string>('en-GB');
    const [selectedTargetLang, setSelectedTargetLang] = useState<string>('it-IT');
    const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

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
                setInputTemplate(inputTemplateData);

                // Get target template
                let targetTemplateData: Template | null = null;
                if (!targetSnapshot.empty) {
                    const doc = targetSnapshot.docs[0];
                    targetTemplateData = {
                        id: doc.id,
                        ...doc.data()
                    } as Template;
                }
                setTargetTemplate(targetTemplateData);

                // Get all available languages for this group
                const allTemplatesQuery = query(templatesRef, where('groupId', '==', groupId));
                const allTemplatesSnapshot = await getDocs(allTemplatesQuery);
                const languages = allTemplatesSnapshot.docs.map(doc => doc.data().lang);
                setAvailableLanguages(languages);

            } catch (err) {
                console.error('Error fetching templates:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [user, groupId, selectedInputLang, selectedTargetLang]);

    // Convert template phrases to the format expected by PhrasePlaybackView
    const convertTemplatesToConfig = (inputTemplate: Template, targetTemplate: Template): Config => {
        const inputPhrases = inputTemplate.phrases;
        console.log(inputPhrases)
        const targetPhrases = targetTemplate.phrases;


        const phrases: Phrase[] = [...Object.keys(inputPhrases)].map((phraseKey) => {
            const inputPhrase = inputPhrases[phraseKey];
            const targetPhrase = targetPhrases[phraseKey];

            return {
                input: inputPhrase?.translated || '',
                translated: targetPhrase?.translated || '',
                inputAudio: inputPhrase ? {
                    audioUrl: inputPhrase.audioUrl || '',
                    duration: inputPhrase.duration || 0
                } : null,
                inputLang: inputTemplate.lang,
                inputVoice: inputPhrase?.voice || '',
                outputAudio: targetPhrase ? {
                    audioUrl: targetPhrase.audioUrl || '',
                    duration: targetPhrase.duration || 0
                } : null,
                targetLang: targetTemplate.lang,
                targetVoice: targetPhrase?.voice || '',
                romanized: targetPhrase?.romanized || '',
                created_at: inputTemplate.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        });

        return {
            id: `${inputTemplate.id}-${targetTemplate.id}`,
            name: `Template Group ${inputTemplate.groupId} (${inputTemplate.lang} → ${targetTemplate.lang})`,
            phrases,
            created_at: inputTemplate.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            presentationConfig: {
                name: `Template ${inputTemplate.groupId}`,
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
                outputPlaybackSpeed: 0.85
            }
        };
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

    const config = inputTemplate && targetTemplate ? convertTemplatesToConfig(inputTemplate, targetTemplate) : null;

    return (
        <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
            {/* Nav */}
            <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/templates')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <h1 className='truncate'>Template Group {groupId}</h1>
                    </button>
                    {config && config.phrases[0] && (
                        <LanguageFlags
                            inputLang={selectedInputLang}
                            targetLang={selectedTargetLang}
                            size="lg"
                        />
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {availableLanguages.length > 1 && (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            {config && (
                <PhrasePlaybackView
                    phrases={config.phrases}
                    presentationConfig={config.presentationConfig || {
                        name: 'Default',
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
                        outputPlaybackSpeed: 1.0
                    }}
                    collectionName={config.name}
                    setPhrases={async () => {
                        // Read-only view, no changes allowed
                    }}
                    setPresentationConfig={async () => {
                        // Read-only view, no changes allowed
                    }}
                />
            )}
        </div>
    );
} 