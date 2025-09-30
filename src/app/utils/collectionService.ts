import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Phrase, CollectionType as CollectionTypeEnum } from '../types';
import { defaultPresentationConfig, defaultPresentationConfigs } from '../defaultConfig';
import { trackCreateList } from '../../lib/mixpanelClient';

const firestore = getFirestore();

interface CreateCollectionOptions {
  skipTracking?: boolean;
}

export const createCollection = async (
  phrases: Phrase[],
  prompt?: string,
  collectionType?: CollectionTypeEnum,
  userArg?: User,
  user?: User,
  options: CreateCollectionOptions = {}
): Promise<string> => {
  const userId = userArg?.uid || user?.uid;
  if (!userId) {
    throw new Error('User ID is required to create a collection');
  }

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

  if (!options.skipTracking) {
    trackCreateList(
      docRef.id,
      generatedName,
      phrases.length,
      collectionType || 'phrases',
      phrases[0]?.inputLang || 'unknown',
      phrases[0]?.targetLang || 'unknown'
    );
  }

  return docRef.id;
};