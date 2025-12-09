import React from 'react';

interface ParticleAnimationProps {
    rotation?: number;
}

const ParticleAnimation: React.FC<ParticleAnimationProps> = ({ rotation = 0 }) => {
    return (
        <div
            className="full-wh"
            style={{
                transform: `rotate(${rotation}deg)`,
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
