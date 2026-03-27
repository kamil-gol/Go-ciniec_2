/**
 * Lightweight class-variance-authority stub.
 */
export function cva(base: string, config?: any) {
  return (props?: any) => base;
}

export type VariantProps<T> = Record<string, any>;
