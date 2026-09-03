# 03. SỔ TAY XỬ LÝ SỰ CỐ KHẨN CẤP DÀNH CHO KỸ SƯ HỆ THỐNG (IT RUNBOOK)

Tài liệu này là cẩm nang phản ứng nhanh (**Incident Response Runbook**) dành cho đội ngũ Quản trị IT / DevOps khi hệ thống gặp trục trặc trong quá trình tổ chức kỳ thi.

---

## 🚨 1. Sự Cố 1: Backend API Bị Crash Hoặc Thoát Đột Ngột

### Hiện tượng:
Frontend báo lỗi *"Network Error"* hoặc *"502 Bad Gateway"*. Terminal hoặc Docker báo backend dừng với exit code 1.

### Quy trình chẩn đoán & Khắc phục:
1. **Kiểm tra nhật ký lỗi tức thời**:
   ```bash
   # Nếu chạy Docker:
   docker compose logs --tail=100 backend

   # Nếu chạy PM2:
   pm2 logs exam-backend
   ```
2. **Các nguyên nhân phổ biến**:
   - **Tràn bộ nhớ RAM (Out of Memory - OOM)**: Do hàng trăm sinh viên cùng nộp bài tự luận chứa ảnh dung lượng lớn trong cùng một giây.
     - *Giải pháp*: Tăng giới hạn RAM cho tiến trình Node.js bằng cờ:
       `NODE_OPTIONS="--max-old-space-size=4096" npm run start:prod`
   - **Thiếu biến môi trường hoặc sai cấu hình JWT**: Kiểm tra xem file `backend/.env` có bị xóa nhầm hoặc thiếu `JWT_SECRET` hay không.
3. **Khởi động lại dịch vụ ngay lập tức**:
   ```bash
   docker compose restart backend
   ```

---

## 🐘 2. Sự Cố 2: Lỗi Kết Nối Cơ Sở Dữ Liệu PostgreSQL (Prisma P1001)

### Hiện tượng:
Log backend xuất hiện lỗi: `PrismaClientInitializationError: Can't reach database server at 'db:5432'`.

### Quy trình chẩn đoán & Khắc phục:
1. **Kiểm tra tiến trình PostgreSQL**:
   ```bash
   docker ps | grep postgres
   ```
   Nếu container bị tắt, kiểm tra nguyên nhân sập máy:
   ```bash
   docker compose logs db
   ```
2. **Tràn số lượng kết nối tối đa (`Too many connections`)**:
   - Mặc định PostgreSQL chỉ cho phép 100 kết nối đồng thời. Trong kỳ thi lớn, hàng chục tiến trình backend có thể làm cạn kiệt Connection Pool.
   - *Khắc phục*: Tăng `max_connections` trong file cấu hình PostgreSQL hoặc khởi chạy lại container với tham số:
     `command: postgres -c max_connections=300 -c shared_buffers=512MB`
   - Điều chỉnh chuỗi kết nối Prisma trong `.env`:
     `DATABASE_URL="postgresql://user:pass@db:5432/exam?schema=public&connection_limit=50"`

---

## ⚡ 3. Sự Cố 3: Quá Tải Đột Biến Đầu Giờ Thi (Traffic Spike)

### Hiện tượng:
Vào đúng thời điểm 07:30 (khi giám thị đọc mật khẩu đề thi), 1.000 đến 2.000 sinh viên cùng nhấn F5 hoặc bấm nút "Bắt đầu làm bài", khiến CPU máy chủ chạm ngưỡng 100%, trang web phản hồi chậm.

### Các biện pháp giải tỏa tắc nghẽn khẩn cấp:
1. **Bật bộ đệm tĩnh (Static Caching) trên Nginx**:
   - Đảm bảo toàn bộ tài nguyên CSS, JS, hình ảnh được Nginx lưu cache trực tiếp trên RAM, không đẩy request về Node.js.
2. **Kỹ thuật Mở ca thi So le (Staggered Schedule)**:
   - Phòng Khảo thí nên cấu hình thời gian bắt đầu làm bài của các Khoa lệch nhau từ 5 đến 10 phút (Ví dụ: Khoa CNTT thi lúc 07:30, Khoa Kinh tế thi lúc 07:40). Biện pháp này triệt tiêu hoàn toàn đỉnh nhọn quá tải (Traffic Spike) mà không cần tốn thêm chi phí nâng cấp phần cứng máy chủ.

---

## 💾 4. Sự Cố 4: Khôi Phục Dữ Liệu Khẩn Cấp Bằng Lệnh Dòng Lệnh (CLI Restore)

Nếu giao diện web bị lỗi hoàn toàn và không thể truy cập vào trang `/admin/backups`, Kỹ sư IT có thể khôi phục database trực tiếp bằng công cụ `psql`:

```bash
# Bước 1: Xác định file sao lưu gần nhất trong thư mục database-backups/
ls -lh database-backups/

# Bước 2: Bơm dữ liệu từ file backup vào PostgreSQL (Áp dụng cho Docker):
docker exec -i exam-postgres-db psql -U postgres -d exam < database-backups/backup-2026-09-02-02-00-00.sql

# Bước 3: Khởi động lại backend để nhận dữ liệu mới:
docker compose restart backend
```

---

## ✅ 5. Bảng Kiểm Tra Sẵn Sàng Trước Giờ Thi (Pre-Flight Checklist)

Đội ngũ kỹ thuật IT phải hoàn thành kiểm tra 6 mục này tối thiểu **30 phút trước mỗi ca thi**:

- [ ] **1. Dung lượng ổ cứng**: Kiểm tra ổ cứng máy chủ còn trống tối thiểu **20GB** (`df -h`).
- [ ] **2. Sao lưu CSDL**: Đã có bản backup sạch sẽ của CSDL được tạo trong vòng 24 giờ qua.
- [ ] **3. Kết nối mạng phòng máy**: Đảm bảo toàn bộ switch mạng, dây cáp mạng và máy trạm tại các phòng LAB thông suốt tới máy chủ.
- [ ] **4. Kiểm tra tài khoản Quản trị**: Đăng nhập thử vào trang Admin, kiểm tra đồng hồ máy chủ đã được đồng bộ chuẩn giờ internet qua NTP.
- [ ] **5. Mở cổng Firewall**: Đảm bảo các cổng `80`, `443`, `3000`, `3001` không bị tường lửa Windows Defender hoặc iptables chặn ngoài ý muốn.
- [ ] **6. Cán bộ thường trực**: Tối thiểu 2 kỹ sư kỹ thuật túc trực tại phòng điều khiển máy chủ trong suốt thời gian diễn ra ca thi để kịp thời ứng cứu khi có sự cố.
