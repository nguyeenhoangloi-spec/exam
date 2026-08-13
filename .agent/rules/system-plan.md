---
trigger: on_demand
description: Quy tắc Nghiên cứu, Phân tích và Lập Kế hoạch Triển khai (SCAN → ANALYZE → PLAN → STOP)
---

# SYSTEM-PLAN.MD - Antigravity Planning Protocol (Zero-Code)

Mọi yêu cầu lập kế hoạch, khảo sát hoặc chuẩn bị refactor phải tuân thủ nghiêm ngặt quy trình dưới đây.

---

## 🚫 QUY TẮC TỐI CAO

**KHÔNG được viết, sửa, tạo hoặc xóa bất kỳ dòng code nào ở giai đoạn này.**

Nhiệm vụ hiện tại chỉ là **nghiên cứu, rà soát, phân tích và lập kế hoạch triển khai**.

---

## 🔄 QUY TRÌNH THỰC HIỆN

1. **SCAN**: Rà soát toàn bộ phạm vi liên quan (files, components, routes, shared components, styles, states).
2. **ANALYZE**: Phân tích hiện trạng, lỗi đồng nhất, rủi ro, nguyên nhân (shared component vs local page) và khả năng tái sử dụng.
3. **PLAN**: Lập kế hoạch thực tế, chi tiết file sửa/tạo mới, thứ tự triển khai, kiểm thử và tiêu chuẩn hoàn thành.
4. **STOP**: Dừng lại. Chờ lệnh xác nhận rõ ràng từ người dùng (`Triển khai`, `Bắt đầu thực hiện`, `Code theo kế hoạch`) mới được chỉnh sửa code.

---

## ⚠️ NÊU RÕ ĐIỂM CHƯA THỂ XÁC MINH

Nếu có file/thư mục/luồng không thể kiểm tra, phải nêu rõ lý do và ảnh hưởng. Không tự suy đoán.
