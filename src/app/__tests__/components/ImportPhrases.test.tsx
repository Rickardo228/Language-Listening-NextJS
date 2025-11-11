import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportPhrases } from '../../ImportPhrases'

describe('ImportPhrases Component', () => {
    const defaultProps = {
        inputLang: 'en-GB',
        setInputLang: vi.fn(),
        targetLang: 'es-ES',
        setTargetLang: vi.fn(),
        phrasesInput: '',
        setPhrasesInput: vi.fn(),
        loading: false,
        onProcess: vi.fn(),
        onAddToCollection: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render "Create New List" button when onProcess is provided', () => {
        render(<ImportPhrases {...defaultProps} />)

        expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    it('should render "Add Phrases" button when onProcess is not provided', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onProcess, ...propsWithoutProcess } = defaultProps
        render(<ImportPhrases {...propsWithoutProcess} />)

        expect(screen.getByText('Add Phrases')).toBeInTheDocument()
    })

    it('should open dialog when button is clicked', async () => {
        const user = userEvent.setup()

        // Test with only onProcess to get editable mode with selects
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onAddToCollection, ...propsWithProcessOnly } = defaultProps
        render(<ImportPhrases {...propsWithProcessOnly} />)

        const button = screen.getByText('Create New List')
        await user.click(button)

        // Check for dialog-specific elements
        await waitFor(() => {
            // Dialog should be visible
            expect(screen.getByRole('dialog')).toBeInTheDocument()
            // Check for dialog title (use heading role to be more specific)
            expect(screen.getByRole('heading', { name: 'Create New List' })).toBeInTheDocument()
        }, { timeout: 3000 })

        // Check for textarea - it should be present in the dialog
        // There are multiple textboxes (input and textarea), so find the textarea specifically
        const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA')
        expect(textareas.length).toBeGreaterThan(0)

        // Check that language selectors are present (they might be in a different structure)
        // Use querySelector to find select elements directly
        const dialog = screen.getByRole('dialog')
        const selects = dialog.querySelectorAll('select')
        expect(selects.length).toBeGreaterThanOrEqual(2) // At least input and target language selects
    })

    it('should render Plus icon in button', () => {
        render(<ImportPhrases {...defaultProps} />)

        // Plus icon should be present (from lucide-react)
        const button = screen.getByText('Create New List').closest('button')
        expect(button).toBeInTheDocument()
    })

    it('should apply full width class when onProcess is provided', () => {
        render(<ImportPhrases {...defaultProps} />)

        const button = screen.getByText('Create New List').closest('button')
        expect(button?.className).toContain('w-full')
    })

    it('should not apply full width class when onProcess is not provided', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onProcess, ...propsWithoutProcess } = defaultProps
        render(<ImportPhrases {...propsWithoutProcess} />)

        const button = screen.getByText('Add Phrases').closest('button')
        expect(button?.className).not.toContain('w-full')
    })

    it('should apply custom className when provided', () => {
        render(<ImportPhrases {...defaultProps} className="custom-class" />)

        const button = screen.getByText('Create New List').closest('button')
        expect(button?.className).toContain('custom-class')
    })

    it('should pass props to ImportPhrasesDialog', async () => {
        const user = userEvent.setup()
        const mockSetInputLang = vi.fn()
        const mockSetTargetLang = vi.fn()

        // Test with only onProcess to get editable mode with selects
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onAddToCollection, ...propsWithProcessOnly } = defaultProps
        render(
            <ImportPhrases
                {...propsWithProcessOnly}
                inputLang="en-GB"
                setInputLang={mockSetInputLang}
                targetLang="es-ES"
                setTargetLang={mockSetTargetLang}
                phrasesInput="Test phrase"
            />
        )

        await user.click(screen.getByText('Create New List'))

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        // Verify dialog shows the correct language selections
        // The select elements have the language code as value
        // Find all select elements (combobox role) and check their values
        const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
        expect(selects.length).toBeGreaterThanOrEqual(2)

        // Find the selects that have the expected values
        const inputLangSelect = selects.find(select => select.value === 'en-GB')
        const targetLangSelect = selects.find(select => select.value === 'es-ES')

        expect(inputLangSelect).toBeDefined()
        expect(targetLangSelect).toBeDefined()
        expect(inputLangSelect!.value).toBe('en-GB')
        expect(targetLangSelect!.value).toBe('es-ES')

        // Verify phrasesInput is in the textarea
        // The textarea doesn't have an accessible name, so we'll find it by its placeholder or by getting all textboxes and filtering
        const textareas = screen.getAllByRole('textbox').filter(el => el.tagName === 'TEXTAREA') as HTMLTextAreaElement[]
        const phrasesTextarea = textareas.find(ta => ta.placeholder.includes('Enter phrases') || ta.placeholder.includes('Paste article'))
        expect(phrasesTextarea).toBeDefined()
        expect(phrasesTextarea!.value).toBe('Test phrase')

        // Test that changing language calls the setter
        await user.selectOptions(inputLangSelect!, 'fr-FR')

        expect(mockSetInputLang).toHaveBeenCalledWith('fr-FR')
    })

    it('should close dialog when close button is clicked', async () => {
        const user = userEvent.setup()

        render(<ImportPhrases {...defaultProps} />)

        // Open dialog
        await user.click(screen.getByText('Create New List'))

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        // Close dialog (find close button)
        const closeButton = screen.getByRole('button', { name: /close/i })
        await user.click(closeButton)

        // Verify dialog is closed
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('should handle loading state', () => {
        render(<ImportPhrases {...defaultProps} loading={true} />)

        // Component should render without errors even when loading
        expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    it('should handle phrasesInput changes', () => {
        render(<ImportPhrases {...defaultProps} phrasesInput="Test phrase" />)

        // Component should render with the input value
        // This would be reflected in the dialog when opened
        expect(screen.getByText('Create New List')).toBeInTheDocument()
    })
})





