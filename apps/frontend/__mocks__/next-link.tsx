/**
 * Lightweight next/link stub.
 */
import React from 'react';

const Link = React.forwardRef(({ children, href, ...props }: any, ref: any) =>
  React.createElement('a', { href, ref, ...props }, children)
);
Link.displayName = 'Link';

export default Link;
