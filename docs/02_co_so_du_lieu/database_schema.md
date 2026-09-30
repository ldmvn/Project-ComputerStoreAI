# 🗄️ Sơ đồ cơ sở dữ liệu — ComputerStoreAI

> Tài liệu này sẽ chứa **ERD (Entity Relationship Diagram)** và **mô tả chi tiết các bảng** trong cơ sở dữ liệu của hệ thống.

---

## 📊 ERD (Sơ đồ quan hệ thực thể)

> _[Chèn hình ERD tại đây — xuất từ `prisma generate`, dbdiagram.io, draw.io hoặc Lucidchart]_  
> File nguồn: `backend/prisma/schema.prisma`

### Quan hệ chính (tóm tắt)

```
User (1) ─────< (N) Order
Order (1) ─────< (N) OrderItem >────── (N) Product
Category (1) ────< (N) Product
Product (N) ──── (N) Category     (qua ProductCategory)
User (1) ─────< (N) Review
User (1) ─────< (N) CartItem
```

---

## 📋 Danh sách bảng (Tables)

| STT | Tên bảng     | Mô tả                                       | Quan hệ chính                |
|:---:|:-------------|:--------------------------------------------|:-----------------------------|
| 1   | `User`       | Thông tin người dùng (khách hàng & admin)   | 1-N với `Order`, `Review`    |
| 2   | `Product`    | Thông tin sản phẩm (PC, Laptop, linh kiện)  | N-1 với `Category`           |
| 3   | `Category`   | Danh mục sản phẩm (cây phân cấp)            | 1-N với `Product`            |
| 4   | `Order`      | Đơn hàng của khách                           | 1-N với `OrderItem`          |
| 5   | `OrderItem`  | Chi tiết từng sản phẩm trong đơn hàng        | N-1 với `Product`, `Order`   |
| 6   | `Review`     | Đánh giá sản phẩm                           | N-1 với `User`, `Product`    |
| 7   | `CartItem`   | Giỏ hàng (chưa checkout)                    | N-1 với `User`, `Product`    |

---

## 🔧 Công nghệ sử dụng

| Thành phần | Công nghệ |
|:-----------|:----------|
| Database   | PostgreSQL / MongoDB |
| ORM        | Prisma / Mongoose |
| Schema gốc | `backend/prisma/schema.prisma` |

---

## 📝 Ghi chú thiết kế

- Mỗi bảng đều có `id` (UUID hoặc auto-increment), `createdAt`, `updatedAt`.
- Soft delete được áp dụng cho `Product` và `Category` (field `deletedAt`).
- Index được đặt trên các trường thường xuyên truy vấn: `slug`, `email`, `orderId`.

---

_Tài liệu đang được cập nhật — sẽ bổ sung ERD hình ảnh và chi tiết từng bảng._
