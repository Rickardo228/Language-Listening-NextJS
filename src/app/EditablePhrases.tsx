import { Phrase } from './types';
import { useState } from 'react';

interface EditablePhrasesProps {
    phrases: Phrase[];
    setPhrases: (phrases: Phrase[]) => void;
    inputLanguage: string;
    outputLanguage: string;
}

export function EditablePhrases({ phrases, setPhrases, inputLanguage, outputLanguage }: EditablePhrasesProps) {
    const [inputLoading, setInputLoading] = useState<{ [key: number]: boolean }>({});
    const [outputLoading, setOutputLoading] = useState<{ [key: number]: boolean }>({});

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

    return (
        <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Edit Phrases</h3>
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
                    </div>
                </div>
            ))}
        </div>
    );
} 