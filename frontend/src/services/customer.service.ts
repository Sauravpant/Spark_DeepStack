import { mockCustomers, mockCustomerStats } from '@/mocks/customer.mock';
import { delay } from '@/lib/utils';

export async function getCustomers() {
  await delay(500);
  return mockCustomers;
}

export async function getCustomerStats() {
  await delay(400);
  return mockCustomerStats;
}

export async function getCustomerById(id: string) {
  await delay(300);
  return mockCustomers.find(c => c.id === id) ?? null;
}
