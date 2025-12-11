'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Sun, Moon, ChevronRight, Library } from 'lucide-react';
import { Config, languageOptions, Phrase, CollectionType as CollectionTypeEnum } from '../types';
import { API_BASE_URL } from '../consts';
import { ImportPhrases } from '../ImportPhrases';
import { User } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { CollectionList } from '../CollectionList';
import { useTheme } from '../ThemeProvider';
import { UserAvatar } from './UserAvatar';
import { defaultPresentationConfig, defaultPresentationConfigs } from '../defaultConfig';
import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import { trackSelectList, trackCreatePhrase, track } from '../../lib/mixpanelClient';
import { createCollection } from '../utils/collectionService';
import { toast } from 'sonner';
import { TemplatesBrowser } from './TemplatesBrowser';
import { SignInPage } from '../SignInPage';
import { OnboardingGuard } from './OnboardingGuard';
import { BottomNavigation } from './BottomNavigation';
import { shouldHideSidebar, shouldHideBottomNav, getCollectionIdFromPath, ROUTES } from '../routes';


const firestore = getFirestore();

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthLoading, userProfile } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, setIsCollapsed } = useSidebar();


  // User input and language selection
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [newCollectionInputLang, setNewCollectionInputLang] = useState<string>(
    userProfile?.preferredInputLang || languageOptions[0]?.code || 'en-GB'
  );
  const [newCollectionTargetLang, setNewCollectionTargetLang] = useState<string>(
    userProfile?.preferredTargetLang || 'it-IT'
  );
  const hasSetLanguages = useRef(false);
  const [savedCollections, setSavedCollections] = useState<Config[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsLimited, setCollectionsLimited] = useState(true);

  // Update collection languages when user profile loads
  useEffect(() => {
    if (userProfile?.preferredInputLang && userProfile?.preferredTargetLang) {
      setNewCollectionInputLang(userProfile.preferredInputLang);
      setNewCollectionTargetLang(userProfile.preferredTargetLang);
    }
  }, [userProfile?.preferredInputLang, userProfile?.preferredTargetLang]);
  const [loading, setLoading] = useState<boolean>(false);

  // Don't show sidebar for certain routes
  const hideSidebar = shouldHideSidebar(pathname);

  // Extract current collection ID from URL for highlighting in sidebar
  const currentCollectionId = getCollectionIdFromPath(pathname);

  // Load saved collections from Firestore on mount or when user changes
  const initialiseCollections = useCallback(async (user: User) => {


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
  }, [savedCollections.length, userProfile?.preferredInputLang, userProfile?.preferredTargetLang]);

  useEffect(() => {
    if (user && !hideSidebar) {
      initialiseCollections(user);
    }
  }, [initialiseCollections, user, hideSidebar])

  // Save a new collection to Firestore
  const handleCreateCollection = async (phrases: Phrase[], prompt?: string, collectionType?: CollectionTypeEnum, userArg?: User, skipTracking?: boolean) => {
    const docRef = await createCollection(phrases, prompt, collectionType, userArg, user || undefined, { skipTracking });

    const generatedName = prompt || 'New List';
    const now = new Date().toISOString();
    const newCollectionConfig = {
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
      },
      id: docRef
    };

    setSavedCollections(prev => [...prev, newCollectionConfig]);
    handleLoadCollection(newCollectionConfig, skipTracking);
    return docRef;
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

      const collectionId = await handleCreateCollection(processedPhrases, prompt, collectionType, undefined, false);

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
      toast.error(String(err))
    }
    setLoading(false);
  };

  const handleLoadCollection = async (config: Config, skipTracking?: boolean) => {
    setLoading(true);
    try {
      if (!skipTracking) {
        trackSelectList(
          config.id,
          config.name,
          config.phrases.length,
          config.phrases[0]?.inputLang || 'unknown',
          config.phrases[0]?.targetLang || 'unknown'
        );
      }

      // Navigate to the collection route
      router.push(`/collection/${config.id}`);

    } catch (err) {
      console.error('Loading error:', err);
      toast.error('Error loading configuration: ' + err);
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
      toast.error("Failed to rename list: " + err);
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
      toast.error("Failed to delete list: " + err);
    }
  };


  const handleHome = () => {
    track('Home Button Clicked', { source: 'header' });

    // On mobile, if on a collection page, navigate to library instead of home
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    const isOnCollectionPage = pathname.startsWith('/collection/');

    if (isMobile && isOnCollectionPage) {
      router.push(ROUTES.LIBRARY);
    } else {
      router.push(ROUTES.HOME);
    }
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
    <OnboardingGuard>
      <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
        {/* Nav */}
        <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-3 text-2xl cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleHome}
              title="Home"
            >
              <img
                src={theme === 'light' ? '/language-shadowing-logo-dark.png' : '/language-shadowing-logo-white.png'}
                alt="Language Shadowing Logo - Learn Languages Through Audio Practice"
                className="w-8 h-8 sm:ml-2 sm:mt-0.5"
              />
              <h1 className="hidden sm:block">Language Shadowing</h1>
            </div>
            <button
              onClick={handleHome}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
              title="Home"
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                track('Theme Toggle Clicked', { newTheme: theme === 'light' ? 'dark' : 'light' });
                toggleTheme();
              }}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Sun className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
            {user && (
              <UserAvatar
                user={user}
              />
            )}
          </div>
        </div>

        {/* Main content */}
        <div className={`flex lg:flex-row flex-col-reverse w-full lg:h-[92vh] ${hideSidebar ? '' : ''}`}>
          {/* Saved Configs List - hide for certain routes */}
          {pathname !== '/templates' && !hideSidebar && user && (
            <div className={`group hidden lg:flex flex-col gap-10 bg-background lg:bg-secondary/50 p-5 ${isCollapsed ? 'lg:w-[60px] overflow-hidden' : 'lg:w-[460px] min-w-[300px]'} max-w-[100vw] h-[100%] overflow-visible lg:overflow-y-auto mb-[80px] relative transition-all duration-300`}>

              {!isCollapsed && (
                <>

                  <CollectionList
                    savedCollections={savedCollections}
                    onLoadCollection={handleLoadCollection}
                    onRenameCollection={handleRenameCollection}
                    onDeleteCollection={handleDeleteCollection}
                    selectedCollection={currentCollectionId}
                    loading={collectionsLoading}
                    showAllButton={collectionsLimited}
                    actionButton={
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
                    }
                    title={
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            track('Sidebar Collapsed');
                            setIsCollapsed(true);
                          }}
                          className="hidden lg:block p-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-all duration-200 opacity-0 group-hover:opacity-100 w-0 group-hover:w-6 overflow-hidden group-hover:mr-2"
                          title="Collapse"
                        >
                          <ChevronRight
                            className="w-4 h-4 transition-transform duration-200 min-w-4 rotate-180"
                            strokeWidth={1.5}
                          />
                        </button>
                        <span>Your Library</span>
                      </div>
                    }
                    onShowAllClick={async () => {
                      if (!user) return;
                      track('Show All Collections Clicked');
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

              {isCollapsed && (
                <div className="flex flex-col items-center pt-2 px-2">
                  <button
                    onClick={() => {
                      track('Sidebar Expanded');
                      setIsCollapsed(false);
                    }}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                    title="Open Library"
                  >
                    <Library className="w-5 h-5" fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className={`flex-1 ${!shouldHideBottomNav(pathname) && user ? 'pb-20 lg:pb-0' : ''}`}>
            {children}
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        {!shouldHideBottomNav(pathname) && user && <BottomNavigation />}
      </div>
    </OnboardingGuard>
  );
}