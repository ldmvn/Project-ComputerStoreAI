# 📡 Tài liệu API Endpoints — ComputerStoreAI

> Mô tả chi tiết các **REST API endpoint** của backend (Express + Prisma).  
> Tài liệu này dùng làm phụ lục cho báo cáo luận văn.

---

## 🔧 Thông tin chung

| Thông tin               | Giá trị                                  |
|:------------------------|:-----------------------------------------|
| **Base URL (Local)**    | `http://localhost:5000/api`              |
| **Base URL (Production)**| _[Cập nhật sau]_                        |
| **Format**              | JSON (`application/json`)                |
| **Authentication**      | JWT Bearer Token (route có 🔒)           |
| **CORS**                | Cho phép `http://localhost:3000`         |

### Quy ước Response

#### ✅ Success
```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "OK"
}
```

#### ❌ Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email không hợp lệ"
  }
}
```

### HTTP Status Codes

| Code | Ý nghĩa                  |
|:----:|:-------------------------|
| 200  | OK                       |
| 201  | Created                  |
| 400  | Bad Request              |
| 401  | Unauthorized             |
| 403  | Forbidden                |
| 404  | Not Found                |
| 500  | Internal Server Error    |

---

## 🔐 Auth (Xác thực)

| Method | Endpoint                  | Mô tả              | Auth |
|:------:|:--------------------------|:-------------------|:----:|
| POST   | `/auth/register`          | Đăng ký tài khoản  | ❌   |
| POST   | `/auth/login`             | Đăng nhập           | ❌   |
| POST   | `/auth/logout`            | Đăng xuất           | 🔒   |
| POST   | `/auth/refresh-token`     | Làm mới token       | ❌   |
| GET    | `/auth/me`                | Thông tin user hiện tại | 🔒 |

---

## 🛍️ Products (Sản phẩm)

| Method | Endpoint                  | Mô tả              | Auth |
|:------:|:--------------------------|:-------------------|:----:|
| GET    | `/products`               | Lấy danh sách (phân trang, filter) | ❌ |
| GET    | `/products/:slug`         | Chi tiết sản phẩm   | ❌   |
| POST   | `/products`               | Tạo sản phẩm mới    | 🔒 Admin |
| PUT    | `/products/:id`           | Cập nhật sản phẩm   | 🔒 Admin |
| DELETE | `/products/:id`           | Xóa sản phẩm (soft delete) | 🔒 Admin |

### Query params cho `GET /products`
```
?page=1&limit=12&category=laptop&minPrice=10000000&maxPrice=50000000&sort=-price&search=gaming
```

---

## 📂 Categories (Danh mục)

| Method | Endpoint                  | Mô tả              | Auth |
|:------:|:--------------------------|:-------------------|:----:|
| GET    | `/categories`             | Lấy danh sách      | ❌   |
| GET    | `/categories/:slug`       | Chi tiết danh mục   | ❌   |
| POST   | `/categories`             | Tạo danh mục       | 🔒 Admin |
| PUT    | `/categories/:id`         | Cập nhật            | 🔒 Admin |
| DELETE | `/categories/:id`         | Xóa                 | 🔒 Admin |

---

## 🛒 Orders (Đơn hàng)

| Method | Endpoint                  | Mô tả              | Auth |
|:------:|:--------------------------|:-------------------|:----:|
| POST   | `/orders`                 | Tạo đơn hàng       | 🔒   |
| GET    | `/orders`                 | Đơn hàng của user  | 🔒   |
| GET    | `/orders/:id`             | Chi tiết đơn        | 🔒   |
| GET    | `/admin/orders`           | Tất cả đơn hàng    | 🔒 Admin |
| PATCH  | `/admin/orders/:id`       | Cập nhật trạng thái | 🔒 Admin |

---

## 👥 Users (Người dùng — Admin only)

| Method | Endpoint                  | Mô tả              |
|:------:|:--------------------------|:-------------------|
| GET    | `/admin/users`            | Danh sách user     |
| GET    | `/admin/users/:id`        | Chi tiết user      |
| PATCH  | `/admin/users/:id/role`    | Đổi role           |
| PATCH  | `/admin/users/:id/status`  | Khóa / mở tài khoản |

---

## ⭐ Reviews (Đánh giá)

| Method | Endpoint                  | Mô tả              | Auth |
|:------:|:--------------------------|:-------------------|:----:|
| GET    | `/products/:id/reviews`    | Lấy review của SP   | ❌   |
| POST   | `/products/:id/reviews`    | Tạo review          | 🔒   |
| DELETE | `/reviews/:id`             | Xóa review          | 🔒 (owner / admin) |

---

## 🧪 Testing

- **Postman collection:** _[export file Postman tại đây]_
- **Swagger UI:** `http://localhost:5000/api-docs`

---

_Tài liệu đang được cập nhật — endpoints sẽ được bổ sung khi backend hoàn thiện._
