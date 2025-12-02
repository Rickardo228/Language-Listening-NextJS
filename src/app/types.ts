// types.ts
export type CollectionType = "phrases" | "article";

export type PresentationConfig = {
  name: string;
  bgImage: string | null;
  containerBg: string;
  textBg: string;
  backgroundOverlayOpacity?: number;
  textColor?: 'dark' | 'light';
  enableSnow: boolean;
  enableCherryBlossom: boolean;
  enableLeaves: boolean;
  enableAutumnLeaves: boolean;
  enableOrtonEffect: boolean;
  enableParticles?: boolean;
  enableSteam?: boolean;
  postProcessDelay: number;
  delayBetweenPhrases: number;
  enableLoop: boolean;
  enableOutputDurationDelay: boolean;
  enableInputDurationDelay: boolean;
  enableOutputBeforeInput?: boolean;
  enableInputPlayback: boolean;
  inputPlaybackSpeed?: number;
  outputPlaybackSpeed?: number;
  showAllPhrases?: boolean;
};

export type Config = {
  id: string;
  name: string;
  phrases: Phrase[];
  created_at?: string;
  inputVoice?: string;
  targetVoice?: string;
  presentationConfig?: PresentationConfig;
  collectionType?: CollectionType;
};

export type RomanizedOutput = string[];

export const languageOptions = [
  { code: "en-GB", label: "🇬🇧 English (UK)" },
  { code: "en-US", label: "🇺🇸 English (US)" },
  { code: "en-AU", label: "🇦🇺 English (Australia)" },
  { code: "es-ES", label: "🇪🇸 Español (España)" },
  { code: "fr-FR", label: "🇫🇷 Français (France)" },
  { code: "de-DE", label: "🇩🇪 Deutsch (Deutschland)" },
  { code: "it-IT", label: "🇮🇹 Italiano (Italia)" },
  { code: "ja-JP", label: "🇯🇵 日本語 (Japan)" },
  { code: "cmn-CN", label: "🇨🇳 简体中文 (China)" },
  { code: "pt-BR", label: "🇧🇷 Português (Brasil)" },
  { code: "pt-PT", label: "🇵🇹 Português (Portugal)" },
  { code: "el-GR", label: "🇬🇷 Ελληνικά (Greece)" },
  { code: "pl-PL", label: "🇵🇱 Polski (Polska)" },
  { code: "sv-SE", label: "🇸🇪 Svenska (Sverige)" },
  { code: "ru-RU", label: "🇷🇺 Русский (Russia)" },

  // 🌍 Widely spoken additions
  { code: "hi-IN", label: "🇮🇳 हिंदी (India)" },
  { code: "ar-XA", label: "🇸🇦 العربية (Arabic)" },
  { code: "bn-IN", label: "🇧🇩 বাংলা (Bengali)" },
  { code: "id-ID", label: "🇮🇩 Bahasa Indonesia" },
  { code: "ko-KR", label: "🇰🇷 한국어 (Korea)" },
  { code: "tr-TR", label: "🇹🇷 Türkçe (Turkey)" },
  { code: "vi-VN", label: "🇻🇳 Tiếng Việt (Vietnam)" },
  { code: "th-TH", label: "🇹🇭 ภาษาไทย (Thailand)" },
  { code: "uk-UA", label: "🇺🇦 Українська (Ukraine)" },

  // Bonus / strategic
  { code: "fr-CA", label: "🇨🇦 Français (Canada)" },
  { code: "nl-NL", label: "🇳🇱 Nederlands (Netherlands)" },
  { code: "yue-HK", label: "🇭🇰 粤语 (Cantonese - Hong Kong)" },
  { code: "ta-IN", label: "🇮🇳 தமிழ் (Tamil)" },
];

export type AudioSegment = {
  audioUrl: string;
  duration: number;
};

export type Phrase = {
  input: string;
  translated: string;
  inputAudio: AudioSegment | null;
  inputLang: string;
  inputVoice?: string;
  outputAudio: AudioSegment | null;
  targetLang: string;
  targetVoice?: string;
  romanized: string;
  useRomanizedForAudio?: boolean;
  created_at?: string;
};

export interface ProgressData {
  collectionId: string;
  itemType: "template" | "collection";
  lastPhraseIndex: number;
  lastPhase: "input" | "output";
  lastAccessedAt: string;
  completedAt?: string;
  inputLang: string;
  targetLang: string;
  listenedPhraseIndices?: number[];
}
