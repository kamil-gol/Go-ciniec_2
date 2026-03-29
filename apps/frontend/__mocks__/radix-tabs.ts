/**
 * @radix-ui/react-tabs stub — renders semantic tab structure for testing.
 */
import React from 'react';

export const Root = ({ children, defaultValue, value, onValueChange, ...props }: any) => {
  const [active, setActive] = React.useState(value ?? defaultValue ?? '');
  const current = value ?? active;
  const handleChange = (v: string) => {
    if (!value) setActive(v);
    onValueChange?.(v);
  };
  return React.createElement(
    'div',
    { 'data-orientation': 'horizontal', ...props },
    React.Children.map(children, (child: any) =>
      React.isValidElement(child)
        ? React.cloneElement(child as any, { __tabsValue: current, __tabsOnChange: handleChange })
        : child
    )
  );
};
Root.displayName = 'Tabs';

export const List = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, __tabsValue, __tabsOnChange, ...props }, ref) =>
    React.createElement(
      'div',
      { ref, role: 'tablist', className, ...props },
      React.Children.map(children, (child: any) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, { __tabsValue, __tabsOnChange })
          : child
      )
    )
);
List.displayName = 'TabsList';

export const Trigger = React.forwardRef<HTMLButtonElement, any>(
  ({ children, value, className, __tabsValue, __tabsOnChange, disabled, ...props }, ref) =>
    React.createElement(
      'button',
      {
        ref,
        role: 'tab',
        type: 'button',
        'aria-selected': __tabsValue === value,
        'data-state': __tabsValue === value ? 'active' : 'inactive',
        disabled,
        className,
        onClick: () => !disabled && __tabsOnChange?.(value),
        ...props,
      },
      children
    )
);
Trigger.displayName = 'TabsTrigger';

export const Content = React.forwardRef<HTMLDivElement, any>(
  ({ children, value, className, __tabsValue, __tabsOnChange, ...props }, ref) => {
    if (__tabsValue !== value) return null;
    return React.createElement(
      'div',
      { ref, role: 'tabpanel', 'data-state': 'active', className, ...props },
      children
    );
  }
);
Content.displayName = 'TabsContent';

export default { Root, List, Trigger, Content };
