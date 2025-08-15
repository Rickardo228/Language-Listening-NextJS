'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Config, Phrase, PresentationConfig } from '../../types';
import { usePresentationConfig } from '../../hooks/usePresentationConfig';
import { API_BASE_URL } from '../../consts';
import { ImportPhrases } from '../../ImportPhrases';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { CollectionHeader } from '../../CollectionHeader';
import { defaultPresentationConfig } from '../../defaultConfig';
import { useUser } from '../../contexts/UserContext';
import { PhrasePlaybackView, PhrasePlaybackMethods } from '../../components/PhrasePlaybackView';

const firestore = getFirestore();

export default function CollectionPage() {
  const params = useParams();
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
        alert('Failed to save settings: ' + err);
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
            playbackMethodsRef.current.setCurrentPhase(config?.presentationConfig?.enableOutputBeforeInput ? 'output' : 'input');
          }
        }
      } catch (err) {
        console.error('Error loading collection:', err);
        alert('Error loading collection: ' + err);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [user, collectionId, setPresentationConfigBase]);

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
      alert('Failed to update voices: ' + err);
    }
  };

  // Dummy handlers for collection operations (these will be managed from the sidebar)
  const handleRenameCollection = async () => {};
  const handleDeleteCollection = async () => {};
  const handleShare = async () => {};
  const handleUnshare = async () => {};

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
    />
  );
}