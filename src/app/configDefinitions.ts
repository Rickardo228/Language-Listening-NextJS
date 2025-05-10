// configDefinitions.ts
import { PresentationConfig } from "./types";

export type ConfigFieldDefinition = {
  key: keyof PresentationConfig;
  label: string;
  inputType: "text" | "number" | "checkbox" | "file" | "color";
  description?: string;
};

export const presentationConfigDefinition: ConfigFieldDefinition[] = [
  // { key: "bgImage", label: "Background Image", inputType: "file" },
  {
    key: "enableLoop",
    label: "Loop",
    inputType: "checkbox",
    description:
      "Automatically restart from the beginning when reaching the end",
  },
  {
    key: "enableOutputDurationDelay",
    label: "Use Output Duration Delay",
    inputType: "checkbox",
    description:
      "Wait for the output audio to finish before moving to the next phrase",
  },
  {
    key: "enableInputDurationDelay",
    label: "Use Input Duration Delay",
    inputType: "checkbox",
    description: "Wait for the input audio to finish before playing the output",
  },
  {
    key: "containerBg",
    label: "Video Background Color",
    inputType: "color",
    description: "The background color of the video container",
  },
  // {
  //   key: "textBg",
  //   label: "Text Background Color",
  //   inputType: "color",
  //   description: "The background color behind the text",
  // },
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
  // {
  //   key: "delayBetweenPhrases",
  //   label: "Delay Between Phrases (ms)",
  //   inputType: "number",
  //   description: "Fixed delay between phrases in milliseconds",
  // },
];
