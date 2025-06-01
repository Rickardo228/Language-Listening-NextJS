'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Config, Phrase } from '../../types';
import { PresentationView } from '../../PresentationView';
import { PresentationControls } from '../../PresentationControls';
import { EditablePhrases } from '../../EditablePhrases';
import { SignInPage } from '../../SignInPage';
import { auth } from '../../firebase';
import { getFirestore, doc, getDoc, collection as firestoreCollection, addDoc } from 'firebase/firestore';
import { useTheme } from '../../ThemeProvider';

const firestore = getFirestore();

export default function SharedList() {
    const { listId } = useParams();
    const [collection, setCollection] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
    const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>('input');
    const [paused, setPaused] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [showTitle,] = useState(false);
    const [user, setUser] = useState(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const docRef = doc(firestore, 'published_collections', listId as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCollection(docSnap.data() as Config);
                }
            } catch (err) {
                console.error('Error fetching collection:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [listId]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveList = async () => {
        if (!user || !collection) return;

        try {
            const newCollection = {
                ...collection,
                name: `${collection.name} (Shared)`,
                created_at: new Date().toISOString(),
                phrases: collection.phrases.map(phrase => ({
                    ...phrase,
                    created_at: new Date().toISOString()
                }))
            };

            const colRef = firestoreCollection(firestore, 'users', user.uid, 'collections');
            await addDoc(colRef, newCollection);
            alert('List saved successfully!');
        } catch (err) {
            console.error('Error saving list:', err);
            alert('Failed to save list: ' + err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">List not found</h1>
                    <p>The list you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-md mx-auto p-6">
                    <h1 className="text-2xl font-bold mb-4">{collection.name}</h1>
                    <p className="mb-6">Sign in to save this list and create your own collections.</p>
                    <SignInPage />
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
            {/* Nav */}
            <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
                <h1 className="text-2xl font-bold">{collection.name}</h1>
                <button
                    onClick={handleSaveList}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
                >
                    Save List
                </button>
            </div>

            {/* Audio Element */}
            <audio ref={audioRef} controls hidden />

            {/* Main content */}
            <div className="flex lg:flex-row flex-col-reverse w-full lg:h-[92vh]">
                {/* Phrases List */}
                <div className="flex-1 lg:overflow-y-auto lg:relative">
                    <div className="lg:py-0 p-2">
                        <EditablePhrases
                            phrases={collection.phrases}
                            setPhrases={() => { }} // Read-only
                            inputLanguage={collection.phrases[0]?.inputLang}
                            outputLanguage={collection.phrases[0]?.targetLang}
                            currentPhraseIndex={currentPhraseIndex}
                            currentPhase={currentPhase}
                            onPhraseClick={(index) => {
                                setCurrentPhraseIndex(index);
                                setCurrentPhase(collection.presentationConfig?.enableOutputBeforeInput ? 'output' : 'input');
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    const audioUrl = collection.presentationConfig?.enableOutputBeforeInput
                                        ? collection.phrases[index].outputAudio?.audioUrl
                                        : collection.phrases[index].inputAudio?.audioUrl;
                                    audioRef.current.src = audioUrl || '';
                                }
                            }}
                            onPlayPhrase={(index, phase) => {
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    audioRef.current.src = collection.phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '';
                                    setCurrentPhraseIndex(index);
                                    setCurrentPhase(phase);
                                    audioRef.current.play().catch(console.error);
                                }
                            }}
                            enableOutputBeforeInput={collection.presentationConfig?.enableOutputBeforeInput}
                            readOnly
                        />
                    </div>
                </div>

                {/* Presentation View and Controls */}
                {currentPhraseIndex >= 0 && (
                    <div className="xl:flex-1 sticky top-[64px] bg-background lg:p-2 z-1">
                        <PresentationView
                            currentPhrase={collection.phrases[currentPhraseIndex]?.input || ''}
                            currentTranslated={collection.phrases[currentPhraseIndex]?.translated || ''}
                            currentPhase={currentPhase}
                            fullScreen={fullscreen}
                            setFullscreen={setFullscreen}
                            bgImage={collection.presentationConfig?.bgImage}
                            containerBg={collection.presentationConfig?.containerBg}
                            textBg={collection.presentationConfig?.textBg}
                            enableSnow={collection.presentationConfig?.enableSnow}
                            enableCherryBlossom={collection.presentationConfig?.enableCherryBlossom}
                            enableLeaves={collection.presentationConfig?.enableLeaves}
                            enableAutumnLeaves={collection.presentationConfig?.enableAutumnLeaves}
                            enableOrtonEffect={collection.presentationConfig?.enableOrtonEffect}
                            enableParticles={collection.presentationConfig?.enableParticles}
                            enableSteam={collection.presentationConfig?.enableSteam}
                            romanizedOutput={collection.phrases[currentPhraseIndex]?.romanized}
                            title={showTitle ? collection.name : undefined}
                        />
                        <div className="py-1 px-1 lg:py-2">
                            <PresentationControls
                                fullscreen={fullscreen}
                                setFullscreen={setFullscreen}
                                recordScreen={false}
                                stopScreenRecording={() => { }}
                                handleReplay={() => {
                                    setCurrentPhraseIndex(0);
                                    setCurrentPhase(collection.presentationConfig?.enableOutputBeforeInput ? 'output' : 'input');
                                    if (audioRef.current) {
                                        audioRef.current.src = collection.phrases[0][collection.presentationConfig?.enableOutputBeforeInput ? 'outputAudio' : 'inputAudio']?.audioUrl || '';
                                    }
                                }}
                                hasPhrasesLoaded={collection.phrases.length > 0}
                                configName=""
                                setConfigName={() => { }}
                                onSaveConfig={() => { }}
                                presentationConfig={collection.presentationConfig}
                                setPresentationConfig={() => { }}
                                presentationConfigDefinition={{}}
                                handleImageUpload={() => { }}
                                paused={paused}
                                onPause={() => setPaused(true)}
                                onPlay={() => setPaused(false)}
                                onPrevious={() => {
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        if (collection.presentationConfig?.enableOutputBeforeInput) {
                                            if (currentPhase === 'input') {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                                                setCurrentPhase('output');
                                            } else if (currentPhraseIndex > 0) {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex - 1].inputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev - 1);
                                                setCurrentPhase('input');
                                            }
                                        } else {
                                            if (currentPhase === 'output') {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                                                setCurrentPhase('input');
                                            } else if (currentPhraseIndex > 0) {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex - 1].outputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev - 1);
                                                setCurrentPhase('output');
                                            }
                                        }
                                    }
                                }}
                                onNext={() => {
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        if (collection.presentationConfig?.enableOutputBeforeInput) {
                                            if (currentPhase === 'output') {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                                                setCurrentPhase('input');
                                            } else if (currentPhraseIndex < collection.phrases.length - 1) {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex + 1].outputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev + 1);
                                                setCurrentPhase('output');
                                            }
                                        } else {
                                            if (currentPhase === 'input') {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                                                setCurrentPhase('output');
                                            } else if (currentPhraseIndex < collection.phrases.length - 1) {
                                                audioRef.current.src = collection.phrases[currentPhraseIndex + 1].inputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev + 1);
                                                setCurrentPhase('input');
                                            }
                                        }
                                    }
                                }}
                                canGoBack={currentPhase === 'output' || currentPhraseIndex > 0}
                                canGoForward={currentPhase === 'input' || currentPhraseIndex < collection.phrases.length - 1}
                                readOnly
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 