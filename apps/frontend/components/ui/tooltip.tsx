"use client"

import * as React from "react"

/**
 * Lightweight Tooltip components — no external dependency.
 * Uses native `title` attribute + CSS hover for tooltip display.
 * API-compatible with shadcn/ui Tooltip so consumers don't need changes.
 */

const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ children }) => (
  <>{children}</>
);
TooltipProvider.displayName = 'TooltipProvider';

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-flex group">{children}</div>
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
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'bottom', children, ...props }, ref) => {
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
      left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
      right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    };

    return (
      <div
        ref={ref}
        className={[
          'absolute z-50 hidden group-hover:block',
          'rounded-md bg-popover-foreground dark:bg-popover px-2.5 py-1.5',
          'text-xs text-popover dark:text-popover-foreground whitespace-nowrap',
          'shadow-md pointer-events-none',
          positionClasses[side],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
