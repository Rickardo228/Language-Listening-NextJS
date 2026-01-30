'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './ui/Button'
import { LanguageCarousel, LanguageItem } from './ui/LanguageCarousel'
import { TestimonialCarousel } from './TestimonialCarousel'
import { plans } from './onboarding/steps/plans'
import { languageOptions } from '../types'
import { ROUTES } from '../routes'
import { track } from '../../lib/mixpanelClient'
import {
  PlayCircle,
  Volume2,
  TrendingUp,
  Zap,
  Check,
  ChevronDown,
} from 'lucide-react'

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
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const trackedViewRef = useRef(false)

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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="grid lg:grid-cols-[70%_30%] min-h-[600px] lg:min-h-[700px]">
          {/* Left Content */}
          <div className="flex items-center px-4 sm:px-6 lg:px-12 xl:px-16 py-16 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" style={{ lineHeight: '1.3' }}>
                Speak naturally and understand natives easily
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
                Language shadowing is the fastest way to conversational fluency.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Build your listening and speaking reflexes with shadowing</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span>A low effort, high impact method for any ability level</span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>See progress in a week</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link href={ROUTES.GET_STARTED}>
                  <Button
                    size="lg"
                    className="text-lg px-8"
                    onClick={() => trackCtaClick('Try 1 Week Free', 'hero')}
                  >
                    Try 1 Week Free
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                No commitment required. Start learning now.
              </p>
            </motion.div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-56 sm:h-72 lg:h-auto mx-4 sm:mx-6 lg:mx-0 mb-10 lg:mb-0 overflow-hidden rounded-2xl lg:rounded-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent z-10" />
            <Image
              src="/hero-image.jpg"
              alt="Language learning"
              fill
              className="object-cover object-right"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Language Strip */}
      <section className="border-y border-border bg-secondary/30 py-6 overflow-hidden">
        <LanguageCarousel
          languages={prioritizedLanguages}
          onLanguageClick={(lang) => {
            track('Landing Page Language Clicked', { language: lang.code })
            router.push(`${ROUTES.GET_STARTED}?targetLanguage=${encodeURIComponent(lang.code)}`)
          }}
          autoScroll
          autoScrollSpeed={30}
        />
      </section>

      {/* What is Language Shadowing */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              What is Language Shadowing?
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
              Listen → Repeat
            </p>
            <p className="text-lg text-foreground/90 mb-8 leading-relaxed">
              As children, we mimic our parents and peers, until words and phrases become part of our every day speech.
              Using the shadowing method, you listen to a native phrase, then repeat it out loud - at a pace that matches your level.
              Over time, understanding and speaking become more automatic.
              {' '}<span className="font-semibold">Simple steps. Real progress.</span>
            </p>
            <div className="flex justify-center">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 bg-secondary/80 hover:bg-secondary shadow-sm"
                  leftIcon={<PlayCircle className="w-5 h-5" />}
                  onClick={() => trackCtaClick('Try a sample lesson', 'what-is-shadowing')}
                >
                  Try a sample lesson
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="relative overflow-hidden bg-secondary/20">
        <div className="grid lg:grid-cols-[30%_70%] min-h-[600px] lg:min-h-[700px]">
          {/* Left Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-56 sm:h-72 lg:h-auto mx-4 sm:mx-6 lg:mx-0 mb-10 lg:mb-0 overflow-hidden rounded-2xl lg:rounded-none"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-secondary/20 to-transparent z-10" />
            <Image
              src="/on-the-go-listening.png"
              alt="Person listening to language lessons on the go"
              fill
              className="object-cover object-center"
            />
          </motion.div>

          {/* Right Content */}
          <div className="flex items-center px-4 sm:px-6 lg:px-12 xl:px-16 py-16 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Easy, measurable improvements
              </h2>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                No games. No searching for podcasts. No tutors.
                Just press play and practice - while you're walking, doing chores, or even in the shower.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We measure one thing: the number of phrases you listen to.
              </p>

              <div className="space-y-3 mb-8">
                <Link href={ROUTES.GET_STARTED}>
                  <Button
                    size="lg"
                    className="text-lg px-10"
                    onClick={() => trackCtaClick('Start practicing', 'benefits')}
                  >
                    Start practicing
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Takes 30 seconds to start. No payment required.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Templates and Stories */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Never start from zero
            </h2>
            <p className="text-lg text-foreground/90 mb-8">
              Skip the "what should I practice?" problem. Choose a set and start speaking.
            </p>

            <div className="mb-12 max-w-4xl mx-auto">
              <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-2xl">
                <Image
                  src="/language-shadowing-player-story.png"
                  alt="Language shadowing player interface"
                  width={2070}
                  height={1146}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-card border border-border rounded-lg p-6 text-left">
                <Check className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm">Templates by level and situation</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-left">
                <Check className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm">Most common phrases and verbs</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-left">
                <Check className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm">Immersive stories</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  onClick={() => trackCtaClick('Start practicing', 'templates')}
                >
                  Start practicing
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Unlock the full Template Library.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 sm:py-24 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for learners who want to speak,<br />not just study.
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Used for shadowing in 20+ languages
            </p>

            <div className="mb-10">
              <TestimonialCarousel />
            </div>

            <div className="space-y-3">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  onClick={() => trackCtaClick('Get started', 'social-proof')}
                >
                  Get started
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                See why learners love shadowing.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Try it free
            </h2>
            <p className="text-lg text-foreground/90 mb-12">
              Start with a free trial. No payment required to begin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              {plans.map((plan) => {
                const isAnnual = plan.id === 'annual'
                return (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-lg p-8 relative ${isAnnual
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border'
                      }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                        Best value
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={`mb-4 ${isAnnual ? 'opacity-90' : 'text-muted-foreground'}`}>
                      {plan.savings ? `${plan.savings} with annual billing` : 'Flexible and commitment-free'}
                    </p>
                    <div className="text-4xl font-bold mb-2">
                      {plan.price}
                      <span className={`text-lg font-normal ${isAnnual ? 'opacity-90' : 'text-muted-foreground'}`}>
                        {plan.period}
                      </span>
                    </div>
                    {plan.pricePerMonth && (
                      <p className={`text-sm mb-4 ${isAnnual ? 'opacity-90' : 'text-muted-foreground'}`}>
                        {plan.pricePerMonth}
                      </p>
                    )}
                    <Link href={ROUTES.GET_STARTED}>
                      <Button
                        fullWidth
                        variant={isAnnual ? 'secondary' : 'primary'}
                        className={isAnnual ? 'border border-white text-white hover:bg-white/10' : ''}
                        onClick={() => trackCtaClick('Start free trial', `pricing-${plan.id}`)}
                      >
                        Start free trial
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              No card required · Reminder before billing · Secure payments
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-secondary/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {[
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
              ].map((faq, index) => (
                <div key={index} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-semibold text-lg">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-muted-foreground">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-6">
              Your next conversation starts with 10 minutes today.
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              No pressure - no card required. A simple system that makes speaking inevitable.
            </p>
            <Link href={ROUTES.GET_STARTED}>
              <Button
                size="lg"
                className="text-lg px-10"
                onClick={() => trackCtaClick('Start practicing', 'final-cta')}
              >
                Start practicing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
