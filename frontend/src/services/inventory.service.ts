import { mockInventory, mockInventoryStats } from '@/mocks/inventory.mock';
import { delay } from '@/lib/utils';

export async function getInventory() {
  await delay(500);
  return mockInventory;
}

export async function getInventoryStats() {
  await delay(400);
  return mockInventoryStats;
}
