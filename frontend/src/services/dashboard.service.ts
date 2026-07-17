import { mockDashboardData } from '@/mocks/dashboard.mock';
import { delay } from '@/lib/utils';

export async function getDashboardData() {
  await delay(600);
  return mockDashboardData;
}
