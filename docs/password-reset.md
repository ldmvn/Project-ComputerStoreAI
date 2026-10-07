# Quên mật khẩu

## Chạy và cấu hình

Migration `20261005090000_password_reset` tạo bảng `PasswordReset`; `20261005160000_password_reset_lifecycle` thêm `verifiedAt`/`usedAt` và giữ trạng thái phiên cũ. Trên môi trường triển khai, chạy:

```sh
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
```

Nodemailer đã được cài; chức năng sử dụng lại `passwordResetMail.service.js`. Gmail SMTP dùng cấu hình sau trong `backend/.env` (file này được Git ignore):

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM="DUCMANHPC <your-address@gmail.com>"
```

`SMTP_PASS` phải là Google App Password. Service bỏ khoảng trắng trong App Password trước khi xác thực Gmail. Cổng 587 dùng STARTTLS (`secure: false`, `requireTLS: true`). `PASSWORD_RESET_SECRET` là secret ngẫu nhiên riêng; nếu bỏ trống dùng `JWT_SECRET`. Không đưa secret vào frontend, source code, template hay Git. Khởi động lại backend sau khi thay đổi cấu hình.

App Password phải được tạo khi đăng nhập đúng tài khoản `SMTP_USER`. Đổi SMTP_USER sang tài khoản khác không làm App Password cũ hợp lệ. Nếu Gmail trả `EAUTH / 535 Username and Password not accepted`, tạo App Password của tài khoản mới tại [Google App Passwords](https://myaccount.google.com/apppasswords) rồi thay riêng `SMTP_PASS` trong `.env`. Tài khoản trường có thể bị hạn chế tạo App Password theo chính sách của tổ chức; tham khảo [Google Account Help](https://support.google.com/accounts/answer/185833).

Backend nạp `.env` từ đúng thư mục backend. Trong development, các biến `SMTP_*` trong file được ưu tiên hơn giá trị cũ tiến trình dev đã kế thừa; production vẫn giữ ưu tiên biến môi trường do hệ thống triển khai cung cấp. Cấu hình nodemon theo dõi `.env` để tự restart sau thay đổi khi chạy một phiên dev mới. Nếu phiên dev đang chạy trước khi thêm cấu hình này, khởi động lại `npm run dev` một lần.

Backend gọi `transporter.verify()` khi khởi động, log `[SMTP] ready` khi kết nối/xác thực thành công. Lỗi ghi code, responseCode/command nếu có và nguyên nhân đã che App Password. Không bật Nodemailer debug hoặc ghi OTP. API kiểm tra SMTP trước khi tra tài khoản, dùng kết quả xác minh tối đa 5 phút; lần xác minh lỗi sẽ được thử lại trong yêu cầu tiếp theo.

Thiếu config trả 503 với tên biến còn thiếu (ví dụ `SMTP_USER`, `SMTP_PASS`), giống nhau cho mọi địa chỉ email. Gmail xác thực thất bại trả thông báo rõ `EAUTH`; kết nối lỗi trả mã lỗi tương ứng. Khi gửi email thất bại, server vô hiệu OTP, ghi lỗi vận hành và trả 503 “Không thể gửi mã xác nhận lúc này. Vui lòng thử lại.”; frontend ở nguyên bước email. Response không trả OTP hoặc thông báo tài khoản tồn tại. Log `[SMTP] OTP message accepted by mail server` chỉ xác nhận SMTP nhận thư, không đảm bảo thư nằm trong Inbox; kiểm tra cả Spam.

## Routes và API

- LoginModal dùng state `login`, `register`, `forgot`, `verify-otp`, `reset-password`. Nút “Quên mật khẩu?” và “Quay lại đăng nhập” chuyển nội dung ngay trong cùng card; không điều hướng, reload hoặc mở tab mới. Chuyển form dùng fade/slide nhẹ 200ms, tôn trọng `prefers-reduced-motion`.
- `/forgot-password`: giữ route cũ, mở chính LoginModal ở mode `forgot`, dùng cùng layout/card Login.
- `/login`: mở LoginModal ở mode `login`. Đổi mật khẩu thành công chuyển mode về Login và hiển thị toast “Đổi mật khẩu thành công. Vui lòng đăng nhập.”; không lưu cờ sessionStorage.
- `POST /api/auth/forgot-password`: `{ email }`; trả `{ success, message, challengeId, expiresIn: 300, expiresAt, serverTime, resendAfter: 60 }`. Hai thời gian là ISO UTC.
- `POST /api/auth/verify-reset-otp`: `{ email, otp }`; `challengeId` cũ vẫn được nhận để tương thích nhưng không dùng để lựa chọn/từ chối bản ghi. OTP mới nhất của email là nguồn xác minh; trả `{ success, resetToken, expiresIn: 600 }`.
- `POST /api/auth/reset-password`: `{ email, resetToken, password, confirmPassword }`; trả thông báo “Đổi mật khẩu thành công”.

## Vòng đời và bảo mật

OTP ngẫu nhiên 6 chữ số có hạn 5 phút; hạn dùng database và nội dung email cùng lấy từ `config/passwordReset.js`. Mỗi email đã trim/lowercase chỉ có một bản ghi. Request mới dùng upsert, retry lỗi unique do request đồng thời; thay thế hash/challenge, xóa reset token cũ, đặt `attempts=0`, `verifiedAt=null`, `usedAt=null`. Khi SMTP nhận thư, chốt `sentAt=now`, `expiresAt=now+300000` để thời gian gửi mail không rút ngắn cửa sổ nhập mã. OTP mới khác OTP còn lưu trước đó. Nếu request khác đã thay thế bản ghi trong lúc gửi, request cũ trả 409 thay vì chuyển frontend sang trạng thái cũ.

Thoát/reload/mở lại form có thể xin mã mới ngay, không còn bị cooldown của bản ghi cũ chặn. Nút gửi lại trong một flow vẫn chờ 60 giây; backend giữ tối đa 5 yêu cầu/email/giờ và 30 yêu cầu/IP/15 phút. Countdown OTP bắt đầu lại ở `05:00` theo thời gian backend, không dựa trên timezone máy người dùng. Backend luôn so `expiresAt > new Date()` tại verify, kể cả frontend đã đóng hoặc record chưa được dọn.

MySQL lưu `otpHash = HMAC-SHA256(challengeId:OTP)`, `expiresAt`, `attempts`, `verifiedAt`, `usedAt` và hash reset token. Không lưu OTP/token nguyên bản. Verify chuẩn hóa email/trim OTP, đọc bản ghi duy nhất mới nhất, kiểm tra tồn tại → chưa dùng/xác minh → còn hạn → chưa đủ 5 lần sai → so sánh HMAC bằng `timingSafeEqual`. Chỉ mã sai mới tăng `attempts`; mã đúng sau 4 lần sai vẫn được nhận. Lỗi hết hạn, đã dùng, vượt số lần thử và mã sai có thông báo riêng.

Mã đúng đặt `verifiedAt`, giữ hash OTP và cấp reset token ngẫu nhiên 32 byte có hạn 10 phút. OTP không được verify lần hai; reset password chỉ dùng phiên đã verified/token còn hạn, không phụ thuộc OTP còn hạn hay cleanup đã xóa hash OTP. Frontend giữ token trong bộ nhớ. Thành công đặt `usedAt`, xóa cả hash OTP và token; không thể replay. Mật khẩu hash bằng bcrypt cost 12. Transaction Serializable có retry đảm bảo verify/reset chỉ thành công một lần khi có request đồng thời. UI chuyển về Login ngay trong card.

Cleanup chạy mỗi 60 giây và khi request mã mới: xóa hash OTP đã hết hạn, giữ token xác minh còn hạn; xóa bản ghi hết hạn khi cửa sổ giới hạn 1 giờ đã qua và token không còn hiệu lực. Giữ metadata trong cửa sổ đó để không bypass giới hạn bằng việc chờ OTP hết hạn. Hết hạn luôn được quyết định bởi `expiresAt`, không bởi cleanup. Giới hạn IP nằm trong bộ nhớ từng process; triển khai nhiều instance cần bộ giới hạn dùng chung tại proxy/Redis. Giới hạn email theo giờ được lưu MySQL. Access JWT giữ vòng đời cũ.

## Kiểm thử

`npm run test:password-reset` trong backend dùng MySQL đã migrate và SMTP TCP cục bộ, tạo rồi dọn tài khoản thử. Chạy 30 kiểm tra tích hợp hiện có và bộ lifecycle gồm 6 test bắt buộc: đúng ngay, quá 5 phút, resend A→B, thoát/quay lại xin mã mới, sai 4 lần rồi đúng, và replay sau reset. Test quá hạn dùng đồng hồ backend được điều khiển bằng Node MockTimers; không sửa `expiresAt` hoặc chờ timer frontend. Có thêm test cleanup bảo toàn phiên reset, request đồng thời không lỗi duplicate, và SMTP lỗi không trả thành công giả.

Kiểm tra Gmail thật (gửi đúng một email) cần opt-in:

```powershell
$env:RUN_GMAIL_SMTP_TEST = '1'
npm.cmd run test:password-reset:gmail
```

Bài test tạo tài khoản thử riêng với plus alias của `SMTP_USER`, gửi email OTP thật, xác minh qua API, đặt mật khẩu ngẫu nhiên và đăng nhập rồi dọn dữ liệu. OTP chỉ được quan sát trong bộ nhớ bài test từ email đang gửi; không ghi ra log hoặc trả qua API production. Không đổi mật khẩu tài khoản đang sử dụng. Test xác nhận Gmail SMTP chấp nhận thư, cần kiểm tra hộp thư để xác nhận nhận thư thực tế.

`npm run test:password-reset` trong frontend kiểm tra giao diện bằng Edge headless ở desktop 1280px và mobile 375px. Chạy frontend ở cổng 3100 hoặc đặt `TEST_URL`; các API được mô phỏng riêng để kiểm tra loading, validation, lỗi OTP, show/hide, countdown gửi lại, quay về đăng nhập, cùng phần tử DOM/card, kích thước, không mở tab/reload/điều hướng, và response trễ sau khi quay lại. Phần backend được kiểm tra bằng bài integration thực phía trên.

Tài liệu tham khảo: [Nodemailer SMTP](https://nodemailer.com/smtp), [Gmail SMTP](https://support.google.com/mail/answer/7104828).
