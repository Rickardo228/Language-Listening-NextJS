import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let isInitialized = false;

export const initMixpanel = () => {
  console.log("Initializing Mixpanel...");
  console.log("MIXPANEL_TOKEN available:", !!MIXPANEL_TOKEN);
  console.log("Environment:", process.env.NODE_ENV);

  if (!MIXPANEL_TOKEN) {
    console.warn("Mixpanel token is missing! Check your .env file.");
    return;
  }

  console.log("Mixpanel token found, initializing...");
  mixpanel.init(MIXPANEL_TOKEN, { autocapture: true });

  // Set environment information
  setEnvironmentInfo();
  isInitialized = true;
  console.log("Mixpanel initialized successfully!");
};

export const setEnvironmentInfo = () => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;

  const environment = process.env.NODE_ENV || "development";
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || "unknown";

  // Set environment properties for all events
  mixpanel.register({
    environment,
    app_version: version,
    build_time: buildTime,
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
    language: typeof navigator !== "undefined" ? navigator.language : "unknown",
  });
};

export const identifyUser = (userId: string, email?: string) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;

  // Identify the user with their unique ID
  mixpanel.identify(userId);

  // Set user properties if email is provided
  if (email) {
    const environment = process.env.NODE_ENV || "development";
    const version = process.env.NEXT_PUBLIC_APP_VERSION || "unknown";

    mixpanel.people.set({
      $email: email,
      $name: email.split("@")[0], // Use email prefix as name
      userId: userId,
      email: email,
      environment,
      app_version: version,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
  }
};

export const setUserProperties = (
  properties: Record<string, string | number | boolean>
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.people.set(properties);
};

export const trackPageView = (url: string) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Page View", { url });
};

export const trackSignUp = (userId: string, method: string = "email") => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Sign Up", {
    userId,
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackLogin = (userId: string, method: string = "email") => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Login", {
    userId,
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackAudioEnded = (
  phraseId: string,
  duration: number,
  collectionId?: string
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Audio Ended", {
    phraseId,
    duration,
    collectionId,
    timestamp: new Date().toISOString(),
  });
};

export const trackCreateList = (
  collectionId: string,
  collectionName: string,
  phraseCount: number,
  collectionType: string,
  inputLang: string,
  targetLang: string
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Create List", {
    collectionId,
    collectionName,
    phraseCount,
    collectionType,
    inputLang,
    targetLang,
    timestamp: new Date().toISOString(),
  });
};

export const trackSelectList = (
  collectionId: string,
  collectionName: string,
  phraseCount: number,
  inputLang: string,
  targetLang: string
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Select List", {
    collectionId,
    collectionName,
    phraseCount,
    inputLang,
    targetLang,
    timestamp: new Date().toISOString(),
  });
};

export const trackCreatePhrase = (
  phraseId: string,
  inputLang: string,
  targetLang: string,
  hasAudio: boolean
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Create Phrase", {
    phraseId,
    inputLang,
    targetLang,
    hasAudio,
    timestamp: new Date().toISOString(),
  });
};

export const trackGeneratePhrases = (
  prompt: string,
  inputLang: string,
  targetLang: string,
  collectionType: string,
  phraseCount: number
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Generate Phrases", {
    prompt,
    inputLang,
    targetLang,
    collectionType,
    phraseCount,
    timestamp: new Date().toISOString(),
  });
};

export const trackPlaybackEvent = (
  eventType: "play" | "pause" | "stop" | "replay" | "next" | "previous",
  phraseId: string,
  phase: "input" | "output",
  phraseIndex: number,
  playbackSpeed: number
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Playback Control", {
    eventType,
    phraseId,
    phase,
    phraseIndex,
    playbackSpeed,
    timestamp: new Date().toISOString(),
  });
};

export const trackPhrasesListenedPopup = (
  action: "show" | "continue" | "view_stats" | "escape_dismiss",
  phrasesCount: number,
  isPersistent: boolean,
  sessionEndType?: "natural" | "manual"
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track("Phrases Listened Popup", {
    action,
    phrasesCount,
    isPersistent,
    sessionEndType,
    timestamp: new Date().toISOString(),
  });
};

// Generic tracking function for other events
export const track = (
  eventName: string,
  properties?: Record<string, string | number | boolean>
) => {
  if (!MIXPANEL_TOKEN || !isInitialized) return;
  mixpanel.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
};
