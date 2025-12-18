'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DustParticle {
  id: number;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
  scale: number;
  opacity: number;
  pathX: number[];
  pathY: number[];
}

interface DustEffectProps {
  fullScreen?: boolean;
  particleCount?: number;
  color?: string;
  direction?: number; // -1 for random, 0-360 for specific direction
  speed?: number; // Speed multiplier (default 1.0)
}

// Color mapping
const colorMap: Record<string, string> = {
  green: "#00FF00",
  blue: "#00BFFF",
  purple: "#B19CD9",
  gold: "#FFD700",
  white: "#FFFFFF",
  red: "#FF4444",
};

export function DustEffect({
  fullScreen = false,
  particleCount = 40,
  color = "green",
  direction = -1, // Default to random
  speed = 1.0 // Default speed multiplier
}: DustEffectProps) {
  const [particles, setParticles] = useState<DustParticle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get the actual color hex value
  const actualColor = colorMap[color] || color;

  // Ensure speed is valid (prevent division by zero or NaN)
  const safeSpeed = Math.max(0.1, speed || 1.0);

  // Initialize dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize particles
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const newParticles: DustParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const initialX = Math.random() * dimensions.width;
      const initialY = Math.random() * dimensions.height;

      // Calculate path based on direction
      let pathX: number[];
      let pathY: number[];

      if (direction === -1 || direction === undefined) {
        // Random path with more waypoints for less predictable movement
        const numWaypoints = 5 + Math.floor(Math.random() * 3); // 5-7 waypoints
        pathX = Array.from({ length: numWaypoints }, () => Math.random() * dimensions.width);
        pathY = Array.from({ length: numWaypoints }, () => Math.random() * dimensions.height);
      } else {
        // Directional path - continuous movement in one direction
        const rad = (direction * Math.PI) / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);
        const distance = Math.sqrt(dimensions.width ** 2 + dimensions.height ** 2);

        pathX = [
          initialX + dx * (distance * 0.33),
          initialX + dx * (distance * 0.66),
          initialX + dx * distance,
        ];
        pathY = [
          initialY + dy * (distance * 0.33),
          initialY + dy * (distance * 0.66),
          initialY + dy * distance,
        ];
      }

      newParticles.push({
        id: i,
        initialX,
        initialY,
        duration: (Math.random() * 25 + 15) / safeSpeed, // 15-40 seconds with more variance, adjusted by speed
        delay: Math.random() * 10, // 0-10 seconds delay for more staggered starts
        scale: Math.random() * 1.2 + 0.3, // 0.3-1.5 scale with more variance
        opacity: Math.random() * 0.8 + 0.2, // 0.2-1.0 opacity (min 0.2 to keep visible)
        pathX,
        pathY,
      });
    }
    setParticles(newParticles);
  }, [dimensions, particleCount, direction, safeSpeed]);

  return (
    <div
      style={{
        position: fullScreen ? 'absolute' : 'static',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="dust-particle"
          initial={{
            x: particle.initialX,
            y: particle.initialY,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: particle.pathX,
            y: particle.pathY,
            opacity: [0, particle.opacity * 0.3, particle.opacity * 0.7, particle.opacity, particle.opacity * 0.7, particle.opacity * 0.3, 0],
            scale: [0, particle.scale * 0.5, particle.scale * 0.8, particle.scale, particle.scale * 0.8, particle.scale * 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            backgroundColor: actualColor,
            boxShadow: `0px 0px 10px 2px ${actualColor}`,
            borderRadius: '50%',
            zIndex: 2,
          }}
        />
      ))}
    </div>
  );
}
