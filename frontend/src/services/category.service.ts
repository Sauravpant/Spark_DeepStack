import api from '@/lib/api';
import type { ApiResponse, Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types';

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>('/categories/');
  return res.data.data;
}

export async function getCategory(categoryId: string): Promise<Category> {
  const res = await api.get<ApiResponse<Category>>(`/categories/${categoryId}`);
  return res.data.data;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await api.post<ApiResponse<Category>>('/categories/', payload);
  return res.data.data;
}

export async function updateCategory(categoryId: string, payload: UpdateCategoryPayload): Promise<Category> {
  const res = await api.patch<ApiResponse<Category>>(`/categories/${categoryId}`, payload);
  return res.data.data;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}
