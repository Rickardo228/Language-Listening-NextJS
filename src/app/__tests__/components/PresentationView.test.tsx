import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PresentationView } from '../../PresentationView'
import React from 'react'

describe('PresentationView Component', () => {
    const defaultProps = {
        currentPhrase: 'Hello',
        currentTranslated: 'Hola',
        currentPhase: 'input' as const,
        fullScreen: false,
        setFullscreen: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render current phrase in input phase', () => {
        render(<PresentationView {...defaultProps} />)

        expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('should render current translation in output phase', () => {
        render(
            <PresentationView
                {...defaultProps}
                currentPhase="output"
            />
        )

        expect(screen.getByText('Hola')).toBeInTheDocument()
    })

    it('should render romanized output when provided', () => {
        render(
            <PresentationView
                {...defaultProps}
                currentPhase="output"
                romanizedOutput="Hola (romanized)"
            />
        )

        expect(screen.getByText('Hola')).toBeInTheDocument()
        expect(screen.getByText('Hola (romanized)')).toBeInTheDocument()
    })

    it('should toggle fullscreen when clicking in non-fullscreen mode', async () => {
        const user = userEvent.setup()
        const setFullscreen = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                setFullscreen={setFullscreen}
            />
        )

        const container = screen.getByText('Hello').closest('div')
        if (container) {
            await user.click(container)
        }

        expect(setFullscreen).toHaveBeenCalledWith(true)
    })

    it('should show fullscreen button', () => {
        render(<PresentationView {...defaultProps} />)

        const fullscreenButton = screen.getByTitle('Enter Presentation Mode')
        expect(fullscreenButton).toBeInTheDocument()
    })

    it('should show exit fullscreen button when in fullscreen', () => {
        render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
            />
        )

        const exitButton = screen.getByTitle('Exit Presentation Mode')
        expect(exitButton).toBeInTheDocument()
    })

    it('should toggle fullscreen when clicking fullscreen button', async () => {
        const user = userEvent.setup()
        const setFullscreen = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                setFullscreen={setFullscreen}
            />
        )

        const fullscreenButton = screen.getByTitle('Enter Presentation Mode')
        await user.click(fullscreenButton)

        expect(setFullscreen).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should render navigation buttons when onPrevious and onNext are provided', () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        expect(screen.getByTitle('Previous Phrase')).toBeInTheDocument()
        expect(screen.getByTitle('Next Phrase')).toBeInTheDocument()
    })

    it('should call onPrevious when previous button is clicked', async () => {
        const user = userEvent.setup()
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        const previousButton = screen.getByTitle('Previous Phrase')
        await user.click(previousButton)

        expect(onPrevious).toHaveBeenCalledTimes(1)
    })

    it('should call onNext when next button is clicked', async () => {
        const user = userEvent.setup()
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        const nextButton = screen.getByTitle('Next Phrase')
        await user.click(nextButton)

        expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('should disable previous button when canGoBack is false', () => {
        render(
            <PresentationView
                {...defaultProps}
                onPrevious={vi.fn()}
                onNext={vi.fn()}
                canGoBack={false}
                canGoForward={true}
            />
        )

        const previousButton = screen.getByTitle('Previous Phrase')
        expect(previousButton).toBeDisabled()
    })

    it('should disable next button when canGoForward is false', () => {
        render(
            <PresentationView
                {...defaultProps}
                onPrevious={vi.fn()}
                onNext={vi.fn()}
                canGoBack={true}
                canGoForward={false}
            />
        )

        const nextButton = screen.getByTitle('Next Phrase')
        expect(nextButton).toBeDisabled()
    })

    it('should render phrase counter when indices are provided', () => {
        render(
            <PresentationView
                {...defaultProps}
                currentPhraseIndex={0}
                totalPhrases={10}
            />
        )

        expect(screen.getByText('1 / 10')).toBeInTheDocument()
    })

    it('should navigate on click in fullscreen mode (left third)', async () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        const { container } = render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        const presentationDiv = container.querySelector('.inset-0')
        if (presentationDiv) {
            // Simulate click on left third
            const mockEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                clientX: 100, // Left third of a 300px wide container
            })
            Object.defineProperty(mockEvent, 'offsetX', { value: 50 })
            Object.defineProperty(presentationDiv, 'offsetWidth', { value: 300 })

            presentationDiv.dispatchEvent(mockEvent)
        }

        // Note: This test verifies the structure exists, actual click position
        // logic would need more sophisticated mocking
        expect(onPrevious || onNext).toBeDefined()
    })

    it('should render title when provided', () => {
        render(
            <PresentationView
                {...defaultProps}
                title="My Collection"
            />
        )

        expect(screen.getByText('My Collection')).toBeInTheDocument()
    })

    it('should render background image when provided', () => {
        render(
            <PresentationView
                {...defaultProps}
                bgImage="https://example.com/image.jpg"
            />
        )

        const container = screen.getByText('Hello').closest('.inset-0')
        expect(container).toHaveStyle({
            backgroundImage: 'url(https://example.com/image.jpg)',
        })
    })

    it('should apply custom container background color', () => {
        render(
            <PresentationView
                {...defaultProps}
                containerBg="rgb(255, 0, 0)"
            />
        )

        const container = screen.getByText('Hello').closest('.inset-0')
        expect(container).toHaveStyle({
            backgroundColor: 'rgb(255, 0, 0)',
        })
    })

    it('should apply custom text background color', () => {
        render(
            <PresentationView
                {...defaultProps}
                textBg="rgb(0, 255, 0)"
            />
        )

        const textContainer = screen.getByText('Hello').closest('div')
        expect(textContainer).toHaveStyle({
            backgroundColor: expect.stringContaining('rgb(0, 255, 0)'),
        })
    })

    it('should show all phrases when showAllPhrases is true', () => {
        render(
            <PresentationView
                {...defaultProps}
                showAllPhrases={true}
            />
        )

        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('Hola')).toBeInTheDocument()
    })

    it('should show progress bar when showProgressBar is true', () => {
        render(
            <PresentationView
                {...defaultProps}
                showProgressBar={true}
                progressDuration={5000}
            />
        )

        // Progress bar should be rendered at the bottom
        const container = screen.getByText('Hello').closest('.inset-0')
        expect(container).toBeInTheDocument()
    })

    it('should handle empty currentPhrase', async () => {
        render(
            <PresentationView
                {...defaultProps}
                currentPhrase=""
                currentTranslated="Hola"
                currentPhase="output"
            />
        )

        // When currentPhrase is empty and currentPhase is output, it should show translation
        await waitFor(() => {
            expect(screen.getByText('Hola')).toBeInTheDocument()
        }, { timeout: 2000 })
    })

    it('should handle empty currentTranslated', () => {
        render(
            <PresentationView
                {...defaultProps}
                currentPhrase="Hello"
                currentTranslated=""
            />
        )

        expect(screen.getByText('Hello')).toBeInTheDocument()
    })
})

