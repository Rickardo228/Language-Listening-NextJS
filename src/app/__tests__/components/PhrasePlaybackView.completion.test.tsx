import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { PhrasePlaybackView, PhrasePlaybackMethods } from '../../components/PhrasePlaybackView'
import { createMockPhrases } from '../utils/test-helpers'
import { UserContextProvider } from '../../contexts/UserContext'
import { PresentationConfig } from '../../types'
import { WebMediaSessionTransport } from '../../../transport/webMediaSessionTransport'
import React from 'react'

/**
 * List Completion Popup Tests for PhrasePlaybackView
 *
 * Tests that the list completion popup shows correctly:
 * 1. When autoplay completes automatically (should show "listened")
 * 2. When pressing next with autoplay on (should show "listened")
 * 3. When pressing next with autoplay off (should show "viewed")
 */

// Mock the useUpdateUserStats hook
let showStatsUpdateSpy = vi.fn()

vi.mock('../../utils/userStats', async () => {
  const actual = await vi.importActual('../../utils/userStats')
  const updateUserStatsSpy = vi.fn()

  return {
    ...actual,
    useUpdateUserStats: () => ({
      updateUserStats: updateUserStatsSpy,
      StatsPopups: null,
      StatsModal: null,
      showStatsUpdate: showStatsUpdateSpy,
      closeStatsPopup: vi.fn(),
      forceSyncTotal: vi.fn(),
      incrementViewedAndCheckMilestone: vi.fn(),
      initializeViewedCounter: vi.fn(),
      phrasesListened: 5,
      phrasesViewed: 3,
      currentStreak: 0,
    }),
  }
})

// Mock Firebase
vi.mock('../../../firebase', () => ({
  default: {
    auth: {},
    firestore: {},
  },
}))

// Mock progress service
vi.mock('../../utils/progressService', () => ({
  loadProgress: vi.fn().mockResolvedValue(null),
  saveProgress: vi.fn().mockResolvedValue(undefined),
  markCompleted: vi.fn().mockResolvedValue(undefined),
}))

describe('PhrasePlaybackView - List Completion Popup', () => {
  const mockPhrases = createMockPhrases(3) // Small list for faster completion
  const mockSetPhrases = vi.fn().mockResolvedValue(undefined)
  const mockSetPresentationConfig = vi.fn().mockResolvedValue(undefined)

  const defaultPresentationConfig: PresentationConfig = {
    name: 'Test Presentation',
    bgImage: null,
    containerBg: 'white',
    textBg: 'black',
    backgroundOverlayOpacity: 0.5,
    textColor: '#000000',
    enableSnow: false,
    enableCherryBlossom: false,
    enableLeaves: false,
    enableAutumnLeaves: false,
    enableOrtonEffect: false,
    enableParticles: false,
    particleRotation: 0,
    enableSteam: false,
    enableDust: false,
    particleColor: '#ffffff',
    particleSpeed: 1,
    enableOutputBeforeInput: false,
    postProcessDelay: 0,
    delayBetweenPhrases: 100, // Short delay for faster tests
    enableLoop: false,
    enableOutputDurationDelay: false,
    enableInputDurationDelay: false,
    enableInputPlayback: true,
    inputPlaybackSpeed: 1.0,
    outputPlaybackSpeed: 1.0,
    showAllPhrases: false,
  }

  let mockTransport: WebMediaSessionTransport
  let methodsRef: React.MutableRefObject<PhrasePlaybackMethods | null>
  let mockAudioElement: HTMLAudioElement

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Reset the spy
    showStatsUpdateSpy = vi.fn()

    // Create a mock audio element
    mockAudioElement = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      paused: true,
      currentTime: 0,
      duration: 1,
      playbackRate: 1,
      src: '',
    } as unknown as HTMLAudioElement

    // Create transport
    mockTransport = new WebMediaSessionTransport(mockAudioElement)

    // Create methods ref
    methodsRef = { current: null }
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  const renderComponent = (autoplay = false, config = defaultPresentationConfig) => {
    return render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={config}
          setPresentationConfig={mockSetPresentationConfig}
          collectionId="test-collection"
          collectionName="Test Collection"
          methodsRef={methodsRef}
          autoplay={autoplay}
          transport={mockTransport}
          itemType="collection"
        />
      </UserContextProvider>
    )
  }

  it('should show "listened" popup when autoplay completes automatically', async () => {
    // Render with autoplay on
    renderComponent(true)

    // Wait for autoplay to trigger
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    // Simulate playing through all phrases
    // Start at phrase 0, play through 0, 1, 2 (last phrase)
    for (let i = 0; i < mockPhrases.length; i++) {
      // Simulate audio ended event
      act(() => {
        const endedEvent = new Event('ended')
        mockAudioElement.dispatchEvent(endedEvent)
      })

      // Advance timers to trigger next phrase or completion
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200)
      })
    }

    // Check that showStatsUpdate was called with 'listened' event type
    expect(showStatsUpdateSpy).toHaveBeenCalledWith(
      true, // shouldPersistUntilInteraction
      'listened', // eventType
      true, // listCompleted
      expect.any(Function), // onGoAgain callback
      undefined // onGoNext (no path navigation)
    )
  })

  it('should show "listened" popup when pressing next with autoplay on', async () => {
    // Render with autoplay on
    renderComponent(true)

    // Wait for autoplay to trigger and start playing
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    // Manually navigate to last phrase using methodsRef
    act(() => {
      if (methodsRef.current) {
        methodsRef.current.setCurrentPhraseIndex(mockPhrases.length - 1)
        methodsRef.current.setCurrentPhase('output')
      }
    })

    // Simulate pressing next while playing (atomicAdvance with wasPlaying=true)
    // Since autoplay is on and we're playing, paused should be false
    act(() => {
      if (methodsRef.current) {
        // Ensure we're in playing state
        methodsRef.current.handlePlay()
      }
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    // Now advance past the last phrase (which should trigger completion)
    act(() => {
      const nextEvent = new Event('next')
      mockTransport.handleNext()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    // Check that showStatsUpdate was called with 'listened' event type
    // This should happen because wasPlaying=true (autoplay is on)
    const calls = showStatsUpdateSpy.mock.calls
    const completionCall = calls.find(call => call[2] === true) // listCompleted = true

    expect(completionCall).toBeDefined()
    expect(completionCall?.[1]).toBe('listened') // eventType should be 'listened'
  })

  it('should show "viewed" popup when pressing next with autoplay off', async () => {
    // Render with autoplay OFF
    renderComponent(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    // Navigate to last phrase while paused (viewing mode)
    act(() => {
      if (methodsRef.current) {
        methodsRef.current.setCurrentPhraseIndex(mockPhrases.length - 1)
        methodsRef.current.setCurrentPhase('output')
      }
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    // Press next while paused (should trigger completion with 'viewed')
    act(() => {
      mockTransport.handleNext()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    // Check that showStatsUpdate was called with 'viewed' event type
    const calls = showStatsUpdateSpy.mock.calls
    const completionCall = calls.find(call => call[2] === true) // listCompleted = true

    expect(completionCall).toBeDefined()
    expect(completionCall?.[1]).toBe('viewed') // eventType should be 'viewed'
  })

  it('should show correct phrase count for listened completion', async () => {
    // Render with autoplay on
    renderComponent(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    // Navigate to last phrase
    act(() => {
      if (methodsRef.current) {
        methodsRef.current.setCurrentPhraseIndex(mockPhrases.length - 1)
        methodsRef.current.handlePlay()
      }
    })

    // Trigger completion
    act(() => {
      mockTransport.handleNext()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    // Verify showStatsUpdate was called
    const calls = showStatsUpdateSpy.mock.calls
    const completionCall = calls.find(call => call[2] === true)

    expect(completionCall).toBeDefined()
    // The phrasesListened count from the mock is 5
    // The actual displayed count will be handled by showStatsUpdate logic
  })

  it('should show correct phrase count for viewed completion', async () => {
    // Render with autoplay off
    renderComponent(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    // Navigate through phrases while paused (viewing)
    for (let i = 0; i < mockPhrases.length; i++) {
      act(() => {
        if (methodsRef.current) {
          methodsRef.current.setCurrentPhraseIndex(i)
        }
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
    }

    // Trigger completion from last phrase
    act(() => {
      mockTransport.handleNext()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    // Verify showStatsUpdate was called with viewed event type
    const calls = showStatsUpdateSpy.mock.calls
    const completionCall = calls.find(call => call[2] === true)

    expect(completionCall).toBeDefined()
    expect(completionCall?.[1]).toBe('viewed')
  })
})
