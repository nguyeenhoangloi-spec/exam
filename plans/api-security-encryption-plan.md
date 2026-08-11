# Kế hoạch chuẩn hóa chức năng bảo mật và mã hóa API

## 1. Mục tiêu

Bảo vệ toàn bộ luồng giao tiếp giữa frontend, backend và dữ liệu nhạy cảm của hệ thống quản lý thi; bảo đảm người dùng chỉ gọi được API đúng với vai trò và quyền của mình.

Phạm vi ưu tiên:

1. Mã hóa đường truyền bằng HTTPS/TLS.
2. Chuẩn hóa xác thực bằng JWT và quản lý phiên đăng nhập.
3. Chuẩn hóa phân quyền API theo vai trò.
4. Bảo vệ secret, log, CORS và các endpoint nhạy cảm.
5. Chỉ mã hóa dữ liệu trong database khi có yêu cầu nghiệp vụ cụ thể.

Không tự mã hóa toàn bộ JSON request/response ở frontend nếu HTTPS đã được cấu hình; việc đó làm tăng độ phức tạp nhưng không thay thế được HTTPS.

## 2. Hiện trạng cần ghi nhận

- Frontend dùng Axios tập trung tại `frontend/lib/api.ts`.
- Access token đang lưu trong `localStorage` tại `frontend/lib/auth.ts` và gửi qua header `Authorization: Bearer`.
- Backend đã có JWT module, JWT guard và validation pipe.
- Backend đang cho phép CORS `origin: '*'` đồng thời bật `credentials: true`; cấu hình này cần giới hạn theo domain thực tế.
- Thời hạn JWT hiện mặc định là 7 ngày; cần đánh giá lại theo mô hình access token/refresh token.
- API có dữ liệu nhạy cảm: câu hỏi, đề thi, đáp án, bài làm, điểm, hồ sơ sinh viên và file upload.
- Backend có logging interceptor và audit service; cần kiểm tra để chắc chắn không ghi token, mật khẩu hoặc nội dung nhạy cảm.

## 3. Thiết kế chuẩn đề xuất

### 3.1. Lớp giao tiếp

- Production chỉ cho phép `https://`.
- Dùng reverse proxy hoặc nền tảng triển khai để cấp chứng chỉ TLS.
- Chuyển `NEXT_PUBLIC_API_URL`, Google callback và các URL môi trường production sang HTTPS.
- Bật HSTS sau khi xác nhận HTTPS hoạt động ổn định.

### 3.2. Lớp xác thực

- Giữ access token thời hạn ngắn, khoảng 15–30 phút.
- Thêm refresh token có thời hạn dài hơn, lưu bằng cookie `HttpOnly`, `Secure`, `SameSite` phù hợp.
- Lưu refresh token dạng hash trong database nếu cần thu hồi từng phiên.
- Thêm logout/revoke token và xử lý refresh khi access token hết hạn.
- Không đưa secret hoặc token vào mã frontend, URL, log hay thông báo lỗi.
- Bắt buộc `JWT_SECRET` đủ dài và khác nhau giữa development, test và production.

### 3.3. Lớp phân quyền

- Lập ma trận quyền cho `ADMIN`, `TEACHER`, `STUDENT`.
- Kiểm tra mỗi controller nhạy cảm có `JwtAuthGuard` và `RolesGuard` phù hợp.
- Kiểm tra quyền trên đối tượng, không chỉ kiểm tra role; ví dụ giáo viên chỉ được chấm bài được phân công.
- Không cho phép thay đổi ID trên URL để đọc dữ liệu của người dùng khác.

### 3.4. Lớp dữ liệu

- Mật khẩu tiếp tục dùng hash bcrypt/Argon2, không giải mã ngược.
- Đề thi, đáp án hoặc thông tin cá nhân cần mã hóa database chỉ khi yêu cầu bảo mật bắt buộc.
- Nếu mã hóa database: dùng AES-256-GCM, key nằm ngoài database, quản lý bằng secret manager, có version key và kế hoạch rotate key.
- File upload phải kiểm tra loại file, kích thước, tên file và quyền truy cập; không để file nhạy cảm public tùy ý.

### 3.5. Lớp vận hành

- CORS chỉ cho phép frontend domain đã khai báo.
- Bổ sung rate limit cho login, Google login, đổi mật khẩu và các endpoint nhạy cảm.
- Dùng Helmet và các security header.
- Chuẩn hóa lỗi, không trả stack trace hoặc thông tin database cho client.
- Audit các hành động quan trọng: login, đổi mật khẩu, xem/phát hành đề, chấm bài, sửa điểm, tải file.
- Mask token, mật khẩu và dữ liệu cá nhân trong log.

## 4. Thứ tự triển khai

### Giai đoạn A — Khảo sát và chốt yêu cầu

- Chốt ý nghĩa của “mã hóa API” với người yêu cầu.
- Lập danh sách endpoint, role, dữ liệu nhạy cảm và môi trường triển khai.
- Xác định domain frontend/backend và nơi cấp TLS.
- Chốt có cần mã hóa dữ liệu trong database hay chỉ cần HTTPS.

Đầu ra: tài liệu hiện trạng, ma trận quyền và danh sách endpoint ưu tiên.

### Giai đoạn B — Gia cố nền tảng

- Cấu hình HTTPS ở môi trường staging.
- Giới hạn CORS theo biến môi trường.
- Thêm Helmet, rate limit và security headers.
- Kiểm tra logging interceptor, exception filter và audit log.
- Kiểm tra toàn bộ secret trong `.env`, không commit secret thật.

Đầu ra: staging chạy HTTPS và có cấu hình bảo mật cơ bản.

### Giai đoạn C — Chuẩn hóa phiên đăng nhập

- Thiết kế access token/refresh token.
- Thêm endpoint refresh và logout.
- Chuyển refresh token sang cookie HttpOnly.
- Cập nhật Axios interceptor để tự refresh một lần khi nhận `401`, tránh vòng lặp vô hạn.
- Giữ cơ chế chuyển về `/login` khi refresh thất bại.

Đầu ra: phiên đăng nhập an toàn, hết hạn đúng và có thể thu hồi.

### Giai đoạn D — Bảo vệ API nghiệp vụ

- Rà soát guard/role trên tất cả controller.
- Bổ sung kiểm tra quyền sở hữu hoặc quyền được phân công.
- Ưu tiên các nhóm: auth, exam-papers, questions, online-exams, essay, proctor, reports và users.
- Bảo vệ endpoint tải đề, đáp án, bài làm và file upload.

Đầu ra: không thể truy cập chéo dữ liệu hoặc gọi thao tác vượt quyền.

### Giai đoạn E — Mã hóa dữ liệu chọn lọc nếu cần

- Chọn chính xác field cần mã hóa.
- Tạo module mã hóa/giải mã dùng AES-256-GCM.
- Thiết kế key version, rotate key và backup key an toàn.
- Viết migration có khả năng chạy lại và kế hoạch rollback.
- Không mã hóa các field cần tìm kiếm/sắp xếp nếu chưa có thiết kế phù hợp.

Đầu ra: dữ liệu nhạy cảm trong database được mã hóa nhưng chức năng hiện tại vẫn hoạt động.

### Giai đoạn F — Kiểm thử và nghiệm thu

- Unit test cho auth, guard, role và module mã hóa.
- Integration test cho `401`, `403`, token hết hạn, refresh, logout và truy cập chéo dữ liệu.
- Kiểm tra HTTPS bằng trình duyệt hoặc proxy kiểm thử.
- Kiểm tra CORS từ domain không được phép.
- Kiểm tra rate limit và upload file.
- Kiểm tra log không chứa password, token hoặc secret.
- Kiểm tra hiệu năng trước và sau khi bật mã hóa.

## 5. Các file dự kiến thay đổi

- `backend/src/main.ts`: CORS, Helmet, HTTPS-related headers và rate limit.
- `backend/src/auth/auth.module.ts`, `auth.service.ts`, controller/DTO: access-refresh token, logout và session.
- `backend/src/common/guards/*`: xác thực và phân quyền.
- `backend/src/common/interceptors/logging.interceptor.ts`: mask dữ liệu nhạy cảm.
- `frontend/lib/api.ts`: refresh interceptor và xử lý token hết hạn.
- `frontend/lib/auth.ts`: thay đổi cách quản lý phiên nếu backend chuyển refresh token sang cookie.
- `.env.example`, `backend/.env.example`, tài liệu triển khai: biến môi trường và secret policy.
- Prisma schema/migration: chỉ thay đổi nếu lưu refresh session hoặc mã hóa dữ liệu trong database.

## 6. Tiêu chí nghiệm thu

- Production không còn gọi API bằng HTTP.
- API không có access token hợp lệ trả `401`.
- API đúng đăng nhập nhưng sai quyền trả `403`.
- Người dùng không thể đọc hoặc sửa dữ liệu ngoài phạm vi của mình.
- Token hết hạn được refresh đúng một lần; refresh thất bại thì đăng xuất.
- CORS chỉ chấp nhận domain được cấu hình.
- Login và endpoint nhạy cảm bị giới hạn tốc độ.
- Log và response lỗi không làm lộ secret, password, token hoặc stack trace.
- Nếu có mã hóa database, key không nằm cùng database và dữ liệu có thể khôi phục sau restart.

## 7. Rủi ro và cách giảm thiểu

- Đổi cách lưu token có thể làm hỏng đăng nhập hiện tại: triển khai staging và có migration/rollback.
- Bật CORS chặt có thể làm frontend không gọi được API: kiểm thử toàn bộ domain trước khi production.
- JWT ngắn hạn có thể làm người dùng bị đăng xuất: triển khai refresh token.
- Mã hóa database có thể ảnh hưởng tìm kiếm và hiệu năng: chỉ mã hóa field thật sự cần thiết.
- Sai cấu hình TLS có thể làm OAuth callback lỗi: cập nhật đồng thời frontend URL, backend URL và Google callback.

## 8. Kết quả rà soát bổ sung — bắt buộc đưa vào phạm vi

### 8.1. Không để token trong URL

Hiện luồng Google callback chuyển `accessToken` và thông tin user qua query string rồi frontend lưu vào `localStorage`. URL có thể xuất hiện trong browser history, proxy log, analytics hoặc referrer.

Hiện token bài thi cũng được đưa vào đường dẫn frontend và truyền ở nhiều API dưới dạng `:token`. Đây là bearer credential, nếu lộ có thể cho phép truy cập phiên thi.

Phương án chuẩn:

- Google callback tạo phiên server-side và set cookie `HttpOnly`, hoặc trả về mã dùng một lần có thời hạn vài chục giây.
- Không đưa access token, refresh token, attempt token hoặc thông tin user vào query string.
- Chuyển attempt token sang header/cookie; nếu vẫn phải tương thích tạm thời với route cũ thì phải xóa token khỏi URL ngay sau khi đọc và bổ sung log/referrer policy.
- Token phải có thời hạn, trạng thái revoke và được ràng buộc với user/attempt.

### 8.2. Thiếu cơ chế bảo vệ mặc định cho endpoint mới

Backend hiện dùng guard ở từng controller. Cách này dễ tạo endpoint công khai ngoài ý muốn khi developer thêm controller mới.

Phương án chuẩn:

- Đăng ký JWT guard global.
- Tạo decorator `@Public()` cho các endpoint công khai được duyệt.
- Danh sách public ban đầu chỉ gồm login, Google OAuth callback và contact nếu nghiệp vụ yêu cầu.
- Contact phải có rate limit, giới hạn body, chống spam và không được xem là API nội bộ.

### 8.3. Ngăn lộ password hash và dữ liệu nội bộ

Một số truy vấn sinh viên/giảng viên đang `include: { user: true }`. Dù là hash bcrypt, password hash vẫn là dữ liệu bí mật và không được trả về client.

Phải thực hiện:

- Tạo select/DTO response dùng chung, loại bỏ `password`, session token, secret và trường nội bộ.
- Rà soát mọi `include: { user: true }`, response của auth, users, students, teachers và các endpoint quản trị.
- Viết test khẳng định response không chứa `password`, `JWT_SECRET`, API key hoặc credential.

### 8.4. File upload và file tĩnh

- `uploads` đang được expose bằng `express.static`, nên URL file có thể truy cập trực tiếp nếu biết đường dẫn.
- Essay upload chưa có giới hạn Multer ở interceptor; kiểm tra kích thước trong service là quá muộn vì file đã được đưa vào memory.
- Chỉ kiểm tra MIME/đuôi file là chưa đủ cho mọi định dạng.

Phải thực hiện:

- Di chuyển file nhạy cảm sang private storage.
- Tạo endpoint download/stream có JWT, role và kiểm tra quyền sở hữu; hoặc dùng signed URL thời hạn ngắn.
- Đặt giới hạn số file, kích thước request và kích thước từng loại file ngay tại Multer.
- Kiểm tra magic bytes/content type; đổi tên bằng UUID và không dùng tên gốc làm đường dẫn.
- Không cho phép SVG tùy ý nếu chưa sanitize bằng allowlist chặt; ưu tiên loại bỏ SVG.
- Xóa file vật lý khi bản ghi bị xóa hoặc khi transaction lưu metadata thất bại.
- Đặt `Content-Disposition`, `X-Content-Type-Options: nosniff` và `Content-Security-Policy` phù hợp khi trả file.

### 8.5. XSS từ nội dung HTML câu hỏi

Frontend có nhiều vị trí render `dangerouslySetInnerHTML`. Backend hiện có lọc chuỗi đơn giản nhưng chưa phải HTML sanitizer đầy đủ.

Phải thực hiện:

- Dùng allowlist sanitizer ở backend và frontend cho các thẻ/thuộc tính được phép.
- Chặn script, event handler, `javascript:`, iframe không được phép, CSS nguy hiểm và URL ngoài allowlist.
- Không cho nội dung upload SVG hoặc HTML tùy ý chạy trong origin chính.
- Thêm test XSS với payload trong câu hỏi, đáp án, ghi chú và file metadata.

### 8.6. CSRF và mô hình cookie

Nếu chuyển refresh token sang cookie, phải triển khai đồng thời:

- `SameSite=Lax` hoặc `Strict` theo mô hình domain; `Secure` ở production.
- CSRF token hoặc double-submit token cho request thay đổi dữ liệu nếu cookie được gửi cross-site.
- Kiểm tra `Origin`/`Referer` ở các mutation quan trọng.
- Không dùng `credentials: true` với CORS wildcard.

### 8.7. Giới hạn request và chống DoS

- JSON global đang cho phép body tới 25 MB; phải chuyển sang giới hạn theo route.
- Thêm timeout, giới hạn độ sâu/độ dài mảng và giới hạn số bản ghi cho import, AI, answer batch và proctoring events.
- Rate limit riêng cho login, Google OAuth, contact, upload, AI và thao tác bắt đầu/nộp bài.
- Giới hạn kích thước header, URL và request timeout ở reverse proxy.

### 8.8. Cache và dữ liệu nhạy cảm trên frontend

Axios đang cache mọi GET trong memory theo URL/params. Cần loại trừ profile, đề thi, đáp án, bài làm, điểm, incident và dữ liệu cá nhân khỏi cache; hoặc đưa user/session fingerprint vào cache key và đặt TTL bằng 0 cho nhóm nhạy cảm.

Khi logout, đổi user, hết phiên hoặc đổi role phải xóa toàn bộ cache. Response nhạy cảm nên có `Cache-Control: no-store`.

### 8.9. Dependency và chuỗi cung ứng

Kết quả `npm audit --omit=dev` của backend hiện có 13 cảnh báo: 1 critical, 5 high và 7 moderate. Đáng chú ý là chuỗi `tar`, `multer`, `xlsx`, Nest/Express và lodash.

Trước khi bật production:

- Cập nhật Nest/Express/Multer tới bản vá tương thích, sau đó chạy lại build và test.
- Đánh giá thay thế `xlsx@0.18.5` hoặc cô lập việc đọc spreadsheet trong worker/container giới hạn quyền.
- Khóa dependency bằng lockfile, chạy audit trong CI và chặn release khi có critical/high chưa được chấp nhận rủi ro.
- Không dùng `npm audit fix --force` trực tiếp trên nhánh chính vì có thể kéo major version và phá API.

### 8.10. Secret, database và backup

- Dùng secret manager cho JWT key, Google secret, AI key, SMTP password và encryption key.
- Không dùng chung secret giữa môi trường; có quy trình rotate và thu hồi.
- Bật TLS cho kết nối database nếu database ở máy chủ khác.
- Mã hóa backup database và giới hạn người được đọc backup.
- Kiểm tra các file log/backups hiện có trước khi đưa repository hoặc artifact lên production.
- Nếu mã hóa dữ liệu database, phải có key version, rotate key, backup/restore test và kế hoạch mất key.

### 8.11. Audit, giám sát và kiểm thử xâm nhập

- Ghi audit cho login thất bại/thành công, refresh/logout, đổi mật khẩu, xem/phát hành đề, xem đáp án, sửa điểm, tải file và thay đổi cấu hình bảo mật.
- Không ghi credential hoặc nội dung bài làm vào audit/log.
- Thêm correlation/request ID, metric 401/403/429/5xx và cảnh báo đăng nhập thất bại bất thường.
- Kiểm thử theo OWASP API Top 10: BOLA/IDOR, broken authentication, excessive data exposure, unrestricted resource consumption, SSRF và security misconfiguration.
- Kiểm thử khôi phục sau rotate key, revoke token, mất storage và rollback migration.

## 9. Điều kiện trước khi bắt đầu coding một lượt

1. Chốt production chạy sau reverse proxy TLS hay Node tự terminate TLS.
2. Chốt dùng cookie HttpOnly cho refresh token và cơ chế CSRF tương ứng.
3. Chốt attempt token có được phép thay đổi contract API hay cần compatibility period.
4. Chốt file đề thi/bài làm là private hoàn toàn hay có signed URL.
5. Chốt có mã hóa field trong database ở phiên bản đầu hay chỉ triển khai HTTPS và access control.
6. Chốt xử lý dependency vulnerability nào bắt buộc trước release.

Mặc định khuyến nghị: reverse proxy terminate TLS, access token ngắn hạn, refresh token HttpOnly, attempt token không nằm trong URL, file private, không mã hóa toàn bộ JSON, và chỉ mã hóa database sau khi xác định rõ field cùng yêu cầu khôi phục.

## 10. Trạng thái triển khai

Đã triển khai trong workspace:

- JWT guard global và decorator `@Public()`; các endpoint mới mặc định cần xác thực.
- Access token ngắn hạn, refresh token opaque được hash trong bảng `auth_sessions`, rotation/revoke/logout và cookie HttpOnly.
- Google OAuth không còn truyền access token/user qua query string.
- CORS allowlist, security headers, request ID, rate limit cơ bản và lỗi 5xx không lộ nội dung nội bộ.
- Redact response/log credential; loại password hash khỏi các truy vấn user/student/teacher nhạy cảm.
- Attempt token dùng `X-Exam-Attempt-Token`; URL frontend chỉ còn attempt id.
- File upload có giới hạn, kiểm tra signature cơ bản và file URL có chữ ký HMAC thời hạn ngắn.
- HTML rich content được lọc nguy hiểm ở backend/frontend; SVG bị loại khỏi media upload.
- Frontend không còn lưu access token trong localStorage; cache loại trừ dữ liệu nhạy cảm và tự refresh phiên.
- Thay `xlsx` bằng `exceljs`, thay `bcrypt` native bằng `bcryptjs`, override Multer/Lodash và khóa lockfile.
- Migration `20260811090000_add_auth_sessions` đã áp dụng cho PostgreSQL local.

Đã kiểm chứng:

- Backend build thành công.
- Frontend build thành công, chỉ còn các warning hiệu năng/lint đã có từ trước.
- 16 test suites, 48 tests backend đều pass.
- Login → refresh cookie → profile hoạt động; profile không chứa `password`.
- Logout làm refresh token bị từ chối.
- File unsigned bị trả `401`, signed file hợp lệ trả `200`.
- CORS chỉ trả allow-origin cho frontend được cấu hình.
- `npm audit --omit=dev --audit-level=high` không còn high/critical; còn 9 moderate phụ thuộc chủ yếu vào Nest/Express/ExcelJS và cần xử lý khi nâng major tương thích.

Việc còn phụ thuộc môi trường production: cài TLS ở reverse proxy, đặt `COOKIE_SECURE=true`, cấu hình `CORS_ORIGINS`/`FRONTEND_URL` bằng HTTPS, tạo `FILE_SIGNING_SECRET` riêng và chạy `prisma migrate deploy` trong pipeline.
