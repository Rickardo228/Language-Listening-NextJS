'use client'

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { cn } from '../../ui/utils';
import { OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const outcomes = [
  'Speak more smoothly in conversations',
  'Understand natives at full speed',
  'Build confidence for travel/work/interviews',
  'Improve pronunciation and rhythm',
  'Stop freezing / translate less in my head',
];

export function DreamOutcome({ data, updateData, onNext }: Props) {
  const [selected, setSelected] = useState<string[]>(data.dreamOutcomes || []);

  const handleToggle = (outcome: string) => {
    setSelected((prev) =>
      prev.includes(outcome)
        ? prev.filter((item) => item !== outcome)
        : [...prev, outcome]
    );
  };

  const handleContinue = () => {
    updateData({ dreamOutcomes: selected });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-1 bg-indigo-100 dark:bg-indigo-500/20">
          <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">
          What would make you feel successful in 30 days?
        </h1>
        <p className="text-gray-600 text-lg">
          Choose what you want to <em>feel</em> - we&apos;ll build your practice around it.
        </p>
      </div>

      <div className="space-y-3">
        {outcomes.map((outcome) => {
          const isSelected = selected.includes(outcome);
          return (
            <label
              key={outcome}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-transparent hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all',
                'dark:border-slate-700 dark:hover:bg-slate-800/40',
                isSelected && 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/10'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(outcome)}
                className="mt-1"
              />
              <span className="flex-1">{outcome}</span>
            </label>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        disabled={selected.length === 0}
        fullWidth
        size="lg"
        className="bg-slate-700 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white"
      >
        Continue
      </Button>
    </div>
  );
}
