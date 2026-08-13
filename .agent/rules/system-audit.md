---
trigger: on_demand
description: Quy tắc Rà soát và Triển khai Chỉnh sửa Toàn bộ Project trong Antigravity
---

# SYSTEM-AUDIT.MD - Antigravity Full System Audit & Refactoring Rules

Mọi quy trình rà soát toàn bộ dự án hoặc chuẩn hóa hệ thống phải tuân thủ nghiêm ngặt các quy tắc dưới đây.

---

## 🚨 NGUYÊN TẮC LÀM VIỆC BẮT BUỘC

Không được chỉ sửa file đang mở hoặc các file dễ nhìn thấy.

Phải chủ động đọc và kiểm tra toàn bộ phạm vi liên quan trong project, bao gồm:

* Tất cả thư mục.
* Tất cả file source có liên quan.
* Page / Route.
* Layout.
* Component.
* Shared component.
* UI component.
* Modal / Dialog / Popup.
* Form / Input / Select / Search / Filter.
* Table / List / Card.
* Sidebar / Header.
* Loading / Empty / Error state.
* Hover / Focus / Active / Disabled state.
* Responsive state.
* Dark mode.
* Các component được import hoặc tái sử dụng gián tiếp.
* Các class/style nằm trong CSS, Tailwind config, globals.css hoặc design token.
* Các phần ít sử dụng, ẩn hoặc chỉ xuất hiện trong một trạng thái đặc biệt.

---

## 🎯 CÁCH TRIỂN KHAI

Không sửa từng page một cách rời rạc nếu cùng một vấn đề có thể được xử lý ở:

* Shared component.
* UI primitive.
* Design token.
* Global style.
* Component dùng chung.

Luôn ưu tiên sửa tại **nguồn gốc chung** để toàn hệ thống tự đồng bộ.

Sau khi sửa nguồn dùng chung, phải tiếp tục kiểm tra tất cả nơi đang sử dụng component đó để đảm bảo không phát sinh lỗi hiển thị hoặc thay đổi ngoài mong muốn.

---

## 🔄 QUY TRÌNH BẮT BUỘC

Thực hiện liên tục theo chu trình:

**SCAN → ANALYZE → EDIT → VERIFY → RESCAN**

Cụ thể:

1. **SCAN**: Tìm toàn bộ vị trí có liên quan trong project.
2. **ANALYZE**: Xác định vị trí đúng/sai, quy tắc vi phạm, component nguồn và phạm vi ảnh hưởng.
3. **EDIT**: Thực hiện chỉnh sửa đúng phạm vi.
4. **VERIFY**: Kiểm tra lại UI, TypeScript, import, build, responsive, dark mode và component phụ thuộc.
5. **RESCAN**: Tìm lại toàn project để kiểm tra xem còn trường hợp cũ hoặc không đồng nhất hay không.

Lặp lại chu trình **ANALYZE → EDIT → VERIFY → RESCAN** cho đến khi đạt chuẩn hoàn toàn.

---

## 🚫 KHÔNG ĐƯỢC GIẢ ĐỊNH

Không được tự kết luận rằng toàn hệ thống đã đúng chỉ vì:
* Một vài page đã đúng.
* Component mẫu đã đúng.
* Build thành công.
* Không còn lỗi ở file đang mở.
* Search đầu tiên không thấy thêm kết quả.

---

## 🛡️ GIỮ NGUYÊN NGHIỆP VỤ

Nếu yêu cầu chỉ liên quan đến UI/design thì **TUYỆT ĐỐI KHÔNG** thay đổi:
* API contract, Database schema, Prisma schema.
* Route, Permission / RBAC, Authentication.
* Business logic, Validation nghiệp vụ, Dữ liệu và Luồng đang hoạt động.

---

## 🆕 KHÔNG ĐƯỢC BỎ SÓT DO FILE ĐƯỢC TẠO SAU

Mọi component, helper, style, page hoặc state mới tạo ra trong quá trình làm việc đều phải được đưa vào lần **RESCAN** cuối cùng.

---

## 🏁 ĐIỀU KIỆN ĐƯỢC PHÉP BÁO “HOÀN THÀNH”

Chỉ báo **HOÀN THÀNH** khi đã rà soát toàn bộ phạm vi, không còn vi phạm, verified TypeScript/build/lint và các nơi sử dụng component chung.

Nếu có phần không thể kiểm tra, phải liệt kê chính xác: **File/thư mục/chức năng nào**, **không kiểm tra được gì**, **lý do** và **ảnh hưởng có thể có**.
