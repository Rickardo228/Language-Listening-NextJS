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
    const { updateUserStats, StatsPopups, StatsModal, showStatsUpdate, showViewedPhrases } = useUpdateUserStats();
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>(
        presentationConfig.enableInputPlayback ? 'input' : 'output'
    );
    const [paused, setPaused] = useState(true);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
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
    // Removed programmaticPauseRef - was only set, never read after removing attachAudioGuards
    // Play sequence counter prevents errors when trying to play an audio element that's already
    // in the process of starting playback. Without this, rapid play() calls cause browser errors
    // like "AbortError: The play() request was interrupted" when one play() cancels another.
    // Each play attempt gets a unique sequence number - if another play starts while one is pending,
    // the earlier attempt will bail out gracefully when it sees the sequence has changed.
    const playSeqRef = useRef(0);                 // increments on every new "play intent"

    // Removed skip pump system - using direct navigation instead

    // Refs for state used in timers to prevent stale closures
    const pausedRef = useRef(paused);
    const phaseRef = useRef(currentPhase);
    const indexRef = useRef(currentPhraseIndex);

    // Helper functions for phase semantics (recall = first audio, shadow = second audio)
    const getRecallPhase = useCallback((): 'input' | 'output' => {
        return presentationConfig.enableOutputBeforeInput ? 'output' : 'input';
    }, [presentationConfig.enableOutputBeforeInput]);

    const getShadowPhase = useCallback((): 'input' | 'output' => {
        return presentationConfig.enableOutputBeforeInput ? 'input' : 'output';
    }, [presentationConfig.enableOutputBeforeInput]);

    const isRecallPhase = useCallback((phase: 'input' | 'output'): boolean => {
        return presentationConfig.enableOutputBeforeInput
            ? (phase === 'output')
            : (phase === 'input');
    }, [presentationConfig.enableOutputBeforeInput]);

    // Removed delay period tracking - using simple setTimeout approach

    // Keep pausedRef in sync with state
    // TODO - do these even need to be useEffects? Cant we just set on each render?
    useEffect(() => { pausedRef.current = paused; }, [paused]);

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
        console.log('🔄 pushMetadataToTransport called');
        const t = transportRef.current;
        if (!t) {
            console.log('🔄 No transport available');
            return;
        }

        // Use refs to avoid stale closure values
        const currentIndex = indexRef.current;
        const currentPhaseValue = phaseRef.current;
        const phrase = phrases[currentIndex];

        const metadata = {
            title: (phrase?.translated || ''),
            artist: phrase?.input || '',
            album: (collectionName?.replace(/\b\w/g, l => l.toUpperCase()) || 'Session'),
            artworkUrl: presentationConfig.bgImage || '/language-shadowing-logo-dark.png',
        };

        console.log('🔄 Setting transport metadata:', {
            phraseIndex: currentIndex,
            currentPhase: currentPhaseValue,
            metadata: metadata,
            phraseData: {
                input: phrase?.input,
                translated: phrase?.translated,
                inputAudio: phrase?.inputAudio?.audioUrl ? 'present' : 'missing',
                outputAudio: phrase?.outputAudio?.audioUrl ? 'present' : 'missing',
            },
            audioElement: {
                src: audioRef.current?.src || 'none',
                duration: audioRef.current?.duration || 0,
                currentTime: audioRef.current?.currentTime || 0,
                paused: audioRef.current?.paused,
                playbackRate: audioRef.current?.playbackRate || 1,
            },
            timestamp: new Date().toISOString()
        });

        t.setMetadata(metadata);

        // Handlers will be reapplied on 'playing' event
    }, [phrases, collectionName, presentationConfig.bgImage]);

    const setMSState = (state: 'none' | 'paused' | 'playing') => {
        try { if ('mediaSession' in navigator) (navigator as NavigatorWithMediaSession).mediaSession.playbackState = state; } catch { }
    };

    // Enhanced state setters that handle ref sync and metadata pushing
    const setCurrentPhraseIndexWithMetadata = useCallback((index: number | ((prev: number) => number)) => {
        setCurrentPhraseIndex(index);
        // Sync ref immediately (replaces useEffect)
        indexRef.current = typeof index === 'function' ? index(indexRef.current) : index;
        // Push metadata after state update
        setTimeout(() => pushMetadataToTransport(), 0);
    }, [pushMetadataToTransport]);

    const setCurrentPhaseWithMetadata = useCallback((phase: 'input' | 'output') => {
        setCurrentPhase(phase);
        // Sync ref immediately (replaces useEffect)
        phaseRef.current = phase;
        // Push metadata after state update
        setTimeout(() => pushMetadataToTransport(), 0);
    }, [pushMetadataToTransport]);

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

            // Handlers will be reapplied on 'playing' event
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') {
                // benign: a pause/src change raced our play - this IS the sequence logic in action
                return;
            }
            console.error('play failed:', reason, e);
            // If playback fails, try to regenerate the audio (restored lost functionality)
            if (currentPhraseIndex >= 0) {
                handleAudioError(currentPhase);
            }
        }
    };

    // No special delay period helpers needed - just use setTimeout and clearAllTimeouts()

    // Helper to safely set src without triggering system pause
    const setSrcSafely = (url: string) => {
        const el = audioRef.current;
        if (!el) return;
        // cancel any current play intent
        ++playSeqRef.current;
        el.src = url;
    };

    // Removed pump functions - using direct navigation

    const atomicAdvance = async (delta: 1 | -1) => {
        // Clear any existing timers
        clearAllTimeouts();

        if (!phrases.length) return;

        const wasPlaying = !pausedRef.current; // snapshot before we move
        // Compute next cursor
        const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
        const enableRecall = presentationConfig.enableInputPlayback;

        let targetIndex = indexRef.current;
        const curPhase = phaseRef.current;
        let targetPhase: 'input' | 'output' = curPhase;

        if (playOutputBeforeInput) {
            if (delta === +1) {
                if (curPhase === 'output') {
                    // Recall -> Shadow (same phrase) OR skip to next recall if shadow disabled
                    targetPhase = enableRecall ? 'input' : 'output';
                    if (enableRecall) {
                        // Normal: go to shadow phase of same phrase
                        targetPhase = 'input';
                    } else {
                        // Skip shadow, jump to next phrase's recall
                        targetIndex = (targetIndex + 1) % phrases.length;
                        targetPhase = 'output';
                    }
                } else {
                    // Shadow -> next phrase Recall
                    targetIndex = (targetIndex + 1) % phrases.length;
                    targetPhase = enableRecall ? 'output' : 'input'; // Start at recall or shadow of next phrase
                }
            } else { // delta === -1
                if (curPhase === 'input') {
                    // Shadow -> Recall (same phrase) OR previous phrase shadow if recall disabled
                    if (enableRecall) {
                        targetPhase = 'output';
                    } else {
                        targetIndex = (targetIndex - 1 + phrases.length) % phrases.length;
                        targetPhase = 'input';
                    }
                } else {
                    // Recall -> previous phrase Shadow OR Recall
                    targetIndex = (targetIndex - 1 + phrases.length) % phrases.length;
                    targetPhase = enableRecall ? 'input' : 'output';
                }
            }
        } else {
            // input-before-output mode
            if (delta === +1) {
                if (curPhase === 'input') {
                    // Recall -> Shadow (same phrase) OR skip to next recall if shadow disabled
                    if (enableRecall) {
                        targetPhase = 'output';
                    } else {
                        targetIndex = (targetIndex + 1) % phrases.length;
                        targetPhase = 'input';
                    }
                } else {
                    // Shadow -> next phrase Recall OR Shadow
                    targetIndex = (targetIndex + 1) % phrases.length;
                    targetPhase = enableRecall ? 'input' : 'output';
                }
            } else { // delta === -1
                if (curPhase === 'output') {
                    // Shadow -> Recall (same phrase) OR previous phrase shadow if recall disabled
                    if (enableRecall) {
                        targetPhase = 'input';
                    } else {
                        targetIndex = (targetIndex - 1 + phrases.length) % phrases.length;
                        targetPhase = 'output';
                    }
                } else {
                    // Recall -> previous phrase Shadow OR Recall
                    targetIndex = (targetIndex - 1 + phrases.length) % phrases.length;
                    targetPhase = enableRecall ? 'output' : 'input';
                }
            }
        }


        // swap state + src (no pause)
        setCurrentPhraseIndexWithMetadata(targetIndex);
        setCurrentPhaseWithMetadata(targetPhase);

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
                // Show popup for viewed phrases milestones (5, 10, 15, etc.)
                showViewedPhrases(5);
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
        }
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

        clearAllTimeouts();
        setShowProgressBar(false);
        el.pause();
        setPaused(true);
        setMSState('paused');
        showStatsUpdate(true);

        if (source === 'external') {
            // 💥 nuke any buffered/decoded audio so unlock can't leak sound
            el.src = '';
            el.load();
            // resets the element (fires 'emptied')
        }

        if (currentPhraseIndex >= 0 && phrases[currentPhraseIndex]) {
            const speed = currentPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            trackPlaybackEvent('pause', `${collectionId || 'unknown'}-${currentPhraseIndex}`, currentPhase, currentPhraseIndex, speed);
        }
    };

    const handleStop = () => {
        // cancel any current play intent
        ++playSeqRef.current;

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
    };

    const handlePlay = useCallback(() => {
        setPaused(false);

        const idx = indexRef.current;          // always fresh
        let phase = phaseRef.current;

        // Only replay when we've intentionally set a negative index
        if (idx < 0) {
            handleReplay();
            return;
        }

        // If input playback is disabled and we're on the recall phase, switch to shadow phase
        if (isRecallPhase(phase) && !presentationConfig.enableInputPlayback) {
            const shadowPhase = getShadowPhase();
            phase = shadowPhase;
            setCurrentPhaseWithMetadata(shadowPhase);
        }

        const el = audioRef.current;
        if (!el) return;

        // Ensure src set
        // Even more relevant now we nuke in external on pause
        if (!el.src) {
            const url = phrases[idx]?.[phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl ?? '';
            setSrcSafely(url);
            // Apply speed for current phase now
            const speed = phase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) el.playbackRate = speed;
        }

        // Apply speed for current phase
        const speed = phase === 'input'
            ? (presentationConfig.inputPlaybackSpeed || 1.0)
            : (presentationConfig.outputPlaybackSpeed || 1.0);
        if (speed !== 1.0) el.playbackRate = speed;

        safePlay('handlePlay');
        if (idx >= 0 && phrases[idx]) {
            trackPlaybackEvent('play', `${collectionId || 'unknown'}-${idx}`, phase, idx, speed);
        }
    }, [phrases, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.enableInputPlayback, presentationConfig.enableOutputBeforeInput, collectionId]);


    const handleReplay = async () => {
        clearAllTimeouts();
        setCurrentPhraseIndexWithMetadata(prev => prev < 0 ? prev - 1 : -1);

        // Determine starting phase based on playback order and enableInputPlayback
        const startPhase = presentationConfig.enableInputPlayback
            ? getRecallPhase()  // Start with recall phase (first audio)
            : getShadowPhase(); // Skip recall phase, start with shadow phase (second audio)
        setCurrentPhaseWithMetadata(startPhase);

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
            setCurrentPhraseIndexWithMetadata(0);
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
            const isPaused = paused;
            setSrcSafely(phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '');
            // Set playback speed based on phase
            const speed = phase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
            setCurrentPhraseIndexWithMetadata(index);

            // If input playback is disabled and user clicked input audio, keep phase as output
            // but still play the audio and update the index
            if (isRecallPhase(phase) && !presentationConfig.enableInputPlayback) {
                setCurrentPhaseWithMetadata(getShadowPhase());
            } else {
                setCurrentPhaseWithMetadata(phase);
            }

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

    // Removed large commented handlePrevious function - replaced with atomicAdvance

    // Removed large commented handleNext function - replaced with atomicAdvance

    // Removed attachAudioGuards - redundant with WebMediaSessionTransport handling

    // Initialize transport callback ref
    const initTransport = useCallback((el: HTMLAudioElement | null) => {
        console.log('initTransport');
        audioRef.current = el;
        if (!el || transportRef.current) return;
        console.log('creating transport');
        const transport = new WebMediaSessionTransport(el);
        transportRef.current = transport;
        transport.setCapabilities({ canPlayPause: true, canNextPrev: true });
        transport.onPlay(handlePlay);
        transport.onPause(() => handlePause('external'));
        transport.onNext(() => atomicAdvance(+1));
        transport.onPrevious(() => atomicAdvance(-1));

        // Reapply handlers on first playing event (critical for iOS)
        // This is necessary to get the media controls to show next and previous buttons
        // Optimized to only run once after the first play
        let hasReappliedHandlers = false;
        const handleFirstPlaying = () => {
            if (!hasReappliedHandlers) {
                transport.reapplyHandlers();
                hasReappliedHandlers = true;
                // Remove the listener after first use to prevent unnecessary calls
                el.removeEventListener('playing', handleFirstPlaying);
            }
        };
        el.addEventListener('playing', handleFirstPlaying);
        // TODO - clean up this even listener

        // Removed audio guards - using transport for media session handling
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

                setCurrentPhaseWithMetadata('output');
                setShowProgressBar(false);

                if (playOutputBeforeInput) {
                    if (indexRef.current < phrases.length - 1 && !pausedRef.current) {
                        setCurrentPhraseIndexWithMetadata(indexRef.current + 1);
                    } else {
                        if (presentationConfig.enableLoop) {
                            // If looping is enabled, restart from beginning
                            setCurrentPhraseIndexWithMetadata(0);
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
                        setCurrentPhaseWithMetadata('input');
                    } else {
                        // Skip input phase if disabled, go to next phrase output
                        if (indexRef.current < phrases.length - 1 && !pausedRef.current) {
                            setCurrentPhraseIndexWithMetadata(indexRef.current + 1);
                            setCurrentPhaseWithMetadata('output');
                        } else {
                            if (presentationConfig.enableLoop) {
                                // If looping is enabled, restart from beginning
                                setCurrentPhraseIndexWithMetadata(0);
                                setCurrentPhaseWithMetadata('output');
                            } else {
                                showStatsUpdate(true)
                                setPaused(true);
                            }
                        }
                    }
                } else {
                    if (indexRef.current < phrases.length - 1 && !pausedRef.current) {
                        setCurrentPhraseIndexWithMetadata(indexRef.current + 1);
                        // Check if input playback is enabled
                        if (presentationConfig.enableInputPlayback) {
                            setCurrentPhaseWithMetadata('input');
                        } else {
                            setCurrentPhaseWithMetadata('output');
                        }
                    } else {
                        if (presentationConfig.enableLoop) {
                            // If looping is enabled, restart from beginning
                            setCurrentPhraseIndexWithMetadata(0);
                            // Check if input playback is enabled
                            if (presentationConfig.enableInputPlayback) {
                                setCurrentPhaseWithMetadata('input');
                            } else {
                                setCurrentPhaseWithMetadata('output');
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


    // Preload next/prev clips for smoother continuous skip
    useEffect(() => {
        const i = indexRef.current;
        const neighbouringPhrases = [
            phrases[(i + 1) % phrases.length],
            phrases[(i - 1 + phrases.length) % phrases.length],
        ];
        neighbouringPhrases.forEach(p => {
            const url = (phaseRef.current === 'input' && presentationConfig.enableInputPlayback)
                ? p.inputAudio?.audioUrl
                : p.outputAudio?.audioUrl;
            if (url) {
                // fire-and-forget HEAD to warm connection; browsers will cache
                fetch(url, { method: 'HEAD' }).catch(() => { });
            }
        });
    }, [currentPhraseIndex, currentPhase, phrases, presentationConfig.enableInputPlayback]);

    // Audio playback effect
    useEffect(() => {
        if (currentPhraseIndex < 0 || paused) return;

        // Skip recall phase if disabled
        if (isRecallPhase(currentPhase) && !presentationConfig.enableInputPlayback) {
            setCurrentPhaseWithMetadata(getShadowPhase());
            return;
        }

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
    }, [currentPhraseIndex, currentPhase, paused, currentInputAudioUrl, currentOutputAudioUrl, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.enableInputPlayback, presentationConfig.enableOutputBeforeInput]);

    // Handle presentation config changes that affect current phase
    useEffect(() => {
        // When input playback is disabled, ensure we're not on the input phase
        if (!presentationConfig.enableInputPlayback && currentPhase === 'input') {
            setCurrentPhaseWithMetadata('output');
            return;
        }

        // When input playback is enabled, we might want to reset to the appropriate starting phase
        // based on enableOutputBeforeInput (optional - could be removed if not desired)
        // For now, we'll leave the phase as-is when enableInputPlayback is turned ON
        // to avoid disrupting the user's current state
    }, [presentationConfig.enableInputPlayback, presentationConfig.enableOutputBeforeInput, currentPhase, setCurrentPhaseWithMetadata]);

    if (methodsRef) methodsRef.current = {
        handleStop,
        handlePause,
        handlePlay,
        handleReplay,
        handlePlayPhrase,
        setCurrentPhraseIndex: setCurrentPhraseIndexWithMetadata,
        setCurrentPhase: setCurrentPhaseWithMetadata,
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
                onEnded={(e) => {
                    setIsPlayingAudio(false);
                    handleAudioEnded(e);
                }}
                onPlay={() => setIsPlayingAudio(true)}
                onPause={() => setIsPlayingAudio(false)}
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
                                    setCurrentPhraseIndexWithMetadata(index);
                                    clearAllTimeouts();

                                    // Determine target phase considering both enableOutputBeforeInput and enableInputPlayback
                                    const targetPhase = presentationConfig.enableInputPlayback
                                        ? getRecallPhase()  // Start with recall phase (first audio)
                                        : getShadowPhase(); // Skip recall phase, start with shadow phase (second audio)

                                    setCurrentPhaseWithMetadata(targetPhase);
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
                            onPrevious={() => atomicAdvance(-1)}
                            onNext={() => atomicAdvance(+1)}
                            canGoBack={true}
                            canGoForward={true}
                            currentPhraseIndex={currentPhraseIndex}
                            totalPhrases={phrases.length}
                            isPlayingAudio={isPlayingAudio}
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
                                onPrevious={() => atomicAdvance(-1)}
                                onNext={() => atomicAdvance(+1)}
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