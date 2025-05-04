import { Config } from './types';

// Utility function to convert language code to flag emoji
function getFlagEmoji(languageCode: string): string {
    // Extract the country code from the language code (e.g., "en-US" -> "US")
    const countryCode = languageCode.split('-')[1];
    if (!countryCode) return '🌐';

    // Convert country code to regional indicator symbols
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

interface CollectionListProps {
    savedCollections: Config[];
    onLoadCollection: (config: Config) => void;
    onRenameCollection: (id: string) => void;
    onDeleteCollection: (id: string) => void;
    selectedCollection: string;
}

export function CollectionList({
    savedCollections,
    onLoadCollection,
    onRenameCollection,
    onDeleteCollection,
    selectedCollection,
}: CollectionListProps) {
    // Sort collections by created_at in descending order (most recent first)
    const sortedCollections = [...savedCollections].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Collections</h2>
            <div className="space-y-2">
                {sortedCollections.map((collection) => {
                    // Get the first phrase's languages if available
                    const firstPhrase = collection.phrases[0];
                    const inputFlag = firstPhrase ? getFlagEmoji(firstPhrase.inputLang) : '🌐';
                    const targetFlag = firstPhrase ? getFlagEmoji(firstPhrase.targetLang) : '🌐';

                    return (
                        <div
                            key={collection.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedCollection === collection.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background hover:bg-secondary'
                                }`}
                            onClick={() => onLoadCollection(collection)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium truncate">{collection.name}</h3>
                                    <p className="text-xs opacity-80 flex items-center gap-1">
                                        <span>{collection.phrases.length} phrases</span>
                                        {firstPhrase && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <span className="flex items-center gap-1">
                                                    {inputFlag} → {targetFlag}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRenameCollection(collection.id);
                                        }}
                                        className="p-1 rounded hover:bg-secondary"
                                        title="Rename collection"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCollection(collection.id);
                                        }}
                                        className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground"
                                        title="Delete collection"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 