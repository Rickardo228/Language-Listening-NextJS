'use client'

import { useRef, useState, type TouchEvent } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    quote:
      "This is the only method that made speaking feel automatic instead of forced. I don't think about grammar anymore - I just talk.",
    author: 'Ana V., learning Portuguese',
    image: '/landing/Ana-Testimonial.png',
  },
  {
    quote:
      "After years of classes, I still couldn't hold a conversation. Three months of shadowing changed everything. Wish I'd found this sooner.",
    author: 'Marie S., learning Spanish',
    image: '/landing/Marie-Testimonial.png',
  },
  {
    quote:
      'I practice while doing dishes, walking the dog, anywhere. Finally, a method that fits real life instead of requiring desk time. Thanks!',
    author: 'Tom H., learning Korean',
    image: '/landing/Tom-Testimonial.png',
  },
]

export function TestimonialCarousel() {
  const [currentTestimonial, setCurrentTestimonial] = useState(1)
  const touchStartX = useRef<number | null>(null)

  const handlePrevious = () => {
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setCurrentTestimonial((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    )
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const touchEndX = event.changedTouches[0]?.clientX ?? null
    if (touchEndX === null) return
    const deltaX = touchEndX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) < 50) return
    if (deltaX > 0) {
      handlePrevious()
    } else {
      handleNext()
    }
  }

  return (
    <>
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mb-6">
        <button
          onClick={handlePrevious}
          className="hidden sm:flex p-2 rounded-full hover:bg-secondary/50 transition-colors flex-shrink-0 self-center"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-6 h-6 text-muted-foreground" />
        </button>

        <div
          className="bg-card border border-border rounded-lg p-6 sm:p-8 w-full sm:max-w-2.2xl min-h-[180px] flex flex-col justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-4"
          >
            <Image
              src={testimonials[currentTestimonial].image}
              alt={testimonials[currentTestimonial].author}
              width={60}
              height={60}
              className="rounded-full flex-shrink-0 object-cover"
            />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-lg text-foreground/90 mb-4 italic">
                "{testimonials[currentTestimonial].quote}"
              </p>
              <p className="text-sm text-muted-foreground">
                - {testimonials[currentTestimonial].author}
              </p>
            </div>
          </motion.div>
        </div>

        <button
          onClick={handleNext}
          className="hidden sm:flex p-2 rounded-full hover:bg-secondary/50 transition-colors flex-shrink-0 self-center"
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentTestimonial(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentTestimonial
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`View testimonial ${index + 1}`}
          />
        ))}
      </div>
    </>
  )
}
