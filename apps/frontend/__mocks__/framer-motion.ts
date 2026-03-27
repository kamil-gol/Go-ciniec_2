/**
 * Lightweight framer-motion stub — used via resolve.alias to prevent
 * Vitest/esbuild from transforming the real 90KB+ package.
 */
import React from 'react';

const handler: ProxyHandler<any> = {
  get: (_target, prop: string) => {
    return React.forwardRef((props: any, ref: any) => {
      const {
        initial, animate, exit, transition, variants,
        whileHover, whileTap, whileFocus, whileInView,
        layout, layoutId, drag, dragConstraints,
        onDragEnd, onAnimationComplete,
        ...rest
      } = props;
      return React.createElement(prop, { ...rest, ref });
    });
  },
};

export const motion = new Proxy({}, handler);
export const AnimatePresence = ({ children }: any) => React.createElement(React.Fragment, null, children);
export const useAnimation = () => ({ start: () => {}, stop: () => {} });
export const useMotionValue = (val: any) => ({ get: () => val, set: () => {}, onChange: () => {} });
export const useTransform = (val: any) => val;
export const useInView = () => true;
export const useScroll = () => ({ scrollY: { get: () => 0, onChange: () => {} } });
export const LayoutGroup = ({ children }: any) => React.createElement(React.Fragment, null, children);
