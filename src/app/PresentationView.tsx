'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AutumnLeaves } from "./Effects/AutumnLeaves";
import CherryBlossom from "./Effects/CherryBlossom";
import { BLEED_START_DELAY, TITLE_DELAY } from './consts';
import ParticleAnimation from "./Effects/ParticleGlow";

interface PresentationViewProps {
  currentPhrase: string;
  currentTranslated: string;
  currentPhase: "input" | "output";
  fullScreen: boolean; // if true, use fullscreen styles; if false, use inline styles
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

export function PresentationView({
  currentPhrase,
  currentTranslated,
  currentPhase,
  fullScreen,
  bgImage,
  enableSnow,
  enableLeaves,
  enableAutumnLeaves,
  enableCherryBlossom,
  enableOrtonEffect,
  enableParticles,
  enableSteam,
  containerBg = "bg-teal-500", // default value if not provided
  textBg = "bg-rose-400",       // default value if not provided
  romanizedOutput,
  title,
}: PresentationViewProps) {
  // State to track if the mouse is idle.
  const [isIdle, setIsIdle] = useState(false);

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

  // Set container classes based on the fullScreen prop.
  const containerClass =
    `inset-0 flex flex-col items-center justify-center ` +
    (fullScreen ? "fixed z-50" : "relative p-4 rounded shadow w-96 h-24");

  // Classes for the regular phrase/translation.
  const titleClass = fullScreen
    ? "text-7xl font-bold text-white mb-4"
    : "text-xl font-bold text-white mb-2";
  const subtitleClass = fullScreen
    ? "text-5xl font-bold text-gray-100 mt-5"
    : "text-md font-bold text-gray-100 mt-3";

  // Class for the title prop (slightly larger).
  const titlePropClass = fullScreen
    ? "text-8xl font-bold text-white mb-4"
    : "text-2xl font-bold text-white mb-2";

  // Build container style: if bgImage is provided, add background styling.
  const containerStyle = bgImage
    ? {
      backgroundColor: containerBg,
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      overflow: "hidden",
    }
    : {
      backgroundColor: containerBg,
      overflow: "hidden",
    };

  return (
    // Append the 'cursor-none' class when idle.
    <div className={`${containerClass} ${isIdle ? "cursor-none" : ""}`} style={containerStyle}>
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
              transition: { duration: TITLE_ANIMATION_DURATION / 1000, ease: "easeOut" } // no delay here
            }}
            className="text-center absolute flex flex-col"
            style={{
              maxWidth: "600px",
              padding: 20,
              alignItems: "center",
              justifyContent: "center",
              textShadow: `2px 2px 2px ${textBg}`,
              color: textBg,
              backgroundColor: textBg.includes("rgb")
                ? (textBg.slice(0, -1) + " 0.7)").replaceAll(" ", ",")
                : textBg,
              borderRadius: "1rem"
            }}
          >
            <h1 className={titlePropClass} style={{ margin: 0, padding: 0 }}>
              {title}
            </h1>
          </motion.div>

        ) : (
          // Otherwise, render the currentPhrase/currentTranslated view.
          (currentTranslated || currentPhrase) && (
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center p-12 absolute flex bg-opacity-90 flex-col"
              style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: textBg.includes("rgb")
                  ? (textBg.slice(0, -1) + " 0.9)").replaceAll(" ", ",")
                  : textBg,
                borderRadius: '1rem'

              }}
            >
              <h2 className={titleClass} style={{ margin: 0, padding: 0 }}>
                {currentPhase === "input"
                  ? currentPhrase?.trim()
                  : currentTranslated?.trim()}
              </h2>
              {currentPhase === "output" && romanizedOutput && (
                <h2 className={subtitleClass}>{romanizedOutput}</h2>
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
