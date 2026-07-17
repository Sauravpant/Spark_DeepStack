import { useQuery } from '@tanstack/react-query';
import { getTransactions, getTransactionStats } from '@/services/transaction.service';

export function useTransactions() {
  return useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
}

export function useTransactionStats() {
  return useQuery({ queryKey: ['transaction-stats'], queryFn: getTransactionStats });
}
