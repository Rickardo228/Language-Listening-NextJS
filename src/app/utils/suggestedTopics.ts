import { AbilityLevel } from './contentRecommendations';
import { getAbilityLevelLabel } from './abilityLevels';

export interface SuggestedTopic {
    id: string;
    label: string;
    interests: string[];
    minAbilityLevel?: AbilityLevel;
    maxAbilityLevel?: AbilityLevel;
    prompt: string;
}

const ABILITY_RANK: Record<AbilityLevel, number> = {
    beginner: 0,
    elementary: 1,
    intermediate: 2,
    advanced: 3,
    native: 4,
};

const TOPICS: SuggestedTopic[] = [
    {
        id: 'travel-arrivals',
        label: 'Airport arrivals',
        interests: ['travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Common airport arrival phrases and questions',
    },
    {
        id: 'travel-transport',
        label: 'Public transport',
        interests: ['travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Buying tickets, routes, and schedules for buses or trains',
    },
    {
        id: 'travel-hotel',
        label: 'Hotel check-in',
        interests: ['travel', 'business'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Hotel check-in and room request phrases',
    },
    {
        id: 'travel-city',
        label: 'City directions',
        interests: ['travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Asking for directions and navigating a city',
    },
    {
        id: 'food-ordering',
        label: 'Ordering food',
        interests: ['food', 'travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Ordering food and asking about ingredients',
    },
    {
        id: 'food-cafe',
        label: 'Cafe chat',
        interests: ['food', 'travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Ordering coffee, pastries, and making small talk',
    },
    {
        id: 'food-cooking',
        label: 'Cooking basics',
        interests: ['food', 'education'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'advanced',
        prompt: 'Cooking steps, measurements, and kitchen verbs',
    },
    {
        id: 'food-grocery',
        label: 'Grocery shopping',
        interests: ['food'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Finding items, quantities, and asking about prices',
    },
    {
        id: 'business-meetings',
        label: 'Business meetings',
        interests: ['business', 'finance'],
        minAbilityLevel: 'intermediate',
        prompt: 'Meeting phrases, updates, and action items',
    },
    {
        id: 'business-email',
        label: 'Email follow-ups',
        interests: ['business'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'advanced',
        prompt: 'Polite email follow-ups and scheduling',
    },
    {
        id: 'business-pitch',
        label: 'Project pitch',
        interests: ['business'],
        minAbilityLevel: 'intermediate',
        maxAbilityLevel: 'advanced',
        prompt: 'Pitching ideas, timelines, and outcomes',
    },
    {
        id: 'tech-helpdesk',
        label: 'Tech support',
        interests: ['technology'],
        minAbilityLevel: 'intermediate',
        prompt: 'Troubleshooting steps and device issues',
    },
    {
        id: 'tech-apps',
        label: 'App settings',
        interests: ['technology'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Navigating app settings and permissions',
    },
    {
        id: 'tech-workflow',
        label: 'Team workflow',
        interests: ['technology', 'business'],
        minAbilityLevel: 'intermediate',
        maxAbilityLevel: 'advanced',
        prompt: 'Standups, tickets, and handoffs for teams',
    },
    {
        id: 'sports-fitness',
        label: 'Workout routines',
        interests: ['sports', 'health'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'advanced',
        prompt: 'Gym routines, sets, and equipment instructions',
    },
    {
        id: 'sports-live',
        label: 'Sports talk',
        interests: ['sports'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'advanced',
        prompt: 'Game reactions, scores, and favorite teams',
    },
    {
        id: 'sports-outdoors',
        label: 'Outdoor activities',
        interests: ['sports', 'travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'advanced',
        prompt: 'Hiking, gear, and trail planning',
    },
    {
        id: 'arts-museum',
        label: 'Museum visit',
        interests: ['arts', 'travel', 'education'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Museum tour phrases and asking about exhibits',
    },
    {
        id: 'arts-creativity',
        label: 'Creative projects',
        interests: ['arts'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'advanced',
        prompt: 'Discussing creative ideas, materials, and inspiration',
    },
    {
        id: 'music-concert',
        label: 'Live music',
        interests: ['music', 'arts'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'advanced',
        prompt: 'Concert talk, tickets, and reactions',
    },
    {
        id: 'music-playlist',
        label: 'Playlist vibes',
        interests: ['music'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'advanced',
        prompt: 'Talking about genres, moods, and favorite songs',
    },
    {
        id: 'health-pharmacy',
        label: 'Pharmacy visit',
        interests: ['health'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'intermediate',
        prompt: 'Describing symptoms and medication questions',
    },
    {
        id: 'health-appointment',
        label: 'Doctor visit',
        interests: ['health'],
        minAbilityLevel: 'elementary',
        maxAbilityLevel: 'intermediate',
        prompt: 'Explaining symptoms and booking appointments',
    },
    {
        id: 'health-wellness',
        label: 'Wellness goals',
        interests: ['health', 'sports'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'advanced',
        prompt: 'Health goals, habits, and daily routines',
    },
    {
        id: 'education-study',
        label: 'Study habits',
        interests: ['education'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'advanced',
        prompt: 'Study routines, goals, and classroom phrases',
    },
    {
        id: 'education-class',
        label: 'Classroom talk',
        interests: ['education'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Asking questions, homework, and participation',
    },
    {
        id: 'finance-budget',
        label: 'Budgeting basics',
        interests: ['finance'],
        minAbilityLevel: 'intermediate',
        maxAbilityLevel: 'advanced',
        prompt: 'Budgets, expenses, and savings goals',
    },
    {
        id: 'finance-shopping',
        label: 'Shopping decisions',
        interests: ['finance', 'travel'],
        minAbilityLevel: 'beginner',
        maxAbilityLevel: 'intermediate',
        prompt: 'Comparing prices, discounts, and payments',
    },
];

const matchesAbility = (topic: SuggestedTopic, abilityLevel?: AbilityLevel) => {
    if (!abilityLevel) return true;
    const level = ABILITY_RANK[abilityLevel];
    if (topic.minAbilityLevel && level < ABILITY_RANK[topic.minAbilityLevel]) return false;
    if (topic.maxAbilityLevel && level > ABILITY_RANK[topic.maxAbilityLevel]) return false;
    return true;
};

const shuffle = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export const getSuggestedTopics = ({
    contentPreferences = [],
    abilityLevel,
    count = 2,
}: {
    contentPreferences?: string[];
    abilityLevel?: AbilityLevel;
    count?: number;
}) => {
    const preferenceSet = new Set(contentPreferences);
    const matchesInterest = (topic: SuggestedTopic) =>
        preferenceSet.size === 0 || topic.interests.some((interest) => preferenceSet.has(interest));

    let filtered = TOPICS.filter((topic) => matchesInterest(topic) && matchesAbility(topic, abilityLevel));

    if (filtered.length === 0) {
        filtered = TOPICS.filter((topic) => matchesAbility(topic, abilityLevel));
    }
    if (filtered.length === 0) {
        filtered = TOPICS;
    }

    return shuffle(filtered).slice(0, count);
};

export const buildSuggestedPrompt = (topic: SuggestedTopic, abilityLevel?: AbilityLevel) => {
    const levelLabel = getAbilityLevelLabel(abilityLevel);
    return `${topic.prompt} for a ${levelLabel} learner`;
};
