import { languageOptions } from './types';
import { useImportPhrasesVisibility } from './hooks/useImportPhrasesVisibility';

export interface ImportPhrasesProps {
    inputLang: string;
    setInputLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    phrasesInput: string;
    setPhrasesInput: (input: string) => void;
    loading: boolean;
    onProcess?: () => void;
    onAddToCollection?: () => void;
    hasSelectedCollection: boolean;
}

type ButtonConfig = {
    onClick: () => void;
    text: string;
    className: string;
};

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
    const { shouldRender, hasAddToCollection: hasAddToCollectionVisibility, hasCreateNew } = useImportPhrasesVisibility({
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
    });

    if (!shouldRender) return null;

    const buttons: ButtonConfig[] = [
        hasAddToCollectionVisibility && {
            onClick: onAddToCollection!,
            text: "Add Phrases To Current Collection",
            className: "px-4 py-2 text-lg bg-blue-400 text-white rounded hover:bg-blue-500 flex items-center justify-center"
        },
        hasCreateNew && {
            onClick: onProcess!,
            text: "Create New Collection",
            className: "px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
        }
    ].filter((button): button is ButtonConfig => Boolean(button));

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
                placeholder="Enter words or phrases. One per line:"
                value={phrasesInput}
                onChange={(e) => setPhrasesInput(e.target.value)}
                rows={6}
                className="w-full p-2 text-lg border border-gray-300 rounded mb-4"
            />

            {/* Buttons */}
            <div className="flex flex-col gap-2">
                {buttons.map((button, index) => (
                    <button
                        key={index}
                        onClick={button.onClick}
                        disabled={loading}
                        className={button.className}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : button.text}
                    </button>
                ))}
            </div>
        </>
    );
} 