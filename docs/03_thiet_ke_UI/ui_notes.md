# 🎨 Tài liệu thiết kế UI/UX — ComputerStoreAI

> Ghi chú thiết kế giao diện người dùng cho website thương mại điện tử bán PC & Laptop.  
> Phục vụ cho chương **"Thiết kế hệ thống"** trong báo cáo luận văn.

---

## 🎯 Nguyên tắc thiết kế

| Tiêu chí       | Mô tả                                           |
|:----------------|:------------------------------------------------|
| **Phong cách**  | Hiện đại, tối giản, dễ sử dụng                  |
| **Màu chủ đạo** | Xanh dương (Primary Blue `#2563eb`)              |
| **Font chữ**    | Inter, system-ui, sans-serif                    |
| **Responsive**  | Mobile-first, hỗ trợ tablet & desktop           |
| **Framework**   | Tailwind CSS + Headless UI                      |

---

## 📐 Bố cục chính

### 🏠 Trang chủ (`/`)
1. **Header** — Logo + Navbar + Search + Cart icon + User menu
2. **Hero section** — Banner quảng cáo sản phẩm nổi bật
3. **Featured Products** — Grid sản phẩm hot
4. **Categories** — Danh mục nổi bật (PC Gaming, Laptop, Linh kiện)
5. **Footer** — Thông tin liên hệ, chính sách, mạng xã hội

### 🛍️ Trang danh sách sản phẩm (`/products`)
- **Sidebar trái**: Bộ lọc (theo giá, hãng, danh mục, đánh giá)
- **Main content**: Grid sản phẩm + Sort dropdown
- **Pagination** ở cuối trang

### 🔍 Trang chi tiết sản phẩm (`/products/:slug`)
- **Carousel hình ảnh** (zoomable)
- **Thông tin sản phẩm**: tên, giá, mô tả, thông số kỹ thuật
- **Nút "Thêm vào giỏ"** + "Mua ngay"
- **Tab**: Mô tả / Thông số / Đánh giá

### 🛒 Giỏ hàng & Thanh toán (`/cart`, `/checkout`)
- Bảng sản phẩm: hình + tên + SL + giá + tổng
- Form nhập địa chỉ giao hàng
- Chọn phương thức thanh toán (COD / Bank / MoMo)

### 🛠️ Trang quản trị (`/admin/*`)
- **Sidebar menu** dọc (Dashboard, Products, Orders, Users, Categories)
- **Bảng dữ liệu** có filter + pagination
- **Charts** (revenue, orders theo ngày)

---

## 🎨 Design Tokens

| Token          | Giá trị     | Mô tả                |
|:---------------|:------------|:---------------------|
| `--primary`    | `#2563eb`   | Màu chính (blue-600) |
| `--primary-50` | `#eff6ff`   | Backgrounds nhẹ      |
| `--background` | `#ffffff`   | Nền trang            |
| `--foreground` | `#171717`   | Chữ chính            |
| `--border`     | `#e5e7eb`   | Viền / divider       |
| `--radius`     | `0.5rem`    | Bo góc mặc định      |

---

## 🖼️ Screenshots & Wireframes

> _[Chèn hình wireframe/mockup tại đây khi hoàn thành]_  
> Công cụ đề xuất: **Figma**, **draw.io**

| Trang | Wireframe | Status |
|:------|:---------:|:------:|
| Trang chủ          | _[TBD]_ | ⏳ |
| Danh sách SP       | _[TBD]_ | ⏳ |
| Chi tiết SP        | _[TBD]_ | ⏳ |
| Giỏ hàng           | _[TBD]_ | ⏳ |
| Admin Dashboard    | _[TBD]_ | ⏳ |

---

## 📚 Tham khảo

- Tailwind CSS docs: https://tailwindcss.com/docs
- Next.js UI patterns: https://vercel.com/design
- Material Design 3 (cho các component phức tạp)

---

_Tài liệu đang được cập nhật — wireframes sẽ được bổ sung sau khi thiết kế hoàn chỉnh._
