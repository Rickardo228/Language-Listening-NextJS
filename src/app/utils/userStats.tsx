import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { Phrase } from "../types";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../contexts/UserContext";

const firestore = getFirestore();

export const useUpdateUserStats = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [countToShow, setCountToShow] = useState(0);
  const phrasesListenedRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateUserStats = async (
    phrases: Phrase[],
    currentPhraseIndex: number
  ) => {
    console.log("updateUserStats", phrasesListenedRef.current)
    if (!user) return;

    // Increment the ref counter
    phrasesListenedRef.current += 1;

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
        const statsRef = doc(
          firestore,
          "users",
          user.uid,
          "stats",
          "listening"
        );
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

  const showStatsUpdate = () => {
    if (phrasesListenedRef.current > 0) {
      setShowPopup(true);
      setCountToShow(phrasesListenedRef.current);
      phrasesListenedRef.current = 0;
    }

    setTimeout(() => {
      setShowPopup(false);
    }, 2000);

  };
  const StatsUpdatePopup = mounted && showPopup ? createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">
            {countToShow} phrase{countToShow !== 1 ? 's' : ''} listened
          </span>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return {
    updateUserStats,
    StatsUpdatePopup,
    showStatsUpdate,
    phrasesListened: phrasesListenedRef.current,
  };
};
