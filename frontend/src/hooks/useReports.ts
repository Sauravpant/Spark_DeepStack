import { useQuery } from '@tanstack/react-query';
import { getReportData } from '@/services/report.service';

export function useReports() {
  return useQuery({ queryKey: ['reports'], queryFn: getReportData });
}
