import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UserStatsModal } from '../../components/UserStatsModal'
import { User } from 'firebase/auth'
import React from 'react'

/**
 * UserStatsModal Tests
 *
 * Tests cover recent bug fixes:
 * - Bug #1: Crash when phrasesListened is undefined
 * - Bug #2: NaN in Today's Progress for viewed-only users
 * - Bug #3: "Invalid Date" in Recent Activity
 */

// Type definitions for Firestore mocks
interface MockDocumentSnapshot {
  exists: () => boolean
  data: () => Record<string, unknown>
}

interface MockQueryDocumentSnapshot {
  data: () => Record<string, unknown>
}

interface MockQuerySnapshot {
  docs: MockQueryDocumentSnapshot[]
}

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}))

// Mock UserContext
vi.mock('../../contexts/UserContext', () => ({
  useUser: vi.fn(() => ({
    userProfile: {
      nativeLanguage: 'en',
      preferredInputLang: 'en',
    }
  }))
}))

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-chart">Chart</div>
}))

// Mock languageUtils
vi.mock('../../utils/languageUtils', () => ({
  getFlagEmoji: () => `🏴‍☠️`,
  getLanguageName: (lang: string) => lang,
}))

// Mock rankingSystem
vi.mock('../../utils/rankingSystem', () => ({
  getPhraseRankTitle: () => ({
    title: 'Beginner',
    color: 'text-blue-500',
    description: 'Just getting started',
    nextMilestone: 100,
  }),
  getLanguageRankTitle: () => ({
    title: 'Novice',
    color: 'text-green-500',
    description: 'Learning the basics',
    nextMilestone: 50,
  }),
  PRODUCTION_PHRASE_RANKS: [
    { threshold: 0, title: 'Beginner' },
    { threshold: 100, title: 'Intermediate' },
  ],
  DEBUG_MILESTONE_THRESHOLDS: [
    { threshold: 0, title: 'Test Beginner' },
    { threshold: 10, title: 'Test Intermediate' },
  ],
}))

// Mock mixpanelClient
vi.mock('../../../lib/mixpanelClient', () => ({
  track: vi.fn(),
}))

describe('getDayTotal function - Unit Tests', () => {
  // We need to extract and test the getDayTotal function
  // Since it's not exported, we'll test its behavior through the component

  it('should handle undefined count (viewed-only user) - Bug #2', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 0,
      phrasesViewed: 12,
      lastViewedAt: '2025-01-15T12:00:00Z',
      currentStreak: 1,
    }

    const mockDailyStats = [
      {
        date: '2025-01-15',
        countViewed: 12,
        // count is undefined (not present)
        totalCount: 12,
        lastUpdated: '2025-01-15T12:00:00Z',
      }
    ]

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockDailyStats.map(stat => ({
        data: () => stat,
      })),
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Should NOT show NaN - this was the bug
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('should handle undefined countViewed (listened-only user)', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 10,
      phrasesViewed: 0,
      lastListenedAt: '2025-01-15T12:00:00Z',
      currentStreak: 1,
    }

    const mockDailyStats = [
      {
        date: '2025-01-15',
        count: 10,
        // countViewed is undefined
        totalCount: 10,
        lastUpdated: '2025-01-15T12:00:00Z',
      }
    ]

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockDailyStats.map(stat => ({
        data: () => stat,
      })),
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Should NOT show NaN
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('should handle both count and countViewed being undefined (new user)', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 0,
      phrasesViewed: 0,
      currentStreak: 0,
    }

    const mockDailyStats = [
      {
        date: '2025-01-15',
        // Both count and countViewed undefined
        totalCount: 0,
        lastUpdated: '2025-01-15T12:00:00Z',
      }
    ]

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockDailyStats.map(stat => ({
        data: () => stat,
      })),
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Should show 0, not NaN
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })
})

describe('UserStatsModal - Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Bug #1: should not crash when phrasesListened is undefined', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      // phrasesListened is undefined
      phrasesViewed: 12,
      lastViewedAt: '2025-01-15T12:00:00Z',
      currentStreak: 1,
    }

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    // Should not throw error
    expect(() => {
      render(
        <UserStatsModal
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
        />
      )
    }).not.toThrow()

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Should show 0 listened
    expect(screen.getByText(/0 listened/)).toBeInTheDocument()
  })

  it('Bug #2: should not show NaN in Today\'s Progress for viewed-only users', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 0,
      phrasesViewed: 12,
      lastViewedAt: '2025-01-15T12:00:00Z',
      currentStreak: 1,
    }

    const mockDailyStats = [
      {
        date: '2025-01-15',
        countViewed: 12,
        // count field missing (undefined)
        totalCount: 12,
        lastUpdated: '2025-01-15T12:00:00Z',
      }
    ]

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockDailyStats.map(stat => ({
        data: () => stat,
      })),
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Critical: Should NOT contain "NaN" anywhere in the document
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()

    // Should show viewed count with the number 12
    expect(screen.getByText(/12 viewed/)).toBeInTheDocument()
  })

  it('Bug #3: should not show "Invalid Date" in Recent Activity for viewed-only users', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 0,
      phrasesViewed: 12,
      // lastListenedAt is undefined
      lastViewedAt: '2025-01-15T12:00:00Z',
      currentStreak: 1,
    }

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Critical: Should NOT show "Invalid Date"
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument()

    // Should show either a valid date or "No activity yet"
    const hasValidDate = screen.queryByText(/\/\d{1,2}\/\d{4}/) !== null
    const hasNoActivity = screen.queryByText(/No activity yet/) !== null
    expect(hasValidDate || hasNoActivity).toBe(true)
  })

  it('should handle brand new user with no activity', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 0,
      phrasesViewed: 0,
      // No lastListenedAt or lastViewedAt
      currentStreak: 0,
    }

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Should show "No activity yet"
    expect(screen.getByText(/No activity yet/)).toBeInTheDocument()
  })

  it('should show most recent activity when both listened and viewed exist', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    const mockMainStats = {
      phrasesListened: 5,
      phrasesViewed: 12,
      lastListenedAt: '2025-01-14T12:00:00Z', // Yesterday
      lastViewedAt: '2025-01-15T12:00:00Z',   // Today (more recent)
      currentStreak: 2,
    }

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockMainStats,
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument()
    })

    // Should show the more recent date (lastViewedAt)
    // Format: 1/15/2025 or similar
    expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument()
  })
})

describe('UserStatsModal - Component Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    // Make getDocs return a promise that never resolves
    const neverResolve = new Promise<MockQuerySnapshot>(() => {})
    const neverResolveDoc = new Promise<MockDocumentSnapshot>(() => {})
    vi.mocked(getDocs).mockReturnValue(neverResolve as Promise<MockQuerySnapshot>)
    vi.mocked(getDoc).mockReturnValue(neverResolveDoc as Promise<MockDocumentSnapshot>)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    expect(screen.getByText(/Loading stats.../)).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const mockUser = { uid: 'test-user-123' } as User

    const { container } = render(
      <UserStatsModal
        isOpen={false}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should show "Your Stats" title', async () => {
    const { getDoc, getDocs } = await import('firebase/firestore')

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        phrasesListened: 10,
        phrasesViewed: 5,
        lastListenedAt: '2025-01-15T12:00:00Z',
        currentStreak: 1,
      }),
    } as MockDocumentSnapshot)

    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as MockQuerySnapshot)

    const mockUser = { uid: 'test-user-123' } as User

    render(
      <UserStatsModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Your Stats')).toBeInTheDocument()
    })
  })
})
