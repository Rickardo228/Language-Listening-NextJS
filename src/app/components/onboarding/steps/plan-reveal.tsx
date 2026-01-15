'use client'

import { Calendar, ChevronLeft, CircleCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { OnboardingData } from '../types';
import { Card } from '../../ui/Card';

interface Props {
  data: OnboardingData;
  onNext: () => void;
  onBack: () => void;
}

type PlanDay = {
  day: number;
  title: string;
  description: string;
};

const planByLevel: Record<string, PlanDay[]> = {
  beginner: [
    { day: 1, title: 'Getting started phrases', description: 'Feel confident fast with essential phrases you can use right away.' },
    { day: 2, title: 'Nouns + noun examples', description: 'Lock in core vocabulary so everyday sentences come naturally.' },
    { day: 3, title: 'Scenarios (simple)', description: 'Practice real-life situations so you know what to say when it counts.' },
    { day: 4, title: 'Short story', description: 'Build understanding through context and repetition, not memorization.' },
    { day: 5, title: 'First conversations', description: 'Speak in short exchanges to build comfort and flow.' },
    { day: 6, title: 'Output challenge', description: 'Boost recall by speaking without translation hints.' },
    { day: 7, title: 'Review + milestone', description: 'See measurable progress and set the next target.' },
  ],
  elementary: [
    { day: 1, title: 'Starter phrases refresh', description: 'Reinforce the basics so you speak with less hesitation.' },
    { day: 2, title: 'Noun examples + recall', description: 'Strengthen recall so words come to you faster.' },
    { day: 3, title: 'Scenarios', description: 'Handle everyday situations with guided support.' },
    { day: 4, title: 'Story chapter', description: 'Build comprehension with clear context and repetition.' },
    { day: 5, title: 'Conversations', description: 'Build fluency with natural‑pace dialogs.' },
    { day: 6, title: 'Output challenge', description: 'Speak more freely with fewer hints.' },
    { day: 7, title: 'Review + milestone', description: 'Consolidate gains and track progress.' },
  ],
  intermediate: [
    { day: 1, title: 'Conversation warm‑up', description: 'Get fluent faster by repeating real dialogue patterns.' },
    { day: 2, title: 'Scenarios', description: 'Practice decision‑based speaking with prompts.' },
    { day: 3, title: 'News', description: 'Practice listening and short summaries with real topics.' },
    { day: 4, title: 'Story chapter', description: 'Build stamina and comprehension with longform.' },
    { day: 5, title: 'Listening at higher speed', description: 'Train your ear for natural pace.' },
    { day: 6, title: 'Output challenge', description: 'Speak without translation to build reflexes.' },
    { day: 7, title: 'Review + milestone', description: 'Lock in progress and see momentum.' },
  ],
  advanced: [
    { day: 1, title: 'Fast conversations', description: 'Work at native pace to improve speed and accuracy.' },
    { day: 2, title: 'Scenarios (complex)', description: 'Handle nuanced situations with confidence.' },
    { day: 3, title: 'News', description: 'Focus on detail and inference in real topics.' },
    { day: 4, title: 'Longform story', description: 'Build depth with sustained listening.' },
    { day: 5, title: 'Listening at higher speed', description: 'Increase speed while maintaining clarity.' },
    { day: 6, title: 'Output challenge', description: 'Speak fluidly without hints.' },
    { day: 7, title: 'Review + milestone', description: 'Review key wins and set the next goal.' },
  ],
  native: [
    { day: 1, title: 'Advanced conversations', description: 'Maintain sharpness with native‑level dialogue.' },
    { day: 2, title: 'Scenarios (nuanced)', description: 'Practice precision, tone, and intent.' },
    { day: 3, title: 'News', description: 'Focus on detail and accurate summaries.' },
    { day: 4, title: 'Longform story', description: 'Strengthen nuance with complex narratives.' },
    { day: 5, title: 'Listening at higher speed', description: 'Keep clarity at higher pace.' },
    { day: 6, title: 'Output challenge', description: 'Speak cleanly without hints.' },
    { day: 7, title: 'Review + milestone', description: 'Review and set the next goal.' },
  ],
};

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  native: 'Native/Fluent',
};

export function PlanReveal({ data, onNext, onBack }: Props) {
  const levelKey = data.abilityLevel || 'beginner';
  const weekPlan = planByLevel[levelKey] || planByLevel.beginner;

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 mx-auto">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-300" />
        </div>
        <h1 className="text-3xl md:text-4xl">Your 7-day speaking plan is ready</h1>
        <p className="text-gray-600 text-lg">
          You'll get early wins fast - then we build speaking reflexes with a repeatable routine.
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 text-left">
        {weekPlan.map((day) => (
          <Card key={day.day} className="p-4">
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 shrink-0">
                {day.day}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="mb-1">Day {day.day}: {day.title}</h3>
                    <p className="text-sm text-gray-600">{day.description}</p>
                  </div>
                  {day.day === 1 && (
                    <CircleCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} fullWidth size="lg">
          Preview your first lesson
        </Button>
      </div>
    </div>
  );
}
