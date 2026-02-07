import { ImportPhrasesDialog, ImportPhrasesDialogProps } from './ImportPhrasesDialog';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTour } from '@reactour/tour';
import { track } from '../lib/mixpanelClient';

export type ImportPhrasesProps = Omit<ImportPhrasesDialogProps, 'onClose' | 'isOpen'> & {
    className?: string;
};

export function ImportPhrases({
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
    phrasesInput,
    setPhrasesInput,
    loading,
    processProgress,
    onProcess,
    onAddToCollection,
    className = '',
}: ImportPhrasesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const tour = useTour();
    const buttonText = onProcess ? 'Create List' : 'Add Phrases';
    const buttonClassName = onProcess
        ? "px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        : "px-4 h-[50px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-md";

    return (
        <>
            <button
                onClick={() => {
                    if (tour.isOpen) track('Create List Tour CTA Clicked', { platform: 'desktop' });
                    tour.setIsOpen(false);
                    setIsOpen(true);
                }}
                className={`${buttonClassName} ${className}`}
                data-tour="create-list"
            >
                <div className="flex items-center gap-1.5 justify-center">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-semibold whitespace-nowrap">
                        {buttonText}
                    </span>
                </div>
            </button>
            <ImportPhrasesDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                inputLang={inputLang}
                setInputLang={setInputLang}
                targetLang={targetLang}
                setTargetLang={setTargetLang}
                phrasesInput={phrasesInput}
                setPhrasesInput={setPhrasesInput}
                loading={loading}
                processProgress={processProgress}
                onProcess={onProcess}
                onAddToCollection={onAddToCollection}
            />
        </>
    );
} 