'use client'

import { useState } from 'react'
import { API_BASE_URL } from '../consts'
import { CollectionType } from '../types'
import { toast } from 'sonner'
import { trackGeneratePhrases } from '../../lib/mixpanelClient'

interface UseGeneratePhrasesOptions {
    inputLang: string
    targetLang: string
    collectionType?: CollectionType
    onSuccess?: (phrases: string, prompt: string) => void | Promise<void>
}

interface GeneratePhrasesParams {
    prompt: string
    allowEmpty?: boolean
    /**
     * Optional per-call override for the collection type.
     * Falls back to the hook's configured collectionType when omitted.
     */
    collectionTypeOverride?: CollectionType
}

export function useGeneratePhrases({
    inputLang,
    targetLang,
    collectionType = 'phrases',
    onSuccess,
}: UseGeneratePhrasesOptions) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isFetchingUrl, setIsFetchingUrl] = useState(false)

    const generatePhrases = async ({
        prompt,
        allowEmpty = false,
        collectionTypeOverride,
    }: GeneratePhrasesParams) => {
        const normalizedPrompt = prompt.trim()
        if (!allowEmpty && !normalizedPrompt) return null

        const effectivePrompt = normalizedPrompt || 'Generate useful phrases'
        const effectiveCollectionType = collectionTypeOverride ?? collectionType

        // Detect if prompt is a URL
        const urlRegex = /^https?:\/\/.+/i
        const isUrl = urlRegex.test(effectivePrompt)

        setIsGenerating(true)
        setIsFetchingUrl(isUrl)

        try {
            // Choose endpoint based on whether it's a URL
            const endpoint = isUrl ? '/fetch-url-content' : '/generate-phrases'
            const bodyData = isUrl
                ? {
                      url: effectivePrompt,
                      inputLang,
                      targetLang,
                      type: effectiveCollectionType,
                  }
                : {
                      prompt: effectivePrompt,
                      inputLang,
                      targetLang,
                      type: effectiveCollectionType,
                  }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch content')
            }

            if (data.phrases) {
                // Track phrase generation event
                const phraseCount = data.phrases
                    .split('\n')
                    .filter((line: string) => line.trim()).length
                trackGeneratePhrases(
                    isUrl ? `URL: ${effectivePrompt}` : effectivePrompt,
                    inputLang,
                    targetLang,
                    effectiveCollectionType,
                    phraseCount
                )

                await onSuccess?.(data.phrases, normalizedPrompt)
                return data.phrases
            }

            return null
        } catch (error) {
            console.error('Error generating phrases:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to generate phrases. Please try again.'
            )
            return null
        } finally {
            setIsGenerating(false)
            setIsFetchingUrl(false)
        }
    }

    return {
        generatePhrases,
        isGenerating,
        isFetchingUrl,
    }
}
