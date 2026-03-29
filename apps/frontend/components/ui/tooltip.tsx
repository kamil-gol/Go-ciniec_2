"use client"

import * as React from "react"
import { createPortal } from "react-dom"

/**
 * Lightweight Tooltip components with keyboard & focus support.
 * Uses a portal to render tooltips in document.body, escaping overflow:hidden containers.
 * API-compatible with shadcn/ui Tooltip so consumers don't need changes.
 */

const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ children }) => (
  <>{children}</>
);
TooltipProvider.displayName = 'TooltipProvider';

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-flex group/tooltip">{children}</div>
);
Tooltip.displayName = 'Tooltip';

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return (
    <div ref={ref} tabIndex={0} {...props}>
      {children}
    </div>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'top', children, ...props }, ref) => {
    const triggerRef = React.useRef<HTMLElement | null>(null)
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null)
    const [visible, setVisible] = React.useState(false)
    const tooltipRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      const parent = (ref as React.RefObject<HTMLDivElement>)?.current?.parentElement
        ?? tooltipRef.current?.parentElement
      if (!parent) return

      // Find the trigger sibling (previous sibling or parent's first child)
      const trigger = parent.previousElementSibling as HTMLElement
        ?? parent.parentElement?.querySelector('[tabindex], button, a') as HTMLElement
      triggerRef.current = trigger
    })

    const updatePosition = React.useCallback(() => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const tooltipEl = tooltipRef.current
      const tooltipWidth = tooltipEl?.offsetWidth ?? 0
      const tooltipHeight = tooltipEl?.offsetHeight ?? 0

      let top = 0
      let left = 0

      switch (side) {
        case 'top':
          top = rect.top - tooltipHeight - 6
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case 'bottom':
          top = rect.bottom + 6
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.left - tooltipWidth - 6
          break
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.right + 6
          break
      }

      // Clamp to viewport
      left = Math.max(4, Math.min(left, window.innerWidth - tooltipWidth - 4))
      top = Math.max(4, top)

      setPos({ top, left })
    }, [side])

    React.useEffect(() => {
      if (visible) updatePosition()
    }, [visible, updatePosition])

    // Listen for group hover via DOM
    React.useEffect(() => {
      const group = tooltipRef.current?.closest('.group\\/tooltip')
      if (!group) return

      const show = () => { setVisible(true) }
      const hide = () => { setVisible(false) }

      group.addEventListener('mouseenter', show)
      group.addEventListener('mouseleave', hide)
      group.addEventListener('focusin', show)
      group.addEventListener('focusout', hide)

      return () => {
        group.removeEventListener('mouseenter', show)
        group.removeEventListener('mouseleave', hide)
        group.removeEventListener('focusin', show)
        group.removeEventListener('focusout', hide)
      }
    }, [])

    // Hidden anchor element to find the group
    const anchor = (
      <div ref={tooltipRef} className="hidden" />
    )

    const portal = visible && pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="tooltip"
            className={[
              'fixed z-[9999] pointer-events-none',
              'rounded-md bg-neutral-900 dark:bg-neutral-100 px-2.5 py-1.5',
              'text-xs text-white dark:text-neutral-900 whitespace-nowrap',
              'shadow-md animate-fade-in',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ top: pos.top, left: pos.left }}
            {...props}
          >
            {children}
          </div>,
          document.body
        )
      : null

    return (
      <>
        {anchor}
        {portal}
      </>
    )
  }
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
