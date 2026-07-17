import { mockDemandData } from '@/mocks/demand.mock';
import { delay } from '@/lib/utils';

export async function getDemandData() {
  await delay(600);
  return mockDemandData;
}
