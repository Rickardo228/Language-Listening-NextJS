import { Phrase } from './types';
import { useState, useRef } from 'react';
import { SpeakerWaveIcon, MicrophoneIcon, EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { API_BASE_URL } from './consts';
import { Menu } from './Menu';
// import { ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface EditablePhrasesProps {
    phrases: Phrase[];
    setPhrases: (phrases: Phrase[]) => void;
    inputLanguage: string;
    outputLanguage: string;
    currentPhraseIndex: number | null;
    onPhraseClick?: (index: number) => void;
    onPlayPhrase?: (index: number, phase: 'input' | 'output') => void;
}

type PhraseValue = string | { audioUrl: string; duration: number } | boolean;

interface PhraseComponentProps {
    phrase: Phrase;
    phrases: Phrase[];
    isSelected: boolean;
    onPhraseClick?: () => void;
    onPhraseChange: (field: keyof Phrase, value: PhraseValue) => void;
    onDelete: () => void;
    onPlayPhrase?: (index: number, phase: 'input' | 'output') => void;
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

function PhraseComponent({ phrase, phrases, isSelected, onPhraseClick, onPhraseChange, onDelete, onPlayPhrase }: PhraseComponentProps) {
    const [inputLoading, setInputLoading] = useState(false);
    const [outputLoading, setOutputLoading] = useState(false);
    const [romanizedLoading, setRomanizedLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);

    const handleBlur = async (field: keyof Phrase) => {
        if (field !== 'input' && field !== 'translated' && field !== 'romanized') return;
        const text = phrase[field];
        if (!text) return;

        // Determine if we should proceed with generating audio
        const shouldGenerateAudio =
            (field === 'input') ||
            (field === 'translated' && !phrase.useRomanizedForAudio) ||
            (field === 'romanized' && phrase.useRomanizedForAudio);

        if (!shouldGenerateAudio) return;

        const setLoadingState = field === 'input' ? setInputLoading : field === 'translated' ? setOutputLoading : setRomanizedLoading;
        setLoadingState(true);

        try {
            const { audioUrl, duration } = await generateAudio(
                text,
                field === 'input' ? phrase.inputLang : phrase.targetLang
            );

            if (field === 'romanized' && phrase.useRomanizedForAudio) {
                onPhraseChange('outputAudio', { audioUrl, duration });
                onPhraseChange('useRomanizedForAudio', true);
            } else {
                onPhraseChange(field === 'input' ? 'inputAudio' : 'outputAudio', { audioUrl, duration });
                onPhraseChange('useRomanizedForAudio', false);
            }
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setLoadingState(false);
        }
    };

    const handleGenerateRomanizedAudio = async () => {
        const text = phrase.romanized;
        if (!text) return;

        setRomanizedLoading(true);

        try {
            const { audioUrl, duration } = await generateAudio(text, phrase.targetLang);
            onPhraseChange('outputAudio', { audioUrl, duration });
            onPhraseChange('useRomanizedForAudio', true);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setRomanizedLoading(false);
        }
    };

    const handleGenerateOutputAudio = async () => {
        const text = phrase.translated;
        if (!text) return;

        setOutputLoading(true);

        try {
            const { audioUrl, duration } = await generateAudio(text, phrase.targetLang);
            onPhraseChange('outputAudio', { audioUrl, duration });
            onPhraseChange('useRomanizedForAudio', false);
        } catch (error) {
            console.error('Error generating TTS:', error);
        } finally {
            setOutputLoading(false);
        }
    };

    const PlayOutputAudioButton = () => {
        return (
            phrase.outputAudio && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlayPhrase?.(phrases.indexOf(phrase), phrase.useRomanizedForAudio ? 'output' : 'output');
                    }}
                    className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors"
                    title="Play translated audio"
                >
                    <SpeakerWaveIcon className="w-4 h-4" />
                </button>
            )
        )
    }

    return (
        <div
            className={`mb-4 border p-2 rounded transition-colors 
                ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700'} 
                ${onPhraseClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500' : ''}`}
            onClick={onPhraseClick}
        >
            <div className="mb-2 flex items-center gap-2">
                <input
                    type="text"
                    value={phrase.input}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onPhraseChange('input', e.target.value)}
                    onBlur={() => handleBlur('input')}
                    className={`w-full p-2 border rounded bg-white dark:bg-gray-800 
                        border-gray-300 dark:border-gray-600 
                        text-gray-900 dark:text-gray-100
                        ${inputLoading ? 'opacity-50' : ''}`}
                    disabled={inputLoading}
                />
                {phrase.inputAudio && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayPhrase?.(phrases.indexOf(phrase), 'input');
                        }}
                        className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors"
                        title="Play input audio"
                    >
                        <SpeakerWaveIcon className="w-4 h-4" />
                    </button>
                )}
                <button
                    ref={menuTriggerRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-white transition-colors"
                    title="More options"
                >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
                {inputLoading && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
            </div>
            <Menu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                triggerRef={menuTriggerRef}
                items={[
                    {
                        label: 'Delete phrase',
                        onClick: onDelete,
                        className: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    }
                ]}
            />
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={phrase.translated}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onPhraseChange('translated', e.target.value)}
                    onBlur={() => handleBlur('translated')}
                    className={`w-full p-2 border rounded bg-white dark:bg-gray-800 
                        border-gray-300 dark:border-gray-600 
                        text-gray-900 dark:text-gray-100
                        ${outputLoading ? 'opacity-50' : ''}`}
                    disabled={outputLoading}
                />
                {!phrase.useRomanizedForAudio && <PlayOutputAudioButton />}
                {phrase.useRomanizedForAudio && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateOutputAudio();
                        }}
                        disabled={outputLoading}
                        className={`px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors ${outputLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Generate audio for output"
                    >
                        <MicrophoneIcon className="w-4 h-4" />
                    </button>
                )}
                {outputLoading && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
            </div>
            {phrase.romanized && <div className="mt-2 mb-2 flex items-center gap-2">
                <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Romanized:</label>
                <input
                    type="text"
                    value={phrase.romanized}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onPhraseChange('romanized', e.target.value)}
                    onBlur={() => handleBlur('romanized')}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 
                        border-gray-300 dark:border-gray-600 
                        text-gray-900 dark:text-gray-100"
                />
                {phrase.useRomanizedForAudio && <PlayOutputAudioButton />}
                {!phrase.useRomanizedForAudio && <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateRomanizedAudio();
                    }}
                    disabled={romanizedLoading}
                    className={`px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded text-indigo-700 dark:text-white transition-colors ${romanizedLoading ? 'opacity-50 cursor-not-allowed' : ''} flex flex-row items-center`}
                    title="Generate audio from romanized text"
                >
                    <MicrophoneIcon className="w-4 h-4" />
                </button>}
                {romanizedLoading && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
            </div>}
        </div>
    );
}

export function EditablePhrases({ phrases, setPhrases, currentPhraseIndex, onPhraseClick, onPlayPhrase }: EditablePhrasesProps) {
    const handlePhraseChange = (index: number, field: keyof Phrase, value: PhraseValue) => {
        const newPhrases = [...phrases];
        newPhrases[index] = { ...newPhrases[index], [field]: value };
        setPhrases(newPhrases);
    };

    const handleDeletePhrase = (index: number) => {
        const newPhrases = [...phrases];
        newPhrases.splice(index, 1);
        setPhrases(newPhrases);
    };

    return (
        <div className="mb-4">
            {phrases.map((phrase, index) => (
                <PhraseComponent
                    key={index}
                    phrase={phrase}
                    phrases={phrases}
                    isSelected={currentPhraseIndex === index}
                    onPhraseClick={() => onPhraseClick?.(index)}
                    onPhraseChange={(field, value) => handlePhraseChange(index, field, value)}
                    onDelete={() => handleDeletePhrase(index)}
                    onPlayPhrase={onPlayPhrase}
                />
            ))}
        </div>
    );
} 