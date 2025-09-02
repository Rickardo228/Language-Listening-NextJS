import { ImportPhrasesDialog, ImportPhrasesDialogProps } from './ImportPhrasesDialog';
import { useState } from 'react';
import { Plus } from 'lucide-react';

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
    onProcess,
    onAddToCollection,
    className = ''
}: ImportPhrasesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonText = onProcess ? 'Create New List' : 'Add Phrases';
    const buttonClassName = onProcess
        ? "w-full px-4 h-[50px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-md"
        : "px-4 h-[50px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-md";

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`${buttonClassName} ${className}`}
            >
                <div className="flex items-center gap-2 justify-center">
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-semibold">
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
                onProcess={onProcess}
                onAddToCollection={onAddToCollection}
            />
        </>
    );
} 