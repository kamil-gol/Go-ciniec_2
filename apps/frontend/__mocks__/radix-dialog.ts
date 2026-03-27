/**
 * Lightweight @radix-ui/react-dialog stub.
 */
import React from 'react';

const noop = ({ children }: any) => React.createElement(React.Fragment, null, children);

export const Root = noop;
export const Trigger = noop;
export const Portal = noop;
export const Overlay = React.forwardRef(({ children, ...props }: any, ref: any) =>
  React.createElement('div', { ref, ...props }, children)
);
export const Content = React.forwardRef(({ children, ...props }: any, ref: any) =>
  React.createElement('div', { ref, ...props }, children)
);
export const Title = React.forwardRef(({ children, ...props }: any, ref: any) =>
  React.createElement('h2', { ref, ...props }, children)
);
export const Description = React.forwardRef(({ children, ...props }: any, ref: any) =>
  React.createElement('p', { ref, ...props }, children)
);
export const Close = noop;
