import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { API_BASE_URL } from '../consts';

/**
 * Calls the backend to generate a descriptive name for a collection based on its phrases,
 * then updates the Firestore document and notifies the caller via onRenamed.
 * Designed to be fire-and-forget — the collection is created first with a placeholder name,
 * then this runs in the background.
 */
export async function autoNameCollection(
  phrases: Array<{ input: string }>,
  inputLang: string,
  collectionId: string,
  userId: string,
  onRenamed: (name: string) => void
): Promise<void> {
  try {
    const phraseTexts = phrases.slice(0, 10).map((p) => p.input);
    if (phraseTexts.length === 0) return;

    const response = await fetch(`${API_BASE_URL}/generate-collection-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrases: phraseTexts, inputLang }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const name = data.name?.trim();
    if (!name) return;

    const docRef = doc(firestore, 'users', userId, 'collections', collectionId);
    await updateDoc(docRef, {
      name,
      'presentationConfig.name': name,
    });

    onRenamed(name);
  } catch (error) {
    console.error('Auto-name collection failed:', error);
  }
}
