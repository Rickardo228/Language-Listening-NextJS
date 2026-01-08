'use client'

import { useState } from 'react';
import {
  Calendar,
  ChartBar,
  ChevronLeft,
  CircleCheck,
  Library,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const features = [
  {
    icon: Calendar,
    title: 'Shadowing sessions built for your level',
  },
  {
    icon: Library,
    title: 'Full template library + learning paths',
  },
  {
    icon: TrendingUp,
    title: 'Unlimited collections + imports',
  },
  {
    icon: ChartBar,
    title: 'Progress stats + milestones',
  },
];

const plans = [
  {
    id: 'annual',
    name: 'Annual',
    price: '$79',
    period: '/year',
    savings: 'Save 40%',
    pricePerMonth: '$6.58/month',
    popular: true,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$12',
    period: '/month',
    pricePerMonth: null,
    popular: false,
  },
];

export function Paywall({ data, updateData, onNext, onBack }: Props) {
  const [selectedPlan, setSelectedPlan] = useState(data.selectedPlan || 'annual');

  const handleStartTrial = () => {
    updateData({ selectedPlan });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-2 mx-auto">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl leading-tight">
          Start your free trial — your next 7 days are mapped out
        </h1>
        <p className="text-gray-600 text-lg">
          No payment due now. We&apos;ll remind you before your trial ends.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 shrink-0">
              <feature.icon className="w-4 h-4 text-green-600 dark:text-green-300" />
            </div>
            <span className="text-sm pt-1">{feature.title}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`relative p-5 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/10' : ''
                }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  Most Popular
                </Badge>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: isSelected ? '#6366f1' : '#d1d5db',
                    }}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{plan.name}</span>
                      {plan.savings && (
                        <Badge variant="outline" className="text-xs">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                    {plan.pricePerMonth && (
                      <p className="text-sm text-gray-600">
                        {plan.pricePerMonth}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline">
                    <span className="text-2xl">{plan.price}</span>
                    <span className="text-gray-600 text-sm">{plan.period}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-start gap-3">
          <CircleCheck className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>7-day free trial</strong> — No payment due now
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Cancel anytime</strong> — Easy cancellation in settings
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Reminder before billing</strong> — We&apos;ll email you 2 days
            before your trial ends
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="px-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleStartTrial} className="flex-1" size="lg">
          Start free trial
        </Button>
      </div>

      <div className="space-y-1 text-center text-xs text-gray-500">
        <p>Your trial starts today and converts after 7 days.</p>
        <p>Secure checkout powered by Stripe.</p>
      </div>
    </div>
  );
}
