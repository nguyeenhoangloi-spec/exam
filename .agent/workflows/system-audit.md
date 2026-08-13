---
description: Rà soát và triển khai chỉnh sửa toàn bộ project trong Antigravity theo các quy tắc đã được xác định trước đó.
---

# /system-audit - Quy trình Rà soát & Triển khai Chỉnh sửa Toàn bộ Project

Workflow này định hướng cho Agent thực hiện rà soát toàn bộ dự án và triển khai chỉnh sửa nhất quán trên Antigravity IDE.

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

1. **SCAN**
   Tìm toàn bộ vị trí có liên quan trong project.

2. **ANALYZE**
   Xác định:
   * Vị trí nào đang đúng.
   * Vị trí nào đang sai.
   * Quy tắc nào đang bị vi phạm.
   * Có component dùng chung nào gây ra vấn đề hay không.
   * Thay đổi có thể ảnh hưởng đến đâu.

3. **EDIT**
   Thực hiện chỉnh sửa đúng phạm vi.

4. **VERIFY**
   Kiểm tra lại:
   * UI.
   * TypeScript.
   * Import.
   * Build.
   * Responsive.
   * Dark mode.
   * Các component phụ thuộc.

5. **RESCAN**
   Tìm lại toàn project để kiểm tra xem còn trường hợp cũ hoặc trường hợp không đồng nhất nào hay không.

Nếu vẫn còn kết quả không đúng chuẩn thì tiếp tục:

**ANALYZE → EDIT → VERIFY → RESCAN**

Không dừng sau một lần sửa.

---

## 🚫 KHÔNG ĐƯỢC GIẢ ĐỊNH

Không được tự kết luận rằng toàn hệ thống đã đúng chỉ vì:

* Một vài page đã đúng.
* Component mẫu đã đúng.
* Build thành công.
* Không còn lỗi ở file đang mở.
* Search đầu tiên không thấy thêm kết quả.

Phải xác minh bằng cách rà soát lại project sau chỉnh sửa.

---

## 🛡️ GIỮ NGUYÊN NGHIỆP VỤ

Nếu yêu cầu hiện tại chỉ liên quan đến UI/design thì:

**TUYỆT ĐỐI KHÔNG thay đổi:**

* API contract.
* Database schema.
* Prisma schema.
* Route.
* Permission / RBAC.
* Authentication.
* Business logic.
* Validation nghiệp vụ.
* Dữ liệu.
* Luồng chức năng đang hoạt động.

Nếu cần sửa một phần ngoài UI để xử lý lỗi phát sinh trực tiếp từ thay đổi hiện tại, phải kiểm tra kỹ ảnh hưởng trước khi thực hiện.

---

## 🆕 KHÔNG ĐƯỢC BỎ SÓT DO FILE ĐƯỢC TẠO SAU

Nếu trong quá trình triển khai:

* Tạo component mới.
* Tách component.
* Tạo helper mới.
* Tạo style mới.
* Tạo page/state mới.

thì những phần mới này cũng phải được đưa vào lần **RESCAN** cuối cùng và chịu cùng toàn bộ quy tắc.

---

## ✅ KIỂM TRA TRƯỚC KHI KẾT THÚC

Trước khi báo hoàn thành, phải thực hiện tối thiểu:

* Search toàn project các pattern cũ hoặc class vi phạm.
* Kiểm tra các shared component đã chỉnh sửa.
* Kiểm tra các nơi import/sử dụng component đó.
* Kiểm tra TypeScript/type error.
* Kiểm tra lint nếu project hỗ trợ.
* Chạy build nếu môi trường cho phép.
* Kiểm tra responsive ở các breakpoint liên quan.
* Kiểm tra dark mode nếu component hỗ trợ.
* Kiểm tra loading / empty / error / disabled state liên quan.
* Kiểm tra không làm thay đổi chức năng hiện có.

Nếu build/lint/test không thể chạy, không được giả định rằng chúng thành công.

---

## 🏁 ĐIỀU KIỆN ĐƯỢC PHÉP BÁO “HOÀN THÀNH”

Chỉ báo **HOÀN THÀNH** khi:

1. Đã rà soát toàn bộ phạm vi có liên quan.
2. Không còn trường hợp vi phạm nào tìm thấy bằng search/rescan.
3. Các component dùng chung đã được kiểm tra ảnh hưởng.
4. Không còn lỗi TypeScript/build/lint có thể xác định được liên quan đến thay đổi.
5. Không còn phần nào bị bỏ qua mà không được báo cáo.

Nếu có phần Antigravity không thể truy cập, đọc, chạy hoặc xác minh, phải báo chính xác:

* File/thư mục/chức năng nào.
* Không kiểm tra được điều gì.
* Lý do.
* Ảnh hưởng có thể có.
* Những gì vẫn chưa được xác minh.

**Không được dùng các câu chung chung như “có thể còn một số file chưa kiểm tra”. Phải nêu tên cụ thể.**

---

## 📊 BÁO CÁO CUỐI

Sau khi hoàn thành, chỉ cần báo cáo ngắn gọn:

### Đã rà soát
* Các khu vực chính đã kiểm tra.

### Đã chỉnh sửa
* File/component chính.
* Loại thay đổi.

### Đã xác minh
* Search/rescan.
* Type-check.
* Lint.
* Build.
* Responsive/dark mode nếu liên quan.

### Chưa thể xác minh
* Liệt kê chính xác nếu có.

Không báo hoàn thành khi vẫn còn mục trong **“Chưa thể xác minh”** mà có thể tiếp tục kiểm tra ngay trong môi trường hiện tại.
