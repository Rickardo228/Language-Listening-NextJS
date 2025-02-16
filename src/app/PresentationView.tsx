'use client';

import { useEffect } from "react";

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
  containerBg = "bg-teal-500", // default value if not provided
  textBg = "bg-rose-400"        // default value if not provided
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
      {enableAutumnLeaves && <AutumnLeaves />}
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

const AutumnLeaves = ({ fullScreen }: { fullScreen?: boolean }) => {

  useEffect(() => {
    let canvas = document.querySelector('canvas');
    if (canvas) {
      let ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;

        let width = canvas.width;
        let height = canvas.height;
        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        let leaf: HTMLImageElement = document.querySelector('#leaf') as HTMLImageElement;

        if (leaf) {
          let leafs: {
            x: number,
            y: number,
            w: number,
            h: number,
            v: number,
            a: number,
            d: number
          }[] = [];
          let count = 10;

          for (let i = 0; i < count; i++) {
            let angle = 15 + Math.random() * 30
            let dir = [-1, 1][Math.floor(Math.random() * 2)];

            leafs.push({
              x: Math.random() * width,
              y: Math.random() * height,
              w: 30,
              h: 30 * (leaf.height / leaf.width),
              v: 20 / angle,
              a: angle,
              d: dir
            });
          }

          function update() {
            for (let i = 0; i < leafs.length; i++) {
              leafs[i].y += leafs[i].v;

              if (leafs[i].y > height) {
                leafs[i].y = -120;
                leafs[i].x = Math.random() * width;
              }
            }
          }

          function draw(dt?: number) {
            requestAnimationFrame(draw);
            update();
            if (ctx) {

              ctx.clearRect(0, 0, width, height);

              for (let i = 0; i < leafs.length; i++) {
                ctx.save();

                ctx.translate(leafs[i].x, leafs[i].y);

                ctx.rotate(leafs[i].d * Math.sin((dt ?? 1) * 0.002 * i * 0.01) * leafs[i].a * Math.PI / 180);

                ctx.globalAlpha = Math.max(0.1, leafs[i].y * 0.05);
                ctx.drawImage(leaf, -leafs[i].w / 2, 70, leafs[i].w, leafs[i].h);

                ctx.restore();
              }
            }
          }
          draw();
        }

      }

    }

  }, [fullScreen])

  return (<>
    <canvas style={{ position: fullScreen ? 'fixed' : 'static', display: 'block', height: '100vh', width: '100%', }} width="460" height="320"></canvas>

    <img id="leaf" style={{ display: 'none' }} src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgc3R5bGU9Imlzb2xhdGlvbjppc29sYXRlIiB2aWV3Qm94PSIwIDAgMjYgMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIxMiI+PGRlZnM+PGNsaXBQYXRoIGlkPSJfY2xpcFBhdGhfRkN4bE4yZHJvS0JYTXlwQmZ2VnM3ejNpSGdlU3hGSngiPjxyZWN0IHdpZHRoPSIyNiIgaGVpZ2h0PSIxMiIvPjwvY2xpcFBhdGg+PC9kZWZzPjxnIGNsaXAtcGF0aD0idXJsKCNfY2xpcFBhdGhfRkN4bE4yZHJvS0JYTXlwQmZ2VnM3ejNpSGdlU3hGSngpIj48cGF0aCBkPSIgTSAxNC45OTIgMTEuNzExIEMgMTAuNDUgMTIuNDIyIDUuNDczIDEwLjk4MiAwLjA2MSA3LjM5IFEgMy45NzIgMS41MTUgMTEuNzAxIDAuMTQxIEMgMTUuODkzIC0wLjEyNiAyMC43ODQgMS40OTYgMjUuOTM5IDQuODczIFEgMjEuODQ5IDkuNjg4IDE0Ljk5MiAxMS43MTEgWiAiIGZpbGw9InJnYigyMjIsODgsNTEpIi8+PC9nPjwvc3ZnPg==" /></>)
}
