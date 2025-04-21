// configDefinitions.ts
import { PresentationConfig } from "./types";

export type ConfigFieldDefinition = {
  key: keyof PresentationConfig;
  label: string;
  inputType: "text" | "number" | "checkbox" | "file" | "color";
};

export const presentationConfigDefinition: ConfigFieldDefinition[] = [
  // { key: "bgImage", label: "Background Image", inputType: "file" },
  {
    key: "containerBg",
    label: "Video Background Color",
    inputType: "color",
  },
  { key: "textBg", label: "Text Background Color", inputType: "color" },
  // { key: "enableSnow", label: "Enable Snow Effect", inputType: "checkbox" },
  // {
  //   key: "enableCherryBlossom",
  //   label: "Enable Cherry Blossom Effect",
  //   inputType: "checkbox",
  // },
  // { key: "enableLeaves", label: "Enable Leaves Effect", inputType: "checkbox" },
  // {
  //   key: "enableAutumnLeaves",
  //   label: "Enable Autumn Leaves Effect",
  //   inputType: "checkbox",
  // },
  // {
  //   key: "enableOrtonEffect",
  //   label: "Enable Orton Effect",
  //   inputType: "checkbox",
  // },
  // {
  //   key: "enableParticles",
  //   label: "Enable Particle Effect",
  //   inputType: "checkbox",
  // },
  // {
  //   key: "enableSteam",
  //   label: "Enable Steam Effect",
  //   inputType: "checkbox",
  // },
  // {
  //   key: "postProcessDelay",
  //   label: "Delay After Processing (ms)",
  //   inputType: "number",
  // },
  {
    key: "delayBetweenPhrases",
    label: "Delay Between Phrases (ms)",
    inputType: "number",
  },
];
