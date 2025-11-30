import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockUser, mockAuth } from '../__mocks__/firebase'
import { track } from '../../lib/mixpanelClient'

// Mock Firebase auth
vi.mock('../firebase', async () => {
    const mocks = await import('../__mocks__/firebase')
    return {
        auth: mocks.mockAuth,
    }
})

// Mock next/navigation
const mockPush = vi.fn()
const mockRouter = {
    push: mockPush,
}

vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}))

// Mock user preferences
vi.mock('../utils/userPreferences', () => ({
    getUserProfile: vi.fn(() =>
        Promise.resolve({
            emailNotificationsEnabled: true,
            practiceReminderEnabled: true,
            weeklyStatsEnabled: true,
        })
    ),
    createOrUpdateUserProfile: vi.fn(() => Promise.resolve()),
}))

// Mock Mixpanel
vi.mock('../../lib/mixpanelClient', () => ({
    track: vi.fn(),
}))

// Mock EmailNotificationPreferencesModal component
interface MockModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: { email?: string | null } | null;
}

vi.mock('../components/EmailNotificationPreferencesModal', () => ({
    EmailNotificationPreferencesModal: ({ isOpen, onClose, user }: MockModalProps) => {
        if (!isOpen) return null
        return (
            <div data-testid="email-preferences-modal">
                <h2>Email Notifications</h2>
                <button onClick={onClose}>Close</button>
                <p>User: {user?.email}</p>
            </div>
        )
    },
}))

// Import after mocks
import SettingsPage from '../settings/page'

describe('Settings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockPush.mockClear()
        mockAuth.currentUser = createMockUser()

        // Mock onAuthStateChanged to immediately call callback with user
        const unsubscribe = vi.fn()
        // @ts-expect-error - Mock typing issue with vi.mocked
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(mockAuth.onAuthStateChanged).mockImplementation((callback: any) => {
            callback(mockAuth.currentUser)
            return unsubscribe
        })
    })

    describe('Authentication', () => {
        it('should show loading spinner initially', () => {
            // Mock loading state by not calling callback immediately
            mockAuth.onAuthStateChanged.mockImplementation(() => vi.fn())

            render(<SettingsPage />)

            const spinner = document.querySelector('.animate-spin')
            expect(spinner).toBeInTheDocument()
        })

        it('should redirect to home when user is not authenticated', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockAuth.currentUser = null as any
            // @ts-expect-error - Mock typing issue with vi.mocked
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(mockAuth.onAuthStateChanged).mockImplementation((callback: any) => {
                callback(null)
                return vi.fn()
            })

            render(<SettingsPage />)

            await waitFor(() => {
                expect(screen.getByText('Sign In Required')).toBeInTheDocument()
            })

            const homeButton = screen.getByRole('button', { name: /go to home/i })
            await userEvent.click(homeButton)

            expect(mockPush).toHaveBeenCalledWith('/')
        })

        it('should auto-open modal when user is authenticated', async () => {
            render(<SettingsPage />)

            await waitFor(() => {
                expect(screen.getByTestId('email-preferences-modal')).toBeInTheDocument()
            })

            expect(screen.getByText('Email Notifications')).toBeInTheDocument()
            expect(screen.getByText('User: test@example.com')).toBeInTheDocument()
        })

        it('should track "Settings Page Viewed" event', async () => {
            render(<SettingsPage />)

            await waitFor(() => {
                expect(track).toHaveBeenCalledWith('Settings Page Viewed')
            })
        })
    })

    describe('Modal Interaction', () => {
        it('should close modal and redirect to home when close is clicked', async () => {
            render(<SettingsPage />)

            await waitFor(() => {
                expect(screen.getByTestId('email-preferences-modal')).toBeInTheDocument()
            })

            const closeButton = screen.getByRole('button', { name: /close/i })
            await userEvent.click(closeButton)

            // Modal should close
            await waitFor(() => {
                expect(screen.queryByTestId('email-preferences-modal')).not.toBeInTheDocument()
            })

            // Should redirect after timeout
            await waitFor(
                () => {
                    expect(mockPush).toHaveBeenCalledWith('/')
                },
                { timeout: 500 }
            )
        })

        it('should not show modal initially if user is not authenticated', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockAuth.currentUser = null as any
            // @ts-expect-error - Mock typing issue with vi.mocked
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(mockAuth.onAuthStateChanged).mockImplementation((callback: any) => {
                callback(null)
                return vi.fn()
            })

            render(<SettingsPage />)

            await waitFor(() => {
                expect(screen.getByText('Sign In Required')).toBeInTheDocument()
            })

            expect(screen.queryByTestId('email-preferences-modal')).not.toBeInTheDocument()
        })
    })

    describe('User Information', () => {
        it('should pass correct user to modal', async () => {
            const mockUser = createMockUser({
                email: 'custom@example.com',
                displayName: 'Custom User',
            })
            mockAuth.currentUser = mockUser
            // @ts-expect-error - Mock typing issue with vi.mocked
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(mockAuth.onAuthStateChanged).mockImplementation((callback: any) => {
                callback(mockUser)
                return vi.fn()
            })

            render(<SettingsPage />)

            await waitFor(() => {
                expect(screen.getByText('User: custom@example.com')).toBeInTheDocument()
            })
        })
    })

    describe('Cleanup', () => {
        it('should unsubscribe from auth state changes on unmount', () => {
            const unsubscribe = vi.fn()
            mockAuth.onAuthStateChanged.mockReturnValue(unsubscribe)

            const { unmount } = render(<SettingsPage />)

            unmount()

            expect(unsubscribe).toHaveBeenCalled()
        })
    })
})

