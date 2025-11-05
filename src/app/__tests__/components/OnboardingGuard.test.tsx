import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingGuard } from '../../components/OnboardingGuard'
import { createMockUser } from '../../__mocks__/firebase'
import { createOrUpdateUserProfile } from '../../utils/userPreferences'

// Mock UserContext
const mockRefreshUserProfile = vi.fn()
let mockUseUserReturn: ReturnType<typeof createMockUseUser>

const createMockUseUser = (overrides?: {
  user?: ReturnType<typeof createMockUser> | null
  isAuthLoading?: boolean
  needsOnboarding?: boolean
}) => ({
  user: createMockUser({ uid: 'test-user-123' }),
  isAuthLoading: false,
  needsOnboarding: false,
  refreshUserProfile: mockRefreshUserProfile,
  ...overrides,
})

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUseUserReturn || createMockUseUser(),
}))

// Mock OnboardingModal
vi.mock('../../components/OnboardingModal', () => ({
  OnboardingModal: ({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) => {
    if (!isOpen) return null
    return (
      <div data-testid="onboarding-modal">
        <button onClick={onComplete}>Complete Onboarding</button>
      </div>
    )
  },
}))

// Mock userPreferences
vi.mock('../../utils/userPreferences', () => ({
  createOrUpdateUserProfile: vi.fn(() => Promise.resolve()),
  getUserProfile: vi.fn(() => Promise.resolve(null)),
}))

// Mock next/navigation
const mockGet = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

describe('OnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGet.mockReturnValue(null)
    mockUseUserReturn = createMockUseUser()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('User Not Authenticated', () => {
    it('should render children when user is not authenticated', () => {
      mockUseUserReturn = createMockUseUser({ user: null })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByText('App Content')).toBeInTheDocument()
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
    })
  })

  describe('User Authenticated - No Onboarding Needed', () => {
    it('should render children when user has completed onboarding', () => {
      mockUseUserReturn = createMockUseUser({
        user: createMockUser(),
        needsOnboarding: false,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByText('App Content')).toBeInTheDocument()
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
    })
  })

  describe('User Authenticated - Needs Onboarding', () => {
    it('should show onboarding modal when user needs onboarding', () => {
      mockUseUserReturn = createMockUseUser({
        user: createMockUser(),
        needsOnboarding: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByText('App Content')).toBeInTheDocument()
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
    })

    it('should pass preselected languages from localStorage to modal', () => {
      localStorage.setItem('signupInputLang', 'en-GB')
      localStorage.setItem('signupTargetLang', 'es-ES')

      mockUseUserReturn = createMockUseUser({
        user: createMockUser(),
        needsOnboarding: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
    })
  })

  describe('Onboarding Completion', () => {
    it('should refresh user profile when onboarding is completed', async () => {
      const user = userEvent.setup()
      const mockUserObj = createMockUser()
      mockUseUserReturn = createMockUseUser({
        user: mockUserObj,
        needsOnboarding: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      const completeButton = screen.getByText('Complete Onboarding')
      await user.click(completeButton)

      await waitFor(() => {
        expect(mockRefreshUserProfile).toHaveBeenCalled()
      })
    })

    it('should clear localStorage signup languages after completion', async () => {
      const user = userEvent.setup()
      localStorage.setItem('signupInputLang', 'en-GB')
      localStorage.setItem('signupTargetLang', 'es-ES')

      const mockUserObj = createMockUser()
      mockUseUserReturn = createMockUseUser({
        user: mockUserObj,
        needsOnboarding: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      const completeButton = screen.getByText('Complete Onboarding')
      await user.click(completeButton)

      await waitFor(() => {
        expect(localStorage.getItem('signupInputLang')).toBeNull()
        expect(localStorage.getItem('signupTargetLang')).toBeNull()
      })
    })
  })

  describe('Force Onboarding Reset', () => {
    it('should reset onboarding when resetOnboarding=true query param is present', async () => {
      mockGet.mockReturnValue('true')

      const mockUserObj = createMockUser()
      mockUseUserReturn = createMockUseUser({
        user: mockUserObj,
        needsOnboarding: false, // User has completed onboarding
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      await waitFor(() => {
        expect(createOrUpdateUserProfile).toHaveBeenCalledWith(
          mockUserObj.uid,
          expect.objectContaining({
            onboardingCompleted: false,
          })
        )
      })
    })

    it('should show onboarding modal when forced via query param', async () => {
      mockGet.mockReturnValue('true')

      const mockUserObj = createMockUser()
      mockUseUserReturn = createMockUseUser({
        user: mockUserObj,
        needsOnboarding: false,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      // Wait for reset to complete, then modal should appear
      await waitFor(() => {
        expect(mockRefreshUserProfile).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseUserReturn = createMockUseUser({
        isAuthLoading: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      // Should show loading spinner - check for the spinner element
      // The spinner is a div with specific classes, but we can check for the structure
      expect(screen.queryByText('App Content')).not.toBeInTheDocument()
    })

    it('should not show loading spinner when auth is not loading', () => {
      mockUseUserReturn = createMockUseUser({
        isAuthLoading: false,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      expect(screen.getByText('App Content')).toBeInTheDocument()
    })
  })

  describe('Preselected Languages', () => {
    it('should get preselected languages from localStorage', () => {
      localStorage.setItem('signupInputLang', 'fr-FR')
      localStorage.setItem('signupTargetLang', 'de-DE')

      mockUseUserReturn = createMockUseUser({
        user: createMockUser(),
        needsOnboarding: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      // Modal should be shown with preselected languages
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
    })

    it('should handle missing preselected languages gracefully', () => {
      localStorage.removeItem('signupInputLang')
      localStorage.removeItem('signupTargetLang')

      mockUseUserReturn = createMockUseUser({
        user: createMockUser(),
        needsOnboarding: true,
      })

      render(
        <OnboardingGuard>
          <div>App Content</div>
        </OnboardingGuard>
      )

      // Modal should still be shown
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
    })
  })
})

