import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/services/customer.service';
import { queryClient } from '@/lib/queryClient';
import type { CreateCustomerPayload, UpdateCustomerPayload } from '@/types';

export function useCustomers(shopId: string) {
  return useQuery({
    queryKey: ['customers', shopId],
    queryFn: () => getCustomers(shopId),
    enabled: !!shopId,
  });
}

export function useCustomer(shopId: string, customerId: string) {
  return useQuery({
    queryKey: ['customers', shopId, customerId],
    queryFn: () => getCustomer(shopId, customerId),
    enabled: !!shopId && !!customerId,
  });
}

export function useCreateCustomer(shopId: string) {
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(shopId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      toast.success('Customer added!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add customer');
    },
  });
}

export function useUpdateCustomer(shopId: string, customerId: string) {
  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) => updateCustomer(shopId, customerId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
      queryClient.setQueryData(['customers', shopId, customerId], updated);
      toast.success('Customer updated!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer(shopId: string) {
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(shopId, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      toast.success('Customer deactivated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to deactivate customer');
    },
  });
}
