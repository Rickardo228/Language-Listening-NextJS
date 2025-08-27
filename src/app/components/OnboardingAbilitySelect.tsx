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
}

export function OnboardingAbilitySelect({
    selectedLevel,
    onLevelChange,
    targetLanguage,
    disabled = false,
}: OnboardingAbilitySelectProps) {
    return (
        <div className="space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                    What&apos;s your current level in {targetLanguage}?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    This helps us personalize your learning experience
                </p>
            </div>

            <div className="grid gap-3">
                {abilityLevels.map((level) => (
                    <button
                        key={level.id}
                        type="button"
                        onClick={() => onLevelChange(level.id)}
                        disabled={disabled}
                        className={`
                            p-4 rounded-lg border-2 text-left transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                            hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20
                            ${selectedLevel === level.id 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0" aria-hidden="true">
                                {level.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {level.label}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {level.description}
                                </div>
                            </div>
                            {selectedLevel === level.id && (
                                <div className="flex-shrink-0 text-blue-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}