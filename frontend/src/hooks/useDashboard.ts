import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/services/dashboard.service';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });
}
