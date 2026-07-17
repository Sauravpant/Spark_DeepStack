// ── Auth ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface TokenData {
  access_token: string;
  token_type: string;
}

export interface LoginResponse {
  user: ApiUser;
  token: TokenData;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone: string;
}

// ── Generic API wrapper ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Shops ─────────────────────────────────────────────────────────────────────

export type LocationType = 'urban' | 'semi_urban' | 'rural';

export interface Shop {
  id: string;
  user_id: string;
  shop_name: string;
  address: string;
  location_type: LocationType;
  created_at: string;
  updated_at: string;
}

export interface CreateShopPayload {
  shop_name: string;
  address: string;
  location_type: LocationType;
}

export interface UpdateShopPayload {
  shop_name?: string;
  address?: string;
  location_type?: LocationType;
}

// ── Categories ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  shop_id: string;
  category_id: string;
  product_name: string;
  sku: string;
  barcode?: string;
  unit: string;
  stock_quantity: number;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  is_staple: boolean;
  is_perishable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  category_id: string;
  product_name: string;
  sku: string;
  barcode?: string;
  unit: string;
  stock_quantity: number;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  is_staple: boolean;
  is_perishable: boolean;
}

export interface UpdateProductPayload {
  product_name?: string;
  category_id?: string;
  sku?: string;
  barcode?: string;
  unit?: string;
  selling_price?: number;
  cost_price?: number;
  reorder_level?: number;
  is_staple?: boolean;
  is_perishable?: boolean;
}

export interface StockAdjustPayload {
  quantity: number;
  reason: string;
}

// ── Customers ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  shop_id: string;
  full_name: string;
  phone: string;
  address?: string;
  credit_limit: number;
  current_outstanding_balance: number;
  max_outstanding_ever: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerPayload {
  full_name: string;
  phone: string;
  address?: string;
  credit_limit: number;
}

export interface UpdateCustomerPayload {
  full_name?: string;
  phone?: string;
  address?: string;
  credit_limit?: number;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export type PaymentType = 'cash' | 'credit' | 'qr';
export type CreditStatus = 'paid' | 'unpaid' | 'overdue';

export interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreditSale {
  id: string;
  credit_amount: number;
  due_date: string;
  paid_at: string | null;
  status: CreditStatus;
  remarks: string | null;
  created_at: string;
  transaction_id?: string;
  customer_id?: string;
}

export interface Transaction {
  id: string;
  shop_id: string;
  customer_id?: string;
  payment_type: PaymentType;
  subtotal: number;
  discount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  items: TransactionItem[];
  credit_sale?: CreditSale;
}

export interface CreateTransactionItemPayload {
  product_id: string;
  quantity: number;
}

export interface CreateTransactionPayload {
  payment_type: PaymentType;
  discount?: number;
  notes?: string;
  items: CreateTransactionItemPayload[];
  customer_id?: string;
  due_date?: string;
}

export interface UpdateCreditSalePayload {
  status: CreditStatus;
  remarks?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_products: number;
  total_customers: number;
  total_transactions: number;
  total_revenue: number;
  total_profit: number;
  total_credit_outstanding: number;
  low_stock_count: number;
  today_transactions: number;
  today_revenue: number;
  today_profit: number;
}

export interface RevenueByPayment {
  cash: number;
  credit: number;
  qr: number;
}

export interface TopProduct {
  product_name: string;
  total_sold: number;
  total_revenue: number;
  total_profit: number;
}

export interface DailySalesProfit {
  date: string;
  revenue: number;
  profit: number;
}

export interface CategoryRevenue {
  category_name: string;
  revenue: number;
  profit: number;
  product_count: number;
}

export interface InventoryStatus {
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  revenue_by_payment: RevenueByPayment;
  top_products: TopProduct[];
  sales_over_time: DailySalesProfit[];
  revenue_by_category: CategoryRevenue[];
  inventory_status: InventoryStatus;
}

// ── ML Credit Risk ────────────────────────────────────────────────────────────

export interface ShapFeature {
  feature: string;
  shap_value: number;
}

export interface CreditRiskFeatures {
  relationship_days: number;
  cash_purchase_value_last_30d: number;
  credit_purchase_value_last_30d: number;
  transaction_count_last_30d: number;
  credit_transaction_count_last_30d: number;
  avg_purchase_amount: number;
  avg_credit_transaction_amount: number;
  credit_to_purchase_ratio: number;
  current_outstanding_balance: number;
  outstanding_to_avg_transaction_ratio: number;
  pct_repaid_on_time: number;
  avg_days_to_repay: number;
  repayment_consistency: number;
  historical_repayment_ratio: number;
  num_completed_credit_cycles: number;
  num_severely_late_repayments: number;
  max_outstanding_ever: number;
  days_since_last_purchase: number;
}

export interface CreditRiskPrediction {
  risk_prediction: number;
  risk_probability: number;
  is_risk: boolean;
  threshold: number;
  confidence: number;
  model: string;
  customer_id?: string;
  computed_features?: Record<string, number>;
}

export interface CreditRiskExplanation extends CreditRiskPrediction {
  base_probability: number;
  top_positive_features: ShapFeature[];
  top_negative_features: ShapFeature[];
  feature_contributions: Record<string, number>;
  human_readable_explanation: string;
}

export interface CreditRiskGlobalImportance {
  ranked_features: string[];
  mean_abs_shap_values: Record<string, number>;
  feature_importance_table: Array<Record<string, unknown>>;
}

// ── ML Demand ─────────────────────────────────────────────────────────────────

/** Backend demand explain uses 'impact' (not 'shap_value') */
export interface DemandShapFeature {
  feature: string;
  impact: number;
}

export interface DemandForecastDay {
  forecast_date: string;
  predicted_units: number;
  model: string;
  confidence: number;
  product_id?: string;
  category?: string;
  location_type?: string;
}

export interface DemandForecastRequest {
  shop_id: string;
  category: string;
  location_type: string;
  is_staple: number;
  is_perishable: number;
  last_date: string;
  sales_history: number[];
  transactions_history: number[];
}

/** Response from /explain-next-day and /explain-next-7-days */
export interface DemandForecastExplainDay {
  forecast_date: string;
  prediction: number;
  base_value: number;
  top_positive_features: DemandShapFeature[];
  top_negative_features: DemandShapFeature[];
  feature_contributions: Record<string, number>;
  human_readable_explanation: string;
}

export interface DemandGlobalImportanceEntry {
  feature: string;
  importance: number;
  rank?: number;
}

export interface DemandGlobalImportance {
  native_importance: DemandGlobalImportanceEntry[];
  shap_importance?: DemandGlobalImportanceEntry[];
}
