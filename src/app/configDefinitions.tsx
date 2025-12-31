// configDefinitions.ts
import { PresentationConfig } from "./types";

type BaseConfigFieldDefinition = {
  key: keyof PresentationConfig;
  label: string;
  description?: string;
  decorator?: () => React.ReactElement;
  disabledWhen?: (config: PresentationConfig) => boolean;
  adminOnly?: boolean;
};

type RangeConfigFieldDefinition = BaseConfigFieldDefinition & {
  inputType: "range";
  min: number;
  max: number;
  step: number;
};

type SelectConfigFieldDefinition = BaseConfigFieldDefinition & {
  inputType: "select";
  options: { value: number | string; label: string }[];
};

type OtherConfigFieldDefinition = BaseConfigFieldDefinition & {
  inputType: "text" | "number" | "checkbox" | "file" | "color";
};

export type ConfigFieldDefinition =
  | RangeConfigFieldDefinition
  | SelectConfigFieldDefinition
  | OtherConfigFieldDefinition;

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
  { key: "bgImage", label: "Background Image", inputType: "file" },
  {
    key: "backgroundOverlayOpacity",
    label: "Background Overlay",
    inputType: "range",
    min: 0,
    max: 0.8,
    step: 0.05,
    description: "Darken the image behind the text to keep it readable.",
    disabledWhen: (config) => !config.bgImage,
  },
  {
    key: "textColor",
    label: "Text Color",
    inputType: "select",
    options: [
      { value: "", label: "Auto (System)" },
      { value: "dark", label: "Dark Text" },
      { value: "light", label: "Light Text" },
    ],
    description: "Override text color for better readability with your background image.",
    disabledWhen: (config) => !config.bgImage,
  },
  {
    key: "enableLoop",
    label: "Loop",
    inputType: "checkbox",
    description:
      "Automatically restart from the beginning when reaching the end of all phrases.",
  },
  {
    key: "enableInputPlayback",
    label: "Play Input Audio",
    inputType: "checkbox",
    description:
      "Enable or disable playback of the input language audio for each phrase.",
  },
  {
    key: "enableInputDurationDelay",
    label: "Recall",
    inputType: "checkbox",
    description:
      "Pause between the input and output of a phrase to test your memory by recalling it.",
    decorator: () => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Improve your memory
      </span>
    ),
    disabledWhen: (config) => !config.enableInputPlayback,
  },
  {
    key: "enableOutputDurationDelay",
    label: "Shadow",
    inputType: "checkbox",
    description:
      "Pause after each phrase to practice your pronunciation by repeating it.",
    decorator: () => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Practice your pronunciation
      </span>
    ),
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
    label: "Show English & Italian",
    inputType: "checkbox",
    description:
      "Display input, translation, and romanization simultaneously with highlighting for the current phase.",
    decorator: () => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        Beta
      </span>
    ),
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
  {
    key: "containerBg",
    label: "Video Background Color",
    inputType: "color",
    description: "The background color of the video container",
  },
  {
    key: "textBg",
    label: "Text Background Color",
    inputType: "color",
    description: "The background color behind the text",
  },
  { key: "enableSnow", label: "Enable Snow Effect", inputType: "checkbox", adminOnly: true },
  {
    key: "enableCherryBlossom",
    label: "Enable Cherry Blossom Effect",
    inputType: "checkbox",
    adminOnly: true,
  },
  { key: "enableLeaves", label: "Enable Leaves Effect", inputType: "checkbox", adminOnly: true },
  {
    key: "enableAutumnLeaves",
    label: "Enable Autumn Leaves Effect",
    inputType: "checkbox",
    adminOnly: true,
  },
  {
    key: "enableOrtonEffect",
    label: "Enable Orton Effect",
    inputType: "checkbox",
    adminOnly: true,
  },
  {
    key: "enableParticles",
    label: "Enable Particle Effect",
    inputType: "checkbox",
    adminOnly: true,
  },
  {
    key: "particleRotation",
    label: "Particle/Dust Direction",
    inputType: "select",
    options: [
      { value: -1, label: "Random" },
      { value: 0, label: "0°" },
      { value: 45, label: "45°" },
      { value: 90, label: "90°" },
      { value: 135, label: "135°" },
      { value: 180, label: "180°" },
      { value: 225, label: "225°" },
      { value: 270, label: "270°" },
      { value: 315, label: "315°" },
    ],
    description: "Set direction for particle/dust effects",
    adminOnly: true,
    disabledWhen: (config) => !config.enableParticles && !config.enableDust,
  },
  {
    key: "enableSteam",
    label: "Enable Steam Effect",
    inputType: "checkbox",
    adminOnly: true,
  },
  {
    key: "enableDust",
    label: "Enable Dust Effect",
    inputType: "checkbox",
    adminOnly: true,
  },
  {
    key: "particleColor",
    label: "Dust Color",
    inputType: "select",
    options: [
      { value: "green", label: "Green" },
      { value: "blue", label: "Blue" },
      { value: "purple", label: "Purple" },
      { value: "gold", label: "Gold" },
      { value: "white", label: "White" },
      { value: "red", label: "Red" },
      { value: "orange", label: "Orange" },
    ],
    description: "Set the color of dust effect particles",
    adminOnly: true,
    disabledWhen: (config) => !config.enableDust,
  },
  {
    key: "particleSpeed",
    label: "Effect Speed",
    inputType: "range",
    min: 0.25,
    max: 3.0,
    step: 0.25,
    description: "Control the speed of particle and dust effects (higher = faster)",
    adminOnly: true,
    disabledWhen: (config) => !config.enableDust && !config.enableParticles,
  },
  {
    key: "dustOpacity",
    label: "Dust Opacity",
    inputType: "range",
    min: 0.1,
    max: 1.0,
    step: 0.1,
    description: "Control the opacity of dust effect particles (lower = more subtle)",
    adminOnly: true,
    disabledWhen: (config) => !config.enableDust,
  },
  {
    key: "postProcessDelay",
    label: "Delay After Processing (ms)",
    inputType: "number",
    adminOnly: true,
  },
  {
    key: "delayBetweenPhrases",
    label: "Delay Between Phrases (ms)",
    inputType: "number",
    description: "Fixed delay between phrases in milliseconds",
    adminOnly: true,
  },
];
