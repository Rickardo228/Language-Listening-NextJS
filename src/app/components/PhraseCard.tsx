'use client';

import { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, type MotionValue } from "framer-motion";
import { BLEED_START_DELAY, TITLE_DELAY } from "../consts";

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

export function PhraseCard({
  phrase,
  translated,
  romanized,
  phase,
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
              className={paused && onPlayPhrase && !isMobileInline ? "cursor-pointer" : ""}
              onClick={(e) => {
                if (isMobileInline) return;
                if (paused && onPlayPhrase) {
                  e.stopPropagation();
                  onPlayPhrase('input');
                }
              }}
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
                {phrase.trim()}
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
              className={paused && onPlayPhrase && !isMobileInline ? "cursor-pointer" : ""}
              onClick={(e) => {
                if (isMobileInline) return;
                if (paused && onPlayPhrase) {
                  e.stopPropagation();
                  onPlayPhrase('output');
                }
              }}
            >
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
                {translated.trim()}
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
      className={`${isMobileInline ? 'text-left px-4' : 'text-center px-12'} ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass} ${paused && onPlayPhrase && !isMobileInline ? 'cursor-pointer' : ''}`}
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
      onClick={(e) => {
        if (isMobileInline) return;
        if (paused && onPlayPhrase) {
          e.stopPropagation();
          onPlayPhrase(phase);
        }
      }}
    >
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
          ? phrase?.trim()
          : translated?.trim()}
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
