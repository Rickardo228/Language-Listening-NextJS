import { Phrase } from './types';
import { useState } from 'react';
// import { ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface EditablePhrasesProps {
    phrases: Phrase[];
    setPhrases: (phrases: Phrase[]) => void;
    inputLanguage: string;
    outputLanguage: string;
}

export function EditablePhrases({ phrases, setPhrases, inputLanguage, outputLanguage }: EditablePhrasesProps) {
    const [inputLoading, setInputLoading] = useState<{ [key: number]: boolean }>({});
    const [outputLoading, setOutputLoading] = useState<{ [key: number]: boolean }>({});
    const [romanizedLoading, setRomanizedLoading] = useState<{ [key: number]: boolean }>({});
    const [loading, setLoading] = useState(false);

    const handlePhraseChange = (index: number, field: keyof Phrase, value: string) => {
        const newPhrases = [...phrases];
        newPhrases[index] = { ...newPhrases[index], [field]: value };
        setPhrases(newPhrases);
    };

    const handleBlur = async (index: number, field: keyof Phrase) => {
        if (field !== 'input' && field !== 'translated') return;

        const text = phrases[index][field];
        if (!text) return;

        const setLoadingState = field === 'input' ? setInputLoading : setOutputLoading;
        setLoadingState(prev => ({ ...prev, [index]: true }));

        try {
            const response = await fetch('http://localhost:3000/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    language: field === 'translated' ? outputLanguage : inputLanguage,
                }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const { audioUrl, duration } = await response.json();

            const newPhrases = [...phrases];
            newPhrases[index] = {
                ...newPhrases[index],
                [field === 'input' ? 'inputAudio' : 'outputAudio']: { audioUrl, duration }
            };
            setPhrases(newPhrases);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setLoadingState(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleCopyPhrases = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(phrases, null, 2));
        } catch (err) {
            console.error('Failed to copy phrases:', err);
            alert('Failed to copy phrases to clipboard');
        }
    };

    const handlePastePhrases = async () => {
        try {
            const text = await navigator.clipboard.readText();
            let pastedPhrases: Phrase[];

            try {
                pastedPhrases = JSON.parse(text);
            } catch (err) {
                throw new Error('Invalid JSON format');
            }

            // Validate the structure of the pasted phrases
            if (!Array.isArray(pastedPhrases)) {
                throw new Error('Pasted content must be an array');
            }

            const isValidPhrase = (p: any): p is Phrase => {
                return typeof p === 'object' && p !== null
                    && typeof p.input === 'string'
                    && typeof p.translated === 'string'
                    && typeof p.romanized === 'string';
            };

            if (!pastedPhrases.every(isValidPhrase)) {
                throw new Error('Invalid phrase structure');
            }

            setLoading(true);
            // Call the load endpoint to regenerate audio
            const response = await fetch('http://localhost:3000/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phrases: pastedPhrases,
                    inputLang: inputLanguage,
                    targetLang: outputLanguage,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to load phrases');
            }

            const data = await response.json();
            setPhrases(data.phrases);
        } catch (err) {
            console.error('Failed to paste phrases:', err);
            alert(`Failed to paste phrases: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRomanizedAudio = async (index: number) => {
        const text = phrases[index].romanized;
        if (!text) return;

        setRomanizedLoading(prev => ({ ...prev, [index]: true }));

        try {
            const response = await fetch('http://localhost:3000/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    language: outputLanguage,
                }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const { audioUrl, duration } = await response.json();

            const newPhrases = [...phrases];
            newPhrases[index] = {
                ...newPhrases[index],
                outputAudio: { audioUrl, duration }
            };
            setPhrases(newPhrases);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setRomanizedLoading(prev => ({ ...prev, [index]: false }));
        }
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Phrases</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyPhrases}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        title="Copy phrases as JSON"
                    >
                        {/*  <ClipboardIcon className="w-4 h-4" /> */}
                        Copy
                    </button>
                    <button
                        onClick={handlePastePhrases}
                        disabled={loading}
                        className={`flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Paste phrases from JSON"
                    >
                        {/*  <ClipboardDocumentCheckIcon className="w-4 h-4" /> */}
                        {loading ? 'Loading...' : 'Paste'}
                    </button>
                </div>
            </div>
            {phrases.map((phrase, index) => (
                <div key={index} className="mb-4 border p-2 rounded">
                    <div className="mb-2 flex items-center gap-2">
                        <label className="block font-medium mb-1">Input:</label>
                        <input
                            type="text"
                            value={phrase.input}
                            onChange={(e) => handlePhraseChange(index, 'input', e.target.value)}
                            onBlur={() => handleBlur(index, 'input')}
                            className={`w-96 p-2 border border-gray-300 rounded ${inputLoading[index] ? 'opacity-50' : ''}`}
                            disabled={inputLoading[index]}
                        />
                        {inputLoading[index] && <span className="text-gray-500 text-sm">Processing...</span>}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        <label className="block font-medium mb-1">Translated:</label>
                        <input
                            type="text"
                            value={phrase.translated}
                            onChange={(e) => handlePhraseChange(index, 'translated', e.target.value)}
                            onBlur={() => handleBlur(index, 'translated')}
                            className={`w-96 p-2 border border-gray-300 rounded ${outputLoading[index] ? 'opacity-50' : ''}`}
                            disabled={outputLoading[index]}
                        />
                        {outputLoading[index] && <span className="text-gray-500 text-sm">Processing...</span>}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        <label className="block font-medium mb-1">Romanized:</label>
                        <input
                            type="text"
                            value={phrase.romanized}
                            onChange={(e) => handlePhraseChange(index, 'romanized', e.target.value)}
                            className="w-96 p-2 border border-gray-300 rounded"
                        />
                        <button
                            onClick={() => handleGenerateRomanizedAudio(index)}
                            disabled={romanizedLoading[index]}
                            className={`px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded ${romanizedLoading[index] ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            title="Generate audio from romanized text"
                        >
                            {romanizedLoading[index] ? 'Processing...' : 'Generate Audio'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
} 