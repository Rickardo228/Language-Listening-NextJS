import { Phrase } from './types';
import { useState, useEffect, useRef } from 'react';
import { SpeakerWaveIcon, MicrophoneIcon, EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Menu } from './Menu';
import { generateAudio } from './utils/audioUtils';
// import { ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface EditablePhrasesProps {
    phrases: Phrase[];
    setPhrases: (phrases: Phrase[]) => void;
    inputLanguage: string;
    outputLanguage: string;
    currentPhraseIndex: number | null;
    currentPhase: 'input' | 'output';
    onPhraseClick?: (index: number) => void;
    onPlayPhrase?: (index: number, phase: 'input' | 'output') => void;
    enableOutputBeforeInput?: boolean;
    readOnly?: boolean;
}


interface PhraseComponentProps {
    phrase: Phrase;
    phrases: Phrase[];
    isSelected: boolean;
    currentPhase: 'input' | 'output';
    onPhraseClick?: () => void;
    onDelete: () => void;
    onPlayPhrase?: (index: number, phase: 'input' | 'output') => void;
    ref?: React.RefObject<HTMLDivElement>;
    readOnly?: boolean;
}

function PhraseComponent({ phrase, phrases, isSelected, currentPhase, onPhraseClick, onDelete, onPlayPhrase, ref, setPhrases, enableOutputBeforeInput, isMultiSelectMode, setIsMultiSelectMode, isChecked, onCheckChange, readOnly }: PhraseComponentProps & {
    setPhrases: (phrases: Phrase[]) => void,
    enableOutputBeforeInput?: boolean,
    isMultiSelectMode: boolean,
    setIsMultiSelectMode: (isMultiSelectMode: boolean) => void,
    isChecked: boolean,
    onCheckChange: (checked: boolean) => void
}) {
    const isReadOnly = !!readOnly;
    const [inputLoading, setInputLoading] = useState(false);
    const [outputLoading, setOutputLoading] = useState(false);
    const [romanizedLoading, setRomanizedLoading] = useState(false);
    const [prevInput, setPrevInput] = useState(phrase.input);
    const [prevTranslated, setPrevTranslated] = useState(phrase.translated);
    const [prevRomanized, setPrevRomanized] = useState(phrase.romanized);

    const handleBlur = async (field: keyof Phrase) => {
        if (field !== 'input' && field !== 'translated' && field !== 'romanized') return;
        const text = phrase[field];
        if (!text) return;

        const hasChanged = (field === 'input' && text !== prevInput) ||
            (field === 'translated' && text !== prevTranslated) ||
            (field === 'romanized' && text !== prevRomanized);

        if (!hasChanged) return;

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
                field === 'input' ? phrase.inputLang : phrase.targetLang,
                field === 'input' ? phrase.inputVoice || '' : phrase.targetVoice || ''
            );

            const newPhrases = [...phrases];
            newPhrases[phrases.indexOf(phrase)] = {
                ...newPhrases[phrases.indexOf(phrase)],
                [field === 'input' ? 'inputAudio' : 'outputAudio']: { audioUrl, duration },
                useRomanizedForAudio: field === 'romanized' && phrase.useRomanizedForAudio
            };
            setPhrases(newPhrases);

            if (field === 'input') setPrevInput(text);
            if (field === 'translated') setPrevTranslated(text);
            if (field === 'romanized') setPrevRomanized(text);
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
            const { audioUrl, duration } = await generateAudio(text, phrase.targetLang, phrase.targetVoice || '');
            const newPhrases = [...phrases];
            newPhrases[phrases.indexOf(phrase)] = {
                ...newPhrases[phrases.indexOf(phrase)],
                outputAudio: { audioUrl, duration },
                useRomanizedForAudio: true
            };
            setPhrases(newPhrases);
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
            const { audioUrl, duration } = await generateAudio(text, phrase.targetLang, phrase.targetVoice || '');
            const newPhrases = [...phrases];
            newPhrases[phrases.indexOf(phrase)] = {
                ...newPhrases[phrases.indexOf(phrase)],
                outputAudio: { audioUrl, duration },
                useRomanizedForAudio: false
            };
            setPhrases(newPhrases);
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
    const menuButton = isReadOnly ? (
        <div className="w-8 px-4" />
    ) : (
        <Menu
            trigger={
                <button
                    className="px-2 py-1 text-sm hover:bg-secondary rounded text-gray-700 dark:text-white transition-colors w-8"
                    title="More options"
                >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
            }
            items={[
                {
                    label: 'Select',
                    onClick: (e) => {
                        e.stopPropagation();
                        setIsMultiSelectMode(true);
                        onCheckChange(true);
                    },
                    className: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                },
                {
                    label: 'Delete phrase',
                    onClick: onDelete,
                    className: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                }
            ]}
        />
    )

    const readOnlyFieldClasses = 'bg-slate-50 border-slate-200 shadow-inner dark:bg-slate-900/40 dark:border-slate-700';
    const editableFieldClasses = 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    const focusClasses = isReadOnly ? 'focus:ring-0 focus:border-slate-300 dark:focus:border-slate-600' : '';
    const textClasses = isReadOnly ? 'text-slate-700 dark:text-slate-200' : 'text-gray-900 dark:text-gray-100';

    const renderInputs = () => {
        const readOnlyField = (value: string) => (
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full p-2 border rounded 
                    ${readOnlyFieldClasses}
                    ${textClasses} ${focusClasses}`}
            >
                {value || <span className="text-slate-400 dark:text-slate-500">-</span>}
            </div>
        );

        const inputField = (
            <div className="flex items-center gap-2">
                {isMultiSelectMode && !isReadOnly && (
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onCheckChange(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                )}
                {isReadOnly ? (
                    readOnlyField(phrase.input)
                ) : (
                    <input
                        type="text"
                        value={phrase.input}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            const newPhrases = [...phrases];
                            newPhrases[phrases.indexOf(phrase)] = { ...newPhrases[phrases.indexOf(phrase)], input: e.target.value };
                            setPhrases(newPhrases);
                        }}
                        onBlur={() => {
                            handleBlur('input');
                        }}
                        className={`w-full p-2 border rounded 
                            ${editableFieldClasses}
                            ${isSelected && currentPhase === 'input'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                : ''}
                            ${textClasses}
                            ${inputLoading ? 'opacity-50' : ''} ${focusClasses}`}
                        disabled={inputLoading}
                    />
                )}
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
                {!enableOutputBeforeInput ? menuButton : <div className="w-8 px-4"></div>}
                {inputLoading && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
            </div>
        );

        const outputField = (
            <div className="flex items-center gap-2">
                {isReadOnly ? (
                    readOnlyField(phrase.translated)
                ) : (
                    <input
                        type="text"
                        value={phrase.translated}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            const newPhrases = [...phrases];
                            newPhrases[phrases.indexOf(phrase)] = { ...newPhrases[phrases.indexOf(phrase)], translated: e.target.value };
                            setPhrases(newPhrases);
                        }}
                        onBlur={() => {
                            handleBlur('translated');
                        }}
                        className={`w-full p-2 border rounded 
                            ${editableFieldClasses}
                            ${isSelected && currentPhase === 'output'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                : ''}
                            ${textClasses}
                            ${outputLoading ? 'opacity-50' : ''} ${focusClasses}`}
                        disabled={outputLoading}
                    />
                )}
                {!phrase.useRomanizedForAudio && <PlayOutputAudioButton />}
                {phrase.useRomanizedForAudio && !isReadOnly && (
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
                {enableOutputBeforeInput ? menuButton : <div className="w-8 px-4"></div>}
                {outputLoading && <span className="text-gray-500 dark:text-gray-400 text-sm">Processing...</span>}
            </div>
        );

        return enableOutputBeforeInput ? (
            <>
                {outputField}
                {inputField}
            </>
        ) : (
            <>
                {inputField}
                {outputField}
            </>
        );
    };

    return (
        <div
            className={`mb-4 border p-2 rounded transition-colors flex flex-col gap-2
                ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-background hover:bg-secondary dark:hover:bg-blue-900/20'} 
                ${onPhraseClick ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
                if (!(e.target as HTMLElement).closest('input[type="checkbox"]')) {
                    onPhraseClick?.();
                }
            }}
            ref={ref}
        >
            {renderInputs()}
            {phrase.romanized && <div className="mt-2 mb-2 flex items-center gap-2">
                <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Romanized:</label>
                {isReadOnly ? (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full p-2 border rounded 
                            ${readOnlyFieldClasses}
                            ${textClasses} ${focusClasses}`}
                    >
                        {phrase.romanized}
                    </div>
                ) : (
                    <input
                        type="text"
                        value={phrase.romanized}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            const newPhrases = [...phrases];
                            newPhrases[phrases.indexOf(phrase)] = { ...newPhrases[phrases.indexOf(phrase)], romanized: e.target.value };
                            setPhrases(newPhrases);
                        }}
                        onBlur={() => {
                            handleBlur('romanized');
                        }}
                        className={`w-full p-2 border rounded 
                            ${editableFieldClasses}
                            ${textClasses} ${focusClasses}`}
                    />
                )}
                {phrase.useRomanizedForAudio && <PlayOutputAudioButton />}
                {!phrase.useRomanizedForAudio && !isReadOnly && <button
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

export function EditablePhrases({ phrases, setPhrases, currentPhraseIndex, currentPhase, onPhraseClick, onPlayPhrase, enableOutputBeforeInput, readOnly = false }: EditablePhrasesProps) {
    const selectedPhraseRef = useRef<HTMLDivElement>(null!);
    const [isArrowVisible, setIsArrowVisible] = useState(false);
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedPhrases, setSelectedPhrases] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!selectedPhraseRef.current) return;
        const element = selectedPhraseRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsArrowVisible(!entry.isIntersecting);
                setScrollDirection(entry.boundingClientRect.top > 0 ? 'down' : 'up');
            },
            { root: null, threshold: 0.6 }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [currentPhraseIndex]);

    const scrollToSelectedPhrase = () => {
        selectedPhraseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    const handleDeletePhrase = (index: number) => {
        const newPhrases = [...phrases];
        newPhrases.splice(index, 1);
        setPhrases(newPhrases);
    };

    const handleDeleteSelected = () => {
        if (!window.confirm(`Delete ${selectedPhrases.size} selected phrases?`)) return;

        const newPhrases = phrases.filter((_, index) => !selectedPhrases.has(index));
        setPhrases(newPhrases);
        setSelectedPhrases(new Set());
        setIsMultiSelectMode(false);
    };

    const handlePhraseClick = (index: number) => {
        if (isMultiSelectMode) {
            setSelectedPhrases(prev => {
                const next = new Set(prev);
                if (next.has(index)) {
                    next.delete(index);
                } else {
                    next.add(index);
                }
                return next;
            });
        } else {
            onPhraseClick?.(index);
        }
    };

    const handleCheckChange = (index: number, checked: boolean) => {
        setSelectedPhrases(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(index);
            } else {
                next.delete(index);
            }
            // If no phrases are selected after this change, turn off multi-select mode
            if (next.size === 0) {
                setIsMultiSelectMode(false);
            }
            return next;
        });
    };

    return (
        <div className="mb-4">
            <div className='h-0 sticky top-[90%]'>
                {isArrowVisible && scrollDirection && !isMultiSelectMode && (
                    <button
                        onClick={scrollToSelectedPhrase}
                        className={`w-10 z-50 ml-[10%] p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition`}
                        title={`Scroll ${scrollDirection === 'up' ? 'up' : 'down'} to selected phrase`}
                    >
                        {scrollDirection === 'up' ? '↑' : '↓'}
                    </button>

                )}
                {isMultiSelectMode && selectedPhrases.size > 0 && !readOnly && (
                    <div className="flex justify-between items-between mb-4 p-3  bg-background w-[100%]">

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {selectedPhrases.size} selected
                            </span>
                            <button
                                onClick={handleDeleteSelected}
                                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded flex items-center gap-1"
                            >
                                                                Delete Selected
                            </button>
                            <button
                                onClick={() => {
                                    setIsMultiSelectMode(false);
                                    setSelectedPhrases(new Set());
                                }}
                                className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center gap-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {phrases.map((phrase, index) => {
                const isSelected = currentPhraseIndex === index;
                return (
                    <PhraseComponent
                        key={index}
                        phrase={phrase}
                        phrases={phrases}
                        isSelected={isSelected}
                        currentPhase={currentPhase}
                        onPhraseClick={() => handlePhraseClick(index)}
                        onDelete={() => handleDeletePhrase(index)}
                        onPlayPhrase={onPlayPhrase}
                        setPhrases={setPhrases}
                        enableOutputBeforeInput={enableOutputBeforeInput}
                        isMultiSelectMode={isMultiSelectMode}
                        setIsMultiSelectMode={setIsMultiSelectMode}
                        isChecked={selectedPhrases.has(index)}
                        onCheckChange={(checked) => handleCheckChange(index, checked)}
                        readOnly={readOnly}
                        {...(isSelected && { ref: selectedPhraseRef })}
                    />
                );
            })}
            <div className="h-20"></div>
        </div>
    );
} 
