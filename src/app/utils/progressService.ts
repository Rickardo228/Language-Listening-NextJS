import { firestore } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";
import { ProgressData } from "../types";

function getProgressItemId(
  collectionId: string,
  inputLang: string,
  targetLang: string
): string {
  return `${collectionId}_${inputLang}_${targetLang}`;
}

export async function loadProgress(
  userId: string,
  collectionId: string,
  inputLang: string,
  targetLang: string
): Promise<ProgressData | null> {
  try {
    const progressRef = doc(
      firestore,
      "users",
      userId,
      "progress",
      getProgressItemId(collectionId, inputLang, targetLang)
    );
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) {
      return null;
    }

    const data = progressSnap.data();
    return {
      collectionId,
      itemType: data.itemType,
      lastPhraseIndex: data.lastPhraseIndex,
      lastPhase: data.lastPhase,
      lastAccessedAt:
        data.lastAccessedAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
      completedAt: data.completedAt?.toDate?.()?.toISOString(),
      inputLang,
      targetLang,
      listenedPhraseIndices: data.listenedPhraseIndices || [],
    };
  } catch (error) {
    console.error("Error loading progress:", error);
    return null;
  }
}

export async function saveProgress(
  userId: string,
  data: ProgressData
): Promise<void> {
  try {
    // Construct itemId from collectionId and language codes
    const itemId = getProgressItemId(
      data.collectionId,
      data.inputLang,
      data.targetLang
    );
    const progressRef = doc(firestore, "users", userId, "progress", itemId);

    // Base payload which is always written
    const basePayload: Record<string, unknown> = {
      itemId,
      itemType: data.itemType,
      lastPhraseIndex: data.lastPhraseIndex,
      lastPhase: data.lastPhase,
      lastAccessedAt: Timestamp.now(),
      inputLang: data.inputLang,
      targetLang: data.targetLang,
      // Use arrayUnion to automatically add lastPhraseIndex to listenedPhraseIndices (no duplicates)
      listenedPhraseIndices: arrayUnion(data.lastPhraseIndex),
    };

    // Only include completedAt when the caller explicitly provides it.
    // This prevents accidentally clearing an existing completion timestamp
    // when saving normal in-progress progress updates.
    if (data.completedAt !== undefined) {
      basePayload.completedAt = data.completedAt
        ? Timestamp.fromDate(new Date(data.completedAt))
        : null;
    }

    await setDoc(
      progressRef,
      basePayload,
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

export async function markCompleted(
  userId: string,
  collectionId: string,
  inputLang: string,
  targetLang: string
): Promise<void> {
  try {
    const progressRef = doc(
      firestore,
      "users",
      userId,
      "progress",
      getProgressItemId(collectionId, inputLang, targetLang)
    );

    await setDoc(
      progressRef,
      {
        completedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error marking completed:", error);
  }
}

export async function getRecentTemplates(
  userId: string,
  limitCount: number = 10
): Promise<ProgressData[]> {
  try {
    const progressCollection = collection(
      firestore,
      "users",
      userId,
      "progress"
    );
    const q = query(
      progressCollection,
      orderBy("lastAccessedAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        collectionId: data.collectionId, // itemId in Firestore is the collectionId
        itemType: data.itemType,
        lastPhraseIndex: data.lastPhraseIndex,
        lastPhase: data.lastPhase,
        lastAccessedAt:
          data.lastAccessedAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        completedAt: data.completedAt?.toDate?.()?.toISOString(),
        inputLang: data.inputLang,
        targetLang: data.targetLang,
        listenedPhraseIndices: data.listenedPhraseIndices || [],
      };
    });
  } catch (error) {
    console.error("Error getting recent templates:", error);
    return [];
  }
}

export async function clearProgress(
  userId: string,
  itemId: string
): Promise<void> {
  try {
    const progressRef = doc(firestore, "users", userId, "progress", itemId);
    await deleteDoc(progressRef);
  } catch (error) {
    console.error("Error clearing progress:", error);
  }
}
