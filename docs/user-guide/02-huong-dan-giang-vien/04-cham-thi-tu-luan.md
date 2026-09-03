# 04. HƯỚNG DẪN CHẤM THI TỰ LUẬN THEO TIÊU CHÍ RUBRIC & TRỢ LÝ AI

Tài liệu này hướng dẫn Giảng viên khai thác không gian **Chấm thi Tự luận Thông minh (`/teacher/essay-grading`)** kết hợp tiêu chí Rubric đa tầng và Trợ lý Trí tuệ Nhân tạo (AI Gemini / DeepSeek) để đẩy nhanh tiến độ và nâng cao độ chính xác khi chấm thi.

---

## 🔒 1. Cơ Chế Rọc Phách Ẩn Danh Điện Tử (Blind Grading)

Để đảm bảo tính khách quan và công bằng tuyệt đối trong đánh giá học thuật:
* Khi Giảng viên mở giao diện chấm bài, toàn bộ thông tin cá nhân của thí sinh (Họ và tên, Mã sinh viên, Lớp học) **đều được tự động ẩn đi hoàn toàn**.
* Mỗi bài làm được đại diện bằng một **Mã phách điện tử ngẫu nhiên** (Ví dụ: `PHACH-94021`).
* Giảng viên chỉ tập trung thuần túy vào chất lượng nội dung bài làm của thí sinh mà không bị chi phối bởi bất kỳ định kiến cá nhân nào.

---

## 🖥️ 2. Giao Diện Chấm Bài 2 Cột Thông Minh (Split-View)

Màn hình chấm bài được thiết kế theo bố cục song song tiện lợi:

```
+-------------------------------------------------------+-------------------------------------------------------+
|  📄 NỘI DUNG BÀI LÀM THÍ SINH (MÃ PHÁCH: #94021)       |  📝 KHUNG CHẤM ĐIỂM THEO TIÊU CHÍ (RUBRIC)            |
+-------------------------------------------------------+-------------------------------------------------------+
| [CÂU 1 (4.0 điểm)]: Thiết kế mô hình CSDL Quản lý...  | [Tiêu chí 1]: Xác định đúng thực thể & thuộc tính     |
|                                                       | ⚪ Chưa đạt (0đ)  ⚪ Cơ bản (1.0đ)  🔘 Tốt (2.0đ/2.0đ)  |
| Bài làm của thí sinh:                                 |                                                       |
| "Em xin trình bày các thực thể như sau:               | [Tiêu chí 2]: Quan hệ & Khóa chính / Khóa ngoại       |
| 1. KHACH_HANG (MaKH, TenKH, DiaChi)                   | ⚪ Chưa đạt (0đ)  🔘 Khá (1.5đ)   ⚪ Tốt (2.0đ/2.0đ)  |
| 2. DON_HANG (MaDH, NgayDat, MaKH)..."                 |                                                       |
|                                                       | ----------------------------------------------------- |
|                                                       | 🤖 [TRỢ LÝ AI GỢI Ý ĐIỂM: 3.5 / 4.0 ĐIỂM]             |
|                                                       | Nhận xét AI: "Thí sinh xác định đầy đủ thực thể..."   |
|                                                       |                                                       |
|                                                       | [Ghi chú nhận xét của Thầy/Cô]:                       |
|                                                       | [Bài làm rõ ràng, cần lưu ý thêm kiểu dữ liệu date..] |
|                                                       |                                                       |
|                                                       | TỔNG ĐIỂM CÂU 1: [ 3.5 ] / 4.0 điểm                   |
|                                                       | [💾 Lưu bài này & Chuyển sang bài tiếp theo ->]       |
+-------------------------------------------------------+-------------------------------------------------------+
```

---

## 📐 3. Quy Trình Chấm Theo Khung Tiêu Chí Rubric

Hệ thống hỗ trợ cấu hình ma trận tiêu chí Rubric minh bạch:
1. Mỗi câu hỏi tự luận có thể chia thành nhiều tiêu chí thành phần (Ví dụ: *Kiến thức lý thuyết*, *Kỹ năng lập luận*, *Tính sáng tạo / Tối ưu*).
2. Thầy/Cô chỉ cần click chọn mức độ thí sinh đạt được tại từng tiêu chí:
   - Hệ thống sẽ tự động tính toán tổng điểm tích lũy của câu hỏi.
   - Tránh hoàn toàn lỗi cộng sai điểm số thường gặp khi chấm trên giấy truyền thống.

---

## 🤖 4. Trợ Lý AI Hỗ Trợ Chấm Thi (AI-Assisted Grading)

Hệ thống tích hợp các mô hình ngôn ngữ lớn tiên tiến (Google Gemini / DeepSeek API) để hỗ trợ Thầy/Cô:

### A. Cách sử dụng tính năng Chấm gợi ý bằng AI:
1. Tại góc phải của câu hỏi, nhấn nút **"🤖 AI Phân Tích & Chấm Thử"**.
2. Động cơ AI sẽ đọc đồng thời: Đề bài, Đáp án chuẩn của bộ môn, Tiêu chí Rubric và Văn bản bài làm của thí sinh.
3. Sau khoảng 2-3 giây, AI sẽ trả về:
   - **Điểm số đề xuất** cho từng tiêu chí thành phần.
   - **Nhận xét phân tích chi tiết**: Nêu rõ thí sinh đã làm đúng ý nào, thiếu sót ý nào, lập luận có lỗ hổng logic nào không.
   - **Phát hiện dấu hiệu bất thường**: Cảnh báo nếu văn phong bài làm có dấu hiệu sao chép trực tiếp từ tài liệu mạng hoặc trùng lặp với bài của thí sinh khác.
4. Thầy/Cô có thể bấm **"Áp dụng điểm gợi ý của AI"** nếu thấy hoàn toàn chính xác, hoặc tự chỉnh sửa lại điểm theo cảm nhận sư phạm cá nhân.

> [!IMPORTANT]
> **Nguyên tắc Sư phạm Bất di bất dịch**: AI chỉ đóng vai trò trợ lý sơ khảo gợi ý. **Giảng viên con người chịu trách nhiệm pháp lý 100% đối với điểm số chính thức của bài thi**. Hệ thống không bao giờ tự động lưu điểm của AI nếu không có thao tác xác nhận và phê duyệt của Giảng viên.

---

## 💾 5. Chốt Điểm & Hoàn Tất Túi Bài Chấm

1. Thầy/Cô chấm tuần tự từng bài trong túi bài được giao (Tiến độ hiển thị: *Ví dụ: Đã chấm 38 / 40 bài*).
2. Kiểm tra lại danh sách để đảm bảo không bỏ sót bất kỳ bài thi nào.
3. Nhấn nút **"Chốt Túi Điểm & Gửi Báo Cáo"**.
4. Toàn bộ điểm số tự luận sẽ được đồng bộ vào CSDL, tự động cộng với điểm thi trắc nghiệm (nếu là môn thi kết hợp) để tạo ra Tổng điểm học phần chính thức của thí sinh.
