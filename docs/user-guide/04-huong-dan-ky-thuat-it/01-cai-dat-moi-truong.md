# 01. SỔ TAY CÀI ĐẶT & CẤU HÌNH MÔI TRƯỜNG VẬN HÀNH (DEV / PRODUCTION)

Tài liệu này dành riêng cho Kỹ sư IT, Quản trị viên hệ thống (DevOps / SysAdmin) để cài đặt, cấu hình và khởi chạy hệ thống khảo thí trên máy chủ Windows hoặc Linux (Ubuntu/Debian/RHEL).

---

## 💻 1. Yêu Cầu Phần Cứng & Phần Mềm Nền Tảng

### Yêu cầu phần cứng khuyến nghị:
* **Môi trường Phát triển (Dev / Testing)**: CPU 4 Cores, RAM tối thiểu 8GB, Ổ cứng SSD còn trống tối thiểu 20GB.
* **Môi trường Vận hành Chính thức (Production - Cho 1.000+ thí sinh đồng thời)**:
  - CPU: 8 đến 16 Cores (Intel Xeon / AMD EPYC).
  - RAM: 16GB đến 32GB RAM.
  - Ổ cứng: NVMe SSD 100GB+ (Tốc độ đọc/ghi cao phục vụ ghi Audit Log và Database I/O).
  - Băng thông mạng: Tối thiểu 1 Gbps.

### Yêu cầu phần mềm bắt buộc:
1. **Node.js**: Phiên bản LTS ổn định **v18.x** hoặc **v20.x** (Khuyến nghị Node.js 20.12+ LTS).
2. **NPM**: Phiên bản 9.x hoặc 10.x (kèm theo Node.js).
3. **Cơ sở dữ liệu**: **PostgreSQL** phiên bản 15 hoặc 16.
4. **Git**: Phiên bản mới nhất.

---

## ⚙️ 2. Cấu Hình Biến Môi Trường (.env)

Hệ thống tách biệt rõ ràng biến môi trường giữa Backend và Frontend:

### A. Cấu hình Backend (`backend/.env`):
Sao chép từ file mẫu `backend/.env.example`:
```bash
cd backend
cp .env.example .env
```
Các tham số quan trọng cần thiết lập trong `backend/.env`:
```ini
# Cổng dịch vụ API Backend
PORT=3001

# Chuỗi kết nối Cơ sở Dữ liệu PostgreSQL
DATABASE_URL="postgresql://postgres:MatKhauManh123@localhost:5432/exam_management_db?schema=public"

# Khóa bí mật mã hóa JWT (Bắt buộc dùng chuỗi ngẫu nhiên tối thiểu 32 ký tự)
JWT_SECRET="super-secret-jwt-key-for-exam-production-2026"
JWT_EXPIRES_IN="7d"

# Cấu hình AI Provider chấm thi tự luận (Gemini hoặc DeepSeek)
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere..."

# Cấu hình thư mục lưu trữ bản sao lưu CSDL
BACKUP_STORAGE_DIR="./database-backups"
```

### B. Cấu hình Frontend (`frontend/.env.local`):
```ini
# Địa chỉ API Gateway backend mà trình duyệt gọi tới
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 🚀 3. Hướng Dẫn Cài Đặt & Khởi Chạy Từng Bước

Tại thư mục gốc của dự án (`exam-management/`):

### Bước 1: Cài đặt toàn bộ thư viện phụ thuộc (Dependencies)
```bash
npm run install:all
```
*Lệnh này sẽ tự động cài đặt `node_modules` cho cả thư mục `backend` và `frontend`.*

### Bước 2: Khởi tạo Cơ sở dữ liệu & Seed dữ liệu mẫu ban đầu
```bash
# Tạo cấu trúc bảng từ schema.prisma vào PostgreSQL
npm run db:migrate

# Bơm dữ liệu mẫu (Khoa, Lớp, Môn học, Tài khoản Admin, GV, SV)
npm run seed
```

### Bước 3: Khởi chạy Môi trường Phát triển (Development Mode)
```bash
npm run dev
```
*Lệnh này dùng `concurrently` để chạy song song:*
- **Backend API**: `http://localhost:3001`
- **Frontend Web UI**: `http://localhost:3000`

---

## 🏭 4. Đóng Gói & Chạy Môi Trường Vận Hành (Production Mode)

Khi đưa lên máy chủ chính thức của trường:

```bash
# 1. Sinh Prisma Client và Biên dịch toàn bộ mã nguồn
npm run build:all

# 2. Khởi chạy ở chế độ Production tối ưu hiệu năng
npm run start
```

> [!TIP]
> Trên môi trường Production Linux, khuyến nghị sử dụng công cụ quản lý tiến trình **PM2** (`pm2 start npm --name "exam-backend" -- run start:prod --prefix backend`) để tự động khởi động lại ứng dụng nếu gặp sự cố sập nguồn hoặc crash bộ nhớ.
