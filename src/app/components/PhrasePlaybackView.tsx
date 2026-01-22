import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PresentationView } from '../PresentationView';
import { EditablePhrases } from '../EditablePhrases';
import { SettingsModal } from '../SettingsModal';
import { LikePhraseDialog } from '../LikePhraseDialog';
import { Phrase, PresentationConfig } from '../types';
import { generateAudio } from '../utils/audioUtils';
import { BLEED_START_DELAY, DELAY_AFTER_INPUT_PHRASES_MULTIPLIER, DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER, } from '../consts';
import { useUpdateUserStats } from '../utils/userStats/userStats';
import { track, trackAudioEnded, trackPlaybackEvent } from '../../lib/mixpanelClient';
import { WebMediaSessionTransport } from '../../transport/webMediaSessionTransport';
import { loadProgress, saveProgress } from '../utils/progressService';
import { useUser } from '../contexts/UserContext';
import { cn } from './ui/utils';
import { showListCompletionSnackbar } from './ui/StatsSnackbars';
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
    getCurrentPhase: () => 'input' | 'output';
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
    handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoplay?: boolean;
    transport?: WebMediaSessionTransport; // Optional transport for testing/external control
    itemType?: 'template' | 'collection';
    pathId?: string; // Learning path ID if this collection is part of a path
    pathIndex?: number; // Position in the learning path
    onNavigateToNextInPath?: () => void; // Callback to navigate to next item in path
    initialFullscreen?: boolean; // Start in fullscreen mode
    readOnly?: boolean;
    hidePhrases?: boolean;
    onCompleted?: (userId: string, collectionId: string, inputLang: string, targetLang: string) => void;
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
    handleImageUpload,
    autoplay = false,
    transport: externalTransport,
    itemType,
    pathId,
    pathIndex,
    onNavigateToNextInPath,
    initialFullscreen = false,
    readOnly = false,
    hidePhrases = false,
    onCompleted,
}: PhrasePlaybackViewProps) {
    const { user } = useUser();
    const { updateUserStats, StatsPopups, StatsModal, showStatsUpdate, incrementViewedAndCheckMilestone, initializeViewedCounter, phrasesViewed, setIsAutoplayActive, recentMilestones } = useUpdateUserStats();
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>(
        presentationConfig.enableInputPlayback ? 'input' : 'output'
    );
    const [paused, setPaused] = useState(true);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [fullscreen, setFullscreenBase] = useState(initialFullscreen);

    const setFullscreen = useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
        setFullscreenBase(prevFullscreen => {
            const newVal = typeof value === 'function' ? value(prevFullscreen) : value;
            track(`Fullscreen ${newVal ? 'Enabled' : 'Disabled'}`);

            // If exiting fullscreen and user was in viewing mode (paused), show viewed popup
            // Only show if phrases viewed count is over 5
            if (!newVal && prevFullscreen && pausedRef.current && phrasesViewed > 5) {
                // User is exiting fullscreen while paused (viewing mode)
                showStatsUpdate(false, 'viewed');
            }

            return newVal;
        });
    }, [phrasesViewed, showStatsUpdate]);
    const [showTitle, setShowTitle] = useState(false);
    const [configName, setConfigName] = useState('Default');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [likeDialogOpen, setLikeDialogOpen] = useState(false);
    const [likedPhrase, setLikedPhrase] = useState<Phrase | null>(null);

    // Debouncing refs for spam prevention
    const updateUserStatsTimeout = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_DELAY = 400; // 400ms debounce for DB writes

    // Throttling for viewed counter increments
    const lastViewedTimeRef = useRef<number>(0);
    const THROTTLE_DELAY = 400; // 400ms throttle for counter increments

    // Progress tracking refs
    const progressSaveTimeout = useRef<NodeJS.Timeout | null>(null);
    const PROGRESS_DEBOUNCE_DELAY = 500; // 500ms debounce for progress saves
    const phrasesRef = useRef(phrases);
    const progressLoadedRef = useRef(false);
    const [progressLoaded, setProgressLoaded] = useState(false);
    // Debounced wrapper for updateUserStats
    const debouncedUpdateUserStats = useCallback(async (phrases: Phrase[], currentPhraseIndex: number, eventType: 'listened' | 'viewed' = 'listened', skipSessionIncrement: boolean = false) => {
        // Clear existing timeout
        if (updateUserStatsTimeout.current) {
            clearTimeout(updateUserStatsTimeout.current);
        }

        // Set new timeout
        updateUserStatsTimeout.current = setTimeout(async () => {
            await updateUserStats(phrases, currentPhraseIndex, eventType, skipSessionIncrement);
        }, DEBOUNCE_DELAY);
    }, [updateUserStats, DEBOUNCE_DELAY]);

    // Debounced progress save (defined early to avoid circular dependency with trackListenIfNeeded)
    const debouncedSaveProgress = useCallback(() => {
        if (!user?.uid || !collectionId || !itemType) return;

        // Don't save until progress has been loaded to prevent race condition
        if (!progressLoadedRef.current) {
            console.log('Skipping save - progress not loaded yet');
            return;
        }

        if (progressSaveTimeout.current) {
            clearTimeout(progressSaveTimeout.current);
        }

        progressSaveTimeout.current = setTimeout(() => {
            const currentPhrases = phrasesRef.current;
            const currentIndex = indexRef.current;

            console.log('Saving progress - indexRef:', currentIndex, 'phaseRef:', phaseRef.current);
            saveProgress(user.uid, {
                collectionId,
                itemType,
                lastPhraseIndex: currentIndex,
                lastPhase: phaseRef.current,
                lastAccessedAt: new Date().toISOString(),
                inputLang: currentPhrases[0]?.inputLang,
                targetLang: currentPhrases[0]?.targetLang,
            });
        }, PROGRESS_DEBOUNCE_DELAY);
    }, [user?.uid, collectionId, itemType]);

    // Centralized listen tracking - automatically called when audio ends
    // Prevents double-counting the same phrase
    const trackListenIfNeeded = useCallback((phraseIndex: number) => {
        console.log('trackListenIfNeeded called with phraseIndex:', phraseIndex, 'lastListened:', lastListenedPhraseRef.current);
        // Only track if this is a different phrase from the last one we tracked
        if (lastListenedPhraseRef.current !== phraseIndex) {
            debouncedUpdateUserStats(phrases, phraseIndex, 'listened');
            lastListenedPhraseRef.current = phraseIndex;
            // Save progress after tracking a listened phrase (saveProgress will update listenedPhraseIndices)
            console.log('Saving progress after tracking a listened phrase');
            debouncedSaveProgress();
        }
    }, [phrases, debouncedUpdateUserStats, debouncedSaveProgress]);

    const [showProgressBar, setShowProgressBar] = useState(false);
    const [progressDuration, setProgressDuration] = useState(0);
    const [progressDelay, setProgressDelay] = useState(0);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
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
    const prevPhraseIndexRef = useRef(currentPhraseIndex);
    // Track which phrase is currently playing for automatic listen tracking
    const playingPhraseRef = useRef<{ index: number, phase: 'input' | 'output' } | null>(null);
    const lastListenedPhraseRef = useRef<number>(-1);

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

    // Initialize viewed counter and progress doc when phrases are first loaded (accounts for viewing the first phrase)
    // Track if we've initialized to prevent re-initialization when phrases length changes
    const hasInitializedRef = useRef(false);
    useEffect(() => {
        if (phrases.length > 0 && progressLoaded && !hasInitializedRef.current) {
            initializeViewedCounter(phrases, currentPhraseIndex);
            if (user?.uid && collectionId && itemType) {
                console.log('Saving progress on mount');
                saveProgress(user.uid, {
                    collectionId,
                    itemType,
                    lastPhraseIndex: currentPhraseIndex,
                    lastPhase: phaseRef.current,
                    lastAccessedAt: new Date().toISOString(),
                    inputLang: phrases[0]?.inputLang,
                    targetLang: phrases[0]?.targetLang,
                });
            }
            hasInitializedRef.current = true;
        }
        // Reset initialization flag when phrases array becomes empty (new collection loading)
        if (phrases.length === 0) {
            hasInitializedRef.current = false;
        }
    }, [phrases, currentPhraseIndex, initializeViewedCounter, user?.uid, collectionId, itemType, phrases[0]?.inputLang, phrases[0]?.targetLang, progressLoaded]);

    // Load progress on mount
    useEffect(() => {
        if (!user?.uid || !collectionId || !itemType) return;

        const loadSavedProgress = async () => {
            const progress = await loadProgress(user.uid, collectionId, phrases[0]?.inputLang, phrases[0]?.targetLang);
            console.log('Loaded progress:', progress);
            if (progress && typeof progress.lastPhraseIndex === 'number') {
                console.log('Setting current phrase index and phase to:', progress.lastPhraseIndex, progress.lastPhase);
                // Update refs immediately to prevent race condition
                indexRef.current = progress.lastPhraseIndex;
                phaseRef.current = progress.lastPhase;
                prevPhraseIndexRef.current = progress.lastPhraseIndex;
                // Update state
                setCurrentPhraseIndex(progress.lastPhraseIndex);
                setCurrentPhase(progress.lastPhase);
            }
            // Mark progress as loaded (even if no progress exists, we've attempted to load it)
            progressLoadedRef.current = true;
            setProgressLoaded(true);
            console.log('Progress loading complete, saves now enabled');
        };

        loadSavedProgress();
    }, [user?.uid, collectionId, itemType, phrases[0]?.inputLang, phrases[0]?.targetLang]);

    // Keep phrasesRef in sync
    useEffect(() => {
        phrasesRef.current = phrases;
    }, [phrases]);

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
        const t = transportRef.current;
        if (!t) {
            return;
        }

        // Use refs to avoid stale closure values
        const currentIndex = indexRef.current;
        const phrase = phrases[currentIndex];

        const metadata = {
            title: (phrase?.translated || ''),
            artist: phrase?.input || '',
            album: (collectionName?.replace(/\b\w/g, l => l.toUpperCase()) || 'Session'),
            artworkUrl: presentationConfig.bgImage || '/language-shadowing-logo-dark.png',
        };

        t.setMetadata(metadata);

        // Handlers will be reapplied on 'playing' event
    }, [phrases, collectionName, presentationConfig.bgImage]);

    const setMSState = (state: 'none' | 'paused' | 'playing') => {
        try { if ('mediaSession' in navigator) (navigator as NavigatorWithMediaSession).mediaSession.playbackState = state; } catch { }
    };

    // Enhanced state setters that handle ref sync and metadata pushing
    const setCurrentPhraseIndexWithMetadata = useCallback((
        index: number | ((prev: number) => number),
        skipViewedTracking: boolean = false
    ) => {
        // Calculate the actual numeric index value
        const newIndex = typeof index === 'function' ? index(indexRef.current) : index;

        // Track stats if phrase changed and user was paused (autoplay off)
        // Skip tracking "viewed" when about to play audio (will track "listened" when audio ends)
        if (!skipViewedTracking && newIndex >= 0 && newIndex !== prevPhraseIndexRef.current && pausedRef.current) {
            // Throttle counter increments to prevent counting during rapid navigation
            const now = Date.now();
            if (now - lastViewedTimeRef.current >= THROTTLE_DELAY) {
                // Increment counter and check for milestone
                incrementViewedAndCheckMilestone(5);
                // Update Firestore (skip session increment since we already incremented above)
                debouncedUpdateUserStats(phrases, newIndex, 'viewed', true);
                // Save progress when navigating while paused (mirrors debouncedUpdateUserStats)
                debouncedSaveProgress();
            }
            lastViewedTimeRef.current = now;
        }

        // Update refs
        prevPhraseIndexRef.current = newIndex;
        indexRef.current = newIndex;

        // Update state
        setCurrentPhraseIndex(index);

        // Push metadata after state update
        setTimeout(() => pushMetadataToTransport(), 0);
    }, [pushMetadataToTransport, phrases, debouncedUpdateUserStats, incrementViewedAndCheckMilestone, debouncedSaveProgress]);

    const setCurrentPhaseWithMetadata = useCallback((phase: 'input' | 'output') => {
        setCurrentPhase(phase);
        // Sync ref immediately (replaces useEffect)
        phaseRef.current = phase;
        // Push metadata after state update
        setTimeout(() => pushMetadataToTransport(), 0);
    }, [pushMetadataToTransport]);


    // call this *whenever* you want to start playback
    const safePlay = useCallback(async (reason: string) => {
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
            if (indexRef.current >= 0) {
                handleAudioError(phaseRef.current);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const atomicAdvance = useCallback(async (delta: 1 | -1) => {
        // Clear any existing timers
        clearAllTimeouts();

        // Reset progress bar state
        setShowProgressBar(false);
        setProgressDuration(0);
        setProgressDelay(0);

        if (!phrases.length) return;

        const wasPlaying = !pausedRef.current; // snapshot before we move
        // Compute next cursor
        const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
        const enableRecall = presentationConfig.enableInputPlayback;

        let targetIndex = indexRef.current;
        const curPhase = phaseRef.current;
        let targetPhase: 'input' | 'output' = curPhase;

        // Track if we're about to complete the list by clicking next on the final phrase
        let isCompletingList = false;

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
                        // Check if we're on the last phrase - if so, list is completed
                        if (targetIndex === phrases.length - 1) {
                            isCompletingList = true;
                        } else {
                            targetIndex = (targetIndex + 1) % phrases.length;
                            targetPhase = 'output';
                        }
                    }
                } else {
                    // Shadow -> next phrase Recall
                    // Check if we're on the last phrase - if so, list is completed
                    if (targetIndex === phrases.length - 1) {
                        isCompletingList = true;
                    } else {
                        targetIndex = (targetIndex + 1) % phrases.length;
                        targetPhase = enableRecall ? 'output' : 'input'; // Start at recall or shadow of next phrase
                    }
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
                        // Check if we're on the last phrase - if so, list is completed
                        if (targetIndex === phrases.length - 1) {
                            isCompletingList = true;
                        } else {
                            targetIndex = (targetIndex + 1) % phrases.length;
                            targetPhase = 'input';
                        }
                    }
                } else {
                    // Shadow -> next phrase Recall OR Shadow
                    // Check if we're on the last phrase - if so, list is completed
                    if (targetIndex === phrases.length - 1) {
                        isCompletingList = true;
                    } else {
                        targetIndex = (targetIndex + 1) % phrases.length;
                        targetPhase = enableRecall ? 'input' : 'output';
                    }
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

        // apply rate
        const speed =
            targetPhase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);

        // Handle list completion
        if (isCompletingList) {
            if (presentationConfig.enableLoop) {
                // Loop mode: show snackbar, track completion, and wrap to beginning
                const currentPhrase = phrases[indexRef.current];

                // Create callback to show full stats popup (pauses if playing)
                const handleViewStats = () => {
                    // Inline pause logic (can't reference handlePause due to definition order)
                    const el = audioRef.current;
                    if (el) {
                        ++playSeqRef.current;
                        clearAllTimeouts();
                        setShowProgressBar(false);
                        el.pause();
                        setPaused(true);
                        setMSState('paused');
                    }
                    // Show the full completion popup with inline go-again callback
                    // (similar to goAgainCallback in non-loop case)
                    const goAgainCallback = async () => {
                        clearAllTimeouts();
                        setCurrentPhraseIndexWithMetadata(prev => prev < 0 ? prev - 1 : -1);
                        const startPhase = presentationConfig.enableInputPlayback
                            ? getRecallPhase()
                            : getShadowPhase();
                        setCurrentPhaseWithMetadata(startPhase);
                        if (startPhase === 'input' && audioRef.current && phrases[0]?.inputAudio?.audioUrl) {
                            setSrcSafely(phrases[0].inputAudio?.audioUrl || '');
                        } else if (startPhase === 'output' && audioRef.current && phrases[0]?.outputAudio?.audioUrl) {
                            setSrcSafely(phrases[0].outputAudio?.audioUrl || '');
                        }
                        setShowTitle(true);
                        setPaused(false);
                        const timeoutId1 = window.setTimeout(() => setShowTitle(false), presentationConfig.postProcessDelay + BLEED_START_DELAY - 1000);
                        timeoutIds.current.push(timeoutId1);
                        const timeoutId = window.setTimeout(() => setCurrentPhraseIndexWithMetadata(0), presentationConfig.postProcessDelay + BLEED_START_DELAY);
                        timeoutIds.current.push(timeoutId);
                    };
                    showStatsUpdate(true, 'listened', true, goAgainCallback, onNavigateToNextInPath);
                };

                showListCompletionSnackbar({ eventType: 'listened', onViewStats: handleViewStats });

                // Mark template/collection as completed
                if (onCompleted) {
                    onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                }

                // Wrap to beginning
                targetIndex = 0;
                // Set phase based on playback order and enableInputPlayback
                targetPhase = presentationConfig.enableInputPlayback
                    ? getRecallPhase()
                    : getShadowPhase();
            } else {
                // Non-loop mode: Show completion popup (persistent, requires user interaction)
                // Use the appropriate event type based on whether we were playing or not
                const completionEventType = wasPlaying ? 'listened' : 'viewed';

                // Pass a callback that will be resolved later when user clicks "Go Again"
                // We can't reference handleReplay here due to dependency ordering
                const goAgainCallback = async () => {
                    clearAllTimeouts();
                    setCurrentPhraseIndexWithMetadata(prev => prev < 0 ? prev - 1 : -1);

                    // Determine starting phase based on playback order and enableInputPlayback
                    const startPhase = presentationConfig.enableInputPlayback
                        ? getRecallPhase()  // Start with recall phase (first audio)
                        : getShadowPhase(); // Skip recall phase, start with shadow phase (second audio)
                    setCurrentPhaseWithMetadata(startPhase);

                    if (startPhase === 'input' && audioRef.current && phrases[0]?.inputAudio?.audioUrl) {
                        setSrcSafely(phrases[0].inputAudio?.audioUrl || '');
                        const speed = presentationConfig.inputPlaybackSpeed || 1.0;
                        if (speed !== 1.0 && audioRef.current) {
                            audioRef.current.playbackRate = speed;
                        }
                    } else if (startPhase === 'output' && audioRef.current && phrases[0]?.outputAudio?.audioUrl) {
                        setSrcSafely(phrases[0].outputAudio?.audioUrl || '');
                        const speed = presentationConfig.outputPlaybackSpeed || 1.0;
                        if (speed !== 1.0 && audioRef.current) {
                            audioRef.current.playbackRate = speed;
                        }
                    }

                    setShowTitle(true);
                    // Respect the user's autoplay preference - if they were playing, resume playing
                    setPaused(!wasPlaying);

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

                showStatsUpdate(true, completionEventType, true, goAgainCallback, onNavigateToNextInPath);

                // Mark as completed in progress tracking
                const currentPhrase = phrases[indexRef.current];
                if (onCompleted) {
                    onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                }

                // Don't advance to next phrase, stay paused
                setPaused(true);
                setMSState('paused');
                return;
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

        if (audioRef.current) audioRef.current.playbackRate = speed;

        // Track navigation events (stats tracking now handled in setCurrentPhraseIndexWithMetadata)
        if (targetIndex >= 0 && phrases[targetIndex] && targetPhase === 'output') {
            // Track skip navigation event
            const eventType = delta === 1 ? 'next' : 'previous';
            trackPlaybackEvent(eventType, `${collectionId || 'unknown'}-${targetIndex}`, targetPhase, targetIndex, speed);
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
    }, [phrases, presentationConfig.enableOutputBeforeInput, presentationConfig.enableInputPlayback, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.enableLoop, presentationConfig.postProcessDelay, setCurrentPhraseIndexWithMetadata, setCurrentPhaseWithMetadata, collectionId, safePlay, showStatsUpdate, user?.uid, getRecallPhase, getShadowPhase, onCompleted, onNavigateToNextInPath]);

    // Swipe-specific advance: skips phase logic, just moves to next/previous phrase
    const swipeAdvance = useCallback(async (delta: 1 | -1) => {
        // Shared setup
        clearAllTimeouts();
        setShowProgressBar(false);
        setProgressDuration(0);
        setProgressDelay(0);

        if (!phrases.length) return;

        const wasPlaying = !pausedRef.current;
        const targetIndex = indexRef.current + delta;

        // Handle boundaries
        if (targetIndex < 0) {
            if (presentationConfig.enableLoop) {
                // Wrap to last phrase
                const newIndex = phrases.length - 1;
                const startPhase = presentationConfig.enableInputPlayback ? getRecallPhase() : getShadowPhase();
                setCurrentPhraseIndexWithMetadata(newIndex);
                setCurrentPhaseWithMetadata(startPhase);
                const url = startPhase === 'input'
                    ? (phrases[newIndex].inputAudio?.audioUrl || '')
                    : (phrases[newIndex].outputAudio?.audioUrl || '');
                setSrcSafely(url);
                const speed = startPhase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                if (audioRef.current) audioRef.current.playbackRate = speed;
                if (wasPlaying) {
                    setPaused(false);
                    setMSState('playing');
                    await safePlay('swipeAdvance');
                }
            }
            return;
        }

        if (targetIndex >= phrases.length) {
            // Completing the list
            if (presentationConfig.enableLoop) {
                // Show snackbar and wrap to beginning
                const currentPhrase = phrases[indexRef.current];

                const handleViewStats = () => {
                    const el = audioRef.current;
                    if (el) {
                        ++playSeqRef.current;
                        clearAllTimeouts();
                        setShowProgressBar(false);
                        el.pause();
                        setPaused(true);
                        setMSState('paused');
                    }
                    const goAgainCallback = async () => {
                        clearAllTimeouts();
                        setCurrentPhraseIndexWithMetadata(prev => prev < 0 ? prev - 1 : -1);
                        const startPhase = presentationConfig.enableInputPlayback ? getRecallPhase() : getShadowPhase();
                        setCurrentPhaseWithMetadata(startPhase);
                        if (startPhase === 'input' && audioRef.current && phrases[0]?.inputAudio?.audioUrl) {
                            setSrcSafely(phrases[0].inputAudio?.audioUrl || '');
                        } else if (startPhase === 'output' && audioRef.current && phrases[0]?.outputAudio?.audioUrl) {
                            setSrcSafely(phrases[0].outputAudio?.audioUrl || '');
                        }
                        setShowTitle(true);
                        setPaused(false);
                        const timeoutId1 = window.setTimeout(() => setShowTitle(false), presentationConfig.postProcessDelay + BLEED_START_DELAY - 1000);
                        timeoutIds.current.push(timeoutId1);
                        const timeoutId = window.setTimeout(() => setCurrentPhraseIndexWithMetadata(0), presentationConfig.postProcessDelay + BLEED_START_DELAY);
                        timeoutIds.current.push(timeoutId);
                    };
                    showStatsUpdate(true, 'listened', true, goAgainCallback, onNavigateToNextInPath);
                };

                showListCompletionSnackbar({ eventType: 'listened', onViewStats: handleViewStats });

                if (onCompleted) {
                    onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                }

                // Wrap to beginning
                const startPhase = presentationConfig.enableInputPlayback ? getRecallPhase() : getShadowPhase();
                setCurrentPhraseIndexWithMetadata(0);
                setCurrentPhaseWithMetadata(startPhase);
                const url = startPhase === 'input'
                    ? (phrases[0].inputAudio?.audioUrl || '')
                    : (phrases[0].outputAudio?.audioUrl || '');
                setSrcSafely(url);
                const speed = startPhase === 'input'
                    ? (presentationConfig.inputPlaybackSpeed || 1.0)
                    : (presentationConfig.outputPlaybackSpeed || 1.0);
                if (audioRef.current) audioRef.current.playbackRate = speed;
                if (wasPlaying) {
                    setPaused(false);
                    setMSState('playing');
                    await safePlay('swipeAdvance');
                }
            } else {
                // Non-loop: show completion popup
                const completionEventType = wasPlaying ? 'listened' : 'viewed';
                const goAgainCallback = async () => {
                    clearAllTimeouts();
                    setCurrentPhraseIndexWithMetadata(prev => prev < 0 ? prev - 1 : -1);
                    const startPhase = presentationConfig.enableInputPlayback ? getRecallPhase() : getShadowPhase();
                    setCurrentPhaseWithMetadata(startPhase);
                    if (startPhase === 'input' && audioRef.current && phrases[0]?.inputAudio?.audioUrl) {
                        setSrcSafely(phrases[0].inputAudio?.audioUrl || '');
                        const speed = presentationConfig.inputPlaybackSpeed || 1.0;
                        if (audioRef.current) audioRef.current.playbackRate = speed;
                    } else if (startPhase === 'output' && audioRef.current && phrases[0]?.outputAudio?.audioUrl) {
                        setSrcSafely(phrases[0].outputAudio?.audioUrl || '');
                        const speed = presentationConfig.outputPlaybackSpeed || 1.0;
                        if (audioRef.current) audioRef.current.playbackRate = speed;
                    }
                    setShowTitle(true);
                    setPaused(!wasPlaying);
                    const timeoutId1 = window.setTimeout(() => setShowTitle(false), presentationConfig.postProcessDelay + BLEED_START_DELAY - 1000);
                    timeoutIds.current.push(timeoutId1);
                    const timeoutId = window.setTimeout(() => setCurrentPhraseIndexWithMetadata(0), presentationConfig.postProcessDelay + BLEED_START_DELAY);
                    timeoutIds.current.push(timeoutId);
                };

                showStatsUpdate(true, completionEventType, true, goAgainCallback, onNavigateToNextInPath);

                const currentPhrase = phrases[indexRef.current];
                if (onCompleted) {
                    onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                }

                setPaused(true);
                setMSState('paused');
            }
            return;
        }

        // Normal case: move to target phrase
        const startPhase = presentationConfig.enableInputPlayback ? getRecallPhase() : getShadowPhase();
        setCurrentPhraseIndexWithMetadata(targetIndex);
        setCurrentPhaseWithMetadata(startPhase);

        const url = startPhase === 'input'
            ? (phrases[targetIndex].inputAudio?.audioUrl || '')
            : (phrases[targetIndex].outputAudio?.audioUrl || '');
        setSrcSafely(url);

        const speed = startPhase === 'input'
            ? (presentationConfig.inputPlaybackSpeed || 1.0)
            : (presentationConfig.outputPlaybackSpeed || 1.0);
        if (audioRef.current) audioRef.current.playbackRate = speed;

        if (wasPlaying) {
            setPaused(false);
            setMSState('playing');
            await safePlay('swipeAdvance');
        } else {
            setPaused(true);
            setMSState('paused');
        }
    }, [phrases, presentationConfig.enableInputPlayback, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.enableLoop, presentationConfig.postProcessDelay, setCurrentPhraseIndexWithMetadata, setCurrentPhaseWithMetadata, collectionId, safePlay, showStatsUpdate, user?.uid, getRecallPhase, getShadowPhase, onCompleted, onNavigateToNextInPath]);

    const handleAudioError = useCallback(async (phase: 'input' | 'output', autoPlay?: boolean) => {
        const currentIndex = indexRef.current;
        if (!audioRef.current || currentIndex < 0 || !setPhrases) return;
        const phrase = phrases[currentIndex];
        if (!phrase) return;
        try {
            const text = phase === 'input' ? phrase.input : phrase.translated;
            const language = phase === 'input' ? phrase.inputLang : phrase.targetLang;
            const voice = phase === 'input' ? phrase.inputVoice : phrase.targetVoice;
            if (!text || !language || !voice) return;
            const { audioUrl, duration } = await generateAudio(text, language, voice);

            // Update the phrase with new audio
            const newPhrases = [...phrases];
            newPhrases[currentIndex] = {
                ...newPhrases[currentIndex],
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
    }, [phrases, setPhrases, collectionId, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, safePlay]);

    // Playback control handlers
    const handlePause = useCallback((source: PauseSource = 'local') => {
        const el = audioRef.current;
        if (!el) return;

        // cancel any current play intent so a pending play() won't re-start
        ++playSeqRef.current;

        clearAllTimeouts();
        setShowProgressBar(false);
        el.pause();
        setPaused(true);
        setMSState('paused');
        showStatsUpdate(false);

        if (source === 'external') {
            // 💥 nuke any buffered/decoded audio so unlock can't leak sound
            el.src = '';
            el.load();
            // resets the element (fires 'emptied')
        }

        const currentIndex = indexRef.current;
        const currentPhaseValue = phaseRef.current;
        if (currentIndex >= 0 && phrases[currentIndex]) {
            const speed = currentPhaseValue === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            trackPlaybackEvent('pause', `${collectionId || 'unknown'}-${currentIndex}`, currentPhaseValue, currentIndex, speed);
        }
    }, [showStatsUpdate, phrases, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, collectionId]);

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


    const handleReplay = useCallback(async () => {
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
    }, [setCurrentPhraseIndexWithMetadata, presentationConfig.enableInputPlayback, getRecallPhase, getShadowPhase, setCurrentPhaseWithMetadata, phrases, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.postProcessDelay, collectionId]);


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

        // Ensure src set and matches current phase
        // Even more relevant now we nuke in external on pause
        const expectedUrl = phrases[idx]?.[phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl ?? '';
        if (!el.src || el.src !== expectedUrl) {
            setSrcSafely(expectedUrl);
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
    }, [isRecallPhase, presentationConfig.enableInputPlayback, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, phrases, safePlay, handleReplay, getShadowPhase, setCurrentPhaseWithMetadata, collectionId]);





    // Autoplay effect - triggers play when autoplay prop is true and component is ready
    const autoplayTriggeredRef = useRef(false);
    useEffect(() => {
        if (autoplay && phrases.length > 0 && !autoplayTriggeredRef.current) {
            autoplayTriggeredRef.current = true;
            // Small delay to ensure audio element is ready
            setTimeout(() => {
                handleReplay();
            }, 300);
        }
    }, [autoplay, phrases.length, handleReplay]);

    // Track autoplay active state for milestone popup suppression
    useEffect(() => {
        // Autoplay is considered active when autoplay prop is true and playback is not paused
        setIsAutoplayActive(autoplay && !paused);
    }, [autoplay, paused, setIsAutoplayActive]);


    const handlePlayPhrase = (index: number, phase: 'input' | 'output') => {
        clearAllTimeouts();
        if (audioRef.current) {
            const isPaused = paused;
            const audioToPlay = phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '';
            setSrcSafely(audioToPlay);
            // Set playback speed based on phase
            const speed = phase === 'input'
                ? (presentationConfig.inputPlaybackSpeed || 1.0)
                : (presentationConfig.outputPlaybackSpeed || 1.0);
            if (speed !== 1.0) {
                audioRef.current.playbackRate = speed;
            }
            // Skip "viewed" tracking since we're about to play audio (will track "listened" when audio ends)
            setCurrentPhraseIndexWithMetadata(index, true);

            // If input playback is disabled and user clicked input audio, keep phase as output
            // but still play the input audio and update the index
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

    // Wrapper to play specific phrase phase (for click-to-play in fullscreen)
    const handlePlayPhrasePhase = useCallback((phase: 'input' | 'output') => {
        handlePlayPhrase(currentPhraseIndex, phase);
    }, [handlePlayPhrase, currentPhraseIndex]);

    // Removed large commented handlePrevious function - replaced with atomicAdvance

    // Removed large commented handleNext function - replaced with atomicAdvance

    // Removed attachAudioGuards - redundant with WebMediaSessionTransport handling

    // Initialize transport callback ref
    const initTransport = useCallback((el: HTMLAudioElement | null) => {
        audioRef.current = el;
        if (!el || transportRef.current) return;

        // Use external transport if provided, otherwise create new one
        const transport = externalTransport || new WebMediaSessionTransport(el);
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
    }, [handlePlay, handlePause, externalTransport, atomicAdvance]);

    const handleAudioPlay = useCallback(() => {
        // Record which phrase/phase is currently playing for automatic listen tracking
        playingPhraseRef.current = {
            index: indexRef.current,
            phase: phaseRef.current
        };
        setIsPlayingAudio(true);
    }, []);

    const handleAudioEnded = () => {
        console.log('handleAudioEnded - playingPhraseRef:', playingPhraseRef.current);
        // Automatically track listen when audio ends
        // Do this BEFORE checking paused state, because audio can play "in isolation" while paused
        if (playingPhraseRef.current !== null) {
            console.log('Calling trackListenIfNeeded with index:', playingPhraseRef.current.index);
            trackListenIfNeeded(playingPhraseRef.current.index);
        } else {
            console.log('playingPhraseRef is null, not tracking listen');
        }

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

        // If paused, don't trigger automatic advancement to next phrase
        if (paused) return;

        const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
        const inputDuration = presentationConfig.enableInputDurationDelay ? (audioRef.current?.duration || 1) * 1000 : 0;
        const outputDuration = presentationConfig.enableOutputDurationDelay ? (audioRef.current?.duration || 1) * 1000 * DELAY_AFTER_INPUT_PHRASES_MULTIPLIER : 0;

        // Set progress bar for recall (input duration delay)
        setShowProgressBar(true);
        const totalDelayMs = playOutputBeforeInput ? outputDuration + 1000 : inputDuration + presentationConfig.delayBetweenPhrases;
        setProgressDuration(totalDelayMs);
        setProgressDelay(0);

        if (currentPhase === 'input') {
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
                            // If looping is enabled, show snackbar and restart from beginning
                            const handleViewStats = () => {
                                handlePause();
                                showStatsUpdate(true, 'listened', true, handleReplay, onNavigateToNextInPath);
                            };
                            showListCompletionSnackbar({ eventType: 'listened', onViewStats: handleViewStats });
                            // Mark template/collection as completed
                            if (onCompleted) {
                                onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                            }
                            setCurrentPhraseIndexWithMetadata(0);
                        } else {
                            showStatsUpdate(true, 'listened', true, handleReplay, onNavigateToNextInPath)
                            setPaused(true);
                            // Mark template/collection as completed
                            if (onCompleted) {
                                onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                            }
                        }
                    }
                }
            }, totalDelayMs);
            timeoutIds.current.push(timeoutId);
        } else {
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
                                // If looping is enabled, show snackbar and restart from beginning
                                const handleViewStats = () => {
                                    handlePause();
                                    showStatsUpdate(true, 'listened', true, handleReplay, onNavigateToNextInPath);
                                };
                                showListCompletionSnackbar({ eventType: 'listened', onViewStats: handleViewStats });
                                // Mark template/collection as completed
                                if (onCompleted) {
                                    onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                                }
                                setCurrentPhraseIndexWithMetadata(0);
                                setCurrentPhaseWithMetadata('output');
                            } else {
                                showStatsUpdate(true, 'listened', true, handleReplay, onNavigateToNextInPath)
                                setPaused(true);
                                // Mark template/collection as completed
                                if (onCompleted) {
                                    onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                                }
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
                            // If looping is enabled, show snackbar and restart from beginning
                            const handleViewStats = () => {
                                handlePause();
                                showStatsUpdate(true, 'listened', true, handleReplay, onNavigateToNextInPath);
                            };
                            showListCompletionSnackbar({ eventType: 'listened', onViewStats: handleViewStats });
                            // Mark template/collection as completed
                            if (onCompleted) {
                                onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                            }
                            setCurrentPhraseIndexWithMetadata(0);
                            // Check if input playback is enabled
                            if (presentationConfig.enableInputPlayback) {
                                setCurrentPhaseWithMetadata('input');
                            } else {
                                setCurrentPhaseWithMetadata('output');
                            }
                        } else {
                            showStatsUpdate(true, 'listened', true, handleReplay, onNavigateToNextInPath)
                            setPaused(true);
                            // Mark template/collection as completed
                            if (onCompleted) {
                                onCompleted(user?.uid || '', collectionId || '', currentPhrase?.inputLang || '', currentPhrase?.targetLang || '');
                            }
                        }
                    }
                }
            }, totalOutputDelayMs);
            timeoutIds.current.push(timeoutId);
        }
    };


    // Preload next/prev clips for smoother continuous skip
    useEffect(() => {
        if (phrases.length === 0) return;

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
                // Always update the source to match the current phase
                // This ensures that if the user clicked input audio while input playback is disabled,
                // the source will be updated to output audio for autoplay
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
    }, [currentPhraseIndex, currentPhase, paused, currentInputAudioUrl, currentOutputAudioUrl, presentationConfig.inputPlaybackSpeed, presentationConfig.outputPlaybackSpeed, presentationConfig.enableInputPlayback, presentationConfig.enableOutputBeforeInput, getShadowPhase, handleAudioError, isRecallPhase, safePlay, setCurrentPhaseWithMetadata]);

    // Handle presentation config changes that affect current phase
    useEffect(() => {
        // When recall playback is disabled, ensure we're not on the recall phase
        if (!presentationConfig.enableInputPlayback && isRecallPhase(currentPhase)) {
            setCurrentPhaseWithMetadata(getShadowPhase());
            return;
        }

        // When recall playback is enabled, we might want to reset to the appropriate starting phase
        // based on enableOutputBeforeInput (optional - could be removed if not desired)
        // For now, we'll leave the phase as-is when enableInputPlayback is turned ON
        // to avoid disrupting the user's current state
    }, [presentationConfig.enableInputPlayback, presentationConfig.enableOutputBeforeInput, currentPhase, setCurrentPhaseWithMetadata, isRecallPhase, getShadowPhase]);

    // Update phase when playback order settings change (stop playback but preserve position)
    const prevPlaybackSettingsRef = useRef<{ enableOutputBeforeInput?: boolean; enableInputPlayback?: boolean } | null>(null);
    useEffect(() => {
        const prev = prevPlaybackSettingsRef.current;
        const playbackOrderChanged = prev &&
            (prev.enableOutputBeforeInput !== presentationConfig.enableOutputBeforeInput ||
                prev.enableInputPlayback !== presentationConfig.enableInputPlayback);

        if (playbackOrderChanged) {
            handleStop();
            const initialPhase = presentationConfig.enableOutputBeforeInput
                ? 'output'
                : (presentationConfig.enableInputPlayback ? 'input' : 'output');
            setCurrentPhaseWithMetadata(initialPhase);
        }

        prevPlaybackSettingsRef.current = {
            enableOutputBeforeInput: presentationConfig.enableOutputBeforeInput,
            enableInputPlayback: presentationConfig.enableInputPlayback,
        };
    }, [presentationConfig.enableOutputBeforeInput, presentationConfig.enableInputPlayback, setCurrentPhaseWithMetadata]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isEditableTarget = target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
                || target instanceof HTMLSelectElement
                || (target?.isContentEditable ?? false);
            if (isEditableTarget) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    atomicAdvance(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    atomicAdvance(1);
                    break;
                case 'Escape':
                    if (fullscreen) {
                        e.preventDefault();
                        setFullscreen(false);
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [fullscreen, atomicAdvance, setFullscreen]);

    if (methodsRef) methodsRef.current = {
        handleStop,
        handlePause,
        handlePlay,
        handleReplay,
        handlePlayPhrase,
        setCurrentPhraseIndex: setCurrentPhraseIndexWithMetadata,
        setCurrentPhase: setCurrentPhaseWithMetadata,
        getCurrentPhraseIndex: () => currentPhraseIndex,
        getCurrentPhase: () => currentPhase
    };

    const presentationView = <PresentationView
        currentPhrase={phrases[currentPhraseIndex]?.input || ''}
        currentTranslated={phrases[currentPhraseIndex]?.translated || ''}
        currentPhase={currentPhase}
        inputLang={phrases[currentPhraseIndex]?.inputLang}
        targetLang={phrases[currentPhraseIndex]?.targetLang}
        inputVoice={phrases[currentPhraseIndex]?.inputVoice}
        targetVoice={phrases[currentPhraseIndex]?.targetVoice}
        fullScreen={fullscreen}
        setFullscreen={setFullscreen}
        bgImage={presentationConfig.bgImage}
        containerBg={presentationConfig.containerBg}
        // TODO - deally scroll and swipe should both work on mobile all the time, regardless of settings
        verticalScroll={isMobile && presentationConfig.showAllPhrases && !presentationConfig.enableInputPlayback}
        enableSwipe={isMobile}
        // Can maybe introduce but might replace with text colour
        // textBg={presentationConfig.textBg}
        backgroundOverlayOpacity={presentationConfig.backgroundOverlayOpacity}
        textColor={presentationConfig.textColor}
        enableSnow={presentationConfig.enableSnow}
        enableCherryBlossom={presentationConfig.enableCherryBlossom}
        enableLeaves={presentationConfig.enableLeaves}
        enableAutumnLeaves={presentationConfig.enableAutumnLeaves}
        enableOrtonEffect={presentationConfig.enableOrtonEffect}
        enableParticles={presentationConfig.enableParticles}
        particleRotation={presentationConfig.particleRotation}
        enableSteam={presentationConfig.enableSteam}
        enableDust={presentationConfig.enableDust}
        particleColor={presentationConfig.particleColor}
        particleSpeed={presentationConfig.particleSpeed}
        romanizedOutput={phrases[currentPhraseIndex]?.romanized}
        title={showTitle ? (collectionName || configName) : undefined}
        showAllPhrases={presentationConfig.showAllPhrases}
        enableOutputBeforeInput={presentationConfig.enableOutputBeforeInput}
        enableInputPlayback={presentationConfig.enableInputPlayback}
        showProgressBar={showProgressBar}
        progressDuration={progressDuration}
        progressDelay={progressDelay}
        onPrevious={() => atomicAdvance(-1)}
        onNext={() => atomicAdvance(+1)}
        // Only use swipeAdvance (skip phase logic) when showAllPhrases is on OR input playback is off
        // When showAllPhrases is off AND input playback is on, swipe should cycle through phases
        onSwipePrevious={(presentationConfig.showAllPhrases || !presentationConfig.enableInputPlayback) ? () => swipeAdvance(-1) : undefined}
        onSwipeNext={(presentationConfig.showAllPhrases || !presentationConfig.enableInputPlayback) ? () => swipeAdvance(+1) : undefined}
        canGoBack={
            presentationConfig.enableLoop ||
            currentPhraseIndex > 0 ||
            (!presentationConfig.showAllPhrases && presentationConfig.enableInputPlayback && !isRecallPhase(currentPhase))
        }
        canGoForward={
            presentationConfig.enableLoop ||
            currentPhraseIndex < phrases.length - 1 ||
            (!presentationConfig.showAllPhrases && presentationConfig.enableInputPlayback && isRecallPhase(currentPhase))
        }
        currentPhraseIndex={currentPhraseIndex}
        totalPhrases={phrases.length}
        isPlayingAudio={isPlayingAudio}
        paused={paused}
        onPause={handlePause}
        onPlay={handlePlay}
        onPlayPhrase={handlePlayPhrasePhase}
        onSettingsOpen={() => setSettingsOpen(true)}
        onLikeOpen={() => {
            const phrase = phrases[currentPhraseIndex];
            if (!phrase) return;
            setLikedPhrase(phrase);
            setLikeDialogOpen(true);
        }}
        nextPhrase={(() => {
            if (presentationConfig.showAllPhrases) {
                // Show all phrases mode: next is the next phrase
                return phrases[currentPhraseIndex + 1]?.input || ' ';
            } else {
                // Non-showAllPhrases mode: Cards all use currentPhase to decide what to display
                // If currentPhase is 'input', all cards will display their 'phrase' prop
                // If currentPhase is 'output', all cards will display their 'translated' prop
                // The next card depends on both currentPhase AND enableOutputBeforeInput
                // When enableInputPlayback is true, never pass input phrases (or output if enableOutputBeforeInput)

                if (presentationConfig.enableOutputBeforeInput) {
                    // Output-first mode: output -> input -> next output -> next input
                    // When enableInputPlayback is true, skip output phrases (not input)
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'output') {
                        // Next is same phrase's input
                        // When currentPhase is 'output', cards display 'translated' prop
                        // If enableInputPlayback, skip output - next should be current phrase's input
                        // If !enableInputPlayback, skip input entirely - next should be next phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to next output
                        return phrases[currentPhraseIndex + 1]?.translated || ' ';
                    } else {
                        // currentPhase === 'input'
                        // Next is next phrase's output
                        // When currentPhase is 'input', cards display 'phrase' prop
                        // If enableInputPlayback, normal flow - next should be next phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex + 1]?.translated || ' ';
                        }
                        // !enableInputPlayback: this case shouldn't happen (input phase skipped)
                        return phrases[currentPhraseIndex + 1]?.translated || ' ';
                    }
                } else {
                    // Input-first mode: input -> output -> next input -> next output
                    // When enableInputPlayback is true, normal flow: input -> output -> next input -> next output
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'input') {
                        // All cards will display their 'phrase' prop
                        // Next card should show current phrase's output (translated)
                        return phrases[currentPhraseIndex]?.translated || ' ';
                    } else {
                        // All cards will display their 'translated' prop
                        // Next card should show next phrase's input
                        // If enableInputPlayback, normal flow - next should be next phrase's input
                        // If !enableInputPlayback, skip input entirely - next should be next phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex + 1]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to next output
                        return phrases[currentPhraseIndex + 1]?.translated || ' ';
                    }
                }
            }
        })()}
        nextTranslated={(() => {
            if (presentationConfig.showAllPhrases) {
                // Show all phrases mode: next is the next phrase
                return phrases[currentPhraseIndex + 1]?.translated || ' ';
            } else {
                // Non-showAllPhrases mode: put content in the field that will be displayed
                // When enableInputPlayback is true, never pass input phrases (or output if enableOutputBeforeInput)
                if (presentationConfig.enableOutputBeforeInput) {
                    // Output-first mode
                    // When enableInputPlayback is true, skip output phrases (not input)
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'output') {
                        // Cards display 'translated' prop
                        // If enableInputPlayback, next shows current phrase's input
                        // If !enableInputPlayback, skip input - next shows next phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to next output
                        return phrases[currentPhraseIndex + 1]?.translated || ' ';
                    } else {
                        // currentPhase === 'input'
                        // Cards display 'phrase' prop
                        // If enableInputPlayback, normal flow - next shows next phrase's output (in phrase prop since phase is input)
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex + 1]?.translated || ' ';
                        }
                        // !enableInputPlayback: this case shouldn't happen (input phase skipped)
                        return phrases[currentPhraseIndex + 1]?.translated || ' ';
                    }
                } else {
                    // Input-first mode
                    // When enableInputPlayback is true, normal flow: input -> output -> next input -> next output
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'input') {
                        // All cards will display their 'phrase' prop, so 'translated' won't be used
                        // But we still need to populate it for when phase changes
                        return phrases[currentPhraseIndex]?.translated || ' ';
                    } else {
                        // All cards will display their 'translated' prop
                        // If enableInputPlayback, normal flow - next shows next phrase's input (in translated prop since phase is output)
                        // If !enableInputPlayback, skip input entirely - next shows next phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            // Next card will show next phrase's input, but since currentPhase is 'output', 
                            // it will display the 'translated' prop, so we put the input there
                            return phrases[currentPhraseIndex + 1]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to next output
                        return phrases[currentPhraseIndex + 1]?.translated || ' ';
                    }
                }
            }
        })()}
        nextRomanized={(() => {
            if (presentationConfig.showAllPhrases) {
                return phrases[currentPhraseIndex + 1]?.romanized || ' ';
            } else {
                // Romanized only shows with translated (output phase)
                if (presentationConfig.enableOutputBeforeInput) {
                    // Output-first mode
                    if (currentPhase === 'output') {
                        // If enableInputPlayback, next shows input, no romanized
                        // If !enableInputPlayback, next shows next phrase's output, include romanized
                        if (presentationConfig.enableInputPlayback) {
                            return ' ';
                        }
                        return phrases[currentPhraseIndex + 1]?.romanized || ' ';
                    } else {
                        // currentPhase === 'input'
                        // Next shows next phrase's output, include romanized
                        return phrases[currentPhraseIndex + 1]?.romanized || ' ';
                    }
                } else {
                    // Input-first mode
                    if (currentPhase === 'input') {
                        // Next card shows current phrase's translated, so include romanized
                        return phrases[currentPhraseIndex]?.romanized || ' ';
                    } else {
                        // If enableInputPlayback, next shows next phrase's input, no romanized
                        // If !enableInputPlayback, next shows next phrase's output, include romanized
                        if (presentationConfig.enableInputPlayback) {
                            return ' ';
                        }
                        return phrases[currentPhraseIndex + 1]?.romanized || ' ';
                    }
                }
            }
        })()}
        previousPhrase={(() => {
            if (presentationConfig.showAllPhrases) {
                return phrases[currentPhraseIndex - 1]?.input || ' ';
            } else {
                // Non-showAllPhrases mode
                // When enableInputPlayback is true, never pass input phrases (or output if enableOutputBeforeInput)
                if (presentationConfig.enableOutputBeforeInput) {
                    // Output-first mode: output -> input -> next output
                    // When enableInputPlayback is true, skip output phrases (not input)
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'output') {
                        // Previous is prev phrase's input
                        // Cards display 'translated' when currentPhase is 'output'
                        // If enableInputPlayback, skip output - previous should be prev phrase's input
                        // If !enableInputPlayback, skip input - previous should be prev phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex - 1]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to prev output
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    } else {
                        // currentPhase === 'input'
                        // Previous is same phrase's output
                        // Cards display 'phrase' when currentPhase is 'input'
                        // If enableInputPlayback, normal flow - previous should be current phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex]?.translated || ' ';
                        }
                        // !enableInputPlayback: this case shouldn't happen (input phase skipped)
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    }
                } else {
                    // Input-first mode
                    // When enableInputPlayback is true, normal flow: input -> output -> next input -> next output
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'input') {
                        // All cards will display their 'phrase' prop
                        // Previous card should show previous phrase's translated
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    } else {
                        // All cards will display their 'translated' prop
                        // Previous card should show current phrase's input
                        // If enableInputPlayback, normal flow - previous should be current phrase's input
                        // If !enableInputPlayback, skip input entirely - previous should be prev phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to prev output
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    }
                }
            }
        })()}
        previousTranslated={(() => {
            if (presentationConfig.showAllPhrases) {
                return phrases[currentPhraseIndex - 1]?.translated || ' ';
            } else {
                // Non-showAllPhrases mode
                // When enableInputPlayback is true, never pass input phrases (or output if enableOutputBeforeInput)
                if (presentationConfig.enableOutputBeforeInput) {
                    // Output-first mode
                    // When enableInputPlayback is true, skip output phrases (not input)
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'output') {
                        // Cards display 'translated' prop
                        // If enableInputPlayback, skip output - previous shows prev phrase's input
                        // If !enableInputPlayback, skip input - previous shows prev phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex - 1]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to prev output
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    } else {
                        // currentPhase === 'input'
                        // Cards display 'phrase' prop
                        // If enableInputPlayback, normal flow - previous shows current phrase's output (in phrase prop since phase is input)
                        if (presentationConfig.enableInputPlayback) {
                            return phrases[currentPhraseIndex]?.translated || ' ';
                        }
                        // !enableInputPlayback: this case shouldn't happen (input phase skipped)
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    }
                } else {
                    // Input-first mode
                    // When enableInputPlayback is true, normal flow: input -> output -> next input -> next output
                    // When enableInputPlayback is false, skip input entirely (output -> next output)
                    if (currentPhase === 'input') {
                        // All cards will display their 'phrase' prop, so 'translated' won't be used
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    } else {
                        // All cards will display their 'translated' prop
                        // If enableInputPlayback, normal flow - previous shows current phrase's input (in translated prop since phase is output)
                        // If !enableInputPlayback, skip input entirely - previous shows prev phrase's output
                        if (presentationConfig.enableInputPlayback) {
                            // Previous card will show current phrase's input, but since currentPhase is 'output',
                            // it will display the 'translated' prop, so we put the input there
                            return phrases[currentPhraseIndex]?.input || ' ';
                        }
                        // !enableInputPlayback: skip input, go directly to prev output
                        return phrases[currentPhraseIndex - 1]?.translated || ' ';
                    }
                }
            }
        })()}
        previousRomanized={(() => {
            if (presentationConfig.showAllPhrases) {
                return phrases[currentPhraseIndex - 1]?.romanized || ' ';
            } else {
                // Romanized only shows with translated (output phase)
                if (presentationConfig.enableOutputBeforeInput) {
                    // Output-first mode
                    if (currentPhase === 'output') {
                        // If enableInputPlayback, previous shows prev phrase's input, no romanized
                        // If !enableInputPlayback, previous shows prev phrase's output, include romanized
                        if (presentationConfig.enableInputPlayback) {
                            return ' ';
                        }
                        return phrases[currentPhraseIndex - 1]?.romanized || ' ';
                    } else {
                        // currentPhase === 'input'
                        // Previous shows current phrase's output, include romanized
                        return phrases[currentPhraseIndex]?.romanized || ' ';
                    }
                } else {
                    // Input-first mode
                    if (currentPhase === 'input') {
                        // Previous card shows previous phrase's translated, so include romanized
                        return phrases[currentPhraseIndex - 1]?.romanized || ' ';
                    } else {
                        // If enableInputPlayback, previous shows current phrase's input, no romanized
                        // If !enableInputPlayback, previous shows prev phrase's output, include romanized
                        if (presentationConfig.enableInputPlayback) {
                            return ' ';
                        }
                        return phrases[currentPhraseIndex - 1]?.romanized || ' ';
                    }
                }
            }
        })()}
    />

    return (
        <div className="flex-1">
            {/* All Stats Popups (unified portal) */}
            {StatsPopups}

            {/* Stats Modal */}
            {StatsModal}

            {/* Audio Element */}
            <audio
                ref={initTransport}
                onEnded={() => {
                    setIsPlayingAudio(false);
                    handleAudioEnded();
                }}
                onPlay={handleAudioPlay}
                onPause={() => setIsPlayingAudio(false)}
                controls
                hidden
                playsInline
                preload="metadata"
            />

            {/* Phrases and PresentationView Main content */}
            {hidePhrases ? presentationView : (
                <div className="flex flex-col-reverse lg:flex-col w-full lg:px-2">
                    {/* Phrases List */}
                    <div className="flex-1 lg:relative lg:order-2">
                        {showImportPhrases && collectionId && stickyHeaderContent && (
                            <div className={`sticky lg:pb-3 px-0 py-2 top-[60px] z-10 bg-background`}>
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
                                    readOnly={readOnly}
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
                        <div className="xl:flex-1 lg:top-[64px] bg-background lg:p-2 z-1 lg:order-1">
                            {presentationView}

                        </div>
                    )}
                </div>
            )}
            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                configName={configName}
                setConfigName={setConfigName}
                onSaveConfig={() => { }}
                presentationConfig={presentationConfig}
                setPresentationConfig={setPresentationConfig || (() => { })}
                handleImageUpload={handleImageUpload}
                inputLang={phrases[0]?.inputLang}
                targetLang={phrases[0]?.targetLang}
            />
            {likeDialogOpen && (
                <LikePhraseDialog
                    isOpen={likeDialogOpen}
                    onClose={() => setLikeDialogOpen(false)}
                    phrase={likedPhrase}
                />
            )}
        </div>);
} 
