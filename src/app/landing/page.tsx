'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { languageOptions } from '../types'
import {
  PlayCircle,
  Volume2,
  TrendingUp,
  MapPin,
  BookOpen,
  Zap,
  Check,
  ChevronDown,
  Repeat,
  Headphones,
  Globe
} from 'lucide-react'

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
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
              <Button size="lg" className="text-lg px-8">
                Start free trial
              </Button>
              <Button size="lg" variant="secondary" className="text-lg px-8" leftIcon={<PlayCircle className="w-5 h-5" />}>
                Try a sample lesson
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Cancel anytime. Reminder before billing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Language Strip */}
      <section className="border-y border-border bg-secondary/30 py-8 overflow-hidden">
        <div className="relative">
          <div className="flex gap-8 animate-scroll">
            {/* Duplicate the array twice for seamless looping */}
            {[...languageOptions, ...languageOptions].map((lang, index) => (
              <div
                key={`${lang.code}-${index}`}
                className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-background/50 rounded-lg border border-border flex-shrink-0"
              >
                <span className="text-2xl">{lang.label.split(' ')[0]}</span>
                <span className="text-sm font-medium text-foreground">
                  {lang.label.substring(lang.label.indexOf(' ') + 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 60s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
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
              Listen → Speak → Repeat
            </p>
            <p className="text-lg text-foreground/90 mb-8 leading-relaxed">
              Shadowing is one of the most natural ways we learn language. As children, we mimic our parents and peers, until words and phrases become part of our every day speech.
              Using the shadowing method, you listen to a native phrase, then repeat it out loud - at a pace that matches your level.
              Over time, understanding and speaking become more automatic.
              Simple steps. Real progress.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="py-16 sm:py-24 bg-secondary/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-center">
              Minimum screen time, maximum progress
            </h2>
            <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
              Language learning through consistent, low-friction immersion. No more click and drag.
              No more tedious flashcards. No more hunting for the right content.
              Just press play and practice - while you're walking, doing chores, or even in the shower.
            </p>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
                <div className="space-y-3">
                  <p className="text-muted-foreground italic">"I just wanted the words I needed for a trip..."</p>
                  <p className="text-foreground font-medium">
                    ✓ Get travel-ready phrases organized by situation
                  </p>
                </div>
              </div>

              <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
                <div className="space-y-3">
                  <p className="text-muted-foreground italic">"Anki was boring and tedious to upload and practice..."</p>
                  <p className="text-foreground font-medium">
                    ✓ No setup. Just tap and start practicing
                  </p>
                </div>
              </div>

              <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
                <div className="space-y-3">
                  <p className="text-muted-foreground italic">"Tired of trawling podcast apps trying to find content that's not too advanced..."</p>
                  <p className="text-foreground font-medium">
                    ✓ Every phrase is matched to your level
                  </p>
                </div>
              </div>

              <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
                <div className="space-y-3">
                  <p className="text-muted-foreground italic">"1000 day streak on Duolingo and I still can't hold a conversation..."</p>
                  <p className="text-foreground font-medium">
                    ✓ Practice actual speaking, not just recognition
                  </p>
                </div>
              </div>

              <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4 md:col-span-2">
                <div className="space-y-3">
                  <p className="text-muted-foreground italic">"I just want to listen on the go-while doing chores, in the shower, commuting..."</p>
                  <p className="text-foreground font-medium">
                    ✓ Audio-first and screen-light. Practice anywhere, anytime
                  </p>
                </div>
              </div>
            </div> */}

            <div className="text-center">
              <Button size="lg" className="text-lg px-10">Start free trial</Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Simple to start. Hard to stop.
              </p>
            </div>
          </motion.div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-card border border-border rounded-lg p-6 text-left">
                <Check className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm">Templates by level and situation</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-left">
                <Check className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm">Travel, daily life, and real conversations</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-left">
                <Check className="w-6 h-6 text-primary mb-3" />
                <p className="text-sm">Always know what to practice next</p>
              </div>
            </div>

            <Button size="lg" variant="secondary">Browse templates</Button>
          </motion.div>
        </div>
      </section>

      {/* Intermediate-friendly Content */}
      <section className="py-16 sm:py-24 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-center">
              Intermediate-friendly: content that fits, so you keep going
            </h2>
            <p className="text-lg text-foreground/90 mb-8 leading-relaxed">
              If you're around <strong>A2/B1</strong>, most native content is either too simple (textbook) or too fast (overwhelming).
              This gives you a steady path: <strong>stories and practice matched to your level</strong>-so you can improve without constantly
              translating in your head.
            </p>
            <p className="text-lg text-foreground/90 mb-10 leading-relaxed">
              <strong>New to the language?</strong> Start with beginner stories and slower audio - you'll never be dropped into the deep end.
            </p>

            <div className="space-y-6 mb-10">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Globe className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Stories by level (A2 → C1)</h3>
                    <p className="text-muted-foreground">
                      Fantasy worlds, gripping dramas, and cosy reflective chapters-each written/curated for a specific level,
                      with audio that doesn't outrun you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Your phrase bank</h3>
                    <p className="text-muted-foreground">
                      Save lines you love, add your own go-to expressions, and build personal packs (small talk, work, travel, storytelling).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Optional daily news</h3>
                    <p className="text-muted-foreground">
                      Listen or read a short, level-matched recap-then shadow the key lines so the language sticks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground italic">
              Everything is <strong>audio-first and screen-light</strong> (visuals when you want them).
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Player */}
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
              Screen-light, on-the-go friendly
            </h2>
            <p className="text-lg text-foreground/90 mb-10">
              Practice while walking, doing chores, commuting - whenever you can speak out loud.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-card border border-border rounded-lg p-6">
                <Headphones className="w-10 h-10 text-primary mb-4 mx-auto" />
                <h3 className="font-semibold mb-2">Screen-light, on-the-go friendly</h3>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Repeat className="w-10 h-10 text-primary mb-4 mx-auto" />
                <h3 className="font-semibold mb-2">Swipeable mode to stay in flow</h3>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Volume2 className="w-10 h-10 text-primary mb-4 mx-auto" />
                <h3 className="font-semibold mb-2">Pacing controls</h3>
                <p className="text-sm text-muted-foreground">Never too fast or too hard</p>
              </div>
            </div>

            <Button size="lg" variant="secondary" leftIcon={<PlayCircle className="w-5 h-5" />}>
              Try a sample lesson
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Progress */}
      <section className="py-16 sm:py-24 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Progress you can feel in a week
            </h2>
            <p className="text-lg text-foreground/90 mb-10">
              You're not chasing random streaks - you're building speaking automaticity through repeatable reps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-card border border-border rounded-lg p-6">
                <Check className="w-8 h-8 text-primary mb-3 mx-auto" />
                <p>Build consistency with simple milestones</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Check className="w-8 h-8 text-primary mb-3 mx-auto" />
                <p>See your momentum session by session</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <Check className="w-8 h-8 text-primary mb-3 mx-auto" />
                <p>Keep a steady habit without overthinking it</p>
              </div>
            </div>

            <Button size="lg">Start free trial</Button>
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
              Start with a free trial. If you don't feel more confident speaking in a week, cancel in two clicks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              <div className="bg-card border-2 border-border rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-2">Monthly</h3>
                <p className="text-muted-foreground mb-4">Flexible and commitment-free</p>
                <div className="text-4xl font-bold mb-4">$XX<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <Button fullWidth>Start free trial</Button>
              </div>

              <div className="bg-primary text-primary-foreground border-2 border-primary rounded-lg p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Best value
                </div>
                <h3 className="text-2xl font-bold mb-2">Annual</h3>
                <p className="opacity-90 mb-4">Save XX% with annual billing</p>
                <div className="text-4xl font-bold mb-4">$XX<span className="text-lg font-normal opacity-90">/mo</span></div>
                <Button fullWidth variant="secondary">Start free trial</Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Cancel anytime · Reminder before billing · Secure payments
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
                  q: "Is this for beginners?",
                  a: "Yes - as long as you can handle short phrases. The pace and difficulty can be adjusted."
                },
                {
                  q: "Do I need to \"study\" grammar first?",
                  a: "No. Shadowing builds the speaking reflex first. Grammar can come alongside it."
                },
                {
                  q: "Can I use this while commuting?",
                  a: "Yes - it's designed to be audio-first and screen-light."
                },
                {
                  q: "What if most content is too advanced?",
                  a: "That's the point of level-matched phrases and templates: you practice at the right difficulty."
                },
                {
                  q: "Is this better than flashcards?",
                  a: "Different job. Flashcards help recognition; shadowing trains speaking and recall under pressure."
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
              No pressure - just a fair trial and a simple system that makes speaking inevitable.
            </p>
            <Button size="lg" className="text-lg px-10">
              Start free trial
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
