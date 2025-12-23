'use client';

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Popover, Transition } from "@headlessui/react";
import { motion, AnimatePresence, useMotionValue, type MotionValue } from "framer-motion";
import { Volume2 } from "lucide-react";
import { API_BASE_URL, BLEED_START_DELAY, TITLE_DELAY } from "../consts";
import { generateAudio } from "../utils/audioUtils";

export const TITLE_ANIMATION_DURATION = 1000;

function calculateFontSize(text: string, isFullScreen: boolean, hasRomanized: boolean = false): string {
  if (!text) return isFullScreen ? '4rem' : '2rem'; // increased default size for non-fullscreen

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Base sizes adjusted - increased for non-fullscreen
  const baseSize = isFullScreen ? ((hasRomanized || isMobile) ? 50 : 70) : 32; // reduced romanized size in fullscreen
  const maxChars = isFullScreen ? 30 : 20; // threshold for max characters

  // Special handling for long words on mobile
  const longestWord = text.split(' ').reduce((max, word) => Math.max(max, word.length), 0);

  // Additional scaling for long words on mobile
  const longWordScale = isMobile && longestWord > 10 ? 0.8 : 1;

  const scale = Math.min(1, maxChars / text.length) * longWordScale;
  const fontSize = Math.max(baseSize * scale, isFullScreen ? 30 : 20); // increased minimum size for non-fullscreen

  return `${fontSize}px`;
}

// Internal component to render a phrase card
interface PhraseCardProps {
  phrase: string;
  translated: string;
  romanized?: string;
  phase: "input" | "output";
  inputLang?: string;
  targetLang?: string;
  inputVoice?: string;
  targetVoice?: string;
  fullScreen: boolean;
  isMobile: boolean;
  isMobileInline: boolean;
  isSafari: boolean;
  textColorClass: string;
  textBg?: string;
  alignPhraseTop: boolean;
  showAllPhrases?: boolean;
  enableOutputBeforeInput?: boolean;
  isPlayingAudio?: boolean;
  paused?: boolean;
  onPlayPhrase?: (phase: 'input' | 'output') => void;
  animationDirection: 'left' | 'right' | 'up' | 'down' | null;
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  offsetX?: number; // Base offset in pixels (for prev/next positioning)
  offsetY?: number; // Base offset in pixels (for prev/next positioning)
  title?: string;
  titlePropClass: string;
  verticalScroll?: boolean;
  disableAnimation?: boolean;
}

type ActiveWord = {
  tokenId: string;
  word: string;
  sentence: string;
  sourceLang: string;
  targetLang: string;
  voice?: string;
};

type TooltipState = {
  translation: string;
  translationLoading: boolean;
  audioUrl: string;
  audioLoading: boolean;
  context: string;
  contextLoading: boolean;
  error: string | null;
};

const EMPTY_TOOLTIP_STATE: TooltipState = {
  translation: "",
  translationLoading: false,
  audioUrl: "",
  audioLoading: false,
  context: "",
  contextLoading: false,
  error: null,
};

function tokenizePhrase(text: string): string[] {
  const matches = text.match(/\s+|\p{L}[\p{L}\p{M}\p{Nd}'-]*|[^\s]/gu);
  return matches ? matches : [text];
}

function isWordToken(token: string): boolean {
  return /^(\p{L}|\p{Nd})/u.test(token);
}

export function PhraseCard({
  phrase,
  translated,
  romanized,
  phase,
  inputLang,
  targetLang,
  inputVoice,
  targetVoice,
  fullScreen,
  isMobile,
  isMobileInline,
  isSafari,
  textColorClass,
  textBg,
  alignPhraseTop,
  showAllPhrases,
  enableOutputBeforeInput,
  isPlayingAudio,
  paused,
  onPlayPhrase,
  animationDirection,
  dragX,
  dragY,
  offsetX = 0,
  offsetY = 0,
  title,
  titlePropClass,
  verticalScroll = false,
  disableAnimation = false,
}: PhraseCardProps) {
  const [activeWord, setActiveWord] = useState<ActiveWord | null>(null);
  const [tooltipState, setTooltipState] = useState<TooltipState>(EMPTY_TOOLTIP_STATE);
  const cacheRef = useRef(new Map<string, { translation?: string; audioUrl?: string; context?: string }>());
  const translationRequestId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const closeTooltip = () => {
    setActiveWord(null);
    setTooltipState(EMPTY_TOOLTIP_STATE);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  useEffect(() => {
    closeTooltip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrase, translated, phase]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (activeWord) {
      document.body.dataset.wordTooltipOpen = "true";
    } else {
      delete document.body.dataset.wordTooltipOpen;
    }
  }, [activeWord]);

  const buildCacheKey = (payload: ActiveWord) =>
    `${payload.sourceLang}|${payload.targetLang}|${payload.word}|${payload.sentence}`;

  const handleWordClick = async (
    event: MouseEvent,
    payload: ActiveWord
  ) => {
    event.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const requestId = ++translationRequestId.current;
    setActiveWord(payload);

    const cacheKey = buildCacheKey(payload);
    const cached = cacheRef.current.get(cacheKey);

    setTooltipState({
      translation: cached?.translation || "",
      translationLoading: !cached?.translation,
      audioUrl: cached?.audioUrl || "",
      audioLoading: false,
      context: cached?.context || "",
      contextLoading: false,
      error: null,
    });

    if (!cached?.translation) {
      try {
        const response = await fetch(`${API_BASE_URL}/translate-word`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: payload.word,
            targetLang: payload.targetLang,
          }),
        });

        if (!response.ok) {
          throw new Error("Translate request failed");
        }

        const data = await response.json();
        const translationText = (data?.translated as string) || "";

        if (requestId !== translationRequestId.current) return;

        cacheRef.current.set(cacheKey, {
          ...cached,
          translation: translationText,
        });

        setTooltipState((prev) => ({
          ...prev,
          translation: translationText,
          translationLoading: false,
        }));
      } catch (error) {
        if (requestId !== translationRequestId.current) return;
        setTooltipState((prev) => ({
          ...prev,
          translationLoading: false,
          error: "Unable to translate right now.",
        }));
      }
    }
  };

  const handleWordDeactivate = (tokenId: string) => {
    if (activeWord?.tokenId === tokenId) {
      closeTooltip();
    }
  };

  const playAudioUrl = (url: string) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handlePlayAudio = async () => {
    if (!activeWord || tooltipState.audioLoading) return;

    if (tooltipState.audioUrl) {
      playAudioUrl(tooltipState.audioUrl);
      return;
    }

    setTooltipState((prev) => ({ ...prev, audioLoading: true }));

    try {
      const audio = await generateAudio(
        activeWord.word,
        activeWord.sourceLang,
        activeWord.voice || ""
      );

      const cacheKey = buildCacheKey(activeWord);
      const cached = cacheRef.current.get(cacheKey);
      cacheRef.current.set(cacheKey, {
        ...cached,
        translation: tooltipState.translation,
        audioUrl: audio.audioUrl,
      });

      setTooltipState((prev) => ({
        ...prev,
        audioUrl: audio.audioUrl,
        audioLoading: false,
      }));

      playAudioUrl(audio.audioUrl);
    } catch (error) {
      setTooltipState((prev) => ({
        ...prev,
        audioLoading: false,
        error: "Audio failed to load.",
      }));
    }
  };

  const handleContextRequest = async () => {
    if (!activeWord || tooltipState.contextLoading) return;
    if (tooltipState.context) return;

    setTooltipState((prev) => ({ ...prev, contextLoading: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/word-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: activeWord.word,
          sentence: activeWord.sentence,
          sourceLang: activeWord.sourceLang,
          targetLang: activeWord.targetLang,
          responseLang: activeWord.targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error("Context request failed");
      }

      const data = await response.json();
      const explanation = (data?.explanation as string) || "";

      const cacheKey = buildCacheKey(activeWord);
      const cached = cacheRef.current.get(cacheKey);
      cacheRef.current.set(cacheKey, {
        ...cached,
        translation: tooltipState.translation,
        audioUrl: tooltipState.audioUrl,
        context: explanation,
      });

      setTooltipState((prev) => ({
        ...prev,
        context: explanation,
        contextLoading: false,
      }));
    } catch (error) {
      setTooltipState((prev) => ({
        ...prev,
        contextLoading: false,
        error: "Context request failed.",
      }));
    }
  };

  const renderInteractiveText = (
    text: string,
    sentence: string,
    sourceLang?: string,
    targetLang?: string,
    voice?: string
  ) => {
    if (!text) return null;
    if (!sourceLang || !targetLang) return text.trim();

    const tokens = tokenizePhrase(text);

    return tokens.map((token, index) => {
      if (!token) return null;
      if (/^\s+$/.test(token)) return token;

      if (!isWordToken(token)) {
        return (
          <span key={`${sentence}-punct-${index}`}>{token}</span>
        );
      }

      const tokenId = `${sourceLang}-${targetLang}-${sentence}-${index}`;
      const isActive = activeWord?.tokenId === tokenId;
      const payload: ActiveWord = {
        tokenId,
        word: token,
        sentence,
        sourceLang,
        targetLang,
        voice,
      };

      return (
        <Popover key={tokenId} as="span" className="relative inline-block">
          {({ open }) => (
            <>
              <Popover.Button
                type="button"
                className="inline-flex items-baseline rounded-sm px-0 transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                onClick={(event) => handleWordClick(event, payload)}
              >
                {token}
              </Popover.Button>
              {open && isActive && (
                <Popover.Backdrop
                  className="fixed inset-0 z-[150] bg-transparent"
                  onClick={(event) => event.stopPropagation()}
                />
              )}
              <Transition
                show={open && isActive}
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-100 ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
                afterLeave={() => handleWordDeactivate(tokenId)}
              >
                <Popover.Panel
                  portal
                  anchor={{
                    to: "top",
                    gap: 8,
                    padding: 12,
                  }}
                  className="pointer-events-auto z-[200] w-60 rounded-xl border border-slate-200/80 bg-white/90 p-3 text-left text-slate-900 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/90 dark:text-slate-100"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {payload.word}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tooltipState.translationLoading
                      ? "Translating..."
                      : tooltipState.translation || "Unavailable"}
                  </div>
                  {tooltipState.error && (
                    <div className="mt-1 text-xs text-rose-500 dark:text-rose-400">
                      {tooltipState.error}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePlayAudio();
                      }}
                      disabled={!tooltipState.translation || tooltipState.audioLoading}
                      aria-label="Play translation audio"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-slate-100"
                    >
                      {tooltipState.audioLoading ? (
                        <span className="text-[10px]">...</span>
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleContextRequest();
                      }}
                      disabled={tooltipState.contextLoading}
                      className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-slate-100"
                    >
                      {tooltipState.contextLoading ? "Asking..." : "Ask"}
                    </button>
                  </div>
                  {(tooltipState.context || tooltipState.contextLoading) && (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      {tooltipState.contextLoading
                        ? "Fetching context..."
                        : tooltipState.context}
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      );
    });
  };

  const outputAudioButton = (phaseForPlayback: "input" | "output") => {
    if (!onPlayPhrase) return null;
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPlayPhrase(phaseForPlayback);
        }}
        aria-label="Play output audio"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-slate-100"
      >
        <Volume2 className="h-4 w-4" />
      </button>
    );
  };

  // Combine drag values with base offset for final position
  const finalX = useMotionValue(offsetX);
  const finalY = useMotionValue(offsetY);

  // Update final position when drag or offset changes
  useEffect(() => {
    const unsubX = dragX.on('change', (latest: number) => finalX.set(offsetX + latest));
    const unsubY = dragY.on('change', (latest: number) => finalY.set(offsetY + latest));
    // Also update when offset changes
    finalX.set(offsetX + dragX.get());
    finalY.set(offsetY + dragY.get());
    return () => {
      unsubX();
      unsubY();
    };
  }, [dragX, dragY, offsetX, offsetY, finalX, finalY]);

  // Render title if provided
  if (title) {
    return (
      <motion.div
        key="title"
        initial={disableAnimation ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: disableAnimation ? 0 : TITLE_ANIMATION_DURATION / 1000, ease: "easeOut", delay: disableAnimation ? 0 : (BLEED_START_DELAY + TITLE_DELAY) / 1000 }
        }}
        exit={disableAnimation ? { opacity: 1, y: 0, scale: 1 } : {
          opacity: 0,
          y: 20,
          scale: 0.98,
          transition: { duration: TITLE_ANIMATION_DURATION / 1000, ease: "easeOut" }
        }}
        className={`text-center absolute flex flex-col ${textColorClass}`}
        style={{
          maxWidth: "600px",
          padding: 20,
          alignItems: "center",
          justifyContent: "center",
          textShadow: textBg ? `2px 2px 2px ${textBg}` : "2px 2px 2px rgba(0,0,0,0.2)",
          backgroundColor: textBg
            ? (textBg.includes("rgb")
              ? (textBg.slice(0, -1) + " 0.7)").replaceAll(" ", ",")
              : textBg)
            : "rgba(255,255,255,0.9) dark:bg-gray-800",
          borderRadius: "1rem",
          x: finalX,
          y: finalY
        }}
      >
        <h1 className={titlePropClass} style={{
          margin: 0,
          padding: 0,
          fontFamily: 'var(--font-playpen-sans), "Playpen Sans", system-ui, sans-serif'
        }}>
          {title}
        </h1>
      </motion.div>
    );
  }

  // Render showAllPhrases mode
  if (showAllPhrases) {
    if (!phrase && !translated) return null;

    return (
      <motion.div
        className={`text-left ${isMobileInline ? 'px-4' : 'px-12'} ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass} group`}
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: textBg
            ? (textBg.includes("rgb")
              ? (textBg.slice(0, -1) + " 0.9)").replaceAll(" ", ",")
              : textBg)
            : "rgba(255,255,255,0.9) dark:bg-gray-800",
          borderRadius: '1rem',
          x: finalX,
          y: finalY,
          ...(isMobileInline && {
            maxWidth: 'calc(100% - 2rem)',
            overflow: 'hidden'
          })
        }}
      >
        {(() => {
          const phraseFontSize = phrase ? calculateFontSize(phrase, fullScreen, false) : '0px';
          const translatedFontSize = translated ? calculateFontSize(translated, fullScreen, romanized ? true : false) : '0px';

          const phraseSize = parseInt(phraseFontSize);
          const translatedSize = parseInt(translatedFontSize);

          const commonFontSize = phrase && translated
            ? `${Math.min(phraseSize, translatedSize)}px`
            : phrase ? phraseFontSize : translatedFontSize;

          const inputFontSize = phrase && translated
            ? `${Math.floor(Math.min(phraseSize, translatedSize) * 0.85)}px`
            : phrase ? phraseFontSize : translatedFontSize;

          const inputPhraseContent = phrase && (
            <motion.div
              key={phrase.trim()}
              initial={disableAnimation ? { opacity: 1, y: 0 } : { opacity: animationDirection ? 1 : 0, y: (isSafari && isMobile && !fullScreen) ? 0 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={disableAnimation ? { opacity: 1, y: 0 } : { opacity: animationDirection ? 1 : 0, y: (isSafari && isMobile && !fullScreen) ? 0 : 10 }}
              transition={{ duration: disableAnimation ? 0 : (animationDirection ? 0 : 0.3), ease: "easeOut" }}
            >
              <h2
                className={`font-bold mb-2 transition-opacity duration-300 ${phase !== "input" ? "opacity-60 hover:opacity-50" : "opacity-100 hover:opacity-90"}`}
                style={{
                  margin: 0,
                  padding: 0,
                  marginBottom: isMobileInline && !enableOutputBeforeInput ? '12px' : undefined,
                  fontSize: isMobileInline ? '16px' : (enableOutputBeforeInput ? commonFontSize : inputFontSize),
                  transform: isPlayingAudio && phase === "input" ? "scale(1.02)" : "scale(1)",
                  filter: isPlayingAudio && phase === "input" ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" : "none",
                  transition: "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease",
                  ...(isMobileInline && {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '85vw'
                  })
                }}
              >
                {renderInteractiveText(
                  phrase.trim(),
                  phrase.trim(),
                  inputLang,
                  targetLang,
                  inputVoice
                )}
              </h2>
            </motion.div>
          );

          const inputPhrase = disableAnimation ? (
            <>{inputPhraseContent}</>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {inputPhraseContent}
            </AnimatePresence>
          );

          const outputPhraseContent = translated && (
            <motion.div
              key={translated.trim()}
              initial={disableAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: (isSafari && isMobile && !fullScreen) ? 0 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={disableAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: (isSafari && isMobile && !fullScreen) ? 0 : 10 }}
              transition={{ duration: disableAnimation ? 0 : (animationDirection ? 0 : 0.3), ease: "easeOut" }}
            >
              <div className="mb-2">{outputAudioButton("output")}</div>
              <h2
                className={`font-bold transition-opacity duration-300 ${phase !== "output" ? "opacity-60 hover:opacity-50" : "opacity-100 hover:opacity-90"}`}
                style={{
                  margin: 0,
                  padding: 0,
                  marginBottom: isMobileInline && enableOutputBeforeInput ? '12px' : undefined,
                  fontSize: isMobileInline ? '16px' : (enableOutputBeforeInput ? inputFontSize : commonFontSize),
                  transform: isPlayingAudio && phase === "output" ? "scale(1.02)" : "scale(1)",
                  filter: isPlayingAudio && phase === "output" ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" : "none",
                  transition: "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease",
                  ...(isMobileInline && {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '85vw'
                  })
                }}
              >
                {renderInteractiveText(
                  translated.trim(),
                  translated.trim(),
                  targetLang,
                  inputLang,
                  targetVoice
                )}
              </h2>
              {romanized && !isMobileInline && (
                <h2
                  className={`font-bold mt-3 transition-opacity duration-300 ${phase !== "output" ? "opacity-60 hover:opacity-50" : "opacity-100 hover:opacity-90"}`}
                  style={{
                    margin: 0,
                    padding: 0,
                    fontSize: enableOutputBeforeInput ? inputFontSize : commonFontSize,
                    transform: isPlayingAudio && phase === "output" ? "scale(1.02)" : "scale(1)",
                    filter: isPlayingAudio && phase === "output" ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" : "none",
                    transition: "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease"
                  }}
                >
                  {romanized}
                </h2>
              )}
            </motion.div>
          );

          const outputPhrase = disableAnimation ? (
            <>{outputPhraseContent}</>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {outputPhraseContent}
            </AnimatePresence>
          );

          const divider = phrase && translated && !isMobileInline && (
            <div
              style={{
                width: '80px',
                height: '1px',
                margin: '16px auto',
                background: textBg
                  ? (textBg.includes("rgb")
                    ? (textBg.slice(0, -1) + " 0.3)").replaceAll(" ", ",")
                    : textBg + "4D")
                  : "rgba(255,255,255,0.3)",
                borderRadius: '1px'
              }}
            />
          );

          return (
            <>
              {outputPhrase}
              {divider}
              {inputPhrase}
            </>
          );
        })()}
      </motion.div>
    );
  }

  // Render single phrase mode
  if (!translated && !phrase) return null;

  return (
    <motion.div
      key={phase === "input" ? phrase : translated}
      initial={disableAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: (isSafari && isMobile && !fullScreen) ? 0 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={disableAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: (isSafari && isMobile && !fullScreen) ? 0 : 10 }}
      transition={{ duration: disableAnimation ? 0 : (animationDirection ? 0 : 0.3), ease: "easeOut" }}
      className={`${isMobileInline ? 'text-left px-4' : 'text-center px-12'} ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass}`}
      style={{
        alignItems: isMobileInline ? "flex-start" : "center",
        justifyContent: "center",
        backgroundColor: textBg
          ? (textBg.includes("rgb")
            ? (textBg.slice(0, -1) + " 0.9)").replaceAll(" ", ",")
            : textBg)
          : "rgba(255,255,255,0.9) dark:bg-gray-800",
        borderRadius: '1rem',
        x: finalX,
        y: finalY,
        ...(isMobileInline && {
          maxWidth: 'calc(100% - 2rem)',
          overflow: 'hidden'
        })
      }}
    >
      {phase === "output" && (
        <div className="mb-2">{outputAudioButton("output")}</div>
      )}
      <h2
        key={phase === "input" ? phrase : translated}
        className="font-bold transition-opacity duration-300 opacity-100 hover:opacity-90"
        style={{
          margin: 0,
          padding: 0,
          fontSize: isMobileInline ? '16px' : calculateFontSize(
            phase === "input" ? phrase : translated,
            fullScreen,
            romanized ? true : false
          ),
          ...(isMobileInline && {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '85vw'
          })
        }}
      >
        {phase === "input"
                  ? renderInteractiveText(
            phrase?.trim(),
            phrase?.trim(),
            inputLang,
            targetLang,
            inputVoice
          )
          : renderInteractiveText(
            translated?.trim(),
            translated?.trim(),
            targetLang,
            inputLang,
            targetVoice
          )}
      </h2>
      {phase === "output" && romanized && !isMobileInline && (
        <h2
          key={phase}
          className="font-bold mt-3 transition-opacity duration-300 opacity-100 hover:opacity-90"
          style={{
            fontSize: calculateFontSize(romanized, fullScreen, true)
          }}
        >
          {romanized}
        </h2>
      )}
    </motion.div>
  );
}
