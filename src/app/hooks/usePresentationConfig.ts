// hooks/usePresentationConfig.ts
import { useState } from "react";
import { PresentationConfig } from "../types";
import { defaultPresentationConfig } from "../defaultConfig";

export function usePresentationConfig(initial?: Partial<PresentationConfig>) {
  const [presentationConfig, setPresentationConfigState] =
    useState<PresentationConfig>({
      ...defaultPresentationConfig,
      ...initial,
    } as PresentationConfig);

  const setPresentationConfig = (newConfig: Partial<PresentationConfig>) => {
    setPresentationConfigState((prev) => ({ ...prev, ...newConfig }));
  };

  return { presentationConfig, setPresentationConfig };
}
