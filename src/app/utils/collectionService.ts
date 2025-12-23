import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Phrase, CollectionType as CollectionTypeEnum, PresentationConfig } from '../types';
import { defaultPresentationConfig, defaultPresentationConfigs } from '../defaultConfig';
import { trackCreateList } from '../../lib/mixpanelClient';
import { getUserProfile } from './userPreferences';

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

  let userDefaultConfig: PresentationConfig | null = null;
  try {
    // Pull user default presentation config (AB-test driven) for new collections.
    const userProfile = await getUserProfile(userId);
    if (userProfile?.defaultPresentationConfig) {
      userDefaultConfig = userProfile.defaultPresentationConfig;
    }
  } catch (error) {
    console.error('Error loading user default presentation config:', error);
  }

  const generatedName = prompt || 'New List';
  const now = new Date().toISOString();
  const baseConfig = collectionType
    ? defaultPresentationConfigs[collectionType]
    : defaultPresentationConfig;

  const newCollection = {
    name: generatedName,
    phrases: phrases.map(phrase => ({
      ...phrase,
      created_at: now
    })),
    created_at: now,
    collectionType: collectionType || 'phrases',
    presentationConfig: {
      ...baseConfig,
      // Let user defaults override system defaults, then name stays explicit.
      ...(userDefaultConfig || {}),
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
