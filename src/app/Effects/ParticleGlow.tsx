import React, { useMemo } from 'react';

interface ParticleAnimationProps {
    rotation?: number;
    speed?: number; // Speed multiplier (default 1.0)
}

const ParticleAnimation: React.FC<ParticleAnimationProps> = ({ rotation = 0, speed = 1.0 }) => {

    // If rotation is -1 (random), generate a random rotation angle
    const actualRotation = useMemo(() => {
        if (rotation === -1) {
            return Math.floor(Math.random() * 360);
        }
        return rotation;
    }, [rotation]);

    return (
        <div
            className="full-wh"
            style={{
                transform: `rotate(${actualRotation}deg)`,
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
