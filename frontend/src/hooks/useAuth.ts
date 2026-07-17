import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, register, getMe, logout as logoutApi } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';
import { queryClient } from '@/lib/queryClient';
import type { LoginPayload, RegisterPayload } from '@/types';
import { ROUTES } from '@/constants/routes';

export function useLoginMutation() {
  const { login: storeLogin } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      storeLogin(data.token.access_token, data.user);
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Welcome back!');
      navigate(ROUTES.HOME);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
    },
  });
}

export function useRegisterMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: () => {
      toast.success('Account created! Please log in.');
      navigate(ROUTES.LOGIN);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    },
  });
}

export function useMe() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
    staleTime: 1000 * 60 * 10,
  });
}

export function useLogoutMutation() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
  });
}
