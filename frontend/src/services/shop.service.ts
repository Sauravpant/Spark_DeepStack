import api from '@/lib/api';
import type { ApiResponse, Shop, CreateShopPayload, UpdateShopPayload } from '@/types';

export async function getShops(): Promise<Shop[]> {
  const res = await api.get<ApiResponse<Shop[]>>('/shops/');
  return res.data.data;
}

export async function getShop(shopId: string): Promise<Shop> {
  const res = await api.get<ApiResponse<Shop>>(`/shops/${shopId}`);
  return res.data.data;
}

export async function createShop(payload: CreateShopPayload): Promise<Shop> {
  const res = await api.post<ApiResponse<Shop>>('/shops/', payload);
  return res.data.data;
}

export async function updateShop(shopId: string, payload: UpdateShopPayload): Promise<Shop> {
  const res = await api.patch<ApiResponse<Shop>>(`/shops/${shopId}`, payload);
  return res.data.data;
}

export async function deleteShop(shopId: string): Promise<void> {
  await api.delete(`/shops/${shopId}`);
}
