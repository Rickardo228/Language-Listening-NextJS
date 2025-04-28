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
    onProcess?: (prompt?: string) => void;
    onAddToCollection?: () => void;
    hasSelectedCollection: boolean;
}

type ButtonConfig = {
    onClick: () => void;
    text: string;
    className: string;
    disabled: boolean;
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
            className: "px-4 py-2 text-lg bg-blue-400 text-white rounded hover:bg-blue-500 flex items-center justify-center",
            // disabled: !phrasesInput
        },
        hasCreateNew && {
            onClick: async () => {
                if (phrasesInput.length) { await onProcess!(prompt); setPrompt('') }
                else {
                    alert(onAddToCollection ? "Enter phrases to add to this collection" : "Enter phrases to start a collection")
                }
            },
            text: "Translate & Create Collection",
            className: "px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center",
            // disabled: !phrasesInput
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
                <label htmlFor="prompt" className="block font-medium mb-1">{onAddToCollection ? 'Ask for suggestions...' : 'Title'}</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={onAddToCollection ? 'Prompt for suggestions...' : "Enter a title for your collection..."}
                        className="flex-1 p-2 border border-gray-300 rounded text-lg"
                    />
                    {prompt.trim() && <button
                        onClick={handleGeneratePhrases}
                        disabled={generatingPhrases || !prompt.trim()}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                        {generatingPhrases ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                </svg>
                                Suggestions
                            </div>
                        )}
                    </button>}
                </div>
            </div>

            {/* Textarea for initial phrases */}
            <textarea
                placeholder="Enter Phrases. One per line:"
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
                        disabled={loading || button.disabled}
                        className={`disabled:bg-gray-400 ${button.className}`}
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