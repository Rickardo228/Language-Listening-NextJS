import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { Phrase } from "../types";

const firestore = getFirestore();

export const updateUserStats = async (
  phrases: Phrase[],
  user: User,
  currentPhraseIndex: number
) => {
  if (!user) return;
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // Get YYYY-MM-DD format

  // Get current phrase's languages
  const currentPhrase = phrases[currentPhraseIndex];
  if (!currentPhrase) return;
  const { inputLang, targetLang } = currentPhrase;

  try {
    // Update the main stats document
    const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
    await updateDoc(statsRef, {
      phrasesListened: increment(1),
      lastListenedAt: now.toISOString(),
    });

    // Update the daily stats
    const dailyStatsRef = doc(
      firestore,
      "users",
      user.uid,
      "stats",
      "listening",
      "daily",
      today
    );
    await updateDoc(dailyStatsRef, {
      count: increment(1),
      lastUpdated: now.toISOString(),
    }).catch(async (err: unknown) => {
      // If the daily document doesn't exist, create it
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "not-found"
      ) {
        await setDoc(dailyStatsRef, {
          count: 1,
          lastUpdated: now.toISOString(),
          date: today,
        });
      } else {
        console.error("Error updating daily stats:", err);
      }
    });

    // Update language stats
    const languageStatsRef = doc(
      firestore,
      "users",
      user.uid,
      "stats",
      "listening",
      "languages",
      `${inputLang}-${targetLang}`
    );
    await updateDoc(languageStatsRef, {
      count: increment(1),
      lastUpdated: now.toISOString(),
      inputLang,
      targetLang,
    }).catch(async (err: unknown) => {
      // If the language document doesn't exist, create it
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "not-found"
      ) {
        await setDoc(languageStatsRef, {
          count: 1,
          lastUpdated: now.toISOString(),
          inputLang,
          targetLang,
          firstListened: now.toISOString(),
        });
      } else {
        console.error("Error updating language stats:", err);
      }
    });
  } catch (err: unknown) {
    // If the main stats document doesn't exist, create it
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "not-found"
    ) {
      const statsRef = doc(firestore, "users", user.uid, "stats", "listening");
      await setDoc(statsRef, {
        phrasesListened: 1,
        lastListenedAt: now.toISOString(),
      });

      // Create the daily stats document
      const dailyStatsRef = doc(
        firestore,
        "users",
        user.uid,
        "stats",
        "listening",
        "daily",
        today
      );
      await setDoc(dailyStatsRef, {
        count: 1,
        lastUpdated: now.toISOString(),
        date: today,
      });

      // Create the language stats document
      const languageStatsRef = doc(
        firestore,
        "users",
        user.uid,
        "stats",
        "listening",
        "languages",
        `${inputLang}-${targetLang}`
      );
      await setDoc(languageStatsRef, {
        count: 1,
        lastUpdated: now.toISOString(),
        inputLang,
        targetLang,
        firstListened: now.toISOString(),
      });
    } else {
      console.error("Error updating user stats:", err);
    }
  }
};
