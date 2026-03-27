/**
 * @radix-ui/react-switch stub — renders <button role="switch"> for proper accessibility queries.
 */
import React from 'react';

export const Root = React.forwardRef<HTMLButtonElement, any>(
  ({ children, checked, defaultChecked, onCheckedChange, className, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked ?? defaultChecked ?? false);

    React.useEffect(() => {
      if (checked !== undefined) setIsChecked(checked);
    }, [checked]);

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
        onClick: () => {
          const next = !isChecked;
          if (checked === undefined) setIsChecked(next);
          onCheckedChange?.(next);
        },
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
