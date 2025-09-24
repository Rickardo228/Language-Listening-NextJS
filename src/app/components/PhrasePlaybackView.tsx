import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PresentationView } from '../PresentationView';
import { PresentationControls } from '../PresentationControls';
import { EditablePhrases } from '../EditablePhrases';
import { Phrase, PresentationConfig } from '../types';
import { generateAudio } from '../utils/audioUtils';
import { BLEED_START_DELAY, DELAY_AFTER_INPUT_PHRASES_MULTIPLIER, DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER, } from '../consts';
import { useUpdateUserStats } from '../utils/userStats';
import { track, trackAudioEnded, trackPlaybackEvent } from '../../lib/mixpanelClient';
import { WebMediaSessionTransport } from '../../transport/webMediaSessionTransport';
// Removed useVirtualDelay import - reverting to simpler timeout-based approach

interface NavigatorWithMediaSession extends Navigator {
    mediaSession: MediaSession;
}

type PauseSource = 'local' | 'external';

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
    const [fullscreen, setFullscreenBase] = useState(false);
    const setFullscreen = (value: boolean | ((prevState: boolean) => boolean)) => {
        const newVal = typeof value === 'function' ? value(fullscreen) : value
        track(`Fullscreen ${newVal ? 'Enabled' : 'Disabled'}`);
        setFullscreenBase(value);
    };
    const [showTitle, setShowTitle] = useState(false);
    const [configName, setConfigName] = useState('Default');

    // Debouncing refs for spam prevention
    const updateUserStatsTimeout = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_DELAY = 800; // 1000ms debounce

    // Debounced wrapper for updateUserStats
    const debouncedUpdateUserStats = useCallback(async (phrases: Phrase[], currentPhraseIndex: number, eventType: 'listened' | 'viewed' = 'listened') => {
        // Clear existing timeout
        if (updateUserStatsTimeout.current) {
            clearTimeout(updateUserStatsTimeout.current);
        }

        // Set new timeout
        updateUserStatsTimeout.current = setTimeout(async () => {
            await updateUserStats(phrases, currentPhraseIndex, eventType);
        }, DEBOUNCE_DELAY);
    }, [updateUserStats, DEBOUNCE_DELAY]);

    const [showProgressBar, setShowProgressBar] = useState(false);
    const [progressDuration, setProgressDuration] = useState(0);
    const [progressDelay, setProgressDelay] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const timeoutIds = useRef<number[]>([]);
    const transportRef = useRef<WebMediaSessionTransport | null>(null);
    // Removed complex virtual delay system - using simpler setTimeout approach
    const programmaticPauseRef = useRef(false);   // set when *we* call pause() or swap src
    // Play sequence counter prevents errors when trying to play an audio element that's already
    // in the process of starting playback. Without this, rapid play() calls cause browser errors
    // like "AbortError: The play() request was interrupted" when one play() cancels another.
    // Each play attempt gets a unique sequence number - if another play starts while one is pending,
    // the earlier attempt will bail out gracefully when it sees the sequence has changed.
    const playSeqRef = useRef(0);                 // increments on every new "play intent"
    const srcSwapRef = useRef(false);             // true while we're swapping src (navigation)

    // Skip pump system - NOT related to user stats throttling (that's handled separately above).
    // This system prevents audio glitches when users rapidly click next/prev buttons by:
    // 1. Queuing all skip requests instead of executing them immediately
    // 2. Processing them sequentially with a small delay between each skip
    // 3. Preventing multiple concurrent skip operations that could cause audio stuttering
    // The user stats throttling (updateUserStatsTimeout above) is completely separate.
    const pendingSkipsRef = useRef(0);            // +N = next; -N = prev
    const pumpingRef = useRef(false);             // prevents concurrent pump execution
    const SKIP_THROTTLE_MS = 80;                  // minimum delay between skip operations

    // Refs for state used in timers to prevent stale closures
    const pausedRef = useRef(paused);
    const phaseRef = useRef(currentPhase);
    const indexRef = useRef(currentPhraseIndex);

    // Removed delay period tracking - using simple setTimeout approach

    // Keep refs in sync with state
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { phaseRef.current = currentPhase; }, [currentPhase]);
    useEffect(() => { indexRef.current = currentPhraseIndex; }, [currentPhraseIndex]);

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

    // Transport helper functions
    const pushMetadataToTransport = useCallback(() => {
        console.log('pushMetadataToTransport');
        const t = transportRef.current;
        if (!t) return;

        const phrase = phrases[currentPhraseIndex];
        const title =
            phrase ? (currentPhase === 'input' ? (phrase.input || '') : (phrase.translated || '')) : '';

        t.setMetadata({
            title,
            artist: collectionName?.replace(/\b\w/g, l => l.toUpperCase()) || 'Session',
            album: configName,
            artworkUrl: presentationConfig.bgImage || '/language-shadowing-logo-dark.png',
        });

        // Reapply handlers after metadata changes (critical for iOS)
        t.reapplyHandlers();
    }, [phrases, currentPhraseIndex, currentPhase, collectionName, configName, presentationConfig.bgImage]);

    const setMSState = (state: 'none' | 'paused' | 'playing') => {
        try { if ('mediaSession' in navigator) (navigator as NavigatorWithMediaSession).mediaSession.playbackState = state; } catch { }
    };

    // call this *whenever* you want to start playback
    const safePlay = async (reason: string) => {
        const el = audioRef.current;
        if (!el) return;
        const mySeq = ++playSeqRef.current; // claim this play intent
        try {
            const p = el.play();
            await p;
            // BOTH sequence check AND error catching are needed:
            // - Error catching handles AbortError when play() calls conflict
            // - Sequence check prevents wasted work after successful play() if another call happened
            if (mySeq !== playSeqRef.current) return;

            // Reapply handlers after successful playback start
            transportRef.current?.reapplyHandlers();
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') {
                // benign: a pause/src change raced our play - this IS the sequence logic in action
                return;
            }
            console.error('play failed:', reason, e);
        }
    };

    // No special delay period helpers needed - just use setTimeout and clearAllTimeouts()

    // Helper to safely set src without triggering system pause
    const setSrcSafely = (url: string) => {
        const el = audioRef.current;
        if (!el) return;
        programmaticPauseRef.current = true;
        srcSwapRef.current = true;
        // cancel any current play intent
        ++playSeqRef.current;
        try { el.src = url; }
        finally {
            // let the microtask queue flush before clearing flags
            setTimeout(() => {
                programmaticPauseRef.current = false;
                srcSwapRef.current = false;
            }, 0);
        }
    };

    // Skip pump functions for coalescing rapid next/prev presses
    const queueSkip = (delta: number) => {
        pendingSkipsRef.current += delta;
        pumpSkips();
    };

    const pumpSkips = async () => {
        if (pumpingRef.current) return;
        pumpingRef.current = true;
        try {
            while (pendingSkipsRef.current !== 0) {
                const delta = Math.sign(pendingSkipsRef.current);
                pendingSkipsRef.current -= delta;

                await atomicAdvance(delta as 1 | -1);

                await new Promise(r => setTimeout(r, SKIP_THROTTLE_MS));
            }
        } finally {
            pumpingRef.current = false;
        }
    };

    const atomicAdvance = async (delta: 1 | -1) => {
        // Clear any existing timers
        clearAllTimeouts();

        if (!phrases.length) return;

        const wasPlaying = !pausedRef.current; // snapshot before we move
        // Compute next cursor
        const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
        const enableInput = presentationConfig.enableInputPlayback;

        let targetIndex = indexRef.current;
        const curPhase = phaseRef.current;
        let targetPhase: 'input' | 'output' = curPhase;

        if (playOutputBeforeInput) {
            if (delta === +1) {
                if (curPhase === 'output') {
                    // O -> I (same phrase)
                    targetPhase = enableInput ? 'input' : 'output';
                    if (!enableInput) targetIndex = (targetIndex + 1) % phrases.length; // no input phase, jump to next O
                } else {
                    // I -> next phrase O
                    targetIndex = (targetIndex + 1) % phrases.length;
                    targetPhase = 'output';
                }
            } else { // delta === -1
                if (curPhase === 'input') {
                    // I -> O (same phrase)
                    targetPhase = 'output';
                } else {
                    // O -> previous phrase I
                    targetIndex = (targetIndex - 1 + phrases.length) % phrases.length;
                    targetPhase = enableInput ? 'input' : 'output';
                }
            }
        } else {
            // input-before-output mode
            if (delta === +1) {
                if (curPhase === 'input') {
                    // I -> O (same phrase)
                    targetPhase = 'output';
                } else {
                    // O -> next phrase (I if enabled else O)
                    targetIndex = (targetIndex + 1) % phrases.length;
                    targetPhase = enableInput ? 'input' : 'output';
                }
            } else { // delta === -1
                if (curPhase === 'output' && enableInput) {
                    // O -> I (same phrase)
                    targetPhase = 'input';
                } else {
                    // (I) or (O & no input phase) -> previous phrase (I if enabled else O)
                    targetIndex = (targetIndex - 1 + phrases.length) % phrases.length;
                    targetPhase = enableInput ? 'input' : 'output';
                }
            }
        }


        // swap state + src (no pause)
        setCurrentPhraseIndex(targetIndex);
        setCurrentPhase(targetPhase);

        const url =
            targetPhase === 'input'
                ? (phrases[targetIndex].inputAudio?.audioUrl || '')
                : (phrases[targetIndex].outputAudio?.audioUrl || '');

        setSrcSafely(url);

        // apply rate
        const speed =
            targetPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
        if (audioRef.current) audioRef.current.playbackRate = speed;

        // Track navigation events and update user stats for phrase viewing
        if (targetIndex >= 0 && phrases[targetIndex] && targetPhase === 'output') {
            // Track skip navigation event
            const eventType = delta === 1 ? 'next' : 'previous';
            trackPlaybackEvent(eventType, `${collectionId || 'unknown'}-${targetIndex}`, targetPhase, targetIndex, speed);

            // Update user stats when navigating while paused (phrase viewed)
            if (!wasPlaying) {
                await debouncedUpdateUserStats(phrases, targetIndex, 'viewed');
            }
        }

        // continue only if we were already playing
        if (wasPlaying) {
            setPaused(false);
            setMSState('playing');
            await safePlay('atomicAdvance');
        } else {
            setPaused(true);
            setMSState('paused');
            // reflect paused position to Media Session
            // transportRef.current?.setPosition({
            //     durationSec: audioRef.current?.duration || 0,
            //     positionSec: audioRef.current?.currentTime || 0,
            //     rate: 0,
            // });
        }

        // update OS metadata
        pushMetadataToTransport();
    };


    const handleAudioError = async (phase: 'input' | 'output', autoPlay?: boolean) => {
        console.log('handleAudioError', phase, autoPlay);
        if (!audioRef.current || currentPhraseIndex < 0 || !setPhrases) return;
        console.log('phrases', phrases);
        const phrase = phrases[currentPhraseIndex];
        if (!phrase) return;
        console.log('phrase', phrase);
        try {
            const text = phase === 'input' ? phrase.input : phrase.translated;
            const language = phase === 'input' ? phrase.inputLang : phrase.targetLang;
            const voice = phase === 'input' ? phrase.inputVoice : phrase.targetVoice;
            console.log('text', text);
            console.log('language', language);
            console.log('voice', voice);
            if (!text || !language || !voice) return;
            console.log('generating audio', text, language, voice);
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
                setSrcSafely(audioUrl);
                // Set playback speed based on phase
                const speed = phase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                if (speed !== 1.0) {
                    audioRef.current.playbackRate = speed;
                }
                safePlay('handleAudioError-autoPlay');
            }
        } catch (err) {
            console.error('Error regenerating audio:', err);
            // If regeneration fails, stop playback
            if (audioRef.current) {
                audioRef.current.pause();
                setSrcSafely('');
            }
            setPaused(true);
        }
    };

    // Playback control handlers
    const handlePause = (source: PauseSource = 'local') => {
        console.log('handlePause', source);
        const el = audioRef.current;
        if (!el) return;

        // cancel any current play intent so a pending play() won't re-start
        ++playSeqRef.current;

        const markProgrammatic = source === 'local';
        if (markProgrammatic) programmaticPauseRef.current = true;

        try {
            clearAllTimeouts();
            setShowProgressBar(false);
            el.pause();
            setPaused(true);
            setMSState('paused');
            showStatsUpdate(true);

            if (currentPhraseIndex >= 0 && phrases[currentPhraseIndex]) {
                const speed = currentPhase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                trackPlaybackEvent('pause', `${collectionId || 'unknown'}-${currentPhraseIndex}`, currentPhase, currentPhraseIndex, speed);
            }
        } finally {
            if (markProgrammatic) setTimeout(() => { programmaticPauseRef.current = false; }, 0);
        }
    };

    const handleStop = () => {
        // cancel any current play intent
        ++playSeqRef.current;

        programmaticPauseRef.current = true;
        try {
            clearAllTimeouts();
            setShowProgressBar(false);
            if (audioRef.current) {
                audioRef.current.pause();
                setSrcSafely('');
            }
            setPaused(true);
            setMSState('paused');
            showStatsUpdate();

            // Track stop event
            if (currentPhraseIndex >= 0 && phrases[currentPhraseIndex]) {
                const speed = currentPhase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                trackPlaybackEvent('stop', `${collectionId || 'unknown'}-${currentPhraseIndex}`, currentPhase, currentPhraseIndex, speed);
            }
        } finally {
            setTimeout(() => { programmaticPauseRef.current = false; }, 0);
        }
    };

    const handlePlay = () => {
        setPaused(false);

        // No special delay handling needed - timeouts will naturally continue or be cleared

        if (currentPhraseIndex <= 0) {
            handleReplay();
        } else if (audioRef.current) {
            // Skip input audio if disabled and we're in input phase
            if (currentPhase === 'input' && !presentationConfig.enableInputPlayback) {
                setCurrentPhase('output');
                return;
            }

            if (!audioRef.current.src) {
                setSrcSafely(phrases[currentPhraseIndex]?.[currentPhase === "input" ? 'inputAudio' : 'outputAudio']?.audioUrl ?? '')
            }
            // Set playback speed based on current phase
            const speed = currentPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
            safePlay('handlePlay');

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
            setSrcSafely(phrases[0].inputAudio?.audioUrl || '');
            // Set playback speed for input phase
            const speed = presentationConfig.inputPlaybackSpeed || 1.0;
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
        } else if (startPhase === 'output' && audioRef.current && phrases[0]?.outputAudio?.audioUrl) {
            setSrcSafely(phrases[0].outputAudio?.audioUrl || '');
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
            setSrcSafely(phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '');
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
                safePlay('handlePlayPhrase-paused');
            } else {
                // If not paused, update state and play through main audio element
                setPaused(false);
                safePlay('handlePlayPhrase-active');
            }

            // Track play phrase event
            if (phrases[index]) {
                trackPlaybackEvent('play', `${collectionId || 'unknown'}-${index}`, phase, index, speed);
            }
        }
    };

    // Shared navigation handlers (commented out as unused)
    /*const handlePrevious = async () => {
        clearAllTimeouts();
        clearDelayWindow();
        if (audioRef.current) {
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
            setSrcSafely(audioUrl || '');

            const speed = targetPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }

            // Update user stats for phrase viewed (only once per phrase pair - when target language is reached)
            if (targetIndex >= 0 && phrases[targetIndex] && targetPhase === 'output') {
                // Track previous navigation (existing)
                trackPlaybackEvent('previous', `${collectionId || 'unknown'}-${targetIndex}`, targetPhase, targetIndex, speed);
                if (paused) await debouncedUpdateUserStats(phrases, targetIndex, 'viewed');
            }

            // Increment viewed phrases when navigating from output phase
            if (currentPhase === 'output' && paused) {
                showViewedPhrases();
            }

            // Actually start playback if we weren't paused
            if (!paused) {
                setPaused(false);
                setMSState('playing');        // keep OS transport "playing" between clips
                safePlay('nav-prev');         // actually start the new audio
            }
        }
    };*/

    /*const handleNext = async () => {
        clearAllTimeouts();
        clearDelayWindow();
        if (audioRef.current) {
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
            setSrcSafely(audioUrl || '');

            const speed = targetPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }

            // Update user stats for phrase viewed (only once per phrase pair - when target language is reached)
            if (targetIndex >= 0 && phrases[targetIndex] && targetPhase === 'output') {
                // Track next navigation (existing)
                trackPlaybackEvent('next', `${collectionId || 'unknown'}-${targetIndex}`, targetPhase, targetIndex, speed);
                // TODO - should we also increment viewed phrases when autoplaying (via use effect)?
                if (paused) await debouncedUpdateUserStats(phrases, targetIndex, 'viewed');
            }

            // Increment viewed phrases when navigating from output phase
            if (currentPhase === 'output' && paused) {
                showViewedPhrases();
            }

            // Actually start playback if we weren't paused
            if (!paused) {
                setPaused(false);
                setMSState('playing');        // keep OS transport "playing" between clips
                safePlay('nav-next');         // actually start the new audio
            }
        }
    };*/

    const attachAudioGuards = (el: HTMLAudioElement) => {
        const maybeExternalPause = () => {
            if (srcSwapRef.current) return;             // ignore during programmatic src change
            if (programmaticPauseRef.current) return;    // ignore our own pause/src swaps
            if (el.ended) return;                       // natural end → ignore here
            handlePause('external');
        };

        const onPlay = () => { programmaticPauseRef.current = false; };
        const onPlaying = () => { programmaticPauseRef.current = false; };

        el.addEventListener('play', onPlay);
        el.addEventListener('playing', onPlaying);
        el.addEventListener('pause', maybeExternalPause);
        el.addEventListener('emptied', maybeExternalPause); // strong on Safari unplug

        // optional, guarded:
        // el.addEventListener('stalled', maybeExternalPause);
        // el.addEventListener('suspend', maybeExternalPause);

        // store a cleanup somewhere if you need to detach later
    };

    // Initialize transport callback ref
    const initTransport = useCallback((el: HTMLAudioElement | null) => {
        audioRef.current = el;
        if (!el || transportRef.current) return;

        const transport = new WebMediaSessionTransport(el);
        transportRef.current = transport;
        transport.setCapabilities({ canPlayPause: true, canNextPrev: true, canSeek: false });
        transport.onPlay(handlePlay);
        transport.onPause(() => handlePause('external'));
        transport.onNext(() => queueSkip(+1));
        transport.onPrevious(() => queueSkip(-1));

        // Reapply handlers on playing event (critical for iOS)
        el.addEventListener('playing', () => {
            transport.reapplyHandlers();
        });

        // also attach audio-element fallbacks
        attachAudioGuards(el);
    }, [handlePlay, handlePause]);

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
        const totalDelayMs = playOutputBeforeInput ? outputDuration + 1000 : inputDuration + presentationConfig.delayBetweenPhrases;
        setProgressDuration(totalDelayMs);
        setProgressDelay(0);

        if (currentPhase === 'input') {
            if (playOutputBeforeInput) {
                debouncedUpdateUserStats(phrases, currentPhraseIndex);
            }

            // Set media session to playing during delay for proper media controls
            setMSState('playing');

            const timeoutId = window.setTimeout(() => {
                // Check if still not paused before proceeding
                if (pausedRef.current) return;

                // Timeouts naturally end, no special cleanup needed

                setCurrentPhase('output');
                setShowProgressBar(false);

                if (playOutputBeforeInput) {
                    if (indexRef.current < phrases.length - 1 && !pausedRef.current) {
                        setCurrentPhraseIndex(indexRef.current + 1);
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
            }, totalDelayMs);
            timeoutIds.current.push(timeoutId);
        } else {
            // Update user stats before phrase ends
            if (!playOutputBeforeInput) {
                debouncedUpdateUserStats(phrases, currentPhraseIndex);
            }

            // Set progress bar for shadow (output duration delay)
            setShowProgressBar(true);
            const totalOutputDelayMs = playOutputBeforeInput ? inputDuration + 1000 : (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases;
            setProgressDuration(totalOutputDelayMs);
            setProgressDelay(0);

            // Set media session to playing during delay for proper media controls
            setMSState('playing');

            const timeoutId = window.setTimeout(() => {
                // Check if still not paused before proceeding
                if (pausedRef.current) return;

                // Timeouts naturally end, no special cleanup needed

                setShowProgressBar(false);
                if (playOutputBeforeInput) {
                    // Check if input playback is enabled
                    if (presentationConfig.enableInputPlayback) {
                        setCurrentPhase('input');
                    } else {
                        // Skip input phase if disabled, go to next phrase output
                        if (indexRef.current < phrases.length - 1 && !pausedRef.current) {
                            setCurrentPhraseIndex(indexRef.current + 1);
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
                    if (indexRef.current < phrases.length - 1 && !pausedRef.current) {
                        setCurrentPhraseIndex(indexRef.current + 1);
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
            }, totalOutputDelayMs);
            timeoutIds.current.push(timeoutId);
        }
    };

    // Push metadata whenever phrase/phase changes
    useEffect(() => {
        pushMetadataToTransport();
    }, [pushMetadataToTransport]);

    // Preload next/prev clips for smoother continuous skip
    useEffect(() => {
        const i = indexRef.current;
        const neigh = [
            phrases[(i + 1) % phrases.length],
            phrases[(i - 1 + phrases.length) % phrases.length],
        ];
        neigh.forEach(p => {
            const url = (phaseRef.current === 'input' && presentationConfig.enableInputPlayback)
                ? p.inputAudio?.audioUrl
                : p.outputAudio?.audioUrl;
            if (url) {
                // fire-and-forget HEAD to warm connection; browsers will cache
                fetch(url, { method: 'HEAD' }).catch(() => { });
            }
        });
    }, [currentPhraseIndex, currentPhase, phrases, presentationConfig.enableInputPlayback]);

    // oh

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
                setSrcSafely(src);
                // Set playback speed based on current phase
                const speed = currentPhase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                if (speed !== 1.0) {
                    audioRef.current.playbackRate = speed;
                }
                safePlay('autoplay-effect');
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
            <audio
                ref={initTransport}
                onEnded={handleAudioEnded}
                controls
                hidden
                playsInline
                preload="metadata"
            />

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
                                        const audioUrl = targetPhase === 'input'
                                            ? phrases[index].inputAudio?.audioUrl
                                            : phrases[index].outputAudio?.audioUrl;
                                        setSrcSafely(audioUrl || '');
                                        // Set playback speed based on target phase
                                        const speed = targetPhase === 'input'
                                            ? (presentationConfig.inputPlaybackSpeed || 1.0)
                                            : (presentationConfig.outputPlaybackSpeed || 1.0);
                                        if (speed !== 1.0) {
                                            audioRef.current.playbackRate = speed;
                                        }

                                        // If already playing, then actually play the new clip
                                        if (!paused) {
                                            setPaused(false);
                                            setMSState('playing');
                                            safePlay('phrase-click-active');
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
                            onPrevious={() => queueSkip(-1)}
                            onNext={() => queueSkip(+1)}
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
                                onPrevious={() => queueSkip(-1)}
                                onNext={() => queueSkip(+1)}
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