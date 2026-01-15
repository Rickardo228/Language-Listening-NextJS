'use client'

import { useState } from 'react';
import { ChevronLeft, CircleAlert } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupItem } from '../../ui/RadioGroup';
import { cn } from '../../ui/utils';
import { OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const painPoints = [
  "I know words but can't form sentences fast",
  'My pronunciation feels off',
  'I can read, but speaking is stressful',
  'I start strong then lose consistency',
  "I don't know what to practice next",
];

const practiceTimes = [
  { value: 'morning', label: 'Morning' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'evening', label: 'Evening' },
];

export function PainPoints({ data, updateData, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string[]>(data.painPoints || []);
  const [practiceTime, setPracticeTime] = useState<string>(
    data.practiceTime || ''
  );

  const handleToggle = (point: string) => {
    setSelected((prev) =>
      prev.includes(point)
        ? prev.filter((item) => item !== point)
        : [...prev, point]
    );
  };

  const handleContinue = () => {
    updateData({ painPoints: selected, practiceTime });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 mx-auto">
          <CircleAlert className="w-8 h-8 text-amber-600 dark:text-amber-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">
          What's getting in your way right now?
        </h1>
      </div>

      <div className="space-y-3">
        {painPoints.map((point) => {
          const isSelected = selected.includes(point);
          return (
            <label
              key={point}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer transition-all',
                'dark:border-slate-700 dark:hover:bg-slate-800/40',
                isSelected && 'border-amber-300 bg-amber-50 dark:border-amber-300/70 dark:bg-amber-500/10'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(point)}
                className="mt-1"
              />
              <span className="flex-1">{point}</span>
            </label>
          );
        })}
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Label className="text-base">When do you usually practice?</Label>
        <RadioGroup value={practiceTime} onValueChange={setPracticeTime}>
          <div className="flex gap-3">
            {practiceTimes.map((time) => (
              <label
                key={time.value}
                className={cn(
                  'flex-1 flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-all',
                  'dark:border-slate-700 dark:hover:bg-slate-800/40',
                  practiceTime === time.value && 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/10'
                )}
              >
                <RadioGroupItem value={time.value} id={time.value} />
                <Label htmlFor={time.value} className="cursor-pointer flex-1">
                  {time.label}
                </Label>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="flex-1"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
