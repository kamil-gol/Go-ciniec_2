/**
 * Universal @radix-ui/* stub — handles dialog, alert-dialog, select, switch, label, slot.
 * Returns forwardRef components that pass-through children.
 */
import React from 'react';

const passthrough = React.forwardRef(({ children, ...props }: any, ref: any) =>
  React.createElement('div', { ref, ...props }, children)
);
passthrough.displayName = 'RadixStub';

const fragment = ({ children }: any) => React.createElement(React.Fragment, null, children);

// Common Radix primitives
export const Root = fragment;
export const Trigger = passthrough;
export const Portal = fragment;
export const Overlay = passthrough;
export const Content = passthrough;
export const Title = passthrough;
export const Description = passthrough;
export const Close = passthrough;
export const Action = passthrough;
export const Cancel = passthrough;

// Select-specific
export const Value = passthrough;
export const Icon = passthrough;
export const Viewport = passthrough;
export const Item = passthrough;
export const ItemText = passthrough;
export const ItemIndicator = passthrough;
export const Group = passthrough;
export const Label = passthrough;
export const Separator = passthrough;
export const ScrollUpButton = passthrough;
export const ScrollDownButton = passthrough;

// Switch-specific
export const Thumb = passthrough;

// Slot (used in button.tsx)
export const Slot = React.forwardRef(({ children, ...props }: any, ref: any) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as any, { ...props, ref });
  }
  return React.createElement('span', { ref, ...props }, children);
});

// DropdownMenu-specific
export const Sub = fragment;
export const SubTrigger = passthrough;
SubTrigger.displayName = 'SubTrigger';
export const SubContent = passthrough;
SubContent.displayName = 'SubContent';
export const RadioGroup = passthrough;
RadioGroup.displayName = 'RadioGroup';
export const RadioItem = passthrough;
RadioItem.displayName = 'RadioItem';
export const CheckboxItem = passthrough;
CheckboxItem.displayName = 'CheckboxItem';

// Default export
export default { Root, Trigger, Portal, Content, Title, Description, Close };
