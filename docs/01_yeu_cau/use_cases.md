# 📋 Đặc tả Use Cases — ComputerStoreAI

> Tài liệu mô tả các **use case chính** của hệ thống, phân theo vai trò người dùng.  
> Đây là đầu vào quan trọng cho phần **Phân tích yêu cầu** trong báo cáo luận văn.

---

## 👤 Khách hàng (Customer)

### UC-C01: Đăng ký tài khoản
- **Mô tả:** Khách hàng tạo tài khoản mới bằng email và mật khẩu.
- **Điều kiện trước:** Chưa có tài khoản với email đăng ký.
- **Luồng chính:**
  1. Khách truy cập trang `/register`.
  2. Nhập email, mật khẩu, họ tên.
  3. Hệ thống validate và gửi email xác nhận.
  4. Tài khoản được tạo, tự động đăng nhập.

### UC-C02: Đăng nhập / Đăng xuất
- **Mô tả:** Xác thực người dùng qua email + password, sinh JWT token.

### UC-C03: Xem danh sách sản phẩm
- Hỗ trợ **phân trang**, sắp xếp theo giá / tên / mới nhất.

### UC-C04: Tìm kiếm & Lọc sản phẩm
- Theo **danh mục**, **khoảng giá**, **thương hiệu**, **từ khóa**.

### UC-C05: Xem chi tiết sản phẩm
- Hiển thị hình ảnh (carousel), mô tả, thông số kỹ thuật, đánh giá.

### UC-C06: Thêm vào giỏ hàng
- Lưu giỏ hàng vào **localStorage** (guest) hoặc database (đã đăng nhập).

### UC-C07: Đặt hàng / Thanh toán
- Nhập địa chỉ giao hàng → chọn phương thức thanh toán → xác nhận đơn.

### UC-C08: Xem lịch sử đơn hàng
- Theo dõi trạng thái: `pending` → `confirmed` → `shipped` → `delivered`.

---

## 🛠️ Quản trị viên (Admin)

### UC-A01: Đăng nhập trang quản trị
- Phân quyền riêng (`role: ADMIN` trong DB).

### UC-A02: Quản lý sản phẩm (CRUD)
- Thêm / Sửa / Xóa sản phẩm. Upload nhiều hình ảnh.

### UC-A03: Quản lý danh mục
- Cấu trúc cây danh mục (VD: `PC → PC Gaming → PC RTX 4070`).

### UC-A04: Quản lý đơn hàng
- Xem tất cả đơn, cập nhật trạng thái, xuất hóa đơn PDF.

### UC-A05: Quản lý người dùng
- Xem danh sách user, khóa / mở khóa tài khoản.

### UC-A06: Xem thống kê doanh thu
- Dashboard với biểu đồ doanh thu theo ngày / tuần / tháng.

---

## 📐 Sơ đồ Use Case tổng quan

> _[Chèn sơ đồ Use Case Diagram (PlantUML / draw.io) tại đây]_

```
@startuml
left to right direction
actor "Khách hàng" as C
actor "Quản trị viên" as A

rectangle ComputerStoreAI {
  usecase "Đăng ký" as UC1
  usecase "Đặt hàng" as UC7
  usecase "Quản lý SP" as UC_A2
}
C --> UC1
C --> UC7
A --> UC_A2
@enduml
```

---

_Tài liệu đang được cập nhật — sẽ bổ sung chi tiết từng use case theo tuần._
