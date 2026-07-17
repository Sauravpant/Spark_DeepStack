import { useDashboard } from '@/hooks/useDashboard';

/** @deprecated Use useDashboard — kept for compatibility */
export function useReports(shopId?: string) {
  return useDashboard(shopId ?? '');
}
