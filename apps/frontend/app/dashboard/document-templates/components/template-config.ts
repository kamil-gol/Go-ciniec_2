import {
  FileText,
  Mail,
  UtensilsCrossed,
  LayoutTemplate,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';
import type { TemplateCategory } from '@/types/document-template.types';

export const CATEGORY_CONFIG: Record<TemplateCategory, {
  icon: typeof FileText;
  emoji: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
}> = {
  RESERVATION_PDF: {
    icon: FileText,
    emoji: '📄',
    gradient: 'from-blue-500 to-cyan-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  CATERING_PDF: {
    icon: UtensilsCrossed,
    emoji: '🍽️',
    gradient: 'from-emerald-500 to-teal-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  EMAIL: {
    icon: Mail,
    emoji: '✉️',
    gradient: 'from-violet-500 to-purple-500',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/30',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  EMAIL_LAYOUT: {
    icon: LayoutTemplate,
    emoji: '🎨',
    gradient: 'from-rose-500 to-pink-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  PDF_LAYOUT_CONFIG: {
    icon: SlidersHorizontal,
    emoji: '⚙️',
    gradient: 'from-slate-500 to-gray-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/30',
    badgeText: 'text-slate-700 dark:text-slate-300',
  },
  POLICY: {
    icon: BookOpen,
    emoji: '📋',
    gradient: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
};

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąĄ]/g, 'a')
    .replace(/[ćĆ]/g, 'c')
    .replace(/[ęĘ]/g, 'e')
    .replace(/[łŁ]/g, 'l')
    .replace(/[ńŃ]/g, 'n')
    .replace(/[óÓ]/g, 'o')
    .replace(/[śŚ]/g, 's')
    .replace(/[źŹżŻ]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
