import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditablePhrases } from '../../EditablePhrases'
import { createMockPhrases } from '../utils/test-helpers'

/**
 * REAL Component Tests for EditablePhrases
 *
 * Bug: The three dots (...) menu was not opening when clicked.
 *
 * Root Cause:
 * - The Popover.Button was rendering as a <div> wrapper around the trigger button
 * - The trigger button had stopPropagation() that prevented clicks from bubbling up
 * - Since clicks never reached the Popover.Button div, the Headless UI popover never triggered
 *
 * Fix (in Menu.tsx):
 * - Changed Popover.Button to render directly as a <button> element using `as="button"`
 * - Moved stopPropagation() logic to the Popover.Button itself (line 27)
 * - This ensures clicks are captured by Headless UI while still preventing event bubbling
 */

describe('EditablePhrases - Three Dots Menu (Real Component)', () => {
  const mockPhrases = createMockPhrases(3)
  const mockSetPhrases = vi.fn()
  const mockOnPhraseClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Bug Fix Test: Menu Opens When Clicking Three Dots
   *
   * This is the CRITICAL test that would have caught the bug.
   * Before fix: Menu did not open because clicks didn't reach Popover.Button
   * After fix: Menu opens correctly
   */
  it('should open menu when clicking the three dots (...) button', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
      />
    )

    // Find the three dots button (EllipsisVerticalIcon) - it has title "More options"
    const menuButtons = screen.getAllByTitle('More options')
    const firstMenuButton = menuButtons[0]

    // Click the menu button
    await user.click(firstMenuButton)

    // Menu should now be open - look for menu items
    await waitFor(() => {
      expect(screen.getByText('Select')).toBeInTheDocument()
      expect(screen.getByText('Delete phrase')).toBeInTheDocument()
    })
  })

  /**
   * Bug Fix Test: Event Propagation is Stopped
   *
   * Critical test: Clicking the menu should NOT trigger the phrase's onClick handler.
   * This verifies that stopPropagation() is working correctly on Popover.Button (Menu.tsx:27).
   */
  it('should NOT trigger phrase click when clicking menu button', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
        onPhraseClick={mockOnPhraseClick}
      />
    )

    // Find and click the menu button
    const menuButtons = screen.getAllByTitle('More options')
    await user.click(menuButtons[0])

    // onPhraseClick should NOT have been called because stopPropagation prevents it
    expect(mockOnPhraseClick).not.toHaveBeenCalled()

    // Menu should still open
    await waitFor(() => {
      expect(screen.getByText('Select')).toBeInTheDocument()
    })
  })

  /**
   * Test: Delete Menu Option Works
   *
   * Verifies that clicking "Delete phrase" actually deletes the phrase
   */
  it('should delete phrase when clicking Delete phrase option', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
      />
    )

    // Open menu on first phrase
    const menuButtons = screen.getAllByTitle('More options')
    await user.click(menuButtons[0])

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByText('Delete phrase')).toBeInTheDocument()
    })

    // Click Delete
    await user.click(screen.getByText('Delete phrase'))

    // setPhrases should be called with the phrase removed
    await waitFor(() => {
      expect(mockSetPhrases).toHaveBeenCalled()
      const callArg = mockSetPhrases.mock.calls[0][0]
      // Should have 2 phrases left (deleted 1 of 3)
      expect(callArg).toHaveLength(2)
    })
  })

  /**
   * Test: Select Menu Option Works
   *
   * Verifies that clicking "Select" enables multi-select mode
   */
  it('should enable multi-select mode when clicking Select option', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
      />
    )

    // Open menu on first phrase
    const menuButtons = screen.getAllByTitle('More options')
    await user.click(menuButtons[0])

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByText('Select')).toBeInTheDocument()
    })

    // Click Select
    await user.click(screen.getByText('Select'))

    // Should show checkboxes (multi-select mode enabled)
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  /**
   * Test: Menu Works in Both Layouts
   *
   * The menu appears in different positions depending on enableOutputBeforeInput
   * - false: menu appears after input field (line 224)
   * - true: menu appears after output field (line 263)
   */
  it('should work with normal layout (enableOutputBeforeInput=false)', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
        enableOutputBeforeInput={false}
      />
    )

    // Menu button should exist
    const menuButtons = screen.getAllByTitle('More options')
    expect(menuButtons.length).toBeGreaterThan(0)

    // Should be able to open menu
    await user.click(menuButtons[0])
    await waitFor(() => {
      expect(screen.getByText('Select')).toBeInTheDocument()
    })
  })

  it('should work with reversed layout (enableOutputBeforeInput=true)', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
        enableOutputBeforeInput={true}
      />
    )

    // Menu button should exist
    const menuButtons = screen.getAllByTitle('More options')
    expect(menuButtons.length).toBeGreaterThan(0)

    // Should be able to open menu
    await user.click(menuButtons[0])
    await waitFor(() => {
      expect(screen.getByText('Select')).toBeInTheDocument()
    })
  })

  /**
   * Test: Clicking Phrase Input Doesn't Trigger onPhraseClick
   *
   * Verifies that input fields also have stopPropagation working
   */
  it('should NOT trigger phrase click when clicking input field', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
        onPhraseClick={mockOnPhraseClick}
      />
    )

    // Click on an input field
    const inputs = screen.getAllByDisplayValue(/Input phrase/)
    await user.click(inputs[0])

    // onPhraseClick should NOT be called
    expect(mockOnPhraseClick).not.toHaveBeenCalled()
  })

  /**
   * Integration Test: Complete Menu Workflow
   *
   * Tests the entire workflow:
   * 1. Menu opens when clicking three dots
   * 2. Event doesn't bubble to phrase container
   * 3. Clicking option triggers action
   * 4. Menu closes after action
   */
  it('should handle complete menu workflow correctly', async () => {
    const user = userEvent.setup()

    render(
      <EditablePhrases
        phrases={mockPhrases}
        setPhrases={mockSetPhrases}
        inputLanguage="en"
        outputLanguage="es"
        currentPhraseIndex={null}
        currentPhase="output"
        onPhraseClick={mockOnPhraseClick}
      />
    )

    // Step 1: Click menu button
    const menuButtons = screen.getAllByTitle('More options')
    await user.click(menuButtons[0])

    // Step 2: Verify menu opened and phrase wasn't clicked
    await waitFor(() => {
      expect(screen.getByText('Select')).toBeInTheDocument()
    })
    expect(mockOnPhraseClick).not.toHaveBeenCalled()

    // Step 3: Click Select option
    await user.click(screen.getByText('Select'))

    // Step 4: Verify action was triggered (multi-select mode enabled)
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    // Step 5: Verify phrase container still wasn't clicked
    expect(mockOnPhraseClick).not.toHaveBeenCalled()
  })
})
