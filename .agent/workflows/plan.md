---
description: Nghiên cứu, rà soát, phân tích và lập kế hoạch triển khai (SCAN → ANALYZE → PLAN → STOP) - Không viết code.
---

# /plan - Quy trình Nghiên cứu & Lập Kế hoạch Triển khai (Zero-Code)

Workflow này định hướng cho Agent thực hiện nghiên cứu, rà soát, phân tích và lập kế hoạch chi tiết trước khi tiến hành chỉnh sửa dự án trên Antigravity IDE.

---

## 🚫 QUY TẮC TỐI CAO: ZERO-CODE

**KHÔNG được viết, sửa, tạo hoặc xóa bất kỳ dòng code nào ở giai đoạn này.**

Nhiệm vụ hiện tại chỉ là **nghiên cứu, rà soát, phân tích và lập kế hoạch triển khai**.

Phải chủ động kiểm tra toàn bộ phạm vi liên quan trong project, không chỉ file đang mở hoặc một vài page dễ thấy.

---

## 🔄 QUY TRÌNH BẮT BUỘC

Thực hiện liên tục theo chu trình:

**SCAN → ANALYZE → PLAN → STOP**

---

### 1. 🔍 SCAN

Rà soát toàn bộ các file, thư mục, page, route, layout, component, shared component, UI primitive, style, token, state và các phần được tái sử dụng có liên quan trong project.

---

### 2. 📊 ANALYZE

Xác định rõ:

* Hiện trạng đang được triển khai như thế nào.
* Những vị trí nào đã đúng.
* Những vị trí nào chưa đúng hoặc chưa đồng nhất.
* Nguyên nhân nằm ở page riêng hay shared component.
* Các dependency và phạm vi ảnh hưởng.
* Những rủi ro có thể phát sinh nếu chỉnh sửa.
* Những phần cần giữ nguyên.
* Có thể chuẩn hóa ở nguồn dùng chung hay không.

---

### 3. 📝 PLAN

Lập kế hoạch triển khai chi tiết, bao gồm:

* File dự kiến cần sửa.
* File dự kiến tạo mới nếu thực sự cần.
* Shared component/token/style nào nên chỉnh trước.
* Đối chiếu quy chuẩn UI với [ui-design-system-rules.md](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/ui-design-system-rules.md):
  - Hệ thống màu chữ 5 Tầng Cool Slate (`.text-main`, `.text-sub`, `.text-helper`, `.text-placeholder`, `.text-inverse`) & Giới hạn màu nhạt `text-slate-400`.
  - Quy tắc sử dụng màu sắc & 5 nhóm trạng thái Semantic (Nền siêu nhạt & Chữ đậm: Trung tính `#F1F5F9`/`#334155`, Info `#EFF6FF`/`#1D4ED8`, Warning `#FFFBEB`/`#B45309`, Success `#F0FDF4`/`#15803D`, Danger `#FEF2F2`/`#B91C1C`).
  - Phân loại NÊN DÙNG Badge (Kỳ thi, Câu hỏi, Đề thi, Lịch thi, Sao lưu, Tài khoản, Phúc khảo, Kết quả) vs KHÔNG DÙNG Badge (Mã KT-1/SV, Tên khoa/môn, Điểm/Ngày, Nút bấm, Mô tả).
  - Thang cỡ chữ 8 tầng (12px ➔ 32px) kèm Line-Height chuẩn 24px/15px cho tiếng Việt.
  - Phân định chiều cao nút: Primary CTA 44px (`lg`), Toolbar/Filter 40px (`md`), Nút phụ 36px (`sm`), Mobile tối thiểu 44px.
  - Phân cấp 5 Bậc Nút Bấm: Bậc 1: Primary CTA (duy nhất 1 nút chính `bg-blue-600 text-white`); Bậc 2: Soft Accent (`variant="soft"`, `bg-blue-100 text-blue-700`, hover/active `bg-blue-200 text-blue-800`, **không viền**, **không icon**, cho tính năng tự động/AI); Bậc 3: Secondary (`bg-white border-slate-200/90 text-slate-800` cho bộ lọc/thao tác); Bậc 4: Ghost (`bg-transparent text-slate-600` cho Đóng/Hủy); Bậc 5: Danger (`bg-danger-600` hoặc viền đỏ, tách riêng sang trái).
  - Bo góc: `rounded-xl` (12px) cho Nút hành động, Input, Control. Ngoại lệ: Filter Chip / Capsule Tab lọc & `SlidingSegmentedControl` có khung rãnh ngoài `rounded-2xl` (16px) đệm `p-1`, chỉ có viên trượt active và các nút chọn bên trong là `rounded-full` (dạng viên thuốc Capsule); Submenu/Badge nhỏ/Tooltip dùng `rounded-lg` (8px).
  - Quy tắc chỉ 1 nút Primary trong cùng 1 nhóm thao tác/vùng chức năng.
  - Quy tắc hạn chế gradient (chỉ dùng cho Login, Vùng thương hiệu, Active Tab Sidebar).
* Thứ tự triển khai.
* Phạm vi ảnh hưởng.
* Cách kiểm tra sau mỗi bước.
* Cách chạy type-check, lint, build hoặc test nếu có.
* Tiêu chí xác nhận hoàn thành.

**Lưu ý**: Không được lập kế hoạch chung chung. Phải dựa trên codebase thực tế đã rà soát.

---

### 4. 🛑 STOP

Sau khi hoàn thành nghiên cứu và lập kế hoạch:

**DỪNG LẠI. KHÔNG TRIỂN KHAI CODE.**

Chỉ được bắt đầu chỉnh sửa khi người dùng xác nhận bằng một lệnh rõ ràng như:

* `Triển khai`
* `Bắt đầu thực hiện`
* `Code theo kế hoạch`
* `Thực hiện kế hoạch`

---

## ⚠️ XỬ LÝ PHẦN CHƯA THỂ XÁC MINH

Nếu phát hiện phần nào không thể kiểm tra, phải nêu rõ trong báo cáo kế hoạch:

* File/thư mục nào.
* Không xác minh được điều gì.
* Lý do.
* Ảnh hưởng tới kế hoạch.

**Tuyệt đối không được tự suy đoán rồi đưa vào kế hoạch như thể đã được xác minh.**
