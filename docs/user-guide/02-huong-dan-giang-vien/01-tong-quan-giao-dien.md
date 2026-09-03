# 01. TỔNG QUAN KHÔNG GIAN LÀM VIỆC CỦA GIẢNG VIÊN

Tài liệu này giới thiệu tổng quan giao diện, chức năng và phạm vi nghiệp vụ dành riêng cho Thầy/Cô với vai trò **Giảng viên / Cán bộ Coi thi & Chấm thi (`TEACHER`)**.

---

## 🖥️ 1. Giao Diện & Thanh Điều Hướng Chuyên Biệt

Sau khi đăng nhập bằng tài khoản Giảng viên, thanh Sidebar bên trái sẽ tự động tối ưu gọn gàng, chỉ hiển thị các chức năng phục vụ giảng dạy và khảo thí:

```
[HỆ THỐNG KHẢO THÍ]
├── 📅 Lịch Coi Thi Của Tôi (/teacher/assignments)
├── 🛡️ Giám Sát Phòng Thi Trực Tuyến (/teacher/proctor)
├── 📝 Chấm Thi Tự Luận & Trợ Lý AI (/teacher/essay-grading)
├── ⚖️ Giải Quyết Phúc Khảo (/teacher/regrade)
└── 📚 Ngân Hàng Câu Hỏi & Biên Soạn Đề (/question-bank - Nếu được phân quyền)
```

### Các khu vực làm việc chính:
1. **Lịch Coi Thi Của Tôi (`/teacher/assignments`)**: Nơi tra cứu nhanh danh sách các ca thi mà Thầy/Cô được phân công làm Giám thị 1 hoặc Giám thị 2; xem số phòng, giờ bắt đầu và tải danh sách sinh viên.
2. **Giám Sát Phòng Thi Trực Tuyến (`/teacher/proctor`)**: Bảng điều khiển giám sát thời gian thực khi sinh viên đang làm bài thi trên máy tính; theo dõi cảnh báo gian lận và gửi thông báo cho phòng thi.
3. **Chấm Thi Tự Luận (`/teacher/essay-grading`)**: Không gian chấm bài thi tự luận theo biểu điểm Rubric, có sự đồng hành của trợ lý trí tuệ nhân tạo (Gemini/DeepSeek) để gợi ý điểm và nhận xét nhanh.
4. **Giải Quyết Đơn Phúc Khảo (`/teacher/regrade`)**: Tiếp nhận các khiếu nại về điểm số của sinh viên, mở lại bài thi để chấm thẩm định và lập biên bản kết luận.

---

## 🔒 2. Cơ Chế Phạm Vi Dữ Liệu (Data Scoping)

Để đảm bảo tính bảo mật và riêng tư, hệ thống áp dụng cơ chế phân lập dữ liệu nghiêm ngặt cho vai trò Giảng viên:
* **Chỉ xem dữ liệu liên quan**: Giảng viên không nhìn thấy danh sách sinh viên hay đề thi của các môn học ngoài phạm vi chuyên môn của mình, trừ các ca thi mà giảng viên được phân công làm cán bộ coi thi.
* **Bảo vệ tính khách quan của đề thi**: Giảng viên chỉ có thể xem nội dung đề thi khi ca thi chính thức bắt đầu và đã được Ban Khảo thí mở khóa.

---

## ⚙️ 3. Quy Tắc Kỷ Luật & Văn Hóa Khảo Thí Số

Khi thao tác trên hệ thống khảo thí học đường, Thầy/Cô vui lòng tuân thủ các quy tắc sau:
1. **Bảo mật tuyệt đối thông tin đăng nhập**: Tuyệt đối không cung cấp tài khoản và mật khẩu cho sinh viên hoặc người khác sử dụng.
2. **Đăng xuất an toàn**: Sau khi kết thúc buổi coi thi tại các phòng máy tính công cộng, bắt buộc phải nhấn nút **"Đăng xuất"** ở góc phải thanh Header và đóng toàn bộ trình duyệt.
3. **Ghi nhật ký giải trình**: Khi thực hiện các thao tác quan trọng (như sửa điểm chấm thi, duyệt phúc khảo, hoặc lập biên bản kỷ luật thí sinh), hệ thống yêu cầu nhập lý do giải trình. Thầy/Cô vui lòng ghi rõ ràng, khách quan để làm căn cứ lưu hồ sơ học vụ.
