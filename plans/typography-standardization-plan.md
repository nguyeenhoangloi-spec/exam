# Kế hoạch phân tích và chuẩn hóa cỡ chữ giao diện

## 1. Mục tiêu

- Cỡ chữ đủ rõ ở màn hình quản trị, giáo viên và sinh viên.
- Mỗi vùng giao diện có cấp bậc thị giác rõ ràng: tiêu đề, nội dung chính, thông tin phụ, trạng thái và hành động.
- Giảm việc dùng cỡ chữ tùy biến rời rạc, tránh chữ quá nhỏ hoặc quá đậm.
- Giữ đồng bộ giữa desktop, tablet và mobile mà không làm vỡ bảng, form, card hoặc modal.
- Không thay đổi nghiệp vụ, dữ liệu, màu thương hiệu hay bố cục lớn nếu không cần thiết.

## 2. Kết quả kiểm kê ban đầu

Hệ thống đã có các lớp typography dùng chung trong `frontend/app/globals.css`:

- `edu-page-title`: 28/36, đậm.
- `edu-section-title`: 20/28, semibold.
- `edu-card-title`: 18/26, semibold.
- `edu-body`: 15/24.
- `edu-table-header`: 14/20.
- `edu-table-content`: 15/22.
- `edu-secondary`: 14/20.
- `edu-helper`: 13/18.
- `edu-badge`: 13/18.
- `edu-kpi`: 32/38.

Vấn đề cần chuẩn hóa:

- Nhiều màn hình dùng đồng thời Tailwind `text-xs`, `text-sm`, `text-base` và các giá trị tùy biến từ `10px` đến `32px`.
- Một số nội dung phụ, badge, mã dữ liệu và nút hành động xuống `10–11px`, khó đọc với tiếng Việt.
- Tiêu đề cùng cấp nhưng có nơi dùng 20px, nơi dùng 24px hoặc 28px.
- Line-height và font-weight chưa luôn đi cùng một scale, dẫn đến vùng chữ dày hoặc quá sát nhau.
- Bảng, drawer, form và dashboard có các quy ước riêng thay vì cùng token.
- Cần kiểm tra riêng màn hình thi vì đây là vùng đọc liên tục, không nên dùng scale quá nhỏ.

### Phát hiện sâu về font và weight

- Inter đang được tải qua Google Fonts với các weight `400, 500, 600, 700`, nhưng code dùng khoảng 344 lần `font-black` hoặc `font-extrabold`.
- Tailwind map `font-extrabold`/`font-black` vào weight 800/900; vì hai weight này chưa được tải, trình duyệt có thể giả lập độ đậm. Kết quả là nét chữ tiếng Việt, dấu và khoảng trắng có thể khác nhau giữa Chrome, Edge và máy không tải được Google Fonts.
- Nhiều weight `700–900` đi cùng cỡ `10–13px`, làm chữ nhỏ bị bí nét thay vì rõ hơn. Cần ưu tiên tăng cỡ và line-height trước khi tăng độ đậm.
- Có các cỡ lẻ `9px`, `9.5px`, `10px`, `10.5px`, `11px`, `11.5px`; đây là dấu hiệu chỉnh từng màn hình để né tràn layout. Khi chuẩn hóa cần xử lý nguyên nhân bố cục, không chỉ thay hàng loạt thành một giá trị khác.
- `leading-none` đang xuất hiện ở các vùng có mô tả hoặc tiêu đề dài; cần giới hạn `leading-none` cho số KPI hoặc một dòng ngắn, tránh cắt dấu tiếng Việt và làm các dòng chạm nhau.
- Font được nạp bằng `@import` từ Google Fonts. Cần kiểm tra trạng thái offline/CSP và có fallback rõ ràng; nếu môi trường triển khai không đảm bảo truy cập Google Fonts, nên cân nhắc self-host font hoặc dùng font hệ thống tương thích.

### Quyết định font cần chốt trước khi triển khai

1. Giữ Inter làm font chính hay chuyển sang một font có hỗ trợ tiếng Việt tốt hơn trong môi trường triển khai.
2. Nếu giữ Inter, chỉ dùng weight thực sự được tải (`400–700`) và quy đổi `font-extrabold/font-black` về `600/700` theo vai trò.
3. Nếu cần giữ weight 800/900 cho tiêu đề thương hiệu, phải tải đúng weight và kiểm tra kích thước bundle, tốc độ hiển thị cùng dấu tiếng Việt.
4. Đặt `font-display: swap`/chiến lược fallback rõ ràng và kiểm tra layout shift khi font web chưa tải.
5. Dùng `font-variant-numeric: tabular-nums` riêng cho KPI, số thứ tự, thời gian và mã cần căn cột; không áp dụng cho toàn bộ văn bản.

## 3. Scale đề xuất

Font chính giữ nguyên `Inter`, có fallback system font. Quy ước ghi theo `font-size / line-height`:

| Token | Cỡ chữ | Dùng cho |
|---|---:|---|
| `display` | 28/36 desktop, 24/32 mobile | Tiêu đề trang |
| `heading-lg` | 20/28 | Tiêu đề section, drawer chính |
| `heading-md` | 18/26 | Tiêu đề card, dialog |
| `heading-sm` | 16/24 | Tiêu đề nhóm, label nổi bật |
| `body-lg` | 16/24 | Nội dung đọc nhiều, màn hình thi |
| `body` | 15/24 | Nội dung quản trị chính, ô nhập |
| `body-sm` | 14/20–22 | Bảng, thông tin phụ, control |
| `caption` | 13/18 | Helper, metadata, nhãn phụ |
| `badge` | 12/16–18 | Badge, trạng thái, mã ngắn |
| `micro` | 11/16 | Chỉ dành cho trục biểu đồ hoặc dữ liệu cực phụ; không dùng cho nội dung cần đọc |

Nguyên tắc:

- Không dùng dưới 12px cho label, nút, bảng, thông báo hoặc dữ liệu nghiệp vụ.
- Không dùng `font-black` tràn lan; mặc định dùng `400/500/600`, chỉ dùng `700` cho tiêu đề hoặc số KPI.
- Mỗi cỡ chữ phải có line-height tương ứng, không đặt `leading-none` cho đoạn văn hoặc thông tin nhiều dòng.
- Không dùng chữ in hoa toàn bộ cho đoạn dài; chỉ dùng cho table header hoặc nhãn ngắn.

## 4. Ma trận theo từng vùng giao diện

### Shell và điều hướng

- Logo/tên hệ thống: 16–18px, semibold/bold.
- Menu sidebar: 14px, medium; mục đang chọn 14px, semibold.
- Header, tên người dùng và hành động phụ: 14px.
- Tooltip: 12px, line-height 16–18px.

### Tiêu đề trang

- Desktop: 28/36.
- Mobile: 24/32.
- Mô tả dưới tiêu đề: 14–15/22–24, màu phụ.
- Khoảng cách giữa tiêu đề và mô tả giữ ổn định, không bù bằng cách tăng cỡ chữ.

### Dashboard và KPI

- Nhãn KPI: 13/18.
- Số KPI: 28–32/36–38, bold.
- Đơn vị và biến động: 12–13/18.
- Tiêu đề card: 16–18/24–26.
- Nội dung danh sách: 14–15/20–24.

### Bảng dữ liệu

- Table header: 13–14/20, semibold; uppercase chỉ khi label ngắn.
- Nội dung ô: 14–15/22.
- Mã, email, ngày giờ: 13–14/20, dùng monospace khi thực sự cần phân biệt ký tự.
- Badge trạng thái: 12/16–18, semibold.
- Nút thao tác: icon 16px; tooltip hoặc title 12px.
- Không thu nhỏ chữ để ép bảng vừa màn hình; ưu tiên scroll ngang hoặc ẩn cột phụ có chủ đích.

### Form và bộ lọc

- Label: 13–14/18–20, semibold.
- Input/select/textarea: 14–15/20–24.
- Placeholder: cùng cỡ input nhưng màu phụ hơn.
- Helper/error: 12–13/18.
- Nút chính/phụ: 14/20, semibold; không dùng `text-xs` cho nút có nội dung dài.

### Modal, drawer và menu

- Tiêu đề: 20/28 hoặc 18/26 tùy cấp.
- Nội dung: 14–15/22–24.
- Tiêu đề nhóm: 15–16/22–24.
- Nút xác nhận/hủy: 14/20.
- Metadata: 13/18.

### Màn hình làm bài và kết quả

- Nội dung câu hỏi: tối thiểu 16/26 để đọc liên tục.
- Đáp án và lựa chọn: 15–16/24.
- Đồng hồ/thời lượng chính: 20–24/28–32.
- Metadata câu hỏi: 13–14/20.
- Không dùng cỡ 10–11px cho hướng dẫn, cảnh báo hoặc nội dung ảnh hưởng thao tác.

## 5. Responsive và vùng kích thước

Kiểm tra tối thiểu tại các viewport:

- 360px: mobile nhỏ, không tràn nút và không cắt tiêu đề.
- 390/414px: mobile phổ biến.
- 768px: tablet và breakpoint chuyển layout.
- 1024px: laptop nhỏ.
- 1280/1440px: desktop chuẩn.
- Zoom trình duyệt 125% và 200% để phát hiện chữ bị cắt hoặc vùng tương tác quá nhỏ.

Quy tắc responsive:

- Chỉ giảm cấp tiêu đề trên mobile; không giảm body xuống dưới 14px.
- Dùng `clamp()` hoặc token responsive cho tiêu đề lớn, không tạo nhiều giá trị lẻ.
- Bảng giữ khả năng đọc bằng scroll ngang, không ép chữ xuống 10–11px.
- Tiêu đề dài được xuống dòng tự nhiên; không dùng `truncate` nếu làm mất tên nghiệp vụ.
- Line-height mobile tăng nhẹ khi nội dung xuống nhiều dòng.

## 6. Cách triển khai theo đợt

### Đợt 1 — Chốt token

- Chuẩn hóa các lớp `edu-*` trong `globals.css` thành nguồn chuẩn duy nhất.
- Bổ sung token cho control, label, error, badge, table và màn hình thi.
- Quy định rõ khi nào được dùng Tailwind trực tiếp và khi nào phải dùng token.

### Đợt 2 — Sửa component dùng chung

- Header, Sidebar, page shell.
- Button, Input, Select, Modal, Drawer, Badge, Table, Pagination.
- Đây là bước có tác động lan tỏa lớn nhất nên phải kiểm tra desktop/mobile sau mỗi nhóm.

### Đợt 3 — Chuẩn hóa các màn hình quản trị

Ưu tiên: Dashboard, Kỳ thi, Lịch thi, Phòng thi, Sinh viên, Giảng viên, Ngân hàng câu hỏi, Báo cáo.

- Thay cỡ chữ lẻ bằng token tương ứng.
- Đồng bộ tiêu đề, label, bảng, trạng thái, empty state và pagination.
- Giữ nguyên logic và dữ liệu.

### Đợt 4 — Chuẩn hóa màn hình thao tác chuyên sâu

- Form tạo/sửa.
- Drawer và modal chi tiết.
- Phân công coi thi, chấm tự luận, sắp xếp phòng.
- Màn hình làm bài, lobby và kết quả.

### Đợt 5 — Kiểm tra trực quan và hồi quy

- Chụp/kiểm tra từng viewport chuẩn.
- Kiểm tra text tiếng Việt có dấu, tên dài, mã dài, lỗi validation và empty state.
- Kiểm tra dark mode nếu vùng đó hỗ trợ.
- Chạy build, lint/type check và rà lại overflow.

## 7. Tiêu chí nghiệm thu

- Không còn nội dung nghiệp vụ, label, nút hoặc badge quan trọng dưới 12px.
- Tiêu đề cùng cấp trên các trang có cùng cỡ, weight và line-height.
- Bảng có header/cell/badge thống nhất, đọc được ở 100% và 125% zoom.
- Form có label, input, helper và lỗi phân biệt rõ.
- Không có chữ bị cắt, chồng dòng, tràn card hoặc mất nút ở 360px.
- Màn hình làm bài đọc thoải mái hơn màn hình quản trị, không dùng cùng scale quá nhỏ.
- Build frontend thành công và không tạo lỗi TypeScript/ESLint mới.

## 8. Phạm vi giữ nguyên

Không đổi font thương hiệu, màu sắc, khoảng cách tổng thể hoặc bố cục trang. Các bước tiếp theo nếu cần sẽ tiếp tục theo từng nhóm component, review ảnh hưởng và kiểm tra trực quan trước khi áp dụng diện rộng.

## 9. Trạng thái triển khai

Đã áp dụng phần chuẩn hóa nền trong `frontend/app/globals.css`:

- Thêm typography tokens cho title, section, card, body, bảng, helper, badge và mobile.
- Bổ sung xử lý font kerning, tắt font synthesis và tối ưu hiển thị chữ.
- Giới hạn `font-black`/`font-extrabold` về weight 700 để khớp các weight Inter đang tải.
- Nâng metadata dưới 12px trong `.app-shell-main` lên badge scale 12/18.
- Bổ sung token đọc dài và số liệu căn cột (`edu-reading`, `edu-numeric`).
- Tăng độ tương phản chữ phụ trên nền sáng: `slate-400` → `slate-500`, `slate-500`/`#64748B` → `#475569`.
- Đổi body sang subpixel antialiasing để nét chữ không bị mảnh trên màn hình hiện tại; dark theme giữ palette riêng.
- Làm rõ Sidebar riêng: menu chính dùng màu `#334155`, icon `#475569`, nhóm điều hướng dùng `#64748B`/bold và thông tin phụ tối thiểu 12px.
- Frontend production build đã chạy thành công; các cảnh báo còn lại là cảnh báo sẵn có về `<img>`, font page-level và dependency hook.
