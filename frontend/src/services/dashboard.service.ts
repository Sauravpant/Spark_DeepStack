import api from '@/lib/api';
import type { ApiResponse, DashboardData } from '@/types';

export async function getDashboardData(shopId: string): Promise<DashboardData> {
  const res = await api.get<ApiResponse<DashboardData>>(`/shops/${shopId}/dashboard/`);
  return res.data.data;
}
