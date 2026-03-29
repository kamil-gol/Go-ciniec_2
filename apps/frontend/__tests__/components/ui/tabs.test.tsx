/**
 * Tabs Component Tests
 *
 * Tests shadcn/ui Tabs (Radix-based):
 * - Renders tab triggers
 * - Shows active tab content
 * - Switches between tabs
 * - Disabled tab trigger
 *
 * Note: Uses radix-tabs mock with state management.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs', () => {
  const renderTabs = (defaultValue = 'tab1') => {
    return render(
      <Tabs defaultValue={defaultValue}>
        <TabsList>
          <TabsTrigger value="tab1">Ogolne</TabsTrigger>
          <TabsTrigger value="tab2">Menu</TabsTrigger>
          <TabsTrigger value="tab3">Platnosci</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Zakladka ogolne</TabsContent>
        <TabsContent value="tab2">Zakladka menu</TabsContent>
        <TabsContent value="tab3">Zakladka platnosci</TabsContent>
      </Tabs>
    )
  }

  it('should render all tab triggers', () => {
    renderTabs()
    expect(screen.getByRole('tab', { name: 'Ogolne' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Menu' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Platnosci' })).toBeInTheDocument()
  })

  it('should show default tab content', () => {
    renderTabs('tab1')
    expect(screen.getByText('Zakladka ogolne')).toBeInTheDocument()
    expect(screen.queryByText('Zakladka menu')).not.toBeInTheDocument()
  })

  it('should switch tab content on click', () => {
    renderTabs('tab1')
    fireEvent.click(screen.getByRole('tab', { name: 'Menu' }))
    expect(screen.getByText('Zakladka menu')).toBeInTheDocument()
    expect(screen.queryByText('Zakladka ogolne')).not.toBeInTheDocument()
  })

  it('should mark active tab as selected', () => {
    renderTabs('tab1')
    expect(screen.getByRole('tab', { name: 'Ogolne' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Menu' })).toHaveAttribute('aria-selected', 'false')
  })

  it('should render tablist role', () => {
    renderTabs()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('should render tabpanel for active content', () => {
    renderTabs('tab1')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Zakladka ogolne')
  })
})
