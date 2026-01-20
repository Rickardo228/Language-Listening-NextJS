import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { UserContextProvider } from '../../contexts/UserContext'
import { CollectionsProvider } from '../../contexts/CollectionsContext'
import { Phrase, AudioSegment } from '../../types'
import { createMockUser as createFirebaseMockUser } from '../../__mocks__/firebase'

// Mock data factories

/**
 * Create a mock AudioSegment
 */
export const createMockAudioSegment = (overrides?: Partial<AudioSegment>): AudioSegment => ({
  audioUrl: 'https://example.com/audio.mp3',
  duration: 1.5,
  ...overrides,
})

/**
 * Create a single mock Phrase
 */
export const createMockPhrase = (index: number, overrides?: Partial<Phrase>): Phrase => ({
  input: `Input phrase ${index}`,
  translated: `Translation ${index}`,
  inputAudio: createMockAudioSegment({ audioUrl: `https://example.com/input-${index}.mp3` }),
  inputLang: 'en',
  inputVoice: 'en-US-Standard-A',
  outputAudio: createMockAudioSegment({ audioUrl: `https://example.com/output-${index}.mp3` }),
  targetLang: 'es',
  targetVoice: 'es-ES-Standard-A',
  romanized: `Romanized ${index}`,
  useRomanizedForAudio: false,
  created_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Create an array of mock Phrases
 */
export const createMockPhrases = (count: number, overrides?: Partial<Phrase>): Phrase[] => {
  return Array.from({ length: count }, (_, i) => createMockPhrase(i, overrides))
}

/**
 * Create a mock Firebase User
 */
export const createMockUser = createFirebaseMockUser

// Custom render function with providers

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: Record<string, unknown>
  initialProps?: Record<string, unknown>
}

/**
 * Custom render function that wraps components with necessary providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <UserContextProvider>
        <CollectionsProvider>
          {children}
        </CollectionsProvider>
      </UserContextProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { renderWithProviders as render }
