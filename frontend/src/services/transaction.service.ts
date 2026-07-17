import { mockTransactions, mockTransactionStats } from '@/mocks/transaction.mock';
import { delay } from '@/lib/utils';

export async function getTransactions() {
  await delay(500);
  return mockTransactions;
}

export async function getTransactionStats() {
  await delay(400);
  return mockTransactionStats;
}
