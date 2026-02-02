'use client'

import { useState } from 'react';
import { Target } from 'lucide-react';
import { Button } from '../../ui/Button';

interface Props {
  onNext: (goal: string) => void;
}

const goals = [
  { id: '25', label: '25 phrases / day', description: 'Light & steady' },
  { id: '50', label: '50 phrases / day', description: 'Building momentum' },
  { id: '75', label: '75 phrases / day', description: 'Serious progress' },
  { id: '100', label: '100 phrases / day', description: 'Fast-track fluency' },
];

export function GoalSetting({ onNext }: Props) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl">
          Set your daily goal
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300">
          How many phrases do you want to practice each day?
        </p>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const isSelected = selectedGoal === goal.id;
          return (
            <div
              key={goal.id}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                isSelected
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setSelectedGoal(goal.id)}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${
                isSelected
                  ? 'bg-green-500/20'
                  : 'bg-gray-100 dark:bg-slate-800'
              }`}>
                <Target className={`w-6 h-6 ${
                  isSelected
                    ? 'text-green-500'
                    : 'text-gray-500 dark:text-slate-400'
                }`} />
              </div>
              <div>
                <p
                  className={`font-bold ${isSelected ? 'text-green-500' : ''}`}
                  style={{ fontFamily: 'var(--font-playpen-sans)' }}
                >
                  {goal.label}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  {goal.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => selectedGoal && onNext(selectedGoal)}
        className="w-full"
        size="lg"
        disabled={!selectedGoal}
        style={{ fontFamily: 'var(--font-playpen-sans)', fontWeight: 700 }}
      >
        SET MY GOAL
      </Button>
    </div>
  );
}
