import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingModal } from '../../components/OnboardingModal'
import { createMockUser } from '../../__mocks__/firebase'
import { mockFirestore } from '../../__mocks__/firebase'
import { saveOnboardingData } from '../../utils/userPreferences'
import { createCollection } from '../../utils/collectionService'
import { trackOnboardingCompleted } from '../../../lib/mixpanelClient'
import type { QuerySnapshot } from 'firebase/firestore'

// Mock UserContext
const mockUser = createMockUser({
  uid: 'test-user-123',
  email: 'test@example.com',
})

const mockRefreshUserProfile = vi.fn()

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    isAuthLoading: false,
    needsOnboarding: true,
    refreshUserProfile: mockRefreshUserProfile,
  }),
}))

// Mock collectionService
vi.mock('../../utils/collectionService', () => ({
  createCollection: vi.fn(() => Promise.resolve('collection-id-123')),
}))

// Mock userPreferences
vi.mock('../../utils/userPreferences', () => ({
  saveOnboardingData: vi.fn(() => Promise.resolve()),
}))

// Mock Firestore
vi.mock('firebase/firestore', async () => {
  const mocks = await import('../../__mocks__/firebase')
  return {
    getFirestore: mocks.getFirestore,
    collection: mocks.mockFirestore.collection,
    doc: mocks.mockFirestore.doc,
    getDoc: mocks.mockFirestore.getDoc,
    getDocs: mocks.mockFirestore.getDocs,
    setDoc: mocks.mockFirestore.setDoc,
    addDoc: mocks.mockFirestore.addDoc,
    query: mocks.mockFirestore.query,
    orderBy: mocks.mockFirestore.orderBy,
    limit: mocks.mockFirestore.limit,
  }
})

describe('OnboardingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFirestore.getDocs.mockResolvedValue({
      docs: [],
      empty: true,
    } as unknown as QuerySnapshot)
  })

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<OnboardingModal isOpen={false} onComplete={vi.fn()} />)
      expect(screen.queryByText('Welcome to Language Shadowing!')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)
      expect(screen.getByText('Welcome to Language Shadowing!')).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('should start on languages step', () => {
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)
      expect(screen.getByText('Choose Your Languages')).toBeInTheDocument()
    })

    it('should navigate to ability step when continue is clicked', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })
    })

    it('should navigate back from ability to languages step', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Go to ability step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText('Choose Your Languages')).toBeInTheDocument()
      })
    })

    it('should navigate to preferences step from ability step', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Go to ability step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      // Go to preferences step
      const continueButton = screen.getAllByRole('button', { name: /continue/i })[0]
      await user.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })
    })

    it('should navigate back from preferences to ability step', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Navigate to preferences step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      // Go back
      const backButton = screen.getAllByRole('button', { name: /back/i })[0]
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })
    })
  })

  describe('Language Selection', () => {
    it('should use preselected languages when provided', () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={vi.fn()}
          preselectedInputLang="en-GB"
          preselectedTargetLang="es-ES"
        />
      )

      expect(screen.getByText('Input Language')).toBeInTheDocument()
      expect(screen.getByText('Target Language')).toBeInTheDocument()
    })

    it('should show message about preselected languages', () => {
      render(
        <OnboardingModal
          isOpen={true}
          onComplete={vi.fn()}
          preselectedInputLang="en-GB"
          preselectedTargetLang="es-ES"
        />
      )

      expect(
        screen.getByText(/We've pre-selected your languages from sign-up/i)
      ).toBeInTheDocument()
    })
  })

  describe('Ability Level Selection', () => {
    it('should allow selecting ability level', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Navigate to ability step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/intermediate/i)).toBeInTheDocument()
      })

      // Select intermediate level
      const intermediateButton = screen.getByText(/intermediate/i)
      await user.click(intermediateButton)

      // Continue to next step
      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })
    })
  })

  describe('Content Preferences Selection', () => {
    it('should require at least 3 preferences before completing', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Navigate to preferences step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      // Complete button should be disabled with less than 3 preferences
      const completeButton = screen.getByRole('button', { name: /complete setup/i })
      expect(completeButton).toBeDisabled()
    })

    it('should enable complete button when 3+ preferences are selected', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Navigate to preferences step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      // Select 3 preferences
      const businessButton = screen.getByText(/business/i)
      const travelButton = screen.getByText(/travel/i)
      const foodButton = screen.getByText(/food/i)

      await user.click(businessButton)
      await user.click(travelButton)
      await user.click(foodButton)

      // Complete button should be enabled
      const completeButton = screen.getByRole('button', { name: /complete setup/i })
      expect(completeButton).not.toBeDisabled()
    })
  })

  describe('Onboarding Completion', () => {
    it('should save onboarding data and create default collection on complete', async () => {
      const user = userEvent.setup()
      const onComplete = vi.fn()
      render(<OnboardingModal isOpen={true} onComplete={onComplete} />)

      // Navigate through all steps
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      // Select 3 preferences
      await user.click(screen.getByText(/business/i))
      await user.click(screen.getByText(/travel/i))
      await user.click(screen.getByText(/food/i))

      // Complete onboarding
      const completeButton = screen.getByRole('button', { name: /complete setup/i })
      await user.click(completeButton)

      await waitFor(() => {
        expect(saveOnboardingData).toHaveBeenCalledWith(
          'test-user-123',
          expect.objectContaining({
            abilityLevel: 'beginner',
            inputLang: expect.any(String),
            targetLang: expect.any(String),
            contentPreferences: expect.arrayContaining([
            'business',
            'travel',
            'food',
          ]),
          }),
          mockUser
        )
      })

      // Check that default collection creation is attempted
      await waitFor(() => {
        expect(createCollection).toHaveBeenCalled()
      })

      // Check that analytics tracking is called
      await waitFor(() => {
        expect(trackOnboardingCompleted).toHaveBeenCalledWith(
          'test-user-123',
          'beginner',
          expect.any(String),
          expect.any(String)
        )
      })
    })

    it('should not create default collection if user already has collections', async () => {
      // Mock user with existing collections
      mockFirestore.getDocs.mockResolvedValue({
        docs: [{ id: 'existing-collection' }],
        empty: false,
      } as unknown as QuerySnapshot)

      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Navigate through all steps
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      // Select 3 preferences
      await user.click(screen.getByText(/business/i))
      await user.click(screen.getByText(/travel/i))
      await user.click(screen.getByText(/food/i))

      // Complete onboarding
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      await waitFor(() => {
        expect(saveOnboardingData).toHaveBeenCalled()
      })

      // Should not create collection since user already has one
      await waitFor(() => {
        expect(createCollection).not.toHaveBeenCalled()
      })
    })

    it('should show completion screen after successful onboarding', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Complete onboarding flow
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/business/i))
      await user.click(screen.getByText(/travel/i))
      await user.click(screen.getByText(/food/i))
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      // Wait for completion screen
      await waitFor(() => {
        expect(screen.getByText('All Set! 🎉')).toBeInTheDocument()
        expect(screen.getByText('Start Learning')).toBeInTheDocument()
      })
    })

    it('should call onComplete when Start Learning is clicked', async () => {
      const user = userEvent.setup()
      const onComplete = vi.fn()
      render(<OnboardingModal isOpen={true} onComplete={onComplete} />)

      // Complete onboarding flow
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/business/i))
      await user.click(screen.getByText(/travel/i))
      await user.click(screen.getByText(/food/i))
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      // Click Start Learning
      await waitFor(() => {
        expect(screen.getByText('Start Learning')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Start Learning'))
      expect(onComplete).toHaveBeenCalled()
    })

    it('should show loading state during completion', async () => {
      // Mock slow saveOnboardingData
      saveOnboardingData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(), 100))
      )

      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Navigate to preferences and select 3
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      await user.click(screen.getAllByRole('button', { name: /continue/i })[0])
      await waitFor(() => {
        expect(screen.getByText(/business/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/business/i))
      await user.click(screen.getByText(/travel/i))
      await user.click(screen.getByText(/food/i))

      // Click complete
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })

  describe('Progress Indicator', () => {
    it('should show correct progress on languages step', () => {
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)
      
      // Check that step 1 is active
      const step1 = screen.getByText('1')
      expect(step1).toBeInTheDocument()
    })

    it('should update progress indicator when navigating steps', async () => {
      const user = userEvent.setup()
      render(<OnboardingModal isOpen={true} onComplete={vi.fn()} />)

      // Move to ability step
      await user.click(screen.getByRole('button', { name: /continue/i }))
      await waitFor(() => {
        expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      })

      // Step 2 should now be active
      const step2 = screen.getByText('2')
      expect(step2).toBeInTheDocument()
    })
  })
})

