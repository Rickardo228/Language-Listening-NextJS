'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { AutumnLeaves } from "./Effects/AutumnLeaves";
import CherryBlossom from "./Effects/CherryBlossom";
import { BLEED_START_DELAY, TITLE_DELAY } from './consts';
import ParticleAnimation from "./Effects/ParticleGlow";

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
}: PresentationViewProps) {
  const [isIdle, setIsIdle] = useState(false);
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

  // useEffect to detect mouse movement and mark idle after 1 second.
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const handleMouseMove = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 1000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(idleTimer);
    };
  }, []);

  const totalPhraseLength = (currentPhrase?.length + (romanizedOutput?.length ?? 0));

  const alignPhraseTop = totalPhraseLength > 165 && isMobile;

  const containerClass =
    `inset-0 flex flex-col items-center ${alignPhraseTop ? '' : 'justify-center'} ` +
    (fullScreen ? "fixed z-50" : "relative p-4 lg:rounded shadow w-full h-48") +
    (!containerBg ? " bg-gray-100 dark:bg-gray-900" : "");

  const titlePropClass = fullScreen
    ? "text-8xl font-bold mb-4"
    : "text-2xl font-bold mb-2";

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

  console.log(textBg)

  const content = (
    <div ref={containerRef} className={`${containerClass} ${isIdle ? "cursor-none" : ""}`} style={containerStyle} onClick={() => setFullscreen(prev => !prev)}>
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
      <AnimatePresence mode={'sync'}>
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
            <h1 className={titlePropClass} style={{ margin: 0, padding: 0 }}>
              {title}
            </h1>
          </motion.div>
        ) : (
          (currentTranslated || currentPhrase) && (
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
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
      </AnimatePresence>
    </div>
  );

  // Use portal for fullscreen mode, regular render for inline mode
  if (fullScreen && portalContainer) {
    return createPortal(content, portalContainer);
  }

  return content;
}
