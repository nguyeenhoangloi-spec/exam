# Hệ Thống Quản Lý Khảo Thí Sinh Viên (Exam Management System)

Dự án full-stack hoàn chỉnh phục vụ quản lý nghiệp vụ khảo thí toàn diện cho nhà trường, khoa, viện:
- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma ORM, JWT Authentication & RBAC Guards.
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, GPU-accelerated 60 FPS Motion Engine (`MOTION.md`).
- **Khảo thí Trực tuyến & AI**: Giám sát phòng thi thời gian thực (Realtime Proctoring), Chấm thi tự luận tự động kết hợp AI (Gemini / DeepSeek) & Ma trận đề thi động.

---

## 🏗️ Sơ đồ Kiến trúc Hệ thống (System Architecture & Code Graph)

```mermaid
graph TB
    subgraph ClientLayer["🖥️ LỚP GIAO DIỆN (Next.js 14 App Router)"]
        AdminUI["👑 Cổng Quản trị viên (Admin)<br/>/dashboard, /exam-*, /admin/*"]
        TeacherUI["👨‍🏫 Cổng Giảng viên (Teacher)<br/>/teacher/proctor, /teacher/essay-grading, /teacher/assignments"]
        StudentUI["🎓 Cổng Sinh viên (Student)<br/>/student/online-exam, /student/exam-schedule, /student/results"]
        SharedUI["🎨 Design System & Primitives<br/>Modal, Drawer, Toast, StatusBadge, Button, 60fps Motion"]
    end

    subgraph APILayer["⚡ LỚP DỊCH VỤ BACKEND (NestJS API Gateway)"]
        AuthModule["🔐 Auth & Security Guard<br/>JWT, RolesGuard, MaintenanceGuard"]
        AcademicModule["📚 Quản lý Đào tạo<br/>Students, Teachers, Classes, Subjects, Departments"]
        ExamScheduleModule["📅 Khảo thí & Tổ chức Thi<br/>ExamPeriods, ExamSchedules, ExamRooms, Arrangement, Supervisors"]
        QuestionPaperModule["📝 Ngân hàng Đề & Câu hỏi<br/>Questions, Rubrics, ExamPapers (Matrix Auto Gen)"]
        ProctorOnlineModule["🛡️ Thi Trực tuyến & Giám sát<br/>OnlineExams, Proctoring (Realtime Event/WS), Anti-Cheat"]
        GradingAppealModule["📊 Chấm thi & Phúc khảo<br/>EssayGrading, GradeAppeals, Practice, ExamReports"]
        SystemModule["⚙️ Quản trị & Tiện ích<br/>AuditLogs, Backups Worker, AI Provider, Trash"]
    end

    subgraph DataLayer["💾 LỚP LƯU TRỮ & TÁC VỤ NỀN"]
        PrismaORM["💎 Prisma ORM Client"]
        PostgresDB[("🐘 PostgreSQL Database<br/>(schema.prisma)")]
        AIProvider["🤖 AI Engine (Gemini / DeepSeek)<br/>Tự động chấm tự luận & gợi ý"]
        BackupWorker["📦 Backup Background Worker<br/>Sao lưu dữ liệu định kỳ"]
    end

    ClientLayer -->|REST API / JSON| APILayer
    AdminUI --> SharedUI
    TeacherUI --> SharedUI
    StudentUI --> SharedUI

    APILayer --> PrismaORM
    PrismaORM --> PostgresDB
    GradingAppealModule --> AIProvider
    SystemModule --> BackupWorker
    BackupWorker --> PostgresDB
```

---

## 📁 Cấu trúc Thư mục Chi tiết Toàn Dự án (Code Tree)

```
exam-management/
├── backend/                             # NestJS API Backend Server
│   ├── prisma/                          # Database Schema & Seed Data
│   │   ├── schema.prisma                # Định nghĩa toàn bộ Models & Relations
│   │   └── seed.ts                      # Script khởi tạo dữ liệu mẫu
│   ├── src/                             # 28 NestJS Core Modules
│   │   ├── ai/                          # Dịch vụ tích hợp AI (Gemini / DeepSeek chấm tự luận)
│   │   ├── audit/                       # Ghi nhận và truy vết nhật ký hệ thống (Audit Logs)
│   │   ├── auth/                        # Xác thực JWT, đăng nhập, bảo vệ mật khẩu
│   │   ├── backups/                     # Sao lưu, phục hồi CSDL & worker chạy nền
│   │   ├── classes/                     # Quản lý lớp học sinh viên
│   │   ├── common/                      # Guards (Roles, Maintenance), Decorators, DTOs
│   │   ├── contact/                     # Xử lý thông tin phản hồi & liên hệ
│   │   ├── dashboard/                   # Thống kê tổng quan & KPIs quản trị
│   │   ├── departments/                 # Quản lý khoa / viện đào tạo
│   │   ├── essay/                       # Nghiệp vụ câu hỏi tự luận & tiêu chí Rubric
│   │   ├── exam-arrangement/           # Thuật toán xếp phòng thi, cấp SBD & số ghế tự động
│   │   ├── exam-papers/                 # Sinh đề thi ma trận động (Dễ / TB / Khó)
│   │   ├── exam-periods/                # Quản lý các đợt thi, kỳ thi học kỳ
│   │   ├── exam-reports/                # Báo cáo thống kê điểm số & phân tích bài thi
│   │   ├── exam-rooms/                  # Quản lý danh mục phòng thi vật lý & máy tính
│   │   ├── exam-schedules/              # Lịch thi môn học & kiểm tra chống trùng ca thi
│   │   ├── exam-supervisors/            # Phân công cán bộ coi thi & kiểm tra trùng lịch
│   │   ├── grade-appeals/               # Tiếp nhận & thẩm định đơn phúc khảo điểm thi
│   │   ├── online-exams/                # Động cơ thi trực tuyến, nộp bài & tính điểm
│   │   ├── practice/                    # Luyện tập trắc nghiệm tự do cho sinh viên
│   │   ├── prisma/                      # PrismaService kết nối cơ sở dữ liệu
│   │   ├── proctor/                     # Giám sát phòng thi trực tuyến & can thiệp ca thi
│   │   ├── questions/                   # Ngân hàng câu hỏi trắc nghiệm & duyệt câu hỏi
│   │   ├── students/                    # Quản lý hồ sơ & danh sách sinh viên
│   │   ├── subjects/                    # Quản lý môn học, số tín chỉ & học phần
│   │   ├── teachers/                    # Quản lý hồ sơ & danh sách giảng viên
│   │   ├── trash/                       # Thùng rác phục hồi / xóa vĩnh viễn dữ liệu
│   │   ├── users/                       # Quản lý tài khoản & phân quyền người dùng
│   │   ├── app.module.ts                # Root Module tích hợp toàn bộ hệ thống
│   │   └── main.ts                      # Điểm khởi động NestJS API Server (Port 3001)
│   ├── package.json
│   └── .env.example
│
└── frontend/                            # Next.js 14 App Router Frontend (Port 3000)
    ├── app/                             # 37 Static & Dynamic Routes
    │   ├── admin/
    │   │   ├── activity-logs/           # Nhật ký hoạt động & Metadata Inspector Drawer
    │   │   ├── backups/                 # Quản lý sao lưu dữ liệu & Backup Detail Drawer
    │   │   ├── essay-review/            # Quản trị duyệt điểm thi tự luận
    │   │   └── grade-appeals/           # Quản trị xét duyệt phúc khảo
    │   ├── change-password/             # Màn hình đổi mật khẩu cá nhân
    │   ├── classes/                     # Quản lý danh sách lớp học
    │   ├── contact/                     # Trang liên hệ hỗ trợ kỹ thuật
    │   ├── dashboard/                   # Bảng điều khiển quản trị trung tâm & KPIs
    │   ├── departments/                 # Quản lý khoa / viện
    │   ├── exam-arrangement/           # Giao diện xếp phòng thi tự động
    │   ├── exam-papers/                 # Quản lý đề thi & Ma trận rút đề
    │   ├── exam-periods/                # Quản lý kỳ thi học kỳ
    │   ├── exam-reports/                # Báo cáo kết quả & Xem lại bài làm chi tiết
    │   ├── exam-rooms/                  # Quản lý phòng thi
    │   ├── exam-schedules/              # Quản lý lịch thi môn học
    │   ├── exam-supervisors/            # Phân công giám thị coi thi
    │   ├── forgot-password/             # Khôi phục mật khẩu tài khoản
    │   ├── login/                       # Đăng nhập hệ thống phân quyền
    │   ├── profile/                     # Thông tin tài khoản cá nhân
    │   ├── question-bank/               # Ngân hàng câu hỏi, Rubric & Import Wizard
    │   ├── reports/                     # Tổng hợp báo cáo số liệu
    │   ├── settings/                    # Cài đặt cấu hình hệ thống
    │   ├── student/
    │   │   ├── curriculum/              # Tra cứu khung chương trình đào tạo
    │   │   ├── exam-schedule/           # Tra cứu lịch thi cá nhân (SBD, phòng, ghế)
    │   │   ├── online-exam/[id]/lobby/  # Phòng chờ thi trực tuyến & kiểm tra thiết bị
    │   │   ├── online-exam/[id]/take/   # Màn hình làm bài thi trực tuyến & Anti-cheat
    │   │   ├── online-exam/[id]/result/ # Kết quả bài thi trực tuyến
    │   │   └── results/                 # Tra cứu bảng điểm tổng hợp & nộp phúc khảo
    │   ├── students/                    # Quản lý hồ sơ sinh viên
    │   ├── subjects/                    # Quản lý môn học
    │   ├── teacher/
    │   │   ├── assignments/             # Lịch phân công coi thi của giảng viên
    │   │   ├── essay-grading/           # Màn hình chấm bài tự luận theo Rubric
    │   │   ├── proctor/[scheduleRoomId] # Bàn điều khiển giám sát phòng thi thời gian thực
    │   │   └── regrade/                 # Thẩm định đơn phúc khảo bài thi
    │   ├── teachers/                    # Quản lý danh sách giảng viên
    │   ├── trash/                       # Thùng rác dữ liệu hệ thống
    │   ├── globals.css                  # CSS Variables, Deep Ink Tokens & 60fps Keyframes
    │   └── layout.tsx                   # Root Layout, Inter font stack & Theme Provider
    ├── components/                      # UI Design System & Specialized Components
    │   ├── ui/                          # Button, Input, FilterSelect, SortDropdown, TabBar...
    │   ├── common/                      # StatusBadge, ActionDropdownPortal...
    │   ├── Modal.tsx                    # Modal Tạo mới / Sửa dùng chung (z-100, Out-Expo)
    │   ├── ConfirmModal.tsx             # Hộp thoại xác nhận thao tác (z-9999)
    │   ├── CriticalConfirmModal.tsx     # Hộp thoại bảo mật nhiều lớp (z-9999)
    │   ├── SearchModal.tsx              # Quick Search Palette (z-100)
    │   ├── Toast.tsx                    # Thông báo nổi góc màn hình (z-110, 4s countdown)
    │   ├── ProfileDrawer.tsx            # Drawer chi tiết hồ sơ (z-100)
    │   ├── Sidebar.tsx & Header.tsx     # Thanh điều hướng chuẩn responsive
    │   └── [modules]/                   # Components chuyên biệt theo từng nghiệp vụ
    ├── lib/                             # API Client, Export (Excel, DOCX, Print), Formatters
    ├── scripts/                         # Kịch bản kiểm định tự động (audit-ui, audit-artifact)
    ├── types/                           # TypeScript Interfaces & Model Types
    ├── package.json
    └── .env.example
```

---

## 🔐 Tài khoản dùng thử mặc định (Demo Accounts)

Hệ thống đã có file seed mẫu tạo sẵn các tài khoản:

> Chỉ dùng các tài khoản và mật khẩu dưới đây trong môi trường phát triển. Không chạy seed demo hoặc giữ mật khẩu mặc định ở production.

| Vai trò (Role) | Username | Password | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin` | `admin123` | Toàn quyền quản trị danh mục, xếp phòng thi, duyệt câu hỏi, sinh ma trận đề thi, sao lưu. |
| **Giảng viên (TEACHER)** | `teacher1` | `123456` | Giám sát phòng thi trực tuyến (`/teacher/proctor`), chấm thi tự luận theo Rubric, xem lịch gác thi. |
| **Giảng viên (TEACHER)** | `teacher2` | `123456` | Soạn thảo câu hỏi trắc nghiệm/tự luận, thẩm định phúc khảo điểm thi. |
| **Sinh viên (STUDENT)** | `student1` | `123456` | Tham gia thi trực tuyến (`/student/online-exam`), tra cứu lịch thi cá nhân (SBD, phòng, ghế), tra cứu bảng điểm & nộp đơn phúc khảo. |
| **Sinh viên (STUDENT)** | `student2` | `123456` | Tra cứu lịch thi, kết quả học tập & khung chương trình đào tạo. |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Dự án

### Yêu cầu tiên quyết:
- **Node.js**: v18.0.0 trở lên.
- **Database**: PostgreSQL đang chạy tại `localhost:5432` (Tên CSDL: `exam_db`).

---

## 🚀 Cài Đặt & Khởi Chạy Nhanh Đa Nền Tảng (1-Click Install & Run)

Tất cả các script triển khai và cài đặt được gom gọn gàng trong thư mục **`deploy/`**:

### 🪟 Dành cho Windows (`deploy/windows/`):
* **🌟 1-Click Mở App Trực Tiếp (Nhanh nhất)**: Click đúp file `deploy\windows\exam-management-app.bat` (tự động build, bật server và mở ngay cửa sổ App Desktop độc lập!).
* **Dùng Docker (Khuyến nghị)**: Click đúp file `deploy\windows\exam-management-docker-run.bat` (hoặc chạy `npm run docker:up`).
* **Cài đặt trực tiếp (Native)**: Click đúp file `deploy\windows\exam-management-install.bat` rồi click `deploy\windows\exam-management-start.bat`.

### 🐧 Dành cho Linux (`deploy/linux/` - Ubuntu / Debian / CentOS / Server):
* **🌟 1-Click Mở App Trực Tiếp**: Chạy `./deploy/linux/exam-management-app.sh`
* **Dùng Docker (Khuyến nghị)**: Chạy `./deploy/linux/exam-management-docker-run.sh` (hoặc `npm run docker:up`).
* **Cài đặt trực tiếp (Native)**: Chạy `./deploy/linux/exam-management-install.sh` rồi `./deploy/linux/exam-management-start.sh`.
* **Dịch vụ tự khởi động khi boot (Systemd)**: `sudo ./deploy/linux/systemd/install-services.sh`.

📖 Xem tài liệu hướng dẫn triển khai chi tiết tại: [docs/HUONG-DAN-CAI-DAT-WINDOWS-LINUX.md](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/docs/HUONG-DAN-CAI-DAT-WINDOWS-LINUX.md)

---

### Bước 1: Khởi tạo Backend (NestJS + Prisma thủ công)

1. Mở Terminal và di chuyển vào thư mục backend:
   ```bash
   cd exam-management/backend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường trong file `.env`:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exam_db?schema=public"
   JWT_SECRET="replace-with-a-long-random-secret"
   JWT_EXPIRES_IN="7d"
   ```

4. Đồng bộ Schema CSDL & Nạp dữ liệu mẫu (Seed):
   ```bash
   npx prisma db push
   npm run seed
   ```

5. Khởi động Backend API Server (Cổng `3001`):
   ```bash
   npm run start  
   ```

---

### Bước 2: Khởi tạo Frontend (Next.js 14)

1. Mở cửa sổ Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd exam-management/frontend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường trong file `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

4. Khởi động Frontend Dev Server (Cổng `3000`):
   ```bash
   npm run dev
   ```

5. Mở trình duyệt Web tại: `http://localhost:3000`

---

## 🌟 Bộ Quy chuẩn Kỹ thuật & Kiểm định Chất lượng

Hệ thống được thiết kế và kiểm soát theo các quy chuẩn khắt khe nhất:
- **Motion & Micro-interactions**: 100% chuyển động đạt 60 FPS GPU-accelerated với Out-Expo `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Hệ màu Deep Ink**: Màu chữ tương phản cao `#020617` (light) / `#F8FAFC` (dark), bảo đảm đạt chuẩn **WCAG AA** cho môi trường thi cử học thuật.
- **Phân cấp 5 Bậc Nút Bấm**: Duy nhất 1 Primary CTA trong mỗi nhóm chức năng, nút Soft Accent cho tác vụ tự động/AI, nút Ghost cho Đóng/Hủy.
- **Kiểm định Tự động**:
  - `npm run audit:ui` (Frontend): Kiểm tra chuẩn hóa 100% token giao diện.
  - `npm run audit:ui:artifact` (Frontend): Kiểm tra CSS bundle sau biên dịch.
  - `npm run test` (Backend): Toàn bộ 29 Test Suites (98 Tests) tự động.
