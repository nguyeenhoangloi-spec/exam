# Quy tắc bảo mật dữ liệu thi và phân quyền

## 1. Dữ liệu sinh viên được phép nhận

- Khi đang thi, API chỉ trả nội dung câu hỏi, lựa chọn và câu trả lời đã lưu của chính sinh viên.
- Không trả `isCorrect`, đáp án điền khuyết, giải thích đáp án, điểm chấm từng câu hoặc trường nội bộ dùng để chấm.
- Sau khi nộp, endpoint tải câu hỏi bị khóa. Sinh viên chỉ dùng endpoint kết quả.
- Với kỳ thi chính thức, điểm không được trả khi khung giờ thi chung vẫn đang mở.
- Đáp án chỉ được review khi ca thi đã kết thúc, kết quả đã công bố và cấu hình cho phép review.
- Lịch thi không được dùng làm đường vòng để trả `totalScore` chưa công bố.

## 2. Quyền theo vai trò và phạm vi dữ liệu

- `STUDENT`: chỉ truy cập lịch, lượt thi, kết quả và phúc khảo của chính mình.
- `TEACHER`: ngoài đúng vai trò, phải được phân công đúng ca/phòng trước khi xem bài làm, báo cáo hoặc xử lý phúc khảo.
- Ngân hàng câu hỏi của giảng viên được giới hạn theo khoa. API danh sách không trả khóa đáp án hàng loạt; chi tiết được tải riêng khi có quyền.
- Giảng viên chỉ được mở đề thi do mình tạo. Đề đã phát hành của người khác không làm mất kiểm tra sở hữu.
- `ADMIN`: có phạm vi quản trị toàn hệ thống; thao tác quan trọng phải được ghi audit log.

## 3. Phiên đăng nhập

- Access token phải chứa mã phiên `sid` và mã phiên đó phải còn tồn tại, chưa bị thu hồi, chưa hết hạn.
- Đăng xuất, đổi mật khẩu hoặc thu hồi toàn bộ phiên làm access token mất hiệu lực ở request tiếp theo.
- Refresh token được lưu dạng hash, đặt trong cookie `HttpOnly` và xoay vòng một lần; token cũ không được tái sử dụng.
- Google OAuth redirect phải kiểm tra `state`; Google ID token phải đúng `audience` của ứng dụng và email đã được xác minh.

## 4. Khôi phục mật khẩu

- Phản hồi quên mật khẩu không xác nhận tài khoản có tồn tại hay không.
- OTP được sinh bằng nguồn ngẫu nhiên mật mã, không trả về frontend và không ghi vào log.
- OTP giới hạn số lần thử; reset token gắn với phiên OTP phía server và chỉ dùng được một lần.
- Các endpoint xác thực nhạy cảm có giới hạn tần suất theo địa chỉ mạng và định danh nhập vào khi chạy production.

## 5. Dữ liệu tuyệt đối không trả ra API

- `examPasswordHash`, `accessCode`, refresh-token hash, session token và secret cấu hình.
- Khóa đáp án trong API đang thi hoặc API danh sách có thể tải hàng loạt.
- Điểm chưa đủ điều kiện công bố.

## 6. Kiểm tra bắt buộc trước khi bàn giao

1. TypeScript backend không có lỗi.
2. Toàn bộ test backend đạt.
3. Backend build thành công.
4. Request không có JWT vào route thi nhận `401`.
5. Giảng viên ngoài ca nhận `403`/không tìm thấy dữ liệu.
6. Payload sinh viên không chứa các trường đáp án, điểm nội bộ hoặc secret.
7. Đăng xuất/đổi mật khẩu làm phiên cũ không dùng lại được.

## 7. Hạn chế còn cần triển khai tiếp

- Rate limit hiện lưu trong bộ nhớ từng tiến trình; môi trường nhiều server cần Redis hoặc gateway dùng chung.
- OTP hiện lưu trong bộ nhớ; production nhiều instance cần kho dùng chung có TTL.
- Chưa có cờ bắt buộc đổi mật khẩu tạm thời cho tài khoản được tạo mới.
- Chưa có MFA thật ở backend; tùy chọn giao diện không được xem là cơ chế bảo mật cho đến khi có xác minh server-side.
