'use client'

import { useMemo, useState } from 'react';
import { ChevronLeft, User } from 'lucide-react';
import { Button } from '../../ui/Button';
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

export function NativeLanguage({ data, updateData, onNext, onBack, isLoading }: Props) {
  const [nativeLanguage, setNativeLanguage] = useState(data.nativeLanguage || '');

  const languageChoices = useMemo(
    () => languageOptions.map((lang) => ({ value: lang.code, label: lang.label })),
    []
  );

  const nativeOptions = [
    { value: '', label: 'Select a language' },
    ...languageChoices.filter((lang) => lang.value !== data.targetLanguage),
  ];

  const handleContinue = () => {
    updateData({ nativeLanguage });
    onNext();
  };

  const isValid = Boolean(nativeLanguage && nativeLanguage !== data.targetLanguage);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 mx-auto">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">
          I can already speak...
        </h1>
      </div>

      <div>
        <Select
          id="native"
          options={nativeOptions}
          value={nativeLanguage}
          onChange={(event) => setNativeLanguage(event.target.value)}
          disabled={isLoading}
        />
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
