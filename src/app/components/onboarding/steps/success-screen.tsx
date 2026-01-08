'use client'

import { PartyPopper, Play, Library, Upload } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { OnboardingData } from '../types';
import { languageOptions } from '../../../types';

interface Props {
  data: OnboardingData;
  onComplete?: () => void;
}

export function SuccessScreen({ data, onComplete }: Props) {
  const inputLabel =
    languageOptions.find((lang) => lang.code === data.nativeLanguage)?.label ||
    data.nativeLanguage;
  const targetLabel =
    languageOptions.find((lang) => lang.code === data.targetLanguage)?.label ||
    data.targetLanguage;

  return (
    <div className="space-y-8 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-emerald-500/20 dark:to-green-500/20 mb-2">
          <PartyPopper className="w-12 h-12 text-green-600 dark:text-green-300" />
        </div>
        <h1 className="text-4xl md:text-5xl">You're in!</h1>
        <p className="text-xl text-gray-600">Here's today's session</p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950">
        <div className="space-y-3">
          <h2 className="text-center mb-4 text-lg font-semibold">Your personalized plan</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Learning</p>
              <p>
                {inputLabel} → {targetLabel}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Level</p>
              <p className="capitalize">{data.abilityLevel}</p>
            </div>
            <div>
              <p className="text-gray-600">Focus areas</p>
              <p>{data.dreamOutcomes.length} goals</p>
            </div>
            <div>
              <p className="text-gray-600">Interests</p>
              <p>{data.interests.length} topics</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button className="w-full" size="lg" onClick={onComplete}>
          <Play className="w-5 h-5 mr-2" />
          Start Day 1 (10 minutes)
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg">
            <Library className="w-4 h-4 mr-2" />
            Browse templates
          </Button>
          <Button variant="outline" size="lg">
            <Upload className="w-4 h-4 mr-2" />
            Import content
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
          What to expect this week
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 shrink-0">•</span>
            <span>Daily 10-15 minute sessions customized to your level</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 shrink-0">•</span>
            <span>Progress tracking to see your speaking confidence grow</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 shrink-0">•</span>
            <span>Access to full template library based on your interests</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 shrink-0">•</span>
            <span>Reminder on day 5 with your trial status</span>
          </li>
        </ul>
      </Card>

    </div>
  );
}
