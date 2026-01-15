import { motion } from "framer-motion";

type SnackbarPopupProps = {
  eventType: 'listened' | 'viewed';
  count: number;
};

export function SnackbarPopup({ eventType, count }: SnackbarPopupProps) {
  const emoji = eventType === 'viewed' ? '👀' : '🎧';
  const label = `${count} phrase${count !== 1 ? 's' : ''} ${eventType}!`;

  return (
    <motion.div
      className="fixed z-50 top-20 sm:top-4 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-blue-500 text-white rounded-lg shadow-lg px-5 py-3 max-w-sm mx-4 sm:mx-0"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.3
        }}
      >
        <div className="flex items-center justify-center">
          <motion.span
            className="font-bold text-sm"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {emoji} {label}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
