"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { ROUTES } from "../routes";
import { track } from "../../lib/mixpanelClient";
import { Sparkles, TrendingUp, Shield } from "lucide-react";

interface UnauthenticatedListCompletionScreenProps {
  isOpen: boolean;
  onClose: () => void;
  sessionListened?: number;
  sessionViewed?: number;
  onGoAgain?: () => void | Promise<void>;
  onGoNext?: () => void | Promise<void>;
}

const BenefitsList = () => (
  <div className="space-y-3">
    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
        <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">Track Your Streak</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Build consistency with daily practice streaks
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-300" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">Earn Milestones</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Unlock achievements as you progress
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800">
      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">Sync Across Devices</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your progress, available everywhere
        </p>
      </div>
    </div>
  </div>
);

export function UnauthenticatedListCompletionScreen({
  isOpen,
  onClose,
  sessionListened = 0,
  sessionViewed = 0,
  onGoAgain,
  onGoNext,
}: UnauthenticatedListCompletionScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const isOpenTrackedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!isOpenTrackedRef.current) {
        track("Unauthenticated List Completion Screen Viewed", {
          step: 1,
          sessionListened,
          sessionViewed,
        });
        isOpenTrackedRef.current = true;
      }
      setStep(1);
    } else {
      isOpenTrackedRef.current = false;
    }
  }, [isOpen, sessionListened, sessionViewed]);

  const totalPhrases = sessionListened + sessionViewed;

  const handlePrimaryAction = async () => {
    if (onGoNext) {
      track("Unauthenticated List Completion Sign Up Clicked", { variant: "onboarding" });
      await onGoNext();
    } else {
      track("Unauthenticated List Completion Sign Up Clicked");
      router.push(ROUTES.GET_STARTED);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 md:bg-black/30 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="fixed inset-0 md:relative md:inset-auto md:w-[800px] md:h-[700px] md:rounded-3xl md:overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center p-4 md:shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full max-w-2xl h-full flex items-center justify-center md:py-8">
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  className="space-y-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      className="text-6xl md:text-7xl mb-4"
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ delay: 0.3, duration: 0.8, repeat: 1 }}
                    >
                      🎉
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3 drop-shadow-lg">
                      Nice Work!
                    </h1>
                    <p className="text-xl md:text-2xl bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent font-semibold">
                      List completed!
                    </p>
                  </motion.div>

                  {totalPhrases > 0 && (
                    <motion.div
                      className="bg-slate-800 dark:bg-slate-800 rounded-3xl p-4 md:p-6 border-4 border-emerald-500 shadow-2xl"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <div className="text-4xl md:text-5xl font-black text-emerald-400 mb-1">
                        {totalPhrases}
                      </div>
                      <div className="text-lg md:text-xl font-bold text-slate-200 uppercase tracking-wider">
                        Phrases Practiced
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="font-black text-2xl py-6 rounded-2xl shadow-2xl uppercase"
                      onClick={() => {
                        track("Unauthenticated List Completion Continue Clicked", { step: 1 });
                        setStep(2);
                      }}
                    >
                      Continue
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  className="space-y-6 w-full px-2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="text-center space-y-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                      {onGoNext ? "Great start!" : "Save Your Progress"}
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                      {onGoNext
                        ? "Create a free account to save your progress"
                        : "Create a free account to track your learning journey"}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <BenefitsList />
                  </motion.div>

                  <motion.div
                    className={onGoNext ? "pt-2" : "space-y-3 pt-2"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="font-bold text-xl py-5 rounded-xl shadow-xl"
                      onClick={handlePrimaryAction}
                    >
                      Create Free Account
                    </Button>

                    {!onGoNext && onGoAgain && (
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        className="font-semibold text-lg py-4 rounded-xl"
                        onClick={async () => {
                          track("Unauthenticated List Completion Go Again Clicked");
                          await onGoAgain();
                          onClose();
                        }}
                      >
                        Continue Without Account
                      </Button>
                    )}

                    {!onGoNext && !onGoAgain && (
                      <Button
                        variant="ghost"
                        size="lg"
                        fullWidth
                        className="font-semibold text-lg py-4 rounded-xl text-slate-500"
                        onClick={() => {
                          track("Unauthenticated List Completion Dismiss Clicked");
                          onClose();
                        }}
                      >
                        Maybe Later
                      </Button>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
