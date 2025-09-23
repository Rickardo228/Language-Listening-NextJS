export type TransportMetadata = {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  durationSec?: number; // total of the *current* "virtual track" (clip or delay)
};

export type TransportPosition = {
  positionSec: number;
  durationSec: number;
  rate: number; // 0 = paused/stopped, 1 = playing (or use playback speed)
};

export type TransportCapabilities = {
  canPlayPause?: boolean;
  canNextPrev?: boolean;
  canSeek?: boolean;
};

export interface Transport {
  // App → OS
  setMetadata(meta: TransportMetadata): void;
  setPosition(pos: TransportPosition): void;
  setCapabilities(cap: TransportCapabilities): void;

  // OS → App
  onPlay(cb: () => void): void;
  onPause(cb: () => void): void;
  onNext(cb: () => void): void;
  onPrevious(cb: () => void): void;
  onSeekTo?(cb: (sec: number) => void): void;

  dispose(): void;
}