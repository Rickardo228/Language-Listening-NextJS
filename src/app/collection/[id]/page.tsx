'use client'

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Config, Phrase, PresentationConfig } from '../../types';
import { usePresentationConfig } from '../../hooks/usePresentationConfig';
import { API_BASE_URL } from '../../consts';
import { ImportPhrases } from '../../ImportPhrases';
import { getFirestore, doc, updateDoc, getDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { CollectionHeader } from '../../CollectionHeader';
import { defaultPresentationConfig } from '../../defaultConfig';
import { useUser } from '../../contexts/UserContext';
import { PhrasePlaybackView, PhrasePlaybackMethods } from '../../components/PhrasePlaybackView';
import { uploadBackgroundMedia, deleteBackgroundMedia } from '../../utils/backgroundUpload';
import { toast } from 'sonner';

const firestore = getFirestore();

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { user } = useUser();

  const [phrases, setPhrasesBase] = useState<Phrase[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>(collectionId);
  const [collectionConfig, setCollectionConfig] = useState<Config | null>(null);
  const [addToCollectionInputLang, setAddToCollectionInputLang] = useState<string>('en-GB');
  const [addToCollectionTargetLang, setAddToCollectionTargetLang] = useState<string>('it-IT');
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { presentationConfig, setPresentationConfig: setPresentationConfigBase } = usePresentationConfig();
  const playbackMethodsRef = useRef<PhrasePlaybackMethods | null>(null);

  const setPhrases = async (phrases: Phrase[], collectionId?: string) => {
    setPhrasesBase(phrases);
    if (selectedCollection && user) {
      const docRef = doc(firestore, 'users', user.uid, 'collections', collectionId || selectedCollection);
      await updateDoc(docRef, { phrases });
      if (collectionConfig) {
        setCollectionConfig({ ...collectionConfig, phrases });
      }
    }
  }

  const setPresentationConfig = async (newConfig: Partial<PresentationConfig>) => {
    // Handle background removal (bgImage set to null)
    if ('bgImage' in newConfig && newConfig.bgImage === null && presentationConfig?.bgImage) {
      const oldBgImage = presentationConfig.bgImage;
      // Delete from storage if Firebase URL
      if (oldBgImage.includes('storage.googleapis.com') && user && selectedCollection) {
        try {
          await deleteBackgroundMedia(user.uid, selectedCollection, oldBgImage);
        } catch (deleteError) {
          console.error('Error deleting background:', deleteError);
          // Continue even if deletion fails
        }
      }
    }

    setPresentationConfigBase(newConfig);
    if (selectedCollection && user) {
      try {
        const docRef = doc(firestore, 'users', user.uid, 'collections', selectedCollection);
        const updatedConfig = { ...presentationConfig, ...newConfig } as PresentationConfig;
        await updateDoc(docRef, {
          presentationConfig: updatedConfig
        });
        if (collectionConfig) {
          setCollectionConfig({ ...collectionConfig, presentationConfig: updatedConfig });
        }
      } catch (err) {
        console.error('Error updating presentation config:', err);
        toast.error('Failed to save settings: ' + err);
      }
    }
  };

  // Load collection data
  useEffect(() => {
    const loadCollection = async () => {
      if (!user || !collectionId) return;

      setLoading(true);
      try {
        const docRef = doc(firestore, 'users', user.uid, 'collections', collectionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const config: Config = {
            ...data,
            id: docSnap.id,
          } as Config;

          setCollectionConfig(config);
          setPhrasesBase(config.phrases);
          setSelectedCollection(config.id);

          // Set the addToCollection language states based on the first phrase
          if (config.phrases.length > 0) {
            const firstPhrase = config.phrases[0];
            setAddToCollectionInputLang(firstPhrase.inputLang);
            setAddToCollectionTargetLang(firstPhrase.targetLang);
          }

          // Set the presentation config from the collection
          setPresentationConfigBase(config?.presentationConfig || defaultPresentationConfig);

          // Reset playback state
          if (playbackMethodsRef.current) {
            playbackMethodsRef.current.handleStop();
            playbackMethodsRef.current.setCurrentPhraseIndex(0);
            // Determine initial phase considering both enableOutputBeforeInput and enableInputPlayback
            let initialPhase: 'input' | 'output';
            if (config?.presentationConfig?.enableOutputBeforeInput) {
              initialPhase = 'output';
            } else {
              initialPhase = config?.presentationConfig?.enableInputPlayback ? 'input' : 'output';
            }
            playbackMethodsRef.current.setCurrentPhase(initialPhase);
          }
        }
      } catch (err) {
        console.error('Error loading collection:', err);
        toast.error('Error loading collection: ' + err);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [user, collectionId]);

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
      toast.error(String(err))
    }
    setLoading(false);
  };

  const handleVoiceChange = async (inputVoice: string, targetVoice: string) => {
    if (!user || !selectedCollection || !collectionConfig) return;

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
          phrases: collectionConfig.phrases.map(phrase => ({
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
      toast.error('Failed to update voices: ' + err);
    }
  };

  // Collection operation handlers
  const handleRenameCollection = async (id: string) => {
    if (!user || !collectionConfig) return;
    const newName = prompt("Enter new list name:", collectionConfig.name);
    if (!newName || newName.trim() === collectionConfig.name) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', id);
      await updateDoc(docRef, { name: newName.trim() });
      setCollectionConfig({ ...collectionConfig, name: newName.trim() });
    } catch (err) {
      toast.error("Failed to rename list: " + err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!user || !collectionConfig) return;
    if (!window.confirm(`Delete list "${collectionConfig.name}"? This cannot be undone.`)) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'collections', id);
      await deleteDoc(docRef);
      // Navigate back to home after deletion
      router.push('/');
    } catch (err) {
      toast.error("Failed to delete list: " + err);
    }
  };

  const handleShare = async () => {
    if (!user || !collectionConfig) return;
    try {
      const sharedPhraseList = {
        ...collectionConfig,
        shared_by: user.uid,
        shared_at: new Date().toISOString(),
        shared_from_list: collectionConfig.id
      };
      const sharedRef = collection(firestore, 'published_collections');
      const docRef = await addDoc(sharedRef, sharedPhraseList);

      const shareUrl = `${window.location.origin}/share/${docRef.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      console.error('Error sharing collection:', err);
      toast.error('Failed to share collection: ' + err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedCollection) {
      return;
    }

    try {
      // Delete old background if it exists and is a Firebase Storage URL
      const oldBgImage = presentationConfig?.bgImage;
      if (oldBgImage && oldBgImage.includes('storage.googleapis.com')) {
        try {
          await deleteBackgroundMedia(user.uid, selectedCollection, oldBgImage);
        } catch (deleteError) {
          console.error('Error deleting old background:', deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Upload new background
      const { downloadUrl } = await uploadBackgroundMedia(file, user.uid, selectedCollection);

      // Update presentation config with new URL
      await setPresentationConfig({ bgImage: downloadUrl });
    } catch (error) {
      console.error('Error uploading background:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload background. Please try again.');
    } finally {
      // Reset file input
      e.target.value = '';
    }
  };

  const handleUnshare = async (id: string) => {
    if (!user || !collectionConfig) return;
    try {
      const sharedRef = collection(firestore, 'published_collections');
      const q = query(sharedRef, where('shared_by', '==', user.uid), where('shared_from_list', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await deleteDoc(docRef);
        toast.success('List unshared successfully!');
      } else {
        toast.error('No shared list found to unshare.');
      }
    } catch (err) {
      console.error('Error unsharing collection:', err);
      toast.error('Failed to unshare collection: ' + err);
    }
  };

  // Create the sticky header content
  const stickyHeaderContent = (
    <div className="w-full flex items-center p-2">
      {selectedCollection && collectionConfig && (
        <CollectionHeader
          collectionId={selectedCollection}
          savedCollections={[collectionConfig]}
          onRename={handleRenameCollection}
          onDelete={handleDeleteCollection}
          onVoiceChange={handleVoiceChange}
          onShare={() => handleShare()}
          onUnshare={handleUnshare}
          inputLang={addToCollectionInputLang}
          targetLang={addToCollectionTargetLang}
          className="flex"
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

  if (loading && !collectionConfig) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!collectionConfig) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Collection not found</h2>
          <p className="text-muted-foreground">The requested collection could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <PhrasePlaybackView
      phrases={phrases}
      setPhrases={setPhrases}
      presentationConfig={presentationConfig}
      setPresentationConfig={setPresentationConfig}
      collectionId={selectedCollection}
      collectionName={collectionConfig.name}
      showImportPhrases={true}
      stickyHeaderContent={stickyHeaderContent}
      methodsRef={playbackMethodsRef}
      handleImageUpload={handleImageUpload}
      itemType="collection"
    />
  );
}