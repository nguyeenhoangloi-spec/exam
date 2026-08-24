# Phân quyền và phạm vi truy cập

Tài liệu này mô tả nguồn sự thật của trang `/admin/access-control` và cách hệ thống quyết định một tài khoản có được thực hiện thao tác hay không.

## 1. Mô hình quyết định quyền

Hệ thống áp dụng theo thứ tự:

1. Xác thực phiên đăng nhập.
2. Kiểm tra vai trò `ADMIN`, `TEACHER` hoặc `STUDENT`.
3. Kiểm tra quyền chức năng trong ma trận vai trò.
4. Áp dụng quyền riêng của tài khoản: `DENY` ưu tiên cao nhất; `ALLOW` chỉ được cấp trong nhóm chức năng hợp lệ của vai trò.
5. Với giảng viên, tiếp tục kiểm tra phạm vi Khoa/Lớp/Môn nếu tài khoản có phạm vi riêng.
6. Backend đưa ra quyết định cuối cùng; việc ẩn menu ở frontend chỉ hỗ trợ trải nghiệm, không thay thế kiểm tra bảo mật.

## 2. Ba khu vực quản trị

- **Quyền theo vai trò:** cấu hình mặc định cho toàn bộ tài khoản cùng vai trò.
- **Tài khoản và phạm vi truy cập:** tạo ngoại lệ cho một tài khoản và giới hạn dữ liệu của giảng viên.
- **Lịch sử thay đổi:** truy vết người thực hiện, hành động, thời gian và lý do.

## 3. Quy tắc an toàn

- Không thể thu hồi các quyền lõi `ACCESS_CONTROL_VIEW` và `ACCESS_CONTROL_MANAGE` khỏi vai trò Admin.
- Không thể đặt `DENY` các quyền lõi trên tài khoản Admin.
- Không thể cấp một quyền nằm ngoài nhóm chức năng hợp lệ của vai trò. Ví dụ, không cấp `BACKUP_MANAGE` cho Sinh viên.
- Mọi thao tác cấp/thu hồi quyền, quyền riêng và phạm vi đều phải có lý do tối thiểu 5 ký tự.
- Cập nhật cả mô-đun được thực hiện bằng một giao dịch; nếu một mục lỗi thì không áp dụng dở dang các mục còn lại.
- Khôi phục mặc định là thao tác có xác nhận và được ghi nhật ký.

## 4. Ý nghĩa phạm vi dữ liệu

Phạm vi riêng chỉ áp dụng cho Giảng viên:

- `DEPARTMENT`: các môn thuộc khoa được chọn.
- `CLASS`: các môn có sinh viên thuộc lớp được chọn.
- `SUBJECT`: môn học được chọn trực tiếp.

Nhiều phạm vi được kết hợp theo phép hợp: chỉ cần tài nguyên khớp một phạm vi đã gán. Nếu không gán phạm vi riêng, hệ thống dùng phạm vi nghiệp vụ kế thừa như khoa của giảng viên, đề do giảng viên tạo, lịch thi thử hoặc ca coi thi được phân công.

Phạm vi được áp dụng vào ngân hàng câu hỏi, lịch thi thử, kho đề và báo cáo. Admin không bị giới hạn phạm vi. Sinh viên chỉ được xem dữ liệu gắn với chính hồ sơ của mình.

## 5. Đồng bộ giao diện và API

- Frontend tải `/access-control/me/effective` sau khi khôi phục phiên đăng nhập.
- Sidebar ẩn chức năng không có quyền; truy cập URL trực tiếp được chuyển về trang làm việc còn quyền.
- Các controller nghiệp vụ vẫn dùng `PermissionGuard`, vì backend là lớp bảo vệ bắt buộc.
- Công cụ mô phỏng gọi `/access-control/simulate`; không tự tính kết quả giả ở trình duyệt.

## 6. Kiểm tra bắt buộc sau thay đổi

1. Admin còn truy cập được trang phân quyền và không thể tự khóa quyền lõi.
2. Thu hồi một quyền làm menu tương ứng biến mất và API trả `403`.
3. Cấp lại quyền làm menu và API hoạt động trở lại.
4. `DENY` tài khoản thắng quyền từ vai trò; xóa ngoại lệ trả về quyền vai trò.
5. Giảng viên chỉ thấy dữ liệu thuộc phạm vi riêng hoặc phạm vi kế thừa.
6. Sinh viên không thể xem lịch, kết quả hay lượt thi của tài khoản khác.
7. Mọi thay đổi xuất hiện trong lịch sử cùng người thực hiện và lý do.

