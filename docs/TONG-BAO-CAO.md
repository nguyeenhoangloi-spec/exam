# Trung tâm Tổng báo cáo

## Mục tiêu

Trang `/exam-reports?view=summary` là trung tâm tổng hợp và xuất báo cáo khảo thí chính thức. Dữ liệu thi thử không được đưa vào báo cáo này.

## Không gian làm việc

- **Tổng quan:** KPI, mẫu báo cáo thường dùng và các ca thi gần đây.
- **Tạo báo cáo:** chọn loại báo cáo, phạm vi dữ liệu, cột hiển thị, xem trước và xuất file.
- **Lịch sử xuất:** lưu tối đa 30 lần xuất gần nhất trên thiết bị; mỗi lần xuất chính thức đồng thời được ghi vào Audit Log backend.

## Danh mục báo cáo

1. Tổng hợp kỳ thi.
2. Kết quả theo ca thi.
3. Phổ điểm.
4. Tình hình dự thi.
5. Tiến độ chấm thi.
6. Cảnh báo và vi phạm.
7. Phúc khảo điểm thi.

Danh mục được cung cấp từ `GET /exam-reports/catalog`; frontend không hardcode danh sách nghiệp vụ.

## Bộ lọc dùng chung

- Kỳ thi.
- Môn học.
- Khoa.
- Lớp.
- Từ ngày và đến ngày.

Bộ lọc được lưu trên URL, dùng chung cho dữ liệu tổng hợp, bản xem trước và file xuất. Các giá trị `Id` được backend xác thực là số nguyên dương; ngày được xác thực theo ISO 8601.

## Định dạng xuất

- **CSV:** UTF-8 BOM, tương thích tiếng Việt và chống CSV formula injection.
- **XLSX:** workbook thật được tạo bằng ExcelJS, có tiêu đề, bộ lọc cột, đóng băng header và định dạng bảng.
- **In / PDF:** mở bản in chuẩn Times New Roman để người dùng in hoặc lưu PDF bằng trình duyệt.

## Phân quyền và bảo mật

- `EXAM_REPORT_VIEW`: xem catalog, tổng quan và bản xem trước.
- `EXAM_REPORT_EXPORT`: xuất CSV/XLSX; đây là quyền nhạy cảm.
- Admin xem dữ liệu chính thức toàn hệ thống.
- Giảng viên chỉ xem các ca có phòng thi mà mình được phân công.
- Backend luôn áp dụng `mode = OFFICIAL`; frontend không thể yêu cầu trộn dữ liệu thi thử.
- Mỗi lần xuất file được ghi Audit Log với loại báo cáo, định dạng, bộ lọc và số bản ghi.

## API

- `GET /exam-reports/summary`: số liệu tổng quan và tùy chọn bộ lọc.
- `GET /exam-reports/schedules`: danh sách ca thi thuộc phạm vi.
- `GET /exam-reports/catalog`: danh mục mẫu báo cáo.
- `POST /exam-reports/preview`: tạo dữ liệu xem trước.
- `POST /exam-reports/export`: tạo CSV hoặc XLSX.

## Kiểm tra bắt buộc

1. Preview và file xuất phải có cùng bộ lọc, cột và số bản ghi.
2. Giảng viên không nhận được dữ liệu ngoài ca được phân công.
3. Thi thử không xuất hiện trong báo cáo chính thức.
4. CSV mở đúng tiếng Việt và không thực thi công thức từ dữ liệu người dùng.
5. XLSX mở không cảnh báo sai định dạng.
6. Thao tác xuất phải xuất hiện trong nhật ký hoạt động.
