import React from 'react';

interface ParticleAnimationProps {
    rotation?: number;
    speed?: number; // Speed multiplier (default 1.0)
}

const ParticleAnimation: React.FC<ParticleAnimationProps> = ({ rotation = 0, speed = 1.0 }) => {
    return (
        <div
            className="full-wh"
            style={{
                transform: `rotate(${rotation}deg)`,
                // Use CSS variables to control animation speed
                ['--stars2-duration' as any]: `${100 / speed}s`,
                ['--stars3-duration' as any]: `${150 / speed}s`,
                ['--stars4-duration' as any]: `${600 / speed}s`,
            }}
        >
            <div className="bg-animation">
                <div id='stars'></div>
                <div id='stars2'></div>
                <div id='stars3'></div>
                <div id='stars4'></div>
            </div>
        </div>
    );
};

export default ParticleAnimation;
