import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ═══ StatPill ═══

export function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label?: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
      <Icon className="w-4 h-4 shrink-0" />
      {label && <span className="text-xs text-white/70">{label}</span>}
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

// ═══ SectionCard ═══

export function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  badge,
  children,
  className,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`border-0 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden ${
        className ?? ''
      }`}
    >
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </CardTitle>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

// ═══ Field ═══

export function Field({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {value ?? '—'}
      </p>
    </div>
  );
}

// ═══ CountBadge ═══

export function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold">
      {count}
    </span>
  );
}
