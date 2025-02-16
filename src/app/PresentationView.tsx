'use client';

import { AutumnLeaves } from "./Effects/AutumnLeaves";
import CherryBlossom from "./Effects/CherryBlossom";

interface PresentationViewProps {
  currentPhrase: string;
  currentTranslated: string;
  currentPhase: 'input' | 'output';
  fullScreen: boolean; // if true, use fullscreen styles; if false, use inline styles
  onClose: () => void;
  backgroundImage?: string;
  enableSnow?: boolean;
  enableLeaves?: boolean;
  enableAutumnLeaves?: boolean;
  enableCherryBlossom?: boolean;
  containerBg?: string; // New prop for container background color class (default: 'bg-teal-500')
  textBg?: string;      // New prop for text container background color class (default: 'bg-rose-400')
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
  containerBg = "bg-teal-500", // default value if not provided
  textBg = "bg-rose-400",        // default value if not provided
}: PresentationViewProps) {
  // Conditionally set container classes based on the fullScreen prop.
  const containerClass =
    `inset-0 flex flex-col items-center justify-center ` +
    (fullScreen ? "fixed z-50" : "relative p-4 rounded shadow w-96 h-24");

  // Conditionally set title and subtitle classes.
  const titleClass = fullScreen
    ? "text-5xl font-bold text-white mb-4"
    : "text-xl font-bold text-white mb-2";
  const subtitleClass = fullScreen
    ? "text-xl italic text-gray-300"
    : "text-sm italic text-gray-600";

  // Build container style: if backgroundImage is provided, add background styling.
  const containerStyle = backgroundImage
    ? {
      backgroundColor: containerBg,
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      overflow: 'hidden'
    }
    : {
      backgroundColor: containerBg,
      overflow: 'hidden'
    };



  return (
    <div className={containerClass} style={containerStyle}>
      {enableSnow && (
        <div className="wrapper" style={{ position: fullScreen ? 'absolute' : 'static' }}>
          <div className="snow layer1 a"></div>
          <div className="snow layer1"></div>
          <div className="snow layer2 a"></div>
          <div className="snow layer2"></div>
          <div className="snow layer3 a"></div>
          <div className="snow layer3"></div>
        </div>
      )}
      {enableLeaves && (

        <div id="leaves" style={{ position: fullScreen ? 'absolute' : 'static' }}>
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


      {fullScreen && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
          title="Exit Presentation Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className={`text-center p-12 absolute flex bg-opacity-90`}
        style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: (textBg.slice(0, -1) + ' 0.9)').replaceAll(' ', ',') }}>
        <h2 className={titleClass} style={{ margin: 0, padding: 0 }}>
          {currentPhase === 'input' ? currentPhrase?.trim() : currentTranslated?.trim()}
        </h2>
      </div>
    </div>
  );
}


