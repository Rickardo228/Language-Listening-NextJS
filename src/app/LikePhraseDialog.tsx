'use client'

import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { ImportPhrasesDialog } from './ImportPhrasesDialog';
import { defaultPresentationConfigs } from './defaultConfig';
import { Phrase } from './types';
import { useUser } from './contexts/UserContext';
import { useCollections } from './contexts/CollectionsContext';
import { createCollection } from './utils/collectionService';
import { autoNameCollection } from './utils/generateCollectionName';
import { firestore } from './firebase';

const CREATE_NEW_VALUE = '__create_new__';
const DEFAULT_LIST_KEY = 'default-collection-id';

interface LikePhraseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: Phrase | null;
  submitDisabled?: boolean;
}

export function LikePhraseDialog({ isOpen, onClose, phrase, submitDisabled }: LikePhraseDialogProps) {
  const { user } = useUser();
  const { upsertCollection, appendPhraseToCollection, renameCollection } = useCollections();
  const [matchingCollections, setMatchingCollections] = useState<Array<{ id: string; name: string; isReversed: boolean }>>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(CREATE_NEW_VALUE);
  const [defaultCollectionId, setDefaultCollectionId] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputLang, setInputLang] = useState(phrase?.inputLang || '');
  const [targetLang, setTargetLang] = useState(phrase?.targetLang || '');
  const [phrasesInput, setPhrasesInput] = useState(phrase?.input || '');
  const sanitizePhrase = (value: Phrase) => {
    const sanitized = { ...value } as Record<string, unknown>;
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    return sanitized as Phrase;
  };
  const buildSwappedPhrase = (value: Phrase, now: string) => ({
    ...value,
    input: value.translated,
    translated: value.input,
    inputAudio: value.outputAudio,
    outputAudio: value.inputAudio,
    inputLang: value.targetLang,
    targetLang: value.inputLang,
    inputVoice: value.targetVoice,
    targetVoice: value.inputVoice,
    romanized: '',
    created_at: now,
  });
  const buildPhraseForNewList = (value: Phrase, now: string) => (
    { ...value, created_at: now }
  );

  useEffect(() => {
    if (!phrase) return;
    setInputLang(phrase.inputLang);
    setTargetLang(phrase.targetLang);
    setPhrasesInput(phrase.input);
  }, [phrase?.inputLang, phrase?.targetLang, phrase?.input]);

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
  }, [user, isOpen, phrase?.inputLang, phrase?.targetLang]);

  const collectionOptions = useMemo(() => {
    return [
      { value: CREATE_NEW_VALUE, label: '+ Create new list' },
      ...matchingCollections.map((collection) => ({
        value: collection.id,
        label: collection.isReversed ? `${collection.name}` : collection.name,
      })),
    ];
  }, [matchingCollections]);

  const handleSetDefault = useCallback(() => {
    localStorage.setItem(DEFAULT_LIST_KEY, selectedCollectionId);
    setDefaultCollectionId(selectedCollectionId);
  }, [selectedCollectionId]);

  const handleCreateCollection = async (name: string) => {
    if (!user || !phrase) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const phraseToAdd = sanitizePhrase(buildPhraseForNewList(phrase, now));
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
      console.error('Error creating list:', error);
      toast.error('Failed to create list.');
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

      if (selectedCollectionId === CREATE_NEW_VALUE) {
        const newListPhrase = sanitizePhrase(buildPhraseForNewList(phrase, now));
        const collectionId = await createCollection([newListPhrase], 'Liked Phrases', 'phrases', user, user, { skipTracking: false });
        upsertCollection({
          id: collectionId,
          name: 'Liked Phrases',
          phrases: [newListPhrase],
          created_at: now,
          collectionType: 'phrases',
          presentationConfig: {
            ...defaultPresentationConfigs.phrases,
            name: 'Liked Phrases',
          },
        });
        // Auto-generate a name in the background
        autoNameCollection(
          [newListPhrase],
          phrase.inputLang,
          collectionId,
          user.uid,
          (name) => renameCollection(collectionId, name)
        );
        toast.success('Saved to new list.');
      } else {
        if (!selectedCollectionId) {
          toast.error('Please select a list.');
          return;
        }
        const selectedCollection = matchingCollections.find((collection) => collection.id === selectedCollectionId);
        const phraseToAdd = sanitizePhrase(selectedCollection?.isReversed
          ? buildSwappedPhrase(phrase, now)
          : { ...phrase, created_at: now });
        const docRef = doc(firestore, 'users', user.uid, 'collections', selectedCollectionId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          toast.error('List not found.');
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
      submitDisabled={submitDisabled}
      defaultCollectionId={defaultCollectionId}
      onSetDefaultCollection={handleSetDefault}
    />
  );
}
