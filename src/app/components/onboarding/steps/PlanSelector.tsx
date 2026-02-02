'use client'

import { Check } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { plans, Plan } from './plans';

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanSelect: (planId: string) => void;
}

export function PlanSelector({ selectedPlan, onPlanSelect }: PlanSelectorProps) {
  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.id;
        return (
          <div
            key={plan.id}
            className={`relative px-4 rounded-xl cursor-pointer transition-all border-2 ${
              plan.popular ? 'py-6' : 'py-4'
            } ${
              isSelected
                ? 'border-indigo-500 bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
            onClick={() => onPlanSelect(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2.5 left-4 bg-green-500 text-white text-xs px-2 py-0.5">
                MOST POPULAR
              </Badge>
            )}
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{plan.name}</div>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {plan.id === 'annual' ? '12 mo' : '1 mo'} • {plan.price}
                </div>
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="font-semibold">
                  {plan.id === 'annual' ? '$6.67' : plan.price}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400"> / MO</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
