'use client'

import { ChevronLeft, TrendingUp } from 'lucide-react';
import { Button } from '../../ui/Button';
import { OnboardingData } from '../types';
import { OnboardingAbilitySelect } from '../../OnboardingAbilitySelect';
import { languageOptions } from '../../../types';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function AbilityLevel({ data, updateData, onNext, onBack, isLoading }: Props) {
  const targetLabel =
    languageOptions.find((lang) => lang.code === data.targetLanguage)?.label ||
    data.targetLanguage;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mx-auto">
          <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">Pick your starting pace</h1>
        <p className="text-gray-600 text-lg">
          This helps us personalize your learning experience.
        </p>
      </div>
      <OnboardingAbilitySelect
        selectedLevel={data.abilityLevel}
        onLevelChange={(level) => updateData({ abilityLevel: level })}
        targetLanguage={targetLabel}
        disabled={isLoading}
        showHeader={false}
      />

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2" disabled={isLoading}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} fullWidth size="lg" disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  );
}
