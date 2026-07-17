import api from '@/lib/api';
import type {
  ApiResponse,
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  StockAdjustPayload,
} from '@/types';

export async function getProducts(shopId: string): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>(`/shops/${shopId}/products/`);
  return res.data.data;
}

export async function getLowStockProducts(shopId: string): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>(`/shops/${shopId}/products/low-stock`);
  return res.data.data;
}

export async function getProduct(shopId: string, productId: string): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/shops/${shopId}/products/${productId}`);
  return res.data.data;
}

export async function createProduct(shopId: string, payload: CreateProductPayload): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>(`/shops/${shopId}/products/`, payload);
  return res.data.data;
}

export async function updateProduct(
  shopId: string,
  productId: string,
  payload: UpdateProductPayload
): Promise<Product> {
  const res = await api.patch<ApiResponse<Product>>(`/shops/${shopId}/products/${productId}`, payload);
  return res.data.data;
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  await api.delete(`/shops/${shopId}/products/${productId}`);
}

export async function stockIn(
  shopId: string,
  productId: string,
  payload: StockAdjustPayload
): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>(
    `/shops/${shopId}/products/${productId}/stock-in`,
    payload
  );
  return res.data.data;
}

export async function stockOut(
  shopId: string,
  productId: string,
  payload: StockAdjustPayload
): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>(
    `/shops/${shopId}/products/${productId}/stock-out`,
    payload
  );
  return res.data.data;
}
