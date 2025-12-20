'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Maximize2, X, Play, Pause, Settings } from "lucide-react";
import { AutumnLeaves } from "./Effects/AutumnLeaves";
import CherryBlossom from "./Effects/CherryBlossom";
import { BLEED_START_DELAY, TITLE_DELAY } from './consts';
import ParticleAnimation from "./Effects/ParticleGlow";
import { PhraseCounter } from "./components/PhraseCounter";
import { DustEffect } from "./Effects/DustEffect";

interface PresentationViewProps {
  currentPhrase: string;
  currentTranslated: string;
  currentPhase: "input" | "output";
  fullScreen: boolean; // if true, use fullscreen styles; if false, use inline styles
  setFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  bgImage?: string | null;
  enableSnow?: boolean;
  enableLeaves?: boolean;
  enableAutumnLeaves?: boolean;
  enableCherryBlossom?: boolean;
  enableOrtonEffect?: boolean;
  enableParticles?: boolean;
  particleRotation?: number;
  enableSteam?: boolean;
  enableDust?: boolean;
  particleColor?: string;
  particleSpeed?: number;
  dustOpacity?: number;
  containerBg?: string; // New prop for container background color (default: 'bg-teal-500')
  textBg?: string;      // New prop for text container background color (default: 'bg-rose-400')
  backgroundOverlayOpacity?: number; // Optional dark overlay over bg image to improve contrast
  textColor?: 'dark' | 'light'; // Optional text color override
  romanizedOutput?: string;
  title?: string;       // New optional prop for a title
  showAllPhrases?: boolean; // New prop to show all phrases simultaneously
  enableOutputBeforeInput?: boolean; // New prop to indicate if output plays before input
  showProgressBar?: boolean; // New prop to show progress bar during recall/shadow
  progressDuration?: number; // New prop for progress bar duration in milliseconds
  progressDelay?: number; // New prop for delay before progress bar starts
  onPrevious?: () => void; // New prop for previous functionality
  onNext?: () => void; // New prop for next functionality
  canGoBack?: boolean; // New prop to check if can go back
  canGoForward?: boolean; // New prop to check if can go forward
  currentPhraseIndex?: number; // New prop for current phrase index (0-based)
  totalPhrases?: number; // New prop for total number of phrases
  isPlayingAudio?: boolean; // New prop to indicate if audio is actively playing
  paused?: boolean; // New prop to indicate if playback is paused
  onPause?: () => void; // New prop for pause functionality
  onPlay?: () => void; // New prop for play functionality
  onPlayPhrase?: (phase: 'input' | 'output') => void; // New prop to play a specific phrase (input or output)
  onSettingsOpen?: () => void; // New prop for opening settings
  verticalScroll?: boolean; // New prop to enable vertical scroll mode with top/bottom navigation
  // New props for seamless swipe animation (Spotify-style)
  nextPhrase?: string;
  nextTranslated?: string;
  nextRomanized?: string;
  previousPhrase?: string;
  previousTranslated?: string;
  previousRomanized?: string;
  disableAnimation?: boolean; // New prop to disable all animations in PhraseCard
}

export const TITLE_ANIMATION_DURATION = 1000

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
  dragX: any;
  dragY: any;
  offsetX?: number; // Base offset in pixels (for prev/next positioning)
  offsetY?: number; // Base offset in pixels (for prev/next positioning)
  title?: string;
  titlePropClass: string;
  verticalScroll?: boolean;
  disableAnimation?: boolean;
}

function PhraseCard({
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
        className={`text-left ${isMobileInline ? 'px-4' : 'px-12'} ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass}`}
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

          const inputPhrase = (
            <AnimatePresence mode="wait">
              {phrase && (
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
                    className="font-bold mb-2"
                    style={{
                      margin: 0,
                      padding: 0,
                      marginBottom: isMobileInline && !enableOutputBeforeInput ? '12px' : undefined,
                      fontSize: isMobileInline ? '16px' : (enableOutputBeforeInput ? commonFontSize : inputFontSize),
                      opacity: phase !== "input" ? 0.6 : 1,
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
              )}
            </AnimatePresence>
          );

          const outputPhrase = (
            <AnimatePresence mode="wait">
              {translated && (
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
                    className="font-bold"
                    style={{
                      margin: 0,
                      padding: 0,
                      marginBottom: isMobileInline && enableOutputBeforeInput ? '12px' : undefined,
                      fontSize: isMobileInline ? '16px' : (enableOutputBeforeInput ? inputFontSize : commonFontSize),
                      opacity: phase !== "output" ? 0.6 : 1,
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
                      className="font-bold mt-3"
                      style={{
                        margin: 0,
                        padding: 0,
                        fontSize: enableOutputBeforeInput ? inputFontSize : commonFontSize,
                        opacity: phase !== "output" ? 0.6 : 1,
                        transform: isPlayingAudio && phase === "output" ? "scale(1.02)" : "scale(1)",
                        filter: isPlayingAudio && phase === "output" ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" : "none",
                        transition: "opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease"
                      }}
                    >
                      {romanized}
                    </h2>
                  )}
                </motion.div>
              )}
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
        className="font-bold"
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
          className="font-bold mt-3"
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

export function PresentationView({
  currentPhrase,
  currentTranslated,
  currentPhase,
  fullScreen,
  setFullscreen,
  bgImage,
  enableSnow,
  enableLeaves,
  enableAutumnLeaves,
  enableCherryBlossom,
  enableOrtonEffect,
  enableParticles,
  particleRotation,
  enableSteam,
  enableDust,
  particleColor,
  particleSpeed,
  dustOpacity,
  containerBg,
  textBg,
  backgroundOverlayOpacity,
  textColor,
  romanizedOutput,
  title,
  showAllPhrases,
  enableOutputBeforeInput,
  showProgressBar,
  progressDuration,
  progressDelay,
  onPrevious,
  onNext,
  canGoBack,
  canGoForward,
  currentPhraseIndex,
  totalPhrases,
  isPlayingAudio = false,
  paused,
  onPause,
  onPlay,
  onPlayPhrase,
  onSettingsOpen,
  verticalScroll = false,
  nextPhrase,
  nextTranslated,
  nextRomanized,
  previousPhrase,
  previousTranslated,
  previousRomanized,
  disableAnimation = false,
}: PresentationViewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  // Reset drag position when currentPhrase changes
  useEffect(() => {
    dragY.set(0, false);
    dragX.set(0, false);
  }, [currentPhrase, dragY, dragX]);

  // Create portal container on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.id = 'presentation-portal';
      document.body.appendChild(container);
      setPortalContainer(container);

      return () => {
        document.body.removeChild(container);
      };
    }
  }, []);

  // Handle hover events for the presentation container
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
    }
  };

  // Determine if navigation buttons should be visible
  const shouldShowNavigationButtons = isMobile || isHovering;

  const totalPhraseLength = (currentPhrase?.length + (romanizedOutput?.length ?? 0));

  const alignPhraseTop = totalPhraseLength > 165 && isMobile;

  // Check if we're on mobile and not in fullscreen
  const isMobileInline = isMobile && !fullScreen;

  const containerClass =
    `inset-0 flex flex-col items-center overflow-hidden ${alignPhraseTop ? '' : 'justify-center'} ` +
    (fullScreen ? "fixed z-50" : "relative p-4 lg:rounded shadow w-full h-48 lg:h-[70vh] lg:max-h-[80vh]") +
    (!containerBg ? " bg-gray-100 dark:bg-gray-900" : "");

  const titlePropClass = fullScreen
    ? "font-display text-8xl font-bold mb-4"
    : "font-display text-2xl font-bold mb-2";

  // Determine text color based on textColor or default to system preference
  const getTextColorClass = () => {
    if (textBg) return "text-white"; // If custom text background, use white text

    // If textColor is set and there's a background image, override system preference
    if (bgImage && textColor) {
      if (textColor === 'dark') return "text-gray-800";
      if (textColor === 'light') return "text-gray-100";
    }

    // Default: follow system preference
    return "text-gray-800 dark:text-gray-100";
  };

  const textColorClass = getTextColorClass();

  const effectiveOverlayOpacity =
    bgImage && typeof backgroundOverlayOpacity === 'number'
      ? Math.min(1, Math.max(0, backgroundOverlayOpacity))
      : 0;

  const containerStyle = bgImage
    ? {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      // overflow: "hidden" as const, // Might be able to reintroduce this just check it doesnt introduce layout jank on ios safari
      // overflowY: "auto" as const,
      ...(containerBg && { backgroundColor: containerBg })
    }
    : {
      // overflow: "hidden" as const,
      // overflowY: "auto" as const,
      ...(containerBg && { backgroundColor: containerBg })
    };



  // Calculate progress percentage
  const progressPercentage = totalPhrases && currentPhraseIndex !== undefined
    ? ((currentPhraseIndex + 1) / totalPhrases) * 100
    : 0;

  const content = (
    <>
      {/* CSS Animation for Progress Bar */}
      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
      <motion.div
        ref={containerRef}
        className={`${containerClass} ${isMobile ? "" : (isHovering ? "" : "cursor-none")}`}
        style={containerStyle}
        onClick={(e) => {
          if (!isDragging) {
            if (fullScreen) {
              // In fullscreen: navigate based on click position
              // Use getBoundingClientRect to get accurate container position
              const rect = e.currentTarget.getBoundingClientRect();

              if (verticalScroll) {
                // Vertical mode: top/bottom navigation
                const clickY = e.clientY - rect.top;
                const containerHeight = rect.height;
                const clickPercentage = (clickY / containerHeight) * 100;

                if (clickPercentage < 33.33 && onPrevious && canGoBack) {
                  // Top third: go back
                  onPrevious();
                } else if (clickPercentage > 66.66 && onNext) {
                  // Bottom third: go forward (atomicAdvance will handle completion popup)
                  onNext();
                }
                // Center third (33.33-66.66%): do nothing
              } else {
                // Horizontal mode: left/right navigation
                const clickX = e.clientX - rect.left;
                const containerWidth = rect.width;
                const clickPercentage = (clickX / containerWidth) * 100;

                if (clickPercentage < 33.33 && onPrevious && canGoBack) {
                  // Left third: go back
                  onPrevious();
                } else if (clickPercentage > 66.66 && onNext) {
                  // Right third: go forward (atomicAdvance will handle completion popup)
                  onNext();
                }
                // Center third (33.33-66.66%): do nothing
              }
            } else {
              // Not in fullscreen: enter fullscreen
              setFullscreen(true);
            }
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Effects - rendered before overlay so they appear behind it */}
        {enableOrtonEffect && (
          <div
            style={{
              mixBlendMode: "lighten",
              filter: "blur(50px)",
              opacity: "50%",
              backgroundImage: `url(${bgImage})`,
              width: "100%",
              height: "100%",
            }}
          ></div>
        )}
        {enableSnow && (
          <div className="wrapper" style={{ position: fullScreen ? "absolute" : "static" }}>
            <div className="snow layer1 a"></div>
            <div className="snow layer1"></div>
            <div className="snow layer2 a"></div>
            <div className="snow layer2"></div>
            <div className="snow layer3 a"></div>
            <div className="snow layer3"></div>
          </div>
        )}
        {enableLeaves && (
          <div id="leaves" style={{ position: fullScreen ? "absolute" : "static" }}>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
        )}
        {enableAutumnLeaves && <AutumnLeaves fullScreen={fullScreen} />}
        {enableCherryBlossom && <CherryBlossom fullScreen={fullScreen} />}
        {enableParticles && <ParticleAnimation rotation={particleRotation} speed={particleSpeed} />}
        {enableDust && <DustEffect fullScreen={fullScreen} color={particleColor} direction={particleRotation} speed={particleSpeed} opacity={dustOpacity} />}
        {enableSteam && <div style={{ position: 'absolute', width: '100%', height: '100%', top: '410px', left: '710px' }}>
          <span className="steam" style={{

          }}></span>
        </div>}

        {/* Background overlay - appears on top of effects but behind UI elements */}
        {bgImage && effectiveOverlayOpacity > 0 && (
          <div
            className="pointer-events-none absolute inset-0 bg-white dark:bg-black"
            style={{
              opacity: textColor === 'dark'
                ? effectiveOverlayOpacity // Light overlay (white bg) for dark text
                : textColor === 'light'
                  ? effectiveOverlayOpacity // Dark overlay (black bg) for light text
                  : effectiveOverlayOpacity // Auto: light overlay in light mode, dark overlay in dark mode
            }}
          />
        )}

        {/* Transparent draggable overlay for swipe detection */}
        {isMobile && onPrevious && onNext && (
          <motion.div
            className="absolute inset-0 z-[5]"
            style={{ touchAction: 'none' }}
            drag={verticalScroll ? "y" : "x"}
            dragConstraints={verticalScroll ? { top: 0, bottom: 0 } : { left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDrag={(e, info) => {
              if (verticalScroll) {
                dragY.set(info.offset.y);
              } else {
                dragX.set(info.offset.x);
              }
            }}
            onDragEnd={async (e, info) => {
              setIsDragging(false);
              const swipeThreshold = 50;
              const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
              const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

              // Check if we have 3-phrase stack enabled
              const has3PhraseStack = (previousPhrase || previousTranslated) || (nextPhrase || nextTranslated);

              if (verticalScroll) {
                // Vertical swipe: down to go back, up to go forward
                if (info.offset.y > swipeThreshold && canGoBack) {
                  // Swipe down - Spotify-style: slide all cards down together
                  setAnimationDirection('down');
                  if (has3PhraseStack) {
                    // All 3 cards slide down together
                    await animate(dragY, windowHeight, { duration: 0.3, ease: "easeOut" });
                    onPrevious?.();
                  } else {
                    // Fallback to old animation
                    await animate(dragY, windowHeight, { duration: 0.2, ease: "easeOut" });
                    onPrevious?.();
                    dragY.set(-windowHeight);
                    await animate(dragY, 0, { duration: 0.3, ease: "easeOut" });
                  }
                  setAnimationDirection(null);
                } else if (info.offset.y < -swipeThreshold && onNext) {
                  // Swipe up - allow even on last phrase (atomicAdvance will handle completion popup)
                  setAnimationDirection('up');
                  if (has3PhraseStack) {
                    // All 3 cards slide up together
                    await animate(dragY, -windowHeight, { duration: 0.3, ease: "easeOut" });
                    onNext?.();
                  } else {
                    // Fallback to old animation
                    await animate(dragY, -windowHeight, { duration: 0.2, ease: "easeOut" });
                    onNext?.();
                    dragY.set(windowHeight);
                    await animate(dragY, 0, { duration: 0.3, ease: "easeOut" });
                  }
                  setAnimationDirection(null);
                } else {
                  // Snap back
                  animate(dragY, 0, { duration: 0.2, ease: "easeOut" });
                }
              } else {
                // Horizontal swipe: right to go back, left to go forward
                if (info.offset.x > swipeThreshold && canGoBack) {
                  // Swipe right - Spotify-style: slide all cards right together
                  setAnimationDirection('right');
                  if (has3PhraseStack) {
                    // All 3 cards slide right together
                    await animate(dragX, windowWidth, { duration: 0.3, ease: "easeOut" });
                    onPrevious?.();
                  } else {
                    // Fallback to old animation
                    await animate(dragX, windowWidth, { duration: 0.2, ease: "easeOut" });
                    onPrevious?.();
                    dragX.set(-windowWidth);
                    await animate(dragX, 0, { duration: 0.3, ease: "easeOut" });
                  }
                  setAnimationDirection(null);
                } else if (info.offset.x < -swipeThreshold && onNext) {
                  // Swipe left - allow even on last phrase (atomicAdvance will handle completion popup)
                  setAnimationDirection('left');
                  if (has3PhraseStack) {
                    // All 3 cards slide left together
                    await animate(dragX, -windowWidth, { duration: 0.3, ease: "easeOut" });
                    onNext?.();
                  } else {
                    // Fallback to old animation
                    await animate(dragX, -windowWidth, { duration: 0.2, ease: "easeOut" });
                    onNext?.();
                    dragX.set(windowWidth);
                    await animate(dragX, 0, { duration: 0.3, ease: "easeOut" });
                  }
                  setAnimationDirection(null);
                } else {
                  // Snap back
                  animate(dragX, 0, { duration: 0.2, ease: "easeOut" });
                }
              }
            }}
          />
        )}

        {/* Progress Indicator at the top */}
        {totalPhrases && currentPhraseIndex !== undefined && (
          <div
            className="absolute top-0 left-0 w-full h-1.5 overflow-hidden z-20"
            style={{
              backgroundColor: textBg
                ? (textBg.includes("rgb")
                  ? (textBg.slice(0, -1) + " 0.2)").replaceAll(" ", ",")
                  : textBg + "33") // 33 = 20% opacity in hex
                : "rgba(0,0,0,0.15)"
            }}
          >
            <motion.div
              className="h-full"
              style={{
                backgroundColor: textBg
                  ? (textBg.includes("rgb")
                    ? textBg.replaceAll(" ", ",")
                    : textBg)
                  : "rgba(59, 130, 246, 0.8)", // blue-500 with opacity
                width: `${progressPercentage}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Top left X button for mobile fullscreen */}
        {fullScreen && isMobile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(false);
            }}
            className="absolute top-4 left-4 p-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
            title="Exit Presentation Mode"
            style={{
              opacity: shouldShowNavigationButtons ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {/* Top right buttons container - for desktop and mobile inline (not mobile fullscreen) */}
        {!(fullScreen && isMobile) && (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {/* Settings Button - visible on desktop and mobile inline (not mobile fullscreen) */}
            {onSettingsOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettingsOpen();
                }}
                className="p-1.5 bg-gray-200/80 dark:bg-gray-700/80 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                title="Settings"
                style={{
                  opacity: isMobileInline ? 1 : (shouldShowNavigationButtons ? 1 : 0),
                  transition: 'opacity 0.3s ease'
                }}
              >
                <Settings className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Fullscreen/Close Button - hidden on mobile inline and when not in fullscreen */}
            {!isMobileInline && fullScreen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreen(prev => !prev);
                }}
                className="p-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                title="Exit Presentation Mode"
                style={{
                  opacity: shouldShowNavigationButtons ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Buttons - Spotify-style bottom center on mobile fullscreen, hidden on mobile inline */}
        {onPrevious && onNext && !isMobileInline && (
          <>
            {fullScreen && isMobile && !verticalScroll ? (
              // Mobile fullscreen horizontal: Spotify-style bottom center layout
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-8 z-10"
                style={{
                  opacity: shouldShowNavigationButtons ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                {canGoBack && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevious();
                    }}
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                    title="Previous Phrase"
                  >
                    <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
                {/* Pause/Play button for mobile fullscreen */}
                {onPause && onPlay && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      paused ? onPlay() : onPause();
                    }}
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                    title={paused ? "Play" : "Pause"}
                  >
                    {paused ? (
                      <Play className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="currentColor" />
                    ) : (
                      <Pause className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                  title="Next Phrase"
                >
                  <ArrowRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            ) : verticalScroll ? (
              // Vertical scroll mode: top/bottom layout
              <>
                {canGoBack && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevious();
                    }}
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
                    title="Previous Phrase"
                    style={{
                      opacity: shouldShowNavigationButtons ? 1 : 0,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    <ArrowUp className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
                {/* Pause/Play button for vertical scroll - bottom left */}
                {onPause && onPlay && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      paused ? onPlay() : onPause();
                    }}
                    className="absolute left-8 bottom-8 p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
                    title={paused ? "Play" : "Pause"}
                    style={{
                      opacity: shouldShowNavigationButtons ? 1 : 0,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    {paused ? (
                      <Play className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="currentColor" />
                    ) : (
                      <Pause className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
                  title="Next Phrase"
                  style={{
                    opacity: shouldShowNavigationButtons ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <ArrowDown className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              </>
            ) : (
              // Desktop or inline horizontal: side-by-side layout
              <>
                {canGoBack && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrevious();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
                    title="Previous Phrase"
                    style={{
                      opacity: shouldShowNavigationButtons ? 1 : 0,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
                  title="Next Phrase"
                  style={{
                    opacity: shouldShowNavigationButtons ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <ArrowRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              </>
            )}
          </>
        )}

        {/* Pause/Play button for desktop fullscreen - bottom center */}
        {fullScreen && !isMobile && !verticalScroll && onPause && onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              paused ? onPlay() : onPause();
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10"
            title={paused ? "Play" : "Pause"}
            style={{
              opacity: shouldShowNavigationButtons ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {paused ? (
              <Play className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="currentColor" />
            ) : (
              <Pause className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        )}

        {/* Phrase Counter with Settings on mobile fullscreen - positioned top right */}
        {fullScreen && isMobile && onNext ? (
          <div
            className="absolute top-4 right-4 flex items-center gap-2 z-10"
            style={{
              opacity: shouldShowNavigationButtons ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {onSettingsOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettingsOpen();
                }}
                className="p-1.5 bg-gray-200/80 dark:bg-gray-700/80 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 mr-1"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            <PhraseCounter
              currentPhraseIndex={currentPhraseIndex}
              totalPhrases={totalPhrases}
            />
          </div>
        ) : (
          <PhraseCounter
            currentPhraseIndex={currentPhraseIndex}
            totalPhrases={totalPhrases}
            className={`absolute z-10 ${isMobileInline
              ? "bottom-1 right-2 text-xs" // Smaller position on mobile inline
              : "bottom-4 right-4"
              }`}
            style={{
              opacity: isMobileInline ? 1 : (shouldShowNavigationButtons ? 1 : 0),
              transition: 'opacity 0.3s ease'
            }}
          />
        )}

        {/* Render 3-phrase stack for Spotify-style swipe (or single phrase if no next/prev available) */}
        {(() => {
          // Calculate window dimensions for offset positioning
          const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

          // Common props for all phrase cards
          const commonCardProps = {
            phase: currentPhase,
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
            titlePropClass,
            verticalScroll,
            disableAnimation: disableAnimation || verticalScroll,
          };

          // If title is present, render only title (no 3-phrase stack)
          if (title) {
            return (
              <AnimatePresence mode={'sync'}>
                <PhraseCard
                  key="title"
                  phrase=""
                  translated=""
                  title={title}
                  {...commonCardProps}
                />
              </AnimatePresence>
            );
          }

          // Determine if we should render 3-phrase stack
          const has3PhraseStack = (previousPhrase || previousTranslated) && (nextPhrase || nextTranslated);

          if (has3PhraseStack) {
            // Render 3-phrase stack for seamless swipe
            return (
              <>
                {/* Previous phrase - offset left/top */}
                {(previousPhrase || previousTranslated) && (
                  <PhraseCard
                    key="previous"
                    phrase={previousPhrase || ""}
                    translated={previousTranslated || ""}
                    romanized={previousRomanized}
                    offsetX={verticalScroll ? 0 : -windowWidth}
                    offsetY={verticalScroll ? -windowHeight : 0}
                    {...commonCardProps}
                  />
                )}

                {/* Current phrase - at center */}
                <PhraseCard
                  key="current"
                  phrase={currentPhrase}
                  translated={currentTranslated}
                  romanized={romanizedOutput}
                  offsetX={0}
                  offsetY={0}
                  {...commonCardProps}
                />

                {/* Next phrase - offset right/bottom */}
                {(nextPhrase || nextTranslated) && (
                  <PhraseCard
                    key="next"
                    phrase={nextPhrase || ""}
                    translated={nextTranslated || ""}
                    romanized={nextRomanized}
                    offsetX={verticalScroll ? 0 : windowWidth}
                    offsetY={verticalScroll ? windowHeight : 0}
                    {...commonCardProps}
                  />
                )}
              </>
            );
          } else {
            // Fallback to single phrase with AnimatePresence for enter/exit animations
            return (
              <AnimatePresence mode={'sync'}>
                <PhraseCard
                  key={`${currentPhase}-${currentPhrase || currentTranslated}`}
                  phrase={currentPhrase}
                  translated={currentTranslated}
                  romanized={romanizedOutput}
                  offsetX={0}
                  offsetY={0}
                  {...commonCardProps}
                />
              </AnimatePresence>
            );
          }
        })()}
        {/* Progress Bar for Recall/Shadow */}
        <div
          className="absolute bottom-0 left-0 w-full h-1 overflow-hidden"
          style={{
            zIndex: 10,
            backgroundColor: textBg
              ? (textBg.includes("rgb")
                ? (textBg.slice(0, -1) + " 0.3)").replaceAll(" ", ",")
                : textBg + "4D") // 4D = 30% opacity in hex
              : "rgba(0,0,0,0.1) dark:bg-gray-600"
          }}
        >
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-linear"
            style={{
              opacity: showProgressBar && progressDuration ? 1 : 0.1,
              width: '0%',
              animation: showProgressBar && progressDuration ? `progressBar ${progressDuration - 50}ms linear ${progressDelay || 0}ms forwards` : undefined
            }}
          />
        </div>
      </motion.div>

    </>
  );

  // Use portal for fullscreen mode, regular render for inline mode
  if (fullScreen && portalContainer) {
    return createPortal(content, portalContainer);
  }

  return content;
}
