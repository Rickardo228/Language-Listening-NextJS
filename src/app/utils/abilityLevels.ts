import { AbilityLevel } from './contentRecommendations';

export interface AbilityLevelOption {
    id: AbilityLevel;
    label: string;
    description: string;
    icon: string;
}

export const abilityLevels: AbilityLevelOption[] = [
    {
        id: 'beginner',
        label: 'Beginner',
        description: 'Just starting out or know a few basic words',
        icon: '🌱',
    },
    {
        id: 'elementary',
        label: 'Elementary',
        description: 'Can understand simple phrases and questions',
        icon: '📚',
    },
    {
        id: 'intermediate',
        label: 'Intermediate',
        description: 'Can handle everyday conversations',
        icon: '💬',
    },
    {
        id: 'advanced',
        label: 'Advanced',
        description: 'Comfortable with complex topics and nuanced language',
        icon: '🎯',
    },
    {
        id: 'native',
        label: 'Native/Fluent',
        description: 'Native speaker or near-native fluency',
        icon: '⭐',
    },
];

export const getAbilityLevelLabel = (level?: AbilityLevel) => {
    if (!level) return 'Beginner';
    return abilityLevels.find((option) => option.id === level)?.label ?? 'Beginner';
};
