import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getProducts,
  getLowStockProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  stockIn,
  stockOut,
} from '@/services/inventory.service';
import { queryClient } from '@/lib/queryClient';
import type { CreateProductPayload, UpdateProductPayload, StockAdjustPayload } from '@/types';

export function useProducts(shopId: string) {
  return useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId),
    enabled: !!shopId,
  });
}

export function useLowStockProducts(shopId: string) {
  return useQuery({
    queryKey: ['products', shopId, 'low-stock'],
    queryFn: () => getLowStockProducts(shopId),
    enabled: !!shopId,
  });
}

export function useProduct(shopId: string, productId: string) {
  return useQuery({
    queryKey: ['products', shopId, productId],
    queryFn: () => getProduct(shopId, productId),
    enabled: !!shopId && !!productId,
  });
}

export function useCreateProduct(shopId: string) {
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(shopId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      toast.success('Product created!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create product');
    },
  });
}

export function useUpdateProduct(shopId: string) {
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductPayload;
    }) => updateProduct(shopId, productId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      queryClient.setQueryData(['products', shopId, updated.id], updated);
      toast.success('Product updated!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update product');
    },
  });
}

export function useDeleteProduct(shopId: string) {
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(shopId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      toast.success('Product deactivated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    },
  });
}

export function useStockIn(shopId: string) {
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: StockAdjustPayload }) =>
      stockIn(shopId, productId, payload),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['products', shopId, 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      queryClient.setQueryData(['products', shopId, updatedProduct.id], updatedProduct);
      toast.success(`Stock added! New total: ${updatedProduct.stock_quantity}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add stock');
    },
  });
}

export function useStockOut(shopId: string) {
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: StockAdjustPayload }) =>
      stockOut(shopId, productId, payload),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['products', shopId, 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', shopId] });
      queryClient.setQueryData(['products', shopId, updatedProduct.id], updatedProduct);
      toast.success(`Stock removed! New total: ${updatedProduct.stock_quantity}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to remove stock');
    },
  });
}
