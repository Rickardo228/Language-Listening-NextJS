import { PresentationConfig } from "./types";
import { CollectionType } from "./types";

const basePresentationConfig: PresentationConfig = {
  name: "",
  bgImage: null,
  containerBg: "rgb(20 184 166)",
  textBg: "rgb(20 184 166)",
  enableSnow: false,
  enableCherryBlossom: false,
  enableLeaves: false,
  enableAutumnLeaves: false,
  enableOrtonEffect: false,
  enableParticles: false,
  enableSteam: false,
  enableLoop: true,
  postProcessDelay: 0,
  delayBetweenPhrases: 1000,
  enableOutputDurationDelay: true,
  enableInputDurationDelay: false,
  enableOutputBeforeInput: false,
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
