'use client';

import { useState, useEffect } from "react";
import { AutumnLeaves } from "./Effects/AutumnLeaves";
import CherryBlossom from "./Effects/CherryBlossom";
import { RomanizedOutput } from "./page";

interface PresentationViewProps {
  currentPhrase: string;
  currentTranslated: string;
  currentPhase: "input" | "output";
  fullScreen: boolean; // if true, use fullscreen styles; if false, use inline styles
  onClose: () => void;
  backgroundImage?: string;
  enableSnow?: boolean;
  enableLeaves?: boolean;
  enableAutumnLeaves?: boolean;
  enableCherryBlossom?: boolean;
  enableOrtonEffect?: boolean;
  containerBg?: string; // New prop for container background color (default: 'bg-teal-500')
  textBg?: string;      // New prop for text container background color (default: 'bg-rose-400')
  romanizedOutput?: RomanizedOutput;
}

export function PresentationView({
  currentPhrase,
  currentTranslated,
  currentPhase,
  fullScreen,
  onClose,
  backgroundImage,
  enableSnow,
  enableLeaves,
  enableAutumnLeaves,
  enableCherryBlossom,
  enableOrtonEffect,
  containerBg = "bg-teal-500", // default value if not provided
  textBg = "bg-rose-400",       // default value if not provided
  romanizedOutput,
}: PresentationViewProps) {
  // State to track if the mouse is idle.
  const [isIdle, setIsIdle] = useState(false);

  // useEffect to detect mouse movement and mark idle after 1 second.
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const handleMouseMove = () => {
      // When moving the mouse, ensure the cursor is visible.
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 1000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    // Set the initial timer.
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

  // Conditionally set title and subtitle classes.
  const titleClass = fullScreen
    ? "text-7xl font-bold text-white mb-4"
    : "text-xl font-bold text-white mb-2";
  const subtitleClass = fullScreen
    ? "text-5xl font-bold text-gray-100 mt-5"
    : "text-md font-bold text-gray-100 mt-3";

  // Build container style: if backgroundImage is provided, add background styling.
  const containerStyle = backgroundImage
    ? {
      backgroundColor: containerBg,
      backgroundImage: `url(${backgroundImage})`,
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
      {enableOrtonEffect && <div style={{
        mixBlendMode: "lighten",
        filter: "blur(50px)",
        opacity: "50%",
        backgroundImage: `url(${backgroundImage})`,
        width: '100%',
        height: '100%'
      }}></div>}
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

      {(currentTranslated || currentPhrase) && (
        <div
          className={`text-center p-12 absolute flex bg-opacity-90 flex-col`}
          style={{
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: textBg.includes("rgb")
              ? (textBg.slice(0, -1) + " 0.9)").replaceAll(" ", ",")
              : textBg,
          }}
        >
          <h2 className={titleClass} style={{ margin: 0, padding: 0 }}>
            {currentPhase === "input" ? currentPhrase?.trim() : currentTranslated?.trim()}
          </h2>
          {currentPhase === "output" && romanizedOutput && (
            <h2 className={subtitleClass}>{romanizedOutput}</h2>
          )}
        </div>
      )}
    </div>
  );
}
