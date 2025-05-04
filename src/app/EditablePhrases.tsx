import { Phrase } from './types';
import { useState, useEffect, useRef } from 'react';
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
    scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
    isMobile?: boolean;
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

export function EditablePhrases({ phrases, setPhrases, currentPhraseIndex, onPhraseClick, scrollContainerRef, isMobile = false }: EditablePhrasesProps) {
    const [inputLoading, setInputLoading] = useState<{ [key: number]: boolean }>({});
    const [outputLoading, setOutputLoading] = useState<{ [key: number]: boolean }>({});
    const [romanizedLoading, setRomanizedLoading] = useState<{ [key: number]: boolean }>({});
    const [autoScroll, setAutoScroll] = useState(true);
    const phraseRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize refs array when phrases change
    useEffect(() => {
        phraseRefs.current = phrases.map(() => null);
    }, [phrases]);

    // Handle scrolling when currentPhraseIndex changes
    useEffect(() => {
        if (!autoScroll || currentPhraseIndex === null || currentPhraseIndex < 0) return;

        const currentPhrase = phraseRefs.current[currentPhraseIndex];
        if (!currentPhrase) return;

        const container = scrollContainerRef?.current;
        if (!container) return;

        const scrollMargin = isMobile ? 320 : 0; // Adjust based on mobile/desktop

        // Get the container's scroll position
        const containerScrollTop = container.scrollTop;

        // Get the phrase's position relative to the container
        const phraseTop = currentPhrase.offsetTop;

        // Calculate the target scroll position
        const targetScrollTop = phraseTop - scrollMargin;

        // Only scroll if the phrase is not already visible
        if (targetScrollTop < containerScrollTop || targetScrollTop > containerScrollTop + container.clientHeight) {
            container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }, [currentPhraseIndex, autoScroll, scrollContainerRef, isMobile]);

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
                    className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors"
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
            <div className="flex items-center gap-2 mb-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                    />
                    Auto-scroll to active phrase
                </label>
            </div>
            {phrases.map((phrase, index) => (
                <div
                    key={index}
                    ref={(el) => {
                        phraseRefs.current[index] = el;
                    }}
                    className={`mb-4 border p-2 rounded transition-colors
                        ${currentPhraseIndex === index
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                            : 'border-gray-200 dark:border-gray-700'} 
                        ${onPhraseClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500' : ''}`}
                    onClick={() => onPhraseClick?.(index)}
                >
                    <div className="mb-2 flex items-center gap-2">
                        {/* <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Input:</label> */}
                        <input
                            type="text"
                            value={phrase.input}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handlePhraseChange(index, 'input', e.target.value)}
                            onBlur={() => handleBlur(index, 'input')}
                            className={`w-full p-2 border rounded bg-white dark:bg-gray-800 
                                border-gray-300 dark:border-gray-600 
                                text-gray-900 dark:text-gray-100
                                ${inputLoading[index] ? 'opacity-50' : ''}`}
                            disabled={inputLoading[index]}
                        />
                        {phrase.inputAudio && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    new Audio(phrase.inputAudio?.audioUrl).play();
                                }}
                                className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors"
                                title="Play input audio"
                            >
                                <SpeakerWaveIcon className="w-4 h-4" />
                            </button>
                        )}
                        {inputLoading[index] && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Translated:</label> */}
                        <input
                            type="text"
                            value={phrase.translated}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handlePhraseChange(index, 'translated', e.target.value)}
                            onBlur={() => handleBlur(index, 'translated')}
                            className={`w-full p-2 border rounded bg-white dark:bg-gray-800 
                                border-gray-300 dark:border-gray-600 
                                text-gray-900 dark:text-gray-100
                                ${outputLoading[index] ? 'opacity-50' : ''}`}
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
                                className={`px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors ${outputLoading[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Generate audio for output"
                            >
                                <MicrophoneIcon className="w-4 h-4" />
                            </button>
                        )}
                        {outputLoading[index] && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
                    </div>
                    {phrase.romanized && <div className="mt-2 mb-2 flex items-center gap-2">
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Romanized:</label>
                        <input
                            type="text"
                            value={phrase.romanized}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handlePhraseChange(index, 'romanized', e.target.value)}
                            onBlur={() => handleBlur(index, 'romanized')}
                            className="w-full p-2 border rounded bg-white dark:bg-gray-800 
                                border-gray-300 dark:border-gray-600 
                                text-gray-900 dark:text-gray-100"
                        />
                        {phrase.useRomanizedForAudio && PlayOutputAudioButton(phrase)}
                        {!phrase.useRomanizedForAudio && <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateRomanizedAudio(index);
                            }}
                            disabled={romanizedLoading[index]}
                            className={`px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors ${romanizedLoading[index] ? 'opacity-50 cursor-not-allowed' : ''} flex flex-row items-center`}
                            title="Generate audio from romanized text"
                        >
                            <MicrophoneIcon className="w-4 h-4" />
                        </button>}
                        {romanizedLoading[index] && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
                    </div>}
                </div>
            ))}
        </div>
    );
} 