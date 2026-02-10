import { Phrase, languageOptions } from './types';
import { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, MoreVertical, RefreshCw } from 'lucide-react';
import { Menu } from './Menu';
import { generateAudio } from './utils/audioUtils';
import { useProcessPhrases } from './hooks/useProcessPhrases';
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
    onInsertPhrase?: (index: number) => void;
}

function InsertionLine({ onInsert, readOnly }: { onInsert: () => void; readOnly?: boolean }) {
    const [isHovered, setIsHovered] = useState(false);

    if (readOnly) return <div className="h-4" />;

    return (
        <div
            className="relative h-4 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onInsert}
        >
            <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-150 ${isHovered ? 'bg-blue-500' : 'bg-transparent'}`} />
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold transition-all duration-150 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                +
            </div>
        </div>
    );
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
    inputLanguage?: string;
    outputLanguage?: string;
}

function PhraseComponent({ phrase, phrases, isSelected, currentPhase, onPhraseClick, onDelete, onPlayPhrase, ref, setPhrases, enableOutputBeforeInput, isMultiSelectMode, setIsMultiSelectMode, isChecked, onCheckChange, readOnly, inputLanguage, outputLanguage }: PhraseComponentProps & {
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
    const [showMenu, setShowMenu] = useState(false);

    const { processPhrases } = useProcessPhrases({
        inputLang: phrase.inputLang,
        targetLang: phrase.targetLang,
        inputVoice: phrase.inputVoice,
        targetVoice: phrase.targetVoice,
    });

    const getLanguageLabel = (code?: string, fallback?: string) => {
        if (!code && !fallback) return '';
        const label = languageOptions.find((lang) => lang.code === (code || fallback))?.label || code || fallback || '';
        return label.split(' (')[0];
    };

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

    const handleRegenerateOutput = async () => {
        if (!phrase.input) return;
        setOutputLoading(true);

        try {
            const inputVoice = phrase.inputVoice || `${phrase.inputLang}-Standard-D`;
            const targetVoice = phrase.targetVoice || `${phrase.targetLang}-Standard-D`;

            const result = await processPhrases([phrase.input], {
                inputLang: phrase.inputLang,
                targetLang: phrase.targetLang,
                inputVoice,
                targetVoice,
                skipAudio: false,
            });

            if (result && result[0]) {
                const processedPhrase = result[0];
                const newPhrases = [...phrases];
                const phraseIndex = phrases.indexOf(phrase);
                newPhrases[phraseIndex] = {
                    ...newPhrases[phraseIndex],
                    translated: processedPhrase.translated,
                    outputAudio: processedPhrase.outputAudio,
                    romanized: processedPhrase.romanized ?? newPhrases[phraseIndex].romanized
                };
                setPhrases(newPhrases);
                setPrevTranslated(processedPhrase.translated);
                if (processedPhrase.romanized !== undefined) {
                    setPrevRomanized(processedPhrase.romanized);
                }
            }
        } catch (error) {
            console.error('Error regenerating output:', error);
        } finally {
            setOutputLoading(false);
        }
    };

    const inputLanguageLabel = getLanguageLabel(inputLanguage, phrase.inputLang);
    const outputLanguageLabel = getLanguageLabel(outputLanguage, phrase.targetLang);
    const regenerateTooltip = `Regenerate ${outputLanguageLabel || 'output'} from ${inputLanguageLabel || 'input'}`;

    return (
        <div
            className={`group w-full transition-colors relative px-3 py-2.5 border-t border-b
                ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-100 dark:border-gray-800'}
                ${onPhraseClick ? 'cursor-pointer' : ''}
                ${isReadOnly ? 'mb-0' : ''}`}
            onClick={(e) => {
                if (!(e.target as HTMLElement).closest('input[type="checkbox"]') && !(e.target as HTMLElement).closest('button')) {
                    onPhraseClick?.();
                }
            }}
            ref={ref}
        >
            {/* Row 1: Input language */}
            <div className="flex items-center gap-2 mb-1.5">
                {isMultiSelectMode && !isReadOnly && (
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onCheckChange(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-400 flex-shrink-0"
                    />
                )}

                {/* Play input audio button */}
                {phrase.inputAudio && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayPhrase?.(phrases.indexOf(phrase), 'input');
                        }}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all flex-shrink-0"
                        title="Play input audio"
                    >
                        <Volume2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                )}
                {!phrase.inputAudio && <div className="w-[26px] flex-shrink-0" />}

                {/* Input field */}
                {isReadOnly ? (
                    <div className={`flex-1 text-sm ${isSelected && currentPhase === 'input' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {phrase.input || <span className="text-gray-400 dark:text-gray-500">-</span>}
                    </div>
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        onBlur={() => handleBlur('input')}
                        disabled={inputLoading}
                        placeholder={`Enter ${inputLanguageLabel || 'input'} text`}
                        className={`flex-1 bg-transparent text-sm
                            focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:px-2 focus:py-0.5 focus:rounded
                            focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 focus:text-gray-900 dark:focus:text-gray-100 transition-all
                            ${inputLoading ? 'opacity-50' : ''}
                            ${isSelected && currentPhase === 'input' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}
                    />
                )}

                {/* Regenerate button (only on first row) */}
                {!isReadOnly && !enableOutputBeforeInput && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateOutput();
                        }}
                        disabled={outputLoading || !phrase.input}
                        className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-all flex-shrink-0
                            ${outputLoading || !phrase.input ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={regenerateTooltip}
                    >
                        <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                )}

                {/* Menu button */}
                {!isReadOnly && (
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                            title="More options"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>

                        {showMenu && (
                            <>
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(false);
                                            setIsMultiSelectMode(true);
                                            onCheckChange(true);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                    >
                                        Select
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(false);
                                            onDelete();
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        Delete phrase
                                    </button>
                                </div>
                                <div
                                    className="fixed inset-0 z-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                    }}
                                />
                            </>
                        )}
                    </div>
                )}

                {inputLoading && <span className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">Processing...</span>}
            </div>

            {/* Row 2: Output language */}
            <div className="flex items-center gap-2 mb-1">
                {/* Play output audio button */}
                {phrase.outputAudio && !phrase.useRomanizedForAudio && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayPhrase?.(phrases.indexOf(phrase), 'output');
                        }}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all flex-shrink-0"
                        title="Play translated audio"
                    >
                        <Volume2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                )}
                {phrase.useRomanizedForAudio && !isReadOnly && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateOutputAudio();
                        }}
                        disabled={outputLoading}
                        className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all flex-shrink-0
                            ${outputLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Generate audio for translated text"
                    >
                        <Mic className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                )}
                {/* Placeholder for the above button to useRomanizedForAudio */}
                {!phrase.outputAudio && !phrase.useRomanizedForAudio && <div className="w-[24px] flex-shrink-0" />}

                {/* Output field */}
                {isReadOnly ? (
                    <div className={`flex-1 text-base ${isSelected && currentPhase === 'output' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {phrase.translated || <span className="text-gray-400 dark:text-gray-500">-</span>}
                    </div>
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        onBlur={() => handleBlur('translated')}
                        disabled={outputLoading}
                        placeholder={`Enter ${outputLanguageLabel || 'output'} text`}
                        className={`flex-1 bg-transparent text-base
                            focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:px-2 focus:py-0.5 focus:rounded
                            focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 focus:text-gray-800 dark:focus:text-gray-200 transition-all
                            ${outputLoading ? 'opacity-50' : ''}
                            ${isSelected && currentPhase === 'output' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}
                    />
                )}

                {/* Spacer to align with row 1 */}
                <div className={`${isReadOnly ? 'w-0' : 'w-[56px]'} flex-shrink-0`} />

                {outputLoading && <span className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">Processing...</span>}
            </div>

            {/* Row 3: Romanization (if present) */}
            {phrase.romanized && (
                <div className="flex items-center gap-2">
                    {/* Play romanized audio button */}
                    {phrase.outputAudio && phrase.useRomanizedForAudio && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlayPhrase?.(phrases.indexOf(phrase), 'output');
                            }}
                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all flex-shrink-0"
                            title="Play romanized audio"
                        >
                            <Volume2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}
                    {!phrase.useRomanizedForAudio && !isReadOnly && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateRomanizedAudio();
                            }}
                            disabled={romanizedLoading}
                            className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all flex-shrink-0
                                ${romanizedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Generate audio from romanized text"
                        >
                            <Mic className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}
                    {!phrase.outputAudio && phrase.useRomanizedForAudio && <div className="w-[26px] flex-shrink-0" />}
                    {!phrase.useRomanizedForAudio && isReadOnly && <div className="w-[26px] flex-shrink-0" />}

                    {/* Romanization field */}
                    {isReadOnly ? (
                        <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 italic">
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
                            onBlur={() => handleBlur('romanized')}
                            placeholder="Enter romanization"
                            className="flex-1 bg-transparent text-xs text-gray-500 dark:text-gray-400 italic
                                focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:px-2 focus:py-0.5 focus:rounded
                                focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 focus:text-gray-800 dark:focus:text-gray-200 transition-all"
                        />
                    )}

                    {/* Spacer to align with row 1 */}
                    <div className={`${isReadOnly ? 'w-0' : 'w-[56px]'} flex-shrink-0`} />

                    {romanizedLoading && <span className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">Processing...</span>}
                </div>
            )}
        </div>
    );
}

export function EditablePhrases({ phrases, setPhrases, inputLanguage, outputLanguage, currentPhraseIndex, currentPhase, onPhraseClick, onPlayPhrase, enableOutputBeforeInput, readOnly = false, onInsertPhrase }: EditablePhrasesProps) {
    const selectedPhraseRef = useRef<HTMLDivElement>(null!);
    const topRef = useRef<HTMLDivElement>(null!);
    const [isArrowVisible, setIsArrowVisible] = useState(false);
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
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

    useEffect(() => {
        if (!topRef.current) return;
        const element = topRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowScrollToTop(!entry.isIntersecting);
            },
            { root: null, threshold: 0 }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    const scrollToSelectedPhrase = () => {
        selectedPhraseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className='h-0 sticky top-[90%] z-[100]'>
                {isArrowVisible && scrollDirection && !isMultiSelectMode && (
                    <button
                        onClick={scrollToSelectedPhrase}
                        className={`w-10 ml-[10%] p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition`}
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
            <div ref={topRef} className="h-0" />
            {showScrollToTop && !isMultiSelectMode && (
                <div className="h-0 sticky top-[180px] z-50">
                    <button
                        onClick={scrollToTop}
                        className="ml-[10%] px-3 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition flex items-center gap-1 text-sm"
                        title="Scroll to top"
                    >
                        ↑ Scroll to top
                    </button>
                </div>
            )}
            {onInsertPhrase && (
                <InsertionLine onInsert={() => onInsertPhrase(0)} readOnly={readOnly} />
            )}
            {phrases.map((phrase, index) => {
                const isSelected = currentPhraseIndex === index;
                return (
                    <div key={index}>
                        <PhraseComponent
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
                            inputLanguage={inputLanguage}
                            outputLanguage={outputLanguage}
                            {...(isSelected && { ref: selectedPhraseRef })}
                        />
                        {onInsertPhrase && (
                            <InsertionLine onInsert={() => onInsertPhrase(index + 1)} readOnly={readOnly} />
                        )}
                    </div>
                );
            })}
            <div className="h-20"></div>
        </div>
    );
} 
