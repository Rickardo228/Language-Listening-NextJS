'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PresentationView, TITLE_ANIMATION_DURATION } from './PresentationView';
import { Maximize2, Settings, X } from 'lucide-react';
import bgColorOptions from './utils/bgColorOptions';
import { Config, languageOptions, Phrase } from './types';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { presentationConfigDefinition } from './configDefinitions';
import ConfigFields from './ConfigFields';
import { EditablePhrases } from './EditablePhrases';
import { PresentationControls } from './PresentationControls';

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
    if (currentPhraseIndex < 0 || paused) return;
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
  const handleLoadConfig = async (config: Config) => {
    setLoading(true);
    try {
      // First update the UI state with the saved config
      setPhrasesInput(config.phrases ? config.phrases.map(p => p.input).join('\n') : config.phrasesInput || '');
      setInputLang(config.inputLang);
      setTargetLang(config.targetLang);
      setConfigName(config.name);
      setPresentationConfig({
        ...config
      });

      // Then fetch fresh audio for all phrases
      const response = await fetch('http://localhost:3000/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: config.phrases,
          inputLang: config.inputLang,
          targetLang: config.targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load audio');
      }

      const data = await response.json();
      setPhrases(data.phrases);
    } catch (err) {
      console.error('Loading error:', err);
      alert('Error loading configuration: ' + err);
    } finally {
      setLoading(false);
      setPaused(true);
    }
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

  const handlePause = () => {
    clearAllTimeouts();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPaused(true);
  };

  const handlePlay = () => {
    setPaused(false);
    if (currentPhraseIndex < 0) {
      handleReplay();
    } else if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Update handleAudioEnded to respect paused state
  const handleAudioEnded = () => {
    if (paused) return;

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
          if (recordScreen) stopScreenRecording();
        }
      }, (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    }
  };

  // In handleReplay:
  const handleReplay = async () => {
    // Start recording if enabled.
    if (recordScreen) {
      handlePause();
      setFullscreen(true);
      await startScreenRecording();
    }
    setCurrentPhraseIndex(prev => prev < 0 ? prev - 1 : -1);
    setCurrentPhase('input');
    setShowTitle(true);
    setFinished(false);
    setPaused(false);

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
          <PresentationControls
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
            recordScreen={recordScreen}
            setRecordScreen={setRecordScreen}
            stopScreenRecording={stopScreenRecording}
            handleReplay={handleReplay}
            hasPhrasesLoaded={phrases.length > 0}
            configName={configName}
            setConfigName={setConfigName}
            onSaveConfig={handleSaveConfig}
            presentationConfig={presentationConfig}
            setPresentationConfig={setPresentationConfig}
            presentationConfigDefinition={presentationConfigDefinition}
            handleImageUpload={handleImageUpload}
            paused={paused}
            onPause={handlePause}
            onPlay={handlePlay}
          />
          <PresentationView
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
        <EditablePhrases
          phrases={phrases}
          setPhrases={setPhrases}
          inputLanguage={inputLang}
          outputLanguage={targetLang}
        />
      )}
    </div>
  );
}
