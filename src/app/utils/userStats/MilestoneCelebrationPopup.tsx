import { motion } from "framer-motion";
import { useEffect } from "react";
import { MilestoneInfo } from "./types";

// Shared content component used by both popup variants
type MilestoneCelebrationContentProps = {
  milestoneInfo: MilestoneInfo;
  textClass: string;
  onContinue?: () => void;
  showDetails?: boolean;
  showButton?: boolean;
  size?: "sm" | "lg";
};

function MilestoneCelebrationContent({
  milestoneInfo,
  textClass,
  onContinue,
  showDetails = false,
  showButton = true,
  size = "sm"
}: MilestoneCelebrationContentProps) {
  const isLarge = size === "lg";

  return (
    <div className="text-center space-y-3">
      {/* Header with party emojis */}
      <motion.div
        className={`flex items-center justify-center ${isLarge ? "space-x-3" : "space-x-2"}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
      >
        <motion.span
          className={isLarge ? "text-4xl md:text-5xl" : "text-xl"}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.2, duration: 0.6, repeat: isLarge ? 2 : 1 }}
        >
          🎉
        </motion.span>
        {isLarge ? (
          <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Milestone Reached!
          </h2>
        ) : (
          <motion.span
            className={`text-lg font-bold ${textClass}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Milestone Reached!
          </motion.span>
        )}
        <motion.span
          className={isLarge ? "text-4xl md:text-5xl" : "text-xl"}
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ delay: 0.3, duration: 0.6, repeat: isLarge ? 2 : 1 }}
        >
          🎉
        </motion.span>
      </motion.div>

      {/* Milestone title and details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <motion.div
          className={
            isLarge
              ? `text-3xl md:text-4xl font-black ${textClass} mb-3`
              : `text-2xl font-bold ${textClass} px-4 py-2 rounded-lg bg-white/20 dark:bg-black/20`
          }
          animate={{ scale: [1, isLarge ? 1.05 : 1.03, 1] }}
          transition={{ delay: isLarge ? 0.4 : 0.3, duration: isLarge ? 0.5 : 0.3, repeat: isLarge ? 2 : 1 }}
        >
          {milestoneInfo.title}
        </motion.div>

        {showDetails && (
          <>
            <div className={isLarge ? `text-xl md:text-2xl font-bold text-white mb-2` : `text-base font-semibold ${textClass}`}>
              {milestoneInfo.count.toLocaleString()} phrases!
            </div>
            <div className={isLarge ? `text-white text-base md:text-lg italic` : `text-sm ${textClass}/90 italic px-2`}>
              {milestoneInfo.description}
            </div>
          </>
        )}
      </motion.div>

      {/* Stars */}
      <motion.div
        className={`flex justify-center ${isLarge ? "space-x-2" : "space-x-1"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: isLarge ? 0.5 : 0.4 }}
      >
        {[...Array(isLarge ? 5 : 3)].map((_, i) => (
          <motion.span
            key={i}
            className={isLarge ? "text-2xl md:text-3xl" : "text-lg"}
            animate={{
              scale: [1, isLarge ? 1.4 : 1.3, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              delay: (isLarge ? 0.6 : 0.5) + i * (isLarge ? 0.1 : 0.08),
              duration: isLarge ? 0.6 : 0.5,
              ease: "easeInOut"
            }}
          >
            ⭐
          </motion.span>
        ))}
      </motion.div>

      {/* Continue Button */}
      {showButton && (
        isLarge ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button
              className="bg-primary hover:bg-primary/90 text-white font-black text-xl md:text-2xl py-4 md:py-6 px-8 rounded-2xl shadow-2xl uppercase transition-colors duration-200 w-full"
              onClick={onContinue}
            >
              Continue
            </button>
          </motion.div>
        ) : (
          <motion.button
            className="mt-4 bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 text-sm"
            onClick={onContinue}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue
          </motion.button>
        )
      )}
    </div>
  );
}

// Fixed overlay popup version
type MilestoneCelebrationPopupProps = {
  milestoneInfo: MilestoneInfo;
  backgroundClass: string;
  textClass: string;
  onClose?: () => void;
  showDetails?: boolean;
  showButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
};

export function MilestoneCelebrationPopup({
  milestoneInfo,
  backgroundClass,
  textClass,
  onClose,
  showDetails = false,
  showButton = true,
  autoHide = false,
  autoHideDelay = 2500
}: MilestoneCelebrationPopupProps) {
  // Auto-hide after delay
  useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`${backgroundClass} px-6 py-5 rounded-2xl shadow-2xl max-w-sm mx-4 border-3 pointer-events-auto`}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.4
          }
        }}
        exit={{
          scale: 0.9,
          opacity: 0,
          y: -20,
          transition: { duration: 0.2 }
        }}
      >
        <MilestoneCelebrationContent
          milestoneInfo={milestoneInfo}
          textClass={textClass}
          onContinue={onClose}
          showDetails={showDetails}
          showButton={showButton}
          size="sm"
        />
      </motion.div>
    </motion.div>
  );
}

// Inline version for use within modals (no fixed positioning)
type MilestoneCelebrationInlineProps = {
  milestoneInfo: MilestoneInfo;
  onContinue: () => void;
  showDetails?: boolean;
};

export function MilestoneCelebrationInline({
  milestoneInfo,
  onContinue,
  showDetails = true
}: MilestoneCelebrationInlineProps) {
  return (
    <motion.div
      className="space-y-6 text-center w-full"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      {/* Milestone Card wrapper for inline version */}
      <motion.div
        className="bg-gray-500/20 dark:bg-slate-800 rounded-2xl p-6 md:p-8 border-4 border-gray-500 shadow-2xl mx-auto max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <MilestoneCelebrationContent
          milestoneInfo={milestoneInfo}
          textClass="text-gray-400"
          onContinue={onContinue}
          showDetails={showDetails}
          size="lg"
        />
      </motion.div>
    </motion.div>
  );
}
