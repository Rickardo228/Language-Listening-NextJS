import { languageOptions } from './types';
import { useImportPhrasesVisibility } from './hooks/useImportPhrasesVisibility';
import { useState } from 'react';
import { API_BASE_URL } from './consts';

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
    const [prompt, setPrompt] = useState('');
    const [generatingPhrases, setGeneratingPhrases] = useState(false);

    const handleGeneratePhrases = async () => {
        if (!prompt.trim()) return;

        setGeneratingPhrases(true);
        try {
            const response = await fetch(`${API_BASE_URL}/generate-phrases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    inputLang,
                    targetLang
                }),
            });

            const data = await response.json();
            if (data.phrases) {
                setPhrasesInput(data.phrases);
            }
        } catch (error) {
            console.error('Error generating phrases:', error);
        } finally {
            setGeneratingPhrases(false);
        }
    };

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

            {/* AI Prompt Input */}
            <div className="mb-4">
                <label htmlFor="prompt" className="block font-medium mb-1">AI Prompt</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter a prompt to generate phrases..."
                        className="flex-1 p-2 border border-gray-300 rounded"
                    />
                    <button
                        onClick={handleGeneratePhrases}
                        disabled={generatingPhrases || !prompt.trim()}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                        {generatingPhrases ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : "Generate"}
                    </button>
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