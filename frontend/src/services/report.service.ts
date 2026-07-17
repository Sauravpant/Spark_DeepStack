import { mockReportData } from '@/mocks/report.mock';
import { delay } from '@/lib/utils';

export async function getReportData() {
  await delay(700);
  return mockReportData;
}
