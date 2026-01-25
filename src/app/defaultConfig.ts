import { PresentationConfig } from "./types";
import { CollectionType } from "./types";

const basePresentationConfig: PresentationConfig = {
  name: "",
  bgImage: null,
  containerBg: "",
  textBg: "",
  backgroundOverlayOpacity: 0.35,
  enableSnow: false,
  enableCherryBlossom: false,
  enableLeaves: false,
  enableAutumnLeaves: false,
  enableOrtonEffect: false,
  enableParticles: false,
  particleRotation: 0,
  enableSteam: false,
  enableDust: false,
  particleColor: "green",
  particleSpeed: 1.0,
  dustOpacity: 1.0,
  enableLoop: false,
  postProcessDelay: 0,
  delayBetweenPhrases: 1000,
  enableOutputDurationDelay: true,
  enableInputDurationDelay: false,
  enableOutputBeforeInput: false,
  enableInputPlayback: true,
  inputPlaybackSpeed: 1.0,
  outputPlaybackSpeed: 1.0,
  showAllPhrases: false,
};
export const defaultPresentationConfigs: Record<
  CollectionType,
  PresentationConfig
> = {
  phrases: basePresentationConfig,
  article: {
    ...basePresentationConfig,
    enableLoop: false,
    enableOutputDurationDelay: false,
  },
};

export const defaultPresentationConfig = basePresentationConfig;
