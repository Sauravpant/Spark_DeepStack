import uuid
from datetime import date, datetime, timezone, timedelta
from sqlalchemy import func as sa_func, text as sa_text
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.transaction_item import TransactionItem
from app.models.credit_sale import CreditSale
from app.models.category import Category
from app.models.user import User
from app.models.enums import PaymentType, CreditStatus, TransactionType
from app.schemas.dashboard import (
    DashboardSummary,
    RevenueByPaymentType,
    TopProduct,
    DashboardDetail,
    DailySalesProfit,
    CategoryRevenue,
    InventoryStatus,
)
from app.services.shop_service import get_shop_by_id

NEPAL_TIMESTAMP = Transaction.created_at + sa_text("interval '5 hours 45 minutes'")


def get_dashboard(db: Session, user: User, shop_id: uuid.UUID) -> DashboardDetail:
    get_shop_by_id(db, user, shop_id)

    today = datetime.now().date()

    # Total products
    total_products = db.query(sa_func.count(Product.id)).filter(
        Product.shop_id == shop_id, Product.is_active == True
    ).scalar() or 0

    # Total customers
    total_customers = db.query(sa_func.count(Customer.id)).filter(
        Customer.shop_id == shop_id, Customer.is_active == True
    ).scalar() or 0

    # Total transactions
    total_transactions = db.query(sa_func.count(Transaction.id)).filter(
        Transaction.shop_id == shop_id,
        Transaction.transaction_type == TransactionType.SALE,
    ).scalar() or 0

    # Total revenue
    total_revenue = db.query(sa_func.sum(Transaction.total_amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.transaction_type == TransactionType.SALE,
    ).scalar() or 0.0

    # Total COGS
    total_cogs = db.query(sa_func.sum(TransactionItem.quantity * Product.cost_price)).join(
        Product, TransactionItem.product_id == Product.id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.shop_id == shop_id,
        Transaction.transaction_type == TransactionType.SALE,
    ).scalar() or 0.0

    total_profit = float(total_revenue) - float(total_cogs)

    # Total credit outstanding
    total_credit_outstanding = db.query(sa_func.sum(CreditSale.credit_amount)).join(
        Transaction, CreditSale.transaction_id == Transaction.id
    ).filter(
        Transaction.shop_id == shop_id,
        CreditSale.status != CreditStatus.PAID,
    ).scalar() or 0.0

    # Low stock count
    low_stock_count = db.query(sa_func.count(Product.id)).filter(
        Product.shop_id == shop_id,
        Product.is_active == True,
        Product.stock_quantity <= Product.reorder_level,
    ).scalar() or 0

    # Today's transactions
    today_transactions = db.query(sa_func.count(Transaction.id)).filter(
        Transaction.shop_id == shop_id,
        Transaction.transaction_type == TransactionType.SALE,
        sa_func.date(NEPAL_TIMESTAMP) == today,
    ).scalar() or 0

    today_revenue = db.query(sa_func.sum(Transaction.total_amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.transaction_type == TransactionType.SALE,
        sa_func.date(NEPAL_TIMESTAMP) == today,
    ).scalar() or 0.0

    today_cogs = db.query(sa_func.sum(TransactionItem.quantity * Product.cost_price)).join(
        Product, TransactionItem.product_id == Product.id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.shop_id == shop_id,
        Transaction.transaction_type == TransactionType.SALE,
        sa_func.date(NEPAL_TIMESTAMP) == today,
    ).scalar() or 0.0

    today_profit = float(today_revenue) - float(today_cogs)

    summary = DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_transactions=total_transactions,
        total_revenue=float(total_revenue),
        total_profit=total_profit,
        total_credit_outstanding=float(total_credit_outstanding),
        low_stock_count=low_stock_count,
        today_transactions=today_transactions,
        today_revenue=float(today_revenue),
        today_profit=today_profit,
    )

    # Revenue by payment type
    payment_revenues = (
        db.query(Transaction.payment_type, sa_func.sum(Transaction.total_amount))
        .filter(Transaction.shop_id == shop_id, Transaction.transaction_type == TransactionType.SALE)
        .group_by(Transaction.payment_type)
        .all()
    )
    revenue_map = {pt.value: float(rev or 0) for pt, rev in payment_revenues}
    revenue_by_payment = RevenueByPaymentType(
        cash=revenue_map.get("cash", 0.0),
        credit=revenue_map.get("credit", 0.0),
        qr=revenue_map.get("qr", 0.0),
    )

    # Top 5 products by quantity sold
    top_products_query = (
        db.query(
            Product.product_name,
            sa_func.sum(TransactionItem.quantity).label("total_sold"),
            sa_func.sum(TransactionItem.subtotal).label("total_revenue"),
            sa_func.sum(TransactionItem.quantity * Product.cost_price).label("total_cogs"),
        )
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .filter(Transaction.shop_id == shop_id, Transaction.transaction_type == TransactionType.SALE)
        .group_by(Product.product_name)
        .order_by(sa_func.sum(TransactionItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        TopProduct(
            product_name=name,
            total_sold=int(sold or 0),
            total_revenue=float(revenue or 0),
            total_profit=float((revenue or 0) - (cogs or 0)),
        )
        for name, sold, revenue, cogs in top_products_query
    ]

    # Daily sales and profit for the last 7 days
    sales_over_time = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")

        rev = db.query(sa_func.sum(Transaction.total_amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.transaction_type == TransactionType.SALE,
            sa_func.date(NEPAL_TIMESTAMP) == d,
        ).scalar() or 0.0

        cogs = db.query(sa_func.sum(TransactionItem.quantity * Product.cost_price)).join(
            Product, TransactionItem.product_id == Product.id
        ).join(
            Transaction, TransactionItem.transaction_id == Transaction.id
        ).filter(
            Transaction.shop_id == shop_id,
            Transaction.transaction_type == TransactionType.SALE,
            sa_func.date(NEPAL_TIMESTAMP) == d,
        ).scalar() or 0.0

        sales_over_time.append(DailySalesProfit(
            date=d_str,
            revenue=float(rev),
            profit=float(rev) - float(cogs),
        ))

    # Revenue and profit by category
    category_data_query = (
        db.query(
            Category.name,
            sa_func.sum(TransactionItem.subtotal).label("revenue"),
            sa_func.sum(TransactionItem.quantity * Product.cost_price).label("cogs"),
        )
        .join(Product, Product.category_id == Category.id)
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .filter(Transaction.shop_id == shop_id, Transaction.transaction_type == TransactionType.SALE)
        .group_by(Category.name)
        .all()
    )
    
    prod_counts = (
        db.query(Category.name, sa_func.count(Product.id))
        .join(Category, Product.category_id == Category.id)
        .filter(Product.shop_id == shop_id, Product.is_active == True)
        .group_by(Category.name)
        .all()
    )
    prod_count_map = {name: count for name, count in prod_counts}

    revenue_by_category = []
    for name, rev, cogs in category_data_query:
        revenue_by_category.append(CategoryRevenue(
            category_name=name,
            revenue=float(rev or 0),
            profit=float((rev or 0) - (cogs or 0)),
            product_count=prod_count_map.get(name, 0),
        ))
    
    # Include categories with products but no transactions
    existing_cat_names = {item.category_name for item in revenue_by_category}
    for name, count in prod_counts:
        if name not in existing_cat_names:
            revenue_by_category.append(CategoryRevenue(
                category_name=name,
                revenue=0.0,
                profit=0.0,
                product_count=count,
            ))

    # Detailed inventory status
    in_stock = db.query(sa_func.count(Product.id)).filter(
        Product.shop_id == shop_id,
        Product.is_active == True,
        Product.stock_quantity > Product.reorder_level,
        Product.stock_quantity > 0,
    ).scalar() or 0

    low_stock = db.query(sa_func.count(Product.id)).filter(
        Product.shop_id == shop_id,
        Product.is_active == True,
        Product.stock_quantity <= Product.reorder_level,
        Product.stock_quantity > 0,
    ).scalar() or 0

    out_of_stock = db.query(sa_func.count(Product.id)).filter(
        Product.shop_id == shop_id,
        Product.is_active == True,
        Product.stock_quantity == 0,
    ).scalar() or 0

    inventory_status = InventoryStatus(
        in_stock=in_stock,
        low_stock=low_stock,
        out_of_stock=out_of_stock,
    )

    return DashboardDetail(
        summary=summary,
        revenue_by_payment=revenue_by_payment,
        top_products=top_products,
        sales_over_time=sales_over_time,
        revenue_by_category=revenue_by_category,
        inventory_status=inventory_status,
    )
