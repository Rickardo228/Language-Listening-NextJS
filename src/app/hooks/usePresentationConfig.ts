// hooks/usePresentationConfig.ts
import { useState } from "react";
import { PresentationConfig } from "../types";

export function usePresentationConfig(initial?: Partial<PresentationConfig>) {
  const [presentationConfig, setPresentationConfigState] =
    useState<PresentationConfig>({
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
      postProcessDelay: 0,
      // postProcessDelay: 5000,
      delayBetweenPhrases: 1250,
      ...initial,
    });

  const setPresentationConfig = (newConfig: Partial<PresentationConfig>) => {
    setPresentationConfigState((prev) => ({ ...prev, ...newConfig }));
  };

  return { presentationConfig, setPresentationConfig };
}
