'use client'

import { Button } from '../../ui/Button';
import { useUser } from '../../../contexts/UserContext';
import { features } from './paywall';

interface Props {
  onNext: () => void;
}

export function FeatureHighlights({ onNext }: Props) {
  const { user } = useUser();
  const displayName = user?.displayName?.split(' ')[0] || null;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl">
          {displayName ? `Welcome ${displayName}!` : 'Welcome!'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300">
          Language Shadowing can be done anywhere, any time, to get you speaking faster.
        </p>
      </div>

      <div className="space-y-5">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 shrink-0">
              <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p
                className="font-bold text-gray-900 dark:text-white"
                style={{ fontFamily: 'var(--font-playpen-sans)' }}
              >
                {feature.highlight
                  ? feature.title.split(feature.highlight).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="text-green-500">{feature.highlight}</span>
                        )}
                      </span>
                    ))
                  : feature.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
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
