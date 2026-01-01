'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type MutableRefObject,
} from "react";
import { Popover, Transition } from "@headlessui/react";
import { motion, AnimatePresence, useMotionValue, type MotionValue } from "framer-motion";
import { Volume2 } from "lucide-react";
import { API_BASE_URL, BLEED_START_DELAY, TITLE_DELAY } from "../consts";
import { generateAudio } from "../utils/audioUtils";

// Hide Headless UI focus guard elements within PhraseCard (apply once)
const FOCUS_GUARD_STYLE_ID = 'phrase-card-focus-guard-style';
if (typeof document !== 'undefined' && !document.getElementById(FOCUS_GUARD_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = FOCUS_GUARD_STYLE_ID;
  style.textContent = '.phrase-card [data-headlessui-focus-guard="true"] { display: none !important; }';
  document.head.appendChild(style);
}

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
  enableInputWordTooltips?: boolean;
  enableOutputWordTooltips?: boolean;
}

type ActiveWord = {
  tokenId: string;
  displayWord: string;
  lookupWord: string;
  sentence: string;
  sourceLang: string;
  targetLang: string;
  voice?: string;
};

type TooltipCacheEntry = {
  translation?: string;
  audioUrl?: string;
  audioPromise?: Promise<{ audioUrl: string; duration: number }>;
  context?: string;
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

type PhraseToken = {
  value: string;
  isWordLike: boolean;
};

function tokenizePhrase(text: string, locale?: string): PhraseToken[] {
  const mergeTrailingPunctuation = (tokens: PhraseToken[]) => {
    return tokens.reduce<PhraseToken[]>((acc, token) => {
      const prev = acc[acc.length - 1];
      const isWhitespace = /^\s+$/.test(token.value);
      const shouldMerge =
        prev &&
        prev.isWordLike &&
        !token.isWordLike &&
        !isWhitespace;

      if (shouldMerge) {
        prev.value += token.value;
        return acc;
      }

      acc.push({ ...token });
      return acc;
    }, []);
  };

  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    const tokens = Array.from(segmenter.segment(text), (segment) => ({
      value: segment.segment,
      isWordLike: Boolean(segment.isWordLike),
    }));
    return mergeTrailingPunctuation(tokens);
  }

  const matches = text.match(/\s+|\p{L}[\p{L}\p{M}\p{Nd}'-]*|[^\s]/gu);
  if (!matches) {
    return [{ value: text, isWordLike: isWordToken(text) }];
  }

  const tokens = matches.map((value) => ({
    value,
    isWordLike: isWordToken(value),
  }));
  return mergeTrailingPunctuation(tokens);
}

function isWordToken(token: string): boolean {
  return /^(\p{L}|\p{Nd})/u.test(token);
}

function stripEdgePunctuation(token: string): string {
  return token.replace(/^[^\p{L}\p{Nd}]+|[^\p{L}\p{Nd}]+$/gu, "");
}

function buildCacheKey(payload: ActiveWord) {
  return `${payload.sourceLang}|${payload.targetLang}|${payload.lookupWord}|${payload.sentence}`;
}

type WordTooltipPanelProps = {
  payload: ActiveWord;
  cacheRef: MutableRefObject<Map<string, TooltipCacheEntry>>;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  autoPlayOnOpen?: boolean;
};

function WordTooltipPanel({ payload, cacheRef, audioRef, autoPlayOnOpen }: WordTooltipPanelProps) {
  const cacheKey = useMemo(
    () => buildCacheKey(payload),
    [payload.sourceLang, payload.targetLang, payload.lookupWord, payload.sentence]
  );
  const cached = cacheRef.current.get(cacheKey);
  const [tooltipState, setTooltipState] = useState<TooltipState>(() => ({
    translation: cached?.translation || "",
    translationLoading: !cached?.translation,
    audioUrl: cached?.audioUrl || "",
    audioLoading: false,
    context: cached?.context || "",
    contextLoading: false,
    error: null,
  }));
  const requestIdRef = useRef(0);
  const audioRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const isOpenRef = useRef(autoPlayOnOpen);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isOpenRef.current = autoPlayOnOpen;
    if (!autoPlayOnOpen) {
      // Invalidate any in-flight audio request when the tooltip closes.
      audioRequestIdRef.current += 1;
    }
  }, [autoPlayOnOpen]);

  useEffect(() => {
    // Avoid re-triggering translation fetches from unrelated cache updates (e.g., audio).
    const cachedEntry = cacheRef.current.get(cacheKey);
    if (cachedEntry?.translation) {
      setTooltipState((prev) => ({
        ...prev,
        translation: cachedEntry.translation || prev.translation,
        translationLoading: false,
      }));
      return;
    }

    let isActive = true;
    const requestId = ++requestIdRef.current;

    setTooltipState((prev) => ({
      ...prev,
      translationLoading: true,
      error: null,
    }));

    const fetchTranslation = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/translate-word`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: payload.lookupWord,
            targetLang: payload.targetLang,
          }),
        });

        if (!response.ok) {
          throw new Error("Translate request failed");
        }

        const data = await response.json();
        const translationText = (data?.translated as string) || "";

        if (!isActive || requestId !== requestIdRef.current) return;

        const latestCachedEntry = cacheRef.current.get(cacheKey);
        cacheRef.current.set(cacheKey, {
          ...latestCachedEntry,
          translation: translationText,
        });

        setTooltipState((prev) => ({
          ...prev,
          translation: translationText,
          translationLoading: false,
        }));
      } catch (error) {
        if (!isActive || requestId !== requestIdRef.current) return;
        setTooltipState((prev) => ({
          ...prev,
          translationLoading: false,
          error: "Unable to translate right now.",
        }));
      }
    };

    fetchTranslation();

    return () => {
      isActive = false;
    };
  }, [cacheKey, payload.targetLang, payload.lookupWord, cacheRef]);

  const playAudioUrl = (url: string) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => { });
  };

  const handlePlayAudio = async () => {
    if (tooltipState.audioLoading) return;

    const requestId = ++audioRequestIdRef.current;
    const cachedEntry = cacheRef.current.get(cacheKey);
    const cachedTranslation = cachedEntry?.translation || tooltipState.translation;

    if (cachedEntry?.audioUrl || tooltipState.audioUrl) {
      const url = cachedEntry?.audioUrl || tooltipState.audioUrl;
      if (isOpenRef.current && isMountedRef.current) {
        playAudioUrl(url);
      }
      return;
    }

    setTooltipState((prev) => ({ ...prev, audioLoading: true }));
    let audioPromise = cachedEntry?.audioPromise;
    if (!audioPromise) {
      // Reuse a shared promise to avoid duplicate audio fetches on rapid remounts.
      audioPromise = generateAudio(
        payload.lookupWord,
        payload.sourceLang,
        payload.voice || ""
      );
      cacheRef.current.set(cacheKey, {
        ...cachedEntry,
        audioPromise,
      });
    }

    try {
      const audio = await audioPromise;

      const latestCachedEntry = cacheRef.current.get(cacheKey);
      const resolvedTranslation = latestCachedEntry?.translation || cachedTranslation;
      cacheRef.current.set(cacheKey, {
        ...latestCachedEntry,
        translation: resolvedTranslation,
        audioUrl: audio.audioUrl,
        audioPromise: undefined,
      });

      if (isMountedRef.current) {
        setTooltipState((prev) => ({
          ...prev,
          translation: resolvedTranslation,
          audioUrl: audio.audioUrl,
          audioLoading: false,
        }));
      }

      if (
        audioRequestIdRef.current === requestId &&
        isOpenRef.current &&
        isMountedRef.current
      ) {
        playAudioUrl(audio.audioUrl);
      }
    } catch (error) {
      const latestCachedEntry = cacheRef.current.get(cacheKey);
      cacheRef.current.set(cacheKey, {
        ...latestCachedEntry,
        audioPromise: undefined,
      });
      if (isMountedRef.current) {
        setTooltipState((prev) => ({
          ...prev,
          audioLoading: false,
          error: "Audio failed to load.",
        }));
      }
    }
  };

  useEffect(() => {
    if (!autoPlayOnOpen) return;
    handlePlayAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayOnOpen]);

  const handleContextRequest = async () => {
    if (tooltipState.contextLoading) return;
    if (tooltipState.context) return;

    setTooltipState((prev) => ({ ...prev, contextLoading: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/word-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: payload.lookupWord,
          sentence: payload.sentence,
          sourceLang: payload.sourceLang,
          targetLang: payload.targetLang,
          responseLang: payload.targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error("Context request failed");
      }

      const data = await response.json();
      const explanation = (data?.explanation as string) || "";

      const cachedEntry = cacheRef.current.get(cacheKey);
      cacheRef.current.set(cacheKey, {
        ...cachedEntry,
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

  return (
    <>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        {payload.lookupWord}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {tooltipState.translationLoading
          ? "..."
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
    </>
  );
}

type WordTokenProps = {
  token: string;
  lookupToken: string;
  tokenId: string;
  sentence: string;
  sourceLang: string;
  targetLang: string;
  voice?: string;
  cacheRef: MutableRefObject<Map<string, TooltipCacheEntry>>;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  onOpenChange: (tokenId: string, open: boolean) => void;
};

const CustomSpanButton = forwardRef<HTMLSpanElement, React.HTMLProps<HTMLSpanElement>>(
  function CustomSpanButton(props, ref) {
    return <span ref={ref} {...props} />;
  }
);

type WordTokenContentProps = {
  open: boolean;
  payload: ActiveWord;
  cacheRef: MutableRefObject<Map<string, TooltipCacheEntry>>;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  onOpenChange: (tokenId: string, open: boolean) => void;
};

function WordTokenContent({
  open,
  payload,
  cacheRef,
  audioRef,
  onOpenChange,
}: WordTokenContentProps) {
  useEffect(() => {
    onOpenChange(payload.tokenId, open);
  }, [open, onOpenChange, payload.tokenId]);

  const handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <>
      <Popover.Button
        as={CustomSpanButton}
        className={`rounded-sm px-0 transition-opacity duration-150 [@media(hover:hover)]:hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${open ? "opacity-70" : ""}`}
        onClick={handleButtonClick}
      >
        {payload.displayWord}
      </Popover.Button>
      <Transition
        show={open}
        enter="transition duration-150 ease-out"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition duration-100 ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
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
          <WordTooltipPanel
            payload={payload}
            cacheRef={cacheRef}
            audioRef={audioRef}
            autoPlayOnOpen={open}
          />
        </Popover.Panel>
      </Transition>
    </>
  );
}

function WordToken({
  token,
  lookupToken,
  tokenId,
  sentence,
  sourceLang,
  targetLang,
  voice,
  cacheRef,
  audioRef,
  onOpenChange,
}: WordTokenProps) {
  const payload: ActiveWord = {
    tokenId,
    displayWord: token,
    lookupWord: lookupToken,
    sentence,
    sourceLang,
    targetLang,
    voice,
  };

  return (
    <Popover key={tokenId} as="span">
      {({ open }) => (
        <WordTokenContent
          open={open}
          payload={payload}
          cacheRef={cacheRef}
          audioRef={audioRef}
          onOpenChange={onOpenChange}
        />
      )}
    </Popover>
  );
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
  enableInputWordTooltips = true,
  enableOutputWordTooltips = true,
}: PhraseCardProps) {
  const [openTokenId, setOpenTokenId] = useState<string | null>(null);
  const cacheRef = useRef(new Map<string, TooltipCacheEntry>());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const closeTooltip = () => {
    setOpenTokenId(null);
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
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      // Notify the PresentationView that the tooltip is open or closed. Prevents progressing phrase of entering fullscreen mode.
      new CustomEvent("word-tooltip", { detail: { open: Boolean(openTokenId) } })
    );
  }, [openTokenId]);

  const handleOpenChange = useCallback((tokenId: string, open: boolean) => {
    setOpenTokenId((current) => {
      if (open) return tokenId;
      if (current === tokenId) return null;
      return current;
    });
  }, []);

  const renderInteractiveText = (
    text: string,
    sentence: string,
    sourceLang?: string,
    targetLang?: string,
    voice?: string,
    enableTooltips: boolean = true
  ) => {
    if (!text) return null;
    if (!sourceLang || !targetLang) return text.trim();
    // If tooltips are disabled, return the text without the tooltips

    const tokens = tokenizePhrase(text, sourceLang);

    return tokens.map(({ value, isWordLike }, index) => {
      if (!value) return null;
      if (/^\s+$/.test(value)) return value;

      if (!isWordLike) {
        return (
          <span key={`${sentence}-punct-${index}`}>{value}</span>
        );
      }

      const tokenId = `${sourceLang}-${targetLang}-${sentence}-${index}`;
      const lookupToken = stripEdgePunctuation(value) || value;

      if (!enableTooltips) return <span>{value}</span>

      return (
        <WordToken
          key={tokenId}
          token={value}
          lookupToken={lookupToken}
          tokenId={tokenId}
          sentence={sentence}
          sourceLang={sourceLang}
          targetLang={targetLang}
          voice={voice}
          cacheRef={cacheRef}
          audioRef={audioRef}
          onOpenChange={handleOpenChange}
        />
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
        className={`phrase-card text-center absolute flex flex-col ${textColorClass}`}
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
        className={`phrase-card text-left ${isMobileInline ? 'px-4' : 'px-12'} ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass} group`}
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

          const inputHoverClass = enableInputWordTooltips
            ? (phase !== "input" ? "hover:opacity-50" : "hover:opacity-90")
            : "";
          const outputHoverClass = enableOutputWordTooltips
            ? (phase !== "output" ? "hover:opacity-50" : "hover:opacity-90")
            : "";

          const inputPhraseContent = phrase && (
            <motion.div
              key={phrase.trim()}
              initial={disableAnimation ? { opacity: 1, y: 0 } : { opacity: animationDirection ? 1 : 0, y: (isSafari && isMobile && !fullScreen) ? 0 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={disableAnimation ? { opacity: 1, y: 0 } : { opacity: animationDirection ? 1 : 0, y: (isSafari && isMobile && !fullScreen) ? 0 : 10 }}
              transition={{ duration: disableAnimation ? 0 : (animationDirection ? 0 : 0.3), ease: "easeOut" }}
            >
              <h2
                className={`font-bold mb-2 transition-opacity duration-300 ${phase !== "input" ? "opacity-60" : "opacity-100"} ${inputHoverClass}`}
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
                  inputVoice,
                  enableInputWordTooltips
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
                className={`font-bold transition-opacity duration-300 ${phase !== "output" ? "opacity-60" : "opacity-100"} ${outputHoverClass}`}
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
                  targetVoice,
                  enableOutputWordTooltips
                )}
              </h2>
              {romanized && !isMobileInline && (
                <h2
                  className={`font-bold mt-3 transition-opacity duration-300 ${phase !== "output" ? "opacity-60" : "opacity-100"} ${outputHoverClass}`}
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
      className={`phrase-card ${isMobileInline ? 'text-left px-4' : 'text-center px-12'} ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass}`}
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
        className={`font-bold transition-opacity duration-300 opacity-100 ${phase === "input" ? (enableInputWordTooltips ? "hover:opacity-90" : "") : (enableOutputWordTooltips ? "hover:opacity-90" : "")}`}
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
            inputVoice,
            enableInputWordTooltips
          )
          : renderInteractiveText(
            translated?.trim(),
            translated?.trim(),
            targetLang,
            inputLang,
            targetVoice,
            enableOutputWordTooltips
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
