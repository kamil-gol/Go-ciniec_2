"use client"

import * as React from "react"

/**
 * Lightweight Tooltip components with keyboard & focus support.
 * Uses CSS hover + focus-within for tooltip display.
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
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
      left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
      right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    };

    return (
      <div
        ref={ref}
        role="tooltip"
        className={[
          'absolute z-50 hidden group-hover/tooltip:block group-focus-within/tooltip:block',
          'rounded-lg bg-neutral-900 dark:bg-neutral-100 px-2.5 py-1.5',
          'text-xs text-white dark:text-neutral-900 whitespace-nowrap',
          'shadow-md pointer-events-none animate-fade-in',
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
