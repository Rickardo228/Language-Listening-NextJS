type MetaPixelParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const isMetaPixelEnabled = Boolean(META_PIXEL_ID);

export function trackMetaPixel(eventName: string, params?: MetaPixelParams) {
  if (!isMetaPixelEnabled) return;
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;

  if (params) {
    window.fbq('track', eventName, params);
    return;
  }

  window.fbq('track', eventName);
}
