'use client'

import { useState, useEffect } from 'react'
import { languageOptions } from './types'
import { X } from 'lucide-react'
import { API_BASE_URL } from './consts'
import { createPortal } from 'react-dom'

export interface ImportPhrasesDialogProps {
    onClose: () => void
    inputLang: string
    setInputLang: (lang: string) => void
    targetLang: string
    setTargetLang: (lang: string) => void
    phrasesInput: string
    setPhrasesInput: (input: string) => void
    loading: boolean
    onProcess?: (prompt?: string, inputLang?: string, targetLang?: string) => Promise<void>
    onAddToCollection?: (inputLang?: string, targetLang?: string) => Promise<void>
}

export function ImportPhrasesDialog({
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
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

    useEffect(() => {
        // Create portal container if it doesn't exist
        let container = document.getElementById('portal-container')
        if (!container) {
            container = document.createElement('div')
            container.id = 'portal-container'
            // Add the same font classes as the html element
            container.className = 'font-sans antialiased'
            document.body.appendChild(container)
        }
        setPortalContainer(container)

        // Cleanup
        return () => {
            if (container && !container.hasChildNodes()) {
                container.remove()
            }
        }
    }, [])

    const handleGeneratePhrases = async () => {
        if (!prompt.trim()) return;

        setGeneratingPhrases(true);
        try {
            const response = await fetch(`${API_BASE_URL}/generate-phrases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    inputLang,
                    targetLang
                }),
            });

            const data = await response.json();
            if (data.phrases) {
                setPhrasesInput(data.phrases);
            }
        } catch (error) {
            console.error('Error generating phrases:', error);
        } finally {
            setGeneratingPhrases(false);
        }
    };

    if (!portalContainer) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background text-foreground p-4 rounded-lg shadow-lg w-[500px] max-w-[90vw] overflow-auto max-h-[90vh] border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {onAddToCollection ? 'Add Phrases' : 'Create New Collection'}
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
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Input Language</label>
                                    <select
                                        value={inputLang}
                                        onChange={(e) => setInputLang(e.target.value)}
                                        className="w-full p-2 rounded-md border bg-background"
                                        disabled={loading}
                                    >
                                        {languageOptions.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Target Language</label>
                                    <select
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="w-full p-2 rounded-md border bg-background"
                                        disabled={loading}
                                    >
                                        {languageOptions.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {!onAddToCollection && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Collection Name (optional)</label>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full p-2 rounded-md border bg-background"
                                        placeholder="Enter a name for this collection..."
                                        disabled={loading}
                                        autoFocus={Boolean(onProcess)}
                                    />
                                    {prompt.trim() && (
                                        <button
                                            onClick={handleGeneratePhrases}
                                            disabled={generatingPhrases || !prompt.trim()}
                                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:bg-gray-400 whitespace-nowrap"
                                        >
                                            {generatingPhrases ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                                    </svg>
                                                    Get Phrase Suggestions
                                                </div>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Phrases (one per line)</label>
                            <textarea
                                value={phrasesInput}
                                onChange={(e) => setPhrasesInput(e.target.value)}
                                className="w-full h-32 p-2 rounded-md border bg-background resize-none"
                                placeholder="Enter phrases here..."
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
                                        placeholder="Ask for suggestions..."
                                        disabled={loading}
                                    />
                                    {prompt.trim() && (
                                        <button
                                            onClick={handleGeneratePhrases}
                                            disabled={generatingPhrases || !prompt.trim()}
                                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:bg-gray-400 whitespace-nowrap"
                                        >
                                            {generatingPhrases ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                                    </svg>
                                                    Get Phrase Suggestions
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
                                        await onAddToCollection?.(inputLang, targetLang)
                                        onClose()
                                    }}
                                    disabled={loading || !phrasesInput.trim()}
                                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Adding...' : 'Add Phrases'}
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        await onProcess?.(prompt, inputLang, targetLang)
                                        onClose()
                                    }}
                                    disabled={loading || !phrasesInput.trim()}
                                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : 'Create Collection'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        portalContainer
    )
} 