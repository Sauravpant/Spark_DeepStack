import api from '@/lib/api';
import type {
  ApiResponse,
  CreditRiskExplanation,
  CreditRiskFeatures,
  CreditRiskGlobalImportance,
  CreditRiskPrediction,
  DemandForecastDay,
  DemandForecastExplainDay,
  DemandForecastRequest,
  DemandGlobalImportance,
} from '@/types';


export interface DemandProductPayload {
  last_date: string;
  sales_history?: number[];
  transactions_history?: number[];
}

// ── Credit Risk — per customer ────────────────────────────────────────────────

export async function predictCreditRiskForCustomer(
  shopId: string,
  customerId: string,
  save = true
): Promise<CreditRiskPrediction> {
  const res = await api.post<ApiResponse<CreditRiskPrediction>>(
    `/shops/${shopId}/customers/${customerId}/credit-risk/predict`,
    null,
    { params: { save } }
  );
  return res.data.data;
}

export async function explainCreditRiskForCustomer(
  shopId: string,
  customerId: string,
  topK = 5
): Promise<CreditRiskExplanation> {
  const res = await api.post<ApiResponse<CreditRiskExplanation>>(
    `/shops/${shopId}/customers/${customerId}/credit-risk/explain`,
    null,
    { params: { top_k: topK } }
  );
  return res.data.data;
}

// ── Credit Risk — generic ML ──────────────────────────────────────────────────

export async function predictCreditRisk(
  features: CreditRiskFeatures
): Promise<CreditRiskPrediction> {
  const res = await api.post<ApiResponse<CreditRiskPrediction>>(
    '/ml/credit-risk/predict',
    features
  );
  return res.data.data;
}

export async function predictCreditRiskProbability(
  features: CreditRiskFeatures
): Promise<Record<string, number>> {
  const res = await api.post<ApiResponse<Record<string, number>>>(
    '/ml/credit-risk/predict-probability',
    features
  );
  return res.data.data;
}

export async function explainCreditRisk(
  features: CreditRiskFeatures,
  topK = 5
): Promise<CreditRiskExplanation> {
  const res = await api.post<ApiResponse<CreditRiskExplanation>>(
    '/ml/credit-risk/explain',
    features,
    { params: { top_k: topK } }
  );
  return res.data.data;
}

export async function getCreditRiskGlobalImportance(): Promise<CreditRiskGlobalImportance> {
  const res = await api.get<ApiResponse<CreditRiskGlobalImportance>>(
    '/ml/credit-risk/global-importance'
  );
  return res.data.data;
}

export async function getCreditRiskModelInfo(): Promise<Record<string, unknown>> {
  const res = await api.get<ApiResponse<Record<string, unknown>>>('/ml/credit-risk/model-info');
  return res.data.data;
}

// ── Demand — per product ──────────────────────────────────────────────────────

export async function getDemandForecastNextDay(
  shopId: string,
  productId: string,
  payload?: Partial<DemandProductPayload>
): Promise<DemandForecastDay> {
  const body: DemandProductPayload = {
    last_date: payload?.last_date ?? new Date().toISOString().slice(0, 10),
    sales_history: payload?.sales_history,
    transactions_history: payload?.transactions_history,
  };
  const res = await api.post<ApiResponse<DemandForecastDay>>(
    `/shops/${shopId}/demand/products/${productId}/predict-next-day`,
    body
  );
  return res.data.data;
}

export async function getDemandForecastNext7Days(
  shopId: string,
  productId: string,
  payload?: Partial<DemandProductPayload>
): Promise<DemandForecastDay[]> {
  const body: DemandProductPayload = {
    last_date: payload?.last_date ?? new Date().toISOString().slice(0, 10),
    sales_history: payload?.sales_history,
    transactions_history: payload?.transactions_history,
  };
  const res = await api.post<ApiResponse<DemandForecastDay[]>>(
    `/shops/${shopId}/demand/products/${productId}/predict-next-7-days`,
    body
  );
  return res.data.data;
}

// ── Demand — generic ML ───────────────────────────────────────────────────────

export async function predictDemandNextDay(
  payload: DemandForecastRequest
): Promise<DemandForecastDay> {
  const res = await api.post<ApiResponse<DemandForecastDay>>(
    '/ml/demand/predict-next-day',
    payload
  );
  return res.data.data;
}

export async function predictDemandNext7Days(
  payload: DemandForecastRequest
): Promise<DemandForecastDay[]> {
  const res = await api.post<ApiResponse<DemandForecastDay[]>>(
    '/ml/demand/predict-next-7-days',
    payload
  );
  return res.data.data;
}

export async function explainDemandNextDay(
  payload: DemandForecastRequest
): Promise<DemandForecastExplainDay> {
  const res = await api.post<ApiResponse<DemandForecastExplainDay>>(
    '/ml/demand/explain-next-day',
    payload
  );
  return res.data.data;
}

export async function explainDemandNext7Days(
  payload: DemandForecastRequest
): Promise<DemandForecastExplainDay[]> {
  const res = await api.post<ApiResponse<DemandForecastExplainDay[]>>(
    '/ml/demand/explain-next-7-days',
    payload
  );
  return res.data.data;
}

export async function getDemandModelInfo(): Promise<Record<string, unknown>> {
  const res = await api.get<ApiResponse<Record<string, unknown>>>('/ml/demand/model-info');
  return res.data.data;
}

export async function getDemandGlobalImportance(): Promise<DemandGlobalImportance> {
  const res = await api.get<ApiResponse<DemandGlobalImportance>>(
    '/ml/demand/global-importance'
  );
  return res.data.data;
}
