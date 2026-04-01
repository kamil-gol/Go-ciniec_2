import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GradientDivider } from '@/components/shared/GradientDivider'

describe('GradientDivider', () => {
  it('should render a separator element', () => {
    const { container } = render(<GradientDivider />)
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument()
  })

  it('should apply border accent by default', () => {
    const { container } = render(<GradientDivider />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('via-border')
  })

  it('should apply primary accent when specified', () => {
    const { container } = render(<GradientDivider accent="primary" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('via-primary/20')
  })

  it('should apply muted accent when specified', () => {
    const { container } = render(<GradientDivider accent="muted" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('via-muted-foreground/15')
  })

  it('should apply custom className', () => {
    const { container } = render(<GradientDivider className="my-4" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('my-4')
  })

  it('should have h-px and w-full classes', () => {
    const { container } = render(<GradientDivider />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('h-px')
    expect(el.className).toContain('w-full')
  })
})
