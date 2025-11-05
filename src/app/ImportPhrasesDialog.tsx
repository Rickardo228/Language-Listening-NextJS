'use client'

import { useState } from 'react'
import { languageOptions, CollectionType } from './types'
import { X, Plus } from 'lucide-react'
import { API_BASE_URL } from './consts'
import { Dialog } from '@headlessui/react'
import { LanguageSelector } from './components/LanguageSelector'
import { trackGeneratePhrases } from '../lib/mixpanelClient'

export interface ImportPhrasesDialogProps {
    isOpen: boolean
    onClose: () => void
    inputLang: string
    setInputLang: (lang: string) => void
    targetLang: string
    setTargetLang: (lang: string) => void
    phrasesInput: string
    setPhrasesInput: (input: string) => void
    loading: boolean
    onProcess?: (prompt?: string, inputLang?: string, targetLang?: string, collectionType?: CollectionType) => Promise<void>
    onAddToCollection?: (inputLang?: string, targetLang?: string, isSwapped?: boolean) => Promise<void>
}

export function ImportPhrasesDialog({
    isOpen,
    onClose,
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
    phrasesInput,
    setPhrasesInput,
    loading,
    onProcess,
    onAddToCollection,
}: ImportPhrasesDialogProps) {
    const [prompt, setPrompt] = useState('')
    const [generatingPhrases, setGeneratingPhrases] = useState(false)
    const [collectionType, setCollectionType] = useState<CollectionType>('phrases')
    const [isSwapped, setIsSwapped] = useState(false)
    const [isFetchingUrl, setIsFetchingUrl] = useState(false)
    const inputLangLabel = (languageOptions.find(lang => lang.code === (isSwapped ? targetLang : inputLang))?.label || inputLang).split(' (')[0];

    const handleGeneratePhrases = async () => {
        if (!prompt.trim()) return;

        // Detect if prompt is a URL
        const urlRegex = /^https?:\/\/.+/i;
        const isUrl = urlRegex.test(prompt.trim());

        setGeneratingPhrases(true);
        setIsFetchingUrl(isUrl);

        try {
            // If languages are swapped, we need to swap them for generation
            const processInputLang = isSwapped ? targetLang : inputLang;
            const processTargetLang = isSwapped ? inputLang : targetLang;

            // Choose endpoint based on whether it's a URL
            const endpoint = isUrl ? '/fetch-url-content' : '/generate-phrases';
            const bodyData = isUrl ? {
                url: prompt.trim(),
                inputLang: isSwapped ? targetLang : inputLang,
                targetLang: isSwapped ? inputLang : targetLang,
                type: collectionType
            } : {
                prompt,
                inputLang: isSwapped ? targetLang : inputLang,
                targetLang: isSwapped ? inputLang : targetLang,
                type: collectionType
            };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error response
                throw new Error(data.error || 'Failed to fetch content');
            }

            if (data.phrases) {
                setPhrasesInput(data.phrases);

                // Track phrase generation event
                const phraseCount = data.phrases.split('\n').filter((line: string) => line.trim()).length;
                trackGeneratePhrases(
                    isUrl ? `URL: ${prompt}` : prompt,
                    processInputLang,
                    processTargetLang,
                    collectionType,
                    phraseCount
                );
            }
        } catch (error) {
            console.error('Error generating phrases:', error);
            // Show error to user
            alert(error instanceof Error ? error.message : 'Failed to generate phrases. Please try again.');
        } finally {
            setGeneratingPhrases(false);
            setIsFetchingUrl(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="bg-background text-foreground p-4 rounded-lg shadow-lg w-[500px] max-w-[90vw] overflow-auto max-h-[90vh] border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            {onAddToCollection ? 'Add Phrases' : 'Create New List'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground"
                            title="Close"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-4">
                            {!onAddToCollection && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">List Name</label>
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="text"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="w-full p-2 rounded-md border bg-background"
                                            placeholder="Enter a name or paste a URL (YouTube/website)..."
                                            disabled={loading}
                                            autoFocus={Boolean(onProcess)}
                                        />

                                    </div>
                                </div>
                            )}
                            {!onAddToCollection && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">List Type</label>
                                    <select
                                        value={collectionType}
                                        onChange={(e) => setCollectionType(e.target.value as CollectionType)}
                                        className="w-full p-2 rounded-md border bg-background"
                                        disabled={loading}
                                    >
                                        <option value="phrases">Phrases</option>
                                        <option value="article">Article</option>
                                    </select>
                                </div>
                            )}
                            <LanguageSelector
                                inputLang={inputLang}
                                setInputLang={setInputLang}
                                targetLang={targetLang}
                                setTargetLang={setTargetLang}
                                direction="row"
                                mode={onAddToCollection ? 'locked' : 'editable'}
                                disabled={loading}
                                isSwapped={onAddToCollection ? isSwapped : undefined}
                                onSwap={onAddToCollection ? () => setIsSwapped(!isSwapped) : undefined}
                            />
                            {prompt.trim() && onProcess && (
                                <button
                                    onClick={handleGeneratePhrases}
                                    disabled={generatingPhrases || !prompt.trim()}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:bg-gray-400 whitespace-nowrap"
                                >
                                    {generatingPhrases ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>{isFetchingUrl ? 'Fetching from URL...' : 'Generating...'}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                            </svg>
                                            {collectionType === 'phrases' ? 'Generate Phrases with AI' : 'Generate Article with AI'}
                                        </div>
                                    )}
                                </button>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">{collectionType === 'phrases' ? 'Phrases (one per line)' : 'Article Content'}</label>
                                <textarea
                                    value={phrasesInput}
                                    onChange={(e) => setPhrasesInput(e.target.value)}
                                    className="w-full h-32 p-2 rounded-md border bg-background resize-none"
                                    placeholder={collectionType === 'phrases' ? `Enter phrases in ${inputLangLabel} here...` : `Paste article in ${inputLangLabel} here...`}
                                    disabled={loading}
                                    autoFocus={Boolean(onAddToCollection)}
                                />
                            </div>

                            {!onProcess && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Get phrase suggestions with AI</label>
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="text"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="w-full p-2 rounded-md border bg-background"
                                            placeholder="Ask for suggestions or paste a URL..."
                                            disabled={loading}
                                        />
                                        {prompt.trim() && (
                                            <button
                                                onClick={handleGeneratePhrases}
                                                disabled={generatingPhrases || !prompt.trim()}
                                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:bg-gray-400 whitespace-nowrap"
                                            >
                                                {generatingPhrases ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>{isFetchingUrl ? 'Fetching from URL...' : 'Generating...'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                                        </svg>
                                                        {collectionType === 'phrases' ? 'Get Phrase Suggestions' : 'Get Sentence Suggestions'}
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {onAddToCollection ? (
                                    <button
                                        onClick={async () => {
                                            await onAddToCollection?.(inputLang, targetLang, isSwapped)
                                            onClose()
                                        }}
                                        disabled={loading || !phrasesInput.trim()}
                                        className="flex-1 px-4 h-[50px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                                    >
                                        <div className="flex items-center gap-2 justify-center">
                                            <Plus className="h-5 w-5" />
                                            <span className="text-sm font-semibold">
                                                {loading ? 'Adding...' : 'Add Phrases'}
                                            </span>
                                        </div>
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            await onProcess?.(prompt, inputLang, targetLang, collectionType)
                                            onClose()
                                        }}
                                        disabled={loading || !phrasesInput.trim()}
                                        className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Processing...' : 'Create List'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
} 