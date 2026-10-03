# Báo cáo refactor frontend

## 1. Cấu trúc trước

```text
src/
  app/
    (customer)/{account,orders,build-pc}/
    home/{layout,page}.tsx
    dashboard/{layout,page}.tsx + [...slug]/page.tsx
    admin/, customer/, api/, build-pc/ (rỗng)
    layout.tsx, page.tsx, loading.tsx, error.tsx, not-found.tsx, globals.css
  components/{dashboard,layout,product,ui}/
  hooks/, lib/, services/, store/, types/, data/, styles/
```

Đã đọc toàn bộ tệp trong `src`, kiểm tra import, dynamic import, href, điều hướng, fetch, store và cấu hình alias. Không có middleware hoặc API handler frontend. API đang hoạt động chỉ nằm trong `services/auth.service.ts`, gọi Express trực tiếp. Alias `@/*` vẫn trỏ tới `src/*`.

## 2. Cấu trúc sau

```text
src/
  app/
    customer/
      layout.tsx
      products/page.tsx
      cart/page.tsx
      checkout/page.tsx
      profile/page.tsx + orders/page.tsx
      wishlist/page.tsx
      build-pc/page.tsx
    admin/
      layout.tsx
      dashboard/page.tsx
      [...slug]/page.tsx
    layout.tsx, page.tsx, loading.tsx, error.tsx, not-found.tsx, globals.css
  components/
    admin/{DashboardShell,DashboardSidebar,DashboardTopbar}.tsx + menu.config.ts
    layout/{Header,Footer,CustomerShell,AccountDropdown,LoginModal}.tsx
    ui/Skeleton.tsx
  services/auth.service.ts
  store/auth.store.ts
  types/user.type.ts
```

Admin products, orders và các mục quản trị khác tiếp tục dùng một catch-all có whitelist từ menu; URL không được khai báo trả về 404. Không nhân bản trang placeholder cho mỗi mục quản trị. Không tạo hooks/lib/product rỗng để chỉ đạt hình thức của cây thư mục.

## 3–5. Thư mục xóa, đổi tên và tệp di chuyển

| Trước | Sau |
| --- | --- |
| `app/(customer)/layout.tsx` | `app/customer/layout.tsx` |
| `app/(customer)/account/page.tsx` | `app/customer/profile/page.tsx` |
| `app/(customer)/orders/page.tsx` | `app/customer/profile/orders/page.tsx` |
| `app/(customer)/build-pc/page.tsx` | `app/customer/build-pc/page.tsx` |
| `app/dashboard/layout.tsx` | `app/admin/layout.tsx` |
| `app/dashboard/page.tsx` | `app/admin/dashboard/page.tsx` |
| `app/dashboard/[...slug]/page.tsx` | `app/admin/[...slug]/page.tsx` |
| `components/dashboard/*` (4 tệp) | `components/admin/*` |

Đã bỏ `app/home`, `app/(customer)`, `app/dashboard`, `components/dashboard`; xóa các thư mục rỗng `app/api`, `app/build-pc`, `data`, `styles`, `hooks`, `lib`, `components/product`. Cây và danh sách chính xác trước/sau nằm trong `refactor-inventory.json`.

## 6–7. Hợp nhất

Hai layout cửa hàng đều lặp Header/main/Footer: hợp nhất vào `components/layout/CustomerShell.tsx`, giữ nguyên class của main ở trang chủ và trang con. Trang `/` render trực tiếp shell thay vì redirect `/home`; nội dung trang chủ vốn là `null`, vẫn giữ nguyên.

Không có hai ProductCard/Button/Input/Modal hoạt động để hợp nhất: những tệp mang tên này đều 0 byte. Header/Footer vẫn giữ một phiên bản. Sidebar admin có chức năng thật, còn `layout/Sidebar.tsx` và `Navbar.tsx` rỗng được bỏ. `AuthUser` chuyển từ service về `types/user.type.ts`, dùng chung cho service/store/dropdown; contract backend giữ nguyên.

## 8–9. Route và import

| URL cũ | URL chuẩn |
| --- | --- |
| `/home` | `/` |
| `/account` | `/customer/profile` |
| `/orders` | `/customer/profile/orders` |
| `/build-pc` | `/customer/build-pc` |
| `/products`, `/cart`, `/checkout`, `/wishlist` | Các URL tương ứng dưới `/customer` |
| `/dashboard` | `/admin/dashboard` |
| `/dashboard/:path+` | `/admin/:path+` |

URL cũ dùng redirect 308 trong `next.config.js`, giữ query string. Cập nhật danh mục, tìm kiếm, wishlist, cart, Build PC, menu tài khoản, link admin, nút về trang chủ và redirect khi không có quyền. Cập nhật import DashboardShell/menu.config và AuthUser. Test cũ đã chuyển sang URL chuẩn; test dashboard sửa assertion vốn không còn phù hợp với shell hiện tại.

## 10. Tệp không dùng đã xóa

26 scaffold 0 byte, không được import: 4 hooks; 4 lib; `services/http.client.ts`, `order.service.ts`, `product.service.ts`; `store/cart.store.ts`; 3 types api/order/product; `layout/Navbar.tsx`, `Sidebar.tsx`; 4 product components; 5 UI components Badge/Button/Card/Input/Modal. Hai tệp home được thay thế bằng trang chủ trực tiếp và CustomerShell. Không xóa logic triển khai đang hoạt động. Các thay đổi/xóa theme đã có từ trước nhiệm vụ không thuộc refactor này.

## 11. Kiểm tra

- `npm run dev --workspace=frontend -- --port 3100`: khởi động thành công.
- `npm run build --workspace=frontend`: kiểm tra production build, TypeScript và lint. Chỉ sử dụng output mặc định `.next/`; dừng dev server dùng cùng output trước khi build để tránh tranh chấp artifact.
- `npm run lint --workspace=frontend`: không lỗi hoặc cảnh báo.
- Browser Edge/Playwright: route khách hàng, Header/Footer không lặp, redirect cũ giữ query, 404 cho URL không tồn tại, không lỗi hydration/console trên các route cửa hàng được kiểm tra.
- Menu tài khoản USER/ADMIN: đóng/mở, Escape, keyboard, outside click, responsive, điều hướng profile/orders, logout, mở login modal.
- Header guest/USER/ADMIN: 320–1920px, không chồng lấn action hoặc tràn ngang.
- Admin: guest/USER/token hết hạn bị chuyển về `/`; cached role giả ADMIN không cấp quyền; ADMIN truy cập dashboard/products/orders/settings, sidebar desktop/mobile, logout thu hồi quyền truy cập.

Các test browser dùng mock `/auth/me`; Playwright được cài ngoài repository, không thêm dependency sản phẩm.

## 12. Giới hạn còn tồn tại

Sản phẩm/tìm kiếm/filter, cart, checkout, wishlist, profile/orders, Build PC, dashboard và AI chưa có triển khai hoàn chỉnh trong source ban đầu. Thêm 4 trang thông báo đang chuẩn bị cho products/cart/checkout/wishlist để các URL yêu cầu không còn 404; chúng không phải chức năng mua hàng hoàn chỉnh. Profile/orders và admin giữ placeholder cũ. Không thể xác nhận giao dịch mua hàng hoặc AI end-to-end bằng source này.

Login/register service, validation, auth storage và API contract được giữ nguyên; chưa kiểm thử đăng ký/đăng nhập với backend/database thật. Header/Footer còn link tới các trang thông tin chưa tồn tại từ trước (stores, blog, policy, v.v.); không bổ sung nội dung hoặc redesign ngoài phạm vi refactor. Không thay backend hoặc database/schema.
