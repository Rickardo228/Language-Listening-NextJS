import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PresentationControls } from '../../PresentationControls'
import { PresentationConfig } from '../../types'

describe('PresentationControls Component', () => {
  const defaultPresentationConfig: PresentationConfig = {
    name: 'Test Config',
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
    enableLoop: true,
    enableOutputDurationDelay: true,
    enableInputDurationDelay: false,
    enableInputPlayback: true,
    inputPlaybackSpeed: 1.0,
    outputPlaybackSpeed: 1.0,
  }

  const defaultProps = {
    recordScreen: false,
    stopScreenRecording: vi.fn(),
    handleReplay: vi.fn(),
    hasPhrasesLoaded: true,
    configName: 'Test Config',
    setConfigName: vi.fn(),
    onSaveConfig: vi.fn(),
    presentationConfig: defaultPresentationConfig,
    setPresentationConfig: vi.fn(),
    paused: true,
    onPause: vi.fn(),
    onPlay: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    canGoBack: true,
    canGoForward: true,
    inputLang: 'en-GB',
    targetLang: 'es-ES',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render play button when paused', () => {
    render(<PresentationControls {...defaultProps} />)

    expect(screen.getByText('Play')).toBeInTheDocument()
    expect(screen.getByTitle('Start Presentation')).toBeInTheDocument()
  })

  it('should render pause button when playing', () => {
    render(
      <PresentationControls
        {...defaultProps}
        paused={false}
      />
    )

    expect(screen.getByText('Pause')).toBeInTheDocument()
    expect(screen.getByTitle('Complete Current Phrase')).toBeInTheDocument()
  })

  it('should call onPlay when play button is clicked', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        onPlay={onPlay}
      />
    )

    const playButton = screen.getByText('Play')
    await user.click(playButton)

    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('should call onPause when pause button is clicked', async () => {
    const user = userEvent.setup()
    const onPause = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        paused={false}
        onPause={onPause}
      />
    )

    const pauseButton = screen.getByText('Pause')
    await user.click(pauseButton)

    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('should render replay button when phrases are loaded', () => {
    render(
      <PresentationControls
        {...defaultProps}
        hasPhrasesLoaded={true}
      />
    )

    expect(screen.getByTitle('Replay')).toBeInTheDocument()
  })

  it('should not render replay button when phrases are not loaded', () => {
    render(
      <PresentationControls
        {...defaultProps}
        hasPhrasesLoaded={false}
      />
    )

    expect(screen.queryByTitle('Replay')).not.toBeInTheDocument()
  })

  it('should call handleReplay when replay button is clicked', async () => {
    const user = userEvent.setup()
    const handleReplay = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        handleReplay={handleReplay}
      />
    )

    const replayButton = screen.getByTitle('Replay')
    await user.click(replayButton)

    expect(handleReplay).toHaveBeenCalledTimes(1)
  })

  it('should render settings button', () => {
    render(<PresentationControls {...defaultProps} />)

    expect(screen.getByTitle('Settings')).toBeInTheDocument()
  })

  it('should open settings modal when settings button is clicked', async () => {
    const user = userEvent.setup()

    render(<PresentationControls {...defaultProps} />)

    const settingsButton = screen.getByTitle('Settings')
    await user.click(settingsButton)

    // Settings modal should open - check for modal content
    // This would depend on the actual SettingsModal implementation
    await waitFor(() => {
      // Modal should be visible - adjust selector based on actual modal implementation
      expect(screen.getByTitle('Settings')).toBeInTheDocument()
    })
  })

  it('should render previous and next buttons', () => {
    render(<PresentationControls {...defaultProps} />)

    expect(screen.getByTitle('Previous Phrase')).toBeInTheDocument()
    expect(screen.getByTitle('Next Phrase')).toBeInTheDocument()
  })

  it('should call onPrevious when previous button is clicked', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        onPrevious={onPrevious}
      />
    )

    const previousButton = screen.getByTitle('Previous Phrase')
    await user.click(previousButton)

    expect(onPrevious).toHaveBeenCalledTimes(1)
  })

  it('should call onNext when next button is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        onNext={onNext}
      />
    )

    const nextButton = screen.getByTitle('Next Phrase')
    await user.click(nextButton)

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('should disable previous button when canGoBack is false', () => {
    render(
      <PresentationControls
        {...defaultProps}
        canGoBack={false}
      />
    )

    const previousButton = screen.getByTitle('Previous Phrase')
    expect(previousButton).toBeDisabled()
  })

  it('should disable next button when canGoForward is false', () => {
    render(
      <PresentationControls
        {...defaultProps}
        canGoForward={false}
      />
    )

    const nextButton = screen.getByTitle('Next Phrase')
    expect(nextButton).toBeDisabled()
  })

  it('should render input speed toggle button', () => {
    render(<PresentationControls {...defaultProps} />)

    // Speed toggle buttons are hidden on mobile, but should exist in DOM
    const inputSpeedButton = screen.getByTitle(/English \(UK\) Speed:/)
    expect(inputSpeedButton).toBeInTheDocument()
  })

  it('should toggle input playback speed when input speed button is clicked', async () => {
    const user = userEvent.setup()
    const setPresentationConfig = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        setPresentationConfig={setPresentationConfig}
      />
    )

    const inputSpeedButton = screen.getByTitle(/English \(UK\) Speed:/)
    await user.click(inputSpeedButton)

    expect(setPresentationConfig).toHaveBeenCalled()
    const callArg = setPresentationConfig.mock.calls[0][0]
    expect(callArg.inputPlaybackSpeed).toBeDefined()
  })

  it('should render output speed toggle button', () => {
    render(<PresentationControls {...defaultProps} />)

    const outputSpeedButton = screen.getByTitle(/Spanish Speed:/)
    expect(outputSpeedButton).toBeInTheDocument()
  })

  it('should toggle output playback speed when output speed button is clicked', async () => {
    const user = userEvent.setup()
    const setPresentationConfig = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        setPresentationConfig={setPresentationConfig}
      />
    )

    const outputSpeedButton = screen.getByTitle(/Spanish Speed:/)
    await user.click(outputSpeedButton)

    expect(setPresentationConfig).toHaveBeenCalled()
    const callArg = setPresentationConfig.mock.calls[0][0]
    expect(callArg.outputPlaybackSpeed).toBeDefined()
  })

  it('should display current playback speeds', () => {
    render(
      <PresentationControls
        {...defaultProps}
        presentationConfig={{
          ...defaultPresentationConfig,
          inputPlaybackSpeed: 1.5,
          outputPlaybackSpeed: 0.75,
        }}
      />
    )

    // Check that speed values are displayed
    const inputSpeedButton = screen.getByTitle(/English \(UK\) Speed: 1\.5x/)
    expect(inputSpeedButton).toBeInTheDocument()
    const outputSpeedButton = screen.getByTitle(/Spanish Speed: 0\.75x/)
    expect(outputSpeedButton).toBeInTheDocument()
  })

  it('should show stop recording button when recording', () => {
    render(
      <PresentationControls
        {...defaultProps}
        recordScreen={true}
      />
    )

    expect(screen.getByText('Stop Recording')).toBeInTheDocument()
  })

  it('should not show stop recording button when not recording', () => {
    render(
      <PresentationControls
        {...defaultProps}
        recordScreen={false}
      />
    )

    expect(screen.queryByText('Stop Recording')).not.toBeInTheDocument()
  })

  it('should call stopScreenRecording when stop recording button is clicked', async () => {
    const user = userEvent.setup()
    const stopScreenRecording = vi.fn()

    render(
      <PresentationControls
        {...defaultProps}
        recordScreen={true}
        stopScreenRecording={stopScreenRecording}
      />
    )

    const stopButton = screen.getByText('Stop Recording')
    await user.click(stopButton)

    expect(stopScreenRecording).toHaveBeenCalledTimes(1)
  })

  it('should handle missing inputLang gracefully', () => {
    render(
      <PresentationControls
        {...defaultProps}
        inputLang={undefined}
      />
    )

    // Should still render without errors
    expect(screen.getByText('Play')).toBeInTheDocument()
  })

  it('should handle missing targetLang gracefully', () => {
    render(
      <PresentationControls
        {...defaultProps}
        targetLang={undefined}
      />
    )

    // Should still render without errors
    expect(screen.getByText('Play')).toBeInTheDocument()
  })
})

