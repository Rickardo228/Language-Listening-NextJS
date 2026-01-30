'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from './utils'

export type LanguageItem = {
  code: string
  label: string
}

interface LanguageCarouselProps {
  languages: LanguageItem[]
  onLanguageClick?: (language: LanguageItem) => void
  className?: string
  autoScroll?: boolean
  autoScrollSpeed?: number // pixels per second
}

export function LanguageCarousel({
  languages,
  onLanguageClick,
  className,
  autoScroll = false,
  autoScrollSpeed = 30,
}: LanguageCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const directionRef = useRef<1 | -1>(1) // 1 = right, -1 = left

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  // Auto-scroll animation (disabled on mobile)
  useEffect(() => {
    if (!autoScroll || isPaused || isMobile) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000
      lastTimeRef.current = currentTime

      const scrollAmount = autoScrollSpeed * deltaTime * directionRef.current
      container.scrollLeft += scrollAmount

      // Reverse direction at edges
      const maxScroll = container.scrollWidth - container.clientWidth
      if (container.scrollLeft >= maxScroll) {
        directionRef.current = -1
      } else if (container.scrollLeft <= 0) {
        directionRef.current = 1
      }

      updateScrollButtons()
      animationRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = 0
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [autoScroll, isPaused, isMobile, autoScrollSpeed, updateScrollButtons])

  useEffect(() => {
    updateScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      window.addEventListener('resize', updateScrollButtons)
    }
    return () => {
      container?.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [updateScrollButtons])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    // Pause auto-scroll briefly when manually scrolling
    if (autoScroll) {
      setIsPaused(true)
      setTimeout(() => setIsPaused(false), 3000)
    }

    const maxScroll = container.scrollWidth - container.clientWidth
    const scrollAmount = container.clientWidth * 0.4

    if (direction === 'right' && container.scrollLeft >= maxScroll - 10) {
      // At end, loop to start
      container.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction === 'left' && container.scrollLeft <= 10) {
      // At start, loop to end
      container.scrollTo({ left: maxScroll, behavior: 'smooth' })
    } else {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleMouseEnter = () => {
    if (autoScroll) setIsPaused(true)
  }

  const handleMouseLeave = () => {
    if (autoScroll) setIsPaused(false)
  }

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left chevron */}
      <button
        onClick={() => scroll('left')}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/90 border border-border shadow-md transition-all',
          canScrollLeft
            ? 'opacity-100 hover:bg-secondary'
            : 'opacity-0 pointer-events-none'
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-10 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageClick?.(lang)}
            className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-background/50 rounded-lg border border-border flex-shrink-0 hover:bg-secondary/50 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <span className="text-2xl">{lang.label.split(' ')[0]}</span>
            <span className="text-sm font-medium text-foreground">
              {lang.label.substring(lang.label.indexOf(' ') + 1)}
            </span>
          </button>
        ))}
      </div>

      {/* Right chevron */}
      <button
        onClick={() => scroll('right')}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/90 border border-border shadow-md transition-all',
          canScrollRight
            ? 'opacity-100 hover:bg-secondary'
            : 'opacity-0 pointer-events-none'
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      {/* Gradient fades */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-secondary/30 to-transparent pointer-events-none transition-opacity',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-secondary/30 to-transparent pointer-events-none transition-opacity',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  )
}
