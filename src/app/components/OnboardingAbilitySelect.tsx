import { Check } from 'lucide-react';
import { Card } from './ui/Card';

interface AbilityLevel {
    id: string;
    label: string;
    description: string;
    icon: string;
}

const abilityLevels: AbilityLevel[] = [
    {
        id: 'beginner',
        label: 'Beginner',
        description: 'Just starting out or know a few basic words',
        icon: '🌱'
    },
    {
        id: 'elementary',
        label: 'Elementary',
        description: 'Can understand simple phrases and questions',
        icon: '📚'
    },
    {
        id: 'intermediate',
        label: 'Intermediate', 
        description: 'Can handle everyday conversations',
        icon: '💬'
    },
    {
        id: 'advanced',
        label: 'Advanced',
        description: 'Comfortable with complex topics and nuanced language',
        icon: '🎯'
    },
    {
        id: 'native',
        label: 'Native/Fluent',
        description: 'Native speaker or near-native fluency',
        icon: '⭐'
    }
];

interface OnboardingAbilitySelectProps {
    selectedLevel: string;
    onLevelChange: (level: string) => void;
    targetLanguage: string;
    disabled?: boolean;
    showHeader?: boolean;
}

export function OnboardingAbilitySelect({
    selectedLevel,
    onLevelChange,
    targetLanguage,
    disabled = false,
    showHeader = true,
}: OnboardingAbilitySelectProps) {
    return (
        <div className="space-y-4">
            {showHeader && (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                        What&apos;s your current level in {targetLanguage}?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This helps us personalize your learning experience
                    </p>
                </div>
            )}

            <div className="grid gap-3">
                {abilityLevels.map((level) => {
                    const isSelected = selectedLevel === level.id;
                    return (
                        <Card
                            key={level.id}
                            as="button"
                            type="button"
                            onClick={() => onLevelChange(level.id)}
                            disabled={disabled}
                            className={`p-5 text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                                isSelected
                                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-400/70 dark:bg-emerald-500/10'
                                    : 'hover:border-emerald-200'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1"
                                    style={{
                                        borderColor: isSelected ? '#10b981' : '#d1d5db',
                                    }}
                                >
                                    {isSelected && (
                                        <div className="w-3 h-3 rounded-full bg-emerald-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl flex-shrink-0" aria-hidden="true">
                                            {level.icon}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {level.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {level.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                                        <Check className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
