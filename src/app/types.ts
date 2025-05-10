// types.ts
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
};

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
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "pt-PT", label: "Portuguese (Portugal)" },
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
