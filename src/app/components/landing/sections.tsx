'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('landing.hero')

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
              {t('title')}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
              {t('subtitle')}
            </p>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                <span>{t('bullets.listening')}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Volume2 className="w-5 h-5 text-primary" />
                <span>{t('bullets.lowEffort')}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>{t('bullets.progress')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  className="text-lg px-8"
                  onClick={() => trackCtaClick('Try 1 Week Free', 'hero')}
                >
                  {t('cta')}
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('note')}
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
  const t = useTranslations('landing.tryLessonHero')

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
              {t('title')}
            </h1>
            <p className="text-2xl sm:text-3xl text-foreground mb-6">
              {t('subtitle')}
            </p>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              {t('description')}
              <br />
              <span className="font-semibold">{t('descriptionEmphasis')}</span>
              {t('descriptionSuffix')}
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              {t('note')}
            </p>

            <div className="bg-secondary/50 rounded-lg p-5 mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-2">{t('callout.label')}</p>
              <p className="text-xl font-semibold text-foreground mb-1">
                {t('callout.title')}
              </p>
              <p className="text-muted-foreground">
                {t('callout.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  className="text-lg px-8"
                  leftIcon={<PlayCircle className="w-5 h-5" />}
                  onClick={() => trackCtaClick(t('cta'), 'hero')}
                >
                  {t('cta')}
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('ctaNote')}
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
  const t = useTranslations('landing.whatIsShadowing')

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
            {t('title')}
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
            {t('subtitle')}
          </p>
          <p className="text-lg text-foreground/90 mb-8 leading-relaxed">
            {t('body')}
            {' '}<span className="font-semibold">{t('highlight')}</span>
          </p>
          <div className="flex justify-center">
            <Link href={ROUTES.GET_STARTED}>
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 bg-secondary/80 hover:bg-secondary shadow-sm"
                leftIcon={<PlayCircle className="w-5 h-5" />}
                onClick={() => trackCtaClick(t('cta'), 'what-is-shadowing')}
              >
                {t('cta')}
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
  const t = useTranslations('landing.benefits')

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
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              {t('body')}
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {t('body2')}
            </p>

            <div className="space-y-3 mb-8">
              <Link href={ROUTES.GET_STARTED}>
                <Button
                  size="lg"
                  className="text-lg px-10"
                  onClick={() => trackCtaClick(t('cta'), 'benefits')}
                >
                  {t('cta')}
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                {t('note')}
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
  const t = useTranslations('landing.templates')

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
            {t('title')}
          </h2>
          <p className="text-lg text-foreground/90 mb-8">
            {t('subtitle')}
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
              <p className="text-sm">{t('cards.levels')}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-left">
              <Check className="w-6 h-6 text-primary mb-3" />
              <p className="text-sm">{t('cards.common')}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-left">
              <Check className="w-6 h-6 text-primary mb-3" />
              <p className="text-sm">{t('cards.stories')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href={ROUTES.GET_STARTED}>
              <Button
                size="lg"
                onClick={() => trackCtaClick(t('cta'), 'templates')}
              >
                {t('cta')}
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('note')}
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
  const t = useTranslations('landing.social')

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
            {t('title')}
            <br />
            {t('titleLine2')}
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            {t('subtitle')}
          </p>

          <div className="mb-10">
            <TestimonialCarousel />
          </div>

          <div className="space-y-3">
            <Link href={ROUTES.GET_STARTED}>
              <Button
                size="lg"
                onClick={() => trackCtaClick(t('cta'), 'social-proof')}
              >
                {t('cta')}
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('note')}
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
  const t = useTranslations('landing.pricing')

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
            {t('title')}
          </h2>
          <p className="text-lg text-foreground/90 mb-12">
            {t('subtitle')}
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
                      {t('bestValue')}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{t(`plans.${plan.id}.name`)}</h3>
                  <p className={`mb-4 ${isAnnual ? 'opacity-90' : 'text-muted-foreground'}`}>
                    {plan.savings
                      ? t('plans.annual.savings', { savings: plan.savings })
                      : t('plans.monthly.flexible')}
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
                      onClick={() => trackCtaClick(t('cta'), `pricing-${plan.id}`)}
                    >
                      {t('cta')}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            {t('note')}
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
  const t = useTranslations('landing.faqs')

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
            {t('title')}
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
  const t = useTranslations('landing.finalCta')

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
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            {t('subtitle')}
          </p>
          <Link href={ROUTES.GET_STARTED}>
            <Button
              size="lg"
              className="text-lg px-10"
              onClick={() => trackCtaClick(t('cta'), 'final-cta')}
            >
              {t('cta')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
