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
const mockGet = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: mockGet,
    }),
}))

// Mock user preferences (use factory function to avoid hoisting issues)
const mockCreateOrUpdateUserProfile = vi.fn()
const mockGetUserProfile = vi.fn()

vi.mock('../utils/userPreferences', () => ({
    getUserProfile: () => mockGetUserProfile(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createOrUpdateUserProfile: (...args: any[]) => mockCreateOrUpdateUserProfile(...args),
}))

// Mock Mixpanel
vi.mock('../../lib/mixpanelClient', () => ({
    track: vi.fn(),
}))

// Import after mocks
import UnsubscribePage from '../unsubscribe/page'

describe('Unsubscribe Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockPush.mockClear()
        mockGet.mockClear()
        mockCreateOrUpdateUserProfile.mockClear()
        mockGetUserProfile.mockClear()
        mockAuth.currentUser = createMockUser()

        // Default mock returns
        mockCreateOrUpdateUserProfile.mockResolvedValue(undefined)
        mockGetUserProfile.mockResolvedValue({
            emailNotificationsEnabled: true,
            practiceReminderEnabled: true,
            weeklyStatsEnabled: true,
        })

        // Default: unsubscribe from practice reminders
        mockGet.mockReturnValue('practice')

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
            mockAuth.onAuthStateChanged.mockImplementation(() => vi.fn())

            render(<UnsubscribePage />)

            const spinner = document.querySelector('.animate-spin')
            expect(spinner).toBeInTheDocument()
        })

        it('should show sign-in required when user is not authenticated', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockAuth.currentUser = null as any
            // @ts-expect-error - Mock typing issue with vi.mocked
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(mockAuth.onAuthStateChanged).mockImplementation((callback: any) => {
                callback(null)
                return vi.fn()
            })

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Sign In Required')).toBeInTheDocument()
            })

            expect(screen.getByText(/please sign in to manage/i)).toBeInTheDocument()
        })

        it('should show unsubscribe form when user is authenticated', async () => {
            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })
        })
    })

    describe('Email Type Detection', () => {
        it('should show "Daily Practice Reminders" for type=practice', async () => {
            mockGet.mockReturnValue('practice')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/Daily Practice Reminders/)).toBeInTheDocument()
            })
        })

        it('should show "Weekly Stats Summaries" for type=weekly', async () => {
            mockGet.mockReturnValue('weekly')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/Weekly Stats Summaries/)).toBeInTheDocument()
            })
        })

        it('should show "All Email Notifications" for type=all', async () => {
            mockGet.mockReturnValue('all')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/All Email Notifications/)).toBeInTheDocument()
            })
        })

        it('should show "All Email Notifications" for missing type', async () => {
            mockGet.mockReturnValue(null)

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/All Email Notifications/)).toBeInTheDocument()
            })
        })
    })

    describe('Unsubscribe Action', () => {
        it('should unsubscribe from practice reminders', async () => {
            mockGet.mockReturnValue('practice')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(mockCreateOrUpdateUserProfile).toHaveBeenCalledWith(
                    'test-user-id',
                    { practiceReminderEnabled: false }
                )
            })

            expect(track).toHaveBeenCalledWith('Unsubscribed from Practice Reminders', {
                source: 'email_link'
            })
        })

        it('should unsubscribe from weekly stats', async () => {
            mockGet.mockReturnValue('weekly')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(mockCreateOrUpdateUserProfile).toHaveBeenCalledWith(
                    'test-user-id',
                    { weeklyStatsEnabled: false }
                )
            })

            expect(track).toHaveBeenCalledWith('Unsubscribed from Weekly Stats', {
                source: 'email_link'
            })
        })

        it('should unsubscribe from all emails', async () => {
            mockGet.mockReturnValue('all')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(mockCreateOrUpdateUserProfile).toHaveBeenCalledWith(
                    'test-user-id',
                    {
                        emailNotificationsEnabled: false,
                        practiceReminderEnabled: false,
                        weeklyStatsEnabled: false,
                    }
                )
            })

            expect(track).toHaveBeenCalledWith('Unsubscribed from All Emails', {
                source: 'email_link'
            })
        })

        it('should show success message after unsubscribing', async () => {
            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(screen.getByText('Successfully Unsubscribed')).toBeInTheDocument()
            })

            expect(screen.getByText(/you've been unsubscribed/i)).toBeInTheDocument()
        })

        it('should show error message when unsubscribe fails', async () => {
            mockCreateOrUpdateUserProfile.mockRejectedValue(new Error('Network error'))

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(screen.getByText(/failed to update preferences/i)).toBeInTheDocument()
            })

            expect(track).toHaveBeenCalledWith('Unsubscribe Error', {
                error: 'Error: Network error'
            })
        })

        it('should disable button while unsubscribing', async () => {
            // Make the promise resolve slowly so we can catch the loading state
            let resolvePromise: () => void
            const slowPromise = new Promise<void>((resolve) => {
                resolvePromise = resolve
            })
            mockCreateOrUpdateUserProfile.mockReturnValue(slowPromise)

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            // Check that loading state is shown
            expect(screen.getByText('Unsubscribing...')).toBeInTheDocument()

            // Resolve the promise
            resolvePromise!()

            // Wait for success state
            await waitFor(() => {
                expect(screen.getByText('Successfully Unsubscribed')).toBeInTheDocument()
            })
        })
    })

    describe('Navigation', () => {
        it('should navigate to settings when "Manage Preferences" is clicked', async () => {
            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const manageButton = screen.getByRole('button', { name: /manage preferences instead/i })
            await userEvent.click(manageButton)

            expect(mockPush).toHaveBeenCalledWith('/settings')
            expect(track).toHaveBeenCalledWith('Manage Preferences Clicked', {
                source: 'unsubscribe_page'
            })
        })

        it('should navigate to home when "Cancel" is clicked', async () => {
            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const cancelButton = screen.getByRole('button', { name: /cancel/i })
            await userEvent.click(cancelButton)

            expect(mockPush).toHaveBeenCalledWith('/')
            expect(track).toHaveBeenCalledWith('Cancel Unsubscribe Clicked')
        })

        it('should navigate to home from sign-in page', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockAuth.currentUser = null as any
            // @ts-expect-error - Mock typing issue with vi.mocked
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(mockAuth.onAuthStateChanged).mockImplementation((callback: any) => {
                callback(null)
                return vi.fn()
            })

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Sign In Required')).toBeInTheDocument()
            })

            const homeButton = screen.getByRole('button', { name: /go to home/i })
            await userEvent.click(homeButton)

            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    describe('Success Page', () => {
        it('should show manage preferences button on success page', async () => {
            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(screen.getByText('Successfully Unsubscribed')).toBeInTheDocument()
            })

            const manageButton = screen.getByRole('button', { name: /manage email preferences/i })
            expect(manageButton).toBeInTheDocument()

            await userEvent.click(manageButton)

            expect(mockPush).toHaveBeenCalledWith('/settings')
            expect(track).toHaveBeenCalledWith('Manage Preferences Clicked', {
                source: 'unsubscribe_page'
            })
        })

        it('should show back to home button on success page', async () => {
            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText('Unsubscribe from Emails')).toBeInTheDocument()
            })

            const unsubButton = screen.getByRole('button', { name: /yes, unsubscribe/i })
            await userEvent.click(unsubButton)

            await waitFor(() => {
                expect(screen.getByText('Successfully Unsubscribed')).toBeInTheDocument()
            })

            const homeButton = screen.getByRole('button', { name: /back to home/i })
            await userEvent.click(homeButton)

            expect(mockPush).toHaveBeenCalledWith('/')
            expect(track).toHaveBeenCalledWith('Back to Home Clicked', {
                source: 'unsubscribe_page'
            })
        })
    })

    describe('Warning Messages', () => {
        it('should show appropriate warning for practice reminders', async () => {
            mockGet.mockReturnValue('practice')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/you'll no longer receive daily practice reminders/i)).toBeInTheDocument()
            })
        })

        it('should show appropriate warning for weekly stats', async () => {
            mockGet.mockReturnValue('weekly')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/you'll no longer receive weekly summaries/i)).toBeInTheDocument()
            })
        })

        it('should show appropriate warning for all emails', async () => {
            mockGet.mockReturnValue('all')

            render(<UnsubscribePage />)

            await waitFor(() => {
                expect(screen.getByText(/you'll stop receiving all emails/i)).toBeInTheDocument()
            })
        })
    })

    describe('Cleanup', () => {
        it('should unsubscribe from auth state changes on unmount', () => {
            const unsubscribe = vi.fn()
            mockAuth.onAuthStateChanged.mockReturnValue(unsubscribe)

            const { unmount } = render(<UnsubscribePage />)

            unmount()

            expect(unsubscribe).toHaveBeenCalled()
        })
    })
})

