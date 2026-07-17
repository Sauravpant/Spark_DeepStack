import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getShops,
  getShop,
  createShop,
  updateShop,
  deleteShop,
} from '@/services/shop.service';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/providers/AuthProvider';
import type { CreateShopPayload, UpdateShopPayload } from '@/types';

export function useShops() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
    enabled: !!token,
  });
}

export function useShop(shopId: string) {
  return useQuery({
    queryKey: ['shops', shopId],
    queryFn: () => getShop(shopId),
    enabled: !!shopId,
  });
}

export function useCreateShop() {
  const { setActiveShop } = useAuth();

  return useMutation({
    mutationFn: (payload: CreateShopPayload) => createShop(payload),
    onSuccess: (newShop) => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setActiveShop(newShop);
      toast.success('Shop created successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create shop');
    },
  });
}

export function useUpdateShop(shopId: string) {
  const { setActiveShop, activeShop } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateShopPayload) => updateShop(shopId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.setQueryData(['shops', shopId], updated);
      if (activeShop?.id === updated.id) {
        setActiveShop(updated);
      }
      toast.success('Shop updated!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update shop');
    },
  });
}

export function useDeleteShop() {
  return useMutation({
    mutationFn: (shopId: string) => deleteShop(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop deleted');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete shop');
    },
  });
}
