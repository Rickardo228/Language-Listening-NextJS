'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { Config, languageOptions, Phrase, PresentationConfig, CollectionType as CollectionTypeEnum } from './types';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { API_BASE_URL } from './consts';
import { ImportPhrases } from './ImportPhrases';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, increment, setDoc, query, where } from 'firebase/firestore';
import { CollectionList } from './CollectionList';
import { CollectionHeader } from './CollectionHeader';
import { useTheme } from './ThemeProvider';
import { UserAvatar } from './components/UserAvatar';
import { auth } from './firebase';
import { defaultPresentationConfig, defaultPresentationConfigs } from './defaultConfig';
import { SignInPage } from './SignInPage';
import { ImportPhrasesDialog } from './ImportPhrasesDialog';
import clarity from '@microsoft/clarity';
import { PhrasePlaybackView, PhrasePlaybackMethods } from './components/PhrasePlaybackView';
import { useRouter, useSearchParams } from 'next/navigation';

const firestore = getFirestore();

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [newCollectionInputLang, setNewCollectionInputLang] = useState<string>(languageOptions[0]?.code);
  const [newCollectionTargetLang, setNewCollectionTargetLang] = useState<string>('it-IT');
  const [addToCollectionInputLang, setAddToCollectionInputLang] = useState<string>(languageOptions[0]?.code);
  const [addToCollectionTargetLang, setAddToCollectionTargetLang] = useState<string>('it-IT');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const hasSetLanguages = useRef(false);
  const hasInitialisedForUser = useRef(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [savedCollections, setSavedCollections] = useState<Config[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false);

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

  const [user, setUser] = useState<User | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Update the ref type to use PhrasePlaybackMethods
  const playbackMethodsRef = useRef<PhrasePlaybackMethods | null>(null);

  // Initialize Clarity on mount
  useEffect(() => {
    // Initialize Clarity with your project ID
    clarity.init("rmwvuwqm9k");
  }, []);

  // Load saved collections from Firestore on mount or when user changes
  const initialiseCollections = useCallback(async (user: User,
    // inputLang?: string, targetLang?: string
  ) => {
    console.log("initialiseCollections", user)
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
          ...data,
          phrases,
          id: docSnap.id,
        } as Config);
      });
      setSavedCollections(loaded);

      // Default phrase
      // If no collections exist, create a new one with default phrases
      if (loaded.length === 0) {
        // const defaultPhrase =
        // {
        //   input: "",
        //   translated: "",
        //   inputLang: inputLang,
        //   targetLang: targetLang,
        //   inputAudio: null,
        //   outputAudio: null,
        //   romanized: "",
        //   created_at: new Date().toISOString()
        // }
        const defaultPhrases: Phrase[] = [

        ];
        const firstCollectionId = await handleCreateCollection(defaultPhrases, "My List", "phrases", user);
        if (firstCollectionId) setShowImportDialog(true);
      }

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
          if (!hasSetLanguages.current) {
            setNewCollectionInputLang(mostRecentPhrase.inputLang);
            setNewCollectionTargetLang(mostRecentPhrase.targetLang);
          }
        }
      }

      setCollectionsLoading(false);
    };

    if (!savedCollections.length) {
      setLoading(true);
      await fetchCollections();
    }
  }, [savedCollections.length]);

  // Update user identification when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged", firebaseUser);
      console.log("hasInitialisedForUser", hasInitialisedForUser?.current);
      if (firebaseUser && !hasInitialisedForUser.current) {
        console.log("onAuthStateChanged 2", firebaseUser)

        hasInitialisedForUser.current = true;
        // Identify user in Clarity
        clarity.identify(firebaseUser.email || firebaseUser.uid);

        // Check for first visit query params
        const inputLang = searchParams.get('inputLang');
        const targetLang = searchParams.get('targetLang');

        if (inputLang && targetLang) {
          // Set the languages from query params
          setAddToCollectionInputLang(inputLang);
          setAddToCollectionTargetLang(targetLang);
          setNewCollectionInputLang(inputLang);
          setNewCollectionTargetLang(targetLang);
          hasSetLanguages.current = true;

          // Remove the query params from the URL
          router.replace('/');
        }
        setCollectionsLoading(true);
        await initialiseCollections(firebaseUser,
          // inputLang, targetLang
        );

      }
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [searchParams, router]);


  // Save a new collection to Firestore
  const handleCreateCollection = async (phrases: Phrase[], prompt?: string, collectionType?: CollectionTypeEnum, userArg?: User) => {
    const userId = userArg?.uid || user?.uid;
    if (!userId) return;
    const generatedName = prompt || 'New List';
    const now = new Date().toISOString();
    const newCollection = {
      name: generatedName,
      phrases: phrases.map(phrase => ({
        ...phrase,
        created_at: now
      })),
      created_at: now,
      collectionType: collectionType || 'phrases',
      presentationConfig: {
        ...(collectionType ? defaultPresentationConfigs[collectionType] : defaultPresentationConfig),
        name: generatedName
      }
    };
    const colRef = collection(firestore, 'users', userId, 'collections');
    const docRef = await addDoc(colRef, newCollection);
    const newCollectionConfig = {
      ...newCollection,
      id: docRef.id
    };
    console.log("newCollectionConfig", newCollectionConfig)
    setSavedCollections(prev => [...prev, newCollectionConfig]);
    handleLoadCollection(newCollectionConfig);
    return docRef.id;
  };


  const handleProcess = async (prompt?: string, inputLang?: string, targetLang?: string, collectionType?: CollectionTypeEnum) => {
    // Split the textarea input into an array of phrases.
    let splitPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    // If it's an article, split by sentences
    if (collectionType === 'article') {
      // Join all lines and split by sentence-ending punctuation
      const text = splitPhrases.join(' ');
      splitPhrases = text
        .split(/(?<=[.!?])\s+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);
    }

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
        inputVoice: data.inputVoice || `${inputLang || newCollectionInputLang}-Standard-A`,
        targetVoice: data.targetVoice || `${targetLang || newCollectionTargetLang}-Standard-A`
      }));

      const collectionId = await handleCreateCollection(processedPhrases, prompt, collectionType);
      setPhrases(processedPhrases, collectionId);
      setPhrasesInput('');

      // Use methodsRef to reset playback state
      if (playbackMethodsRef.current) {
        playbackMethodsRef.current.handleStop();
        playbackMethodsRef.current.setCurrentPhraseIndex(0);
        playbackMethodsRef.current.setCurrentPhase(presentationConfig.enableOutputBeforeInput ? 'output' : 'input');
      }

    } catch (err) {
      console.error('Processing error:', err);
      alert(err)
    }
    setLoading(false);
  };

  const handleAddToCollection = async (inputLang?: string, targetLang?: string, isSwapped?: boolean) => {
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
          inputLang: isSwapped ? targetLang : inputLang,
          targetLang: isSwapped ? inputLang : targetLang,
          inputVoice: isSwapped ? targetVoice : inputVoice,
          targetVoice: isSwapped ? inputVoice : targetVoice
        }),
      });
      const data = await response.json();
      const now = new Date().toISOString();
      const processedPhrases: Phrase[] = splitPhrases.map((p, index) => ({
        input: isSwapped ? data.translated ? data.translated[index] || '' : '' : p,
        translated: isSwapped ? p : data.translated ? data.translated[index] || '' : '',
        inputAudio: isSwapped ? data.outputAudioSegments ? data.outputAudioSegments[index] || null : null : data.inputAudioSegments ? data.inputAudioSegments[index] || null : null,
        outputAudio: isSwapped ? data.inputAudioSegments ? data.inputAudioSegments[index] || null : null : data.outputAudioSegments ? data.outputAudioSegments[index] || null : null,
        romanized: data.romanizedOutput ? data.romanizedOutput[index] || '' : '',
        inputLang: inputLang || addToCollectionInputLang,
        targetLang: targetLang || addToCollectionTargetLang,
        inputVoice,
        targetVoice,
        created_at: now,
        isSwapped: isSwapped || false
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

  // When a saved collection is selected, load its state.
  const handleLoadCollection = async (config: Config) => {
    setLoading(true);
    try {
      if (playbackMethodsRef.current) {
        playbackMethodsRef.current.handleStop();
        playbackMethodsRef.current.setCurrentPhraseIndex(0);
        playbackMethodsRef.current.setCurrentPhase(config?.presentationConfig?.enableOutputBeforeInput ? 'output' : 'input');
      }
      setSelectedCollection(config.id);

      // Set the addToCollection language states based on the first phrase
      if (config.phrases.length > 0) {
        const firstPhrase = config.phrases[0];
        setAddToCollectionInputLang(firstPhrase.inputLang);
        setAddToCollectionTargetLang(firstPhrase.targetLang);
      }
      console.log(config?.presentationConfig)
      console.log(defaultPresentationConfig)
      // Set the presentation config from the collection
      setPresentationConfigBase(config?.presentationConfig || defaultPresentationConfig);

      // Scroll window to top
      window.scrollTo({
        top: 0,
      });

      setPhrases(config.phrases, config.id);
    } catch (err) {
      console.error('Loading error:', err);
      alert('Error loading configuration: ' + err);
    } finally {
      setLoading(false);
    }
  };

  // Update user stats when audio ends
  const updateUserStats = async (currentPhraseIndex: number) => {
    if (!user) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    // Get current phrase's languages
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) return;
    const { inputLang, targetLang } = currentPhrase;

    try {
      // Update the main stats document
      const statsRef = doc(firestore, 'users', user.uid, 'stats', 'listening');
      await updateDoc(statsRef, {
        phrasesListened: increment(1),
        lastListenedAt: now.toISOString()
      });

      // Update the daily stats
      const dailyStatsRef = doc(firestore, 'users', user.uid, 'stats', 'listening', 'daily', today);
      await updateDoc(dailyStatsRef, {
        count: increment(1),
        lastUpdated: now.toISOString()
      }).catch(async (err: unknown) => {
        // If the daily document doesn't exist, create it
        if (err && typeof err === 'object' && 'code' in err && err.code === 'not-found') {
          await setDoc(dailyStatsRef, {
            count: 1,
            lastUpdated: now.toISOString(),
            date: today
          });
        } else {
          console.error('Error updating daily stats:', err);
        }
      });

      // Update language stats
      const languageStatsRef = doc(firestore, 'users', user.uid, 'stats', 'listening', 'languages', `${inputLang}-${targetLang}`);
      await updateDoc(languageStatsRef, {
        count: increment(1),
        lastUpdated: now.toISOString(),
        inputLang,
        targetLang
      }).catch(async (err: unknown) => {
        // If the language document doesn't exist, create it
        if (err && typeof err === 'object' && 'code' in err && err.code === 'not-found') {
          await setDoc(languageStatsRef, {
            count: 1,
            lastUpdated: now.toISOString(),
            inputLang,
            targetLang,
            firstListened: now.toISOString()
          });
        } else {
          console.error('Error updating language stats:', err);
        }
      });

    } catch (err: unknown) {
      // If the main stats document doesn't exist, create it
      if (err && typeof err === 'object' && 'code' in err && err.code === 'not-found') {
        const statsRef = doc(firestore, 'users', user.uid, 'stats', 'listening');
        await setDoc(statsRef, {
          phrasesListened: 1,
          lastListenedAt: now.toISOString()
        });

        // Create the daily stats document
        const dailyStatsRef = doc(firestore, 'users', user.uid, 'stats', 'listening', 'daily', today);
        await setDoc(dailyStatsRef, {
          count: 1,
          lastUpdated: now.toISOString(),
          date: today
        });

        // Create the language stats document
        const languageStatsRef = doc(firestore, 'users', user.uid, 'stats', 'listening', 'languages', `${inputLang}-${targetLang}`);
        await setDoc(languageStatsRef, {
          count: 1,
          lastUpdated: now.toISOString(),
          inputLang,
          targetLang,
          firstListened: now.toISOString()
        });
      } else {
        console.error('Error updating user stats:', err);
      }
    }
  };

  // Rename a collection
  const handleRenameCollection = async (id: string) => {
    if (!user) return;
    const collection = savedCollections.find(col => col.id === id);
    if (!collection) return;
    const newName = prompt("Enter new list name:", collection.name);
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
      alert("Failed to rename list: " + err);
    }
  };

  // Delete a collection
  const handleDeleteCollection = async (id: string) => {
    if (!user) return;
    const collection = savedCollections.find(col => col.id === id);

    if (!collection) return;
    if (!window.confirm(`Delete list "${collection.name}"? This cannot be undone.`)) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', id);
      await deleteDoc(docRef);
      setSavedCollections(prev => prev.filter(col => col.id !== id));
      if (selectedCollection === id) {
        setSelectedCollection('');
        setPhrasesBase([]);
      }
    } catch (err) {
      alert("Failed to delete list: " + err);
    }
  };

  // Add the handleVoiceChange function near the other handlers
  const handleVoiceChange = async (inputVoice: string, targetVoice: string) => {
    if (!user || !selectedCollection) return;
    const collection = savedCollections.find(col => col.id === selectedCollection);
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
        throw new Error('Failed to reload list with new voices');
      }

      const { phrases: updatedPhrases } = await response.json();

      // Update both local states with the new phrases
      await setPhrases(updatedPhrases, selectedCollection);
    } catch (err) {
      console.error('Error updating voices:', err);
      alert('Failed to update voices: ' + err);
    }
  };


  // Add handleShare function
  const handleShare = async (id: string) => {
    if (!user) return;
    const phraseList = savedCollections.find(col => col.id === id);
    if (!phraseList) return;

    try {
      // Create a copy of the phraseList in the published_collections collection
      const sharedPhraseList = {
        ...phraseList,

        shared_by: user.uid,
        shared_at: new Date().toISOString(),
        shared_from_list: phraseList.id
      };
      const sharedRef = collection(firestore, 'published_collections');
      const docRef = await addDoc(sharedRef, sharedPhraseList);

      // Copy the share link to clipboard
      const shareUrl = `${window.location.origin}/share/${docRef.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Error sharing collection:', err);
      alert('Failed to share collection: ' + err);
    }
  };

  // Add handleUnshare function
  const handleUnshare = async (id: string) => {
    if (!user) return;
    const phraseList = savedCollections.find(col => col.id === id);
    if (!phraseList) return;

    try {
      // Find the shared collection in published_collections
      const sharedRef = collection(firestore, 'published_collections');
      const q = query(sharedRef, where('shared_by', '==', user.uid), where('shared_from_list', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Delete the shared collection
        const docRef = querySnapshot.docs[0].ref;
        await deleteDoc(docRef);
        alert('List unshared successfully!');
      } else {
        alert('No shared list found to unshare.');
      }
    } catch (err) {
      console.error('Error unsharing collection:', err);
      alert('Failed to unshare collection: ' + err);
    }
  };

  // Create the sticky header content
  const stickyHeaderContent = (
    <div className="w-full flex items-center p-2">
      {selectedCollection && savedCollections && (
        <CollectionHeader
          collectionId={selectedCollection}
          savedCollections={savedCollections}
          onRename={handleRenameCollection}
          onDelete={handleDeleteCollection}
          onVoiceChange={handleVoiceChange}
          onShare={handleShare}
          onUnshare={handleUnshare}
          inputLang={addToCollectionInputLang}
          targetLang={addToCollectionTargetLang}
          className="hidden lg:flex"
          titleClassName="max-w-[250px]"
        />
      )}
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
  );

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <SignInPage showLanguageSelect={true} />
      </div>
    );
  }

  return (
    // Container
    <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
      {/* Nav */}
      <div className={`flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50`}>
        {/* Back button - hidden when no collection selected */}
        <button
          onClick={() => {
            setSelectedCollection('');
            playbackMethodsRef.current?.handleStop();
            setPhrasesBase([])
          }}
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

        {/* List Title and Edit Buttons - shown on mobile when collection selected */}
        {selectedCollection && (
          <CollectionHeader
            collectionId={selectedCollection}
            savedCollections={savedCollections}
            onRename={handleRenameCollection}
            onDelete={handleDeleteCollection}
            onVoiceChange={handleVoiceChange}
            onShare={handleShare}
            onUnshare={handleUnshare}
            inputLang={addToCollectionInputLang}
            targetLang={addToCollectionTargetLang}
            className="lg:hidden"
            titleClassName="max-w-[150px]"
          />
        )}
      </div>




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
            loading={collectionsLoading}
          />
        </div>

        {/* Phrases and Playback */}
        {!phrases?.length && !selectedCollection && <h3 className="hidden lg:block p-3">Select a List or Import Phrases</h3>}
        {selectedCollection && (
          <PhrasePlaybackView
            phrases={phrases}
            setPhrases={setPhrases}
            presentationConfig={presentationConfig}
            setPresentationConfig={setPresentationConfig}
            collectionId={selectedCollection}
            collectionName={savedCollections.find(col => col.id === selectedCollection)?.name}
            showImportPhrases={true}
            stickyHeaderContent={stickyHeaderContent}
            updateUserStats={updateUserStats}
            methodsRef={playbackMethodsRef}
          />
        )}


      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportPhrasesDialog
          onClose={() => setShowImportDialog(false)}
          inputLang={addToCollectionInputLang}
          setInputLang={setAddToCollectionInputLang}
          targetLang={addToCollectionTargetLang}
          setTargetLang={setAddToCollectionTargetLang}
          phrasesInput={phrasesInput}
          setPhrasesInput={setPhrasesInput}
          loading={loading}
          onAddToCollection={handleAddToCollection}
        />
      )}

    </div >
  );
}