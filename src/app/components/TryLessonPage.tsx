'use client'

import { useEffect, useRef, useState } from 'react'
import { LanguageItem } from './ui/LanguageCarousel'
import { languageOptions } from '../types'
import { track } from '../../lib/mixpanelClient'
import {
  TryLessonHeroSection,
  LanguageStripSection,
  WhatIsShadowingSection,
  BenefitsSection,
  TemplatesSection,
  SocialProofSection,
  PricingSection,
  FaqSection,
  FinalCtaSection,
} from './landing/sections'

// Prioritized languages - most popular learning targets first
const prioritizedLanguageCodes = [
  'en-US',    // English (US)
  'es-ES',    // Spanish
  'fr-FR',    // French
  'de-DE',    // German
  'it-IT',    // Italian
  'pt-BR',    // Portuguese (Brazil)
  'ja-JP',    // Japanese
  'cmn-CN',   // Chinese
  'ko-KR',    // Korean
  'ru-RU',    // Russian
  'ar-XA',    // Arabic
  'hi-IN',    // Hindi
  'nl-NL',    // Dutch
  'pl-PL',    // Polish
  'tr-TR',    // Turkish
  'sv-SE',    // Swedish
  'el-GR',    // Greek
  'vi-VN',    // Vietnamese
  'th-TH',    // Thai
  'uk-UA',    // Ukrainian
  'id-ID',    // Indonesian
  'bn-IN',    // Bengali
  'ta-IN',    // Tamil
  'yue-HK',   // Cantonese
  'pt-PT',    // Portuguese (Portugal)
  'fr-CA',    // French (Canada)
  'en-GB',    // English (UK)
  'en-AU',    // English (Australia)
]

const prioritizedLanguages: LanguageItem[] = prioritizedLanguageCodes
  .map(code => languageOptions.find(lang => lang.code === code))
  .filter((lang): lang is LanguageItem => lang !== undefined)

const faqs = [
  {
    q: "Is this for beginners, intermediate, or advanced learners?",
    a: "All levels. Beginners start with common phrases and basic conversations. Intermediate learners practice natural speech patterns and idiomatic expressions. Advanced learners work on native-speed dialogue and complex topics. The pace and difficulty adjust to your level."
  },
  {
    q: "Do I need to \"study\" grammar first?",
    a: "No. Shadowing builds the speaking reflex first. Grammar can come alongside it."
  },
  {
    q: "Can I use this while commuting?",
    a: "Yes - it's designed to be audio-first and enable you to press play once and not interact with your screen for an entire practice session if you don't want to."
  },
  {
    q: "Is this better than flashcards?",
    a: "Flashcards mainly test memory. Shadowing is different: you listen to native audio with adjustable playback speed and configurable pauses for speaking. It's immersive listening and speaking practice. You're training your ears and mouth to work at conversation speed, not just testing if you remember a translation. It's the difference between knowing a word and being able to use it when someone's actually talking to you. (We also have a quiz mode if you want traditional memory testing.)"
  }
]

export function TryLessonPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const trackedViewRef = useRef(false)

  useEffect(() => {
    if (trackedViewRef.current) return
    track('Try Lesson Page Viewed')
    trackedViewRef.current = true
  }, [])

  const trackCtaClick = (label: string, section: string) => {
    track('Try Lesson Page CTA Clicked', { label, section })
  }

  return (
    <div className="min-h-screen bg-background">
      <TryLessonHeroSection trackCtaClick={trackCtaClick} />
      <LanguageStripSection languages={prioritizedLanguages} />
      <WhatIsShadowingSection trackCtaClick={trackCtaClick} />
      <BenefitsSection trackCtaClick={trackCtaClick} />
      <TemplatesSection trackCtaClick={trackCtaClick} />
      <SocialProofSection trackCtaClick={trackCtaClick} />
      <PricingSection trackCtaClick={trackCtaClick} />
      <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} faqs={faqs} />
      <FinalCtaSection trackCtaClick={trackCtaClick} />
    </div>
  )
}
