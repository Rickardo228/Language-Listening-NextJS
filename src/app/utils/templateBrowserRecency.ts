const STORAGE_PREFIX = 'template-browser-recency';

export const DEFAULT_INPUT_LANG = 'en-GB';
export const DEFAULT_TARGET_LANG = 'it-IT';

interface TemplateBrowserRecencyKeyParams {
    userId?: string | null;
    inputLang: string;
    targetLang: string;
}

interface TemplateBrowserRecencyUpdateParams extends TemplateBrowserRecencyKeyParams {
    browserId: string;
    maxEntries?: number;
}

export function getTemplateBrowserStorageKey({
    userId,
    inputLang,
    targetLang,
}: TemplateBrowserRecencyKeyParams) {
    if (!userId) {
        return null;
    }
    return `${STORAGE_PREFIX}:${userId}:${inputLang}-${targetLang}`;
}

export function getRecentTemplateBrowserIds(
    params: TemplateBrowserRecencyKeyParams
): string[] {
    if (typeof window === 'undefined') {
        return [];
    }
    if (!params.userId) {
        return [];
    }

    try {
        const key = getTemplateBrowserStorageKey(params);
        if (!key) return [];
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((id) => typeof id === 'string');
    } catch (error) {
        console.warn('[templateBrowserRecency] Unable to read recency data', error);
        return [];
    }
}

export function recordTemplateBrowserUsage({
    browserId,
    maxEntries = 20,
    ...params
}: TemplateBrowserRecencyUpdateParams) {
    if (typeof window === 'undefined') {
        return [];
    }
    if (!params.userId) {
        return [];
    }

    try {
        const key = getTemplateBrowserStorageKey(params);
        if (!key) return [];
        const existing = getRecentTemplateBrowserIds(params);
        const next = [browserId, ...existing.filter((id) => id !== browserId)].slice(
            0,
            maxEntries
        );

        window.localStorage.setItem(key, JSON.stringify(next));
        return next;
    } catch (error) {
        console.warn('[templateBrowserRecency] Unable to update recency data', error);
        return [];
    }
}
