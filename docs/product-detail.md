# Chi tiết sản phẩm DUCMANH PC

## Route và giao diện

- Route chính: `/products/[slug]`.
- ProductCard ở trang chủ và `/customer/products` mở cùng route theo `product.slug`; API product sections đã bổ sung slug vào response.
- Breadcrumb dùng tên Category hiện tại và tên Product từ database.
- Desktop từ 1024px: Gallery | Product Info theo grid 3:2, gap 24px. Tablet/mobile: một cột, ảnh trước, thông tin sau, hai nút mua xếp dọc full width dưới 640px. Ảnh chính dùng khung 4:3, cao tối đa 520px, `object-fit: contain` và căn giữa; thumbnail cuộn ngang.
- Panel bên phải: Tên → hàng thống kê Đánh giá/Bình luận/Lượt xem → card tối đa 6 thông số nổi bật → thương hiệu/danh mục/tình trạng → giá → nút mua. SKU được ẩn khỏi Product Detail khách hàng, vẫn giữ trong database/API. Hàng thống kê dùng `flex flex-wrap items-center`, gap ngang 20px, font 12px; mỗi item giữ icon 16px và số/label trên cùng hàng với gap 4px. Mobile cho phép wrap nguyên item khi thiếu chỗ. Không có review thì hiển thị 0 đánh giá; điểm trung bình hiện bên cạnh số đánh giá nếu có dữ liệu. Không render card thông số khi dữ liệu trống.
- Thumbnail chỉ xuất hiện khi có nhiều ảnh, kích thước 64px, cách ảnh chính 8px. Sau gallery/thumbnail là dòng chú thích “Hình ảnh mang tính chất minh họa / tham khảo !”, căn giữa, in nghiêng, màu trung tính, margin trên/dưới 8px.
- Thanh điều hướng nằm ngay dưới chú thích, cùng chiều rộng cột gallery. Mục “Hình ảnh sản phẩm” dùng thumbnail từ `product.primaryImage`, fallback `product.images[0].imageUrl`, rồi placeholder `Images` nếu thiếu hoặc tải lỗi; ảnh thay theo Product hiện tại. Ba mục còn lại dùng Lucide `ClipboardList`, `MessageCircle`, `Star`. Phiên bản Lucide hiện tại không xuất `MessagesCircle`, dùng `MessageCircle` cho biểu tượng hội thoại tròn.
- Menu cao 104px ở desktop, padding dọc 10px/ngang 12px, bo góc 16px. Bốn item dùng flex `justify-center`, gap 32px, rộng theo nội dung với min-width 76px, không dùng flex:1. Khung ảnh/icon 44px, thumbnail 38px, icon 24px, text 12px/line-height 16px/font-weight 400, cách icon 4px. Thumbnail nền trắng, bo góc 8px, `object-fit: contain`. Mobile cao 100px, gap 12px, min-width item 52–64px, khung 40px, thumbnail 34px, icon 20–22px, text 10–11px; giữ một hàng, căn giữa và không tràn ngang ở 320–1440px. Active dùng nền/viền cam nhạt, text/icon cam và bo góc 12px.
- Các mục cuộn mượt và chuyển focus đến `#product-gallery`, `#product-specifications`, `#product-faq`, `#product-reviews`; không reload hoặc đổi route. Active cập nhật khi chọn mục. Thiết bị bật giảm chuyển động cuộn trực tiếp. Target chừa khoảng trống cho header sticky.
- Nội dung phía dưới từ 1024px dùng grid 3:2, gap 24px: mô tả bên trái và bảng thông số kỹ thuật bên phải. Dưới 1024px xếp một cột, mô tả trước rồi thông số; FAQ/đánh giá nằm sau khu grid. Bảng thông số chia tên/giá trị 40%/60%, chữ 14px, padding dọc mỗi row 10px, border-bottom và giữ newline/wrap cho giá trị dài. Thứ tự theo `sortOrder`, không có thông số thì chỉ render “Thông số kỹ thuật đang được cập nhật.”. Target `#product-specifications` giữ nguyên để menu cuộn/focus tới bảng. Không render lại section ảnh.
- Trang chi tiết dùng màu cam/đỏ, nền sáng, card trắng và footer gọn của DUCMANH PC. Không có phần quảng cáo, trả góp, quà tặng, hotline hay marketing trong trang.
- Tham khảo cách tổ chức gallery, thông tin mua và các section từ [trang sản phẩm HACOM](https://hacom.vn/laptop-acer-aspire-3-a315-44p-r5qg-nx.ksjsv.001-r7-5700u-16gb-ram-512gb-ssd-15.6-inch-fhd-win-11-bac); nội dung sản phẩm và hình ảnh dùng dữ liệu DUCMANH PC.

## Component

| Component | Chức năng |
| --- | --- |
| `ProductDetail` | Fetch, trạng thái loading/error/not found, breadcrumb, thông tin sản phẩm, giá và tồn kho |
| `ProductStatistics` | Hàng thống kê thật từ API dưới tên, icon–số–label nằm ngang; click đánh giá cuộn/focus về section review |
| `ProductGallery` | Ảnh chính, thumbnail, chọn ảnh và fallback cho ảnh thiếu/hỏng |
| `ProductDetailNavigation` | Menu 4 mục dưới chú thích gallery, active màu cam và cuộn/focus đến nội dung |
| `ProductDetailContent` | Grid mô tả trái/thông số phải tỷ lệ 3:2 desktop, một cột mobile; FAQ/đánh giá phía dưới |
| `HighlightedSpecifications` | Chọn tối đa 6 thông số nổi bật từ dữ liệu hiện có, ưu tiên tên thuộc tính thông dụng |
| `ProductSpecifications` | Bảng tên/giá trị 40%/60% từ ProductSpecification, sortOrder, multiline và empty state |
| `ProductDescription` | Mô tả ngắn/dài, Xem thêm/Thu gọn; render text an toàn |
| `ProductPurchaseActions` | Thêm vào giỏ và Mua ngay; khóa khi hết hàng |
| `CartSummary` | Giỏ lưu trên trình duyệt, điều chỉnh/xóa và màn xem lại sản phẩm đã chọn |
| `ProductDetailSkeleton` | Khung ảnh, thumbnail, tên, giá, thông tin, nút và thông số trong lúc tải |

## API và nguồn dữ liệu

Dùng endpoint hiện có **`GET /api/products/:slug`**, bổ sung `ratingAverage`, `reviewCount`, `commentCount`, `viewCount`. Migration `20261006160000_product_statistics` thêm các bảng lưu thống kê, không seed dữ liệu cửa hàng.

- `ProductReview`: tính `reviewCount` bằng số bản ghi `isPublished = true`, rating từ 1–5; `ratingAverage` là trung bình rating của cùng tập bản ghi. Khi chưa có review, trả `reviewCount = 0`, `ratingAverage = null`.
- `ProductComment`: `commentCount` là số bản ghi `isPublished = true` của sản phẩm. Không tính nội dung chờ duyệt.
- `ProductView`: lưu một UUID cho mỗi lần mở trang thành công. `POST /api/products/:slug/views` nhận `{viewId}`; khóa chính `(productId, viewId)` chống ghi trùng khi retry hoặc request đồng thời. Tải lại trang tạo UUID mới. API trả `viewCount` từ `COUNT` trên dữ liệu đã lưu; GET detail không tăng số đếm. Không ghi lượt xem cho sản phẩm ẩn/xóa/không tồn tại hoặc request detail thất bại, không đổi `Product.updatedAt`.
- Phần ghi view không chặn hiển thị sản phẩm; nếu ghi lỗi, UI giữ số đếm đọc từ backend. Chưa bổ sung form gửi/duyệt review và comment; section phía dưới hiển thị empty state hoặc số bản ghi đã ghi nhận.

- `Product`: tên, slug, SKU, giá, giá gốc, tồn kho, mô tả ngắn/dài và trạng thái.
- `ProductImage`: ảnh, alt text, thứ tự và ảnh chính.
- `ProductSpecification`: toàn bộ thông số; section nổi bật chọn/sắp xếp một phần, bảng thông số giữ thứ tự database.
- `Brand`: `brandInfo.name`, slug dùng liên kết lọc, logo từ `logoUrl`. UI không render ID/slug/legacy key làm tên.
- `Category`: response bổ sung `categoryInfo: {id, name, slug}`. Tên từ relation hiện tại được ưu tiên hơn trường tên denormalized cũ.
- Product không tồn tại, đã xóa hoặc bị ẩn trả API 404; frontend hiển thị Không tìm thấy sản phẩm.
- Lỗi API/kết nối có nút Thử lại. Abort request khi đổi slug/rời trang, tránh hiển thị sản phẩm cũ.
- Public detail không trả `costPrice`; API quản trị vẫn giữ dữ liệu giá nhập.
- Không thêm các API nhỏ để lấy riêng Brand/Category/ảnh/thông số.

## Nút mua và phạm vi giỏ hàng

- Thêm vào giỏ lưu sản phẩm/giá/số lượng vào localStorage qua `cart.store.ts`, báo thành công và cập nhật badge giỏ trên header.
- Mua ngay chuẩn bị sản phẩm trong giỏ và chuyển `/customer/checkout?product=<slug>` để xem lại sản phẩm đã chọn.
- Giỏ hỗ trợ thay đổi số lượng/xóa, tồn kho giới hạn theo dữ liệu nhận khi thêm sản phẩm, và tồn tại sau reload.
- Cả hai nút bị disable khi sản phẩm hết hàng.
- Backend chưa có luồng gửi đơn/thanh toán hoạt động. Checkout hiện là màn xem lại, thông báo rõ chưa gửi đơn/thanh toán; không tạo đơn giả hoặc hiển thị thanh toán thành công. Giá/tồn kho trong giỏ là dữ liệu lưu tạm, chưa phải dữ liệu xác nhận cho một đơn hàng.

## Kiểm chứng

- `npm --prefix backend run test:product-detail`: API với MySQL thật, đủ field, tên Brand/Category hiện tại, thứ tự ảnh/thông số, slug của home cards, tồn kho, sản phẩm thiếu/ẩn/xóa và không lộ giá nhập.
- `npm --prefix frontend run test:product-detail`: Playwright với API thật. Click card từ trang chủ/danh sách, đổi ảnh, reload trực tiếp, tên/giá/thông số, mô tả an toàn, thêm giỏ/Mua ngay, skeleton, 404, lỗi/thử lại, ảnh hỏng và mobile gallery cuộn ngang.
- Responsive kiểm tra 320, 390, 768, 1024, 1440px; không horizontal overflow, gallery xếp đúng vị trí và nút full width trên mobile.
- Khu nội dung dưới được kiểm tra: desktop bảng ở cột phải/grid 3:2, mobile mô tả trước/thông số sau cùng chiều rộng; sortOrder đúng, cell giữ xuống dòng và wrap chuỗi dài, không render bảng rỗng. Menu Thông số kỹ thuật vẫn focus/cuộn tới bảng không reload.
- API statistics được kiểm thử với MySQL thật: trung bình review, lọc published/rating hợp lệ, comment count, view lưu bền, chống trùng/concurrent, validate UUID, GET không tăng view, lượt xem không đổi thời gian sửa Product và không ghi cho sản phẩm ẩn/xóa/thiếu.
- Browser kiểm tra SKU đã ẩn, hàng thống kê nằm dưới tên, ngay trước card thông số và giá; icon 16px cùng hàng với label trong từng item, desktop cùng hàng và mobile wrap nguyên item; dữ liệu review/comment thật từ fixture database, số lượt xem tăng đúng một lần khi mở/reload, và không có card thông số rỗng.
- Kiểm thử menu xác nhận 4 mục cùng hàng/không tràn, nằm sau chú thích với khoảng cách 8px, khớp chiều rộng gallery, mỗi mục focus/scroll đúng target mà không reload; kiểm tra thumbnail gọn, chú thích in nghiêng/căn giữa, không có section ảnh lặp, thứ tự section và empty state FAQ/đánh giá.
- Hồi quy `frontend/tests/home-products.cjs`: card/carousel ở 320–1920px, spec priority, giá giảm và touch swipe đã qua.
- Hồi quy Brand filter API và Category/Product CRUD integration đã qua.
- Kiểm thử product detail được chạy lại trên production bằng `next start` và đã qua; header responsive guest/USER/ADMIN ở 320–1920px cũng đã qua.
- `npm --prefix frontend run build`: production build thành công, sau khi dừng dev để không ghi đồng thời vào `.next`.
- Không tạo `.next-*` custom.
- Fixture dùng database thật và được dọn sau tests; không sửa sản phẩm cửa hàng hiện có.

Ảnh kiểm chứng: [Desktop](product-detail-screenshots/desktop.png), [Mobile](product-detail-screenshots/mobile.png), [Thống kê từ fixture database](product-detail-screenshots/statistics.png).
