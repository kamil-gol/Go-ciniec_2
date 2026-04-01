import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Calendar, History } from 'lucide-react'
import { FilterTabs } from '@/components/shared/FilterTabs'

describe('FilterTabs', () => {
  const baseTabs = [
    { key: 'a', label: 'Tab A' },
    { key: 'b', label: 'Tab B' },
  ]

  it('should render all tab labels', () => {
    render(<FilterTabs tabs={baseTabs} activeKey="a" onChange={() => {}} />)
    expect(screen.getByText('Tab A')).toBeInTheDocument()
    expect(screen.getByText('Tab B')).toBeInTheDocument()
  })

  it('should call onChange when a tab is clicked', () => {
    const onChange = vi.fn()
    render(<FilterTabs tabs={baseTabs} activeKey="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('Tab B'))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('should render badge count when provided', () => {
    const tabs = [{ key: 'x', label: 'Items', count: 5 }]
    render(<FilterTabs tabs={tabs} activeKey="x" onChange={() => {}} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should not render badge when count is 0', () => {
    const tabs = [{ key: 'x', label: 'Items', count: 0 }]
    render(<FilterTabs tabs={tabs} activeKey="x" onChange={() => {}} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    const tabs = [
      { key: 'details', label: 'Details', icon: Calendar },
      { key: 'history', label: 'History', icon: History },
    ]
    const { container } = render(
      <FilterTabs tabs={tabs} activeKey="details" onChange={() => {}} />
    )
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(2)
  })

  it('should apply full width mode', () => {
    const { container } = render(
      <FilterTabs tabs={baseTabs} activeKey="a" onChange={() => {}} width="full" />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('w-full')
  })

  it('should apply active style to selected tab', () => {
    render(<FilterTabs tabs={baseTabs} activeKey="a" onChange={() => {}} />)
    const activeBtn = screen.getByText('Tab A').closest('button')!
    expect(activeBtn.className).toContain('bg-white')
    expect(activeBtn.className).toContain('shadow-sm')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <FilterTabs tabs={baseTabs} activeKey="a" onChange={() => {}} className="mt-4" />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('mt-4')
  })
})
