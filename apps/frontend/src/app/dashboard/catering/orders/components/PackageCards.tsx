// apps/frontend/src/app/dashboard/catering/orders/components/PackageCards.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export interface PackageOption {
  id: string;
  name: string;
  basePrice: number;
  description?: string | null;
}

interface Props {
  packages: PackageOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function fmt(v: number) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(v);
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 28,
      delay: i * 0.04,
    },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 500, damping: 20 },
  },
};

export function PackageCards({ packages, selectedId, onSelect }: Props) {
  const allOptions: (PackageOption | null)[] = [null, ...packages];

  return (
    <AnimatePresence mode="popLayout">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allOptions.map((pkg, i) => {
          const id = pkg?.id ?? '';
          const isSelected = selectedId === id;

          return (
            <motion.button
              key={id || 'NONE'}
              type="button"
              layout
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(id)}
              className={[
                'relative text-left rounded-xl border-2 p-4 transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40 bg-background',
              ].join(' ')}
            >
              {pkg === null ? (
                <>
                  <p className="font-semibold text-sm">— Bez pakietu —</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Zamówienie indywidualne
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {fmt(pkg.basePrice)}
                  </p>
                  {pkg.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}
                </>
              )}

              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    key="check"
                    variants={checkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
