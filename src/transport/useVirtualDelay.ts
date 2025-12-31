import { useRef, useCallback } from 'react';

export type VirtualDelay = {
  start: (totalMs: number) => void;
  clear: () => void;
  isActive: () => boolean;
  getPositionSec: () => number;
  getDurationSec: () => number;
  getRemainingMs: () => number;
};

export function useVirtualDelay(): VirtualDelay {
  const totalMsRef = useRef(0);
  const startAtRef = useRef<number | null>(null);

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const start = useCallback((totalMs: number) => {
    totalMsRef.current = Math.max(0, totalMs);
    startAtRef.current = now();
  }, []);

  const clear = useCallback(() => {
    totalMsRef.current = 0;
    startAtRef.current = null;
  }, []);

  const isActive = useCallback(() => {
    return startAtRef.current !== null && totalMsRef.current > 0;
  }, []);

  const getElapsedMs = useCallback(() => {
    if (startAtRef.current == null) return 0;
    return Math.max(0, now() - startAtRef.current);
  }, []);

  const getPositionSec = useCallback(() => {
    const posMs = Math.min(totalMsRef.current, getElapsedMs());
    return posMs / 1000;
  }, [getElapsedMs]);

  const getDurationSec = useCallback(() => totalMsRef.current / 1000, []);
  const getRemainingMs = useCallback(() => Math.max(0, totalMsRef.current - getElapsedMs()), [getElapsedMs]);

  return { start, clear, isActive, getPositionSec, getDurationSec, getRemainingMs };
}