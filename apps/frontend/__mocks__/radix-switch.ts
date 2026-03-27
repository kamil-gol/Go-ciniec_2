/**
 * @radix-ui/react-switch stub — renders <button role="switch"> for proper accessibility queries.
 */
import React from 'react';

// Simple stub without state — tests only need role="switch" + aria-checked
export const Root = React.forwardRef<HTMLButtonElement, any>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ children, checked, defaultChecked, onCheckedChange, className, disabled, ...props }, ref) => {
    const isChecked = checked ?? defaultChecked ?? false;
    return React.createElement(
      'button',
      {
        ref,
        role: 'switch',
        type: 'button',
        'aria-checked': isChecked,
        'data-state': isChecked ? 'checked' : 'unchecked',
        disabled,
        className,
        onClick: () => onCheckedChange?.(!isChecked),
        ...props,
      },
      children
    );
  }
);
Root.displayName = 'Switch';

export const Thumb = React.forwardRef<HTMLSpanElement, any>(
  ({ className, ...props }, ref) =>
    React.createElement('span', { ref, className, ...props })
);
Thumb.displayName = 'SwitchThumb';

export default { Root, Thumb };
