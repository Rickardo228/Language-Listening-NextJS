// Home.tsx
'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PresentationView } from './PresentationView';
import { Maximize2, Settings, X } from 'lucide-react';
import bgColorOptions from './utils/bgColorOptions';
import { AudioSegment, Config, languageOptions, RomanizedOutput } from './types';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { presentationConfigDefinition } from './configDefinitions';
import ConfigFields from './ConfigFields';

export default function Home() {
  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [inputLang, setInputLang] = useState<string>(languageOptions[0]?.code);
  const [targetLang, setTargetLang] = useState<string>('it-IT');

  // Presentation configuration (bg, effects, delays, etc.) via our custom hook.
  const { presentationConfig, setPresentationConfig } = usePresentationConfig();

  // Loading state for processing
  const [loading, setLoading] = useState<boolean>(false);

  // Playback and sequence control states
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
  const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>('input');
  const [finished, setFinished] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [translated, setTranslated] = useState<string[]>([]);
  const [inputAudioSegments, setInputAudioSegments] = useState<AudioSegment[]>([]);
  const [outputAudioSegments, setOutputAudioSegments] = useState<AudioSegment[]>([]);
  const [romanizedOutput, setRomanizedOutput] = useState<RomanizedOutput[]>([]);

  // Config saving states
  const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
  const [configName, setConfigName] = useState<string>('');

  // Ref for the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved configs from localStorage on mount
  useEffect(() => {
    const storedConfigs = localStorage.getItem('savedConfigs');
    if (storedConfigs) {
      setSavedConfigs(JSON.parse(storedConfigs));
    }
  }, []);

  const handleProcess = async () => {
    const phrases = phrasesInput.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!phrases.length) return;

    setLoading(true);
    try {
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
    } catch (err) {
      console.error('Processing error:', err);
    }
    setLoading(false);
    setTimeout(() => {
      setCurrentPhraseIndex(0);
    }, presentationConfig.postProcessDelay);
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
  }, [currentPhraseIndex, currentPhase, inputAudioSegments, outputAudioSegments]);

  // When a saved config is selected, load its state (including presentationConfig).
  const handleLoadConfig = (config: Config) => {
    setPhrasesInput(config.phrasesInput);
    setInputLang(config.inputLang);
    setTargetLang(config.targetLang);
    setPresentationConfig({
      bgImage: config.bgImage,
      containerBg: config.containerBg,
      textBg: config.textBg,
      enableSnow: config.enableSnow,
      enableCherryBlossom: config.enableCherryBlossom,
      enableLeaves: config.enableLeaves,
      enableAutumnLeaves: config.enableAutumnLeaves,
      enableOrtonEffect: config.enableOrtonEffect,
      postProcessDelay: config.postProcessDelay,
      delayBetweenPhrases: config.delayBetweenPhrases,
    });
  };

  // Save the current config into localStorage (including presentationConfig)
  const handleSaveConfig = () => {
    const containerColorName =
      bgColorOptions.find((opt) => opt.value === presentationConfig.containerBg)?.name || "Custom";
    const textColorName =
      bgColorOptions.find((opt) => opt.value === presentationConfig.textBg)?.name || "Custom";
    const generatedName =
      `${inputLang}→${targetLang} [C:${containerColorName}, T:${textColorName}]` +
      (presentationConfig.enableSnow ? " ❄️" : "") +
      (presentationConfig.enableCherryBlossom ? " 🌸" : "") +
      (presentationConfig.enableLeaves ? " 🍂" : "") +
      (presentationConfig.enableAutumnLeaves ? " 🍁" : "");
    const finalName = configName.trim() ? configName.trim() : generatedName;
    const newConfig: Config = {
      name: finalName,
      phrasesInput,
      inputLang,
      targetLang,
      ...presentationConfig,
    };
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
    setConfigName('');
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
      }, presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    } else {
      const outputDuration = audioRef.current?.duration || 1;
      const timeoutId = window.setTimeout(() => {
        if (currentPhraseIndex < (inputAudioSegments?.length || 0) - 1) {
          setCurrentPhraseIndex(currentPhraseIndex + 1);
          setCurrentPhase('input');
        } else {
          setFinished(true);
        }
      }, (outputDuration * 1500) + presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    }
  };

  const handleReplay = () => {
    clearAllTimeouts();
    setCurrentPhraseIndex(-1);
    setCurrentPhase('input');
    setFinished(false);
    const timeoutId = window.setTimeout(() => {
      setCurrentPhraseIndex(0);
    }, presentationConfig.postProcessDelay);
    timeoutIds.current.push(timeoutId);
  };

  // Handle background image upload via our new config setter.
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPresentationConfig({ bgImage: url });
    }
  };

  // Close fullscreen on Esc key press.
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

  // Auto-generate a config name if none is provided.
  useEffect(() => {
    if (!configName.trim()) {
      const containerColorName =
        bgColorOptions.find((opt) => opt.value === presentationConfig.containerBg)?.name || "Custom";
      const textColorName =
        bgColorOptions.find((opt) => opt.value === presentationConfig.textBg)?.name || "Custom";
      const defaultName =
        `${inputLang}→${targetLang} [C:${containerColorName}, T:${textColorName}]` +
        (presentationConfig.enableSnow ? " ❄️" : "") +
        (presentationConfig.enableCherryBlossom ? " 🌸" : "") +
        (presentationConfig.enableLeaves ? " 🍂" : "") +
        (presentationConfig.enableAutumnLeaves ? " 🍁" : "");
      setConfigName(defaultName);
    }
  }, [inputLang, targetLang, presentationConfig, configName]);

  return (
    <div className="p-5 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Language Shadowing</h1>
      </div>

      {/* Controls: Language selection */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label htmlFor="inputLang" className="block font-medium mb-1">Input Language</label>
          <select id="inputLang" value={inputLang} onChange={(e) => setInputLang(e.target.value)} className="p-2 border border-gray-300 rounded">
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="targetLang" className="block font-medium mb-1">Output Language</label>
          <select id="targetLang" value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="p-2 border border-gray-300 rounded">
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
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

      {/* Config Save/Load Controls */}
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
          <button onClick={handleSaveConfig} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
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
                  <span onClick={() => handleLoadConfig(config)} className="cursor-pointer hover:underline">
                    {config.name}
                  </span>
                  <button onClick={() => handleDeleteConfig(idx)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="p-2 text-gray-700 hover:text-gray-900" title="Close Settings">
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Render the new ConfigFields component */}
            <ConfigFields
              definition={presentationConfigDefinition}
              config={presentationConfig}
              setConfig={setPresentationConfig}
              handleImageUpload={handleImageUpload}
            />
          </div>
        </div>
      )}

      {/* Process Button with Loading Spinner */}
      <button
        onClick={handleProcess}
        disabled={loading}
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 mb-4 flex items-center justify-center"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : "Process"}
      </button>

      {/* Audio element for playback */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="w-full mb-4" controls hidden />

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
            {(currentPhraseIndex && currentPhraseIndex > 0) && (
              <button onClick={handleReplay} className="ml-2 px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
                Replay
              </button>
            )}
          </div>
          <PresentationView
            currentPhrase={phrasesInput.split('\n')[currentPhraseIndex]}
            currentTranslated={translated[currentPhraseIndex] || ''}
            currentPhase={currentPhase}
            fullScreen={fullscreen}
            backgroundImage={presentationConfig.bgImage || undefined}
            onClose={() => setFullscreen(false)}
            enableSnow={presentationConfig.enableSnow}
            enableLeaves={presentationConfig.enableLeaves}
            enableAutumnLeaves={presentationConfig.enableAutumnLeaves}
            enableCherryBlossom={presentationConfig.enableCherryBlossom}
            enableOrtonEffect={presentationConfig.enableOrtonEffect}
            containerBg={presentationConfig.containerBg}
            textBg={presentationConfig.textBg}
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
              Now playing: {currentPhase === 'input' ? "Input audio" : "Translated audio"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
