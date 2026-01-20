'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import {
  ChevronLeft,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  Volume2,
  Zap,
} from 'lucide-react';
import {
  PhrasePlaybackView,
  type PhrasePlaybackMethods,
} from '../../PhrasePlaybackView';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Label } from '../../ui/Label';
import { Slider } from '../../ui/Slider';
import { Switch } from '../../ui/Switch';
import { OnboardingData } from '../types';
import { defaultPresentationConfig } from '../../../defaultConfig';
import { Phrase, PresentationConfig, Template } from '../../../types';
import { buildTemplatePhrases } from '../../../utils/templatePhrases';

const firestore = getFirestore();
const QUICK_WIN_TEMPLATE_GROUP_ID = 'beginner_001';

type TemplateForQuickWin = Template;

interface Props {
  data: OnboardingData;
  onNext: () => void;
  onBack: () => void;
}

const lauraMipsoPhrases = [
  {
    native: 'Hello, how are you?',
    target: '¿Hola, cómo estás?',
    phonetic: 'OH-lah, KOH-moh ehs-TAHS',
  },
  {
    native: "I'm doing well, thank you",
    target: 'Estoy bien, gracias',
    phonetic: 'ehs-TOY bee-EN, GRAH-see-ahs',
  },
  {
    native: 'What is your name?',
    target: '¿Cómo te llamas?',
    phonetic: 'KOH-moh teh YAH-mahs',
  },
  {
    native: 'Nice to meet you',
    target: 'Mucho gusto',
    phonetic: 'MOO-choh GOO-stoh',
  },
  {
    native: 'Where are you from?',
    target: '¿De dónde eres?',
    phonetic: 'deh DOHN-deh EH-rehs',
  },
  {
    native: 'I am learning Spanish',
    target: 'Estoy aprendiendo español',
    phonetic: 'ehs-TOY ah-prehn-dee-EN-doh ehs-pah-NYOL',
  },
];

export function QuickWin({ data, onNext, onBack }: Props) {
  const [playTranslation, setPlayTranslation] = useState(true);
  const [speed, setSpeed] = useState([1]);
  const [shadowPause, setShadowPause] = useState([2]);
  const [completedPhrases, setCompletedPhrases] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [templatePhrases, setTemplatePhrases] = useState<Phrase[]>([]);
  const playbackMethodsRef = useRef<PhrasePlaybackMethods | null>(null);
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

  const fallbackPhrases = useMemo<Phrase[]>(
    () =>
      lauraMipsoPhrases.map((phrase) => ({
        input: phrase.native,
        translated: phrase.target,
        romanized: phrase.phonetic,
        inputLang: data.nativeLanguage || 'en-GB',
        targetLang: data.targetLanguage || 'es-ES',
        inputAudio: null,
        outputAudio: null,
        inputVoice: `${data.nativeLanguage || 'en-GB'}-Standard-D`,
        targetVoice: `${data.targetLanguage || 'es-ES'}-Standard-D`,
      })),
    [data.nativeLanguage, data.targetLanguage]
  );

  const phrases = useMemo<Phrase[]>(
    () => (templatePhrases.length > 0 ? templatePhrases : fallbackPhrases),
    [fallbackPhrases, templatePhrases]
  );

  const presentationConfig = useMemo<PresentationConfig>(
    () => ({
      ...defaultPresentationConfig,
      containerBg: '',
      enableLoop: false,
      enableInputPlayback: false,
      enableOutputBeforeInput: !playTranslation,
      inputPlaybackSpeed: speed[0],
      outputPlaybackSpeed: speed[0],
      delayBetweenPhrases: shadowPause[0] * 1000,
    }),
    [playTranslation, shadowPause, speed]
  );

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

      <Card className="p-0 overflow-hidden from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950">
        <PhrasePlaybackView
          phrases={phrases}
          presentationConfig={presentationConfig}
          methodsRef={playbackMethodsRef}
          readOnly
          showImportPhrases={false}
          hidePhrases={true}
          onCompleted={onCompleted}
        />
      </Card>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <Label htmlFor="play-translation" className="flex items-center gap-2">
            {playTranslation ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            Play translation
          </Label>
          <Switch
            id="play-translation"
            checked={playTranslation}
            onCheckedChange={setPlayTranslation}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Playback speed
            </Label>
            <span className="text-sm text-gray-600">{speed[0]}x</span>
          </div>
          <Slider
            value={speed}
            onValueChange={setSpeed}
            min={0.5}
            max={1.5}
            step={0.25}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Shadow pause
            </Label>
            <span className="text-sm text-gray-600">{shadowPause[0]}s</span>
          </div>
          <Slider
            value={shadowPause}
            onValueChange={setShadowPause}
            min={1}
            max={5}
            step={1}
          />
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
