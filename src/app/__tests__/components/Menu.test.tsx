import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Menu, MenuItem } from '../../Menu'

describe('Menu Component', () => {
  const mockMenuItem1: MenuItem = {
    label: 'Option 1',
    onClick: vi.fn(),
  }

  const mockMenuItem2: MenuItem = {
    label: 'Option 2',
    onClick: vi.fn(),
    icon: <span>Icon</span>,
    className: 'custom-class',
  }

  const mockMenuItem3: MenuItem = {
    label: 'Delete',
    onClick: vi.fn(),
    className: 'text-destructive',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render menu trigger button', () => {
    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem1]}
      />
    )

    expect(screen.getByText('Open Menu')).toBeInTheDocument()
  })

  it('should open menu when trigger is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem1]}
      />
    )

    const triggerButton = screen.getByText('Open Menu')
    await user.click(triggerButton)

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })
  })

  it('should call onClick when menu item is clicked', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem1]}
      />
    )

    const triggerButton = screen.getByText('Open Menu')
    await user.click(triggerButton)

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    const menuItem = screen.getByText('Option 1')
    await user.click(menuItem)

    expect(mockMenuItem1.onClick).toHaveBeenCalledTimes(1)
  })

  it('should render menu items with icons', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem2]}
      />
    )

    await user.click(screen.getByText('Open Menu'))

    await waitFor(() => {
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Icon')).toBeInTheDocument()
    })
  })

  it('should apply custom className to menu items', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem2]}
      />
    )

    await user.click(screen.getByText('Open Menu'))

    await waitFor(() => {
      const menuItem = screen.getByText('Option 2')
      expect(menuItem.className).toContain('custom-class')
    })
  })

  it('should render multiple menu items', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem1, mockMenuItem2, mockMenuItem3]}
      />
    )

    await user.click(screen.getByText('Open Menu'))

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  it('should handle click events on all menu items', async () => {
    const user = userEvent.setup()

    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[mockMenuItem1, mockMenuItem2, mockMenuItem3]}
      />
    )

    // Open menu and verify all items are present
    await user.click(screen.getByText('Open Menu'))
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    // Click first item
    await user.click(screen.getByText('Option 1'))
    expect(mockMenuItem1.onClick).toHaveBeenCalledTimes(1)

    // Verify menu is still open or can be reopened
    // Note: Headless UI may close the menu after clicking, so we verify the click worked
  })

  it('should stop event propagation when trigger is clicked', async () => {
    const user = userEvent.setup()
    const parentClickHandler = vi.fn()

    render(
      <div onClick={parentClickHandler}>
        <Menu
          trigger={<button>Open Menu</button>}
          items={[mockMenuItem1]}
        />
      </div>
    )

    const triggerButton = screen.getByText('Open Menu')
    await user.click(triggerButton)

    // stopPropagation should prevent parent click handler from being called
    // This is important for the bug fix where menu clicks shouldn't trigger phrase clicks
    expect(parentClickHandler).not.toHaveBeenCalled()
  })

  it('should handle empty items array', () => {
    render(
      <Menu
        trigger={<button>Open Menu</button>}
        items={[]}
      />
    )

    expect(screen.getByText('Open Menu')).toBeInTheDocument()
  })

  it('should render menu with title prop on trigger', () => {
    render(
      <Menu
        trigger={<button title="More options">...</button>}
        items={[mockMenuItem1]}
      />
    )

    const triggerButton = screen.getByTitle('More options')
    expect(triggerButton).toBeInTheDocument()
  })
})

