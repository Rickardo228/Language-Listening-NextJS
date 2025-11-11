import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollectionHeader } from '../../CollectionHeader'
import { createMockPhrases } from '../utils/test-helpers'
import { Config } from '../../types'

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    empty: true,
    docs: [],
  }),
}))

describe('CollectionHeader Component', () => {
  const mockCollection: Config = {
    id: 'test-collection-id',
    name: 'Test Collection',
    phrases: createMockPhrases(3),
    presentationConfig: {
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
    },
  }

  const mockSavedCollections: Config[] = [mockCollection]

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset getDocs to default empty response
    const { getDocs } = await import('firebase/firestore')
    vi.mocked(getDocs).mockResolvedValue({
      empty: true,
      docs: [],
    })
  })

  it('should render collection name', async () => {
    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
      />
    )

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('Test Collection')).toBeInTheDocument()
    })
  })

  it('should return null when collection is not found', async () => {
    const { container } = render(
      <CollectionHeader
        collectionId="non-existent-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
      />
    )

    // Wait for async operations to complete
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should show menu button when menu items are available', async () => {
    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByTitle('List options')).toBeInTheDocument()
    })
  })

  it('should not show menu button when no menu items are available', async () => {
    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
      />
    )

    await waitFor(() => {
      expect(screen.queryByTitle('List options')).not.toBeInTheDocument()
    })
  })

  it('should open menu when menu button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Rename list')).toBeInTheDocument()
      expect(screen.getByText('Delete list')).toBeInTheDocument()
    })
  })

  it('should call onRename when rename option is clicked', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onRename={onRename}
      />
    )

    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Rename list')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Rename list'))

    expect(onRename).toHaveBeenCalledWith('test-collection-id')
  })

  it('should call onDelete when delete option is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onDelete={onDelete}
      />
    )

    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Delete list')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Delete list'))

    expect(onDelete).toHaveBeenCalledWith('test-collection-id')
  })

  it('should show share option when onShare is provided', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onShare={onShare}
      />
    )

    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Share with link')).toBeInTheDocument()
    })
  })

  it('should call onShare when share option is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onShare={onShare}
      />
    )

    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Share with link')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Share with link'))

    expect(onShare).toHaveBeenCalledWith('test-collection-id')
  })

  it('should show change voices option when onVoiceChange is provided', async () => {
    const user = userEvent.setup()
    const onVoiceChange = vi.fn()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onVoiceChange={onVoiceChange}
      />
    )

    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Change voices')).toBeInTheDocument()
    })
  })

  it('should open voice selection modal when change voices is clicked', async () => {
    const user = userEvent.setup()
    const onVoiceChange = vi.fn()

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onVoiceChange={onVoiceChange}
      />
    )

    // Open menu
    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Change voices')).toBeInTheDocument()
    })

    // Click change voices
    await user.click(screen.getByText('Change voices'))

    // Verify modal is actually visible (look for modal-specific content)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // Check for specific modal content:
      expect(screen.getByText('Select Voices')).toBeInTheDocument()
    })
  })

  it('should show unshare option when collection is published and onUnshare is provided', async () => {
    const user = userEvent.setup()
    const onUnshare = vi.fn()

    // Properly mock Firestore to return published collection
    const { getDocs } = await import('firebase/firestore')
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{
        id: 'published-id',
        data: () => ({ shared_from_list: 'test-collection-id' })
      }],
    } as any)

    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        onShare={vi.fn()}
        onUnshare={onUnshare}
      />
    )

    // Wait for published status check to complete
    await waitFor(() => {
      const menuButton = screen.queryByTitle('List options')
      expect(menuButton).toBeInTheDocument()
    }, { timeout: 3000 })

    // Open menu
    const menuButton = screen.getByTitle('List options')
    await user.click(menuButton)

    // Verify "Unshare" option appears (not "Share")
    await waitFor(() => {
      expect(screen.getByText('Unshare list')).toBeInTheDocument()
      expect(screen.queryByText('Share with link')).not.toBeInTheDocument()
    })
  })

  it('should apply custom className', async () => {
    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        className="custom-header-class"
      />
    )

    await waitFor(() => {
      const header = screen.getByText('Test Collection').closest('div')
      expect(header?.className).toContain('custom-header-class')
    })
  })

  it('should apply custom titleClassName', async () => {
    render(
      <CollectionHeader
        collectionId="test-collection-id"
        savedCollections={mockSavedCollections}
        inputLang="en"
        targetLang="es"
        titleClassName="custom-title-class"
      />
    )

    await waitFor(() => {
      const title = screen.getByText('Test Collection')
      expect(title.className).toContain('custom-title-class')
    })
  })
})





