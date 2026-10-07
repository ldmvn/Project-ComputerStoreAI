# Mega Menu DUCMANH PC

## Dữ liệu và migration

- Thêm `MegaMenu`, `MegaMenuGroup`, `MegaMenuItem` và `MegaMenuBrand` (bảng liên kết thương hiệu nổi bật).
- Migration `20261006120000_mega_menu` đã được chạy bằng `prisma migrate deploy` trên MySQL local; Prisma Client đã được generate lại.
- Mỗi Category cấp chính có tối đa một Mega Menu. Nhóm hiển thị không phải Category.
- Category/Brand được tham chiếu bằng ID hiện có; không tạo Category, Brand hoặc Product trong module menu.
- Schema hiện tại chưa có Attribute/AttributeValue. `ATTRIBUTE_FILTER` dùng `attributeName`/`attributeValue` từ `ProductSpecification` hiện có. Dropdown lấy các cặp tên/giá trị thực trong database. Không dùng ID thông số của một sản phẩm vì Product CRUD thay thế thông số khi lưu, khiến ID này không ổn định.
- Xóa Category gốc chỉ cascade cấu hình menu; xóa Category/Brand được item tham chiếu sẽ SetNull. Quan hệ Product hiện có vẫn Restrict, không cascade xóa sản phẩm.

## Dashboard

Đường dẫn `/admin/mega-menu`, trong nhóm **Cửa hàng → Mega Menu**.

1. Chọn Category cấp chính, bật/tắt menu, chọn thương hiệu nổi bật rồi **Lưu cấu hình**.
2. **Thêm nhóm**: tên nhóm, thứ tự, column span 1–4, trạng thái.
3. **Thêm mục** vào nhóm: tên hiển thị, loại liên kết, dữ liệu tương ứng, thứ tự, trạng thái.
4. **Sửa nhóm/Sửa mục** để thay đổi thứ tự; **Ẩn/Hiện nhóm** để thay đổi trạng thái. Xóa nhóm chỉ xóa các mục của nhóm.
5. Dashboard đánh dấu tham chiếu bị xóa/ẩn hoặc thuộc tính không còn tồn tại. Public API bỏ qua chúng.

## API

Tất cả endpoint quản trị yêu cầu Bearer token và tài khoản ADMIN đang hoạt động.

| Method | Path | Chức năng |
| --- | --- | --- |
| GET | `/api/mega-menu` | Danh mục cấp chính đang hoạt động, nhóm, mục và thương hiệu nổi bật |
| GET | `/api/mega-menu/:categorySlug` | Menu của một danh mục; 404 nếu danh mục bị ẩn/không tồn tại |
| GET | `/api/admin/mega-menu/options` | Các thuộc tính/giá trị từ thông số sản phẩm hiện có |
| GET | `/api/admin/mega-menu/categories/:categoryId` | Cấu hình menu và trạng thái invalid của mục |
| PUT | `/api/admin/mega-menu/categories/:categoryId` | Tạo/cập nhật cấu hình `{isActive, brandIds?}` |
| POST | `/api/admin/mega-menu/categories/:categoryId/groups` | Thêm nhóm |
| PUT / DELETE | `/api/admin/mega-menu/groups/:id` | Sửa/xóa nhóm |
| POST | `/api/admin/mega-menu/groups/:groupId/items` | Thêm mục |
| PUT | `/api/admin/mega-menu/groups/:groupId/items/:id` | Sửa mục |
| DELETE | `/api/admin/mega-menu/items/:id` | Xóa mục |

Item hỗ trợ `CATEGORY`, `BRAND`, `PRICE_FILTER`, `ATTRIBUTE_FILTER`, `CUSTOM_URL`. Các trường không thuộc type được xóa khi lưu. Backend chặn liên kết trùng trong cùng nhóm, khoảng giá đảo ngược, ID không tồn tại, cặp thuộc tính sai và URL ngoài http/https hoặc đường dẫn nội bộ.

Public response:

```json
{
  "menus": [{
    "category": { "id": 1, "name": "Laptop", "slug": "laptop", "icon": "Laptop", "href": "/customer/products?category=laptop", "children": [] },
    "groups": [{ "id": 1, "title": "Laptop Theo Hãng", "columnSpan": 1, "items": [{ "id": 1, "label": "Acer", "type": "BRAND", "href": "/customer/products?category=laptop&brand=acer" }] }],
    "brands": []
  }]
}
```

## Frontend và bộ lọc

- Desktop: hover Danh mục mở danh sách Category bên trái; hover/focus Category đổi panel bên phải. Render `groups.map` và `group.items.map`; không có danh sách Category/Brand viết cứng. Grid 2 cột ở màn hình desktop nhỏ, 4 cột từ 1280px. Column span được giới hạn theo số cột hiện có.
- Vùng Category và panel chung một container; delay đóng 150ms giúp di chuyển chuột ổn định. Có hỗ trợ Escape, focus bàn phím và click bên ngoài.
- Mobile: drawer Category → Group → Item bằng accordion; có khóa cuộn nền, giữ focus trong drawer, Escape và inert khi đóng.
- Logo thương hiệu dùng `Brand.logoUrl` hiện có; khi chưa có logo hiển thị tên thương hiệu. Click dùng cùng liên kết lọc Category + Brand.
- Backend sinh `href` theo dữ liệu. Các bộ lọc Brand/Price/Attribute giữ phạm vi Category gốc. CATEGORY item lọc danh mục đích.
- Trang `/customer/products` đã thay placeholder bằng danh sách từ API, có loading/error/empty state, sắp xếp, phân trang và hiển thị bộ lọc.
- `/api/products` hỗ trợ `category`, `brand`, `minPrice`, `maxPrice`, `attribute`, `attributeValue`; giới hạn giá inclusive. Category lọc cả sản phẩm trong danh mục con, giữ hỗ trợ dữ liệu Category cũ chưa có ID.
- Brand nhận `brand=<slug>` hoặc `brandId=<id>`. Public product API trả `filters.brand: {id, name, slug} | null` từ database, độc lập với số sản phẩm tìm được. Badge chỉ hiển thị `brand.name`; khi đang resolve hiển thị “Đang tải…”, khi không tồn tại hiển thị “Không khả dụng”. Không dùng query param làm fallback tên.
- Slug Brand `legacy-*` được chuẩn hóa bằng hàm `slugifyBrand(name)` hiện có; giữ nguyên ID và quan hệ. Các URL legacy dạng hash từ migration cũ vẫn resolve được Brand sau chuẩn hóa. Script kiểm tra: `npm --prefix backend run brands:normalize-slugs`; áp dụng: `npm --prefix backend run brands:normalize-slugs -- --apply`. Script chạy trong transaction, dừng khi phát hiện slug trùng thay vì tự gộp Brand.
- Public API trả `Cache-Control: public, max-age=30, must-revalidate`. Frontend lấy menu khi mở, chia sẻ request đang chạy và cache 30 giây. Hover Category không gọi API mới. Sau thay đổi dashboard, dữ liệu ở tab khách được cập nhật khi mở lại sau TTL hoặc tải lại trang.
- Không tự tạo nội dung menu mẫu vào dữ liệu cửa hàng. Category chưa có cấu hình vẫn có liên kết sản phẩm và danh mục con lấy từ database.

## Kiểm chứng

- `npm --prefix backend run test:mega-menu`: validator + integration API trên MySQL thật, gồm 5 loại mục, auth, chống trùng, Brand/Price/Attribute, danh mục con, khoảng giá inclusive, ẩn/sắp xếp nhóm/mục, thương hiệu nổi bật, tham chiếu bị xóa/ẩn, thuộc tính không còn tồn tại và giữ nguyên sản phẩm.
- `npm --prefix backend run test:categories:integration`: hồi quy Category/Product CRUD, cây danh mục, bộ lọc và xóa an toàn.
- Unit tests Category/Brand hiện có: 9 tests (tính cả Mega Menu validator) đã qua.
- `npm --prefix frontend run test:mega-menu`: Playwright với API/database thật. Tạo nhóm Laptop Theo Hãng, tham chiếu Acer/ASUS, nhóm giá Dưới 15 triệu, RAM 16GB; click và kiểm tra kết quả lọc. Kiểm tra hover không đóng, cache một request, ẩn/sắp xếp nhóm, column span, logo area, desktop 1024/1280/1440px và mobile 320/390/768px.
- `frontend/tests/header-responsive.cjs`: kiểm tra guest/USER/ADMIN ở 320–1920px đã qua.
- `frontend/tests/categories.cjs`: hồi quy tạo/sửa Category, trạng thái, chặn xóa Category có sản phẩm và mobile accordion đã qua; fixture được bổ sung response Mega Menu mới.
- `npm --prefix frontend run build`: production build thành công.
- `npm --prefix backend run test:brand-filter` và `npm --prefix frontend run test:brand-filter`: API/database thật + trình duyệt, xác nhận resolve tên qua slug/ID/legacy, 0 kết quả, Brand không tồn tại, chuẩn hóa slug và giữ nguyên quan hệ sản phẩm.
- Không tạo `.next-*` custom; Next.js vẫn dùng duy nhất `frontend/.next`.
- Tests tạo fixture riêng và dọn sau khi chạy; không thay đổi Category/Brand/Product hiện có của cửa hàng.

Ảnh kiểm chứng: [Dashboard](mega-menu-screenshots/admin.png), [Desktop](mega-menu-screenshots/desktop.png), [Mobile](mega-menu-screenshots/mobile.png).
