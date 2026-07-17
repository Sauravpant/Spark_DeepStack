import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  explainCreditRiskForCustomer,
  getCreditRiskGlobalImportance,
  getCreditRiskModelInfo,
  getDemandForecastNext7Days,
  getDemandForecastNextDay,
  getDemandGlobalImportance,
  getDemandModelInfo,
  predictCreditRisk,
  predictCreditRiskForCustomer,
  predictCreditRiskProbability,
  explainCreditRisk,
  predictDemandNextDay,
  predictDemandNext7Days,
  explainDemandNextDay,
  explainDemandNext7Days,
} from '@/services/ml.service';
import type { CreditRiskFeatures, DemandForecastRequest } from '@/types';

// ── Per-customer credit risk ──────────────────────────────────────────────────

export function useCreditRiskExplain(shopId: string, customerId: string | null) {
  return useQuery({
    queryKey: ['credit-risk', 'explain', shopId, customerId],
    queryFn: () => explainCreditRiskForCustomer(shopId, customerId!),
    enabled: !!shopId && !!customerId,
    retry: 1,
  });
}

export function useCreditRiskPredict(shopId: string) {
  return useMutation({
    mutationFn: ({ customerId, save = true }: { customerId: string; save?: boolean }) =>
      predictCreditRiskForCustomer(shopId, customerId, save),
    onSuccess: () => toast.success('Credit risk prediction saved'),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Credit risk prediction failed');
    },
  });
}

// ── Generic credit risk ───────────────────────────────────────────────────────

export function useGenericCreditPredict() {
  return useMutation({
    mutationFn: (features: CreditRiskFeatures) => predictCreditRisk(features),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Prediction failed');
    },
  });
}

export function useGenericCreditProbability() {
  return useMutation({
    mutationFn: (features: CreditRiskFeatures) => predictCreditRiskProbability(features),
  });
}

export function useGenericCreditExplain() {
  return useMutation({
    mutationFn: ({ features, topK = 5 }: { features: CreditRiskFeatures; topK?: number }) =>
      explainCreditRisk(features, topK),
  });
}

export function useCreditRiskGlobalImportance(enabled = true) {
  return useQuery({
    queryKey: ['credit-risk', 'global-importance'],
    queryFn: getCreditRiskGlobalImportance,
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreditRiskModelInfo(enabled = true) {
  return useQuery({
    queryKey: ['credit-risk', 'model-info'],
    queryFn: getCreditRiskModelInfo,
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}

// ── Per-product demand ────────────────────────────────────────────────────────

export function useDemandForecast7Days(shopId: string, productId: string | null) {
  return useQuery({
    queryKey: ['demand-forecast', shopId, productId, '7d'],
    queryFn: () => getDemandForecastNext7Days(shopId, productId!),
    enabled: !!shopId && !!productId,
    retry: 1,
  });
}

export function useDemandForecastNextDay(shopId: string, productId: string | null) {
  return useQuery({
    queryKey: ['demand-forecast', shopId, productId, '1d'],
    queryFn: () => getDemandForecastNextDay(shopId, productId!),
    enabled: !!shopId && !!productId,
    retry: 1,
  });
}

// ── Generic demand ────────────────────────────────────────────────────────────

export function useGenericDemandNextDay() {
  return useMutation({
    mutationFn: (payload: DemandForecastRequest) => predictDemandNextDay(payload),
  });
}

export function useGenericDemandNext7Days() {
  return useMutation({
    mutationFn: (payload: DemandForecastRequest) => predictDemandNext7Days(payload),
  });
}

export function useGenericDemandExplainNextDay() {
  return useMutation({
    mutationFn: (payload: DemandForecastRequest) => explainDemandNextDay(payload),
  });
}

export function useGenericDemandExplainNext7Days() {
  return useMutation({
    mutationFn: (payload: DemandForecastRequest) => explainDemandNext7Days(payload),
  });
}

export function useDemandModelInfo(enabled = true) {
  return useQuery({
    queryKey: ['demand', 'model-info'],
    queryFn: getDemandModelInfo,
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}

export function useDemandGlobalImportance(enabled = true) {
  return useQuery({
    queryKey: ['demand', 'global-importance'],
    queryFn: getDemandGlobalImportance,
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}
