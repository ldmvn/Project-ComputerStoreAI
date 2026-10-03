# Banner Home: một hero và sáu slot phụ

## Slot và API

| Slot | Nhóm | Payload Home | Hiển thị |
| --- | --- | --- | --- |
| MAIN_HERO | MAIN | mainHero: Banner[] | Carousel nhiều media; một media hiển thị tĩnh |
| SIDE_LEFT | SIDE | sideLeft | Banner dọc trái |
| SIDE_RIGHT_TOP | SIDE | sideRightTop | Banner phải trên |
| SIDE_RIGHT_MIDDLE | SIDE | sideRightMiddle | Banner phải giữa |
| SIDE_RIGHT_BOTTOM | SIDE | sideRightBottom | Banner phải dưới |
| BOTTOM_LEFT | SIDE | bottomLeft | Banner ngang ngắn dưới hero, bên trái |
| BOTTOM_RIGHT | SIDE | bottomRight | Banner ngang ngắn dưới hero, bên phải |

Các field phụ cũ vẫn trả về Banner đầu tiên hoặc null để tương thích; sideSlides trả về toàn bộ media Active theo từng position. Tất cả hỗ trợ IMAGE/VIDEO. Mọi slot, gồm MAIN_HERO và sáu slot phụ, đều cho phép nhiều media Active để chạy slider, sắp theo sortOrder/id. Backend vẫn dùng transaction Serializable khi lưu. Giữ CRUD, reorder, auth và upload hiện có. Không có nhóm slot động.

## Layout, dữ liệu và skeleton

Màn hình >768px dùng CSS Grid ba cột, tỷ trọng 19:54:27 khi đủ dữ liệu. SIDE_LEFT cao bằng toàn bộ cột giữa (hero + bottom), cột phải có tối đa ba banner phân đều toàn bộ chiều cao này. Hai bottom chỉ nằm dưới hero. Desktop ≥1024px gap cột/hàng 16px; 769–1023px gap 12px, giữ cùng bố cục. Hero desktop ≥1024px 16:5.5, max-height 440px; tablet 769–1023px 16:7; mobile ≤768px 16:8. Hai bottom mỗi ô 8:3, gap 10px, giữ nguyên tỷ lệ riêng; lần thu gọn hero không chỉnh banner phụ.

Mobile ≤768px chỉ MAIN_HERO cùng BOTTOM_LEFT / BOTTOM_RIGHT thành hai cột, kể cả 320px. Padding 12px, gap hàng 12px. Không render bốn slot trái/phải, skeleton hay media của chúng. useSyncExternalStore với `(max-width: 768px)` và server snapshot false giữ hydration nhất quán; CSS grid-area giữ vị trí center ngay từ server. Các slot có data xuất hiện lại khi resize qua breakpoint.

Ba trạng thái riêng:

- Fetch ban đầu hoặc thử tải lại: skeleton đúng bố cục, bảy slot trên desktop và ba slot trên mobile.
- Fetch xong có MAIN_HERO: chỉ render slot có data, không skeleton ngay cả khi đang chờ byte media.
- Fetch xong không có MAIN_HERO (kể cả có banner phụ): return null, bỏ toàn bộ section/padding/DOM, không khung xám hay placeholder. Lỗi fetch đầu tiên cũng không giữ skeleton; refresh khi focus hoặc sau 60 giây cho phép tải lại.

Thiếu trái/phải: không render cột đó, center mở rộng. Cột phải chỉ render media tồn tại và chia đều chiều cao theo số lượng thực tế. Thiếu một bottom: bottom còn lại full width, tỷ lệ 16:3 để giữ chiều cao gọn; thiếu cả hai: không render hàng bottom, cột trái/phải chỉ cao bằng hero. Không có ô trống hay min-height giả.

Home hiện chỉ có Banner Section, chưa có Product List. Page dùng contentClassName shrink-0 và fillViewport false của CustomerShell để wrapper Home không tạo vùng giãn trống trước Footer khi banner ẩn. Các trang khác giữ mặc định flex-1/min-h-screen. Khi thêm Product List sau banner, nó tự nằm sát Header khi section return null. Header/Footer không sửa.

Media width/height 100%, object-fit cover, object-position center, display block. Khung media hợp lệ vẫn giữ tỷ lệ trước khi byte tải, tránh nhảy layout; không dùng skeleton cho loading media hoặc lỗi. Media lỗi không render icon ảnh hỏng; preview Admin có thông báo lỗi. Video autoplay muted loop playsInline, không controls trên Home. Main carousel giữ autoplay, loop, transition, swipe/touch, pagination; ẩn mũi tên dưới 1024px, giữ cuộn dọc và link khi tap. Media ngoài vùng nhìn được tải trễ, hero ưu tiên tải. Một media không có điều khiển carousel.

## Admin

Trang `/admin/banners` chia Banner chính (MAIN_HERO) và Banner phụ (sáu slot). Banner chính và banner phụ mỗi nhóm dùng một danh sách chung; các banner phụ không còn chia thành sáu section trống. Mỗi card vẫn ghi vị trí thực tế. Thêm/sửa gồm tên, nhóm, vị trí, IMAGE/VIDEO, upload, link, alt, thứ tự, Active và thời gian slide cho mọi vị trí. Tên tiếng Việt: Banner chính giữa; Banner dọc bên trái; Banner phải trên/giữa/dưới; Banner dưới trái/phải. Danh sách trống ghi rõ slot sẽ ẩn trên Home. Card/form/dialog preview dùng tỷ lệ khuyến nghị cho bố cục đủ bảy slot Home, hướng dẫn kích thước và cảnh báo crop khi media lệch tỷ lệ.

Ảnh JPG/JPEG/PNG/WEBP tối đa 10 MB; video MP4/WEBM tối đa 50 MB. Giữ MIME/extension/signature/file-size validation backend, WebP optimization, storage và byte range video. Thêm hoặc bật media cùng slot không tắt media khác; từng media có thể bật/tắt độc lập.

## Migration và giữ dữ liệu

Migration từ lần chuyển sang bảy slot trước: `backend/prisma/migrations/20261001010000_banner_hero_slots/migration.sql`.

- MAIN_TOP → MAIN_HERO, giữ nhiều media và toàn bộ dữ liệu.
- MAIN_BOTTOM → BOTTOM_LEFT, chuyển nhóm SIDE.
- Nếu trước đó có nhiều slide dưới Active, chỉ giữ slide đầu theo sortOrder/id Active; các slide còn lại giữ media và chuyển Inactive để chọn lại trong Admin.
- SIDE_LEFT và ba SIDE_RIGHT_* giữ nguyên.
- BOTTOM_RIGHT là slot mới, ẩn trên Home cho đến khi Admin upload.

Migration mở rộng enum trước, map dữ liệu rồi thu enum về đúng bảy slot. Không xóa record/file, không sửa migration lịch sử, không reset DB. Migration đã áp dụng trong workspace, Prisma Client đã generate lại.

Khi triển khai sang môi trường khác:

```powershell
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:generate
npm run dev
```

## File sửa trong lần cập nhật optional/loading

Frontend: `src/components/home/banner/HomeBannerSection.tsx`, `HomeBannerSection.module.css`, `BannerSkeleton.tsx`, `BannerMedia.tsx`, `SideBanner.tsx`, `src/lib/banner.ts`, `src/components/admin/banner/BannerManager.tsx`, `src/app/page.tsx`, `src/components/layout/CustomerShell.tsx`, `tests/banner-responsive.cjs`, `tests/banners.cjs`; tài liệu này.

Không tạo file mới, không sửa API/backend/database, không migration mới. Không sửa Header/Footer/theme hoặc CRUD. CustomerShell thêm tùy chọn fillViewport mặc định true, chỉ Home tắt để bỏ khoảng trắng khi banner ẩn.

## Kiểm tra

- Production build và ESLint đạt.
- Responsive 320, 375, 390, 430, 440, 768, 769, 900, 1023, 1024, 1440px: số slot đúng, không tràn ngang, khung skeleton/ảnh ổn định, hai bottom thấp hơn hero, mobile không request media trái/phải, resize remount. Kiểm tra toàn bộ 64 tổ hợp optional slot tại 375/769/1440px, cột trái/phải cao bằng cả center, single bottom full width, mất hero thì main height 0 và Footer sát Header. Skeleton chỉ hiện lúc fetch dữ liệu, không còn sau API hoặc lỗi media.
- Touch thật: swipe hai hướng/loop/autoplay, không điều hướng khi swipe, vẫn cuộn dọc và điều hướng khi tap; video WebM thực fit khung 2:1.
- API/MySQL: CRUD, validation, quyền, reorder, thay/xóa media, Active filtering, video và quy tắc một Active ở cả sáu slot phụ.
- Browser/Admin: upload ảnh/video cả bảy slot, blob preview đúng tỷ lệ, sửa không upload lại, reorder, bật/tắt, preview video, xác nhận/hủy/xóa và reload, data trống ẩn section và media lỗi không có skeleton cố định. Không lỗi hydration/console trên luồng hợp lệ. Dữ liệu/media thử được dọn, trạng thái và thứ tự dữ liệu hiện có được khôi phục.

```powershell
$env:TEST_URL='http://localhost:3000'
node frontend/tests/banner-responsive.cjs
npm --prefix backend run test:banners
node frontend/tests/banners.cjs
```

Responsive test mock dữ liệu, không ghi DB. API/browser CRUD tests dùng database development/test đã migrate và tự dọn dữ liệu. BANNER_TEST_VIDEO tùy chọn trỏ clip WebM thực cho API/responsive test. Browser CRUD test tự tạo clip, có thể xuất với BANNER_VIDEO_FIXTURE_OUTPUT.

## Quy ước source và build

Source Banner nằm trong frontend/src/: app/admin/banners, components/home/banner, components/admin/banner, services, types, lib và hooks. Giữ tên file và import hiện tại, không tạo hệ thống source song song. Tests nằm trong tests/, tài liệu nằm trong docs/. Next.js chỉ dùng output mặc định .next/, không cấu hình distDir và không output riêng cho từng tính năng. Không chạy dev/build đồng thời trên cùng output; dừng dev trước khi production build rồi khởi động lại khi cần.

Cập nhật hero gọn: chỉ CSS .hero thay đổi tỷ lệ theo breakpoint, không sửa slider, Admin, API hoặc dữ liệu. Trường hợp chỉ có MAIN_HERO, grid chỉ có một khung, section cao đúng bằng hero cộng padding hiện tại; không min-height cũ. Kiểm tra hero-only tại 1440/1366/1024/768/430/390px và thêm 1920px để xác nhận cap 440px. Desktop đến 1440px giảm 31,25% chiều cao so với 2:1 cũ. Tỷ lệ khuyến nghị/preview Admin giữ nguyên theo yêu cầu.

Điều khiển hero: bỏ nút tạm dừng/tiếp tục. Hai mũi tên chỉ hiện khi hover bằng chuột trên desktop; vẫn có focus-visible cho bàn phím. Mobile dùng swipe và dots. Autoplay tiếp tục cả khi hover hoặc nút đang focus, chỉ dừng trong touch gesture, khi tab ẩn hoặc reduced-motion.

## Banner phụ: danh sách chung và Tự động

BannerManager gộp tất cả banner phụ vào một grid, giữ preview/sửa/bật-tắt/xóa và tên vị trí trên card. Form thêm banner phụ mặc định Tự động, vẫn có đủ sáu vị trí cụ thể. Form sửa giữ vị trí đang lưu; chọn Tự động khi sửa ưu tiên giữ slot hiện tại nếu còn khả dụng.

AUTO chỉ là lựa chọn gửi lên save API, không phải enum/schema mới. Backend chọn slot chưa có media Active trong transaction Serializable và lưu tên slot cụ thể. Ưu tiên BOTTOM_LEFT → BOTTOM_RIGHT → SIDE_RIGHT_TOP → SIDE_RIGHT_MIDDLE → SIDE_RIGHT_BOTTOM → SIDE_LEFT. Preview tự động ghi rõ vị trí dự kiến; server quyết định cuối cùng khi lưu để xử lý admin thao tác đồng thời. Nếu cả sáu slot đều có media Active: trả 409, không tắt media khác; form báo đầy và yêu cầu chọn vị trí cụ thể hoặc tắt một banner. Chọn slot cụ thể sẽ thêm media vào slider tại vị trí đó, không tắt media đang Active. Retry transaction tối đa ba lần nếu gặp xung đột P2034. Không migration, không đổi dữ liệu cũ, không đổi Home layout/Header/Footer.

API test đã kiểm tra slot trống, sửa AUTO, đầy slot không thay đổi Active cũ, hai upload đồng thời chọn slot khác nhau và validation AUTO chỉ cho SIDE. Browser test kiểm tra danh sách chung, bảy lựa chọn vị trí gồm AUTO, guard khi đầy và upload AUTO vào vị trí vừa được giải phóng; CRUD cũ được kiểm tra lại.

File cập nhật cho danh sách chung/AUTO: frontend/src/components/admin/banner/BannerManager.tsx, BannerForm.tsx; frontend/src/types/banner.type.ts, frontend/src/lib/banner.ts; backend/src/validators/banner.validator.js, backend/src/services/banner.service.js; tests API/browser và tài liệu này. Production build, TypeScript, lint và API/browser tests đạt; chỉ output .next/. Dữ liệu và tài khoản thử đã được dọn sạch.

## Slider ở mọi vị trí

Một media Active: hiển thị tĩnh, không điều khiển thừa. Nhiều media Active cùng position: dùng chung MainBannerSlider, autoplay/loop/dots/swipe và ảnh/video xen kẽ. Banner phụ dùng compact controls để phù hợp khung nhỏ, mũi tên chỉ hiện khi hover, không nút pause. Khoảng thời gian chuyển cấu hình cho cả MAIN/SIDE. Home API giữ field legacy đầu tiên và thêm sideSlides (mảng theo position) để frontend mới nhận đầy đủ media; không migration hoặc tự bật lại dữ liệu Inactive cũ.

Kiểm tra API: nhiều media Active tại cả sáu slot phụ, ảnh/video, không tự tắt media khác, toggle độc lập và đúng danh sách slides. Browser/Admin: thêm hai media cùng SIDE_LEFT giữ Active và tự chạy cùng slider chính. Responsive: sáu slider phụ tự chuyển ở desktop; mobile chỉ render MAIN_HERO và hai bottom, không request media trái/phải.

## Ngoại lệ banner Tự động

Tự động không tham gia slider: mỗi banner AUTO giữ một slot riêng không có media Active khác. Lưu isAutoPlaced để nhận biết sau reload/sửa; form AUTO không có trường thời gian slide và card ghi Tự động. Chọn vị trí cụ thể trong form sửa sẽ chuyển sang chế độ cố định, khi đó có thể gộp nhiều Active để chạy slider. API chặn thêm/bật media khác vào slot của AUTO. Bật lại AUTO sẽ chọn slot trống khác nếu slot cũ bị chiếm; hết slot trả 409. Renderer AUTO luôn truyền đúng một media vào carousel để không hiện controls hoặc tự chuyển ảnh.

Migration bổ sung: backend/prisma/migrations/20261001100000_banner_auto_placement/migration.sql thêm isAutoPlaced BOOLEAN DEFAULT false; đã deploy và generate Prisma Client. Không sửa enum slot hay tự phân loại lại record cũ: trước đây AUTO chỉ là tham số chọn slot, chưa lưu nguồn gốc nên không thể đoán chính xác. Với banner AUTO cũ, mở Sửa và chọn lại Tự động để lưu dấu nhận biết.

Kiểm tra API: AUTO/static/exclusive, save và toggle không gộp media vào AUTO, sửa sang vị trí cụ thể bật chế độ slider, quy tắc nhiều media vẫn hoạt động với fixed slots. Browser: AUTO lưu dấu nhận biết, form sửa giữ lựa chọn AUTO và ẩn thời gian chuyển, đổi sang fixed lưu lại đúng.
