import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

const firestore = getFirestore();

export interface UserProfile {
  // Core user info
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  
  // Onboarding & preferences
  onboardingCompleted: boolean;
  abilityLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'native';
  preferredInputLang: string;
  preferredTargetLang: string;
  nativeLanguage?: string; // User's native/first language
  contentPreferences?: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

// Legacy interface for backward compatibility
export type UserPreferences = Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL'>;

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createOrUpdateUserProfile = async (
  userId: string, 
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const now = new Date().toISOString();
    
    // Get existing profile
    const existingDoc = await getDoc(userRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};
    
    // Merge with new data
    const updatedProfile: UserProfile = {
      uid: userId,
      abilityLevel: 'beginner',
      preferredInputLang: 'en-GB',
      preferredTargetLang: 'it-IT', 
      onboardingCompleted: false,
      createdAt: existingData.createdAt || now,
      ...existingData,
      ...profileData,
      updatedAt: now,
    };
    
    await setDoc(userRef, updatedProfile, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const saveUserPreferences = async (
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<void> => {
  return createOrUpdateUserProfile(userId, preferences);
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

export const saveOnboardingData = async (
  userId: string,
  data: {
    abilityLevel: string;
    inputLang: string;
    targetLang: string;
    contentPreferences?: string[];
  },
  firebaseUser?: User // Optional Firebase user object for additional data
): Promise<void> => {
  const profileData: Partial<UserProfile> = {
    // Core user info (from Firebase user if available)
    uid: userId,
    
    // Onboarding & preferences (from form data)
    abilityLevel: data.abilityLevel as UserProfile['abilityLevel'],
    preferredInputLang: data.inputLang,
    preferredTargetLang: data.targetLang,
    nativeLanguage: data.inputLang, // Save preferred input language as native language
    contentPreferences: data.contentPreferences,
    onboardingCompleted: true,
    
    // Metadata (set current timestamp for activity)
    lastActiveAt: new Date().toISOString(),
  };

  // Only add Firebase user fields if they have values (not undefined)
  if (firebaseUser?.email) {
    profileData.email = firebaseUser.email;
  }
  if (firebaseUser?.displayName) {
    profileData.displayName = firebaseUser.displayName;
  }
  if (firebaseUser?.photoURL) {
    profileData.photoURL = firebaseUser.photoURL;
  }

  await createOrUpdateUserProfile(userId, profileData);
};