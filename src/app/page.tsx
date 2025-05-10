'use client'

import { useState, useRef, useEffect, ChangeEvent, useMemo } from 'react';
import { PresentationView, TITLE_ANIMATION_DURATION } from './PresentationView';
import bgColorOptions from './utils/bgColorOptions';
import { Config, languageOptions, Phrase, PresentationConfig } from './types';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { presentationConfigDefinition } from './configDefinitions';
import { EditablePhrases } from './EditablePhrases';
import { PresentationControls } from './PresentationControls';
import { API_BASE_URL, BLEED_START_DELAY, DELAY_AFTER_INPUT_PHRASES_MULTIPLIER, DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER, LAG_COMPENSATION } from './consts';
import { ImportPhrases } from './ImportPhrases';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CollectionList } from './CollectionList';
import { CollectionHeader } from './CollectionHeader';
import { useTheme } from './ThemeProvider';
import { UserAvatar } from './components/UserAvatar';
import { auth } from './firebase';
import { defaultPresentationConfig } from './defaultConfig';

const firestore = getFirestore();

function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Language Shadowing</h1>
      <UserAvatar
        user={null}
        avatarDialogOpen={false}
        setAvatarDialogOpen={() => { }}
      />
    </div>
  );
}

export default function Home() {
  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [newCollectionInputLang, setNewCollectionInputLang] = useState<string>(languageOptions[0]?.code);
  const [newCollectionTargetLang, setNewCollectionTargetLang] = useState<string>('it-IT');
  const [addToCollectionInputLang, setAddToCollectionInputLang] = useState<string>(languageOptions[0]?.code);
  const [addToCollectionTargetLang, setAddToCollectionTargetLang] = useState<string>('it-IT');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [savedCollections, setSavedCollections] = useState<Config[]>([])

  // Instead of multiple arrays, we now store all per-phrase data in one state variable.
  const [phrases, setPhrasesBase] = useState<Phrase[]>([]);
  const setPhrases = async (phrases: Phrase[], collectionId?: string) => {
    setPhrasesBase(phrases);
    if (selectedCollection && user) {
      const docRef = doc(firestore, 'users', user.uid, 'collections', collectionId || selectedCollection);
      await updateDoc(docRef, { phrases });
      setSavedCollections(prev =>
        prev.map(col =>
          col.id === (collectionId || selectedCollection) ? { ...col, phrases } : col
        )
      );
    }
  }

  // Presentation configuration (bg, effects, delays, etc.) via our custom hook.
  const { presentationConfig, setPresentationConfig: setPresentationConfigBase } = usePresentationConfig();

  const setPresentationConfig = async (newConfig: Partial<PresentationConfig>) => {
    setPresentationConfigBase(newConfig);
    if (selectedCollection && user) {
      try {
        const docRef = doc(firestore, 'users', user.uid, 'collections', selectedCollection);
        const updatedConfig = { ...presentationConfig, ...newConfig } as PresentationConfig;
        await updateDoc(docRef, {
          presentationConfig: updatedConfig
        });
        setSavedCollections(prev =>
          prev.map(col =>
            col.id === selectedCollection
              ? { ...col, presentationConfig: updatedConfig }
              : col
          )
        );
      } catch (err) {
        console.error('Error updating presentation config:', err);
        alert('Failed to save settings: ' + err);
      }
    }
  };

  // Loading state for processing
  const [loading, setLoading] = useState<boolean>(false);

  // Playback and sequence control states
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
  const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>('input');
  const [, setFinished] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [recordScreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  // Config saving states
  const [savedConfigs, setSavedConfigs] = useState<PresentationConfig[]>([]);
  const [configName, setConfigName] = useState<string>('');

  // Ref for the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  const timeoutIds = useRef<number[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Listen for auth state changes and sign in if not already
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null)
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load saved collections from Firestore on mount or when user changes
  useEffect(() => {
    if (!user) return;
    const fetchCollections = async () => {
      const colRef = collection(firestore, 'users', user.uid, 'collections');
      const snapshot = await getDocs(colRef);
      const loaded: Config[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Ensure each phrase has a created_at field
        const phrases = data.phrases.map((phrase: Phrase) => ({
          ...phrase,
          created_at: phrase.created_at || data.created_at // fallback to collection's created_at if phrase doesn't have one
        }));
        loaded.push({
          id: docSnap.id,
          ...data,
          phrases
        } as Config);
      });
      setSavedCollections(loaded);

      // Set input and target languages based on most recent phrases
      if (loaded.length > 0) {
        // Get all phrases from all collections
        const allPhrases = loaded.flatMap(col => col.phrases);
        // Sort by created_at in descending order
        const sortedPhrases = allPhrases.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        // Get the most recent phrase
        const mostRecentPhrase = sortedPhrases[0];
        if (mostRecentPhrase) {
          setNewCollectionInputLang(mostRecentPhrase.inputLang);
          setNewCollectionTargetLang(mostRecentPhrase.targetLang);
        }
      }
    };
    fetchCollections();
  }, [user]);

  // Save a new collection to Firestore
  const handleCreateCollection = async (phrases: Phrase[], prompt?: string) => {
    if (!user) return;
    const generatedName = prompt || 'New Collection';
    const now = new Date().toISOString();
    const newCollection = {
      name: generatedName,
      phrases: phrases.map(phrase => ({
        ...phrase,
        created_at: now
      })),
      created_at: now,
      presentationConfig: {
        ...defaultPresentationConfig,
        name: generatedName
      }
    };
    console.log('newCollection', newCollection);
    const colRef = collection(firestore, 'users', user.uid, 'collections');
    const docRef = await addDoc(colRef, newCollection);
    const newCollectionConfig = {
      ...newCollection,
      id: docRef.id
    };
    setSavedCollections(prev => [...prev, newCollectionConfig]);
    handleLoadCollection(newCollectionConfig);
    return docRef.id;
  };

  // Load saved collections and configs from localStorage on mount.
  useEffect(() => {
    const storedConfigs = localStorage.getItem('savedConfigs');
    if (storedConfigs) {
      setSavedConfigs(JSON.parse(storedConfigs));
    }
    // const storedCollections = localStorage.getItem('savedCollections');
    // if (storedCollections) {
    //   setSavedCollections(JSON.parse(storedCollections));
    // }
  }, []);

  const handleProcess = async (prompt?: string, inputLang?: string, targetLang?: string) => {
    // Split the textarea input into an array of phrases.
    const splitPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!splitPhrases.length) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: splitPhrases,
          inputLang: inputLang || newCollectionInputLang,
          targetLang: targetLang || newCollectionTargetLang,
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
        inputLang: inputLang || newCollectionInputLang,
        targetLang: targetLang || newCollectionTargetLang,
        inputVoice: data.inputVoice || `${inputLang || newCollectionInputLang}-Standard-D`,
        targetVoice: data.targetVoice || `${targetLang || newCollectionTargetLang}-Standard-D`
      }));

      const collectionId = await handleCreateCollection(processedPhrases, prompt);
      setPhrases(processedPhrases, collectionId);
      setPhrasesInput('');
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

  const handleAddToCollection = async (inputLang?: string, targetLang?: string) => {
    const splitPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!splitPhrases.length) return;

    setLoading(true);

    try {
      // Get the first phrase's voices from the existing collection
      const firstPhrase = phrases[0];
      const inputVoice = firstPhrase?.inputVoice || `${inputLang || addToCollectionInputLang}-Standard-D`;
      const targetVoice = firstPhrase?.targetVoice || `${targetLang || addToCollectionTargetLang}-Standard-D`;

      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: splitPhrases,
          inputLang: inputLang,
          targetLang: targetLang,
          inputVoice,
          targetVoice
        }),
      });
      const data = await response.json();
      const now = new Date().toISOString();
      const processedPhrases: Phrase[] = splitPhrases.map((p, index) => ({
        input: p,
        translated: data.translated ? data.translated[index] || '' : '',
        inputAudio: data.inputAudioSegments ? data.inputAudioSegments[index] || null : null,
        outputAudio: data.outputAudioSegments ? data.outputAudioSegments[index] || null : null,
        romanized: data.romanizedOutput ? data.romanizedOutput[index] || '' : '',
        inputLang: inputLang || addToCollectionInputLang,
        targetLang: targetLang || addToCollectionTargetLang,
        inputVoice,
        targetVoice,
        created_at: now
      }));

      // Add new phrases to existing collection
      const updatedPhrases = [...phrases, ...processedPhrases];
      setPhrases(updatedPhrases);
      setPhrasesInput('');
    } catch (err) {
      console.error('Processing error:', err);
      alert(err)
    }
    setLoading(false);
  };

  // Update audio source when phrase or phase changes.
  const currentInputAudioUrl = useMemo(() => {
    if (currentPhraseIndex < 0) return '';
    return phrases[currentPhraseIndex]?.inputAudio?.audioUrl || '';
  }, [currentPhraseIndex, phrases]);

  const currentOutputAudioUrl = useMemo(() => {
    if (currentPhraseIndex < 0) return '';
    return phrases[currentPhraseIndex]?.outputAudio?.audioUrl || '';
  }, [currentPhraseIndex, phrases]);

  useEffect(() => {
    if (currentPhraseIndex < 0 || paused) return;

    let src = '';
    if (currentPhase === 'input') {
      src = currentInputAudioUrl;
    } else if (currentPhase === 'output') {
      src = currentOutputAudioUrl;
    }

    if (audioRef.current && src && audioRef.current.paused) {
      audioRef.current.src = src;
      audioRef.current.play().catch((err) => console.error('Auto-play error:', err));
    }
  }, [currentPhraseIndex, currentPhase, paused, currentInputAudioUrl, currentOutputAudioUrl]);

  // When a saved config is selected, load its state.
  // const handleLoadConfig = async (config: PresentationConfig) => {
  //   setLoading(true);
  //   try {
  //     // Update the UI state with the saved config
  //     setConfigName(config.name);
  //     setPresentationConfig({
  //       ...config
  //     });

  //   } catch (err) {
  //     console.error('Loading error:', err);
  //     alert('Error loading configuration: ' + err);
  //   } finally {
  //     setLoading(false);
  //     setPaused(true);
  //   }
  // };

  // When a saved collection is selected, load its state.
  const handleLoadCollection = async (config: Config) => {
    setLoading(true);
    try {
      // First update the UI state with the saved config
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      clearAllTimeouts();
      setCurrentPhraseIndex(0);
      setCurrentPhase(config?.presentationConfig?.enableOutputBeforeInput ? 'output' : 'input');
      setSelectedCollection(config.id);

      // Set the addToCollection language states based on the first phrase
      if (config.phrases.length > 0) {
        const firstPhrase = config.phrases[0];
        setAddToCollectionInputLang(firstPhrase.inputLang);
        setAddToCollectionTargetLang(firstPhrase.targetLang);
      }

      // Set the presentation config from the collection
      setPresentationConfigBase(config?.presentationConfig || defaultPresentationConfig);


      setPhrases(config.phrases, config.id);
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
      `${newCollectionInputLang}→${newCollectionTargetLang} [C:${containerColorName}, T:${textColorName}]` +
      (presentationConfig.enableSnow ? " ❄️" : "") +
      (presentationConfig.enableCherryBlossom ? " 🌸" : "") +
      (presentationConfig.enableLeaves ? " 🍂" : "") +
      (presentationConfig.enableAutumnLeaves ? " 🍁" : "");

    const finalName = configName.trim() ? configName.trim() : generatedName;
    const newConfig: PresentationConfig = {
      ...presentationConfig,
      name: finalName,
    };
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
    // setConfigName('');
  };

  // Delete a config from the saved list.
  // const handleDeleteConfig = (index: number) => {
  //   const updatedConfigs = savedConfigs.filter((_, idx) => idx !== index);
  //   setSavedConfigs(updatedConfigs);
  //   localStorage.setItem('savedConfigs', JSON.stringify(updatedConfigs));
  // };

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
        // @ts-expect-error preferCurrentTab is a valid option but not in TypeScript types
        preferCurrentTab: true,
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
                formData.append(`outputAudio_${index} `, outputBlob, `output_${index}.webm`);
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
            const response = await fetch(`${API_BASE_URL}/merge`, {
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
    stopScreenRecording()
    setPaused(true);
  };

  const handleStop = () => {
    clearAllTimeouts();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    stopScreenRecording()
    setPaused(true);
    setFinished(true);
    setCurrentPhraseIndex(-1);
  };

  const handlePlay = () => {
    setPaused(false);
    if (currentPhraseIndex < 0) {
      handleReplay();
    } else if (audioRef.current) {
      if (!audioRef.current.src) {
        audioRef.current.src = phrases[currentPhraseIndex]?.[currentPhase === "input" ? 'inputAudio' : 'outputAudio']?.audioUrl ?? ''
      }
      audioRef.current.play();
    }
  };

  // Update handleAudioEnded to handle looping
  const handleAudioEnded = () => {
    if (paused) return;

    const playOutputBeforeInput = presentationConfig.enableOutputBeforeInput;
    const inputDuration = presentationConfig.enableInputDurationDelay ? (audioRef.current?.duration || 1) * 1000 : 0;
    const outputDuration = presentationConfig.enableOutputDurationDelay ? (audioRef.current?.duration || 1) * 1000 * DELAY_AFTER_INPUT_PHRASES_MULTIPLIER : 0;


    if (currentPhase === 'input') {
      const timeoutId = window.setTimeout(() => {
        setCurrentPhase('output');

        if (playOutputBeforeInput) {
          if (currentPhraseIndex < phrases.length - 1 && !paused) {
            setCurrentPhraseIndex(currentPhraseIndex + 1);
          } else {
            if (presentationConfig.enableLoop) {
              // If looping is enabled, restart from beginning
              setCurrentPhraseIndex(0);
            } else {
              setFinished(true);
              if (recordScreen) stopScreenRecording();
              setPaused(true);
            }
          }
        }
      }, playOutputBeforeInput ? outputDuration + 1000 : inputDuration + presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    } else {
      const timeoutId = window.setTimeout(() => {
        if (playOutputBeforeInput) {
          setCurrentPhase('input');
        } else {
          if (currentPhraseIndex < phrases.length - 1 && !paused) {
            setCurrentPhraseIndex(currentPhraseIndex + 1);
            setCurrentPhase('input');
          } else {
            if (presentationConfig.enableLoop) {
              // If looping is enabled, restart from beginning
              setCurrentPhraseIndex(0);
              setCurrentPhase('input');
            } else {
              setFinished(true);
              if (recordScreen) stopScreenRecording();
              setPaused(true);
            }
          }
        }
      }, playOutputBeforeInput ? inputDuration + 1000 : (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
      timeoutIds.current.push(timeoutId);
    }
  };

  // In handleReplay:
  const handleReplay = async () => {
    clearAllTimeouts();

    // Start recording if enabled.
    if (recordScreen) {
      handlePause();
      setFullscreen(true);
      await startScreenRecording();
    }
    setCurrentPhraseIndex(prev => prev < 0 ? prev - 1 : -1);
    setCurrentPhase('input');
    if (audioRef.current && phrases[0]?.inputAudio?.audioUrl) audioRef.current.src = phrases[0].inputAudio?.audioUrl;
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

  // Rename a collection
  const handleRenameCollection = async (id: string) => {
    if (!user) return;
    const collection = savedCollections.find(col => col.id === id);
    if (!collection) return;
    const newName = prompt("Enter new collection name:", collection.name);
    if (!newName || newName.trim() === collection.name) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', id);
      await updateDoc(docRef, { name: newName.trim() });
      setSavedCollections(prev =>
        prev.map(col =>
          col.id === id ? { ...col, name: newName.trim() } : col
        )
      );
    } catch (err) {
      alert("Failed to rename collection: " + err);
    }
  };

  // Delete a collection
  const handleDeleteCollection = async (id: string) => {
    if (!user) return;
    const collection = savedCollections.find(col => col.id === id);
    if (!collection) return;
    if (!window.confirm(`Delete collection "${collection.name}"? This cannot be undone.`)) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', id);
      await deleteDoc(docRef);
      setSavedCollections(prev => prev.filter(col => col.id !== id));
      if (selectedCollection === id) {
        setSelectedCollection('');
        setPhrasesBase([]);
      }
    } catch (err) {
      alert("Failed to delete collection: " + err);
    }
  };

  // Add the handleVoiceChange function near the other handlers
  const handleVoiceChange = async (inputVoice: string, targetVoice: string) => {
    if (!user || !selectedCollection) return;
    const collection = savedCollections.find(col => col.id === selectedCollection);
    console.log(collection);
    if (!collection) return;

    try {
      // Update the collection in Firestore with the new voices
      const docRef = doc(firestore, 'users', user.uid, 'collections', selectedCollection);
      await updateDoc(docRef, {
        inputVoice,
        targetVoice
      });

      // Reload the collection with the new voices
      const response = await fetch(`${API_BASE_URL}/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phrases: collection.phrases.map(phrase => ({
            ...phrase,
            inputVoice,
            targetVoice
          })),
          inputVoice,
          targetVoice
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reload collection with new voices');
      }

      const { phrases: updatedPhrases } = await response.json();

      // Update both local states with the new phrases
      await setPhrases(updatedPhrases, selectedCollection);
    } catch (err) {
      console.error('Error updating voices:', err);
      alert('Failed to update voices: ' + err);
    }
  };

  const handlePlayPhrase = (index: number, phase: 'input' | 'output') => {
    clearAllTimeouts();
    if (audioRef.current) {
      const isPaused = paused;
      audioRef.current.pause();
      audioRef.current.src = phrases[index][phase === 'input' ? 'inputAudio' : 'outputAudio']?.audioUrl || '';
      setCurrentPhraseIndex(index);
      setCurrentPhase(phase);
      if (isPaused) {
        // If paused, play in isolation without changing state
        audioRef.current.play().catch(err => console.error('Playback error:', err));
      } else {
        // If not paused, update state and play through main audio element
        setPaused(false);
        audioRef.current.play().catch(err => console.error('Playback error:', err));
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <SignInPage />;
  }

  return (
    // MAIN CONTENT
    <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
      {/* Nav */}
      <div className={`flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b ${fullscreen ? 'z-1' : 'z-50'}`}>
        {/* Back button - hidden when no collection selected */}
        <button
          onClick={() => { setSelectedCollection(''); handleStop(); setPhrasesBase([]) }}
          className={`lg:hidden bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg ${!selectedCollection ? 'hidden' : ''}`}
        >
          ← Back
        </button>

        {/* Title and Avatar - hidden when collection selected */}
        <div className={`flex items-center justify-between w-full ${selectedCollection ? 'hidden lg:flex' : 'flex'}`}>
          <h1 className="text-2xl font-bold">Language Shadowing</h1>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>
            {/* User Avatar / Auth Button */}
            <UserAvatar
              user={user}
              avatarDialogOpen={avatarDialogOpen}
              setAvatarDialogOpen={setAvatarDialogOpen}
            />
          </div>
        </div>

        {/* Collection Title and Edit Buttons - shown on mobile when collection selected */}
        {selectedCollection && (
          <CollectionHeader
            collectionId={selectedCollection}
            savedCollections={savedCollections}
            onRename={handleRenameCollection}
            onDelete={handleDeleteCollection}
            onVoiceChange={handleVoiceChange}
            inputLang={addToCollectionInputLang}
            targetLang={addToCollectionTargetLang}
            className="lg:hidden"
            titleClassName="max-w-[150px]"
          />
        )}
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} controls hidden />


      {/* Main content */}
      <div className={`flex lg:flex-row flex-col-reverse w-full lg:h-[92vh]`}>
        {/* Saved Configs List */}
        <div className={`flex flex-col gap-10 bg-secondary/50 p-5 ${selectedCollection ? 'hidden lg:flex' : 'flex'} lg:w-[460px] min-w-[300px] max-w-[100vw] overflow-visible lg:overflow-y-auto mb-[80px]`}>

          <div className="fixed bottom-0 left-0 z-10 w-full lg:w-[460px] bg-secondary/50 p-5">
            {/* Language Selection and Phrase Import */}
            <ImportPhrases
              inputLang={newCollectionInputLang}
              setInputLang={setNewCollectionInputLang}
              targetLang={newCollectionTargetLang}
              setTargetLang={setNewCollectionTargetLang}
              phrasesInput={phrasesInput}
              setPhrasesInput={setPhrasesInput}
              loading={loading}
              onProcess={handleProcess}
            />
          </div>
          <CollectionList
            savedCollections={savedCollections}
            onLoadCollection={handleLoadCollection}
            onRenameCollection={handleRenameCollection}
            onDeleteCollection={handleDeleteCollection}
            selectedCollection={selectedCollection}
          />
        </div>

        {/* Phrases and Playback */}
        {!phrases?.length && !selectedCollection && <h3 className="hidden lg:block p-3">Select a Collection or Import Phrases</h3>}
        <div className="flex-1 lg:overflow-y-auto lg:relative">
          {selectedCollection && (
            <div className={`sticky lg:px-0 lg:pb-3 px-1 py-2 top-[320px] lg:top-[0px] lg:bg-background bg-gray-50 dark:bg-gray-900 z-1 ${!selectedCollection ? 'hidden lg:block' : ''}`}>
              <div className="w-full flex items-center p-2">
                <CollectionHeader
                  collectionId={selectedCollection}
                  savedCollections={savedCollections}
                  onRename={handleRenameCollection}
                  onDelete={handleDeleteCollection}
                  onVoiceChange={handleVoiceChange}
                  inputLang={addToCollectionInputLang}
                  targetLang={addToCollectionTargetLang}
                  className="hidden lg:flex"
                  titleClassName="max-w-[250px]"
                />
                <div className="w-fit whitespace-nowrap ml-auto">
                  <ImportPhrases
                    inputLang={addToCollectionInputLang}
                    setInputLang={setAddToCollectionInputLang}
                    targetLang={addToCollectionTargetLang}
                    setTargetLang={setAddToCollectionTargetLang}
                    phrasesInput={phrasesInput}
                    setPhrasesInput={setPhrasesInput}
                    loading={loading}
                    onAddToCollection={handleAddToCollection}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Editable Inputs for Each Phrase */}
          {phrases.length > 0 && !fullscreen && (
            <div className='lg:py-0 p-2'>
              <EditablePhrases
                phrases={phrases}
                setPhrases={setPhrases}
                inputLanguage={newCollectionInputLang}
                outputLanguage={newCollectionTargetLang}
                currentPhraseIndex={currentPhraseIndex}
                currentPhase={currentPhase}
                onPhraseClick={(index) => {
                  setCurrentPhraseIndex(index);
                  clearAllTimeouts();
                  setCurrentPhase(presentationConfig.enableOutputBeforeInput ? 'output' : 'input');
                  if (audioRef.current) {
                    audioRef.current.pause();
                    const audioUrl = presentationConfig.enableOutputBeforeInput ? phrases[index].outputAudio?.audioUrl : phrases[index].inputAudio?.audioUrl;
                    audioRef.current.src = audioUrl || '';
                  }
                }}
                onPlayPhrase={handlePlayPhrase}
                enableOutputBeforeInput={presentationConfig.enableOutputBeforeInput}
              />
            </div>
          )}
        </div>

        {/* Presentation View and Controls */}
        {Boolean(typeof currentPhraseIndex === "number" && phrases?.length) && (
          <div className='xl:flex-1 sticky top-[64px] bg-background lg:p-2 z-1'>
            <PresentationView
              currentPhrase={phrases[currentPhraseIndex]?.input || ''}
              currentTranslated={phrases[currentPhraseIndex]?.translated || ''}
              currentPhase={currentPhase}
              fullScreen={fullscreen}
              setFullscreen={setFullscreen}
              bgImage={presentationConfig.bgImage}
              containerBg={presentationConfig.containerBg}
              textBg={presentationConfig.textBg}
              enableSnow={presentationConfig.enableSnow}
              enableCherryBlossom={presentationConfig.enableCherryBlossom}
              enableLeaves={presentationConfig.enableLeaves}
              enableAutumnLeaves={presentationConfig.enableAutumnLeaves}
              enableOrtonEffect={presentationConfig.enableOrtonEffect}
              enableParticles={presentationConfig.enableParticles}
              enableSteam={presentationConfig.enableSteam}
              romanizedOutput={phrases[currentPhraseIndex]?.romanized}
              title={showTitle ? configName : undefined}
            />
            <div className='py-1 px-1 lg:py-2'>
              <PresentationControls
                fullscreen={fullscreen}
                setFullscreen={setFullscreen}
                recordScreen={recordScreen}
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
                onPrevious={() => {
                  clearAllTimeouts()
                  if (audioRef.current) {
                    audioRef.current.pause();
                    if (presentationConfig.enableOutputBeforeInput) {
                      if (currentPhase === 'input') {
                        audioRef.current.src = phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                        setCurrentPhase('output');
                      } else if (currentPhraseIndex > 0) {
                        audioRef.current.src = phrases[currentPhraseIndex - 1].inputAudio?.audioUrl || '';
                        setCurrentPhraseIndex(prev => prev - 1);
                        setCurrentPhase('input');
                      }
                    } else {
                      if (currentPhase === 'output') {
                        audioRef.current.src = phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                        setCurrentPhase('input');
                      } else if (currentPhraseIndex > 0) {
                        audioRef.current.src = phrases[currentPhraseIndex - 1].outputAudio?.audioUrl || '';
                        setCurrentPhraseIndex(prev => prev - 1);
                        setCurrentPhase('output');
                      }
                    }
                  }
                }}
                onNext={() => {
                  clearAllTimeouts()
                  if (audioRef.current) {
                    audioRef.current.pause();
                    if (presentationConfig.enableOutputBeforeInput) {
                      if (currentPhase === 'output') {
                        audioRef.current.src = phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                        setCurrentPhase('input');
                      } else if (currentPhraseIndex < phrases.length - 1) {
                        audioRef.current.src = phrases[currentPhraseIndex + 1].outputAudio?.audioUrl || '';
                        setCurrentPhraseIndex(prev => prev + 1);
                        setCurrentPhase('output');
                      }
                    } else {
                      if (currentPhase === 'input') {
                        audioRef.current.src = phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                        setCurrentPhase('output');
                      } else if (currentPhraseIndex < phrases.length - 1) {
                        audioRef.current.src = phrases[currentPhraseIndex + 1].inputAudio?.audioUrl || '';
                        setCurrentPhraseIndex(prev => prev + 1);
                        setCurrentPhase('input');
                      }
                    }
                  }
                }}
                canGoBack={currentPhase === 'output' || currentPhraseIndex > 0}
                canGoForward={currentPhase === 'input' || currentPhraseIndex < phrases.length - 1}
              />
            </div>
          </div>
        )}

      </div>

    </div >
  );
}