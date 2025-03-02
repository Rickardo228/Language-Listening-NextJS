// types.ts
export type PresentationConfig = {
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
};

export type Config = {
  name: string;
  phrasesInput: string;
  phrases: Phrase[];
  inputLang: string;
  targetLang: string;
} & PresentationConfig;

export type RomanizedOutput = string[];

export const languageOptions = [
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "fr-FR", label: "French (France)" },
  { code: "de-DE", label: "German (Germany)" },
  { code: "it-IT", label: "Italian (Italy)" },
  { code: "ja-JP", label: "Japanese (Japan)" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
];

export type AudioSegment = {
  audioUrl: string;
  duration: number;
};

export type Phrase = {
  input: string;
  translated: string;
  inputAudio: AudioSegment | null;
  outputAudio: AudioSegment | null;
  romanized: string;
  useRomanizedForAudio?: boolean;
};
