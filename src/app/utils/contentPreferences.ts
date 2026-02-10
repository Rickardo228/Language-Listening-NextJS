export interface ContentPreference {
    id: string;
    label: string;
    emoji: string;
}

export const contentOptions: ContentPreference[] = [
    { id: 'business', label: 'Business & Career', emoji: '🏢' },
    { id: 'travel', label: 'Travel & Tourism', emoji: '✈️' },
    { id: 'food', label: 'Food & Cooking', emoji: '🍽️' },
    { id: 'technology', label: 'Technology', emoji: '💻' },
    { id: 'music', label: 'Music & Entertainment', emoji: '🎵' },
    { id: 'education', label: 'Education & Learning', emoji: '📚' },
    { id: 'sports', label: 'Sports & Fitness', emoji: '⚽' },
    { id: 'arts', label: 'Arts & Culture', emoji: '🎨' },
    { id: 'finance', label: 'Finance', emoji: '💰' },
    { id: 'health', label: 'Health & Medicine', emoji: '🏥' },
];
