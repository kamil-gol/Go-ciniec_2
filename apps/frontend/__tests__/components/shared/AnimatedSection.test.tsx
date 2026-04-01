import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: any) => (
      <div className={className} data-testid="motion-div">{children}</div>
    ),
  },
}))

import { AnimatedSection } from '@/components/shared/AnimatedSection'

describe('AnimatedSection', () => {
  it('should render children', () => {
    render(<AnimatedSection>Section content</AnimatedSection>)
    expect(screen.getByText('Section content')).toBeInTheDocument()
  })

  it('should render inside a motion.div wrapper', () => {
    render(<AnimatedSection>Content</AnimatedSection>)
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
  })

  it('should accept an index prop for stagger delay', () => {
    render(<AnimatedSection index={3}>Staggered</AnimatedSection>)
    expect(screen.getByText('Staggered')).toBeInTheDocument()
  })

  it('should accept a className prop', () => {
    render(<AnimatedSection className="my-custom-class">Styled</AnimatedSection>)
    expect(screen.getByTestId('motion-div').className).toContain('my-custom-class')
  })

  it('should default index to 0', () => {
    render(<AnimatedSection>Default index</AnimatedSection>)
    expect(screen.getByText('Default index')).toBeInTheDocument()
  })

  it('should render complex children', () => {
    render(
      <AnimatedSection index={1}>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </AnimatedSection>
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })
})
