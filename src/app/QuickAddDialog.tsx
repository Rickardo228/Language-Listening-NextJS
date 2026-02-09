'use client'

import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ImportPhrasesDialog } from './ImportPhrasesDialog';
import { defaultPresentationConfigs } from './defaultConfig';
import { Phrase, CollectionType } from './types';
import { useUser } from './contexts/UserContext';
import { useCollections } from './contexts/CollectionsContext';
import { createCollection } from './utils/collectionService';
import { autoNameCollection } from './utils/generateCollectionName';
import { firestore } from './firebase';
import { trackCreatePhrase } from '../lib/mixpanelClient';
import { useProcessPhrases } from './hooks/useProcessPhrases';

const CREATE_NEW_VALUE = '__create_new__';
const DEFAULT_LIST_KEY = 'default-collection-id';

interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddDialog({ isOpen, onClose }: QuickAddDialogProps) {
  const router = useRouter();
  const { user, userProfile } = useUser();
  const { upsertCollection, appendPhraseToCollection, renameCollection } = useCollections();

  const [inputLang, setInputLang] = useState(userProfile?.preferredInputLang || 'en-GB');
  const [targetLang, setTargetLang] = useState(userProfile?.preferredTargetLang || 'it-IT');
  const [phrasesInput, setPhrasesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchingCollections, setMatchingCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(CREATE_NEW_VALUE);
  const [defaultCollectionId, setDefaultCollectionId] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(false);

  const { processPhrases, progress: processProgress } = useProcessPhrases({
    inputLang,
    targetLang,
  });

  // Sync languages when user profile loads
  useEffect(() => {
    if (userProfile?.preferredInputLang) setInputLang(userProfile.preferredInputLang);
    if (userProfile?.preferredTargetLang) setTargetLang(userProfile.preferredTargetLang);
  }, [userProfile?.preferredInputLang, userProfile?.preferredTargetLang]);

  // Fetch collections filtered by selected languages
  useEffect(() => {
    const loadCollections = async () => {
      if (!user || !isOpen) return;
      setLoadingCollections(true);
      try {
        const colRef = collection(firestore, 'users', user.uid, 'collections');
        const q = query(colRef, orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        const matched: Array<{ id: string; name: string }> = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const firstPhrase = Array.isArray(data.phrases) ? data.phrases[0] : null;
          if (!firstPhrase) {
            matched.push({ id: docSnap.id, name: data.name || 'Untitled' });
          } else if (
            (firstPhrase.inputLang === inputLang && firstPhrase.targetLang === targetLang) ||
            (firstPhrase.inputLang === targetLang && firstPhrase.targetLang === inputLang)
          ) {
            matched.push({ id: docSnap.id, name: data.name || 'Untitled' });
          }
        });

        setMatchingCollections(matched);

        // Auto-select stored default if it exists in the filtered list
        const storedDefault = localStorage.getItem(DEFAULT_LIST_KEY);
        setDefaultCollectionId(storedDefault);
        if (storedDefault && matched.some((c) => c.id === storedDefault)) {
          setSelectedCollectionId(storedDefault);
        } else {
          setSelectedCollectionId(CREATE_NEW_VALUE);
        }
      } catch (error) {
        console.error('Error loading collections:', error);
        toast.error('Failed to load collections.');
      } finally {
        setLoadingCollections(false);
      }
    };

    loadCollections();
  }, [user, isOpen, inputLang, targetLang]);

  const collectionOptions = useMemo(() => {
    const options = [
      { value: CREATE_NEW_VALUE, label: '+ Create new list' },
      ...matchingCollections.map((c) => ({ value: c.id, label: c.name })),
    ];
    return options;
  }, [matchingCollections]);


  const handleAddToCollection = useCallback(async () => {
    if (!user || !phrasesInput.trim()) return;

    const segmenter = new Intl.Segmenter(inputLang || 'en', { granularity: 'sentence' });
    const rawPhrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) =>
        [...segmenter.segment(line)].map((s) => s.segment.trim()).filter(Boolean)
      );

    if (!rawPhrases.length) return;

    setLoading(true);
    try {
      const processedPhrases = await processPhrases(rawPhrases);

      if (selectedCollectionId === CREATE_NEW_VALUE) {
        // Create a new collection
        const now = new Date().toISOString();
        const collectionId = await createCollection(
          processedPhrases,
          undefined,
          'phrases',
          user,
          user,
          { skipTracking: false }
        );

        upsertCollection({
          id: collectionId,
          name: 'New List',
          phrases: processedPhrases,
          created_at: now,
          collectionType: 'phrases',
          presentationConfig: {
            ...defaultPresentationConfigs.phrases,
            name: 'New List',
          },
        });

        processedPhrases.forEach((phrase, index) => {
          trackCreatePhrase(
            `${collectionId}-${index}`,
            phrase.inputLang,
            phrase.targetLang,
            !!(phrase.inputAudio || phrase.outputAudio)
          );
        });

        // Auto-generate a name in the background
        autoNameCollection(
          processedPhrases,
          inputLang,
          collectionId,
          user.uid,
          (name) => renameCollection(collectionId, name)
        );

        setPhrasesInput('');
        router.push(`/collection/${collectionId}`);
      } else {
        // Add to existing collection
        const docRef = doc(firestore, 'users', user.uid, 'collections', selectedCollectionId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          toast.error('List not found.');
          return;
        }
        const data = snapshot.data();
        const existingPhrases = Array.isArray(data.phrases) ? data.phrases : [];
        const now = new Date().toISOString();
        const phrasesWithTimestamp = processedPhrases.map((p) => ({ ...p, created_at: now }));
        await updateDoc(docRef, { phrases: [...existingPhrases, ...phrasesWithTimestamp] });

        phrasesWithTimestamp.forEach((phrase) => {
          appendPhraseToCollection(selectedCollectionId, phrase);
        });

        toast.success(`Added ${processedPhrases.length} phrase${processedPhrases.length > 1 ? 's' : ''} to "${data.name}"`);
        setPhrasesInput('');
        router.push(`/collection/${selectedCollectionId}?scrollTo=${existingPhrases.length}`);
      }
    } catch (err) {
      console.error('Quick add error:', err);
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }, [user, phrasesInput, inputLang, targetLang, selectedCollectionId, router, appendPhraseToCollection]);

  const handleSetDefault = useCallback(() => {
    localStorage.setItem(DEFAULT_LIST_KEY, selectedCollectionId);
    setDefaultCollectionId(selectedCollectionId);
  }, [selectedCollectionId]);

  const handleCreateCollection = async (name: string) => {
    if (!user) return;
    setSelectedCollectionId(CREATE_NEW_VALUE);
    // The actual creation happens on submit — this just sets up the name
    // For now, create immediately and select it
    try {
      const now = new Date().toISOString();
      const collectionId = await createCollection([], name, 'phrases', user, user, { skipTracking: false });
      upsertCollection({
        id: collectionId,
        name,
        phrases: [],
        created_at: now,
        collectionType: 'phrases',
        presentationConfig: {
          ...defaultPresentationConfigs.phrases,
          name,
        },
      });
      setMatchingCollections((prev) => [{ id: collectionId, name }, ...prev]);
      setSelectedCollectionId(collectionId);
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list.');
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
      loading={loading}
      processProgress={processProgress}
      collectionsLoading={loadingCollections}
      onAddToCollection={handleAddToCollection}
      showSuggestedTopicChips
      showSuggestedTopicChipsForSelectedList={false}
      variant="quickAdd"
      collectionOptions={collectionOptions}
      selectedCollectionId={selectedCollectionId}
      setSelectedCollectionId={setSelectedCollectionId}
      onCreateCollection={handleCreateCollection}
      defaultCollectionId={defaultCollectionId}
      onSetDefaultCollection={handleSetDefault}
    />
  );
}
