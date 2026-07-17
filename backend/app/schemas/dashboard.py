from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_transactions: int
    total_revenue: float
    total_profit: float
    total_credit_outstanding: float
    low_stock_count: int
    today_transactions: int
    today_revenue: float
    today_profit: float


class RevenueByPaymentType(BaseModel):
    cash: float
    credit: float
    qr: float


class TopProduct(BaseModel):
    product_name: str
    total_sold: int
    total_revenue: float
    total_profit: float


class DailySalesProfit(BaseModel):
    date: str
    revenue: float
    profit: float


class CategoryRevenue(BaseModel):
    category_name: str
    revenue: float
    profit: float
    product_count: int


class InventoryStatus(BaseModel):
    in_stock: int
    low_stock: int
    out_of_stock: int


class DashboardDetail(BaseModel):
    summary: DashboardSummary
    revenue_by_payment: RevenueByPaymentType
    top_products: list[TopProduct]
    sales_over_time: list[DailySalesProfit]
    revenue_by_category: list[CategoryRevenue]
    inventory_status: InventoryStatus
