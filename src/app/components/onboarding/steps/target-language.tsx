'use client'

import { useMemo, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { OnboardingData } from '../types';
import { languageOptions } from '../../../types';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function TargetLanguage({ data, updateData, onNext, isLoading }: Props) {
  const [targetLanguage, setTargetLanguage] = useState(data.targetLanguage || '');

  const languageChoices = useMemo(
    () => languageOptions.map((lang) => ({ value: lang.code, label: lang.label })),
    []
  );

  const targetOptions = [
    { value: '', label: 'Select a language' },
    ...languageChoices,
  ];

  const handleContinue = () => {
    updateData({ targetLanguage });
    onNext();
  };

  const isValid = Boolean(targetLanguage);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/20 mx-auto">
          <GraduationCap className="w-8 h-8 text-purple-600 dark:text-purple-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">
          I want to learn...
        </h1>
      </div>

      <div>
        <Select
          id="target"
          options={targetOptions}
          value={targetLanguage}
          onChange={(event) => setTargetLanguage(event.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button
        onClick={handleContinue}
        disabled={!isValid || isLoading}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
