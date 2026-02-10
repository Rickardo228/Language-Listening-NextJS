'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { CollectionType } from '../types'
import { useGeneratePhrases } from '../hooks/useGeneratePhrases'

interface AIGenerateInputProps {
    inputLang: string
    targetLang: string
    collectionType?: CollectionType
    onGenerate: (phrases: string, prompt: string, name?: string) => void | Promise<void>
    disabled?: boolean
    className?: string
    placeholder?: string
    clearAfterGenerate?: boolean
}

const DEFAULT_PLACEHOLDERS = [
    'e.g. ordering coffee...',
    'e.g. airport check-in...',
    'e.g. making small talk...',
    'e.g. asking for directions...',
    'e.g. grocery shopping...',
    'e.g. booking a hotel...',
    'e.g. restaurant conversation...',
    'e.g. introducing yourself...',
]

export function AIGenerateInput({
    inputLang,
    targetLang,
    collectionType = 'phrases',
    onGenerate,
    disabled = false,
    className = '',
    placeholder,
    clearAfterGenerate = false,
}: AIGenerateInputProps) {
    const [prompt, setPrompt] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Randomly select a placeholder on mount
    const randomPlaceholder = useMemo(() => {
        if (placeholder) return placeholder
        return DEFAULT_PLACEHOLDERS[Math.floor(Math.random() * DEFAULT_PLACEHOLDERS.length)]
    }, [])

    const { generatePhrases, isGenerating, isFetchingUrl } = useGeneratePhrases({
        inputLang,
        targetLang,
        collectionType,
        onSuccess: async (phrases, normalizedPrompt) => {
            await onGenerate(phrases, normalizedPrompt, undefined)
            if (clearAfterGenerate) {
                setPrompt('')
            }
        },
    })

    // Focus the input when component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus()
        }, 150)
        return () => clearTimeout(timer)
    }, [])

    const handleGenerate = () => {
        generatePhrases({ prompt })
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        if (!isGenerating && !disabled) {
                            handleGenerate()
                        }
                    }}
                    placeholder={randomPlaceholder}
                    disabled={isGenerating || disabled}
                    ref={inputRef}
                    className="w-full h-14 pl-5 pr-32 rounded-xl border-2 bg-background/50 backdrop-blur-sm text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                />
                <button
                    type="button"
                    onClick={handleGenerate}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    disabled={isGenerating || disabled}
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating...</span>
                        </>
                    ) : (
                        <>
                            <span>Make it</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
