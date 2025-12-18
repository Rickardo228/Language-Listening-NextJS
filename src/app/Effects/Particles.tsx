import { useEffect, useState } from 'react';

interface ParticleEffectProps {
  speed?: number; // Speed multiplier (default 1.0)
}

const ParticleEffect = ({ speed = 1.0 }: ParticleEffectProps) => {
  const [dynamicStyles, setDynamicStyles] = useState('');

  useEffect(() => {
    const particleNum = 100;
    const particleWidth = 50; // maximum particle width in pixels (adjust as needed)
    let styles = '';
    const random = (max: number) => Math.floor(Math.random() * max);

    for (let i = 1; i <= particleNum; i++) {
      const circleSize = random(particleWidth) + 10; // add a minimum size so it isn't 0
      const startPositionY = random(10) + 100;
      const moveDuration = (7000 + random(4000)) / speed; // Adjusted by speed
      const animationDelay = random(11000);
      const circleAnimationDelay = random(4000);
      const vwVal = random(100);
      const fromY = startPositionY;
      const toY = -startPositionY - random(30);
      const framesName = `move-frames-${i}`;

      styles += `
        .circle-container:nth-child(${i}) {
          width: ${circleSize}px;
          height: ${circleSize}px;
          animation-name: ${framesName};
          animation-duration: ${moveDuration}ms;
          animation-delay: ${animationDelay}ms;
        }
        @keyframes ${framesName} {
          from {
            transform: translate3d(${vwVal}vw, ${fromY}vh, 0);
          }
          to {
            transform: translate3d(${vwVal}vw, ${toY}vh, 0);
          }
        }
        .circle-container:nth-child(${i}) .circle {
          animation-delay: ${circleAnimationDelay}ms;
        }
      `;
    }
    setDynamicStyles(styles);
  }, [speed]);

  return (
    <>
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0 }}>
        {[...Array(100)].map((_, i) => (
          <div key={i} className="circle-container">
            <div className="circle" />
          </div>
        ))}
      </div>
      <style jsx>{`
        .circle-container {
          top: 0;
          position: absolute;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
        .circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          mix-blend-mode: screen;
          background-image: radial-gradient(
            hsl(180, 100%, 80%),
            hsl(180, 100%, 80%) 10%,
            hsla(180, 100%, 80%, 0) 56%
          );
          animation: fade-frames 200ms infinite, scale-frames 2s infinite;
        }
        @keyframes fade-frames {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes scale-frames {
          0% { transform: scale3d(0.4, 0.4, 1); }
          50% { transform: scale3d(2.2, 2.2, 1); }
          100% { transform: scale3d(0.4, 0.4, 1); }
        }
      `}</style>
      {/* Inject our dynamically generated styles */}
      <style jsx>{dynamicStyles}</style>
    </>
  );
};

export default ParticleEffect;
