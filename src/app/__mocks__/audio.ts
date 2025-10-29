import { vi } from 'vitest'

export class MockAudio {
  src: string = ''
  currentTime: number = 0
  duration: number = 0
  paused: boolean = true
  playbackRate: number = 1
  volume: number = 1
  muted: boolean = false
  ended: boolean = false

  onplay: (() => void) | null = null
  onended: (() => void) | null = null
  onpause: (() => void) | null = null
  onerror: ((error: any) => void) | null = null
  onloadedmetadata: (() => void) | null = null

  addEventListener = vi.fn((event: string, handler: () => void) => {
    if (event === 'play') this.onplay = handler
    if (event === 'ended') this.onended = handler
    if (event === 'pause') this.onpause = handler
    if (event === 'error') this.onerror = handler as any
    if (event === 'loadedmetadata') this.onloadedmetadata = handler
  })

  removeEventListener = vi.fn()

  play = vi.fn(() => {
    this.paused = false
    this.onplay?.()
    return Promise.resolve()
  })

  pause = vi.fn(() => {
    this.paused = true
    this.onpause?.()
  })

  load = vi.fn()

  // Simulate audio ending
  simulateEnded() {
    this.ended = true
    this.paused = true
    this.currentTime = this.duration
    this.onended?.()
  }

  // Simulate audio play event
  simulatePlay() {
    this.paused = false
    this.onplay?.()
  }
}

// Helper to create a mock audio element
export const createMockAudio = () => {
  const audio = new MockAudio()
  // Set default duration
  audio.duration = 1.5
  return audio
}

// Mock the global Audio constructor
export const mockAudioGlobal = () => {
  global.Audio = MockAudio as any
}
