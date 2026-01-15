'use client'

import { ChevronLeft, Heart } from 'lucide-react';
import { Button } from '../../ui/Button';
import { OnboardingData } from '../types';
import { OnboardingContentPreferences } from '../../OnboardingContentPreferences';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function Interests({ data, updateData, onNext, onBack, isLoading }: Props) {
  const isReady = data.interests.length >= 3;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 mx-auto">
          <Heart className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">What interests you?</h1>
        <p className="text-gray-600 text-lg">
          Choose three or more topics you&apos;d like to learn about.
        </p>
      </div>
      <OnboardingContentPreferences
        selectedPreferences={data.interests}
        onPreferencesChange={(prefs) => updateData({ interests: prefs })}
        disabled={isLoading}
        showHeader={false}
      />

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2" disabled={isLoading}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} fullWidth size="lg" disabled={isLoading || !isReady}>
          Continue
        </Button>
      </div>
    </div>
  );
}
