# Spark DeepStack API Specification

This document details all the API endpoints provided by the Spark DeepStack retail management platform backend.

All endpoints, except registration and login, require authentication using a JWT Bearer token in the `Authorization` header.

## Global Response & Error Formats

### Success Response Format
All successful API responses wrap their data using the standard `ApiResponse` structure:
```json
{
  "success": true,
  "message": "Success message description",
  "data": { ... } // Or list [...] or null
}
```

### Error Response Format
All application and request validation errors wrap their details using the standard `ErrorResponse` model:
```json
{
  "success": false,
  "message": "Error title or category (e.g., Validation error, Not found)",
  "detail": "Detailed reason or parameter validation trace"
}
```

---

## 1. Authentication (`/api/v1/auth`)

### Register User
* **Endpoint**: `POST /api/v1/auth/register`
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "full_name": "Saurav Pant",
    "email": "saurav@example.com",
    "password": "SecurePassword123",
    "phone": "+9779876543210"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
      "full_name": "Saurav Pant",
      "email": "saurav@example.com",
      "phone": "+9779876543210",
      "created_at": "2026-07-17T13:45:00Z",
      "updated_at": "2026-07-17T13:45:00Z"
    }
  }
  ```
* **Error Response (409 Conflict)**:
  ```json
  {
    "success": false,
    "message": "Email already registered",
    "detail": "Email already registered"
  }
  ```

---

### Login User
* **Endpoint**: `POST /api/v1/auth/login`
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "email": "saurav@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
        "full_name": "Saurav Pant",
        "email": "saurav@example.com",
        "phone": "+9779876543210",
        "created_at": "2026-07-17T13:45:00Z",
        "updated_at": "2026-07-17T13:45:00Z"
      },
      "token": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer"
      }
    }
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password",
    "detail": "Invalid email or password"
  }
  ```

---

### Get Authenticated User Profile
* **Endpoint**: `GET /api/v1/auth/me`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User profile fetched",
    "data": {
      "id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
      "full_name": "Saurav Pant",
      "email": "saurav@example.com",
      "phone": "+9779876543210",
      "created_at": "2026-07-17T13:45:00Z",
      "updated_at": "2026-07-17T13:45:00Z"
    }
  }
  ```

---

### Logout User
* **Endpoint**: `POST /api/v1/auth/logout`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "data": null
  }
  ```

---

## 2. Shops Management (`/api/v1/shops`)

### Create Shop
* **Endpoint**: `POST /api/v1/shops/`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "shop_name": "Pant Kirana Store",
    "address": "Kathmandu, Nepal",
    "location_type": "urban" // Options: "urban", "semi_urban", "rural"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Shop created successfully",
    "data": {
      "id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "user_id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
      "shop_name": "Pant Kirana Store",
      "address": "Kathmandu, Nepal",
      "location_type": "urban",
      "created_at": "2026-07-17T13:48:00Z",
      "updated_at": "2026-07-17T13:48:00Z"
    }
  }
  ```

---

### Get User Shops
* **Endpoint**: `GET /api/v1/shops/`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Shops fetched",
    "data": [
      {
        "id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
        "user_id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
        "shop_name": "Pant Kirana Store",
        "address": "Kathmandu, Nepal",
        "location_type": "urban",
        "created_at": "2026-07-17T13:48:00Z",
        "updated_at": "2026-07-17T13:48:00Z"
      }
    ]
  }
  ```

---

### Get Shop by ID
* **Endpoint**: `GET /api/v1/shops/{shop_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Shop fetched",
    "data": {
      "id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "user_id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
      "shop_name": "Pant Kirana Store",
      "address": "Kathmandu, Nepal",
      "location_type": "urban",
      "created_at": "2026-07-17T13:48:00Z",
      "updated_at": "2026-07-17T13:48:00Z"
    }
  }
  ```

---

### Update Shop
* **Endpoint**: `PATCH /api/v1/shops/{shop_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "shop_name": "Pant Supermarket",
    "location_type": "semi_urban"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Shop updated successfully",
    "data": {
      "id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "user_id": "e0bfa51d-1b33-4f9e-a89c-4613271bc607",
      "shop_name": "Pant Supermarket",
      "address": "Kathmandu, Nepal",
      "location_type": "semi_urban",
      "created_at": "2026-07-17T13:48:00Z",
      "updated_at": "2026-07-17T13:49:00Z"
    }
  }
  ```

---

### Delete Shop
* **Endpoint**: `DELETE /api/v1/shops/{shop_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Shop deleted successfully",
    "data": null
  }
  ```

---

## 3. Categories Management (`/api/v1/categories`)

### Create Category
* **Endpoint**: `POST /api/v1/categories/`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "name": "Groceries",
    "description": "Daily grocery essentials and food items"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Category created successfully",
    "data": {
      "id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "name": "Groceries",
      "description": "Daily grocery essentials and food items"
    }
  }
  ```

---

### Get All Categories
* **Endpoint**: `GET /api/v1/categories/`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Categories fetched",
    "data": [
      {
        "id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
        "name": "Groceries",
        "description": "Daily grocery essentials and food items"
      }
    ]
  }
  ```

---

### Get Category by ID
* **Endpoint**: `GET /api/v1/categories/{category_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category fetched",
    "data": {
      "id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "name": "Groceries",
      "description": "Daily grocery essentials and food items"
    }
  }
  ```

---

### Update Category
* **Endpoint**: `PATCH /api/v1/categories/{category_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "description": "Daily essentials, staples, and fresh vegetables"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category updated successfully",
    "data": {
      "id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "name": "Groceries",
      "description": "Daily essentials, staples, and fresh vegetables"
    }
  }
  ```

---

### Delete Category
* **Endpoint**: `DELETE /api/v1/categories/{category_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category deleted successfully",
    "data": null
  }
  ```

---

## 4. Products & Inventory (`/api/v1/shops/{shop_id}/products`)

### Create Product
* **Endpoint**: `POST /api/v1/shops/{shop_id}/products/`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
    "product_name": "Basmati Rice 5kg",
    "sku": "RICE-BAS-05",
    "barcode": "8901234567890",
    "unit": "bag",
    "stock_quantity": 25,
    "cost_price": 450.00,
    "selling_price": 550.00,
    "reorder_level": 5,
    "is_staple": true,
    "is_perishable": false
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Product created successfully",
    "data": {
      "id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "product_name": "Basmati Rice 5kg",
      "sku": "RICE-BAS-05",
      "barcode": "8901234567890",
      "unit": "bag",
      "stock_quantity": 25,
      "cost_price": 450.00,
      "selling_price": 550.00,
      "reorder_level": 5,
      "is_staple": true,
      "is_perishable": false,
      "is_active": true,
      "created_at": "2026-07-17T13:51:00Z",
      "updated_at": "2026-07-17T13:51:00Z"
    }
  }
  ```

---

### Get Shop Products
* **Endpoint**: `GET /api/v1/shops/{shop_id}/products/`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Products fetched",
    "data": [
      {
        "id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
        "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
        "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
        "product_name": "Basmati Rice 5kg",
        "sku": "RICE-BAS-05",
        "barcode": "8901234567890",
        "unit": "bag",
        "stock_quantity": 25,
        "cost_price": 450.00,
        "selling_price": 550.00,
        "reorder_level": 5,
        "is_staple": true,
        "is_perishable": false,
        "is_active": true,
        "created_at": "2026-07-17T13:51:00Z",
        "updated_at": "2026-07-17T13:51:00Z"
      }
    ]
  }
  ```

---

### Get Low Stock Products
* **Endpoint**: `GET /api/v1/shops/{shop_id}/products/low-stock`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Low stock products fetched",
    "data": []
  }
  ```

---

### Get Product by ID
* **Endpoint**: `GET /api/v1/shops/{shop_id}/products/{product_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Product fetched",
    "data": {
      "id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "product_name": "Basmati Rice 5kg",
      "sku": "RICE-BAS-05",
      "barcode": "8901234567890",
      "unit": "bag",
      "stock_quantity": 25,
      "cost_price": 450.00,
      "selling_price": 550.00,
      "reorder_level": 5,
      "is_staple": true,
      "is_perishable": false,
      "is_active": true,
      "created_at": "2026-07-17T13:51:00Z",
      "updated_at": "2026-07-17T13:51:00Z"
    }
  }
  ```

---

### Update Product
* **Endpoint**: `PATCH /api/v1/shops/{shop_id}/products/{product_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "selling_price": 575.00,
    "reorder_level": 8
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Product updated successfully",
    "data": {
      "id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "product_name": "Basmati Rice 5kg",
      "sku": "RICE-BAS-05",
      "barcode": "8901234567890",
      "unit": "bag",
      "stock_quantity": 25,
      "cost_price": 450.00,
      "selling_price": 575.00,
      "reorder_level": 8,
      "is_staple": true,
      "is_perishable": false,
      "is_active": true,
      "created_at": "2026-07-17T13:51:00Z",
      "updated_at": "2026-07-17T13:52:00Z"
    }
  }
  ```

---

### Delete/Deactivate Product (Soft Delete)
* **Endpoint**: `DELETE /api/v1/shops/{shop_id}/products/{product_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Product deactivated successfully",
    "data": null
  }
  ```

---

### Stock In (Inventory Inward Adjustment)
* **Endpoint**: `POST /api/v1/shops/{shop_id}/products/{product_id}/stock-in`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "quantity": 10,
    "reason": "Restocked from wholesaler"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Stock added successfully",
    "data": {
      "id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "product_name": "Basmati Rice 5kg",
      "sku": "RICE-BAS-05",
      "barcode": "8901234567890",
      "unit": "bag",
      "stock_quantity": 35, // Updated stock (25 + 10)
      "cost_price": 450.00,
      "selling_price": 575.00,
      "reorder_level": 8,
      "is_staple": true,
      "is_perishable": false,
      "is_active": true,
      "created_at": "2026-07-17T13:51:00Z",
      "updated_at": "2026-07-17T13:52:00Z"
    }
  }
  ```

---

### Stock Out (Inventory Outward Adjustment)
* **Endpoint**: `POST /api/v1/shops/{shop_id}/products/{product_id}/stock-out`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "quantity": 2,
    "reason": "Damaged goods / wet package"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Stock removed successfully",
    "data": {
      "id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "category_id": "d2b3c4d5-6789-0abe-cdef-1234567890bc",
      "product_name": "Basmati Rice 5kg",
      "sku": "RICE-BAS-05",
      "barcode": "8901234567890",
      "unit": "bag",
      "stock_quantity": 33, // Updated stock (35 - 2)
      "cost_price": 450.00,
      "selling_price": 575.00,
      "reorder_level": 8,
      "is_staple": true,
      "is_perishable": false,
      "is_active": true,
      "created_at": "2026-07-17T13:51:00Z",
      "updated_at": "2026-07-17T13:52:00Z"
    }
  }
  ```

---

## 5. Customers Management (`/api/v1/shops/{shop_id}/customers`)

### Create Customer
* **Endpoint**: `POST /api/v1/shops/{shop_id}/customers/`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "full_name": "Hari Bahadur",
    "phone": "+9779801234567",
    "address": "Lalitpur, Nepal",
    "credit_limit": 5000.00
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Customer created successfully",
    "data": {
      "id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "full_name": "Hari Bahadur",
      "phone": "+9779801234567",
      "address": "Lalitpur, Nepal",
      "credit_limit": 5000.00,
      "current_outstanding_balance": 0.00,
      "max_outstanding_ever": 0.00,
      "is_active": true,
      "created_at": "2026-07-17T13:53:00Z",
      "updated_at": "2026-07-17T13:53:00Z"
    }
  }
  ```

---

### Get Shop Customers
* **Endpoint**: `GET /api/v1/shops/{shop_id}/customers/`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Customers fetched",
    "data": [
      {
        "id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
        "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
        "full_name": "Hari Bahadur",
        "phone": "+9779801234567",
        "address": "Lalitpur, Nepal",
        "credit_limit": 5000.00,
        "current_outstanding_balance": 0.00,
        "max_outstanding_ever": 0.00,
        "is_active": true,
        "created_at": "2026-07-17T13:53:00Z",
        "updated_at": "2026-07-17T13:53:00Z"
      }
    ]
  }
  ```

---

### Get Customer by ID
* **Endpoint**: `GET /api/v1/shops/{shop_id}/customers/{customer_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Customer fetched",
    "data": {
      "id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "full_name": "Hari Bahadur",
      "phone": "+9779801234567",
      "address": "Lalitpur, Nepal",
      "credit_limit": 5000.00,
      "current_outstanding_balance": 0.00,
      "max_outstanding_ever": 0.00,
      "is_active": true,
      "created_at": "2026-07-17T13:53:00Z",
      "updated_at": "2026-07-17T13:53:00Z"
    }
  }
  ```

---

### Update Customer
* **Endpoint**: `PATCH /api/v1/shops/{shop_id}/customers/{customer_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "credit_limit": 10000.00,
    "phone": "+9779807654321"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Customer updated successfully",
    "data": {
      "id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "full_name": "Hari Bahadur",
      "phone": "+9779807654321",
      "address": "Lalitpur, Nepal",
      "credit_limit": 10000.00,
      "current_outstanding_balance": 0.00,
      "max_outstanding_ever": 0.00,
      "is_active": true,
      "created_at": "2026-07-17T13:53:00Z",
      "updated_at": "2026-07-17T13:54:00Z"
    }
  }
  ```

---

### Delete Customer (Deactivate)
* **Endpoint**: `DELETE /api/v1/shops/{shop_id}/customers/{customer_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Customer deactivated successfully",
    "data": null
  }
  ```

---

## 6. Transactions & Credit Sales (`/api/v1/shops/{shop_id}/transactions`)

### Create Transaction
This endpoint handles both standard sales (cash/QR) and credit sales. Product stock is automatically deducted. For credit sales, the customer's outstanding balance is automatically updated.

* **Endpoint**: `POST /api/v1/shops/{shop_id}/transactions/`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body (Standard Cash/QR Sale)**:
  ```json
  {
    "payment_type": "cash", // Options: "cash", "credit", "qr"
    "discount": 50.00,
    "notes": "Standard retail customer purchase",
    "items": [
      {
        "product_id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
        "quantity": 2
      }
    ]
  }
  ```
* **Request Body (Credit Sale)**:
  ```json
  {
    "customer_id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
    "payment_type": "credit",
    "discount": 0.00,
    "notes": "Added to khata",
    "items": [
      {
        "product_id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
        "quantity": 1
      }
    ],
    "due_date": "2026-08-17" // Required if payment_type is "credit"
  }
  ```
* **Success Response (201 Created - Credit Sale)**:
  ```json
  {
    "success": true,
    "message": "Transaction created successfully",
    "data": {
      "id": "e8d7c6b5-a432-10fe-dcba-1234567890ef",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "customer_id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
      "payment_type": "credit",
      "subtotal": 575.00,
      "discount": 0.00,
      "total_amount": 575.00,
      "notes": "Added to khata",
      "created_at": "2026-07-17T13:55:00Z",
      "items": [
        {
          "id": "b1c2d3e4-f5a6-7890-bcde-1234567890ef",
          "product_id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
          "quantity": 1,
          "unit_price": 575.00,
          "subtotal": 575.00
        }
      ],
      "credit_sale": {
        "id": "5f4e3d2c-1b0a-9876-5432-10fe98765432",
        "credit_amount": 575.00,
        "due_date": "2026-08-17",
        "paid_at": null,
        "status": "unpaid", // Options: "paid", "unpaid", "overdue"
        "remarks": null,
        "created_at": "2026-07-17T13:55:00Z"
      }
    }
  }
  ```

---

### Get Shop Transactions
* **Endpoint**: `GET /api/v1/shops/{shop_id}/transactions/`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transactions fetched",
    "data": [
      {
        "id": "e8d7c6b5-a432-10fe-dcba-1234567890ef",
        "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
        "customer_id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
        "payment_type": "credit",
        "subtotal": 575.00,
        "discount": 0.00,
        "total_amount": 575.00,
        "notes": "Added to khata",
        "created_at": "2026-07-17T13:55:00Z",
        "items": [
          {
            "id": "b1c2d3e4-f5a6-7890-bcde-1234567890ef",
            "product_id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
            "quantity": 1,
            "unit_price": 575.00,
            "subtotal": 575.00
          }
        ],
        "credit_sale": {
          "id": "5f4e3d2c-1b0a-9876-5432-10fe98765432",
          "credit_amount": 575.00,
          "due_date": "2026-08-17",
          "paid_at": null,
          "status": "unpaid",
          "remarks": null,
          "created_at": "2026-07-17T13:55:00Z"
        }
      }
    ]
  }
  ```

---

### Get Transaction by ID
* **Endpoint**: `GET /api/v1/shops/{shop_id}/transactions/{transaction_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transaction fetched",
    "data": {
      "id": "e8d7c6b5-a432-10fe-dcba-1234567890ef",
      "shop_id": "c1a2d3e4-5678-90ab-cdef-1234567890ab",
      "customer_id": "a0b1c2d3-e4f5-6789-01ab-cdef23456789",
      "payment_type": "credit",
      "subtotal": 575.00,
      "discount": 0.00,
      "total_amount": 575.00,
      "notes": "Added to khata",
      "created_at": "2026-07-17T13:55:00Z",
      "items": [
        {
          "id": "b1c2d3e4-f5a6-7890-bcde-1234567890ef",
          "product_id": "f4e5d6c7-8901-23ab-cdef-1234567890de",
          "quantity": 1,
          "unit_price": 575.00,
          "subtotal": 575.00
        }
      ],
      "credit_sale": {
        "id": "5f4e3d2c-1b0a-9876-5432-10fe98765432",
        "credit_amount": 575.00,
        "due_date": "2026-08-17",
        "paid_at": null,
        "status": "unpaid",
        "remarks": null,
        "created_at": "2026-07-17T13:55:00Z"
      }
    }
  }
  ```

---

### Get Credit Sales List
Fetches credit sales transactions. Can be filtered by paid status.

* **Endpoint**: `GET /api/v1/shops/{shop_id}/transactions/credit-sales/`
* **Query Parameters**:
  - `status`: string (optional, options: `paid`, `unpaid`, `overdue`)
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Credit sales fetched",
    "data": [
      {
        "id": "5f4e3d2c-1b0a-9876-5432-10fe98765432",
        "credit_amount": 575.00,
        "due_date": "2026-08-17",
        "paid_at": null,
        "status": "unpaid",
        "remarks": null,
        "created_at": "2026-07-17T13:55:00Z"
      }
    ]
  }
  ```

---

### Update/Pay Off Credit Sale
Updates the status of a credit sale. Marking a status as `paid` will automatically deduct the paid amount from the customer's outstanding credit balance.

* **Endpoint**: `PATCH /api/v1/shops/{shop_id}/transactions/credit-sales/{credit_sale_id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "status": "paid",
    "remarks": "Paid in full via cash"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Credit sale updated successfully",
    "data": {
      "id": "5f4e3d2c-1b0a-9876-5432-10fe98765432",
      "credit_amount": 575.00,
      "due_date": "2026-08-17",
      "paid_at": "2026-07-17T13:57:00Z",
      "status": "paid",
      "remarks": "Paid in full via cash",
      "created_at": "2026-07-17T13:55:00Z"
    }
  }
  ```

---

## 7. Shop Dashboard (`/api/v1/shops/{shop_id}/dashboard`)

### Get Dashboard Details
Provides summary statistics, payment category breakdown, and top-performing products.

* **Endpoint**: `GET /api/v1/shops/{shop_id}/dashboard/`
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Dashboard data fetched",
    "data": {
      "summary": {
        "total_products": 102,
        "total_customers": 45,
        "total_transactions": 289,
        "total_revenue": 145000.50,
        "total_credit_outstanding": 12450.00,
        "low_stock_count": 4,
        "today_transactions": 14,
        "today_revenue": 8450.00
      },
      "revenue_by_payment": {
        "cash": 95000.00,
        "credit": 25000.50,
        "qr": 24999.00
      },
      "top_products": [
        {
          "product_name": "Basmati Rice 5kg",
          "total_sold": 45,
          "total_revenue": 24750.00
        },
        {
          "product_name": "Sunflower Oil 1L",
          "total_sold": 38,
          "total_revenue": 9500.00
        }
      ]
    }
  }
  ```
