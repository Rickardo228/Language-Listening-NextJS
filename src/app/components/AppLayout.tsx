'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Config, languageOptions, Phrase, PresentationConfig, CollectionType as CollectionTypeEnum } from '../types';
import { API_BASE_URL } from '../consts';
import { ImportPhrases } from '../ImportPhrases';
import { User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit as fbLimit } from 'firebase/firestore';
import { CollectionList } from '../CollectionList';
import { useTheme } from '../ThemeProvider';
import { UserAvatar } from './UserAvatar';
import { defaultPresentationConfig, defaultPresentationConfigs } from '../defaultConfig';
import { useUser } from '../contexts/UserContext';
import defaultPhrasesData from '../../defaultPhrases.json';
import { trackCreateList, trackSelectList, trackCreatePhrase } from '../../lib/mixpanelClient';
import { TemplatesBrowser } from './TemplatesBrowser';
import { SignInPage } from '../SignInPage';

type PhraseData = {
  translated: string;
  audioUrl: string;
  duration: number;
  voice: string;
  romanized: string;
};
type LangData = {
  lang: string;
  data: { [key: string]: PhraseData };
};

const firestore = getFirestore();

const getDefaultPhrasesForLanguages = (inputLang: string, targetLang: string): Phrase[] => {
  const inputLangData = defaultPhrasesData.find(item => item.lang === inputLang) as LangData | undefined;
  const targetLangData = defaultPhrasesData.find(item => item.lang === targetLang) as LangData | undefined;
  if (!inputLangData || !targetLangData) return [];

  const now = new Date().toISOString();
  return Object.entries(inputLangData.data).map(([input, inputPhraseData]: [string, { translated: string; romanized: string; audioUrl: string; duration: number; voice: string }]) => {
    const targetPhraseData = targetLangData.data[input];

    let romanized = "";
    if (targetPhraseData && targetPhraseData.romanized && targetPhraseData.romanized !== "null") {
      romanized = targetPhraseData.romanized;
    } else if (inputPhraseData.romanized && inputPhraseData.romanized !== "null") {
      romanized = inputPhraseData.romanized;
    }

    return {
      input,
      translated: targetPhraseData ? targetPhraseData.translated : inputPhraseData.translated,
      inputLang: inputLang,
      targetLang: targetLang,
      inputAudio: inputPhraseData.audioUrl ? { audioUrl: inputPhraseData.audioUrl, duration: inputPhraseData.duration } : null,
      outputAudio: targetPhraseData && targetPhraseData.audioUrl ? { audioUrl: targetPhraseData.audioUrl, duration: targetPhraseData.duration } : null,
      romanized: romanized,
      inputVoice: inputPhraseData.voice,
      targetVoice: targetPhraseData ? targetPhraseData.voice : undefined,
      created_at: now
    };
  });
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthLoading } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  // Helper function to get URL parameters directly
  const getUrlParams = () => {
    if (typeof window === 'undefined') return {};
    const urlParams = new URLSearchParams(window.location.search);
    return {
      inputLang: urlParams.get('inputLang'),
      targetLang: urlParams.get('targetLang'),
      firstVisit: urlParams.get('firstVisit')
    };
  };

  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [newCollectionInputLang, setNewCollectionInputLang] = useState<string>(languageOptions[0]?.code);
  const [newCollectionTargetLang, setNewCollectionTargetLang] = useState<string>('it-IT');
  const hasSetLanguages = useRef(false);
  const [savedCollections, setSavedCollections] = useState<Config[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsLimited, setCollectionsLimited] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Don't show sidebar for certain routes
  const hideSidebar = pathname?.startsWith('/share/') || pathname?.startsWith('/privacy') || pathname?.startsWith('/terms');

  // Load saved collections from Firestore on mount or when user changes
  const initialiseCollections = useCallback(async (user: User) => {
    const urlParams = getUrlParams();
    const inputLang = urlParams.inputLang || undefined;
    const targetLang = urlParams.targetLang || undefined;

    const fetchCollections = async (opts?: { fetchAll?: boolean; limitCount?: number }) => {
      const colRef = collection(firestore, 'users', user.uid, 'collections');
      const q = opts?.fetchAll
        ? query(colRef, orderBy('created_at', 'desc'))
        : query(colRef, orderBy('created_at', 'desc'), fbLimit(opts?.limitCount || 10));
      const snapshot = await getDocs(q);
      const loaded: Config[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const phrases = data.phrases.map((phrase: Phrase) => ({
          ...phrase,
          created_at: phrase.created_at || data.created_at
        }));
        loaded.push({
          ...data,
          phrases,
          id: docSnap.id,
        } as Config);
      });
      setSavedCollections(loaded);

      if (loaded.length === 0) {
        let defaultPhrases: Phrase[] = [];

        if (inputLang && targetLang) {
          defaultPhrases = getDefaultPhrasesForLanguages(inputLang, targetLang);
        }

        await handleCreateCollection(defaultPhrases, "My List", "phrases", user);
      }

      if (loaded.length > 0) {
        const allPhrases = loaded.flatMap(col => col.phrases);
        const sortedPhrases = allPhrases.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        const mostRecentPhrase = sortedPhrases[0];
        if (mostRecentPhrase) {
          if (!hasSetLanguages.current) {
            setNewCollectionInputLang(mostRecentPhrase.inputLang);
            setNewCollectionTargetLang(mostRecentPhrase.targetLang);
          }
        }
      }
    };

    if (!savedCollections.length) {
      setCollectionsLoading(true);
      setLoading(true);
      await fetchCollections({ fetchAll: false, limitCount: 10 });
      setCollectionsLimited(true);
      setCollectionsLoading(false);
      setLoading(false);
    }
  }, [savedCollections.length]);

  useEffect(() => {
    if (user && !hideSidebar) {
      initialiseCollections(user);
    }
  }, [initialiseCollections, user, hideSidebar])

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
    setSavedCollections(prev => [...prev, newCollectionConfig]);

    trackCreateList(
      docRef.id,
      generatedName,
      phrases.length,
      collectionType || 'phrases',
      phrases[0]?.inputLang || 'unknown',
      phrases[0]?.targetLang || 'unknown'
    );

    handleLoadCollection(newCollectionConfig);
    return docRef.id;
  };

  const handleProcess = async (prompt?: string, inputLang?: string, targetLang?: string, collectionType?: CollectionTypeEnum) => {
    let splitPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (collectionType === 'article') {
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
      const processedPhrases: Phrase[] = splitPhrases.map((p, index) => ({
        input: p,
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

      processedPhrases.forEach((phrase, index) => {
        trackCreatePhrase(
          `${collectionId}-${index}`,
          phrase.inputLang,
          phrase.targetLang,
          !!(phrase.inputAudio || phrase.outputAudio)
        );
      });

      setPhrasesInput('');

      // Navigate to the new collection
      router.push(`/collection/${collectionId}`);

    } catch (err) {
      console.error('Processing error:', err);
      alert(err)
    }
    setLoading(false);
  };

  const handleLoadCollection = async (config: Config) => {
    setLoading(true);
    try {
      trackSelectList(
        config.id,
        config.name,
        config.phrases.length,
        config.phrases[0]?.inputLang || 'unknown',
        config.phrases[0]?.targetLang || 'unknown'
      );

      // Navigate to the collection route
      router.push(`/collection/${config.id}`);

    } catch (err) {
      console.error('Loading error:', err);
      alert('Error loading configuration: ' + err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteCollection = async (id: string) => {
    if (!user) return;
    const collection = savedCollections.find(col => col.id === id);

    if (!collection) return;
    if (!window.confirm(`Delete list "${collection.name}"? This cannot be undone.`)) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', id);
      await deleteDoc(docRef);
      setSavedCollections(prev => prev.filter(col => col.id !== id));
      
      // Navigate back to home if we deleted the current collection
      router.push('/');
    } catch (err) {
      alert("Failed to delete list: " + err);
    }
  };

  const handleShare = async (id: string) => {
    if (!user) return;
    const phraseList = savedCollections.find(col => col.id === id);
    if (!phraseList) return;

    try {
      const sharedPhraseList = {
        ...phraseList,
        shared_by: user.uid,
        shared_at: new Date().toISOString(),
        shared_from_list: phraseList.id
      };
      const sharedRef = collection(firestore, 'published_collections');
      const docRef = await addDoc(sharedRef, sharedPhraseList);

      const shareUrl = `${window.location.origin}/share/${docRef.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Error sharing collection:', err);
      alert('Failed to share collection: ' + err);
    }
  };

  const handleUnshare = async (id: string) => {
    if (!user) return;
    const phraseList = savedCollections.find(col => col.id === id);
    if (!phraseList) return;

    try {
      const sharedRef = collection(firestore, 'published_collections');
      const q = query(sharedRef, where('shared_by', '==', user.uid), where('shared_from_list', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
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

  const handleHome = () => {
    router.push('/');
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !hideSidebar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <SignInPage showLanguageSelect={true} />
      </div>
    );
  }

  return (
    <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
      {/* Nav */}
      <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Language Shadowing</h1>
          {!hideSidebar && (
            <button
              onClick={handleHome}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-sm"
              title="Home"
            >
              Home
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
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
          {user && (
            <UserAvatar
              user={user}
              avatarDialogOpen={avatarDialogOpen}
              setAvatarDialogOpen={setAvatarDialogOpen}
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex lg:flex-row flex-col-reverse w-full lg:h-[92vh] ${hideSidebar ? '' : ''}`}>
        {/* Saved Configs List - hide for certain routes */}
        {!hideSidebar && user && (
          <div className={`flex flex-col gap-10 bg-neutral-950 lg:bg-secondary/50 p-5 ${isCollapsed ? 'lg:w-[50px] overflow-hidden' : 'lg:w-[460px] min-w-[300px]'} max-w-[100vw] h-[100%] overflow-visible lg:overflow-y-auto mb-[80px] relative transition-all duration-300`}>
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block absolute top-2 right-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 transition-transform duration-200"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={isCollapsed ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
              </svg>
            </button>

            {!isCollapsed && (
              <>
                {/* Mobile: Featured Templates above the list */}
                <div className="lg:hidden mb-4">
                  <TemplatesBrowser showHeader={false} />
                </div>
                <div className="fixed bottom-0 left-0 z-10 w-full lg:w-[460px] bg-neutral-950 lg:bg-secondary/50 p-5">
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
                  selectedCollection=""
                  loading={collectionsLoading}
                  showAllButton={collectionsLimited}
                  onShowAllClick={async () => {
                    if (!user) return;
                    setCollectionsLoading(true);
                    const colRef = collection(firestore, 'users', user.uid, 'collections');
                    const q = query(colRef, orderBy('created_at', 'desc'));
                    const snapshot = await getDocs(q);
                    const loaded: Config[] = [];
                    snapshot.forEach(docSnap => {
                      const data = docSnap.data();
                      const phrases = data.phrases.map((phrase: Phrase) => ({
                        ...phrase,
                        created_at: phrase.created_at || data.created_at
                      }));
                      loaded.push({ ...data, phrases, id: docSnap.id } as Config);
                    });
                    setSavedCollections(loaded);
                    setCollectionsLimited(false);
                    setCollectionsLoading(false);
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${hideSidebar ? '' : 'p-3'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}