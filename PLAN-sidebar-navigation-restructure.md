# PLAN-sidebar-navigation-restructure.md - Tái cấu trúc Sidebar 6 Nhóm Danh mục

> **Mục tiêu**: Đóng gói và tái cấu trúc giao diện điều hướng [Sidebar.tsx](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/Sidebar.tsx) thành 6 nhóm chức năng chuẩn hóa.

---

## 📌 Phân bố 6 Nhóm Chức năng

### 1. Tổng quan
- `Tổng quan`: `/dashboard` (Icon: `LayoutDashboard`)

### 2. Tổ chức kỳ thi (`TỔ CHỨC KỲ THI`)
- `Quản lý Kỳ thi`: `/exam-periods` (Icon: `CalendarDays`)
- `Quản lý Lịch thi`: `/exam-schedules` (Icon: `CalendarCheck`)
- `Quản lý Phòng thi`: `/exam-rooms` (Icon: `Building2`)
- `Xếp phòng thi`: `/exam-arrangement` (Icon: `Users`)
- `Phân công Giám thị`: `/exam-supervisors` (Icon: `ShieldCheck`)
- *(Riêng Giảng viên: Lịch coi thi cá nhân `/teacher/assignments`)*

### 3. Ngân hàng & Đề thi (`NGÂN HÀNG & ĐỀ THI`)
- `Ngân hàng câu hỏi`: `/question-bank` (Icon: `HelpCircle`)
- `Quản lý Đề thi`: `/exam-papers` (Icon: `FileText`)

### 4. Chấm thi & Kết quả (`CHẤM THI & KẾT QUẢ`)
- `Chấm bài Tự luận`: `/teacher/essay-grading` (Icon: `FileCheck`)
- `Duyệt bài Tự luận`: `/admin/essay-review` (Icon: `ShieldCheck`)
- `Xử lý Phúc khảo`: `/teacher/regrade` (Icon: `FileCheck`)
- `Báo cáo Điểm thi`: `/exam-reports` (Icon: `BarChart3`)

### 5. Danh mục (`DANH MỤC`)
- `Quản lý Khoa`: `/departments` (Icon: `Building2`)
- `Quản lý Lớp học`: `/classes` (Icon: `School`)
- `Quản lý Môn học`: `/subjects` (Icon: `BookOpen`)
- `Quản lý Giảng viên`: `/teachers` (Icon: `GraduationCap`)
- `Quản lý Sinh viên`: `/students` (Icon: `Users`)

### 6. Hệ thống (`HỆ THỐNG`)
- `Sao lưu & Khôi phục`: `/admin/backups` (Icon: `DatabaseBackup`)
- `Thùng rác hệ thống`: `/trash` (Icon: `Trash2`)

---

## 🛠️ Trạng thái Sẵn sàng Thực thi
Kế hoạch đã được phỏng vấn qua `/grill-me` và ghi nhận đầy đủ yêu cầu.
File kế hoạch triển khai: [implementation_plan.md](file:///C:/Users/loiho/.gemini/antigravity-ide/brain/cf1a164d-d8e1-454b-a6ef-78ddece41911/implementation_plan.md)
