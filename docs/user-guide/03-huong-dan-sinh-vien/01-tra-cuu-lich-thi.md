# 01. HƯỚNG DẪN TRA CỨU LỊCH THI, SỐ BÁO DANH & ÔN LUYỆN TỰ DO

Tài liệu này hướng dẫn các bạn Thí sinh / Sinh viên cách tra cứu lịch thi học kỳ cá nhân, kiểm tra số báo danh, số ghế và sử dụng không gian luyện tập trắc nghiệm tự do trên hệ thống.

---

## 🔍 1. Tra Cứu Lịch Thi Cá Nhân (`/student/exam-schedule`)

Sau khi Phòng Khảo thí công bố lịch thi chính thức, bạn có thể dễ dàng kiểm tra toàn bộ thông tin dự thi của mình:

### Các bước đăng nhập Localhost dành cho Sinh viên:
1. Mở trình duyệt web truy cập: **`http://localhost:3000/login`**
2. Nhìn bên dưới nút "Đăng nhập với Google", bấm vào dòng chữ: **"Đăng nhập tài khoản nội bộ"**.
3. Nhập thông tin tài khoản Sinh viên mẫu:
   - **Tên đăng nhập**: `sv001` (hoặc `sv002`, `sv003`... đến `sv105`)
   - **Mật khẩu**: `123456`
   - *Gợi ý*: Sinh viên `sv001` thuộc Lớp `CNTT-K64A` (Khoa CNTT) đã có sẵn lịch thi các môn học kỳ.
4. Nhấn nút **"Đăng nhập"**. Hệ thống sẽ tự động đưa bạn đến thẳng trang **Lịch Thi Của Tôi (`/student/exam-schedule`)**.
5. Bảng danh sách các môn thi của bạn trong học kỳ sẽ hiển thị với các thông tin chi tiết:

| Trường thông tin | Ý nghĩa & Hướng dẫn |
| :--- | :--- |
| **Môn thi** | Tên môn học và Mã môn (Ví dụ: *Cơ sở dữ liệu - IT101*). |
| **Ngày thi** | Ngày chính xác diễn ra ca thi (Định dạng: `Thứ..., DD/MM/YYYY`). |
| **Khung giờ thi** | Giờ bắt đầu và Giờ kết thúc (Ví dụ: `07:30 – 09:30`). Bạn cần có mặt trước giờ này 15 phút. |
| **Phòng thi & Địa điểm** | Số hiệu phòng và Tòa nhà (Ví dụ: *Phòng Máy tính LAB-03, Tòa B2*). |
| **Số Báo Danh (SBD)** | Mã số dự thi riêng biệt của bạn (Ví dụ: `KT1-CSDL-0045`). |
| **Số Ghế** | Vị trí ngồi chính xác của bạn trong phòng thi (Ví dụ: `Ghế số 12`). |
| **Hình thức thi** | Trắc nghiệm máy tính (`ONLINE_QUIZ`), Tự luận giấy (`ESSAY`), hoặc Kết hợp (`HYBRID`). |

---

## 🖨️ 2. Tải & In Giấy Báo Dự Thi

Để thuận tiện xuất trình cho cán bộ coi thi hoặc bảo vệ khi vào cổng trường:
1. Tại góc trên bên phải trang lịch thi, nhấn nút **"In Giấy Báo Dự Thi"**.
2. Hệ thống sẽ tạo một file PDF chuẩn chứa:
   - Họ và tên, Mã sinh viên, Lớp sinh hoạt.
   - Bảng tổng hợp toàn bộ các môn thi kèm SBD, phòng thi và giờ thi.
3. Bạn có thể lưu file PDF vào điện thoại hoặc in ra giấy A4 mang theo trong suốt đợt thi.

> [!TIP]
> **Lưu ý quan trọng**: Nếu phát hiện trùng lịch thi (2 môn thi trong cùng 1 buổi) hoặc sai thông tin cá nhân, bạn hãy liên hệ ngay với Văn phòng Khoa hoặc Phòng Khảo thí tối thiểu **3 ngày trước ngày thi** để được hỗ trợ điều chỉnh kịp thời.

---

## 🎯 3. Không Gian Luyện Tập Trắc Nghiệm Tự Do (`/practice`)

Để giúp sinh viên không bị bỡ ngỡ với giao diện làm bài thi trực tuyến, hệ thống cung cấp phân hệ **Luyện tập tự do**:

### Lợi ích khi thi thử:
* Làm quen với đồng hồ đếm ngược, bảng điều hướng câu hỏi và thao tác chọn/đổi đáp án.
* Kiểm tra thử độ tương thích của trình duyệt trên máy tính cá nhân.
* **Hoàn toàn miễn phí & Không ảnh hưởng điểm số**: Kết quả thi thử chỉ mang tính chất ôn tập cá nhân, tuyệt đối không được ghi nhận vào điểm học bạ chính thức.

### Các bước luyện tập:
1. Truy cập menu **"Ôn Luyện Tự Do"** (`/practice`).
2. Chọn **Môn học** bạn muốn ôn tập từ danh mục môn học.
3. Chọn số lượng câu hỏi (Ví dụ: `20 câu`, `40 câu`) và thời lượng làm bài mong muốn.
4. Nhấn **"Bắt đầu làm bài thử"**.
5. Sau khi nộp bài, hệ thống sẽ chấm điểm tức thì và hiển thị phần **Giải thích đáp án chi tiết** cho từng câu hỏi để bạn rút kinh nghiệm.
