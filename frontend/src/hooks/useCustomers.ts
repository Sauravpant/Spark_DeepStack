import { useQuery } from '@tanstack/react-query';
import { getCustomers, getCustomerStats, getCustomerById } from '@/services/customer.service';

export function useCustomers() {
  return useQuery({ queryKey: ['customers'], queryFn: getCustomers });
}

export function useCustomerStats() {
  return useQuery({ queryKey: ['customer-stats'], queryFn: getCustomerStats });
}

export function useCustomer(id: string) {
  return useQuery({ queryKey: ['customer', id], queryFn: () => getCustomerById(id), enabled: !!id });
}
