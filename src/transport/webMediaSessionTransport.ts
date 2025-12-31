import {
  Transport,
  TransportCapabilities,
  TransportMetadata,
} from "./transport";

type Handlers = {
  play?: () => void;
  pause?: () => void;
  next?: () => void;
  prev?: () => void;
  // Removed seekTo - not used by the app
};

export class WebMediaSessionTransport implements Transport {
  private handlers: Handlers = {};
  private disposed = false;

  constructor(private audioEl?: HTMLAudioElement | null) {
    if (!("mediaSession" in navigator)) return;

    const ms = navigator.mediaSession;

    // Basic action handlers → delegate to registered callbacks
    ms.setActionHandler("play", () => this.handlers.play?.());
    ms.setActionHandler("pause", () => this.handlers.pause?.());
    ms.setActionHandler("nexttrack", () => this.handlers.next?.());
    ms.setActionHandler("previoustrack", () => this.handlers.prev?.());

    // Optional seek support
    try {
      // ms.setActionHandler('seekto', (e: MediaSessionActionDetails) => {
      //   const sec = Number(e.seekTime ?? 0);
      //   this.handlers.seekTo?.(sec);
      // });
      // ms.setActionHandler('seekforward', (e: MediaSessionActionDetails) => this.handlers.seekTo?.((this._getPosSec() ?? 0) + (e.seekOffset ?? 10)));
      // ms.setActionHandler('seekbackward', (e: MediaSessionActionDetails) => this.handlers.seekTo?.((this._getPosSec() ?? 0) - (e.seekOffset ?? 10)));
    } catch {
      // Not all browsers support seek actions
    }

    // No position tracking needed - removed timeupdate/ratechange listeners
  }

  setMetadata(meta: TransportMetadata): void {
    if (!("mediaSession" in navigator)) return;
    const artwork = meta.artworkUrl
      ? [{ src: meta.artworkUrl, sizes: "512x512", type: "image/png" }]
      : [];

    // Get duration from audio element to signal track-based content
    const duration = this.audioEl?.duration;
    const finiteDuration =
      duration && isFinite(duration) ? duration : undefined;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title || " ",
      artist: meta.artist || " ",
      album: meta.album || " ",
      artwork,
      ...(finiteDuration && { duration: finiteDuration }),
    });
  }

  // Removed setPosition - not used by the app

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCapabilities(_cap: TransportCapabilities): void {
    // Media Session has no explicit capability toggles;
    // capability is implied by which action handlers we set.
    // We already set handlers in constructor; if needed we could clear them here.
  }

  onPlay(cb: () => void): void {
    this.handlers.play = cb;
  }
  onPause(cb: () => void): void {
    this.handlers.pause = cb;
  }
  onNext(cb: () => void): void {
    this.handlers.next = cb;
  }
  onPrevious(cb: () => void): void {
    this.handlers.prev = cb;
  }
  // Removed onSeekTo - not used by the app

  reapplyHandlers(): void {
    if (!("mediaSession" in navigator)) return;

    const ms = navigator.mediaSession;

    // No seek handlers to clear - app doesn't use seeking

    // Reapply next/prev handlers (critical for iOS)
    ms.setActionHandler("nexttrack", () => this.handlers.next?.());
    ms.setActionHandler("previoustrack", () => this.handlers.prev?.());
    ms.setActionHandler("play", () => this.handlers.play?.());
    ms.setActionHandler("pause", () => this.handlers.pause?.());

    // Note: We don't override playbackState here anymore since the parent component
    // manages virtual delay states via setMSState calls. This prevents conflicts
    // between audio element state and virtual delay state.
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    // No cleanup needed since we removed the event listeners
  }

  // Removed updatePositionFromAudio - not used since setPosition was removed

  // Removed _getPosSec - not needed without position tracking
}
