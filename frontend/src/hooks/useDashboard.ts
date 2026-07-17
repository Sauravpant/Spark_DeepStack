import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/services/dashboard.service';

export function useDashboard(shopId: string) {
  return useQuery({
    queryKey: ['dashboard', shopId],
    queryFn: () => getDashboardData(shopId),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2, // 2 min - dashboard refreshes more often
  });
}
