import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhraseCounter } from '../../components/PhraseCounter'

describe('PhraseCounter Component', () => {
  it('should render current and total phrase count', () => {
    render(
      <PhraseCounter
        currentPhraseIndex={0}
        totalPhrases={10}
      />
    )

    expect(screen.getByText('1 / 10')).toBeInTheDocument()
  })

  it('should display correct index (1-based display)', () => {
    render(
      <PhraseCounter
        currentPhraseIndex={4}
        totalPhrases={10}
      />
    )

    expect(screen.getByText('5 / 10')).toBeInTheDocument()
  })

  it('should return null when currentPhraseIndex is undefined', () => {
    const { container } = render(
      <PhraseCounter
        currentPhraseIndex={undefined}
        totalPhrases={10}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should return null when totalPhrases is undefined', () => {
    const { container } = render(
      <PhraseCounter
        currentPhraseIndex={0}
        totalPhrases={undefined}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should return null when totalPhrases is 0', () => {
    const { container } = render(
      <PhraseCounter
        currentPhraseIndex={0}
        totalPhrases={0}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should apply custom className', () => {
    render(
      <PhraseCounter
        currentPhraseIndex={0}
        totalPhrases={10}
        className="custom-class"
      />
    )

    const counter = screen.getByText('1 / 10')
    expect(counter.className).toContain('custom-class')
  })

  it('should apply custom style', () => {
    render(
      <PhraseCounter
        currentPhraseIndex={0}
        totalPhrases={10}
        style={{ opacity: 0.5 }}
      />
    )

    const counter = screen.getByText('1 / 10')
    expect(counter).toHaveStyle({ opacity: '0.5' })
  })

  it('should handle last phrase correctly', () => {
    render(
      <PhraseCounter
        currentPhraseIndex={9}
        totalPhrases={10}
      />
    )

    expect(screen.getByText('10 / 10')).toBeInTheDocument()
  })

  it('should handle first phrase correctly', () => {
    render(
      <PhraseCounter
        currentPhraseIndex={0}
        totalPhrases={1}
      />
    )

    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })
})



