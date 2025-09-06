import { useState, useRef, useEffect, useMemo } from 'react';
import { PresentationView } from '../PresentationView';
import { PresentationControls } from '../PresentationControls';
import { EditablePhrases } from '../EditablePhrases';
import { Phrase, PresentationConfig } from '../types';
import { generateAudio } from '../utils/audioUtils';
import { BLEED_START_DELAY, DELAY_AFTER_INPUT_PHRASES_MULTIPLIER, DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER, } from '../consts';
import { useUpdateUserStats } from '../utils/userStats';
import { trackAudioEnded, trackPlaybackEvent } from '../../lib/mixpanelClient';

// Extract the methods ref type into a reusable type
export type PhrasePlaybackMethods = {
    handleStop: () => void;
    handlePause: () => void;
    handlePlay: () => void;
    handleReplay: () => Promise<void>;
    handlePlayPhrase: (index: number, phase: 'input' | 'output') => void;
    setCurrentPhraseIndex: (index: number) => void;
    setCurrentPhase: (phase: 'input' | 'output') => void;
    getCurrentPhraseIndex: () => number;
};

interface PhrasePlaybackViewProps {
    phrases: Phrase[];
    setPhrases?: (phrases: Phrase[], collectionId?: string) => Promise<void>;
    presentationConfig: PresentationConfig;
    setPresentationConfig?: (config: Partial<PresentationConfig>) => Promise<void>;
    collectionId?: string;
    collectionName?: string;
    showImportPhrases?: boolean;
    stickyHeaderContent?: React.ReactNode;
    methodsRef?: React.MutableRefObject<PhrasePlaybackMethods | null>;
}

export function PhrasePlaybackView({
    phrases,
    setPhrases,
    presentationConfig,
    setPresentationConfig,
    collectionId,
    collectionName,
    showImportPhrases = false,
    stickyHeaderContent,
    methodsRef,
}: PhrasePlaybackViewProps) {
    const { updateUserStats, StatsPopups, StatsModal, showStatsUpdate } = useUpdateUserStats();
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>(
        presentationConfig.enableInputPlayback ? 'input' : 'output'
    );
    const [paused, setPaused] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [configName, setConfigName] = useState('Default');

    const [showProgressBar, setShowProgressBar] = useState(false);
    const [progressDuration, setProgressDuration] = useState(0);
    const [progressDelay, setProgressDelay] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const timeoutIds = useRef<number[]>([]);
    const currentInputAudioUrl = useMemo(() => {
        if (currentPhraseIndex < 0) return '';
        return phrases[currentPhraseIndex]?.inputAudio?.audioUrl || '';
    }, [currentPhraseIndex, phrases]);
    const currentOutputAudioUrl = useMemo(() => {
        if (currentPhraseIndex < 0) return '';
        return phrases[currentPhraseIndex]?.outputAudio?.audioUrl || '';
    }, [currentPhraseIndex, phrases]);
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
                // Set playback speed based on phase
                const speed = phase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                if (speed !== 1.0) {
                    audioRef.current.playbackRate = speed;
                }
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
        setShowProgressBar(false);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPaused(true);
        showStatsUpdate(true);

        // Track pause event
        if (currentPhraseIndex >= 0 && phrases[currentPhraseIndex]) {
            const speed = currentPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            trackPlaybackEvent('pause', `${collectionId || 'unknown'}-${currentPhraseIndex}`, currentPhase, currentPhraseIndex, speed);
        }
    };

    const handleStop = () => {
        clearAllTimeouts();
        setShowProgressBar(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setPaused(true);
        showStatsUpdate();

        // Track stop event
        if (currentPhraseIndex >= 0 && phrases[currentPhraseIndex]) {

            const speed = currentPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            trackPlaybackEvent('stop', `${collectionId || 'unknown'}-${currentPhraseIndex}`, currentPhase, currentPhraseIndex, speed);
        }
    };

    const handlePlay = () => {
        setPaused(false);
        if (currentPhraseIndex <= 0) {
            handleReplay();
        } else if (audioRef.current) {
            // Skip input audio if disabled and we're in input phase
            if (currentPhase === 'input' && !presentationConfig.enableInputPlayback) {
                setCurrentPhase('output');
                return;
            }

            if (!audioRef.current.src) {
                audioRef.current.src = phrases[currentPhraseIndex]?.[currentPhase === "input" ? 'inputAudio' : 'outputAudio']?.audioUrl ?? ''
            }
            // Set playback speed based on current phase
            const speed = currentPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
            audioRef.current.play().catch((err) => {
                console.error('Auto-play error:', err);
                // If playback fails, try to regenerate the audio
                handleAudioError(currentPhase, true);
            });

            // Track play event
            if (currentPhraseIndex >= 0 && phrases[currentPhraseIndex]) {
                trackPlaybackEvent('play', `${collectionId || 'unknown'}-${currentPhraseIndex}`, currentPhase, currentPhraseIndex, speed);
            }
        }
    };

    const handleReplay = async () => {
        clearAllTimeouts();
        setCurrentPhraseIndex(prev => prev < 0 ? prev - 1 : -1);

        // Check if input playback is enabled, if not start with output phase
        const startPhase = presentationConfig.enableInputPlayback ? 'input' : 'output';
        setCurrentPhase(startPhase);

        if (startPhase === 'input' && audioRef.current && phrases[0]?.inputAudio?.audioUrl) {
            audioRef.current.src = phrases[0].inputAudio?.audioUrl;
            // Set playback speed for input phase
            const speed = presentationConfig.inputPlaybackSpeed || 1.0;
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
        } else if (startPhase === 'output' && audioRef.current && phrases[0]?.outputAudio?.audioUrl) {
            audioRef.current.src = phrases[0].outputAudio?.audioUrl;
            // Set playback speed for output phase
            const speed = presentationConfig.outputPlaybackSpeed || 1.0;
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
        }

        setShowTitle(true);
        setPaused(false);

        const timeoutId1 = window.setTimeout(() => {
            setShowTitle(false);
        }, presentationConfig.postProcessDelay + BLEED_START_DELAY - 1000);
        timeoutIds.current.push(timeoutId1);

        const timeoutId = window.setTimeout(() => {
            setCurrentPhraseIndex(0);
        }, presentationConfig.postProcessDelay + BLEED_START_DELAY);
        timeoutIds.current.push(timeoutId);

        // Track replay event
        if (phrases[0]) {
            const speed = startPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);


            trackPlaybackEvent('replay', `${collectionId || 'unknown'}-0`, startPhase, 0, speed);
        }
    };

    const handlePlayPhrase = (index: number, phase: 'input' | 'output') => {
        clearAllTimeouts();
        if (audioRef.current) {
            // Skip input audio if disabled
            if (phase === 'input' && !presentationConfig.enableInputPlayback) {
                return;
            }

            const isPaused = paused;
            audioRef.current.pause();
            audioRef.current.src = phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '';
            // Set playback speed based on phase
            const speed = phase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
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

            // Track play phrase event
            if (phrases[index]) {
                trackPlaybackEvent('play', `${collectionId || 'unknown'}-${index}`, phase, index, speed);
            }
        }
    };

    // Shared navigation handlers
    const handlePrevious = () => {
        clearAllTimeouts();
        if (audioRef.current) {
            audioRef.current.pause();
            let targetPhase: 'input' | 'output';
            let targetIndex = currentPhraseIndex;

            // Determine the target phase and index
            if (presentationConfig.enableOutputBeforeInput) {
                // In output-before-input mode
                if (currentPhase === 'input') {
                    // From input phase, go to output phase of same phrase
                    targetPhase = 'output';
                    targetIndex = currentPhraseIndex;
                } else {
                    // From output phase, go to previous phrase
                    if (currentPhraseIndex === 0) {
                        // Loop to last phrase
                        targetIndex = phrases.length - 1;
                    } else {
                        targetIndex = currentPhraseIndex - 1;
                    }
                    // Determine phase based on input playback setting
                    targetPhase = presentationConfig.enableInputPlayback ? 'input' : 'output';
                }
            } else {
                // In normal mode (input before output)
                if (currentPhase === 'output') {
                    // From output phase, go to input phase of same phrase
                    if (presentationConfig.enableInputPlayback) {
                        targetPhase = 'input';
                        targetIndex = currentPhraseIndex;
                    } else {
                        // Skip input phase, go to previous phrase output
                        if (currentPhraseIndex === 0) {
                            targetIndex = phrases.length - 1;
                        } else {
                            targetIndex = currentPhraseIndex - 1;
                        }
                        targetPhase = 'output';
                    }
                } else {
                    // From input phase, go to previous phrase
                    if (currentPhraseIndex === 0) {
                        // Loop to last phrase
                        targetIndex = phrases.length - 1;
                    } else {
                        targetIndex = currentPhraseIndex - 1;
                    }
                    // Determine phase based on input playback setting
                    targetPhase = presentationConfig.enableInputPlayback ? 'input' : 'output';
                }
            }

            // Update state
            setCurrentPhraseIndex(targetIndex);
            setCurrentPhase(targetPhase);

            // Set audio source and playback speed
            const audioUrl = targetPhase === 'input'
                ? phrases[targetIndex].inputAudio?.audioUrl
                : phrases[targetIndex].outputAudio?.audioUrl;
            audioRef.current.src = audioUrl || '';

            const speed = targetPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }

            // Update user stats for phrase viewed (only once per phrase pair - when target language is reached)
            if (targetIndex >= 0 && phrases[targetIndex] && targetPhase === 'output') {
                updateUserStats(phrases, targetIndex, 'viewed');

                // Track previous navigation (existing)
                trackPlaybackEvent('previous', `${collectionId || 'unknown'}-${targetIndex}`, targetPhase, targetIndex, speed);
            }
        }
    };

    const handleNext = () => {
        clearAllTimeouts();
        if (audioRef.current) {
            audioRef.current.pause();
            let targetPhase: 'input' | 'output';
            let targetIndex = currentPhraseIndex;

            // Determine the target phase and index
            if (presentationConfig.enableOutputBeforeInput) {
                // In output-before-input mode
                if (currentPhase === 'output') {
                    // From output phase, go to input phase of same phrase
                    if (presentationConfig.enableInputPlayback) {
                        targetPhase = 'input';
                        targetIndex = currentPhraseIndex;
                    } else {
                        // Skip input phase, go to next phrase output
                        if (currentPhraseIndex === phrases.length - 1) {
                            targetIndex = 0;
                        } else {
                            targetIndex = currentPhraseIndex + 1;
                        }
                        targetPhase = 'output';
                    }
                } else {
                    // From input phase, go to next phrase
                    if (currentPhraseIndex === phrases.length - 1) {
                        // Loop to first phrase
                        targetIndex = 0;
                    } else {
                        targetIndex = currentPhraseIndex + 1;
                    }
                    // Determine phase based on input playback setting
                    targetPhase = presentationConfig.enableInputPlayback ? 'input' : 'output';
                }
            } else {
                // In normal mode (input before output)
                if (currentPhase === 'input') {
                    // From input phase, go to output phase of same phrase
                    targetPhase = 'output';
                    targetIndex = currentPhraseIndex;
                } else {
                    // From output phase, go to next phrase
                    if (currentPhraseIndex === phrases.length - 1) {
                        // Loop to first phrase
                        targetIndex = 0;
                    } else {
                        targetIndex = currentPhraseIndex + 1;
                    }
                    // Determine phase based on input playback setting
                    targetPhase = presentationConfig.enableInputPlayback ? 'input' : 'output';
                }
            }

            // Update state
            setCurrentPhraseIndex(targetIndex);
            setCurrentPhase(targetPhase);

            // Set audio source and playback speed
            const audioUrl = targetPhase === 'input'
                ? phrases[targetIndex].inputAudio?.audioUrl
                : phrases[targetIndex].outputAudio?.audioUrl;
            audioRef.current.src = audioUrl || '';

            const speed = targetPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }

            // Update user stats for phrase viewed (only once per phrase pair - when target language is reached)
            if (targetIndex >= 0 && phrases[targetIndex] && targetPhase === 'output') {
                updateUserStats(phrases, targetIndex, 'viewed');

                // Track next navigation (existing)
                trackPlaybackEvent('next', `${collectionId || 'unknown'}-${targetIndex}`, targetPhase, targetIndex, speed);
            }
        }
    };

    const handleAudioEnded = () => {
        if (paused) return;

        // Track audio ended event
        const currentPhrase = phrases[currentPhraseIndex];
        if (currentPhrase) {
            const audioDuration = audioRef.current?.duration || 0;
            trackAudioEnded(
                `${collectionId || 'unknown'}-${currentPhraseIndex}`,
                audioDuration,
                collectionId
            );
        }

        const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
        const inputDuration = presentationConfig.enableInputDurationDelay ? (audioRef.current?.duration || 1) * 1000 : 0;
        const outputDuration = presentationConfig.enableOutputDurationDelay ? (audioRef.current?.duration || 1) * 1000 * DELAY_AFTER_INPUT_PHRASES_MULTIPLIER : 0;

        // Set progress bar for recall (input duration delay)
        setShowProgressBar(true);
        setProgressDuration(playOutputBeforeInput ? outputDuration + 1000 : inputDuration + presentationConfig.delayBetweenPhrases);
        setProgressDelay(0);

        if (currentPhase === 'input') {
            if (playOutputBeforeInput) {
                updateUserStats(phrases, currentPhraseIndex);
            }

            const timeoutId = window.setTimeout(() => {
                setCurrentPhase('output');
                setShowProgressBar(false);

                if (playOutputBeforeInput) {
                    if (currentPhraseIndex < phrases.length - 1 && !paused) {
                        setCurrentPhraseIndex(currentPhraseIndex + 1);
                    } else {
                        if (presentationConfig.enableLoop) {
                            // If looping is enabled, restart from beginning
                            setCurrentPhraseIndex(0);
                        } else {
                            showStatsUpdate(true)
                            setPaused(true);
                        }
                    }
                }
            }, playOutputBeforeInput ? outputDuration + 1000 : inputDuration + presentationConfig.delayBetweenPhrases);
            timeoutIds.current.push(timeoutId);
        } else {
            // Update user stats before phrase ends
            if (!playOutputBeforeInput) {
                updateUserStats(phrases, currentPhraseIndex);
            }

            // Set progress bar for shadow (output duration delay)
            setShowProgressBar(true);
            setProgressDuration(playOutputBeforeInput ? inputDuration + 1000 : (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
            setProgressDelay(0);


            const timeoutId = window.setTimeout(() => {
                setShowProgressBar(false);
                if (playOutputBeforeInput) {
                    // Check if input playback is enabled
                    if (presentationConfig.enableInputPlayback) {
                        setCurrentPhase('input');
                    } else {
                        // Skip input phase if disabled, go to next phrase output
                        if (currentPhraseIndex < phrases.length - 1 && !paused) {
                            setCurrentPhraseIndex(currentPhraseIndex + 1);
                            setCurrentPhase('output');
                        } else {
                            if (presentationConfig.enableLoop) {
                                // If looping is enabled, restart from beginning
                                setCurrentPhraseIndex(0);
                                setCurrentPhase('output');
                            } else {
                                showStatsUpdate(true)
                                setPaused(true);
                            }
                        }
                    }
                } else {
                    if (currentPhraseIndex < phrases.length - 1 && !paused) {
                        setCurrentPhraseIndex(currentPhraseIndex + 1);
                        // Check if input playback is enabled
                        if (presentationConfig.enableInputPlayback) {
                            setCurrentPhase('input');
                        } else {
                            setCurrentPhase('output');
                        }
                    } else {
                        if (presentationConfig.enableLoop) {
                            // If looping is enabled, restart from beginning
                            setCurrentPhraseIndex(0);
                            // Check if input playback is enabled
                            if (presentationConfig.enableInputPlayback) {
                                setCurrentPhase('input');
                            } else {
                                setCurrentPhase('output');
                            }
                        } else {
                            showStatsUpdate(true)
                            setPaused(true);
                        }
                    }
                }
            }, playOutputBeforeInput ? inputDuration + 1000 : (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
            timeoutIds.current.push(timeoutId);
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
            // Skip input audio playback if disabled
            if (!presentationConfig.enableInputPlayback) {
                // Move to output phase immediately
                setCurrentPhase('output');
                return;
            }
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
                // Set playback speed based on current phase
                const speed = currentPhase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                if (speed !== 1.0) {
                    audioRef.current.playbackRate = speed;
                }
                audioRef.current.play().catch((err) => {
                    console.error('Auto-play error:', err);
                    // If playback fails, try to regenerate the audio
                    handleAudioError(currentPhase, true);
                });
            }
        }
    }, [currentPhraseIndex, currentPhase, paused, currentInputAudioUrl, currentOutputAudioUrl, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.enableInputPlayback]);

    if (methodsRef) methodsRef.current = {
        handleStop,
        handlePause,
        handlePlay,
        handleReplay,
        handlePlayPhrase,
        setCurrentPhraseIndex,
        setCurrentPhase,
        getCurrentPhraseIndex: () => currentPhraseIndex
    };

    return (
        <div className="flex-1 lg:overflow-y-auto lg:relative">
            {/* All Stats Popups (unified portal) */}
            {StatsPopups}

            {/* Stats Modal */}
            {StatsModal}

            {/* Audio Element */}
            <audio ref={audioRef} onEnded={handleAudioEnded} controls hidden />

            {/* Main content */}
            <div className="flex lg:flex-row flex-col-reverse w-full lg:h-[92vh]">
                {/* Phrases List */}
                <div className="flex-1 lg:overflow-y-auto lg:relative lg:order-2">
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

                                    // Determine target phase considering both enableOutputBeforeInput and enableInputPlayback
                                    let targetPhase: 'input' | 'output';
                                    if (presentationConfig.enableOutputBeforeInput) {
                                        targetPhase = 'output';
                                    } else {
                                        // If input playback is disabled, start with output phase
                                        targetPhase = presentationConfig.enableInputPlayback ? 'input' : 'output';
                                    }

                                    setCurrentPhase(targetPhase);
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        const audioUrl = targetPhase === 'input'
                                            ? phrases[index].inputAudio?.audioUrl
                                            : phrases[index].outputAudio?.audioUrl;
                                        audioRef.current.src = audioUrl || '';
                                        // Set playback speed based on target phase
                                        const speed = targetPhase === 'input'
                                            ? (presentationConfig.inputPlaybackSpeed || 1.0)
                                            : (presentationConfig.outputPlaybackSpeed || 1.0);
                                        if (speed !== 1.0) {
                                            audioRef.current.playbackRate = speed;
                                        }
                                    }
                                }}
                                onPlayPhrase={handlePlayPhrase}
                                enableOutputBeforeInput={presentationConfig.enableOutputBeforeInput}
                            />
                        </div>
                    )}
                </div>

                {/* Presentation View and Controls */}
                {Boolean(typeof currentPhraseIndex === "number" && phrases?.length) && (
                    <div className="xl:flex-1 sticky top-[64px] bg-background lg:p-2 z-1 lg:order-1">
                        <PresentationView
                            currentPhrase={phrases[currentPhraseIndex]?.input || ''}
                            currentTranslated={phrases[currentPhraseIndex]?.translated || ''}
                            currentPhase={currentPhase}
                            fullScreen={fullscreen}
                            setFullscreen={setFullscreen}
                            bgImage={presentationConfig.bgImage}
                            containerBg={presentationConfig.containerBg}
                            // Can maybe introduce but might replace with text colour
                            // textBg={presentationConfig.textBg}
                            enableSnow={presentationConfig.enableSnow}
                            enableCherryBlossom={presentationConfig.enableCherryBlossom}
                            enableLeaves={presentationConfig.enableLeaves}
                            enableAutumnLeaves={presentationConfig.enableAutumnLeaves}
                            enableOrtonEffect={presentationConfig.enableOrtonEffect}
                            enableParticles={presentationConfig.enableParticles}
                            enableSteam={presentationConfig.enableSteam}
                            romanizedOutput={phrases[currentPhraseIndex]?.romanized}
                            title={showTitle ? (collectionName || configName) : undefined}
                            showAllPhrases={presentationConfig.showAllPhrases}
                            enableOutputBeforeInput={presentationConfig.enableOutputBeforeInput}
                            showProgressBar={showProgressBar}
                            progressDuration={progressDuration}
                            progressDelay={progressDelay}
                            onPrevious={handlePrevious}
                            onNext={handleNext}
                            canGoBack={true}
                            canGoForward={true}
                            currentPhraseIndex={currentPhraseIndex}
                            totalPhrases={phrases.length}
                        />
                        <div className="py-1 px-1 lg:py-2">
                            <PresentationControls
                                recordScreen={false}
                                stopScreenRecording={() => { }}
                                handleReplay={handleReplay}
                                hasPhrasesLoaded={phrases.length > 0}
                                configName={configName}
                                setConfigName={setConfigName}
                                onSaveConfig={() => { }}
                                presentationConfig={presentationConfig}
                                setPresentationConfig={setPresentationConfig || (() => { })}
                                handleImageUpload={() => { }}
                                paused={paused}
                                onPause={handlePause}
                                onPlay={handlePlay}
                                onPrevious={handlePrevious}
                                onNext={handleNext}
                                canGoBack={true}
                                canGoForward={true}
                                inputLang={phrases[0]?.inputLang}
                                targetLang={phrases[0]?.targetLang}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>);
} 