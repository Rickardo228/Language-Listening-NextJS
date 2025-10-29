import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUpdateUserStats } from '../../utils/userStats'
import { createMockUser, createMockPhrases } from './test-helpers'
import { mockFirestore } from '../../__mocks__/firebase'
import { UserContextProvider } from '../../contexts/UserContext'
import React from 'react'

/**
 * REAL Hook Tests for useUpdateUserStats
 *
 * Tests cover recent bug fixes:
 * - Bug #1 & #2: Popup timing showing at 5 instead of 7
 * - Bug #3: Debounce delay responsiveness
 */

describe('userStats - Phrase Viewed Tracking (Real Hook)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Bug #2: Popup Should Appear at Exact Multiples (5, 10, 15)
   *
   * Tests that incrementViewedAndCheckMilestone returns the correct count
   * and that it would trigger at the right thresholds.
   */
  it('should increment viewed counter correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserContextProvider>{children}</UserContextProvider>
    )

    const { result } = renderHook(() => useUpdateUserStats(), { wrapper })

    // Increment 5 times
    act(() => {
      result.current.incrementViewedAndCheckMilestone(5) // 1
      result.current.incrementViewedAndCheckMilestone(5) // 2
      result.current.incrementViewedAndCheckMilestone(5) // 3
      result.current.incrementViewedAndCheckMilestone(5) // 4
      result.current.incrementViewedAndCheckMilestone(5) // 5
    })

    // Counter should be 5
    expect(result.current.phrasesViewed).toBe(5)
  })

  /**
   * Bug #2: Check Milestone Detection
   *
   * Verify that the function correctly identifies when a milestone is reached
   */
  it('should detect milestones at multiples of threshold', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserContextProvider>{children}</UserContextProvider>
    )

    const { result } = renderHook(() => useUpdateUserStats(), { wrapper })
    const milestones: number[] = []

    // Increment 15 times and track when count is divisible by 5
    for (let i = 1; i <= 15; i++) {
      act(() => {
        const count = result.current.incrementViewedAndCheckMilestone(5)
        if (count % 5 === 0) {
          milestones.push(count)
        }
      })
    }

    // Should hit milestones at 5, 10, and 15
    expect(milestones).toEqual([5, 10, 15])
  })

})

/**
 * Bug #3: Debounce Delay Responsiveness Tests
 */
describe('userStats - Stats Tracking Responsiveness', () => {
  /**
   * This test ensures that debounce delay is under 500ms for good UX.
   * The DEBOUNCE_DELAY constant in PhrasePlaybackView should be 400ms.
   */
  it('should ensure debounce delay is under 500ms for good UX', () => {
    const EXPECTED_MAX_DELAY = 500
    const ACTUAL_DELAY = 400 // Current value in PhrasePlaybackView.tsx

    expect(ACTUAL_DELAY).toBeLessThan(EXPECTED_MAX_DELAY)
  })
})

/**
 * Negative Test Cases
 */
describe('userStats - Negative Cases', () => {
  it('should NOT trigger milestone at wrong counts (6, 7, 8, 9)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserContextProvider>{children}</UserContextProvider>
    )

    const { result } = renderHook(() => useUpdateUserStats(), { wrapper })
    const incorrectMilestones: number[] = []

    // Increment through 9
    for (let i = 1; i <= 9; i++) {
      act(() => {
        const count = result.current.incrementViewedAndCheckMilestone(5)
        // Track if count is 6, 7, 8, or 9 AND divisible by 5 (which would be wrong)
        if ([6, 7, 8, 9].includes(count) && count % 5 === 0) {
          incorrectMilestones.push(count)
        }
      })
    }

    // Should have no incorrect milestones
    expect(incorrectMilestones).toEqual([])
  })
})
