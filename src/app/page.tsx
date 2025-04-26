'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PresentationView, TITLE_ANIMATION_DURATION } from './PresentationView';
import bgColorOptions from './utils/bgColorOptions';
import { Config, languageOptions, Phrase, PresentationConfig } from './types';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { presentationConfigDefinition } from './configDefinitions';
import { EditablePhrases } from './EditablePhrases';
import { PresentationControls } from './PresentationControls';
import { API_BASE_URL, BLEED_START_DELAY, DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER, LAG_COMPENSATION } from './consts';
import { ImportPhrases } from './ImportPhrases';
import { ImportPhrasesDialog } from './ImportPhrasesDialog';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDe17ZSzrBpaae56p4YDpJ-2oXAV_89eg",
  authDomain: "languageshadowing-69768.firebaseapp.com",
  projectId: "languageshadowing-69768",
  storageBucket: "languageshadowing-69768.firebasestorage.app",
  messagingSenderId: "1061735850333",
  appId: "1:1061735850333:web:5baa7830b046375b0e48b4"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);

function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Language Shadowing</h1>
      <p className="mb-6">Sign in to continue</p>
      <button
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
        onClick={() => {
          const provider = new GoogleAuthProvider();
          signInWithPopup(auth, provider).catch(console.error);
        }}
      >
        Sign In with Google
      </button>
    </div>
  );
}

export default function Home() {
  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [inputLang, setInputLang] = useState<string>(languageOptions[0]?.code);
  const [targetLang, setTargetLang] = useState<string>('it-IT');

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
  const { presentationConfig, setPresentationConfig } = usePresentationConfig();

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

  // Listen for auth state changes and sign in if not already
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null)
      }
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
        loaded.push({ id: docSnap.id, ...docSnap.data() } as Config);
      });
      setSavedCollections(loaded);
    };
    fetchCollections();
  }, [user]);

  // Save a new collection to Firestore
  const handleCreateCollection = async (phrases: Phrase[]) => {
    if (!user) return;
    const generatedName = `${inputLang}→${targetLang}`;
    const newCollection = {
      name: generatedName,
      phrases
    };
    const colRef = collection(firestore, 'users', user.uid, 'collections');
    const docRef = await addDoc(colRef, newCollection);
    setSavedCollections(prev => [...prev, { ...newCollection, id: docRef.id }]);
    setSelectedCollection(docRef.id);
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

  const handleProcess = async () => {
    // Split the textarea input into an array of phrases.
    const splitPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!splitPhrases.length) return;

    handleStop();
    setPhrasesBase([]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/process`, {
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
        inputLang,
        targetLang
      }));
      setPhrases(processedPhrases);
      setPhrasesInput('');
      handleCreateCollection(processedPhrases);
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

  const handleAddToCollection = async () => {
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
          inputLang,
          targetLang,
        }),
      });
      const data = await response.json();
      const processedPhrases: Phrase[] = splitPhrases.map((p, index) => ({
        input: p,
        translated: data.translated ? data.translated[index] || '' : '',
        inputAudio: data.inputAudioSegments ? data.inputAudioSegments[index] || null : null,
        outputAudio: data.outputAudioSegments ? data.outputAudioSegments[index] || null : null,
        romanized: data.romanizedOutput ? data.romanizedOutput[index] || '' : '',
        inputLang,
        targetLang
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
  useEffect(() => {
    if (currentPhraseIndex < 0 || paused) return;
    const currentPhraseObj = phrases[currentPhraseIndex];
    let src = '';
    if (currentPhase === 'input' && currentPhraseObj?.inputAudio) {
      console.log("hey")
      src = currentPhraseObj.inputAudio.audioUrl;
    } else if (currentPhase === 'output' && currentPhraseObj?.outputAudio) {
      src = currentPhraseObj.outputAudio.audioUrl;
    }
    if (audioRef.current && src && audioRef.current.paused) {
      audioRef.current.src = src;
      audioRef.current.play().catch((err) => console.error('Auto-play error:', err));
    }
  }, [currentPhraseIndex, currentPhase, phrases, paused]);

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
      clearAllTimeouts();
      setCurrentPhraseIndex(0);
      setCurrentPhase('input');
      setSelectedCollection(config.id);


      // Then fetch fresh audio for all phrases
      const response = await fetch(`${API_BASE_URL}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: config.phrases,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load audio');
      }

      const data = await response.json();
      setPhrases(data.phrases, config.id);
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
      audioRef.current.play();
    }
  };

  // Update handleAudioEnded to handle looping
  const handleAudioEnded = () => {
    if (paused) return;

    if (currentPhase === 'input') {
      const timeoutId = window.setTimeout(() => {
        setCurrentPhase('output');
      }, 1000);
      timeoutIds.current.push(timeoutId);
    } else {
      const outputDuration = (audioRef.current?.duration || 1) * 1000;
      const timeoutId = window.setTimeout(() => {
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
      }, (outputDuration * DELAY_AFTER_OUTPUT_PHRASES_MULTIPLIER) + presentationConfig.delayBetweenPhrases);
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
  const handleRenameCollection = async (idx: number) => {
    if (!user) return;
    const collection = savedCollections[idx];
    const newName = prompt("Enter new collection name:", collection.name);
    if (!newName || newName.trim() === collection.name) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', collection.id);
      await updateDoc(docRef, { name: newName.trim() });
      setSavedCollections(prev =>
        prev.map((col, i) =>
          i === idx ? { ...col, name: newName.trim() } : col
        )
      );
    } catch (err) {
      alert("Failed to rename collection: " + err);
    }
  };

  // Delete a collection
  const handleDeleteCollection = async (idx: number) => {
    if (!user) return;
    const collection = savedCollections[idx];
    if (!window.confirm(`Delete collection "${collection.name}"? This cannot be undone.`)) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', collection.id);
      await deleteDoc(docRef);
      setSavedCollections(prev => prev.filter((_, i) => i !== idx));
      if (selectedCollection === collection.id) {
        setSelectedCollection('');
        setPhrasesBase([]);
      }
    } catch (err) {
      alert("Failed to delete collection: " + err);
    }
  };

  if (!user) {
    return <SignInPage />;
  }

  return (
    <div className="font-sans">
      {/* Nav */}
      <div className={`flex items-center justify-between w-[100vw] shadow-md mb-1 p-3 ${selectedCollection ? 'hidden md:flex' : 'flex'}`}>
        <h1 className="text-2xl font-bold">Language Shadowing</h1>
        {/* User Avatar / Auth Button */}
        <div className="relative">
          {user ? (
            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => setAvatarDialogOpen(true)}
              title={user.displayName || user.email || "Account"}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-lg">
                  {user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </button>
          ) : (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => {
                const provider = new GoogleAuthProvider();
                signInWithPopup(auth, provider).catch(console.error);
              }}
            >
              Sign In / Create Account
            </button>
          )}

          {/* Dialog */}
          {avatarDialogOpen && user && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
              onClick={() => setAvatarDialogOpen(false)}
            >
              <div className="p-4 border-b">
                <div className="font-semibold">{user.displayName || user.email}</div>
              </div>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  signOut(auth);
                  setAvatarDialogOpen(false);
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="w-96 mb-4" controls hidden />


      {/* Main content */}
      <div className={`${selectedCollection ? 'max-h-[100vh] min-h-[100vh] md:max-h-[92vh] md:min-h-[92vh]' : 'max-h-[92vh] min-h-[92vh]'} flex flex-row gap-4 w-full`}>
        {/* Saved Configs List */}
        <div className={`flex flex-col gap-10 bg-gray-50 p-5 ${selectedCollection ? 'hidden md:flex' : 'flex'}`}>

          <div>
            {/* Language Selection and Phrase Import */}
            <ImportPhrases
              inputLang={inputLang}
              setInputLang={setInputLang}
              targetLang={targetLang}
              setTargetLang={setTargetLang}
              phrasesInput={phrasesInput}
              setPhrasesInput={setPhrasesInput}
              loading={loading}
              onProcess={handleProcess}
              // onAddToCollection={handleAddToCollection}
              hasSelectedCollection={!!selectedCollection}

            />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Collections</h3>
            {savedCollections.length === 0 ? (
              <p>No Collections Saved.</p>
            ) : (
              <ul className="list-disc pl-5">
                {savedCollections.map((config, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span
                      onClick={() => handleLoadCollection(config)}
                      className="cursor-pointer hover:underline"
                    >
                      {config.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRenameCollection(idx)}
                        className="text-blue-500 hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(idx)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Phrases and Playback */}
        <div className={`flex flex-col xl:flex-row flex-1 gap-4 p-5 ${selectedCollection ? 'flex' : 'hidden md:flex'}`}>
          {selectedCollection ? (
            <button
              onClick={() => { setSelectedCollection(''); handleStop(); setPhrasesBase([]) }}
              className="md:hidden top-4 left-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
            >
              ← Back
            </button>
          ) : !loading && <h3 className="hidden md:block">Select a Collection or Import Phrases</h3>}
          <div className="overflow-auto flex-1">
            {loading && 'Loading...'}
            {/* Add ImportPhrasesDialog here */}
            {!loading && <ImportPhrasesDialog
              inputLang={inputLang}
              setInputLang={setInputLang}
              targetLang={targetLang}
              setTargetLang={setTargetLang}
              phrasesInput={phrasesInput}
              setPhrasesInput={setPhrasesInput}
              loading={loading}
              // onProcess={handleProcess}
              onAddToCollection={handleAddToCollection}
              hasSelectedCollection={!!selectedCollection}
            />}
            {/* Editable Inputs for Each Phrase */}
            {phrases.length > 0 && !fullscreen && (
              <EditablePhrases
                phrases={phrases}
                setPhrases={setPhrases}
                inputLanguage={inputLang}
                outputLanguage={targetLang}
                currentPhraseIndex={currentPhraseIndex}
                onPhraseClick={(index) => {
                  setCurrentPhraseIndex(index);
                  setCurrentPhase('input');
                  clearAllTimeouts();
                  if (audioRef.current && phrases[index]?.inputAudio?.audioUrl) {
                    audioRef.current.pause();
                    audioRef.current.src = phrases[index].inputAudio.audioUrl;
                  }
                }}
              />
            )}
          </div>

          {/* Presentation View and Controls */}
          {Boolean(typeof currentPhraseIndex === "number" && phrases?.length) && (
            <div className='xl:flex-1'>
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
                  if (audioRef.current) {
                    audioRef.current.pause();
                    if (currentPhase === 'output') {
                      audioRef.current.src = phrases[currentPhraseIndex].inputAudio?.audioUrl || '';
                      setCurrentPhase('input');
                    } else if (currentPhraseIndex > 0) {
                      audioRef.current.src = phrases[currentPhraseIndex - 1].outputAudio?.audioUrl || '';
                      setCurrentPhraseIndex(prev => prev - 1);
                      setCurrentPhase('output');
                    }
                  }
                }}
                onNext={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    if (currentPhase === 'input') {
                      audioRef.current.src = phrases[currentPhraseIndex].outputAudio?.audioUrl || '';
                      setCurrentPhase('output');
                    } else if (currentPhraseIndex < phrases.length - 1) {
                      audioRef.current.src = phrases[currentPhraseIndex + 1].inputAudio?.audioUrl || '';
                      setCurrentPhraseIndex(prev => prev + 1);
                      setCurrentPhase('input');
                    }
                  }
                }}
                canGoBack={currentPhase === 'output' || currentPhraseIndex > 0}
                canGoForward={currentPhase === 'input' || currentPhraseIndex < phrases.length - 1}
              />
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
            </div>
          )}
        </div>

      </div>


    </div >
  );
}
