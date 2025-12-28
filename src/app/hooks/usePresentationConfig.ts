// hooks/usePresentationConfig.ts
import { useCallback, useState } from "react";
import { PresentationConfig } from "../types";
import { defaultPresentationConfig } from "../defaultConfig";

export function usePresentationConfig(initial?: Partial<PresentationConfig>) {
  const [presentationConfig, setPresentationConfigState] =
    useState<PresentationConfig>({
      ...defaultPresentationConfig,
      ...initial,
    } as PresentationConfig);

  const setPresentationConfig = useCallback(
    (newConfig: Partial<PresentationConfig>) => {
      setPresentationConfigState((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  return { presentationConfig, setPresentationConfig };
}
