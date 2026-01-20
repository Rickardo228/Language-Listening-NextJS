'use client'

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { ImportPhrasesDialog } from './ImportPhrasesDialog';
import { defaultPresentationConfigs } from './defaultConfig';
import { Phrase } from './types';
import { useUser } from './contexts/UserContext';
import { useCollections } from './contexts/CollectionsContext';
import { createCollection } from './utils/collectionService';
import { firestore } from './firebase';

interface LikePhraseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: Phrase | null;
}

export function LikePhraseDialog({ isOpen, onClose, phrase }: LikePhraseDialogProps) {
  const { user } = useUser();
  const { upsertCollection, appendPhraseToCollection } = useCollections();
  const [matchingCollections, setMatchingCollections] = useState<Array<{ id: string; name: string; isReversed: boolean }>>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputLang, setInputLang] = useState(phrase?.inputLang || '');
  const [targetLang, setTargetLang] = useState(phrase?.targetLang || '');
  const [phrasesInput, setPhrasesInput] = useState(phrase?.input || '');

  useEffect(() => {
    if (!phrase) return;
    setInputLang(phrase.inputLang);
    setTargetLang(phrase.targetLang);
    setPhrasesInput(phrase.input);
  }, [phrase]);

  useEffect(() => {
    const loadCollections = async () => {
      if (!user || !isOpen || !phrase) return;
      setLoadingCollections(true);
      try {
        const colRef = collection(firestore, 'users', user.uid, 'collections');
        const q = query(colRef, orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        const matched: Array<{ id: string; name: string; isReversed: boolean }> = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const firstPhrase = Array.isArray(data.phrases) ? data.phrases[0] : null;
          // Include empty collections (no way to know direction, default to not reversed)
          if (!firstPhrase) {
            matched.push({ id: docSnap.id, name: data.name || 'Untitled', isReversed: false });
          } else if (firstPhrase.inputLang === phrase.inputLang && firstPhrase.targetLang === phrase.targetLang) {
            matched.push({ id: docSnap.id, name: data.name || 'Untitled', isReversed: false });
          } else if (firstPhrase.inputLang === phrase.targetLang && firstPhrase.targetLang === phrase.inputLang) {
            matched.push({ id: docSnap.id, name: data.name || 'Untitled', isReversed: true });
          }
        });

        setMatchingCollections(matched);
        setSelectedCollectionId('');
      } catch (error) {
        console.error('Error loading collections:', error);
        toast.error('Failed to load collections.');
      } finally {
        setLoadingCollections(false);
      }
    };

    loadCollections();
  }, [user, isOpen, phrase]);

  const collectionOptions = useMemo(() => {
    return matchingCollections.map((collection) => ({
      value: collection.id,
      label: collection.isReversed ? `${collection.name}` : collection.name,
    }));
  }, [matchingCollections]);

  const handleCreateCollection = async (name: string) => {
    if (!user || !phrase) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const phraseToAdd = { ...phrase, created_at: now };
      const collectionId = await createCollection([phraseToAdd], name, 'phrases', user, user, { skipTracking: false });
      upsertCollection({
        id: collectionId,
        name,
        phrases: [phraseToAdd],
        created_at: now,
        collectionType: 'phrases',
        presentationConfig: {
          ...defaultPresentationConfigs.phrases,
          name,
        },
      });
      toast.success(`Saved to "${name}"`);
      onClose();
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleAddToCollection();
    onClose();
  };

  const handleAddToCollection = async (_inputLang?: string, _targetLang?: string, _isSwapped?: boolean) => {
    if (!user) {
      toast.error('Please sign in to save phrases.');
      return;
    }
    if (!phrase) {
      toast.error('No phrase to save.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const selectedCollection = matchingCollections.find((collection) => collection.id === selectedCollectionId);
      const phraseToAdd = selectedCollection?.isReversed
        ? {
          ...phrase,
          input: phrase.translated,
          translated: phrase.input,
          inputAudio: phrase.outputAudio,
          outputAudio: phrase.inputAudio,
          inputLang: phrase.targetLang,
          targetLang: phrase.inputLang,
          inputVoice: phrase.targetVoice,
          targetVoice: phrase.inputVoice,
          romanized: '',
          created_at: now,
        }
        : { ...phrase, created_at: now };

      if (matchingCollections.length === 0) {
        const collectionId = await createCollection([phraseToAdd], 'Liked Phrases', 'phrases', user, user, { skipTracking: false });
        upsertCollection({
          id: collectionId,
          name: 'Liked Phrases',
          phrases: [phraseToAdd],
          created_at: now,
          collectionType: 'phrases',
          presentationConfig: {
            ...defaultPresentationConfigs.phrases,
            name: 'Liked Phrases',
          },
        });
        toast.success('Saved to Liked Phrases.');
      } else {
        if (!selectedCollectionId) {
          toast.error('Please select a collection.');
          return;
        }
        const docRef = doc(firestore, 'users', user.uid, 'collections', selectedCollectionId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          toast.error('Collection not found.');
          return;
        }
        const data = snapshot.data();
        const existingPhrases = Array.isArray(data.phrases) ? data.phrases : [];
        await updateDoc(docRef, { phrases: [...existingPhrases, phraseToAdd] });
        appendPhraseToCollection(selectedCollectionId, phraseToAdd);
        toast.success('Phrase added.');
      }
    } catch (error) {
      console.error('Error saving phrase:', error);
      toast.error('Failed to save phrase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImportPhrasesDialog
      isOpen={isOpen}
      onClose={onClose}
      inputLang={inputLang}
      setInputLang={setInputLang}
      targetLang={targetLang}
      setTargetLang={setTargetLang}
      phrasesInput={phrasesInput}
      setPhrasesInput={setPhrasesInput}
      loading={saving}
      collectionsLoading={loadingCollections}
      onAddToCollection={handleAddToCollection}
      variant="like"
      collectionOptions={collectionOptions}
      selectedCollectionId={selectedCollectionId}
      setSelectedCollectionId={setSelectedCollectionId}
      onCreateCollection={handleCreateCollection}
      autoFocusCollection
      onCollectionSubmit={handleSubmit}
    />
  );
}
