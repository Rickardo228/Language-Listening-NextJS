'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { generateAudio } from '../app/utils/audioUtils';

interface PhraseBlockProps {
  translated: string;
  input: string;
  targetLang: string;
  inputLang: string;
  romanized?: string;
  note?: string;
}

export function PhraseBlock({
  translated,
  input,
  targetLang,
  inputLang,
  romanized,
  note,
}: PhraseBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioCache = useRef<{
    target?: { url: string; duration: number; audio: HTMLAudioElement };
  }>({});

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioCache.current.target?.audio) {
        audioCache.current.target.audio.pause();
      }
    };
  }, []);

  const playAudio = async () => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate/get cached target language audio only
      if (!audioCache.current.target) {
        const { audioUrl, duration } = await generateAudio(
          translated,
          targetLang,
          '' // voice can be empty, backend will use default
        );
        const audio = new Audio(audioUrl);
        audioCache.current.target = { url: audioUrl, duration, audio };
      }

      setIsLoading(false);
      setIsPlaying(true);

      // Play target language only
      const targetAudio = audioCache.current.target.audio;
      targetAudio.currentTime = 0;
      await targetAudio.play();

      // Wait for target to finish
      await new Promise<void>((resolve) => {
        targetAudio.onended = () => {
          setIsPlaying(false);
          resolve();
        };
      });
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="my-6 p-6 rounded-lg border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20">
      {/* Main phrase with play button */}
      <div className="flex items-start gap-4 mb-3">
        <button
          onClick={playAudio}
          disabled={isLoading || isPlaying}
          className="flex-shrink-0 p-3 rounded-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Play audio"
        >
          {isLoading || isPlaying ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Target language (main) */}
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {translated}
          </div>

          {/* Romanized pronunciation */}
          {romanized && (
            <div className="text-sm italic text-gray-600 dark:text-gray-400 mb-2">
              {romanized}
            </div>
          )}

          {/* Input language (translation) */}
          <div className="text-lg text-gray-700 dark:text-gray-300">
            {input}
          </div>
        </div>
      </div>

      {/* Note/tip */}
      {note && (
        <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">💡 Tip:</span> {note}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
