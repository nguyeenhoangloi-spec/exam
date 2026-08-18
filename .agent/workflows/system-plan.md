---
description: Nghiên cứu, rà soát, phân tích và lập kế hoạch triển khai (SCAN → ANALYZE → PLAN → STOP) - Không viết code.
---

# /system-plan - Quy trình Nghiên cứu & Lập Kế hoạch Triển khai (Zero-Code)

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
* Đối chiếu quy chuẩn UI với [ui-design-system-rules.md](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/ui-design-system-rules.md) (đặc biệt là Hệ thống màu chữ 5 Tầng Cool Slate `.text-main`, `.text-sub`, `.text-helper`, `.text-placeholder`, `.text-inverse` và Thang cỡ chữ 8 tầng kèm Line-Height chuẩn 24px/15px cho tiếng Việt).
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
