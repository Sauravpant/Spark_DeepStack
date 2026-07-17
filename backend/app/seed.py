from sqlalchemy.orm import Session
import random
import uuid

from app.db.database import SessionLocal
from app.models.user import User
from app.models.shop import Shop
from app.models.category import Category
from app.models.product import Product


USER_EMAIL = "saurav12@example.com"


CATEGORY_PRODUCTS = {
    "Groceries": [
        ("Basmati Rice 5kg", 650, 800, 40, 5, "bag", True, False),
        ("Wheat Flour 5kg", 320, 400, 35, 5, "bag", True, False),
        ("Sugar 1kg", 90, 110, 60, 10, "kg", True, False),
        ("Salt 1kg", 25, 35, 80, 15, "kg", True, False),
        ("Lentils 1kg", 160, 200, 45, 8, "kg", True, False),
    ],
    "Beverages": [
        ("Coca Cola 2L", 120, 150, 50, 10, "bottle", False, True),
        ("Pepsi 2L", 120, 150, 45, 10, "bottle", False, True),
        ("Frooti 1L", 80, 100, 35, 8, "bottle", False, True),
        ("Fresh Milk 1L", 70, 90, 30, 6, "packet", True, True),
        ("Mineral Water 1L", 18, 25, 100, 20, "bottle", False, False),
    ],
    "Snacks": [
        ("Potato Chips", 75, 100, 30, 5, "pack", False, False),
        ("Instant Noodles", 18, 25, 100, 20, "pack", True, False),
        ("Biscuits", 28, 35, 80, 15, "pack", False, False),
        ("Chocolate Bar", 40, 55, 60, 10, "pcs", False, False),
        ("Popcorn", 45, 60, 40, 8, "pack", False, False),
    ],
    "Dairy & Eggs": [
        ("Organic Eggs 12pcs", 140, 180, 35, 10, "tray", True, True),
        ("Butter 500g", 250, 300, 20, 5, "pack", False, True),
        ("Cheese Slice", 180, 220, 18, 5, "pack", False, True),
        ("Curd 500g", 90, 120, 25, 5, "cup", False, True),
        ("Paneer 250g", 140, 170, 15, 5, "pack", False, True),
    ],
    "Personal Care": [
        ("Bath Soap", 45, 60, 60, 15, "pcs", False, False),
        ("Shampoo 250ml", 180, 240, 20, 5, "bottle", False, False),
        ("Toothpaste", 75, 100, 45, 8, "tube", False, False),
        ("Toothbrush", 35, 50, 50, 10, "pcs", False, False),
        ("Face Wash", 160, 210, 18, 5, "tube", False, False),
    ],
    "Household": [
        ("Dishwash Liquid", 95, 120, 25, 5, "bottle", False, False),
        ("Laundry Detergent", 220, 280, 20, 5, "pack", False, False),
        ("Toilet Cleaner", 110, 145, 18, 5, "bottle", False, False),
        ("Garbage Bags", 60, 80, 40, 8, "pack", False, False),
        ("Aluminium Foil", 70, 95, 25, 5, "roll", False, False),
    ],
    "Cleaning Supplies": [
        ("Floor Cleaner", 160, 210, 20, 5, "bottle", False, False),
        ("Glass Cleaner", 120, 160, 18, 5, "bottle", False, False),
        ("Cleaning Sponge", 18, 25, 60, 10, "pcs", False, False),
        ("Scrub Pad", 12, 18, 80, 15, "pcs", False, False),
        ("Phenyl 1L", 180, 230, 15, 5, "bottle", False, False),
    ],
    "Stationery": [
        ("Notebook", 45, 60, 50, 10, "pcs", False, False),
        ("Ball Pen", 8, 12, 200, 30, "pcs", False, False),
        ("Pencil", 5, 8, 200, 30, "pcs", False, False),
        ("Eraser", 4, 6, 150, 20, "pcs", False, False),
        ("Marker", 35, 50, 40, 8, "pcs", False, False),
    ],
}


def seed():
    db: Session = SessionLocal()

    try:
        # -------------------------
        # Find User
        # -------------------------
        user = db.query(User).filter(User.email == USER_EMAIL).first()

        if not user:
            raise Exception(f"User '{USER_EMAIL}' not found.")

        # -------------------------
        # Find Shop
        # -------------------------
        shop = db.query(Shop).filter(Shop.user_id == user.id).first()

        if not shop:
            raise Exception("Shop not found for this user.")

        print(f"Seeding shop: {shop.shop_name}")

        category_count = 0
        product_count = 0

        # -------------------------
        # Categories + Products
        # -------------------------
        for category_name, products in CATEGORY_PRODUCTS.items():

            category = (
                db.query(Category)
                .filter(Category.name == category_name)
                .first()
            )

            if not category:
                category = Category(
                    name=category_name,
                    description=f"{category_name} products",
                )
                db.add(category)
                db.commit()
                db.refresh(category)
                category_count += 1

            for (
                product_name,
                cost,
                selling,
                stock,
                reorder,
                unit,
                staple,
                perishable,
            ) in products:

                exists = (
                    db.query(Product)
                    .filter(
                        Product.shop_id == shop.id,
                        Product.product_name == product_name,
                    )
                    .first()
                )

                if exists:
                    continue

                sku = (
                    category_name[:3].upper()
                    + "-"
                    + uuid.uuid4().hex[:8].upper()
                )

                barcode = str(random.randint(100000000000, 999999999999))

                product = Product(
                    shop_id=shop.id,
                    category_id=category.id,
                    product_name=product_name,
                    sku=sku,
                    barcode=barcode,
                    unit=unit,
                    stock_quantity=stock,
                    cost_price=cost,
                    selling_price=selling,
                    reorder_level=reorder,
                    is_staple=staple,
                    is_perishable=perishable,
                    is_active=True,
                )

                db.add(product)
                product_count += 1

        db.commit()

        print("=" * 40)
        print("Seed Completed")
        print(f"Categories Added : {category_count}")
        print(f"Products Added   : {product_count}")
        print("=" * 40)

    except Exception as e:
        db.rollback()
        print(e)

    finally:
        db.close()


if __name__ == "__main__":
    seed()