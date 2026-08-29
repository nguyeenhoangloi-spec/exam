# HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG QUẢN LÝ KHẢO THÍ (EXAM MANAGEMENT SYSTEM)

Tất cả các tệp kịch bản cài đặt, khởi chạy và triển khai đã được gom gọn gàng trong thư mục:
📁 **`deploy/`**

---

## 🖥️ 1. YÊU CẦU HỆ THỐNG

### Phần cứng tối thiểu:
* **CPU**: 2 Cores trở lên (khuyến nghị 4 Cores cho phòng thi đông).
* **RAM**: 4GB trở lên (khuyến nghị 8GB cho môi trường Production).
* **Ổ cứng**: Còn trống tối thiểu 5GB.

### Phần mềm yêu cầu:
* **Cách 1: Triển khai qua Docker (Khuyến nghị)**:
  * Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (bật WSL2 engine).
  * Linux: Docker Engine (v24+) & Docker Compose Plugin (`sudo apt install docker-compose-plugin`).
* **Cách 2: Triển khai trực tiếp (Native)**:
  * [Node.js](https://nodejs.org/) phiên bản LTS (v18.x hoặc v20.x).
  * [PostgreSQL](https://www.postgresql.org/) phiên bản 14 trở lên.
  * npm (đi kèm sẵn với Node.js).

---

## 🪟 2. HƯỚNG DẪN CÀI ĐẶT TRÊN WINDOWS

Tất cả các file script cho Windows nằm tại: **`deploy\windows\`**

### 🌟 Phương án 1: 1-Click All-in-One App Launcher (Khuyến nghị - Nhanh nhất)
Chỉ cần chạy đúng **1 file duy nhất**:
👉 **`deploy\windows\exam-management-app.bat`**

File này sẽ:
1. Tự động kiểm tra nếu chưa build thì tự cài đặt & build luôn.
2. Khởi động Backend (3001) và Frontend (3000).
3. **Tự động mở cửa sổ Ứng dụng Desktop Độc lập (App Mode)** không có thanh địa chỉ, giao diện chuẩn native app như một phần mềm máy tính thực thụ!

---

### Phương án 2: Dùng Docker Compose (1-Click Docker)
1. Mở **Docker Desktop** trên Windows.
2. Chạy file: **`deploy\windows\exam-management-docker-run.bat`** (hoặc mở Command Prompt gõ `npm run docker:up`).
3. Truy cập hệ thống tại: [http://localhost:3000](http://localhost:3000).
4. Để dừng hệ thống: Chạy **`deploy\windows\exam-management-docker-down.bat`** (hoặc gõ `npm run docker:down`).

---

### Phương án 3: Cài đặt & Khởi chạy Từng bước (Thủ công)
1. **Cài đặt & Build**: Chạy file `deploy\windows\exam-management-install.bat`.
2. **Khởi chạy hệ thống**: Chạy file `deploy\windows\exam-management-start.bat`.


---

## 🐧 3. HƯỚNG DẪN CÀI ĐẶT TRÊN LINUX (UBUNTU / DEBIAN / CENTOS / WSL)

Tất cả các file script cho Linux nằm tại: **`deploy/linux/`**

### Cấp quyền thực thi cho các file script (Chỉ cần làm lần đầu):
```bash
chmod +x deploy/linux/*.sh deploy/linux/systemd/*.sh
```

---

### 🌟 Phương án 1: 1-Click All-in-One App Launcher (Khuyến nghị)
Chỉ cần chạy đúng **1 lệnh duy nhất**:
```bash
./deploy/linux/exam-management-app.sh
```
Script sẽ tự động build (nếu chưa build), bật backend, frontend và mở ngay cửa sổ ứng dụng Web/App!

---

### Phương án 2: Dùng Docker Compose
1. Chạy file script khởi động:
   ```bash
   ./deploy/linux/exam-management-docker-run.sh
   # hoặc: npm run docker:up
   ```
2. Xem log hoạt động theo thời gian thực:
   ```bash
   docker compose logs -f
   ```
3. Dừng hệ thống:
   ```bash
   ./deploy/linux/exam-management-docker-down.sh
   # hoặc: npm run docker:down
   ```

---

### Phương án B: Cài đặt trực tiếp (Native)
1. Đảm bảo dịch vụ PostgreSQL đang chạy:
   ```bash
   sudo systemctl status postgresql
   ```
2. Chạy script cài đặt tự động:
   ```bash
   ./deploy/linux/exam-management-install.sh
   ```
3. Khởi chạy hệ thống:
   ```bash
   ./deploy/linux/exam-management-start.sh
   ```

---

### Phương án C: Chạy dạng Dịch vụ Hệ thống (Systemd Service - Auto-start on Boot)
Dành cho Server Production chuyên dụng, tự động bật hệ thống khi máy chủ khởi động và tự phục hồi khi có sự cố:
1. Chạy script cài đặt Systemd với quyền root/sudo:
   ```bash
   sudo ./deploy/linux/systemd/install-services.sh
   ```
2. Quản lý dịch vụ:
   * Kiểm tra trạng thái Backend: `systemctl status exam-management-backend`
   * Kiểm tra trạng thái Frontend: `systemctl status exam-management-frontend`
   * Xem log Backend: `journalctl -u exam-management-backend -f`
   * Xem log Frontend: `journalctl -u exam-management-frontend -f`
   * Khởi động lại: `sudo systemctl restart exam-management-backend exam-management-frontend`

---

## 💻 4. XUẤT FILE CÀI ĐẶT NATIVE DESKTOP APP (.EXE & .APPIMAGE)

Nếu bạn muốn tạo file cài đặt phần mềm độc lập để phân phối cho người dùng cài vào máy tính như Microsoft Word / Excel:

### 🪟 Trên Windows (Tạo file .EXE):
1. Chạy file: **`deploy\windows\exam-management-build-exe.bat`** (hoặc gõ `npm run desktop:build:exe`).
2. Kết quả xuất ra tại thư mục **`release-app/`**:
   * **`ExamManagement-Setup-1.0.0.exe`**: File Setup cài đặt chính thức (tự tạo Icon ngoài Desktop và Start Menu).
   * **`release-app\win-unpacked\Exam Management System.exe`**: Bản chạy ngay độc lập.

### 🐧 Trên Linux (Tạo file .AppImage & .deb):
1. Chạy file: **`./deploy/linux/exam-management-build-appimage.sh`** (hoặc gõ `npm run desktop:build:linux`).
2. Kết quả xuất ra tại **`release-app/`**:
   * **`ExamManagement-1.0.0.AppImage`**: File thực thi chạy ngay trên mọi Linux distro.
   * **`ExamManagement-1.0.0.deb`**: Gói cài đặt Debian/Ubuntu.

---

## 📦 5. ĐÓNG GÓI PHÂN PHỐI WEB SERVER (RELEASE BUNDLE)

Để tạo gói phân phối Web Server hoàn chỉnh:
1. Chạy lệnh: `npm run package:release`
2. Thư mục **`dist-package/`** sẽ được tạo chứa toàn bộ mã nguồn đã build, thư mục `deploy/` và hướng dẫn cài đặt.

---

## ⚙️ 6. CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

| Tên biến | Giá trị mặc định | Giải thích |
| :--- | :--- | :--- |
| `PORT` | `3001` | Cổng hoạt động của Backend API |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/exam?schema=public` | Chuỗi kết nối PostgreSQL |
| `JWT_SECRET` | chuỗi ngẫu nhiên | Khóa bí mật ký JWT Token phiên làm việc |
| `JWT_EXPIRES_IN` | `15m` | Thời gian hết hạn Access Token |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | `30` | Thời gian hết hạn Refresh Token |
| `CORS_ORIGINS` | `http://localhost:3000` | Danh sách domain được phép gọi API (phân tách bằng dấu phẩy) |
| `FRONTEND_URL` | `http://localhost:3000` | Địa chỉ Web Frontend |
| `FILE_SIGNING_SECRET` | chuỗi bí mật | Chữ ký số bảo mật cho link tải file đề thi & tài liệu |
| `BACKUP_LOCAL_ROOT` | `backup-runtime/primary` | Thư mục lưu trữ sao lưu dữ liệu cục bộ |

---

## 🔧 6. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

1. **Cổng 3000 hoặc 3001 đã bị chiếm dụng (Port already in use)**:
   * Windows: Mở Command Prompt (Admin) và kiểm tra: `netstat -ano | findstr :3000`, sau đó tắt tiến trình bằng `taskkill /PID <PID> /F`.
   * Linux: `sudo fuser -k 3000/tcp` và `sudo fuser -k 3001/tcp`.
2. **Lỗi kết nối Cơ sở dữ liệu (Can't reach database server)**:
   * Kiểm tra dịch vụ PostgreSQL đang chạy.
   * Kiểm tra thông tin username/password trong file `.env` đã khớp với PostgreSQL chưa.
3. **Lỗi quyền thực thi script trên Linux (`Permission denied`)**:
   * Chạy: `chmod +x deploy/linux/*.sh deploy/linux/systemd/*.sh`
