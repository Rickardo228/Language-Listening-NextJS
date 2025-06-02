import { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';
import { PresentationView, TITLE_ANIMATION_DURATION } from '../PresentationView';
import { PresentationControls } from '../PresentationControls';
import { EditablePhrases } from '../EditablePhrases';
import { ImportPhrases } from '../ImportPhrases';
import { CollectionHeader } from '../CollectionHeader';
import { Config, Phrase, PresentationConfig } from '../types';
import { generateAudio } from '../utils/audioUtils';
import { BLEED_START_DELAY, DELAY_AFTER_INPUT_PHRASES_MULTIPLIER, DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER, } from '../consts';

// Extract the methods ref type into a reusable type
export type PhrasePlaybackMethods = {
    handleStop: () => void;
    handlePause: () => void;
    handlePlay: () => void;
    handleReplay: () => Promise<void>;
    handlePlayPhrase: (index: number, phase: 'input' | 'output') => void;
    setCurrentPhraseIndex: (index: number) => void;
    setCurrentPhase: (phase: 'input' | 'output') => void;
};

interface PhrasePlaybackViewProps {
    // Core data
    phrases: Phrase[];
    setPhrases?: (phrases: Phrase[], collectionId?: string) => Promise<void>;
    presentationConfig: PresentationConfig;
    setPresentationConfig?: (config: Partial<PresentationConfig>) => Promise<void>;
    presentationConfigDefinition?: any;

    // Collection info
    collectionId?: string;
    collectionName?: string;
    savedCollections?: Config[];
    onRenameCollection?: (id: string) => void;
    onDeleteCollection?: (id: string) => void;
    onVoiceChange?: (inputVoice: string, targetVoice: string) => void;
    onShare?: (id: string) => void;

    // Import phrases props
    showImportPhrases?: boolean;
    stickyHeaderContent?: React.ReactNode;

    // Playback control
    updateUserStats?: () => void;
    readOnly?: boolean;
    methodsRef?: React.MutableRefObject<PhrasePlaybackMethods | null>;
}

export function PhrasePlaybackView({
    phrases,
    setPhrases,
    presentationConfig,
    setPresentationConfig,
    presentationConfigDefinition,
    collectionId,
    collectionName,
    savedCollections,
    onRenameCollection,
    onDeleteCollection,
    onVoiceChange,
    onShare,
    showImportPhrases = false,
    stickyHeaderContent,
    updateUserStats,
    readOnly = false,
    methodsRef,
}: PhrasePlaybackViewProps) {
    // Playback and sequence control states
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
    const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>('input');
    const [finished, setFinished] = useState<boolean>(false);
    const [fullscreen, setFullscreen] = useState<boolean>(false);
    const [paused, setPaused] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [configName, setConfigName] = useState<string>('');

    // Refs
    const audioRef = useRef<HTMLAudioElement>(null);
    const timeoutIds = useRef<number[]>([]);

    // Memoized audio URLs
    const currentInputAudioUrl = useMemo(() => {
        if (currentPhraseIndex < 0) return '';
        return phrases[currentPhraseIndex]?.inputAudio?.audioUrl || '';
    }, [currentPhraseIndex, phrases]);

    const currentOutputAudioUrl = useMemo(() => {
        if (currentPhraseIndex < 0) return '';
        return phrases[currentPhraseIndex]?.outputAudio?.audioUrl || '';
    }, [currentPhraseIndex, phrases]);

    // Utility functions
    const clearAllTimeouts = () => {
        timeoutIds.current.forEach((id) => clearTimeout(id));
        timeoutIds.current = [];
    };

    const handleAudioError = async (phase: 'input' | 'output', autoPlay?: boolean) => {
        if (!audioRef.current || currentPhraseIndex < 0 || !setPhrases) return;

        const phrase = phrases[currentPhraseIndex];
        if (!phrase) return;

        try {
            const text = phase === 'input' ? phrase.input : phrase.translated;
            const language = phase === 'input' ? phrase.inputLang : phrase.targetLang;
            const voice = phase === 'input' ? phrase.inputVoice : phrase.targetVoice;

            if (!text || !language || !voice) return;

            const { audioUrl, duration } = await generateAudio(text, language, voice);

            // Update the phrase with new audio
            const newPhrases = [...phrases];
            newPhrases[currentPhraseIndex] = {
                ...newPhrases[currentPhraseIndex],
                [phase === 'input' ? 'inputAudio' : 'outputAudio']: { audioUrl, duration }
            };
            await setPhrases(newPhrases, collectionId);

            // Update audio source and play
            if (audioRef.current && autoPlay) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch((err) => console.error('Auto-play error:', err));
            }
        } catch (err) {
            console.error('Error regenerating audio:', err);
            // If regeneration fails, stop playback
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            setPaused(true);
        }
    };

    // Playback control handlers
    const handlePause = () => {
        clearAllTimeouts();
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPaused(true);
    };

    const handleStop = () => {
        clearAllTimeouts();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setPaused(true);
        setFinished(true);
        setCurrentPhraseIndex(-1);
    };

    const handlePlay = () => {
        setPaused(false);
        if (currentPhraseIndex <= 0) {
            handleReplay();
        } else if (audioRef.current) {
            if (!audioRef.current.src) {
                audioRef.current.src = phrases[currentPhraseIndex]?.[currentPhase === "input" ? 'inputAudio' : 'outputAudio']?.audioUrl ?? ''
            }
            audioRef.current.play().catch((err) => {
                console.error('Auto-play error:', err);
                // If playback fails, try to regenerate the audio
                handleAudioError(currentPhase, true);
            });
        }
    };

    const handleReplay = async () => {
        clearAllTimeouts();
        setCurrentPhraseIndex(prev => prev < 0 ? prev - 1 : -1);
        setCurrentPhase('input');
        if (audioRef.current && phrases[0]?.inputAudio?.audioUrl) {
            audioRef.current.src = phrases[0].inputAudio?.audioUrl;
        }
        setShowTitle(true);
        setFinished(false);
        setPaused(false);

        const timeoutId1 = window.setTimeout(() => {
            setShowTitle(false);
        }, presentationConfig.postProcessDelay + BLEED_START_DELAY - TITLE_ANIMATION_DURATION - 1000);
        timeoutIds.current.push(timeoutId1);

        const timeoutId = window.setTimeout(() => {
            setCurrentPhraseIndex(0);
        }, presentationConfig.postProcessDelay + BLEED_START_DELAY);
        timeoutIds.current.push(timeoutId);
    };

    const handlePlayPhrase = (index: number, phase: 'input' | 'output') => {
        clearAllTimeouts();
        if (audioRef.current) {
            const isPaused = paused;
            audioRef.current.pause();
            audioRef.current.src = phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '';
            setCurrentPhraseIndex(index);
            setCurrentPhase(phase);
            if (isPaused) {
                // If paused, play in isolation without changing state
                audioRef.current.play().catch((err) => {
                    console.error('Auto-play error:', err);
                    // If playback fails, try to regenerate the audio
                    handleAudioError(currentPhase);
                });
            } else {
                // If not paused, update state and play through main audio element
                setPaused(false);
                audioRef.current.play().catch((err) => {
                    console.error('Auto-play error:', err);
                    // If playback fails, try to regenerate the audio
                    handleAudioError(currentPhase, true);
                });
            }
        }
    };

    const handleAudioEnded = () => {
        if (paused) return;

        const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
        const inputDuration = presentationConfig.enableInputDurationDelay ? (audioRef.current?.duration || 1) * 1000 : 0;
        const outputDuration = presentationConfig.enableOutputDurationDelay ? (audioRef.current?.duration || 1) * 1000 * DELAY_AFTER_INPUT_PHRASES_MULTIPLIER : 0;

        if (currentPhase === 'input') {
            const timeoutId = window.setTimeout(() => {
                setCurrentPhase('output');

                if (playOutputBeforeInput) {
                    // Update user stats when phrase ends
                    if (updateUserStats) {
                        updateUserStats();
                    }

                    if (currentPhraseIndex < phrases.length - 1 && !paused) {
                        setCurrentPhraseIndex(currentPhraseIndex + 1);
                    } else {
                        if (presentationConfig.enableLoop) {
                            // If looping is enabled, restart from beginning
                            setCurrentPhraseIndex(0);
                        } else {
                            setFinished(true);
                            setPaused(true);
                        }
                    }
                }
            }, playOutputBeforeInput ? outputDuration + 1000 : inputDuration + presentationConfig.delayBetweenPhrases);
            timeoutIds.current.push(timeoutId);
        } else {
            const timeoutId = window.setTimeout(() => {
                if (playOutputBeforeInput) {
                    setCurrentPhase('input');
                } else {
                    // Update user stats when phrase ends
                    if (updateUserStats) {
                        updateUserStats();
                    }

                    if (currentPhraseIndex < phrases.length - 1 && !paused) {
                        setCurrentPhraseIndex(currentPhraseIndex + 1);
                        setCurrentPhase('input');
                    } else {
                        if (presentationConfig.enableLoop) {
                            // If looping is enabled, restart from beginning
                            setCurrentPhraseIndex(0);
                            setCurrentPhase('input');
                        } else {
                            setFinished(true);
                            setPaused(true);
                        }
                    }
                }
            }, playOutputBeforeInput ? inputDuration + 1000 : (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
            timeoutIds.current.push(timeoutId);
        }
    };

    // Handle background image upload
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && setPresentationConfig) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPresentationConfig({ bgImage: url });
        }
    };

    // Close fullscreen on Esc key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setFullscreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // Audio playback effect
    useEffect(() => {
        if (currentPhraseIndex < 0 || paused) return;

        let src = '';
        if (currentPhase === 'input') {
            src = currentInputAudioUrl;
        } else if (currentPhase === 'output') {
            src = currentOutputAudioUrl;
        }

        if (audioRef.current && audioRef.current.paused) {
            if (!src) {
                // If no source exists, generate it
                handleAudioError(currentPhase);
            } else {
                audioRef.current.src = src;
                audioRef.current.play().catch((err) => {
                    console.error('Auto-play error:', err);
                    // If playback fails, try to regenerate the audio
                    handleAudioError(currentPhase, true);
                });
            }
        }
    }, [currentPhraseIndex, currentPhase, paused, currentInputAudioUrl, currentOutputAudioUrl]);

    if (methodsRef) methodsRef.current = {
        handleStop,
        handlePause,
        handlePlay,
        handleReplay,
        handlePlayPhrase,
        setCurrentPhraseIndex,
        setCurrentPhase
    };

    return (
        <div className="flex-1 lg:overflow-y-auto lg:relative">            {/* Audio Element */}
            <audio ref={audioRef} onEnded={handleAudioEnded} controls hidden />

            {/* Main content */}
            <div className="flex lg:flex-row flex-col-reverse w-full lg:h-[92vh]">
                {/* Phrases List */}
                <div className="flex-1 lg:overflow-y-auto lg:relative">
                    {showImportPhrases && collectionId && stickyHeaderContent && (
                        <div className={`sticky lg:px-0 lg:pb-3 px-1 py-2 top-[320px] lg:top-[0px] lg:bg-background bg-gray-50 dark:bg-gray-900 z-1`}>
                            {stickyHeaderContent}
                        </div>
                    )}

                    {/* Editable Inputs for Each Phrase */}
                    {phrases.length > 0 && !fullscreen && (
                        <div className="lg:py-0 p-2">
                            <EditablePhrases
                                phrases={phrases}
                                setPhrases={setPhrases || (() => { })}
                                inputLanguage={phrases[0]?.inputLang}
                                outputLanguage={phrases[0]?.targetLang}
                                currentPhraseIndex={currentPhraseIndex}
                                currentPhase={currentPhase}
                                onPhraseClick={(index) => {
                                    setCurrentPhraseIndex(index);
                                    clearAllTimeouts();
                                    setCurrentPhase(presentationConfig.enableOutputBeforeInput ? 'output' : 'input');
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        const audioUrl = presentationConfig.enableOutputBeforeInput
                                            ? phrases[index].outputAudio?.audioUrl
                                            : phrases[index].inputAudio?.audioUrl;
                                        audioRef.current.src = audioUrl || '';
                                    }
                                }}
                                onPlayPhrase={handlePlayPhrase}
                                enableOutputBeforeInput={presentationConfig.enableOutputBeforeInput}
                                readOnly={readOnly}
                            />
                        </div>
                    )}
                </div>

                {/* Presentation View and Controls */}
                {Boolean(typeof currentPhraseIndex === "number" && phrases?.length) && (
                    <div className="xl:flex-1 sticky top-[64px] bg-background lg:p-2 z-1">
                        <PresentationView
                            currentPhrase={phrases[currentPhraseIndex]?.input || ''}
                            currentTranslated={phrases[currentPhraseIndex]?.translated || ''}
                            currentPhase={currentPhase}
                            fullScreen={fullscreen}
                            setFullscreen={setFullscreen}
                            bgImage={presentationConfig.bgImage}
                            containerBg={presentationConfig.containerBg}
                            textBg={presentationConfig.textBg}
                            enableSnow={presentationConfig.enableSnow}
                            enableCherryBlossom={presentationConfig.enableCherryBlossom}
                            enableLeaves={presentationConfig.enableLeaves}
                            enableAutumnLeaves={presentationConfig.enableAutumnLeaves}
                            enableOrtonEffect={presentationConfig.enableOrtonEffect}
                            enableParticles={presentationConfig.enableParticles}
                            enableSteam={presentationConfig.enableSteam}
                            romanizedOutput={phrases[currentPhraseIndex]?.romanized}
                            title={showTitle ? (collectionName || configName) : undefined}
                        />
                        <div className="py-1 px-1 lg:py-2">
                            <PresentationControls
                                fullscreen={fullscreen}
                                setFullscreen={setFullscreen}
                                handleReplay={handleReplay}
                                hasPhrasesLoaded={phrases.length > 0}
                                configName={configName}
                                setConfigName={setConfigName}
                                onSaveConfig={() => { }}
                                presentationConfig={presentationConfig}
                                setPresentationConfig={setPresentationConfig || (() => { })}
                                presentationConfigDefinition={presentationConfigDefinition || {}}
                                handleImageUpload={handleImageUpload}
                                paused={paused}
                                onPause={handlePause}
                                onPlay={handlePlay}
                                onPrevious={() => {
                                    clearAllTimeouts();
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        if (presentationConfig.enableOutputBeforeInput) {
                                            if (currentPhase === 'input') {
                                                audioRef.current.src = phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                                                setCurrentPhase('output');
                                            } else if (currentPhraseIndex > 0) {
                                                audioRef.current.src = phrases[currentPhraseIndex - 1].inputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev - 1);
                                                setCurrentPhase('input');
                                            }
                                        } else {
                                            if (currentPhase === 'output') {
                                                audioRef.current.src = phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                                                setCurrentPhase('input');
                                            } else if (currentPhraseIndex > 0) {
                                                audioRef.current.src = phrases[currentPhraseIndex - 1].outputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev - 1);
                                                setCurrentPhase('output');
                                            }
                                        }
                                    }
                                }}
                                onNext={() => {
                                    clearAllTimeouts();
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        if (presentationConfig.enableOutputBeforeInput) {
                                            if (currentPhase === 'output') {
                                                audioRef.current.src = phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                                                setCurrentPhase('input');
                                            } else if (currentPhraseIndex < phrases.length - 1) {
                                                audioRef.current.src = phrases[currentPhraseIndex + 1].outputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev + 1);
                                                setCurrentPhase('output');
                                            }
                                        } else {
                                            if (currentPhase === 'input') {
                                                audioRef.current.src = phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                                                setCurrentPhase('output');
                                            } else if (currentPhraseIndex < phrases.length - 1) {
                                                audioRef.current.src = phrases[currentPhraseIndex + 1].inputAudio?.audioUrl || '';
                                                setCurrentPhraseIndex(prev => prev + 1);
                                                setCurrentPhase('input');
                                            }
                                        }
                                    }
                                }}
                                canGoBack={currentPhase === 'output' || currentPhraseIndex > 0}
                                canGoForward={currentPhase === 'input' || currentPhraseIndex < phrases.length - 1}
                                readOnly={readOnly}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>);
} 