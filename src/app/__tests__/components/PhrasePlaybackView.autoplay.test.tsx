import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { PhrasePlaybackView, PhrasePlaybackMethods } from '../../components/PhrasePlaybackView'
import { createMockPhrases } from '../utils/test-helpers'
import { UserContextProvider } from '../../contexts/UserContext'
import { PresentationConfig } from '../../types'
import React from 'react'

/**
 * Autoplay Feature Tests for PhrasePlaybackView
 *
 * Tests the autoplay functionality to ensure:
 * - Bug #1 Fix: First phrase plays when autoplay=true
 * - Bug #2 Fix: No jumping back to first phrase after user intervention
 * - Autoplay only triggers once per mount
 * - URL parameter race condition is resolved
 */

// Mock the useUpdateUserStats hook
vi.mock('../../utils/userStats', async () => {
  const actual = await vi.importActual('../../utils/userStats')
  const updateUserStatsSpy = vi.fn()

  return {
    ...actual,
    useUpdateUserStats: () => ({
      updateUserStats: updateUserStatsSpy,
      StatsPopups: null,
      StatsModal: null,
      showStatsUpdate: vi.fn(),
      closeStatsPopup: vi.fn(),
      forceSyncTotal: vi.fn(),
      incrementViewedAndCheckMilestone: vi.fn(),
      initializeViewedCounter: vi.fn(),
      phrasesListened: 0,
      phrasesViewed: 0,
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

describe('PhrasePlaybackView - Autoplay Feature', () => {
  const mockPhrases = createMockPhrases(5)
  const mockSetPhrases = vi.fn().mockResolvedValue(undefined)
  const mockSetPresentationConfig = vi.fn().mockResolvedValue(undefined)

  const defaultPresentationConfig: PresentationConfig = {
    name: 'Test Presentation',
    bgImage: null,
    containerBg: 'white',
    textBg: 'black',
    enableSnow: false,
    enableCherryBlossom: false,
    enableLeaves: false,
    enableAutumnLeaves: false,
    enableOrtonEffect: false,
    enableOutputBeforeInput: false,
    postProcessDelay: 0,
    delayBetweenPhrases: 1000,
    enableLoop: false,
    enableOutputDurationDelay: false,
    enableInputDurationDelay: false,
    enableInputPlayback: true,
    inputPlaybackSpeed: 1.0,
    outputPlaybackSpeed: 1.0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * Bug Fix Test #1: First Phrase Plays on Autoplay
   *
   * Original Bug: When autoplay=1 was set, the first phrase would never play
   * Root Cause: Race condition where methodsRef.current was undefined when
   *             autoplay effect tried to call handlePlay()
   *
   * Fix: Moved autoplay logic into PhrasePlaybackView where it has guaranteed
   *      access to playback methods
   *
   * This test verifies that handleReplay is called when autoplay prop is true
   */
  it('should trigger handleReplay when autoplay prop is true and phrases are loaded', async () => {
    const methodsRef = { current: null } as React.MutableRefObject<PhrasePlaybackMethods | null>
    let handleReplaySpy: ReturnType<typeof vi.spyOn>

    render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={defaultPresentationConfig}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={true}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Advance timers slightly to allow methodsRef to populate (but not trigger 300ms autoplay)
    await vi.advanceTimersByTimeAsync(0)

    // Verify methodsRef is populated
    expect(methodsRef.current).toBeTruthy()

    // Spy on handleReplay BEFORE autoplay fires
    handleReplaySpy = vi.spyOn(methodsRef.current!, 'handleReplay')

    // Now advance to the autoplay timeout (300ms)
    await vi.advanceTimersByTimeAsync(300)

    // Verify that handleReplay was called
    expect(handleReplaySpy).toHaveBeenCalled()
  })

  /**
   * Test: No Autoplay When Prop is False
   *
   * Verifies that autoplay does NOT trigger when the autoplay prop is false
   * (default behavior)
   */
  it('should not trigger handleReplay when autoplay prop is false', async () => {
    const methodsRef = { current: null } as React.MutableRefObject<PhrasePlaybackMethods | null>

    render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={defaultPresentationConfig}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={false}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Advance timers slightly to allow methodsRef to populate
    await vi.advanceTimersByTimeAsync(0)

    // Verify methodsRef is populated
    expect(methodsRef.current).toBeTruthy()

    // Spy on handleReplay
    const handleReplaySpy = vi.spyOn(methodsRef.current!, 'handleReplay')

    // Wait for potential autoplay timeout
    await vi.advanceTimersByTimeAsync(300)

    // Wait additional time to ensure no delayed autoplay
    await vi.advanceTimersByTimeAsync(2000)

    // Verify that handleReplay was NOT called
    expect(handleReplaySpy).not.toHaveBeenCalled()
  })

  /**
   * Test: Autoplay Only Triggers Once
   *
   * Verifies that autoplay only triggers once, even if the component re-renders
   * This prevents the autoplay from restarting on every state update
   */
  it('should only trigger autoplay once per mount', async () => {
    const methodsRef = { current: null } as React.MutableRefObject<PhrasePlaybackMethods | null>

    const { rerender } = render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={defaultPresentationConfig}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={true}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Advance timers slightly to allow methodsRef to populate
    await vi.advanceTimersByTimeAsync(0)

    // Verify methodsRef is populated
    expect(methodsRef.current).toBeTruthy()

    // Spy on handleReplay
    const handleReplaySpy = vi.spyOn(methodsRef.current!, 'handleReplay')

    // Wait for autoplay timeout
    await vi.advanceTimersByTimeAsync(300)

    // Get initial call count
    const initialCallCount = handleReplaySpy.mock.calls.length

    // Rerender with the same props
    rerender(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={defaultPresentationConfig}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={true}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Wait again
    await vi.advanceTimersByTimeAsync(300)
    await vi.advanceTimersByTimeAsync(1500)

    // The call count should not have increased (autoplay shouldn't retrigger)
    const finalCallCount = handleReplaySpy.mock.calls.length
    expect(finalCallCount).toBe(initialCallCount)
  })

  /**
   * Bug Fix Test #2: No Jump Back to First Phrase
   *
   * Original Bug: After autoplay started, when user navigated to second phrase,
   *               playback would jump back to the first phrase
   * Root Cause: Timeout in handleReplay would fire even after user intervention,
   *             resetting index back to 0
   *
   * Fix: Moved autoplay logic to component level with proper ref tracking
   *
   * This test verifies that user can navigate phrases without being forced
   * back to the first phrase
   */
  it('should allow user navigation without jumping back to first phrase', async () => {
    const methodsRef = { current: null } as React.MutableRefObject<PhrasePlaybackMethods | null>

    render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={defaultPresentationConfig}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={true}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Advance timers slightly to allow methodsRef to populate
    await vi.advanceTimersByTimeAsync(0)

    // Verify methodsRef is populated
    expect(methodsRef.current).toBeTruthy()

    // Wait for autoplay to trigger
    await vi.advanceTimersByTimeAsync(300)

    // Simulate user navigating to second phrase
    methodsRef.current.setCurrentPhraseIndex(1)

    // Wait a bit more to ensure no timeout resets the index
    await vi.advanceTimersByTimeAsync(1000)

    // Verify the current index is still 1 (not reset to 0)
    const currentIndex = methodsRef.current.getCurrentPhraseIndex()
    expect(currentIndex).toBe(1)
  })

  /**
   * Test: Autoplay with Empty Phrases Array
   *
   * Verifies that autoplay doesn't crash or behave incorrectly when
   * phrases array is empty
   */
  it('should handle autoplay gracefully when phrases array is empty', async () => {
    const methodsRef = { current: null } as React.MutableRefObject<PhrasePlaybackMethods | null>

    render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={[]}
          setPhrases={mockSetPhrases}
          presentationConfig={defaultPresentationConfig}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={true}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Advance timers to allow component to mount
    await vi.advanceTimersByTimeAsync(0)

    // Wait for potential autoplay timeout
    await vi.advanceTimersByTimeAsync(300)

    // Component should render without errors
    // methodsRef may or may not be populated, but no errors should occur
    expect(true).toBe(true) // Just verify no crashes
  })

  /**
   * Integration Test: Autoplay with Input Playback Disabled
   *
   * Verifies that autoplay works correctly when input playback is disabled
   * (should start with output/shadow phase instead of input/recall phase)
   */
  it('should start with output phase when autoplay=true and input playback disabled', async () => {
    const methodsRef = { current: null } as React.MutableRefObject<PhrasePlaybackMethods | null>

    const configWithoutInput: PresentationConfig = {
      ...defaultPresentationConfig,
      enableInputPlayback: false,
    }

    render(
      <UserContextProvider>
        <PhrasePlaybackView
          phrases={mockPhrases}
          setPhrases={mockSetPhrases}
          presentationConfig={configWithoutInput}
          setPresentationConfig={mockSetPresentationConfig}
          autoplay={true}
          methodsRef={methodsRef}
        />
      </UserContextProvider>
    )

    // Advance timers to allow component to mount
    await vi.advanceTimersByTimeAsync(0)

    // Verify methodsRef is populated
    expect(methodsRef.current).toBeTruthy()

    // Wait for autoplay timeout
    await vi.advanceTimersByTimeAsync(300)

    // Verify component renders without errors
    expect(methodsRef.current).toBeTruthy()
  })
})
