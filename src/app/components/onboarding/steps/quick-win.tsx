'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import {
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { presentationContainerSizeClass } from '../../../PresentationView';
import {
  PhrasePlaybackView,
  type PhrasePlaybackMethods,
} from '../../PhrasePlaybackView';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupItem } from '../../ui/RadioGroup';
import { OnboardingData } from '../types';
import { defaultPresentationConfig } from '../../../defaultConfig';
import { Phrase, PresentationConfig, Template } from '../../../types';
import { buildTemplatePhrases } from '../../../utils/templatePhrases';

const firestore = getFirestore();
const QUICK_WIN_TEMPLATE_GROUP_ID = 'beginner_001';

type TemplateForQuickWin = Template;
type QuickWinMode = 'shadowing' | 'recall' | 'comprehension';

interface Props {
  data: OnboardingData;
  onNext: () => void;
  onBack: () => void;
}

const quickWinModes: Array<{
  value: QuickWinMode;
  label: string;
  description: string;
  config: Pick<
    PresentationConfig,
    'showAllPhrases' | 'enableInputPlayback' | 'enableInputDurationDelay' | 'enableOutputBeforeInput'
  >;
}> = [
  {
    value: 'shadowing',
    label: 'Shadowing Practice',
    description: 'Good for exposure and pronunciation',
    config: {
      showAllPhrases: true,
      enableInputPlayback: false,
      enableInputDurationDelay: false,
      enableOutputBeforeInput: false,
    },
  },
  {
    value: 'recall',
    label: 'Recall Practice',
    description: 'Good for speaking',
    config: {
      showAllPhrases: false,
      enableInputPlayback: true,
      enableInputDurationDelay: true,
      enableOutputBeforeInput: false,
    },
  },
  {
    value: 'comprehension',
    label: 'Comprehension Practice',
    description: 'Good for understanding',
    config: {
      showAllPhrases: false,
      enableInputPlayback: true,
      enableInputDurationDelay: false,
      enableOutputBeforeInput: true,
    },
  },
];

export function QuickWin({ data, onNext, onBack }: Props) {
  const [practiceMode, setPracticeMode] = useState<QuickWinMode>('shadowing');
  const [completedPhrases, setCompletedPhrases] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [templatePhrases, setTemplatePhrases] = useState<Phrase[]>([]);
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true);
  const playbackMethodsRef = useRef<PhrasePlaybackMethods | null>(null);
  const playbackCardRef = useRef<HTMLDivElement | null>(null);
  const isFirstModeSelection = useRef(true);
  const currentIndexRef = useRef(currentIndex);
  const completedRef = useRef(completedPhrases);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    completedRef.current = completedPhrases;
  }, [completedPhrases]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const idx = playbackMethodsRef.current?.getCurrentPhraseIndex?.();
      if (typeof idx !== 'number') return;
      if (idx !== currentIndexRef.current) {
        currentIndexRef.current = idx;
        setCurrentIndex(idx);
      }
      if (!completedRef.current.includes(idx)) {
        setCompletedPhrases((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      }
    }, 400);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPhrases(true);

    const fetchTemplatePhrases = async () => {
      try {
        const inputLang = data.nativeLanguage || 'en-GB';
        const targetLang = data.targetLanguage || 'it-IT';

        const templatesRef = collection(firestore, 'templates');
        const [inputSnapshot, targetSnapshot] = await Promise.all([
          getDocs(query(
            templatesRef,
            where('groupId', '==', QUICK_WIN_TEMPLATE_GROUP_ID),
            where('lang', '==', inputLang)
          )),
          getDocs(query(
            templatesRef,
            where('groupId', '==', QUICK_WIN_TEMPLATE_GROUP_ID),
            where('lang', '==', targetLang)
          )),
        ]);

        if (inputSnapshot.empty || targetSnapshot.empty) {
          if (isMounted) setTemplatePhrases([]);
          return;
        }

        const inputDoc = inputSnapshot.docs[0];
        const targetDoc = targetSnapshot.docs[0];
        const inputTemplate = { id: inputDoc.id, ...inputDoc.data() } as TemplateForQuickWin;
        const targetTemplate = { id: targetDoc.id, ...targetDoc.data() } as TemplateForQuickWin;

        if (isMounted) {
          setTemplatePhrases(buildTemplatePhrases(inputTemplate, targetTemplate));
        }
      } catch (error) {
        console.error('Error fetching quick win template:', error);
        if (isMounted) setTemplatePhrases([]);
      } finally {
        if (isMounted) setIsLoadingPhrases(false);
      }
    };

    fetchTemplatePhrases();

    return () => {
      isMounted = false;
    };
  }, [data.nativeLanguage, data.targetLanguage]);

  const onCompleted = () => {
    onNext();
  };

  const phrases = useMemo<Phrase[]>(() => templatePhrases, [templatePhrases]);

  const selectedMode = useMemo(
    () => quickWinModes.find((mode) => mode.value === practiceMode) ?? quickWinModes[0],
    [practiceMode]
  );

  const presentationConfig = useMemo<PresentationConfig>(
    () => ({
      ...defaultPresentationConfig,
      ...selectedMode.config,
    }),
    [selectedMode.config]
  );

  useEffect(() => {
    if (isFirstModeSelection.current) {
      isFirstModeSelection.current = false;
      return;
    }

    if (!playbackCardRef.current) return;
    window.requestAnimationFrame(() => {
      playbackCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [practiceMode]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 mx-auto">
          <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">Try shadowing in action</h1>
        <p className="text-gray-600 text-lg">
          Listen, repeat, and adjust the settings to match your pace.
        </p>
      </div>

      <Card
        ref={playbackCardRef}
        className="p-0 overflow-hidden from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950"
      >
        {isLoadingPhrases ? (
          <div className={`flex ${presentationContainerSizeClass} flex-col items-center justify-center gap-6 p-6`}>
            <div className="h-6 w-2/3 max-w-md rounded bg-gray-200/70 dark:bg-slate-700/50" />
            <div className="h-px w-24 bg-gray-200/80 dark:bg-slate-700/60" />
            <div className="h-6 w-2/3 max-w-md rounded bg-gray-200/70 dark:bg-slate-700/50" />
          </div>
        ) : (
          <PhrasePlaybackView
            phrases={phrases}
            presentationConfig={presentationConfig}
            methodsRef={playbackMethodsRef}
            readOnly
            showImportPhrases={false}
            hidePhrases={true}
            onCompleted={onCompleted}
          />
        )}
      </Card>

      <Card className="p-5 space-y-5">
        <div className="space-y-3">
          <Label className="text-base">Choose your practice style</Label>
          <RadioGroup value={practiceMode} onValueChange={(value) => setPracticeMode(value as QuickWinMode)}>
            <div className="grid gap-3">
              {quickWinModes.map((mode) => (
                <label
                  key={mode.value}
                  className={[
                    'flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-all',
                    'dark:border-slate-700 dark:hover:bg-slate-800/40',
                    practiceMode === mode.value && 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/10',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={mode.value} className="cursor-pointer">
                        {mode.label}
                      </Label>
                      {mode.value === 'shadowing' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Tap any word to see instant translation
          and pronunciation hints
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
