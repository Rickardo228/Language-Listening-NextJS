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

    it('should ignore click to enter fullscreen when tooltip is open', async () => {
        const user = userEvent.setup()
        const setFullscreen = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                setFullscreen={setFullscreen}
            />
        )

        window.dispatchEvent(new CustomEvent('word-tooltip', { detail: { open: true } }))

        const container = screen.getByText('Hello').closest('.inset-0') as HTMLElement | null
        if (container) {
            await user.click(container)
        }

        expect(setFullscreen).not.toHaveBeenCalled()
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

        render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        // Wait for portal to be created and content to render
        await waitFor(() => {
            const portalContainer = document.getElementById('presentation-portal')
            expect(portalContainer).toBeInTheDocument()
        })

        // In fullscreen mode, content is rendered in a portal
        const portalContainer = document.getElementById('presentation-portal')
        expect(portalContainer).toBeInTheDocument()

        const presentationDiv = portalContainer!.querySelector('.inset-0') as HTMLElement
        expect(presentationDiv).toBeInTheDocument()

        // Mock getBoundingClientRect for click position calculation
        // Container is 900px wide, positioned at left: 0, top: 0
        const mockRect = {
            left: 0,
            top: 0,
            right: 900,
            bottom: 600,
            width: 900,
            height: 600,
            x: 0,
            y: 0,
            toJSON: vi.fn()
        }
        vi.spyOn(presentationDiv, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

        // Click on LEFT third (should trigger onPrevious)
        // Click at x=200, which is 200/900 = 22% (left third is < 33%)
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: 200, // Click at 200px from viewport left
            clientY: 300
        })

        // Simulate the click on the container
        presentationDiv.dispatchEvent(clickEvent)

        // Wait for the click handler to process
        await waitFor(() => {
            expect(onPrevious).toHaveBeenCalledTimes(1)
        })

        expect(onNext).not.toHaveBeenCalled()
    })

    it('should not navigate when tooltip is open in fullscreen mode', async () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        await waitFor(() => {
            const portalContainer = document.getElementById('presentation-portal')
            expect(portalContainer).toBeInTheDocument()
        })

        window.dispatchEvent(new CustomEvent('word-tooltip', { detail: { open: true } }))

        const portalContainer = document.getElementById('presentation-portal')
        const presentationDiv = portalContainer!.querySelector('.inset-0') as HTMLElement

        const mockRect = {
            left: 0,
            top: 0,
            right: 900,
            bottom: 600,
            width: 900,
            height: 600,
            x: 0,
            y: 0,
            toJSON: vi.fn()
        }
        vi.spyOn(presentationDiv, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: 200,
            clientY: 300
        })

        presentationDiv.dispatchEvent(clickEvent)

        await waitFor(() => {
            expect(onPrevious).not.toHaveBeenCalled()
            expect(onNext).not.toHaveBeenCalled()
        })
    })

    it('should navigate on click in fullscreen mode (right third)', async () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        // Wait for portal to be created and content to render
        await waitFor(() => {
            const portalContainer = document.getElementById('presentation-portal')
            expect(portalContainer).toBeInTheDocument()
        })

        const portalContainer = document.getElementById('presentation-portal')
        const presentationDiv = portalContainer!.querySelector('.inset-0') as HTMLElement

        // Mock getBoundingClientRect for click position calculation
        // Container is 900px wide, positioned at left: 0, top: 0
        const mockRect = {
            left: 0,
            top: 0,
            right: 900,
            bottom: 600,
            width: 900,
            height: 600,
            x: 0,
            y: 0,
            toJSON: vi.fn()
        }
        vi.spyOn(presentationDiv, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

        // Click on RIGHT third (should trigger onNext)
        // Click at x=800, which is 800/900 = 89% (right third is > 66.66%)
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: 800, // Click at 800px from viewport left
            clientY: 300
        })

        // Simulate the click on the container
        presentationDiv.dispatchEvent(clickEvent)

        // Wait for the click handler to process
        await waitFor(() => {
            expect(onNext).toHaveBeenCalledTimes(1)
        })

        expect(onPrevious).not.toHaveBeenCalled()
    })

    it('should not navigate on click in fullscreen mode (center third)', async () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        // Wait for portal to be created and content to render
        await waitFor(() => {
            const portalContainer = document.getElementById('presentation-portal')
            expect(portalContainer).toBeInTheDocument()
        })

        const portalContainer = document.getElementById('presentation-portal')
        const presentationDiv = portalContainer!.querySelector('.inset-0') as HTMLElement

        // Mock getBoundingClientRect for click position calculation
        // Container is 900px wide, positioned at left: 0, top: 0
        const mockRect = {
            left: 0,
            top: 0,
            right: 900,
            bottom: 600,
            width: 900,
            height: 600,
            x: 0,
            y: 0,
            toJSON: vi.fn()
        }
        vi.spyOn(presentationDiv, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

        // Click on CENTER third (should not trigger navigation)
        // Click at x=500, which is 500/900 = 56% (center third is 33.33-66.66%)
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: 500, // Click at 500px from viewport left
            clientY: 300
        })

        // Simulate the click on the container
        presentationDiv.dispatchEvent(clickEvent)

        // Wait a bit to ensure handlers have processed
        await waitFor(() => {
            // Neither should be called
            expect(onPrevious).not.toHaveBeenCalled()
            expect(onNext).not.toHaveBeenCalled()
        }, { timeout: 100 })
    })

    it('should navigate correctly when clicking on child elements (bug fix)', async () => {
        const onPrevious = vi.fn()
        const onNext = vi.fn()

        render(
            <PresentationView
                {...defaultProps}
                fullScreen={true}
                onPrevious={onPrevious}
                onNext={onNext}
                canGoBack={true}
                canGoForward={true}
            />
        )

        // Wait for portal to be created and content to render
        await waitFor(() => {
            const portalContainer = document.getElementById('presentation-portal')
            expect(portalContainer).toBeInTheDocument()
        })

        const portalContainer = document.getElementById('presentation-portal')
        const presentationDiv = portalContainer!.querySelector('.inset-0') as HTMLElement

        // Mock getBoundingClientRect for click position calculation
        // Container is 900px wide, positioned at left: 100, top: 50 (not at origin)
        const mockRect = {
            left: 100,
            top: 50,
            right: 1000,
            bottom: 650,
            width: 900,
            height: 600,
            x: 100,
            y: 50,
            toJSON: vi.fn()
        }
        vi.spyOn(presentationDiv, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect)

        // Click on a child element (like text) in the LEFT third
        // Even though we click on a child, clientX should be relative to viewport
        // Click at x=200 (viewport), which is 200-100=100px from container left = 11% (left third)
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: 200, // Click at 200px from viewport left
            clientY: 300
        })

        // Simulate the click on the container (event bubbles from child)
        presentationDiv.dispatchEvent(clickEvent)

        // Wait for the click handler to process
        await waitFor(() => {
            expect(onPrevious).toHaveBeenCalledTimes(1)
        })

        expect(onNext).not.toHaveBeenCalled()
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
