'use client';

interface PhraseCounterProps {
  currentPhraseIndex?: number;
  totalPhrases?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PhraseCounter({ 
  currentPhraseIndex, 
  totalPhrases, 
  className = "", 
  style = {} 
}: PhraseCounterProps) {
  if (currentPhraseIndex === undefined || totalPhrases === undefined || totalPhrases === 0) {
    return null;
  }

  return (
    <div
      className={`px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
      style={style}
    >
      {currentPhraseIndex + 1} / {totalPhrases}
    </div>
  );
}