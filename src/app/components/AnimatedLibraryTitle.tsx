'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUser } from '../contexts/UserContext'
import { languageOptions } from '../types'

// Mapping of language codes to "Hi" translations
const hiTranslations: Record<string, string> = {
    'en-GB': 'Hi',
    'en-US': 'Hi',
    'es-ES': 'Hola',
    'es-MX': 'Hola',
    'fr-FR': 'Salut',
    'de-DE': 'Hallo',
    'it-IT': 'Ciao',
    'pt-BR': 'Oi',
    'pt-PT': 'Olá',
    'nl-NL': 'Hoi',
    'pl-PL': 'Cześć',
    'ru-RU': 'Привет',
    'ja-JP': 'こんにちは',
    'ko-KR': '안녕',
    'zh-CN': '你好',
    'zh-TW': '你好',
    'ar-XA': 'مرحبا',
    'tr-TR': 'Merhaba',
    'sv-SE': 'Hej',
    'da-DK': 'Hej',
    'no-NO': 'Hei',
    'fi-FI': 'Hei',
    'cs-CZ': 'Ahoj',
    'hu-HU': 'Szia',
    'ro-RO': 'Salut',
    'uk-UA': 'Привіт',
    'el-GR': 'Γεια',
    'he-IL': 'שלום',
    'hi-IN': 'नमस्ते',
    'th-TH': 'สวัสดี',
    'vi-VN': 'Xin chào',
    'id-ID': 'Hai',
    'ms-MY': 'Hai',
}

type AnimationStage = 'english' | 'translated' | 'question'

export function AnimatedLibraryTitle() {
    const { userProfile } = useUser()
    const [stage, setStage] = useState<AnimationStage>('english')

    const userName = userProfile?.displayName?.split(' ')[0] || 'there'
    const targetLang = userProfile?.preferredTargetLang || 'it-IT'

    // Get the target language name for context
    const targetLangOption = languageOptions.find(lang => lang.code === targetLang)
    const targetLangName = targetLangOption?.label.split(' (')[0] || 'target language'

    // Get the translation of "Hi" in the target language
    const translatedHi = hiTranslations[targetLang] || 'Hi'

    // Only show translated greeting if it's different from English
    const shouldShowTranslated = translatedHi !== 'Hi' && translatedHi !== hiTranslations['en-GB']

    useEffect(() => {
        // Stage 1: English greeting (show for 1.5 seconds)
        const timer1 = setTimeout(() => {
            if (shouldShowTranslated) {
                setStage('translated')
            } else {
                // Skip translated stage if it's the same as English
                setStage('question')
            }
        }, 1500)

        // Stage 2: Translated greeting (show for 1.5 seconds) - only if different
        const timer2 = shouldShowTranslated ? setTimeout(() => {
            setStage('question')
        }, 3000) : null

        return () => {
            clearTimeout(timer1)
            if (timer2) clearTimeout(timer2)
        }
    }, [shouldShowTranslated])

    return (
        <div className="relative h-8 flex items-center">
            <AnimatePresence mode="wait">
                {stage === 'english' && (
                    <motion.h2
                        key="english"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="text-xl font-semibold absolute whitespace-nowrap"
                    >
                        Hi {userName},
                    </motion.h2>
                )}
                {stage === 'translated' && (
                    <motion.h2
                        key="translated"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="text-xl font-semibold absolute whitespace-nowrap"
                    >
                        {translatedHi} {userName},
                    </motion.h2>
                )}
                {stage === 'question' && (
                    <motion.h2
                        key="question"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="text-xl font-semibold absolute whitespace-nowrap"
                    >
                        What do you want to learn today?
                    </motion.h2>
                )}
            </AnimatePresence>
        </div>
    )
}
