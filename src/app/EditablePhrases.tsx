import { Phrase } from './types';
import { useState } from 'react';
import { SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { API_BASE_URL } from './consts';
// import { ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface EditablePhrasesProps {
    phrases: Phrase[];
    setPhrases: (phrases: Phrase[]) => void;
    inputLanguage: string;
    outputLanguage: string;
    currentPhraseIndex: number | null;
    onPhraseClick?: (index: number) => void;
}


async function generateAudio(text: string, language: string): Promise<{ audioUrl: string, duration: number }> {
    const response = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
        throw new Error('TTS request failed');
    }

    return response.json();
}

export function EditablePhrases({ phrases, setPhrases, currentPhraseIndex, onPhraseClick }: EditablePhrasesProps) {
    const [inputLoading, setInputLoading] = useState<{ [key: number]: boolean }>({});
    const [outputLoading, setOutputLoading] = useState<{ [key: number]: boolean }>({});
    const [romanizedLoading, setRomanizedLoading] = useState<{ [key: number]: boolean }>({});

    const handlePhraseChange = (index: number, field: keyof Phrase, value: string) => {
        const newPhrases = [...phrases];
        newPhrases[index] = { ...newPhrases[index], [field]: value };
        setPhrases(newPhrases);
    };

    const handleBlur = async (index: number, field: keyof Phrase) => {
        if (field !== 'input' && field !== 'translated' && field !== 'romanized') return;
        const phrase = phrases[index]
        const text = phrase[field];
        if (!text) return;

        // Determine if we should proceed with generating audio
        const shouldGenerateAudio =
            (field === 'input') ||
            (field === 'translated' && !phrase.useRomanizedForAudio) ||
            (field === 'romanized' && phrase.useRomanizedForAudio);

        if (!shouldGenerateAudio) return;

        const setLoadingState = field === 'input' ? setInputLoading : field === 'translated' ? setOutputLoading : setRomanizedLoading;
        setLoadingState(prev => ({ ...prev, [index]: true }));

        try {
            const { audioUrl, duration } = await generateAudio(
                text,
                field === 'input' ? phrase.inputLang : phrase.targetLang
            );

            const newPhrases = [...phrases];
            if (field === 'romanized' && phrase.useRomanizedForAudio) {
                newPhrases[index] = {
                    ...newPhrases[index],
                    outputAudio: { audioUrl, duration },
                    useRomanizedForAudio: true
                };
            } else {
                newPhrases[index] = {
                    ...newPhrases[index],
                    [field === 'input' ? 'inputAudio' : 'outputAudio']: { audioUrl, duration },
                    useRomanizedForAudio: false
                };
            }
            setPhrases(newPhrases);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setLoadingState(prev => ({ ...prev, [index]: false }));
        }
    };


    const handleGenerateRomanizedAudio = async (index: number) => {
        const phrase = phrases[index]
        const text = phrase.romanized;
        if (!text) return;

        setRomanizedLoading(prev => ({ ...prev, [index]: true }));

        try {
            const { audioUrl, duration } = await generateAudio(text, phrase.targetLang);

            const newPhrases = [...phrases];
            newPhrases[index] = {
                ...newPhrases[index],
                outputAudio: { audioUrl, duration },
                useRomanizedForAudio: true
            };
            setPhrases(newPhrases);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setRomanizedLoading(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleGenerateOutputAudio = async (index: number) => {
        const phrase = phrases[index]
        const text = phrase.translated;
        if (!text) return;

        setOutputLoading(prev => ({ ...prev, [index]: true }));

        try {
            const { audioUrl, duration } = await generateAudio(text, phrase.targetLang);

            const newPhrases = [...phrases];
            newPhrases[index] = {
                ...newPhrases[index],
                outputAudio: { audioUrl, duration },
                useRomanizedForAudio: false
            };
            setPhrases(newPhrases);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setOutputLoading(prev => ({ ...prev, [index]: false }));
        }
    };

    const PlayOutputAudioButton = (phrase: Phrase) => {
        return (
            phrase.outputAudio && (
                <button
                    onClick={() => new Audio(phrase.outputAudio?.audioUrl).play()}
                    className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 rounded"
                    title="Play translated audio"
                >
                    <SpeakerWaveIcon className="w-4 h-4" />
                </button>
            )
        )
    }

    // const handleCopyPhrases = async () => {
    //     try {
    //         await navigator.clipboard.writeText(JSON.stringify(phrases, null, 2));
    //     } catch (err) {
    //         console.error('Failed to copy phrases:', err);
    //         alert('Failed to copy phrases to clipboard');
    //     }
    // };

    // const handlePastePhrases = async () => {
    //     try {
    //         const text = await navigator.clipboard.readText();
    //         let pastedPhrases: Phrase[];

    //         try {
    //             pastedPhrases = JSON.parse(text);
    //         } catch {
    //             throw new Error('Invalid JSON format');
    //         }

    //         // Validate the structure of the pasted phrases
    //         if (!Array.isArray(pastedPhrases)) {
    //             throw new Error('Pasted content must be an array');
    //         }

    //         const isValidPhrase = (p: Phrase): p is Phrase => {
    //             return typeof p === 'object' && p !== null
    //                 && typeof p.input === 'string'
    //                 && typeof p.translated === 'string'
    //                 && typeof p.romanized === 'string';
    //         };

    //         if (!pastedPhrases.every(isValidPhrase)) {
    //             throw new Error('Invalid phrase structure');
    //         }

    //         setLoading(true);
    //         // Call the load endpoint to regenerate audio
    //         const response = await fetch(`${API_BASE_URL}/load`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //                 phrases: pastedPhrases,
    //             }),
    //         });

    //         if (!response.ok) {
    //             throw new Error('Failed to load phrases');
    //         }

    //         const data = await response.json();
    //         setPhrases(data.phrases);
    //     } catch (err) {
    //         console.error('Failed to paste phrases:', err);
    //         alert(`Failed to paste phrases: ${err instanceof Error ? err.message : 'Unknown error'}`);
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    return (
        <div className="mb-4">
            {/* <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={handleCopyPhrases}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        title="Copy phrases as JSON"
                    >
                        Copy
                    </button>
                    <button
                        onClick={handlePastePhrases}
                        disabled={loading}
                        className={`flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Paste phrases from JSON"
                    >
                        {loading ? 'Loading...' : 'Paste'}
                    </button>
                </div>
            </div> */}
            {phrases.map((phrase, index) => (
                <div
                    key={index}
                    className={`mb-4 border p-2 rounded ${currentPhraseIndex === index ? 'border-blue-500 bg-blue-50' : ''} 
                        ${onPhraseClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
                    onClick={() => onPhraseClick?.(index)}
                >
                    <div className="mb-2 flex items-center gap-2">
                        <label className="block font-medium mb-1">Input:</label>
                        <input
                            type="text"
                            value={phrase.input}
                            onChange={(e) => handlePhraseChange(index, 'input', e.target.value)}
                            onBlur={() => handleBlur(index, 'input')}
                            className={`w-full p-2 border border-gray-300 rounded ${inputLoading[index] ? 'opacity-50' : ''}`}
                            disabled={inputLoading[index]}
                        />
                        {phrase.inputAudio && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    new Audio(phrase.inputAudio?.audioUrl).play();
                                }}
                                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 rounded"
                                title="Play input audio"
                            >
                                <SpeakerWaveIcon className="w-4 h-4" />
                            </button>
                        )}
                        {inputLoading[index] && <span className="text-gray-500 text-sm">Processing...</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="block font-medium mb-1">Translated:</label>
                        <input
                            type="text"
                            value={phrase.translated}
                            onChange={(e) => handlePhraseChange(index, 'translated', e.target.value)}
                            onBlur={() => handleBlur(index, 'translated')}
                            className={`w-full p-2 border border-gray-300 rounded ${outputLoading[index] ? 'opacity-50' : ''}`}
                            disabled={outputLoading[index]}
                        />
                        {!phrase.useRomanizedForAudio && PlayOutputAudioButton(phrase)}
                        {phrase.useRomanizedForAudio && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateOutputAudio(index);
                                }}
                                disabled={outputLoading[index]}
                                className={`px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded ${outputLoading[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Generate audio for output"
                            >
                                <MicrophoneIcon className="w-4 h-4" />
                            </button>
                        )}
                        {outputLoading[index] && <span className="text-gray-500 text-sm">Processing...</span>}
                    </div>
                    {phrase.romanized && <div className="mt-2 mb-2 flex items-center gap-2">
                        <label className="block font-medium mb-1">Romanized:</label>
                        <input
                            type="text"
                            value={phrase.romanized}
                            onChange={(e) => handlePhraseChange(index, 'romanized', e.target.value)}
                            onBlur={() => handleBlur(index, 'romanized')}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        {phrase.useRomanizedForAudio && PlayOutputAudioButton(phrase)}
                        {!phrase.useRomanizedForAudio && <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateRomanizedAudio(index);
                            }}
                            disabled={romanizedLoading[index]}
                            className={`px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded ${romanizedLoading[index] ? 'opacity-50 cursor-not-allowed' : ''
                                } flex flex-row items-center`}
                            title="Generate audio from romanized text"
                        >
                            <MicrophoneIcon className="w-4 h-4" />
                        </button>}
                        {romanizedLoading[index] && <span className="text-gray-500 text-sm">Processing...</span>}

                    </div>}
                </div>
            ))}
        </div>
    );
} 