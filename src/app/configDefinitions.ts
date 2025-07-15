// configDefinitions.ts
import { PresentationConfig } from "./types";

export type ConfigFieldDefinition = {
  key: keyof PresentationConfig;
  label: string;
  inputType: "text" | "number" | "checkbox" | "file" | "color" | "select";
  description?: string;
  options?: { value: number; label: string }[];
};

// Shared speed options to avoid duplication
export const playbackSpeedOptions = [
  { value: 0.75, label: "0.75x" },
  { value: 0.85, label: "0.85x" },
  { value: 1.0, label: "1.0x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2.0, label: "2.0x" },
];

export const presentationConfigDefinition: ConfigFieldDefinition[] = [
  // { key: "bgImage", label: "Background Image", inputType: "file" },
  {
    key: "enableLoop",
    label: "Loop",
    inputType: "checkbox",
    description:
      "Automatically restart from the beginning when reaching the end of all phrases.",
  },
  {
    key: "enableOutputDurationDelay",
    label: "Shadow",
    inputType: "checkbox",
    description:
      "Pause after each phrase to practice your pronunciation by repeating it.",
  },
  {
    key: "enableInputDurationDelay",
    label: "Recall",
    inputType: "checkbox",
    description:
      "Pause between the input and output of a phrase to test your memory by recalling it.",
  },
  {
    key: "enableOutputBeforeInput",
    label: "Play Output Before Input",
    inputType: "checkbox",
    description:
      "Play the output audio before the input audio for each phrase.",
  },
  {
    key: "showAllPhrases",
    label: "Show All Phrases",
    inputType: "checkbox",
    description:
      "Display input, translation, and romanization simultaneously with highlighting for the current phase.",
  },
  {
    key: "inputPlaybackSpeed",
    label: "Input Language Speed",
    inputType: "select",
    options: playbackSpeedOptions,
    description: "Control the playback speed of input language audio.",
  },
  {
    key: "outputPlaybackSpeed",
    label: "Output Language Speed",
    inputType: "select",
    options: playbackSpeedOptions,
    description: "Control the playback speed of output language audio.",
  },
  // {
  //   key: "containerBg",
  //   label: "Video Background Color",
  //   inputType: "color",
  //   description: "The background color of the video container",
  // },
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
