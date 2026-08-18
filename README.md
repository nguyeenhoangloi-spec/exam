npm run dev
# Hệ Thống Quản Lý Khảo Thí Sinh Viên (Exam Management System)

Dự án full-stack hoàn chỉnh phục vụ quản lý nghiệp vụ khảo thí nhà trường / khoa / viện:
- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma ORM, JWT Authentication & Role Guards.
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS.

---

## 📁 Cấu trúc thư mục dự án

```
exam-management/
├── backend/                  # NestJS API Backend
│   ├── prisma/               # Schema & Seed script
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/                  # Mã nguồn NestJS Modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── subjects/
│   │   ├── departments/
│   │   ├── classes/
│   │   ├── exam-periods/
│   │   ├── exam-schedules/
│   │   ├── exam-rooms/
│   │   ├── exam-arrangement/
│   │   ├── exam-supervisors/
│   │   ├── questions/
│   │   ├── exam-papers/
│   │   ├── prisma/
│   │   ├── common/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env.example
│
└── frontend/                 # Next.js App Router Frontend
    ├── app/
    │   ├── login/
    │   ├── dashboard/
    │   ├── students/
    │   ├── teachers/
    │   ├── subjects/
    │   ├── exam-periods/
    │   ├── exam-schedules/
    │   ├── exam-rooms/
    │   ├── exam-arrangement/
    │   ├── exam-supervisors/
    │   ├── question-bank/
    │   ├── exam-papers/
    │   ├── student/exam-schedule/
    │   ├── student/results/
    │   └── teacher/assignments/
    ├── components/
    ├── lib/
    ├── types/
    ├── package.json
    └── .env.example
```

---

## 🔐 Tài khoản dùng thử mặc định (Demo Accounts)

Hệ thống đã có file seed mẫu tạo sẵn các tài khoản:

> Chỉ dùng các tài khoản và mật khẩu dưới đây trong môi trường phát triển. Không chạy seed demo hoặc giữ mật khẩu mặc định ở production. Quy tắc bảo vệ dữ liệu thi được mô tả tại [docs/SECURITY-EXAM-DATA.md](docs/SECURITY-EXAM-DATA.md).

| Vai trò (Role) | Username | Password | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin` | `admin123` | Quản lý danh mục, xếp phòng thi tự động, phân công giám thị, duyệt câu hỏi, rút đề thi. |
| **Giảng viên (TEACHER)** | `teacher1` | `123456` | Xem lịch coi thi cá nhân, tạo câu hỏi trắc nghiệm vào ngân hàng câu hỏi. |
| **Giảng viên (TEACHER)** | `teacher2` | `123456` | Xem lịch coi thi cá nhân, tạo câu hỏi trắc nghiệm. |
| **Sinh viên (STUDENT)** | `student1` | `123456` | Xem lịch thi cá nhân (Phòng thi, SBD, Số ghế) & Tra cứu Kết quả thi (`/student/results`). |
| **Sinh viên (STUDENT)** | `student2` | `123456` | Xem lịch thi cá nhân & Kết quả thi. |

---

## 🚀 Hướng dẫn cài đặt và chạy Dự án

### Yêu cầu tiên quyết:
- **Node.js**: v18.0.0 trở lên.
- **Database**: PostgreSQL đang chạy tại `localhost:5432` (Database tên: `exam_db`).

---

### Bước 1: Khởi tạo Backend (NestJS + Prisma)

1. Mở Terminal và di chuyển vào thư mục backend:
   ```bash
   cd exam-management/backend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
   - Tạo file `.env` từ `.env.example`:
     ```env
     PORT=3001
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exam_db?schema=public"
     JWT_SECRET="replace-with-a-long-random-secret"
     JWT_EXPIRES_IN="7d"
     ```

4. Đồng bộ Database Schema và Sinh dữ liệu Mẫu (Seed):
   ```bash
   npx prisma db push
   npm run seed
   ```

5. Khởi động Backend API Server (Chạy ở cổng `3001`):
   ```bash
   npm run start:dev
   ```

---

### Bước 2: Khởi tạo Frontend (Next.js 14)

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd exam-management/frontend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
   - Tạo file `.env.local` từ `.env.example`:
     ```env
     NEXT_PUBLIC_API_URL="http://localhost:3001"
     ```

4. Khởi động Frontend Dev Server (Chạy ở cổng `3000`):
   ```bash
   npm run dev
   ```

5. Truy cập trình duyệt Web tại: `http://localhost:3000`

---

## 🌟 Tóm tắt các tính năng chính

1. **Xếp phòng thi tự động (`/exam-arrangement`)**:
   - Chọn kỳ thi & lịch thi -> Chọn danh sách phòng thi -> Hệ thống tự động phân bổ sinh viên đủ điều kiện, cấp Số báo danh (`SBD0001`...) và Số ghế (`1, 2, 3...`), đồng thời kiểm tra chống trùng lịch thi.
2. **Phân công Giám thị coi thi (`/exam-supervisors`)**:
   - Phân công giảng viên vào phòng thi với kiểm tra ràng buộc không quá 2 giám thị/phòng và chống trùng lịch coi thi của giảng viên.
3. **Ngân hàng câu hỏi & Duyệt câu hỏi (`/question-bank`)**:
   - Thêm câu hỏi trắc nghiệm 4 lựa chọn (A/B/C/D), hỗ trợ phân loại môn học, chương, độ khó, kèm quy trình phê duyệt (`PENDING` -> `APPROVED`).
4. **Tạo đề thi ngẫu nhiên (`/exam-papers`)**:
   - Sinh đề thi tự động dựa trên số lượng câu hỏi Dễ, Trung bình, Khó từ ngân hàng câu hỏi đã duyệt.
5. **Cổng tra cứu Sinh viên (`/student/exam-schedule` & `/student/results`) & Giảng viên (`/teacher/assignments`)**:
   - Sinh viên tra cứu phòng thi, số báo danh, số ghế và tra cứu **Kết quả thi môn học (`/student/results`)** kèm điểm số, phân rã Trắc nghiệm / Tự luận, nhãn trạng thái inline và gửi yêu cầu phúc khảo.
   - Giảng viên tra cứu ca coi thi và phòng phân công.
