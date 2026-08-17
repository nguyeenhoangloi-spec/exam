# Kế hoạch kiểm thử chịu tải xác thực

## Mục tiêu

Đo khả năng xử lý của luồng `login → profile → refresh → logout` khi có nhiều tài khoản đăng nhập đồng thời, đồng thời phát hiện giới hạn CPU, PostgreSQL, session và rate limit.

## Phạm vi

- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/refresh`
- `POST /auth/logout`
- Cookie `exam_refresh_token` và access token
- Cấu hình rate limit trong `backend/src/main.ts`

Không thay đổi API, database, RBAC, permission hoặc nghiệp vụ.

## Chuẩn bị

1. Chỉ chạy trên local hoặc staging có database kiểm thử riêng.
2. Tạo tài khoản kiểm thử cho Admin, Giảng viên và Sinh viên.
3. Lưu danh sách tài khoản ngoài repository, ví dụ:

```json
[
  { "username": "load_admin_01", "password": "<test-only-password>", "role": "ADMIN" }
]
```

4. Không ghi password, access token hoặc cookie vào log.
5. Ghi nhận CPU, RAM, phiên bản Node.js, PostgreSQL và giới hạn connection pool trước mỗi lần chạy.
6. Capacity test cần chạy ở môi trường không bị rate limit IP làm sai số; security test phải chạy riêng để xác nhận `429`.

## Kịch bản

### Baseline

Chạy 1, 5 và 10 VU trong 5 phút để lấy p50/p95/p99 và throughput nền.

### Ramp

Chạy lần lượt 25, 50, 100 và 250 VU; mỗi mức 5–10 phút. Chỉ tăng mức tiếp theo khi không có connection pool exhaustion hoặc lỗi 5xx tăng bất thường.

### Spike

Tăng từ 0 lên 100 VU trong 10–30 giây, lặp lại 3 lần để mô phỏng thời điểm mở cổng thi.

### Soak

Duy trì 50–100 VU trong 30–60 phút để phát hiện rò rỉ bộ nhớ, tăng session và suy giảm hiệu năng theo thời gian.

### Security/rate limit

Chạy riêng các request đăng nhập sai và vượt ngưỡng production. Kết quả mong đợi là `401` cho thông tin sai và `429` khi vượt giới hạn, không trộn với capacity test.

## Công cụ

Runner dùng Node.js built-in `fetch`, không yêu cầu cài package mới:

```text
backend/load-tests/auth-load.mjs
```

Ví dụ chạy smoke test:

```text
node backend/load-tests/auth-load.mjs --users-file C:\secure\exam-load-users.json --scenario login-once --vus 10 --duration 30s
```

Ví dụ chạy auth-cycle trên staging sau khi xác nhận an toàn:

```text
node backend/load-tests/auth-load.mjs --users-file C:\secure\exam-load-users.json --base-url https://staging.example.test --allow-production --allow-high-load --scenario auth-cycle --vus 100 --duration 5m
```

## Chỉ số và ngưỡng đề xuất

- Tỷ lệ login hợp lệ thành công tối thiểu 99,5%.
- Lỗi 5xx dưới 0,5%.
- P95 login khoảng 1–2 giây trên staging; cần hiệu chỉnh theo baseline phần cứng.
- Không cạn connection pool PostgreSQL.
- Không có refresh loop hoặc session tạo trùng bất thường.
- Sau spike, p95 quay về gần baseline trong 2–5 phút.

## Phân tích bottleneck

- CPU cao: kiểm tra thời gian bcrypt và giới hạn worker/process.
- Database cao: kiểm tra ghi `authSession`, index, pool và lock.
- Nhiều 429: tách capacity test khỏi rate-limit test hoặc phân bổ IP test hợp lệ.
- Refresh 401 bất thường: kiểm tra race condition do xoay vòng session.
- RAM tăng liên tục: kiểm tra session chưa dọn, log và object giữ trong process.

## Tiêu chí hoàn tất

1. Có kết quả baseline, ramp, spike, soak và security/rate limit.
2. Có bảng p50/p95/p99, throughput, status và tài nguyên backend/database.
3. Mọi lỗi được tái hiện bằng cùng kịch bản trước và sau khi sửa.
4. Không có password/token/cookie trong artifact hoặc log.
5. Không chạy trên production thật nếu chưa có phê duyệt riêng.
