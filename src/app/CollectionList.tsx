import { Config } from './types';
import { LanguageFlags } from './components/LanguageFlags';
import { useRouter } from 'next/navigation';

interface CollectionListProps {
    savedCollections: Config[];
    onLoadCollection: (config: Config) => void;
    onRenameCollection: (id: string) => void;
    onDeleteCollection: (id: string) => void;
    selectedCollection: string;
    loading?: boolean;
}

export function CollectionList({
    savedCollections,
    onLoadCollection,
    onRenameCollection,
    onDeleteCollection,
    selectedCollection,
    loading = false,
}: CollectionListProps) {
    const router = useRouter();

    // Sort collections by created_at in descending order (most recent first)
    const sortedCollections = [...savedCollections].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Lists</h2>
                <button
                    onClick={() => router.push('/templates')}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors lg:mr-10"
                    title="Browse Templates"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3 h-3"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                    </svg>
                    Templates
                </button>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-2">
                    {sortedCollections.map((collection) => {
                        // Get the first phrase's languages if available
                        const firstPhrase = collection.phrases[0];

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
                                                    <LanguageFlags
                                                        inputLang={firstPhrase.inputLang}
                                                        targetLang={firstPhrase.targetLang}
                                                    />
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
            )}
        </div>
    );
} 