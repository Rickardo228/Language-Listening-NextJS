'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { LanguageCarousel, LanguageItem } from '../ui/LanguageCarousel'
import { TestimonialCarousel } from '../TestimonialCarousel'
import { plans } from '../onboarding/steps/plans'
import { ROUTES } from '../../routes'
import { track } from '../../../lib/mixpanelClient'
import {
  PlayCircle,
  Volume2,
  TrendingUp,
  Zap,
  Check,
  ChevronDown,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface TrackingProps {
  trackCtaClick: (label: string, section: string) => void
}

interface FaqItem {
  q: string
  a: string
}

interface FaqProps {
  openFaq: number | null
  setOpenFaq: (index: number | null) => void
  faqs: FaqItem[]
}

interface LanguageStripProps {
  languages: LanguageItem[]
}

// ============================================================================
// HeroSection - Original positioning-focused hero
// ============================================================================

export function HeroSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}

// ============================================================================
// TryLessonHeroSection - Action-oriented hero for cold traffic
// ============================================================================

export function TryLessonHeroSection({ trackCtaClick }: TrackingProps) {
  return (
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4" style={{ lineHeight: '1.3' }}>
              Language Shadowing
            </h1>
            <p className="text-2xl sm:text-3xl text-foreground mb-6">
              Try a 2-minute listening and speaking exercise
            </p>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              Train real understanding with language shadowing -<br />
              a simple method where you <span className="font-semibold">listen, repeat, and understand</span>.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              No studying. No games. Just press play and practice.
            </p>

            <div className="bg-secondary/50 rounded-lg p-5 mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-2">What you'll do</p>
              <p className="text-xl font-semibold text-foreground mb-1">
                Listen → Repeat → Understand
              </p>
              <p className="text-muted-foreground">
                At your pace. Out loud. Real language.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  className="text-lg px-8"
                  leftIcon={<PlayCircle className="w-5 h-5" />}
                  onClick={() => trackCtaClick('Try the 2-minute exercise', 'hero')}
                >
                  Try the 2-minute exercise
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              Takes 30 seconds to start. No card required.
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
  )
}

// ============================================================================
// LanguageStripSection
// ============================================================================

export function LanguageStripSection({ languages }: LanguageStripProps) {
  const router = useRouter()

  return (
    <section className="border-y border-border bg-secondary/30 py-6 overflow-hidden">
      <LanguageCarousel
        languages={languages}
        onLanguageClick={(lang) => {
          track('Landing Page Language Clicked', { language: lang.code })
          router.push(`${ROUTES.GET_STARTED}?targetLanguage=${encodeURIComponent(lang.code)}`)
        }}
        autoScroll
        autoScrollSpeed={30}
      />
    </section>
  )
}

// ============================================================================
// WhatIsShadowingSection
// ============================================================================

export function WhatIsShadowingSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}

// ============================================================================
// BenefitsSection
// ============================================================================

export function BenefitsSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}

// ============================================================================
// TemplatesSection
// ============================================================================

export function TemplatesSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}

// ============================================================================
// SocialProofSection
// ============================================================================

export function SocialProofSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}

// ============================================================================
// PricingSection
// ============================================================================

export function PricingSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}

// ============================================================================
// FaqSection
// ============================================================================

export function FaqSection({ openFaq, setOpenFaq, faqs }: FaqProps) {
  return (
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
            {faqs.map((faq, index) => (
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
  )
}

// ============================================================================
// FinalCtaSection
// ============================================================================

export function FinalCtaSection({ trackCtaClick }: TrackingProps) {
  return (
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
  )
}
