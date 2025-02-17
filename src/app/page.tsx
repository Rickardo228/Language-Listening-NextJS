'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PresentationView } from './PresentationView';
import { Maximize2, Settings, X } from 'lucide-react';
import bgColorOptions from './utils/bgColorOptions';

interface AudioSegment {
  audioUrl: string;
  localFilePath: string;
  duration: number; // in seconds (may be estimated)
}

export type RomanizedOutput = string[];

const languageOptions = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'it-IT', label: 'Italian (Italy)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
];

const DELAY_BETWEEN_PHRASES = 1000;

// Define the type for a saved config.
type Config = {
  name: string;
  phrasesInput: string;
  inputLang: string;
  targetLang: string;
  bgImage: string | null;
  containerBg: string;
  textBg: string;
  enableSnow: boolean;
  enableCherryBlossom: boolean;
  enableLeaves: boolean;
  enableAutumnLeaves: boolean;
  enableOrtonEffect: boolean;
};

export default function Home() {
  // User input
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  // Language selection
  const [inputLang, setInputLang] = useState<string>(languageOptions[0]?.code);
  const [targetLang, setTargetLang] = useState<string>('it-IT');
  // Background image URL from upload
  const [bgImage, setBgImage] = useState<string | null>(null);
  // New states for background colors and effects
  const [containerBg, setContainerBg] = useState<string>("rgb(20 184 166)");
  const [textBg, setTextBg] = useState<string>("rgb(20 184 166)");
  const [enableSnow, setEnableSnow] = useState<boolean>(false);
  const [enableCherryBlossom, setEnableCherryBlossom] = useState<boolean>(false);
  const [enableLeaves, setEnableLeaves] = useState<boolean>(false);
  const [enableAutumnLeaves, setEnableAutumnLeaves] = useState<boolean>(false);
  const [enableOrtonEffect, setEnableOrtonEffect] = useState<boolean>(false);


  // Playback and sequence control states...
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
  const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>('input');
  const [finished, setFinished] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [translated, setTranslated] = useState<string[]>([]);
  const [inputAudioSegments, setInputAudioSegments] = useState<AudioSegment[]>([]);
  const [outputAudioSegments, setOutputAudioSegments] = useState<AudioSegment[]>([]);
  const [romanizedOutput, setRomanizedOutput] = useState<RomanizedOutput[]>([]);

  // New state for saved configs and the config name input.
  const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
  const [configName, setConfigName] = useState<string>('');

  // Ref for the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved configs from localStorage on mount.
  useEffect(() => {
    const storedConfigs = localStorage.getItem('savedConfigs');
    if (storedConfigs) {
      setSavedConfigs(JSON.parse(storedConfigs));
    }
  }, []);

  const handleProcess = async () => {
    const phrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!phrases.length) return;

    const response = await fetch('http://localhost:3000/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phrases,
        inputLang,
        targetLang,
      }),
    });
    const data = await response.json();
    setTranslated(data.translated || []);
    setInputAudioSegments(data.inputAudioSegments || []);
    setOutputAudioSegments(data.outputAudioSegments || []);
    setRomanizedOutput(data.romanizedOutput || []);
    setCurrentPhraseIndex(-1);
    setCurrentPhase('input');
    setFinished(false);
    setTimeout(() => {
      setCurrentPhraseIndex(0);
    }, 5000); // Delay playback
  };

  // Update audio source when phrase or phase changes.
  useEffect(() => {
    if (currentPhraseIndex < 0) return;
    let src = '';
    if (currentPhase === 'input' && inputAudioSegments[currentPhraseIndex]) {
      src = inputAudioSegments[currentPhraseIndex].audioUrl;
    } else if (currentPhase === 'output' && outputAudioSegments[currentPhraseIndex]) {
      src = outputAudioSegments[currentPhraseIndex].audioUrl;
    }
    if (audioRef.current && src) {
      audioRef.current.playbackRate = 0.4;
      audioRef.current.src = src;
      audioRef.current.play().catch((err) => console.error('Auto-play error:', err));
    }
  }, [
    currentPhraseIndex,
    currentPhase,
    inputAudioSegments,
    outputAudioSegments,
  ]);


  // When a saved config is selected, load its state.
  const handleLoadConfig = (config: Config) => {
    setPhrasesInput(config.phrasesInput);
    setInputLang(config.inputLang);
    setTargetLang(config.targetLang);
    setBgImage(config.bgImage);
    setContainerBg(config.containerBg);
    setTextBg(config.textBg);
    setEnableSnow(config.enableSnow);
    setEnableCherryBlossom(config.enableCherryBlossom);
    setEnableLeaves(config.enableLeaves);
    setEnableAutumnLeaves(config.enableAutumnLeaves);
    setEnableOrtonEffect(config.enableOrtonEffect);
  };

  // Save the current config into localStorage.
  const handleSaveConfig = () => {
    const containerColorName =
      bgColorOptions.find((opt) => opt.value === containerBg)?.name || "Custom";
    const textColorName =
      bgColorOptions.find((opt) => opt.value === textBg)?.name || "Custom";

    const generatedName =
      `${inputLang}→${targetLang} [C:${containerColorName}, T:${textColorName}]` +
      (enableSnow ? " ❄️" : "") +
      (enableCherryBlossom ? " 🌸" : "") +
      (enableLeaves ? " 🍂" : "") +
      (enableAutumnLeaves ? " 🍁" : "");

    // Use the provided configName if available; otherwise, use the generated name.
    const finalName = configName.trim() ? configName.trim() : generatedName;

    const newConfig: Config = {
      name: finalName,
      phrasesInput,
      inputLang,
      targetLang,
      bgImage,
      containerBg,
      textBg,
      enableSnow,
      enableCherryBlossom,
      enableLeaves,
      enableAutumnLeaves,
      enableOrtonEffect,
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
    setConfigName(''); // clear the input after saving
  };

  // Delete a config from the saved list.
  const handleDeleteConfig = (index: number) => {
    const updatedConfigs = savedConfigs.filter((_, idx) => idx !== index);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
  };

  const timeoutIds = useRef<number[]>([]);
  const clearAllTimeouts = () => {
    timeoutIds.current.forEach((id) => clearTimeout(id));
    timeoutIds.current = [];
  };

  const handleAudioEnded = () => {
    if (currentPhase === 'input') {
      const timeoutId = window.setTimeout(() => {
        setCurrentPhase('output');
      }, DELAY_BETWEEN_PHRASES);
      timeoutIds.current.push(timeoutId);
    } else {
      const outputDuration = audioRef.current?.duration || 1; // Default to 1s if duration is unavailable
      const timeoutId = window.setTimeout(() => {
        if (currentPhraseIndex < (inputAudioSegments?.length || 0) - 1) {
          setCurrentPhraseIndex(currentPhraseIndex + 1);
          setCurrentPhase('input');
        } else {
          setFinished(true);
        }
      }, (outputDuration * 1500) + DELAY_BETWEEN_PHRASES);
      timeoutIds.current.push(timeoutId);
    }
  };


  const handleReplay = () => {
    // Kill any existing timeouts.
    clearAllTimeouts();

    setCurrentPhraseIndex(-1);
    setCurrentPhase('input');
    setFinished(false);
    const timeoutId = window.setTimeout(() => {
      setCurrentPhraseIndex(0);
    }, 5000);
    timeoutIds.current.push(timeoutId);
  };


  // Handle background image upload; create a blob URL from the selected file.
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };


  // Close fullscreen on esc key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Settings button
  const SettingsButton = (
    <button
      onClick={() => setSettingsOpen(true)}
      className="p-2 bg-gray-200 rounded hover:bg-gray-300"
      title="Settings"
    >
      <Settings className="h-8 w-8 text-gray-700" />
    </button>
  );

  useEffect(() => {
    // Only update if the user hasn't typed anything.
    if (!configName.trim()) {
      const containerColorName =
        bgColorOptions.find((opt) => opt.value === containerBg)?.name || "Custom";
      const textColorName =
        bgColorOptions.find((opt) => opt.value === textBg)?.name || "Custom";

      const defaultName =
        `${inputLang}→${targetLang} [C:${containerColorName}, T:${textColorName}]` +
        (enableSnow ? " ❄️" : "") +
        (enableCherryBlossom ? " 🌸" : "") +
        (enableLeaves ? " 🍂" : "") +
        (enableAutumnLeaves ? " 🍁" : "");
      setConfigName(defaultName);
    }
  }, [
    inputLang,
    targetLang,
    containerBg,
    textBg,
    enableSnow,
    enableCherryBlossom,
    enableLeaves,
    enableAutumnLeaves,
    configName,
  ]);


  // Render UI
  return (
    <div className="p-5 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Language Shadowing</h1>
      </div>

      {/* Controls: Language selection */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label htmlFor="inputLang" className="block font-medium mb-1">
            Input Language
          </label>
          <select
            id="inputLang"
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="targetLang" className="block font-medium mb-1">
            Output Language
          </label>
          <select
            id="targetLang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Textarea for input phrases */}
      <textarea
        placeholder="Enter phrases, one per line"
        value={phrasesInput}
        onChange={(e) => setPhrasesInput(e.target.value)}
        rows={6}
        className="w-full p-2 text-lg border border-gray-300 rounded mb-4"
      />

      {/* New Config Save/Load Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            id="configName"
            placeholder="Enter config name (optional)"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Save Config
          </button>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Saved Configs</h3>
          {savedConfigs.length === 0 ? (
            <p>No configs saved.</p>
          ) : (
            <ul className="list-disc pl-5">
              {savedConfigs.map((config, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span
                    onClick={() => handleLoadConfig(config)}
                    className="cursor-pointer hover:underline"
                  >
                    {config.name}
                  </span>
                  <button
                    onClick={() => handleDeleteConfig(idx)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={handleProcess}
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Process
      </button>

      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="w-full mb-4"
        controls
        hidden
      />

      <div className="h-8" />

      {/* Presentation view and controls */}
      {typeof currentPhraseIndex === "number" && (
        <>
          <div className="flex mb-2 items-center gap-2">
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              title={fullscreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
            >
              <Maximize2 className="h-8 w-8 text-gray-700" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              title="Settings"
            >
              <Settings className="h-8 w-8 text-gray-700" />
            </button>
            {(currentPhraseIndex && (currentPhraseIndex > 0)) && (
              <button
                onClick={handleReplay}
                className="ml-2 px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Replay
              </button>
            )}
          </div>
          <PresentationView
            currentPhrase={phrasesInput.split('\n')[currentPhraseIndex]}
            currentTranslated={translated[currentPhraseIndex] || ''}
            currentPhase={currentPhase}
            fullScreen={fullscreen}
            backgroundImage={bgImage || undefined}
            onClose={() => setFullscreen(false)}
            enableSnow={enableSnow}
            enableLeaves={enableLeaves}
            enableAutumnLeaves={enableAutumnLeaves}
            enableCherryBlossom={enableCherryBlossom}
            enableOrtonEffect={enableOrtonEffect}
            containerBg={containerBg}
            textBg={textBg}
            romanizedOutput={romanizedOutput[currentPhraseIndex]}
          />
        </>
      )}

      {/* Inline display of the current phrase */}
      {currentPhraseIndex >= 0 && !finished && (
        <div className="mt-5">
          <h2 className="text-2xl font-bold mb-2">
            Phrase {currentPhraseIndex + 1} of {inputAudioSegments?.length || 0}
          </h2>
          <div className="mb-4">
            <p className="text-xl">
              <span className="font-semibold">Input:</span>{" "}
              {phrasesInput.split('\n')[currentPhraseIndex]}
            </p>
            <p className="text-xl">
              <span className="font-semibold">Translated:</span>{" "}
              {translated[currentPhraseIndex]}
            </p>
            <p className="text-lg italic">
              Now playing:{" "}
              {currentPhase === 'input' ? "Input audio" : "Translated audio"}
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 text-gray-700 hover:text-gray-900"
                title="Close Settings"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="containerBg" className="block font-medium mb-1">
                  Container Background Color
                </label>
                <input
                  list="bgColorOptions"
                  type="text"
                  id="containerBg"
                  placeholder="Select a color"
                  value={containerBg}
                  onChange={(e) => setContainerBg(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="textBg" className="block font-medium mb-1">
                  Text Background Color
                </label>
                <input
                  list="bgColorOptions"
                  type="text"
                  id="textBg"
                  placeholder="Select a color"
                  value={textBg}
                  onChange={(e) => setTextBg(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="bgImage" className="block font-medium mb-1">
                  Background Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="bgImage"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSnow"
                  checked={enableSnow}
                  onChange={(e) => setEnableSnow(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableSnow" className="font-medium">
                  Enable Snow Effect
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableLeaves"
                  checked={enableLeaves}
                  onChange={(e) => setEnableLeaves(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableLeaves" className="font-medium">
                  Enable Leaves Effect
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableAutumnLeaves"
                  checked={enableAutumnLeaves}
                  onChange={(e) => setEnableAutumnLeaves(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableAutumnLeaves" className="font-medium">
                  Enable Autumn Leaves Effect
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableCherryBlossom"
                  checked={enableCherryBlossom}
                  onChange={(e) => setEnableCherryBlossom(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableCherryBlossom" className="font-medium">
                  Enable Cherry Blossom Effect
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableOrtonEffect"
                  checked={enableOrtonEffect}
                  onChange={(e) => setEnableOrtonEffect(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableOrtonEffect" className="font-medium">
                  Enable Orton Effect
                </label>
              </div>
            </div>
            <datalist id="bgColorOptions">
              {bgColorOptions.map((option) => (
                <option key={option.name} value={option.value}>
                  {option.name}
                </option>
              ))}
            </datalist>
          </div>
        </div>
      )}
    </div>
  );
}
