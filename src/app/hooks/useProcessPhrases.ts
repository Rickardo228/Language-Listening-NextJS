'use client'

import { useState } from 'react'
import { API_BASE_URL } from '../consts'
import { toast } from 'sonner'
import { Phrase, AudioSegment } from '../types'

interface UseProcessPhrasesOptions {
    inputLang: string
    targetLang: string
    inputVoice?: string
    targetVoice?: string
    batchSize?: number
    onProgress?: (completed: number, total: number) => void
}

export function useProcessPhrases({
    inputLang,
    targetLang,
    inputVoice,
    targetVoice,
    batchSize = 10,
    onProgress,
}: UseProcessPhrasesOptions) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null)

    const processPhrases = async (
        phrases: string[],
        options?: {
            skipAudio?: boolean
            inputVoice?: string
            targetVoice?: string
            inputLang?: string
            targetLang?: string
        }
    ): Promise<Phrase[]> => {
        if (!phrases.length) return []

        const effectiveInputLang = options?.inputLang || inputLang
        const effectiveTargetLang = options?.targetLang || targetLang
        const skipAudio = options?.skipAudio ?? phrases.length > 50
        const effectiveInputVoice = options?.inputVoice || inputVoice || `${effectiveInputLang}-Standard-D`
        const effectiveTargetVoice = options?.targetVoice || targetVoice || `${effectiveTargetLang}-Standard-D`

        setIsProcessing(true)
        const allProcessed: Phrase[] = []
        const total = phrases.length

        setProgress({ completed: 0, total })
        onProgress?.(0, total)

        try {
            for (let i = 0; i < phrases.length; i += batchSize) {
                const batch = phrases.slice(i, i + batchSize)

                const response = await fetch(`${API_BASE_URL}/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phrases: batch,
                        inputLang: effectiveInputLang,
                        targetLang: effectiveTargetLang,
                        inputVoice: effectiveInputVoice,
                        targetVoice: effectiveTargetVoice,
                        skipAudio,
                    }),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to process phrases')
                }

                const data = await response.json()

                // Map API response to Phrase objects
                const batchPhrases: Phrase[] = batch.map((phraseText: string, index: number) => ({
                    input: phraseText,
                    translated: data.translated?.[index] || '',
                    inputAudio: data.inputAudioSegments?.[index] || null,
                    outputAudio: data.outputAudioSegments?.[index] || null,
                    romanized: data.romanizedOutput?.[index] || '',
                    inputLang: effectiveInputLang,
                    targetLang: effectiveTargetLang,
                    inputVoice: data.inputVoice || effectiveInputVoice,
                    targetVoice: data.targetVoice || effectiveTargetVoice,
                }))

                allProcessed.push(...batchPhrases)

                const completed = Math.min(i + batchSize, total)
                setProgress({ completed, total })
                onProgress?.(completed, total)
            }

            return allProcessed
        } catch (error) {
            console.error('Error processing phrases:', error)
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to process phrases. Please try again.'
            )
            throw error
        } finally {
            setIsProcessing(false)
            setProgress(null)
        }
    }

    return {
        processPhrases,
        isProcessing,
        progress,
    }
}
