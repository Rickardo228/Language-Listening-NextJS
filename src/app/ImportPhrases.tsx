import { languageOptions } from './types';

interface ImportPhrasesProps {
    inputLang: string;
    setInputLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    phrasesInput: string;
    setPhrasesInput: (input: string) => void;
    loading: boolean;
    onProcess: () => void;
    onAddToCollection: () => void;
    hasSelectedCollection: boolean;
}

export function ImportPhrases({
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
    phrasesInput,
    setPhrasesInput,
    loading,
    onProcess,
    onAddToCollection,
    hasSelectedCollection
}: ImportPhrasesProps) {
    return (
        <>
            {/* Language Selection */}
            <div className="flex flex-wrap gap-4 mb-4">
                <div>
                    <label htmlFor="inputLang" className="block font-medium mb-1">Input Language</label>
                    <select
                        id="inputLang"
                        value={inputLang}
                        onChange={(e) => setInputLang(e.target.value)}
                        className="p-2 border border-gray-300 rounded"
                    >
                        {languageOptions.map((option) => (
                            <option key={option.code} value={option.code}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="targetLang" className="block font-medium mb-1">Output Language</label>
                    <select
                        id="targetLang"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="p-2 border border-gray-300 rounded"
                    >
                        {languageOptions.map((option) => (
                            <option key={option.code} value={option.code}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Textarea for initial phrases */}
            <textarea
                placeholder="Enter phrases to translate, one per line"
                value={phrasesInput}
                onChange={(e) => setPhrasesInput(e.target.value)}
                rows={6}
                className="w-full p-2 text-lg border border-gray-300 rounded mb-4"
            />

            {/* Buttons */}
            <div className="flex flex-col gap-2">
                {hasSelectedCollection && (
                    <button
                        onClick={onAddToCollection}
                        disabled={loading}
                        className="px-4 py-2 text-lg bg-blue-400 text-white rounded hover:bg-blue-500 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : "Add Phrases To Current Collection"}
                    </button>
                )}
                <button
                    onClick={onProcess}
                    disabled={loading}
                    className="px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : "Create New Collection"}
                </button>

            </div>
        </>
    );
} 