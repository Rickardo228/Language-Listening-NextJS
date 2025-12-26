'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Play, Pause, Volume2 } from 'lucide-react';

// Type definitions
type Phrase = string | {
  text?: string;
  original?: string;
  translated?: string;
  audioUrl?: string;
  romanized?: string | null;
  duration?: number;
  voice?: string;
  source?: string;
  usage?: string;
};
interface ListData {
  phrases: Record<string, Phrase>;
  phraseCount?: number;
  name?: string;
  complexity?: string;
  tags?: string[];
  spoken_outcome?: string;
}

type PageSpec = {
  language?: string;
  keyword?: string;
  blocks?: Array<Record<string, any>>;
};

interface ListPageContentProps {
  language: string;
  langInfo: { code: string; name: string; native: string };
  slug: string;
  title: string;
  keyword: string;
  listData: ListData;
  pageSpec?: PageSpec | null;
  phraseCount: number;
  complexity: string;
  pillar?: string;
  intentStage: string;
  spokenOutcome?: string;
}

export function ListPageContent({
  language,
  langInfo,
  slug,
  title,
  keyword,
  listData,
  pageSpec,
  phraseCount,
  complexity,
  pillar,
  intentStage,
  spokenOutcome,
}: ListPageContentProps) {
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Play audio for a phrase
  const playAudio = (phraseKey: string, audioUrl: string) => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }

    // Toggle off if clicking same phrase
    if (playingPhrase === phraseKey) {
      setPlayingPhrase(null);
      audioRef.current = null;
      return;
    }

    // Create and play new audio
    const newAudio = new Audio(audioUrl);
    audioRef.current = newAudio;

    newAudio.onended = () => {
      setPlayingPhrase(null);
      audioRef.current = null;
    };

    newAudio.onerror = () => {
      setPlayingPhrase(null);
      audioRef.current = null;
      console.error('Failed to load audio:', audioUrl);
    };

    newAudio.play().catch((error) => {
      setPlayingPhrase(null);
      audioRef.current = null;
      console.error('Failed to play audio:', error);
    });

    setPlayingPhrase(phraseKey);

    // Track audio interaction
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'audio_play', {
        language: language,
        keyword: keyword,
        phrase_index: phraseKey,
        pillar: pillar,
      });
    }
  };

  // Track CTA click
  const handlePracticeClick = () => {
    // Track conversion event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'practice_cta_click', {
        language: language,
        keyword: keyword,
        slug: slug,
        title: title,
        pillar: pillar,
        intent_stage: intentStage,
        phrase_count: phraseCount,
        complexity: complexity,
      });
    }
  };

  // Get intro text based on pillar
  const getIntroText = (overrideIntro?: string) => {
    if (overrideIntro && typeof overrideIntro === 'string') {
      return overrideIntro;
    }
    switch (pillar) {
      case '1':
        return `This is not a memorization list. You'll train your ear and voice to naturally recognize and produce these essential ${langInfo.name} ${keyword}. Each phrase includes natural-sounding AI audio so you can shadow and practice proper pronunciation.`;
      case '2':
        return `These ${langInfo.name} phrases are designed for real-world situations. You'll learn exactly what to say in practical scenarios, with natural-sounding AI audio to help you sound confident.`;
      case '4':
        return `Frustrated because you can read but can't understand spoken ${langInfo.name}? This list focuses on listening comprehension and shadowing practice. Train your ear to recognize ${langInfo.name} at natural speed.`;
      case '5':
        return `These are the ${phraseCount} most frequently used ${langInfo.name} words, ranked by actual usage. Master these high-payoff words first for maximum communication ability with minimum effort.`;
      default:
        return `Master ${phraseCount} essential ${langInfo.name} ${keyword} with AI-powered audio pronunciation and shadowing practice. Perfect for ${intentStage === 'beginner' ? 'beginners' : 'intermediate learners'} looking to improve their ${langInfo.name} skills.`;
    }
  };

  // Get FAQs based on pillar and intent stage
  const getFAQs = () => {
    const commonFAQs = [
      {
        question: `How do I use this ${langInfo.name} list?`,
        answer: `Listen to each phrase multiple times, then practice saying it out loud (shadowing). The key is repetition with audio - don't just read, actively speak and listen. Use the "Practice in App" button below for guided shadowing exercises.`,
      },
      {
        question: `Do I need to memorize all ${phraseCount} phrases?`,
        answer: `No! The goal is recognition and natural recall, not memorization. Regular practice with audio will help these phrases become automatic. Focus on understanding and pronunciation first.`,
      },
    ];

    const pillarSpecificFAQs: Record<string, any[]> = {
      '4': [
        {
          question: `Why can I read but not understand spoken ${langInfo.name}?`,
          answer: `This is extremely common! Written and spoken language processing use different brain pathways. Shadowing practice (repeating what you hear) trains your brain to process ${langInfo.name} at natural speed. Start slow and gradually increase speed.`,
        },
        {
          question: `How long until I can understand spoken ${langInfo.name}?`,
          answer: `Many learners notice improvement within a few weeks of daily shadowing practice (15-20 minutes per day). The key is consistency and active listening, not passive exposure. Progress varies by individual, but regular practice makes a meaningful difference.`,
        },
      ],
    };

    return [...commonFAQs, ...(pillarSpecificFAQs[pillar || ''] || [])];
  };

  const phrases = Object.entries(listData.phrases || {});
  const phrasesByIndex = (listData.phrases || {}) as Record<string, Phrase>;
  const specBlocks = pageSpec?.blocks || [];
  const contentBlocks = specBlocks.filter(
    (block) => block.type === 'category_section' || block.type === 'narrative_break'
  );
  const tocBlock = specBlocks.find((block) => block.type === 'toc');
  const faqBlock = specBlocks.find((block) => block.type === 'faq_section');
  const heroBlock = specBlocks.find((block) => block.type === 'hero');
  const faqs = Array.isArray(faqBlock?.faqs) ? faqBlock.faqs : getFAQs();

  const renderPhraseRow = (
    phraseKey: string,
    phraseData: Phrase | null,
    fallbackText: string,
    displayIndex: number
  ) => {
    const isString = typeof phraseData === 'string';
    const phraseText = phraseData
      ? (isString ? phraseData : (phraseData.translated || phraseData.text || fallbackText))
      : fallbackText;
    const sourceText = !isString && phraseData
      ? (phraseData.source || phraseData.original || '')
      : '';
    const usageText = !isString && phraseData ? (phraseData.usage || '') : '';
    const audioUrl = phraseData && typeof phraseData === 'object' ? phraseData.audioUrl : '';
    const isPlaying = playingPhrase === phraseKey;
    const showSource = sourceText && sourceText !== phraseText;

    return (
      <div
        key={phraseKey}
        className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
      >
        <div className="flex-shrink-0 w-8 text-gray-400 text-sm font-medium">
          {displayIndex}
        </div>
        <div className="flex-1">
          <div className="text-lg font-medium text-gray-900">
            {phraseText}
          </div>
          {showSource && (
            <div className="text-sm text-gray-600 mt-1">
              {sourceText}
            </div>
          )}
          {usageText && (
            <div className="text-sm text-gray-600 mt-1">
              When to use: {usageText}
            </div>
          )}
        </div>
        {audioUrl && (
          <button
            onClick={() => playAudio(phraseKey, audioUrl)}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isPlaying
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
            }`}
            aria-label={`Play pronunciation of ${phraseText}`}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
        )}
      </div>
    );
  };

  const renderNarrativeBreak = (block: any, key: string) => {
    const style = block?.style || 'tip_box';
    const styleClasses = {
      tip_box: 'bg-yellow-50 border-yellow-200 text-gray-800',
      micro_story: 'bg-emerald-50 border-emerald-200 text-gray-800',
      quick_drill: 'bg-blue-50 border-blue-200 text-gray-800',
      culture: 'bg-orange-50 border-orange-200 text-gray-800',
    };
    const className = styleClasses[style as keyof typeof styleClasses] || styleClasses.tip_box;

    return (
      <div key={key} className={`p-4 rounded-lg border ${className}`}>
        {block?.title && (
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {block.title}
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {block?.text || ''}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Home
            </Link>
            <div className="text-sm text-gray-600">
              {langInfo.native} • {phraseCount} items
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero section */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            {langInfo.name} • {complexity === 'beginner' ? 'Beginner' : 'Intermediate'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            {getIntroText(heroBlock?.intro)}
          </p>
        </div>

        {/* Practice CTA (top) */}
        <div className="mb-12 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white">
          <h2 className="text-2xl font-bold mb-2">Practice This List Properly</h2>
          <p className="mb-4 text-blue-100">
            Get guided shadowing exercises, spaced repetition, and progress tracking.
          </p>
          <Link
            href={`/collection/create?source=seo&keyword=${encodeURIComponent(keyword)}&language=${language}&slug=${slug}`}
            onClick={handlePracticeClick}
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Start Practicing Now →
          </Link>
        </div>

        {/* Phrase list */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {phraseCount} {title}
          </h2>

          {tocBlock && Array.isArray(tocBlock.categories) && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">Jump to section</div>
              <div className="flex flex-wrap gap-2">
                {tocBlock.categories.map((cat: any) => (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                  >
                    {cat.name} ({cat.phraseCount})
                  </a>
                ))}
              </div>
            </div>
          )}

          {contentBlocks.length > 0 ? (
            <div className="space-y-8">
              {contentBlocks.map((block: any, blockIndex: number) => {
                if (block.type === 'narrative_break') {
                  return renderNarrativeBreak(block, `narrative-${blockIndex}`);
                }
                if (block.type !== 'category_section') {
                  return null;
                }
                const narrativeBreaks = Array.isArray(block.narrativeBreaks) ? block.narrativeBreaks : [];
                const normalizedBreaks = narrativeBreaks
                  .map((item: any) => ({
                    ...item,
                    afterIndex: Number.isFinite(Number(item.afterIndex))
                      ? Number(item.afterIndex)
                      : null,
                  }))
                  .filter((item: any) => item.afterIndex !== null);
                const usesOneBased = normalizedBreaks.length > 0
                  && normalizedBreaks.every((item: any) => item.afterIndex >= 1);
                const indexOffset = usesOneBased ? -1 : 0;
                return (
                  <section key={block.id || blockIndex} id={block.id} className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {block.name}
                    </h3>
                    {block.intro && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {block.intro}
                      </p>
                    )}
                    {/* Cultural context box (v2.0.0) */}
                    {block.culturalNote && block.culturalNote.text && (
                      <div className="p-4 rounded-lg border bg-orange-50 border-orange-200 text-gray-800">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          Cultural Context
                        </div>
                        <div className="text-sm leading-relaxed">
                          {block.culturalNote.text}
                        </div>
                      </div>
                    )}
                    {/* Render intro breaks (cultural/section breaks at start of category) */}
                    {Array.isArray(block.introBreaks) && block.introBreaks.length > 0 && (
                      <div className="space-y-3">
                        {block.introBreaks.map((breakItem: any, breakIndex: number) =>
                          renderNarrativeBreak(breakItem, `${block.id}-intro-break-${breakIndex}`)
                        )}
                      </div>
                    )}
                    {Array.isArray(block.phrases) && block.phrases.map((phraseItem: any, index: number) => {
                      const phraseId = phraseItem.phraseId || '';
                      const match = /-(\d+)$/.exec(phraseId);
                      const phraseIndex = match ? parseInt(match[1], 10) : null;
                      const phraseKey = phraseIndex !== null ? phraseIndex.toString() : `${block.id}-${index}`;
                      const phraseData = phraseIndex !== null ? phrasesByIndex[phraseKey] : null;
                      const fallbackText = phraseItem.text || '';
                      const displayIndex = phraseIndex !== null ? phraseIndex + 1 : index + 1;
                      const breaksAfter = normalizedBreaks.filter(
                        (item: any) => item.afterIndex + indexOffset === index
                      );

                      return (
                        <Fragment key={`${phraseKey}-${index}`}>
                          {renderPhraseRow(phraseKey, phraseData, fallbackText, displayIndex)}
                          {breaksAfter.map((item: any, breakIndex: number) =>
                            renderNarrativeBreak(item, `${phraseKey}-break-${breakIndex}`)
                          )}
                        </Fragment>
                      );
                    })}
                    {/* Tip box (v2.0.0) */}
                    {block.tip && (
                      <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200 text-gray-800">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          💡 Tip
                        </div>
                        <div className="text-sm leading-relaxed">
                          {block.tip}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {phrases.map(([key, phrase]: [string, any], index) =>
                renderPhraseRow(key, phrase, '', index + 1)
              )}
            </div>
          )}
        </div>

        {/* Shadowing tip */}
        <div className="mb-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex gap-3">
            <Volume2 className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Shadowing Practice Tip</h3>
              <p className="text-gray-700 leading-relaxed">
                Click the play button, listen carefully to the native pronunciation, then immediately
                repeat what you heard out loud. Do this 3-5 times per phrase. This "shadowing" technique
                trains both your listening comprehension and speaking ability simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq: any, index: number) => (
              <details
                key={index}
                className="p-5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-blue-600 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Master {langInfo.name}?</h2>
          <p className="text-lg mb-6 text-blue-100 max-w-2xl mx-auto">
            Don't just read the list - practice it properly with guided shadowing exercises, spaced repetition,
            and progress tracking.
          </p>
          <Link
            href={`/collection/create?source=seo&keyword=${encodeURIComponent(keyword)}&language=${language}&slug=${slug}`}
            onClick={handlePracticeClick}
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Start Practicing This List →
          </Link>
        </div>

        {/* Related lists (placeholder for future) */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Continue Learning {langInfo.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${language}`}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="font-semibold text-gray-900">
                Browse All {langInfo.name} Lists →
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Explore more vocabulary and phrases
              </div>
            </Link>
            <Link
              href="/library"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="font-semibold text-gray-900">
                Your Learning Library →
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Track your progress and saved lists
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            © {new Date().getFullYear()} Language Shadowing. Learn languages naturally with audio-first practice.
          </p>
        </div>
      </footer>
    </div>
  );
}
