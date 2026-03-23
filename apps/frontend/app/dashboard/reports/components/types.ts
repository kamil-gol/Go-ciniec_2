import type {
  useRevenueReport,
  useOccupancyReport,
  usePreparationsReport,
  useMenuPreparationsReport,
} from '@/hooks/use-reports';
import type { GroupByPeriod } from '@/types/reports.types';

export type ReportTab = 'revenue' | 'occupancy' | 'preparations' | 'menu-preparations';

export type SummaryCardColor = 'blue' | 'green' | 'red' | 'purple' | 'orange';

export type RevenueQueryResult = ReturnType<typeof useRevenueReport>;
export type OccupancyQueryResult = ReturnType<typeof useOccupancyReport>;
export type PreparationsQueryResult = ReturnType<typeof usePreparationsReport>;
export type MenuPreparationsQueryResult = ReturnType<typeof useMenuPreparationsReport>;

export interface DatePreset {
  label: string;
  dateFrom: string;
  dateTo: string;
}

export interface ReportFiltersProps {
  presets: DatePreset[];
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  activeTab: ReportTab;
  groupBy: GroupByPeriod;
  setGroupBy: (v: GroupByPeriod) => void;
  prepView: 'detailed' | 'summary';
  setPrepView: (v: 'detailed' | 'summary') => void;
  menuPrepView: 'detailed' | 'summary';
  setMenuPrepView: (v: 'detailed' | 'summary') => void;
}
