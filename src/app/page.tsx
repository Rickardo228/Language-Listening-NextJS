'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PresentationView, TITLE_ANIMATION_DURATION } from './PresentationView';
import { Maximize2, Settings, X } from 'lucide-react';
import bgColorOptions from './utils/bgColorOptions';
import { Config, languageOptions, Phrase } from './types';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { presentationConfigDefinition } from './configDefinitions';
import ConfigFields from './ConfigFields';

const DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER = 1.5;
export const BLEED_START_DELAY = 3000;
export const TITLE_DELAY = 3000;
const LAG_COMPENSATION = 300;

export default function Home() {
  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [inputLang, setInputLang] = useState<string>(languageOptions[0]?.code);
  const [targetLang, setTargetLang] = useState<string>('it-IT');

  // Instead of multiple arrays, we now store all per-phrase data in one state variable.
  const [phrases, setPhrases] = useState<Phrase[]>([]);

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
  const [recordScreen, setRecordScreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  // Config saving states
  const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
  const [configName, setConfigName] = useState<string>('');

  // Ref for the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  const timeoutIds = useRef<number[]>([]);

  // Load saved configs from localStorage on mount.
  useEffect(() => {
    const storedConfigs = localStorage.getItem('savedConfigs');
    if (storedConfigs) {
      setSavedConfigs(JSON.parse(storedConfigs));
    }
  }, []);

  const handleProcess = async () => {
    // Split the textarea input into an array of phrases.
    const splitPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!splitPhrases.length) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: splitPhrases,
          inputLang,
          targetLang,
        }),
      });
      const data = await response.json();
      // Combine API response arrays with the original input phrases.
      const processedPhrases: Phrase[] = splitPhrases.map((p, index) => ({
        input: p, // original text (editable later)
        translated: data.translated ? data.translated[index] || '' : '',
        inputAudio: data.inputAudioSegments ? data.inputAudioSegments[index] || null : null,
        outputAudio: data.outputAudioSegments ? data.outputAudioSegments[index] || null : null,
        romanized: data.romanizedOutput ? data.romanizedOutput[index] || '' : '',
      }));
      setPhrases(processedPhrases);
      setCurrentPhraseIndex(-1);
      setCurrentPhase('input');
      setFinished(false);



    } catch (err) {
      console.error('Processing error:', err);
      alert(err)
    }
    setLoading(false);
    setShowTitle(true);

    const timeoutId = window.setTimeout(() => {
      setShowTitle(false);
    }, presentationConfig.postProcessDelay + BLEED_START_DELAY - TITLE_ANIMATION_DURATION - 1000);
    timeoutIds.current.push(timeoutId)
    const timeoutId2 = window.setTimeout(() => {
      setCurrentPhraseIndex(0);
    }, presentationConfig.postProcessDelay + BLEED_START_DELAY);
    timeoutIds.current.push(timeoutId2)
  };

  // Update audio source when phrase or phase changes.
  useEffect(() => {
    if (currentPhraseIndex < 0) return;
    const currentPhraseObj = phrases[currentPhraseIndex];
    let src = '';
    if (currentPhase === 'input' && currentPhraseObj?.inputAudio) {
      src = currentPhraseObj.inputAudio.audioUrl;
    } else if (currentPhase === 'output' && currentPhraseObj?.outputAudio) {
      src = currentPhraseObj.outputAudio.audioUrl;
    }
    if (audioRef.current && src) {
      audioRef.current.playbackRate = 0.4;
      audioRef.current.src = src;
      audioRef.current.play().catch((err) => console.error('Auto-play error:', err));
    }
  }, [currentPhraseIndex, currentPhase, phrases]);

  // When a saved config is selected, load its state.
  const handleLoadConfig = (config: Config) => {
    setPhrasesInput(config.phrases ? config.phrases.map(p => p.input).join('\n') : config.phrasesInput || '');
    setPhrases(config.phrases || [])
    setInputLang(config.inputLang);
    setTargetLang(config.targetLang);
    setConfigName(config.name)
    setPresentationConfig({
      ...config
    });
  };

  // Save the current config into localStorage.
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
      ...presentationConfig,
      name: finalName,
      phrases,
      phrasesInput,
      inputLang,
      targetLang,
    };
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
    // setConfigName('');
  };

  // Delete a config from the saved list.
  const handleDeleteConfig = (index: number) => {
    const updatedConfigs = savedConfigs.filter((_, idx) => idx !== index);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
  };

  const clearAllTimeouts = () => {
    timeoutIds.current.forEach((id) => clearTimeout(id));
    timeoutIds.current = [];
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        preferCurrentTab: true, // This is fine
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log((mediaRecorderRef.current))
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'screen-recording.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        // Stop all tracks to end the capture.
        stream.getTracks().forEach((track) => track.stop());
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;

        // Prepare and send data to the Node.js server.
        (async () => {
          try {
            const formData = new FormData();
            // Append the video blob.
            formData.append('video', blob, 'screen-recording.webm');

            // Append each audio segment as a Blob.
            // Iterate over each phrase and fetch the blob for input and output audio.
            const audioPromises = phrases.map(async (phrase, index) => {
              if (phrase.inputAudio && phrase.inputAudio.audioUrl) {
                const inputBlob = await fetch(phrase.inputAudio.audioUrl).then(res => res.blob());
                formData.append(`inputAudio_${index}`, inputBlob, `input_${index}.webm`);
              }
              if (phrase.outputAudio && phrase.outputAudio.audioUrl) {
                const outputBlob = await fetch(phrase.outputAudio.audioUrl).then(res => res.blob());
                formData.append(`outputAudio_${index}`, outputBlob, `output_${index}.webm`);
              }
            });
            await Promise.all(audioPromises);

            // Append additional metadata.
            formData.append('phrases', JSON.stringify(phrases));
            formData.append('delayAfterOutputPhrasesMultiplier', DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER.toString());
            formData.append('delayBetweenPhrases', (presentationConfig.delayBetweenPhrases ? presentationConfig.delayBetweenPhrases + LAG_COMPENSATION : 0).toString());
            formData.append('introDelay', presentationConfig.postProcessDelay.toString());
            formData.append('bleedStartDelay', BLEED_START_DELAY.toString());

            // Send the formData to your backend endpoint.
            const response = await fetch('http://localhost:3000/merge', {
              method: 'POST',
              body: formData,
            });
            if (!response.ok) {
              throw new Error(`Server error: ${response.statusText}`);
            }
            const result = await response.json();
            console.log('Server merge response:', result);
          } catch (err) {
            console.error('Error sending data to server:', err);
          }
        })();
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error('Error starting screen recording:', err);
    }
  };

  const stopScreenRecording = () => {
    console.log(mediaRecorderRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAudioEnded = () => {
    if (currentPhase === 'input') {
      const timeoutId = window.setTimeout(() => {
        setCurrentPhase('output');
      }, presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    } else {
      const outputDuration = (audioRef.current?.duration || 1) * 1000;
      const timeoutId = window.setTimeout(() => {
        if (currentPhraseIndex < phrases.length - 1 && !paused) {
          setCurrentPhraseIndex(currentPhraseIndex + 1);
          setCurrentPhase('input');
        } else {
          setFinished(true);
          // Stop the recording after final audio.
          if (recordScreen) stopScreenRecording();
        }
      }, (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    }
  };



  // In handleReplay:
  const handleReplay = async () => {
    clearAllTimeouts();
    // Start recording if enabled.
    if (recordScreen) {
      setPaused(true);
      setFullscreen(true);
      await startScreenRecording();
      setPaused(false);
    }
    setCurrentPhraseIndex(prev => prev < 0 ? prev - 1 : -1);
    setCurrentPhase('input');
    setFinished(false);
    setShowTitle(true);

    const timeoutId1 = window.setTimeout(() => {
      setShowTitle(false);
    }, presentationConfig.postProcessDelay + BLEED_START_DELAY - TITLE_ANIMATION_DURATION - 1000);
    timeoutIds.current.push(timeoutId1);

    const timeoutId = window.setTimeout(() => {
      setCurrentPhraseIndex(0);
    }, presentationConfig.postProcessDelay + BLEED_START_DELAY);
    timeoutIds.current.push(timeoutId);
  };


  // Handle background image upload via our config setter.
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



  return (
    <div className="p-5 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Language Shadowing</h1>
      </div>

      {/* Language Selection */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label htmlFor="inputLang" className="block font-medium mb-1">Input Language</label>
          <select
            id="inputLang"
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="targetLang" className="block font-medium mb-1">Output Language</label>
          <select
            id="targetLang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Textarea for initial phrases */}
      <textarea
        placeholder="Enter phrases, one per line"
        value={phrasesInput}
        onChange={(e) => setPhrasesInput(e.target.value)}
        rows={6}
        className="w-96 p-2 text-lg border border-gray-300 rounded mb-4"
      />

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96 overflow-scroll max-h-svh">
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
            {/* Dynamic configuration fields */}
            <ConfigFields
              definition={presentationConfigDefinition}
              config={presentationConfig}
              setConfig={setPresentationConfig}
              handleImageUpload={handleImageUpload}
            />
            {/* Save Config Input/Button moved into modal */}
            <div className="mt-4 border-t pt-4">
              <input
                type="text"
                id="configName"
                placeholder="Enter config name (optional)"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2"
              />
              <button
                onClick={handleSaveConfig}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Save Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={loading}
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 mb-4 flex items-center justify-center"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : "Process"}
      </button>

      {/* Audio Element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="w-96 mb-4" controls hidden />

      <div className="h-8" />

      {/* Saved Configs List */}
      <div className="flex flex-col gap-4 mb-4">
        <h3 className="text-xl font-semibold">Saved Configs</h3>
        <div>
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

      {/* Presentation View and Controls */}
      {Boolean(typeof currentPhraseIndex === "number" && phrases?.length) && (
        <>
          <div className="flex mb-2 items-center gap-2">
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              title={fullscreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
            >
              <Maximize2 className="h-8 w-8 text-gray-700" />
            </button>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={recordScreen}
                onChange={(e) => setRecordScreen(e.target.checked)}
              />
              Record Screen
            </label>
            {recordScreen && <button onClick={stopScreenRecording}>
              Stop Recording
            </button>}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              title="Settings"
            >
              <Settings className="h-8 w-8 text-gray-700" />
            </button>
            {phrases.length > 0 && (
              <button
                onClick={handleReplay}
                className="ml-2 px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Replay
              </button>
            )}
          </div>
          <PresentationView
            // key={currentPhraseIndex < 0 ? currentPhraseIndex : 'fakeKey'}
            title={showTitle ? configName : undefined}
            currentPhrase={phrases[currentPhraseIndex]?.input}
            currentTranslated={phrases[currentPhraseIndex]?.translated}
            romanizedOutput={phrases[currentPhraseIndex]?.romanized}
            currentPhase={currentPhase}
            fullScreen={fullscreen}
            onClose={() => setFullscreen(false)}
            {...presentationConfig}
          />
        </>
      )}

      {/* Editable Inputs for Each Phrase */}
      {phrases.length > 0 && !fullscreen && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">Edit Phrases</h3>
          {phrases.map((phrase, index) => (
            <div key={index} className="mb-4 border p-2 rounded">
              <div className="mb-2">
                <label className="block font-medium mb-1">Input:</label>
                <input
                  type="text"
                  value={phrase.input}
                  onChange={(e) => {
                    const newPhrases = [...phrases];
                    newPhrases[index] = { ...newPhrases[index], input: e.target.value };
                    setPhrases(newPhrases);
                  }}
                  className="w-96 p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="block font-medium mb-1">Translated:</label>
                <input
                  type="text"
                  value={phrase.translated}
                  onChange={(e) => {
                    const newPhrases = [...phrases];
                    newPhrases[index] = { ...newPhrases[index], translated: e.target.value };
                    setPhrases(newPhrases);
                  }}
                  className="w-96 p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="block font-medium mb-1">Romanized:</label>
                <input
                  type="text"
                  value={phrase.romanized}
                  onChange={(e) => {
                    const newPhrases = [...phrases];
                    newPhrases[index] = { ...newPhrases[index], romanized: e.target.value };
                    setPhrases(newPhrases);
                  }}
                  className="w-96 p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
