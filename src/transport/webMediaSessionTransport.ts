import { Transport, TransportCapabilities, TransportMetadata, TransportPosition } from './transport';

type Handlers = {
  play?: () => void;
  pause?: () => void;
  next?: () => void;
  prev?: () => void;
  seekTo?: (sec: number) => void;
};

export class WebMediaSessionTransport implements Transport {
  private handlers: Handlers = {};
  private disposed = false;

  constructor(private audioEl?: HTMLAudioElement | null) {
    if (!('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;

    // Basic action handlers → delegate to registered callbacks
    ms.setActionHandler('play', () => this.handlers.play?.());
    ms.setActionHandler('pause', () => this.handlers.pause?.());
    ms.setActionHandler('nexttrack', () => this.handlers.next?.());
    ms.setActionHandler('previoustrack', () => this.handlers.prev?.());

    // Optional seek support
    try {
      ms.setActionHandler('seekto', (e: any) => {
        const sec = Number(e.seekTime ?? 0);
        this.handlers.seekTo?.(sec);
      });
    } catch {
      // Not all browsers support seekto
    }

    // Keep OS position in sync while real audio is playing
    const tick = () => this.updatePositionFromAudio();
    audioEl?.addEventListener('timeupdate', tick);
    audioEl?.addEventListener('ratechange', tick);

    // Store a cleanup ref on the instance
    (this as any)._cleanup = () => {
      audioEl?.removeEventListener('timeupdate', tick);
      audioEl?.removeEventListener('ratechange', tick);
    };
  }

  setMetadata(meta: TransportMetadata): void {
    if (!('mediaSession' in navigator)) return;
    const artwork = meta.artworkUrl ? [{ src: meta.artworkUrl, sizes: '512x512', type: 'image/png' }] : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title || ' ',
      artist: meta.artist || ' ',
      album: meta.album || ' ',
      artwork,
    });
    // duration is provided via setPosition()
  }

  setPosition(pos: TransportPosition): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: isFinite(pos.durationSec) ? pos.durationSec : 0,
        position: Math.max(0, Math.min(pos.positionSec, pos.durationSec)),
        playbackRate: pos.rate,
      });
    } catch {
      // Some browsers may throw if position state is not supported
    }
  }

  setCapabilities(cap: TransportCapabilities): void {
    // Media Session has no explicit capability toggles;
    // capability is implied by which action handlers we set.
    // We already set handlers in constructor; if needed we could clear them here.
  }

  onPlay(cb: () => void): void { this.handlers.play = cb; }
  onPause(cb: () => void): void { this.handlers.pause = cb; }
  onNext(cb: () => void): void { this.handlers.next = cb; }
  onPrevious(cb: () => void): void { this.handlers.prev = cb; }
  onSeekTo(cb: (sec: number) => void): void { this.handlers.seekTo = cb; }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if ((this as any)._cleanup) (this as any)._cleanup();
    // It's OK to leave mediaSession handlers in place; the page is disposing anyway.
  }

  private updatePositionFromAudio(): void {
    if (!('mediaSession' in navigator) || !this.audioEl) return;
    const el = this.audioEl;
    const duration = isFinite(el.duration) ? el.duration : 0;
    const position = el.currentTime || 0;
    const rate = el.playbackRate || (el.paused ? 0 : 1);
    this.setPosition({ durationSec: duration, positionSec: position, rate });
  }
}