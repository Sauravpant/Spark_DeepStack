import api from '@/lib/api';
import type {
  ApiResponse,
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '@/types';

export async function getCustomers(shopId: string): Promise<Customer[]> {
  const res = await api.get<ApiResponse<Customer[]>>(`/shops/${shopId}/customers/`);
  return res.data.data;
}

export async function getCustomer(shopId: string, customerId: string): Promise<Customer> {
  const res = await api.get<ApiResponse<Customer>>(`/shops/${shopId}/customers/${customerId}`);
  return res.data.data;
}

export async function createCustomer(shopId: string, payload: CreateCustomerPayload): Promise<Customer> {
  const res = await api.post<ApiResponse<Customer>>(`/shops/${shopId}/customers/`, payload);
  return res.data.data;
}

export async function updateCustomer(
  shopId: string,
  customerId: string,
  payload: UpdateCustomerPayload
): Promise<Customer> {
  const res = await api.patch<ApiResponse<Customer>>(
    `/shops/${shopId}/customers/${customerId}`,
    payload
  );
  return res.data.data;
}

export async function deleteCustomer(shopId: string, customerId: string): Promise<void> {
  await api.delete(`/shops/${shopId}/customers/${customerId}`);
}
