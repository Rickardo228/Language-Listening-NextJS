'use client'

import { Bell } from 'lucide-react';
import { Button } from '../../ui/Button';

interface Props {
  onNext: () => void;
}

export function TrialReminder({ onNext }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl">
          We&apos;ll remind you
        </h1>
        <h1 className="text-3xl md:text-4xl mt-1">
          <span className="text-green-500">3 days</span> before your trial ends
        </h1>
      </div>

      <p className="text-center text-gray-600 dark:text-slate-400">
        You&apos;ll receive an email as a reminder
      </p>

      <div className="flex items-center justify-center py-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/20">
          <Bell className="w-10 h-10 text-green-500" />
        </div>
      </div>

      <Button
        onClick={onNext}
        className="w-full"
        size="lg"
        style={{ fontFamily: 'var(--font-playpen-sans)', fontWeight: 700 }}
      >
        START MY FREE WEEK
      </Button>
    </div>
  );
}
