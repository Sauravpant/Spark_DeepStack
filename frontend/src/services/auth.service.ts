import api from '@/lib/api';
import type { ApiResponse, LoginPayload, LoginResponse, RegisterPayload, ApiUser } from '@/types';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return res.data.data;
}

export async function register(payload: RegisterPayload): Promise<ApiUser> {
  const res = await api.post<ApiResponse<ApiUser>>('/auth/register', payload);
  return res.data.data;
}

export async function getMe(): Promise<ApiUser> {
  const res = await api.get<ApiResponse<ApiUser>>('/auth/me');
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
