import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export type VoiceAction = 'sale' | 'purchase';

export interface VoiceMatchedItem {
  action: VoiceAction;
  spoken_product: string;
  quantity: number;
  unit?: string | null;
  product_id: string | null;
  product_name: string;
  stock_quantity: number | null;
  match_confidence: 'high' | 'none';
}

export interface VoiceExtractResult {
  extracted: {
    items: Array<{
      action: VoiceAction;
      product: string;
      quantity: number;
      unit?: string | null;
    }>;
    customer_name?: string | null;
    payment_type?: string;
    notes?: string | null;
    transactions?: Array<{
      action: VoiceAction;
      items: Array<{
        action: VoiceAction;
        product: string;
        quantity: number;
        unit?: string | null;
      }>;
      customer_name?: string | null;
      payment_type?: string;
      due_date?: string | null;
      notes?: string | null;
    }>;
  };
  matched_items: VoiceMatchedItem[];
  matched_transactions?: Array<{
    action: VoiceAction;
    customer_name?: string | null;
    customer_id?: string | null;
    payment_type: string;
    due_date?: string | null;
    notes?: string | null;
    items: Array<{
      spoken_product: string;
      quantity: number;
      unit?: string | null;
      product_id: string | null;
      product_name: string;
      stock_quantity: number | null;
      match_confidence: 'high' | 'none';
    }>;
  }>;
}

export interface VoiceConfirmLineItem {
  action: VoiceAction;
  product_id: string;
  quantity: number;
  product_name?: string;
}

export interface VoiceConfirmPayload {
  items: VoiceConfirmLineItem[];
  payment_type?: string;
  customer_id?: string;
  due_date?: string;
  notes?: string;
  transactions?: Array<{
    action: VoiceAction;
    items: VoiceConfirmLineItem[];
    payment_type?: string;
    customer_id?: string;
    due_date?: string;
    notes?: string;
  }>;
}

export interface VoiceProcessedItem {
  action: string;
  product_id: string;
  product_name: string;
  quantity: number;
  transaction_id?: string | null;
  new_stock?: number | null;
}

export interface VoiceConfirmResult {
  confirmation_text: string;
  processed: VoiceProcessedItem[];
}

const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/v1';

export async function transcribeAudio(shopId: string, blob: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  const res = await api.post<ApiResponse<{ text: string }>>(
    `/shops/${shopId}/voice/transcribe`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data.data.text;
}

export async function extractVoiceTransactions(
  shopId: string,
  text: string
): Promise<VoiceExtractResult> {
  const res = await api.post<ApiResponse<VoiceExtractResult>>(
    `/shops/${shopId}/voice/extract-transactions`,
    { text }
  );
  return res.data.data;
}

export async function confirmVoiceTransactions(
  shopId: string,
  payload: VoiceConfirmPayload
): Promise<VoiceConfirmResult> {
  const res = await api.post<ApiResponse<VoiceConfirmResult>>(
    `/shops/${shopId}/voice/confirm`,
    payload
  );
  return res.data.data;
}

export async function confirmVoiceWithAudio(
  shopId: string,
  payload: VoiceConfirmPayload
): Promise<{ audioUrl: string; confirmationText: string; processedCount: number }> {
  const token = localStorage.getItem('vyapar_access_token');
  const res = await fetch(`${BASE}/shops/${shopId}/voice/confirm-with-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Confirm failed' }));
    throw new Error(err.detail || err.message || 'Confirm failed');
  }
  const confirmationHeader = res.headers.get('X-Confirmation-Text');
  const confirmationText = confirmationHeader
    ? decodeURIComponent(confirmationHeader)
    : '';
  const processedCount = Number(res.headers.get('X-Processed-Count') || '0');
  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  return { audioUrl, confirmationText, processedCount };
}

export async function speakText(shopId: string, text: string): Promise<string> {
  const token = localStorage.getItem('vyapar_access_token');
  const res = await fetch(`${BASE}/shops/${shopId}/voice/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('TTS failed');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
