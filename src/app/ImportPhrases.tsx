import { ImportPhrasesDialog } from './ImportPhrasesDialog';
import { useState } from 'react';

export interface ImportPhrasesProps {
    inputLang: string;
    setInputLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    phrasesInput: string;
    setPhrasesInput: (input: string) => void;
    loading: boolean;
    onProcess?: () => void;
    onAddToCollection?: () => void;
    className?: string;
}

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
    const buttonText = onProcess ? 'Create New Collection' : 'Add Phrases';
    const buttonClassName = onProcess
        ? "w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        : "bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90";

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`${buttonClassName} ${className}`}
            >
                {buttonText}
            </button>
            {isOpen && <ImportPhrasesDialog
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
            />}
        </>
    );
} 