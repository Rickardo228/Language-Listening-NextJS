'use client';

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";
import { AutumnLeaves } from "./Effects/AutumnLeaves";
import CherryBlossom from "./Effects/CherryBlossom";
import { BLEED_START_DELAY, TITLE_DELAY } from './consts';
import ParticleAnimation from "./Effects/ParticleGlow";
import { PhraseCounter } from "./components/PhraseCounter";

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
  enableSteam?: boolean;
  containerBg?: string; // New prop for container background color (default: 'bg-teal-500')
  textBg?: string;      // New prop for text container background color (default: 'bg-rose-400')
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
  enableSteam,
  containerBg,
  textBg,
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
}: PresentationViewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
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

  const containerClass =
    `inset-0 flex flex-col items-center ${alignPhraseTop ? '' : 'justify-center'} ` +
    (fullScreen ? "fixed z-50" : "relative p-4 lg:rounded shadow w-full h-48") +
    (!containerBg ? " bg-gray-100 dark:bg-gray-900" : "");

  const titlePropClass = fullScreen
    ? "font-display text-8xl font-bold mb-4"
    : "font-display text-2xl font-bold mb-2";

  const textColorClass = !textBg ? "text-gray-800 dark:text-gray-100" : "text-white";

  const containerStyle = bgImage
    ? {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      overflow: "hidden" as const,
      overflowY: "auto" as const,
      ...(containerBg && { backgroundColor: containerBg })
    }
    : {
      overflow: "hidden" as const,
      overflowY: "auto" as const,
      ...(containerBg && { backgroundColor: containerBg })
    };



  const content = (
    <>
      {/* CSS Animation for Progress Bar */}
      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
      <div ref={containerRef} className={`${containerClass} ${isMobile ? "" : (isHovering ? "" : "cursor-none")}`} style={containerStyle} onClick={() => setFullscreen(prev => !prev)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Fullscreen Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFullscreen(prev => !prev);
          }}
          className={`absolute p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 z-10 ${fullScreen && isMobile && onPrevious && onNext
            ? "bottom-4 left-20" // Move right to avoid overlap with navigation button
            : "bottom-4 left-4"
            }`}
          title={fullScreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
          style={{
            opacity: shouldShowNavigationButtons ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          <Maximize2 className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Navigation Buttons */}
        {onPrevious && onNext && (
          <>
            {/* Left Navigation Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              disabled={!canGoBack}
              className={`absolute p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 z-10 ${fullScreen && isMobile
                ? "left-4 bottom-4"
                : "left-4 top-1/2 transform -translate-y-1/2"
                }`}
              title="Previous Phrase"
              style={{
                opacity: shouldShowNavigationButtons ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
            >
              <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Right Navigation Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              disabled={!canGoForward}
              className={`absolute p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 z-10 ${fullScreen && isMobile
                ? "right-4 bottom-4"
                : "right-4 top-1/2 transform -translate-y-1/2"
                }`}
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

        {/* Phrase Counter */}
        <PhraseCounter
          currentPhraseIndex={currentPhraseIndex}
          totalPhrases={totalPhrases}
          className={`absolute z-10 ${fullScreen && isMobile && onNext
            ? "bottom-4 right-4 mr-16" // Move left to avoid overlap with navigation button
            : "bottom-4 right-4"
            }`}
          style={{
            opacity: shouldShowNavigationButtons ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />

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
        {/* {<ParticleEffect />} */}
        {fullScreen && enableParticles && <ParticleAnimation />
        }
        {enableSteam && <div style={{ position: 'absolute', width: '100%', height: '100%', top: '410px', left: '710px' }}>
          <span className="steam" style={{

          }}></span>
        </div>}
        {/* Animate the title in/out with AnimatePresence */}
        {/* <AnimatePresence mode={'sync'}> */}
        {title ? (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: TITLE_ANIMATION_DURATION / 1000, ease: "easeOut", delay: (BLEED_START_DELAY + TITLE_DELAY) / 1000 }
            }}
            exit={{
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
              borderRadius: "1rem"
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
        ) : showAllPhrases ? (
          // Show all phrases simultaneously with highlighting
          (currentPhrase || currentTranslated) && (
            <motion.div
              key="all-phrases"
              initial={{ opacity: 0, y: isMobile && !fullScreen ? 0 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile && !fullScreen ? 0 : 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`text-center px-12 ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass}`}
              style={{
                alignItems: "center",
                justifyContent: "center",
                flexDirection: enableOutputBeforeInput ? "column-reverse" : "column",
                backgroundColor: textBg
                  ? (textBg.includes("rgb")
                    ? (textBg.slice(0, -1) + " 0.9)").replaceAll(" ", ",")
                    : textBg)
                  : "rgba(255,255,255,0.9) dark:bg-gray-800",
                borderRadius: '1rem'
              }}
            >
              {/* Calculate the smaller font size for all phrases */}
              {(() => {
                const phraseFontSize = currentPhrase ? calculateFontSize(currentPhrase, fullScreen, false) : '0px';
                const translatedFontSize = currentTranslated ? calculateFontSize(currentTranslated, fullScreen, romanizedOutput ? true : false) : '0px';

                // Extract numeric values for comparison
                const phraseSize = parseInt(phraseFontSize);
                const translatedSize = parseInt(translatedFontSize);

                // Use the smaller font size, or fallback to translated size if phrase is empty
                const commonFontSize = currentPhrase && currentTranslated
                  ? `${Math.min(phraseSize, translatedSize)}px`
                  : currentPhrase ? phraseFontSize : translatedFontSize;

                // Make currentPhrase slightly smaller (85% of common size)
                const inputFontSize = currentPhrase && currentTranslated
                  ? `${Math.floor(Math.min(phraseSize, translatedSize) * 0.85)}px`
                  : currentPhrase ? phraseFontSize : translatedFontSize;

                return (
                  <>
                    {/* Input phrase */}
                    {currentPhrase && (
                      <h2
                        className="font-bold mb-2"
                        style={{
                          margin: 0,
                          padding: 0,
                          fontSize: enableOutputBeforeInput ? commonFontSize : inputFontSize,
                          color: currentPhase === "input" ? "#3b82f6" : undefined, // Blue highlight for input phase
                          textShadow: currentPhase === "input" ? "0 0 10px rgba(59, 130, 246, 0.5)" : undefined,
                          transition: "color 0.3s ease, text-shadow 0.3s ease"
                        }}
                      >
                        {currentPhrase.trim()}
                      </h2>
                    )}

                    <div>
                      {currentTranslated && <h2
                        className="font-bold"
                        style={{
                          margin: 0,
                          padding: 0,
                          fontSize: enableOutputBeforeInput ? inputFontSize : commonFontSize,
                          color: currentPhase === "output" ? "#10b981" : undefined, // Green highlight for output phase
                          textShadow: currentPhase === "output" ? "0 0 10px rgba(16, 185, 129, 0.5)" : undefined,
                          transition: "color 0.3s ease, text-shadow 0.3s ease"
                        }}
                      >
                        {currentTranslated.trim()}

                      </h2>}
                      {romanizedOutput && (
                        <h2
                          className="font-bold mt-3"
                          style={{
                            margin: 0,
                            padding: 0,
                            fontSize: enableOutputBeforeInput ? inputFontSize : commonFontSize,
                            color: currentPhase === "output" ? "#f59e0b" : undefined, // Amber highlight for romanization during output phase
                            textShadow: currentPhase === "output" ? "0 0 10px rgba(245, 158, 11, 0.5)" : undefined,
                            transition: "color 0.3s ease, text-shadow 0.3s ease"
                          }}
                        >
                          {romanizedOutput}
                        </h2>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )
        ) : (
          // Original single phrase display
          (currentTranslated || currentPhrase) && (
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: isMobile && !fullScreen ? 0 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile && !fullScreen ? 0 : 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`text-center px-12 ${alignPhraseTop ? 'pb-4' : ''} absolute flex bg-opacity-90 flex-col ${textColorClass}`}
              style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: textBg
                  ? (textBg.includes("rgb")
                    ? (textBg.slice(0, -1) + " 0.9)").replaceAll(" ", ",")
                    : textBg)
                  : "rgba(255,255,255,0.9) dark:bg-gray-800",
                borderRadius: '1rem'
              }}
            >
              <h2
                className="font-bold"
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: calculateFontSize(
                    currentPhase === "input" ? currentPhrase : currentTranslated,
                    fullScreen,
                    romanizedOutput ? true : false
                  )
                }}
              >
                {currentPhase === "input"
                  ? currentPhrase?.trim()
                  : currentTranslated?.trim()}
              </h2>
              {currentPhase === "output" && romanizedOutput && (
                <h2
                  className="font-bold mt-3"
                  style={{
                    fontSize: calculateFontSize(romanizedOutput, fullScreen, true)
                  }}
                >
                  {romanizedOutput}
                </h2>
              )}
            </motion.div>
          )
        )}
        {/* </AnimatePresence> */}
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
          {showProgressBar && progressDuration && (
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-linear"
              style={{
                width: '0%',
                animation: `progressBar ${progressDuration}ms linear ${progressDelay || 0}ms forwards`
              }}
            />
          )}
        </div>
      </div>
    </>
  );

  // Use portal for fullscreen mode, regular render for inline mode
  if (fullScreen && portalContainer) {
    return createPortal(content, portalContainer);
  }

  return content;
}
