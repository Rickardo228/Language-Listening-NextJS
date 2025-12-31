export type TransportMetadata = {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  durationSec?: number; // total of the *current* "virtual track" (clip or delay)
};

// Removed TransportPosition - not used by the app

export type TransportCapabilities = {
  canPlayPause?: boolean;
  canNextPrev?: boolean;
  // Removed canSeek - not used by the app
};

export interface Transport {
  // App → OS
  setMetadata(meta: TransportMetadata): void;
  setCapabilities(cap: TransportCapabilities): void;

  // OS → App
  onPlay(cb: () => void): void;
  onPause(cb: () => void): void;
  onNext(cb: () => void): void;
  onPrevious(cb: () => void): void;

  dispose(): void;
}