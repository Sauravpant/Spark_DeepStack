import { useQuery } from '@tanstack/react-query';
import { getDemandData } from '@/services/demand.service';

export function useDemand() {
  return useQuery({ queryKey: ['demand'], queryFn: getDemandData });
}
