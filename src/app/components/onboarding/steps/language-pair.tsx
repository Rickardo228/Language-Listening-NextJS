'use client'

import { useMemo, useState } from 'react';
import { ChevronLeft, Languages } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Select } from '../../ui/Select';
import { OnboardingData } from '../types';
import { languageOptions } from '../../../types';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function LanguagePair({ data, updateData, onNext, onBack, isLoading }: Props) {
  const [nativeLanguage, setNativeLanguage] = useState(data.nativeLanguage || '');
  const [targetLanguage, setTargetLanguage] = useState(data.targetLanguage || '');

  const languageChoices = useMemo(
    () => languageOptions.map((lang) => ({ value: lang.code, label: lang.label })),
    []
  );

  const nativeOptions = [
    { value: '', label: 'Select your native language' },
    ...languageChoices,
  ];

  const targetOptions = [
    { value: '', label: 'Select your target language' },
    ...languageChoices.filter((lang) => lang.value !== nativeLanguage),
  ];

  const handleContinue = () => {
    updateData({ nativeLanguage, targetLanguage });
    onNext();
  };

  const isValid = Boolean(nativeLanguage && targetLanguage && nativeLanguage !== targetLanguage);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/20 mx-auto">
          <Languages className="w-8 h-8 text-purple-600 dark:text-purple-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">
          Great - let's set your language pair.
        </h1>
        <p className="text-gray-600 text-lg">
          Everything you practice will be tailored to this pair (templates, translations, audio).
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="native">Your native language</Label>
          <Select
            id="native"
            options={nativeOptions}
            value={nativeLanguage}
            onChange={(event) => setNativeLanguage(event.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Language you're learning</Label>
          <Select
            id="target"
            options={targetOptions}
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2" disabled={isLoading}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isValid || isLoading}
          className="flex-1"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
