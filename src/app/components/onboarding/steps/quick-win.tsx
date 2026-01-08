'use client'

import { useState } from 'react';
import {
  ChevronLeft,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  Volume2,
  Zap,
} from 'lucide-react';
import { PresentationView } from '../../../PresentationView';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Label } from '../../ui/Label';
import { Slider } from '../../ui/Slider';
import { Switch } from '../../ui/Switch';
import { OnboardingData } from '../types';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTranslation, setPlayTranslation] = useState(true);
  const [speed, setSpeed] = useState([1]);
  const [shadowPause, setShadowPause] = useState([2]);
  const [completedPhrases, setCompletedPhrases] = useState<number[]>([]);
  const currentPhrase = lauraMipsoPhrases[currentIndex];
  const allCompleted = completedPhrases.length === lauraMipsoPhrases.length;

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
      if (!completedPhrases.includes(currentIndex)) {
        setCompletedPhrases((prev) => [...prev, currentIndex]);
      }
    }, 2000);
  };

  const handleNextPhrase = () => {
    if (currentIndex < lauraMipsoPhrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
    }
  };

  const handlePreviousPhrase = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {!allCompleted ? (
        <>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 mx-auto">
              <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h1 className="text-3xl md:text-4xl">Try shadowing in action</h1>
            <p className="text-gray-600 text-lg">
              Listen, repeat, and adjust the settings to match your pace.
            </p>
            {completedPhrases.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <CircleCheck className="w-4 h-4" />
                <span>
                  {completedPhrases.length} of {lauraMipsoPhrases.length} phrases
                  practiced
                </span>
              </div>
            )}
          </div>

          <Card className="p-0 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950">
            <div className="[&>div]:h-56 [&>div]:lg:h-[45vh] [&>div]:max-h-[45vh]">
              <PresentationView
                currentPhrase={currentPhrase.native}
                currentTranslated={playTranslation ? currentPhrase.target : ''}
                currentPhase={playTranslation ? 'output' : 'input'}
                inputLang={data.nativeLanguage || 'en-GB'}
                targetLang={data.targetLanguage || 'es-ES'}
                fullScreen={false}
                setFullscreen={() => {}}
                romanizedOutput={playTranslation ? currentPhrase.phonetic : undefined}
                showAllPhrases={false}
                enableInputPlayback={false}
                disableAnimation
                containerBg="transparent"
                textColor="light"
                onPrevious={handlePreviousPhrase}
                onNext={handleNextPhrase}
                canGoBack={currentIndex > 0}
                canGoForward={currentIndex < lauraMipsoPhrases.length - 1}
                currentPhraseIndex={currentIndex}
                totalPhrases={lauraMipsoPhrases.length}
                isPlayingAudio={isPlaying}
                paused={!isPlaying}
                onPlay={handlePlay}
                onPause={() => setIsPlaying(false)}
              />
            </div>
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
        </>
      ) : (
        <>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
              <CircleCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl">
              Nice — that's how shadowing becomes automatic.
            </h1>
            <p className="text-gray-600 text-lg">
              Start your free trial to unlock your full plan, templates, and
              unlimited collections.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={onNext} className="flex-1" size="lg">
              Start free trial
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
