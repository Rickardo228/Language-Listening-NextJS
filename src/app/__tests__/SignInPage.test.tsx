import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createUserWithEmailAndPassword, createMockUser, mockAuth } from '../__mocks__/firebase'
import { trackSignUp, identifyUser } from '../../lib/mixpanelClient'

// Mock Firebase auth - must be before importing SignInPage
vi.mock('../firebase', async () => {
    const mocks = await import('../__mocks__/firebase')
    return {
        auth: mocks.mockAuth,
    }
})

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
}))

// Import after mocks are set up
import { SignInPage } from '../SignInPage'

describe('SignInPage - Sign Up Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        mockPush.mockClear()
    })

    afterEach(() => {
        localStorage.clear()
    })

    describe('First Visit Detection', () => {
        it('should default to sign-up mode on first visit', () => {
            localStorage.removeItem('hasVisitedBefore')
            render(<SignInPage />)

            expect(screen.getByText('Create Account')).toBeInTheDocument()
        })

        it('should not default to sign-up mode on subsequent visits', () => {
            localStorage.setItem('hasVisitedBefore', 'true')
            render(<SignInPage />)

            expect(screen.getByText('Sign In')).toBeInTheDocument()
        })
    })

    describe('Email Sign Up', () => {
        it('should create account with email and password', async () => {
            localStorage.setItem('hasVisitedBefore', 'true') // Ensure we're in sign-in mode initially

            const mockUser = createMockUser({
                uid: 'new-user-123',
                email: 'newuser@example.com',
            })

            createUserWithEmailAndPassword.mockResolvedValue({
                user: mockUser,
            })

            const onAuthSuccess = vi.fn()
            const user = userEvent.setup()

            render(<SignInPage onAuthSuccess={onAuthSuccess} />)

            // Switch to sign up mode
            const toggleButton = screen.getByText("Don't have an account? Sign up")
            await user.click(toggleButton)

            // Fill in form
            const emailInput = screen.getByLabelText(/email address/i)
            const passwordInput = screen.getByLabelText(/password/i)

            await user.type(emailInput, 'newuser@example.com')
            await user.type(passwordInput, 'password123')

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create account/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
                    mockAuth,
                    'newuser@example.com',
                    'password123'
                )
            })

            await waitFor(() => {
                expect(onAuthSuccess).toHaveBeenCalledWith(mockUser)
            })

            expect(trackSignUp).toHaveBeenCalledWith('new-user-123', 'email')
            expect(identifyUser).toHaveBeenCalledWith('new-user-123', 'newuser@example.com')
            expect(localStorage.getItem('hasVisitedBefore')).toBe('true')
        })

        it('should store selected languages in localStorage when showLanguageSelect is true', async () => {
            const mockUser = createMockUser({ uid: 'new-user-123' })
            createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser })

            const user = userEvent.setup()
            render(<SignInPage showLanguageSelect={true} />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            // Fill and submit form
            await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')
            await user.click(screen.getByRole('button', { name: /create account/i }))

            await waitFor(() => {
                expect(localStorage.getItem('signupInputLang')).toBeTruthy()
                expect(localStorage.getItem('signupTargetLang')).toBeTruthy()
            })
        })

        it('should redirect to home with query params when no onAuthSuccess callback', async () => {
            const mockUser = createMockUser({ uid: 'new-user-123' })
            createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser })

            const user = userEvent.setup()
            render(<SignInPage showLanguageSelect={true} />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')
            await user.click(screen.getByRole('button', { name: /create account/i }))

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    expect.stringContaining('/?firstVisit=true&inputLang=')
                )
            })
        })

        it('should display error message on sign up failure', async () => {
            const errorMessage = 'Email already in use'
            createUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage))

            const user = userEvent.setup()
            render(<SignInPage />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')
            await user.click(screen.getByRole('button', { name: /create account/i }))

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument()
            })
        })

        it('should show loading state during sign up', async () => {
            const mockUser = createMockUser({ uid: 'new-user-123' })
            createUserWithEmailAndPassword.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100))
            )

            const user = userEvent.setup()
            render(<SignInPage />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')
            await user.click(screen.getByRole('button', { name: /create account/i }))

            expect(screen.getByText('Creating Account...')).toBeInTheDocument()
        })
    })

    describe('Google Sign Up', () => {
        it('should sign up with Google', async () => {
            const mockUser = createMockUser({
                uid: 'google-user-123',
                email: 'google@example.com',
                providerData: [{ providerId: 'google.com' }],
            })

            mockAuth.signInWithPopup.mockResolvedValue({ user: mockUser })

            const onAuthSuccess = vi.fn()
            const user = userEvent.setup()

            render(<SignInPage onAuthSuccess={onAuthSuccess} />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            const googleButton = screen.getByText('Sign in with Google')
            await user.click(googleButton)

            await waitFor(() => {
                expect(mockAuth.signInWithPopup).toHaveBeenCalled()
            })

            await waitFor(() => {
                expect(onAuthSuccess).toHaveBeenCalledWith(mockUser)
            })

            expect(trackSignUp).toHaveBeenCalledWith('google-user-123', 'google.com')
            expect(identifyUser).toHaveBeenCalledWith('google-user-123', 'google@example.com')
        })

        it('should store selected languages for Google sign up when showLanguageSelect is true', async () => {
            const mockUser = createMockUser({ uid: 'google-user-123' })
            mockAuth.signInWithPopup.mockResolvedValue({ user: mockUser })

            const user = userEvent.setup()
            render(<SignInPage showLanguageSelect={true} />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            await user.click(screen.getByText('Sign in with Google'))

            await waitFor(() => {
                expect(localStorage.getItem('signupInputLang')).toBeTruthy()
                expect(localStorage.getItem('signupTargetLang')).toBeTruthy()
            })
        })

        it('should display error message on Google sign up failure', async () => {
            mockAuth.signInWithPopup.mockRejectedValue(new Error('Google sign in failed'))

            const user = userEvent.setup()
            render(<SignInPage />)

            // Switch to sign up if needed
            const toggleButton = screen.queryByText("Don't have an account? Sign up")
            if (toggleButton) {
                await user.click(toggleButton)
            }

            await user.click(screen.getByText('Sign in with Google'))

            await waitFor(() => {
                expect(screen.getByText('Failed to sign in with Google. Please try again.')).toBeInTheDocument()
            })
        })
    })

    describe('Language Selection', () => {
        it('should show language selector when showLanguageSelect is true and in sign-up mode', () => {
            localStorage.removeItem('hasVisitedBefore')
            render(<SignInPage showLanguageSelect={true} />)

            // Language selector should be visible
            expect(screen.getByText('Input Language')).toBeInTheDocument()
            expect(screen.getByText('Target Language')).toBeInTheDocument()
        })

        it('should not show language selector when showLanguageSelect is false', () => {
            render(<SignInPage showLanguageSelect={false} />)

            expect(screen.queryByText('Input Language')).not.toBeInTheDocument()
        })

        it('should not show language selector when in sign-in mode', async () => {
            localStorage.setItem('hasVisitedBefore', 'true')
            render(<SignInPage showLanguageSelect={true} />)

            expect(screen.queryByText('Input Language')).not.toBeInTheDocument()
        })
    })

    describe('Mode Toggle', () => {
        it('should toggle between sign up and sign in modes', async () => {
            localStorage.setItem('hasVisitedBefore', 'true')
            const user = userEvent.setup()
            render(<SignInPage />)

            expect(screen.getByText('Sign In')).toBeInTheDocument()

            const toggleButton = screen.getByText("Don't have an account? Sign up")
            await user.click(toggleButton)

            expect(screen.getByText('Create Account')).toBeInTheDocument()

            const backToggleButton = screen.getByText('Already have an account? Sign in')
            await user.click(backToggleButton)

            expect(screen.getByText('Sign In')).toBeInTheDocument()
        })
    })
})

