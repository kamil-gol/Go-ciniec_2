/**
 * @radix-ui/react-label stub — renders <label> with htmlFor support.
 */
import React from 'react';

export const Root = React.forwardRef<HTMLLabelElement, any>(
  ({ children, className, htmlFor, ...props }, ref) =>
    React.createElement('label', { ref, className, htmlFor, ...props }, children)
);
Root.displayName = 'Label';

export default { Root };
