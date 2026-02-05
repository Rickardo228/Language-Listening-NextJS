'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageItem } from './ui/LanguageCarousel'
import { languageOptions } from '../types'
import { track } from '../../lib/mixpanelClient'
import {
  HeroSection,
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

export function LandingPage() {
  const t = useTranslations('landing.faqs')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const trackedViewRef = useRef(false)

  const faqs = t.raw('items') as Array<{ q: string; a: string }>

  useEffect(() => {
    if (trackedViewRef.current) return
    track('Landing Page Viewed')
    trackedViewRef.current = true
  }, [])

  const trackCtaClick = (label: string, section: string) => {
    track('Landing Page CTA Clicked', { label, section })
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection trackCtaClick={trackCtaClick} />
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
