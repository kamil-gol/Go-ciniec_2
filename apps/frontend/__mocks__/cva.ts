/**
 * Lightweight class-variance-authority stub.
 */
export function cva(base: string, config?: any) {
  return (props?: any) => {
    const extra = props?.className ?? props?.class ?? '';
    return extra ? `${base} ${extra}` : base;
  };
}

export type VariantProps<T> = Record<string, any>;
