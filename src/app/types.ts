// types.ts
export type CollectionType = "phrases" | "article";

export type PresentationConfig = {
  name: string;
  bgImage: string | null;
  containerBg: string;
  textBg: string;
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
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "es-ES", label: "Español (España)" },
  { code: "fr-FR", label: "Français (France)" },
  { code: "de-DE", label: "Deutsch (Deutschland)" },
  { code: "it-IT", label: "Italiano (Italia)" },
  { code: "ja-JP", label: "日本語 (Japan) - Japanese" },
  { code: "zh-CN", label: "简体中文 (China) - Chinese" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "el-GR", label: "Ελληνικά (Greece) - Greek" },
  { code: "pl-PL", label: "Polski (Polska)" },
  { code: "sv-SE", label: "Svenska (Sverige)" },
  { code: "de-CH", label: "Schweizerdeutsch (Schweiz)" },
  { code: "ru-RU", label: "Русский (Russia) - Russian" },
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
