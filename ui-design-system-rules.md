# Quy chuẩn UI/UX toàn hệ thống Exam Management System

> Tài liệu tra cứu nhanh cho Web UI. Đây là quy chuẩn áp dụng thống nhất cho mọi page, layout, component, shared component, trạng thái giao diện và phần tử tương tác.

## 1. Phạm vi áp dụng

Áp dụng cho toàn bộ Web UI:

- Dashboard, sidebar, header, breadcrumb.
- Admin, giảng viên và sinh viên.
- Button, input, select, search, filter, dropdown, table, card, modal, toast, tooltip, badge và pagination.
- Trạng thái loading, empty, error, disabled, hover, focus, active và responsive.

Không thay đổi API, database, route, permission, RBAC hoặc logic nghiệp vụ khi chỉ chuẩn hóa UI.

## 2. Quy tắc nhớ nhanh

```text
Font Web UI       = Inter
Màu chữ chính     = Đen xanh đậm (Deep Ink), không dùng xám lợt
Cỡ chữ chuẩn      = 15px (cỡ mặc định cho nội dung và control chính)
Weight tối thiểu  = 400
Bố cục            = Phẳng, hạn chế khung hộp, dùng đường kẻ ngang (divide-y / border-t)
Nút/control       = rounded-xl (12px); ngoại lệ rounded-lg (8px) cho submenu Sidebar, badge nhỏ, chip
Nút chính (CTA)   = cao 44px (lg)
Control/filter/md = cao 40px (md)
Nút phụ/đóng      = cao 36px (sm)
Icon buttons      = 36px (icon) hoặc 40px (icon-lg)
Nhóm nút          = Chỉ 1 Primary trong cùng một nhóm thao tác/vùng chức năng, cùng chiều cao, tách Danger sang trái
Mobile            = vùng chạm tối thiểu 44px
```

## 3. Font family

### Web UI

Chỉ dùng Inter làm font chính:

```css
font-family:
  var(--font-inter),
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Không dùng trong Web UI:

- Times New Roman.
- Georgia.
- Cambria.
- `serif`, `font-serif`.
- Font monospace cho nội dung thông thường.

### File xuất

- Word, đề thi, báo cáo in: Times New Roman.
- Excel: Arial.
- Đây là ngoại lệ cho file xuất, không áp dụng ngược lại cho Web UI.

## 4. Cỡ chữ chuẩn & Line-height (Typography & Line Spacing Scale)

Hệ thống có 8 cỡ chữ semantic chính trên desktop đi kèm **Line-height (Chiều cao dòng)** tương ứng nhằm đảm bảo khoảng cách dòng tối ưu, chống đè dấu tiếng Việt và căn giữa chuẩn xác:

| Token | Cỡ chữ | Line-height | Tỷ lệ giãn dòng | Vai trò | Ví dụ |
|---|---:|---:|---:|---|---|
| `fs-kpi` | 32px | 38px | ~1.2x | KPI, tổng số nổi bật | `2.219` |
| `fs-page-title` | 28px | 36px | ~1.3x | Tiêu đề trang | `Ngân hàng câu hỏi` |
| `fs-section-title` | 20px | 28px | 1.4x | Tiêu đề khu vực | `Thống kê trạng thái` |
| `fs-card-title` | 18px | 26px | ~1.45x | Tiêu đề card, tiêu đề modal/drawer | `Thông tin kỳ thi` |
| `fs-body` | 15px | 24px | **1.6x (Tỷ lệ vàng)** | **Cỡ chữ chính:** Nội dung, button, input, label | `Tạo lịch thi` |
| `fs-body-sm` | 14px | 20px | ~1.43x | Nội dung phụ, header bảng | `Thời gian` |
| `fs-helper` | 13px | 18px | ~1.38x | Hướng dẫn, ghi chú | `Tối đa 10MB` |
| `fs-badge` | 12px | 18px | 1.5x | Badge, chip trạng thái nhỏ | `Đã duyệt` |

### Quy tắc line-height & cỡ chữ bắt buộc:
1. **Làm rõ cỡ chữ 15px:** `15px` là cỡ chữ mặc định cho nội dung chính và control (Base Body), không có nghĩa mọi chữ trong hệ thống đều phải là 15px (các tầng 12px, 13px, 14px, 18-32px được sử dụng đúng vai trò phân cấp).
2. **Chống đè dấu tiếng Việt:** Cỡ chữ chính `15px` bắt buộc đi kèm `line-height: 24px` (để lại 4.5px đệm trên/dưới) giúp các ký tự có dấu mũ (`ế`, `ắ`, `ổ`, `ữ`) và dấu nặng/đuôi móc (`g`, `y`, `p`, `.`) hiển thị sắc nét, không bị dính vào dòng trên hoặc dòng dưới.
3. **Căn giữa nút & ô nhập:** Trong button (`h-11`, `h-10`, `h-9`) và input, line-height chuẩn kết hợp flexbox giúp chữ luôn nằm ngay ngắn tại tâm giữa hộp.
4. **Nội dung bảng (Table body):** 15px, line-height 22–24px.
5. **Header bảng (Table header):** 14px, line-height 20px.
6. **Mobile viewport:** Tiêu đề trang 24px (line-height 32px), tiêu đề section 18px (line-height 26px).
7. **Không dùng cỡ chữ dưới 12px:** Tuyệt đối không dùng 10px hoặc 11px cho nội dung Web UI thông thường.

## 5. Font weight và phân cấp thông tin

| Weight | Dùng cho |
|---:|---|
| 400 | Nội dung thường, mô tả, dữ liệu bảng bình thường |
| 500 | Label, header bảng, navigation, mã, ngày tháng, giá trị cần quét nhanh |
| 600 | Tiêu đề, tiêu đề card, tên chính, button, action chính |
| 700 | KPI, tổng số hoặc giá trị đặc biệt quan trọng; dùng tiết chế |

Không dùng:

- `font-light`, `font-thin`, `font-extralight`.
- Font weight dưới 400 hoặc trên 700 trong UI bình thường.
- Không làm nhiều phần tử cạnh nhau cùng đậm nhất. Mỗi nhóm chỉ nên có một cấp nhấn mạnh chính.

Phân loại trước khi style:

```text
Primary → Secondary → Metadata → Status → Action
```

Ví dụ trong bảng:

- Tên sinh viên: 500–600.
- Mã sinh viên: 500.
- Lớp/khoa: 400.
- Ngày giờ: 400–500.
- Trạng thái: 500–600 kèm màu/icon semantic.
- Điểm quan trọng: 600.

## 6. Màu chữ (Deep Ink 4-Tier Typography System)

Toàn bộ Web UI dùng bảng màu xanh đen đậm để chữ rõ trên màn hình Windows và nền xanh–trắng. Không tạo nhiều cấp xám lợt; phân cấp thị giác chủ yếu dựa vào cỡ chữ, weight, vị trí và spacing.

### 6.1 Bảng phân cấp 4 tầng màu chuẩn

| Cấp bậc | Vai trò | Light mode | Dark mode | Utility | Mục đích sử dụng |
|---|---|---|---|---|---|
| **Tầng 1** | **Mặc định / chính** | `#020617` | `#F8FAFC` | `.text-main` | Nội dung, tiêu đề, dữ liệu bảng, menu, label, tên và mã quan trọng |
| **Tầng 2** | **Phụ** | `#111827` | `#E2E8F0` | `.text-sub` | Metadata, mô tả phụ, vai trò, thông tin bổ sung |
| **Tầng 3** | **Hỗ trợ** | `#1F2937` | `#CBD5E1` | `.text-helper` | Helper text, ghi chú, thông tin ít ưu tiên nhưng vẫn phải đọc rõ |
| **Tầng 4** | **Placeholder / disabled** | `#475569` | `#94A3B8` | `.text-placeholder` | Chỉ placeholder, trường khóa và nội dung thật sự không khả dụng |
| **Nghịch đảo** | **Chữ trên nền đậm** | `#FFFFFF` | `#FFFFFF` | `.text-inverse` | Nút Primary, pill solid và header nền màu |

### 6.2 Token CSS bắt buộc

| Token CSS | Light | Dark | Vai trò |
|---|---|---|---|
| `--ui-text-primary` | `#020617` | `#F8FAFC` | Tiêu đề, KPI, tên và nội dung chính |
| `--ui-text-body` | `#020617` | `#F8FAFC` | Nội dung và dữ liệu thông thường |
| `--ui-text-secondary` | `#111827` | `#E2E8F0` | Metadata và mô tả phụ |
| `--ui-text-muted-soft` | `#1F2937` | `#CBD5E1` | Helper và ghi chú vẫn cần đọc |
| `--ui-text-disabled` | `#475569` | `#94A3B8` | Chỉ placeholder/disabled |

### 6.3 Ánh xạ utility cũ

Trong giai đoạn chuyển đổi, global CSS phải ánh xạ utility cũ vào token semantic để không có trang nhỏ hoặc component gián tiếp bị bỏ sót:

- `text-slate-900/800` và `text-gray-900/800` → `--ui-text-primary`.
- `text-slate-700/600` và `text-gray-700/600` → `--ui-text-secondary`.
- `text-slate-500/400/300` và nhóm Gray tương ứng → `--ui-text-muted-soft`.
- Placeholder và form control disabled → `--ui-text-disabled`, không phụ thuộc utility màu cũ.
- Màu semantic blue/emerald/amber/rose, chữ trắng trên nền đậm và dark surface chuyên biệt không bị remap.

### 6.4 Nguyên tắc sử dụng và WCAG

- Nội dung cần đọc không được nhạt hơn `#1F2937` trên nền sáng.
- `#475569` chỉ được dùng cho placeholder hoặc disabled; không dùng cho body, bảng, menu, label hay metadata thông thường.
- Không dùng opacity trên container để làm mờ cả chữ; phải gán semantic color trực tiếp cho phần tử cần giảm nhấn mạnh.
- Không dùng `#000000` tuyệt đối; `#020617` là màu xanh đen mặc định của hệ thống.
- Dùng utility semantic (`text-main`, `text-sub`, `text-helper`, `text-placeholder`, `text-inverse`) thay vì tự chọn mã màu.
- Chữ thường phải đạt WCAG AA tối thiểu; nội dung nhỏ ưu tiên tỷ lệ tương phản AAA khi có thể.
- File xuất Word/PDF và Excel giữ quy chuẩn màu/font riêng, không áp dụng remap Web UI.

### 6.5 Tỷ lệ tương phản đã xác minh

| Token | Nền kiểm tra | Tỷ lệ tương phản |
|---|---|---:|
| `#020617` | `#FFFFFF` | `20.17:1` |
| `#111827` | `#FFFFFF` | `17.74:1` |
| `#1F2937` | `#FFFFFF` | `14.68:1` |
| `#475569` | `#FFFFFF` | `7.58:1` |
| `#F8FAFC` | `#020617` | `19.28:1` |
| `#E2E8F0` | `#020617` | `16.36:1` |
| `#CBD5E1` | `#020617` | `13.59:1` |
| `#94A3B8` | `#020617` | `7.87:1` |

Tất cả các cặp trung tính chuẩn đều vượt WCAG AAA cho văn bản thường. Màu semantic phải được kiểm tra riêng trên đúng nền sử dụng.

## 7. Quy chuẩn nút bấm

### Kích thước chuẩn

| Variant | Chiều cao | Vai trò & Ví dụ thực tế |
|---|---:|---|
| `xs` | 32px | Thao tác phụ cực gọn, badge hành động micro |
| `sm` | 36px | Nút phụ, `Đóng`, `Hủy`, thao tác nhỏ |
| `md` (mặc định) | 40px | Nút thao tác bảng, toolbar, `Bộ lọc`, `Lọc kết quả`, `Xuất Excel` |
| `lg` | 44px | Nút hành động chính của trang (Primary CTA), `Đăng nhập`, `Tạo lịch thi` |
| `icon` | 36×36px | Chuông thông báo, thao tác icon nhỏ |
| `icon-lg` | 40×40px | Làm mới, xem dạng lưới/danh sách |

Mobile áp dụng vùng chạm tối thiểu 44px (touch target), kể cả khi variant desktop là `xs`, `sm` hoặc icon.

### Ví dụ trong hệ thống

| Nút | Chuẩn |
|---|---|
| `Đăng nhập với Google` | `lg`, 44px |
| `Đăng nhập` | `lg`, 44px |
| `Tạo lịch thi` | `lg`, 44px (Primary CTA) |
| `Lọc kết quả` | `md`, 40px |
| `Bộ lọc` | `md`, 40px |
| `Mới nhất`, `Chọn cột` | `md`, 40px |
| `Xuất Excel`, `In báo cáo` | `md`, 40px |
| `Đóng`, `Hủy` | `sm`, 36px |
| Chuông thông báo | `icon`, 36×36px |
| Làm mới, xem dạng lưới | `icon-lg`, 40×40px |

### Hình dạng và typography

- Nút/control thông thường dùng `rounded-xl` — 12px.
- **Ngoại lệ bo góc:**
  - **Status pill & Filter Chip / Capsule Tab:** Bắt buộc dùng `rounded-full` (dạng viên thuốc) cho các nhãn trạng thái và các nút lọc danh mục cuộn ngang (VD: `[ Tất cả 129 ]`, `[ Giảng viên 30 ]`). Dạng viên thuốc giúp người dùng phân biệt rõ giữa "công cụ lọc dữ liệu (Filter)" và "nút bấm thực thi hành động (Action Button)".
  - **Identifier badge (mã sinh viên, mã môn, mã đề), submenu và tooltip:** Được phép dùng `rounded-lg` (8px).
  - **Thanh trượt Segmented Control (`SlidingSegmentedControl`) & Dải tab lọc:** Khung rãnh vỏ ngoài giữ dáng thanh hộp `rounded-2xl` (16px) với đệm `p-1`, **chỉ có viên trượt active và các nút chọn bên trong là `rounded-full` (dạng viên thuốc Capsule)** để viên trượt tròn lướt mượt mà bên trong rãnh hộp mà không ép khung ngoài phải bo tròn giống hệt ruột.
- Chữ button: 15px, weight 600, line-height khoảng 22–24px.
- Khoảng cách icon và chữ: 8px.
- Padding ngang: khoảng 12–18px tùy kích thước.
- **Quy tắc "Một nút Primary":** Chỉ có duy nhất 1 nút Primary trong cùng một nhóm thao tác hoặc một vùng chức năng (Toolbar, Modal Footer, Form Action Bar). Không cấm việc một trang có nhiều nút Primary ở các khối chức năng tách biệt.
- **Quy tắc Gradient & Ngoại lệ:** Không lạm dụng gradient trong màn hình quản trị và bảng dữ liệu; ngoại lệ cho phép: Trang đăng nhập (Login), Khu vực thương hiệu và Nút Active Tab trên Sidebar.
- Không dùng chữ IN HOA toàn bộ cho button thông thường.
- Không dùng `rounded-full` cho button hành động thông thường (Lưu, Thêm, Xóa, Gửi...).

### 7.1 Bảng phân cấp 5 bậc nút bấm (Button Hierarchy System 2026)

| Bậc | Phân loại | Quy cách thị giác (Visual Specs) | Quy tắc Icon & Viền | Khi nào sử dụng (Use Cases) | Ví dụ thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bậc 1** | **Primary CTA** *(Nút chính)* | • **Nền**: Xanh dương đậm `#2563EB` (`bg-primary-600 hover:bg-primary-700`)<br>• **Chữ**: Trắng `#FFFFFF` (`text-white font-semibold`)<br>• **Viền**: Không viền (`border-transparent`)<br>• **Đổ bóng**: `shadow-2xs` | • Có thể có icon dấu `+` hoặc icon xác nhận.<br>• **Chỉ có 1 nút Primary** trong 1 nhóm thao tác. | Hành động chủ đạo, quan trọng nhất của trang, form hoặc modal. | `[ + Phân công ]`<br>`[ + Thêm câu hỏi ]`<br>`[ Lưu thay đổi ]` |
| **Bậc 2** | **Soft Accent** *(Phụ thông minh)* | • **Nền**: Xanh nhạt vừa vặn (`bg-blue-100 dark:bg-blue-900/40`, hover/active `bg-blue-200/90`)<br>• **Chữ**: Xanh đậm (`text-blue-700`, hover/active `text-blue-800 font-semibold`)<br>• **Viền**: **Không viền** (`border-transparent`) | • **KHÔNG DÙNG ICON** (thuần chữ thanh thoát).<br>• Đứng cạnh nút Primary mà không tranh chấp độ nổi bật. | Các tính năng bổ trợ đặc biệt, thuật toán, tự động hóa, sinh đề, xem trước. | `[ Tự động ]`<br>`[ Sinh ma trận ]`<br>`[ Xem trước ]` |
| **Bậc 3** | **Secondary** *(Thao tác chuẩn)* | • **Nền**: Trắng / Xám rất nhạt (`bg-white hover:bg-slate-50 dark:bg-slate-900`)<br>• **Chữ**: Deep Ink (`text-slate-800 dark:text-slate-100 font-semibold`, được remap qua token)<br>• **Viền**: Viền mảnh (`border border-slate-200/90 dark:border-slate-700`) | • Thường đi kèm icon chức năng phía trước (Lọc, Cột, Excel, In). | Bộ lọc, Sắp xếp cột, Xuất Excel, In ấn, Tải mẫu biểu. | `[ Bộ lọc ]`<br>`[ Xuất Excel ]`<br>`[ Chọn cột ]` |
| **Bậc 4** | **Ghost / Text** *(Phụ tối giản)* | • **Nền**: Trong suốt (`bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800`)<br>• **Chữ**: Xám trung tính (`text-slate-600 dark:text-slate-400 font-medium`)<br>• **Viền**: **Không viền** | • Không icon hoặc chỉ có icon đóng `✕`. | Đóng modal, Hủy thao tác, Quay lại, Đặt lại bộ lọc. | `[ Đóng ]`<br>`[ Hủy ]`<br>`[ Bỏ qua ]` |
| **Bậc 5** | **Danger** *(Nguy hiểm)* | • **Nền**: Đỏ tươi `#EF4444` hoặc Nền trắng viền đỏ (`bg-white text-danger-600 border-rose-200`)<br>• **Chữ**: Trắng hoặc Đỏ đậm | • Icon thùng rác `Trash2` hoặc cảnh báo.<br>• Luôn đặt tách biệt để tránh bấm nhầm. | Xóa vĩnh viễn, Hủy phân công, Từ chối phúc khảo. | `[ Xóa ca thi ]`<br>`[ Hủy phân công ]` |

### Variant màu Button.tsx

- `primary`: nền xanh dương đậm, chữ trắng, dùng cho action chính.
- `soft`: nền xanh nhạt (`bg-blue-100`), chữ xanh đậm (`text-blue-700`), hover/active sang `bg-blue-200 text-blue-800`, **không viền**, **không icon**, dùng cho tính năng tự động / hỗ trợ đặc biệt.
- `secondary` / `outline`: nền trắng, viền nhẹ, chữ đậm.
- `ghost`: nền trong suốt, dùng cho action phụ.
- `danger`: đỏ, dùng cho xóa hoặc thao tác nguy hiểm.
- `danger-outline`: nền trắng viền đỏ, chữ đỏ.
- `success`: xanh lá, dùng cho xác nhận thành công.
- `warning`: vàng hổ phách, dùng cho cảnh báo.

### Trạng thái

Mỗi button có khả năng tương tác phải có:

- Normal.
- Hover.
- `focus-visible` rõ ràng.
- Active, có thể giảm nhẹ scale khoảng `0.98`.
- Disabled, giảm tương phản nhưng vẫn đọc được.
- Loading, hiển thị spinner và khóa button.

Loading phải thực sự đặt `disabled` để tránh gửi trùng thao tác.

## 8. Quy chuẩn control

Áp dụng cho input, select, search, filter, dropdown và pagination:

- Bo góc `rounded-xl`.
- Chiều cao mặc định 40px.
- Mobile tối thiểu 44px.
- Font 15px, Inter.
- Có trạng thái focus-visible/focus rõ ràng.
- Search có icon đặt đúng trục giữa, không chồng lên text.
- Select/dropdown chỉ có một mũi tên, không lồng hai lớp control.
- Không tạo thêm khung ngoài nếu component bên trong đã có khung.
- Không để nút hành động bị trôi lửng giữa vùng filter; căn theo cùng trục control.

## 9. Nội dung button

Button phải ngắn gọn theo cấu trúc:

```text
Động từ + đối tượng
```

Nên dùng:

- `Tạo lịch thi`.
- `Lọc kết quả`.
- `Xuất Excel`.
- `Xem chi tiết`.
- `Đăng nhập`.
- `Chăm sóc khách hàng`.

Không nên dùng câu giải thích dài trong button. Nếu nội dung dài:

- Rút gọn label.
- Đưa phần giải thích ra helper text, tooltip hoặc modal.
- Tránh để button tự xuống nhiều dòng.

Ví dụ:

```text
Đăng nhập tài khoản nội bộ → Đăng nhập nội bộ
Tạo bản Backup ngay         → Tạo bản sao lưu
```

## 10. Bố cục và phân chia nhóm nút (2 nút / 3 nút trên một hàng)

### Quy tắc cốt lõi:
1. **Chỉ có DUY NHẤT 1 nút Primary** trong một cụm nhóm nút.
2. **Đồng nhất kích thước:** Tất cả các nút trong cùng một hàng phải có **cùng chiều cao** (`h-10` hoặc `h-11`) và **cùng bo góc** `rounded-xl`.
3. **Khoảng cách:** Dùng `gap-2` (8px) cho toolbar danh sách hoặc `gap-3` (12px) cho modal footer / form actions.

---

### A. Khi có 2 nút (Modal Footer / Form Actions)

- **Thứ tự chuẩn:** Nút phụ (Secondary/Ghost) đứng trước ➔ Nút chính (Primary) đứng sau (ngoài cùng bên phải).
- **Phân cấp:** Nút Hủy dùng `secondary` hoặc `ghost`; nút Hành động chính dùng `primary`.

```text
[ Hủy (Secondary) ]   [ Lưu thay đổi (Primary) ]
```

```tsx
<div className="flex items-center justify-end gap-3 pt-4">
  <Button variant="secondary" onClick={onClose}>Hủy</Button>
  <Button variant="primary" onClick={onSave}>Lưu thay đổi</Button>
</div>
```

---

### B. Khi có 3 nút

#### 1. Mô hình Tiến trình Form (Hủy ➔ Lưu nháp ➔ Xuất bản/Lưu)
- Căn phải (`justify-end`), độ ưu tiên tăng dần từ trái sang phải: `Ghost` ➔ `Secondary` ➔ `Primary`.

```text
[ Hủy (Ghost) ]   [ Lưu nháp (Secondary) ]   [ Xuất bản (Primary) ]
```

```tsx
<div className="flex items-center justify-end gap-2.5">
  <Button variant="ghost" onClick={onCancel}>Hủy</Button>
  <Button variant="secondary" onClick={onSaveDraft}>Lưu nháp</Button>
  <Button variant="primary" onClick={onPublish}>Xuất bản</Button>
</div>
```

#### 2. Mô hình có Thao tác Nguy hiểm (Xóa vs Hủy / Lưu)
- **Quy tắc an toàn:** Nút `Danger` (Xóa) PHẢI nằm tách biệt hẳn về bên trái (`justify-between`), cách xa cụm nút Xác nhận để tránh bấm nhầm.

```text
[ 🗑️ Xóa bản ghi (Danger) ]                  [ Hủy (Secondary) ] [ Cập nhật (Primary) ]
|<----------- Trái ----------->|             |<---------------- Phải ---------------->|
```

```tsx
<div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
  <Button variant="danger-outline" onClick={onDelete}>Xóa bản ghi</Button>
  <div className="flex items-center gap-2">
    <Button variant="secondary" onClick={onClose}>Hủy</Button>
    <Button variant="primary" onClick={onUpdate}>Cập nhật</Button>
  </div>
</div>
```

#### 3. Mô hình Thanh công cụ Chấm thi / Trợ lý AI (Ghost ➔ Secondary ➔ Primary)
- Phân cấp 3 bậc thị giác: Thao tác gợi ý/trợ lý (`ghost` - phẳng) ➔ Lưu nháp/tiến độ (`secondary` - viền) ➔ Chốt hành động duyệt/hoàn tất (`primary` - đặc).

```text
[ Mẫu chấm AI (Ghost) ]   [ Lưu điểm (Secondary) ]   [ Gửi duyệt (Primary) ]
```

```tsx
<div className="flex items-center gap-2">
  <Button variant="ghost" size="sm" onClick={handleAiSuggest}>Mẫu chấm AI</Button>
  <Button variant="secondary" size="sm" onClick={handleSave}>Lưu điểm</Button>
  <Button variant="primary" size="sm" onClick={handleSubmit}>Gửi duyệt</Button>
</div>
```

#### 4. Mô hình Toolbar / Bộ lọc trang danh sách
- Các nút bổ trợ là `secondary`, nút thêm mới chính là `primary`.

```text
[ Xuất Excel (Secondary) ]   [ Nhập CSV (Secondary) ]   [ + Tạo mới (Primary) ]
```

```tsx
<div className="flex items-center gap-2">
  <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Xuất Excel</Button>
  <Button variant="secondary" leftIcon={<Upload className="w-4 h-4" />}>Nhập CSV</Button>
  <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Tạo mới</Button>
</div>
```

---

### C. Xử lý trên Mobile (< 768px)
- **Modal footer:** Dùng `flex-col-reverse` (Nút Primary lên trên cùng để ngón tay cái dễ thao tác nhất, nút Hủy nằm dưới cùng).
- **Toolbar:** Gom các nút `secondary` vào menu `...` (More Actions), chỉ giữ lại nút `Primary` trên hàng.

## 11. Phân định vai trò Header & Sidebar (Header-First Profile)

Để tránh hiện tượng **trùng lặp Avatar và Menu người dùng gây rối mắt**, hệ thống tuân theo chuẩn **Header-First Profile**:

1. **Header (Góc trên bên phải):**
   - Là **Trung tâm tài khoản duy nhất** của toàn hệ thống (Global User Account Hub).
   - Chứa: Avatar người dùng + Tên + Role label, Chuông thông báo (Notifications), Tìm kiếm nhanh (Ctrl+K).
   - Dropdown tài khoản: Hồ sơ cá nhân, Cài đặt, Trung tâm hỗ trợ, Chủ đề giao diện (Dark mode), Đăng xuất.

2. **Sidebar (Thanh bên trái):**
   - Chức năng cốt lõi thuần túy là **Điều hướng danh mục hệ thống (Navigation Bar)**.
   - **Màu chữ dùng chung:** Mọi chữ điều hướng không active bắt buộc dùng utility `sidebar-text`, lấy từ token `--sidebar-text`: `#020617` ở light mode và `#F8FAFC` ở dark mode. Không tự chọn `text-slate-*` cho từng mục.
   - **Màu icon dùng chung:** Icon không active dùng `sidebar-icon`, lấy từ token `--sidebar-icon`: `#111827` ở light mode và `#CBD5E1` ở dark mode.
   - **Trạng thái active/hover:** Dùng `--sidebar-active`: `#2563EB` ở light mode và `#60A5FA` ở dark mode; mục active có nền xanh được phép dùng chữ trắng `--sidebar-text-inverse`.
   - Phân cấp giữa thương hiệu, nhóm menu, menu chính, submenu và metadata phải dựa chủ yếu vào cỡ chữ, weight, vị trí và spacing; không tạo thêm nhiều cấp màu xám.
   - **Chân Sidebar (Footer):** Thiết kế tối giản (Minimal Footer):
     - Chỉ hiển thị trạng thái hệ thống (`● Hệ thống trực tuyến`) và liên kết hỗ trợ nhanh khi mở rộng.
     - Thu gọn thành chấm xanh hiển thị trạng thái khi Sidebar ở chế độ `collapsed`.
     - **Tuyệt đối KHÔNG** lặp lại khối Avatar + Popover Menu người dùng ở chân Sidebar.

## 12. Icon-only và accessibility

Button chỉ có icon bắt buộc có một trong các thông tin sau:

- `aria-label`.
- Tooltip hoặc `title` mô tả rõ hành động.

Toggle nên có:

- `role="switch"`.
- `aria-checked`.
- `aria-label`.

Không dùng icon để thay thế label khi hành động không rõ nghĩa.

## 12. Ngoại lệ được phép

`rounded-full` chỉ được dùng có chủ đích cho:

- Avatar.
- Badge hoặc status dot.
- Toggle/switch.
- Nút chat hoặc floating action button.
- Nút xóa media rất nhỏ, 20×20px.
- Spinner, progress bar và thành phần hình tròn thuần trang trí.

Các ngoại lệ vẫn phải có accessibility phù hợp nếu là phần tử tương tác.

## 13. Hiệu ứng và phản hồi

- Transition ngắn, khoảng 150–200ms.
- Ưu tiên transition màu nền, border, shadow, opacity và transform.
- Hover phải cho thấy khả năng tương tác nhưng không nhảy layout.
- Active chỉ scale nhẹ, không làm nút biến dạng.
- Hỗ trợ `prefers-reduced-motion`.
- Không dùng hiệu ứng chớp, rung hoặc gradient quá mạnh cho thao tác thông thường.

## 14. Quy chuẩn Bố cục Phẳng & Hạn chế Khung Hộp (Flat Layout & Divider-First)

Nhằm đảm bảo giao diện luôn thanh thoát, hiện đại, thoáng đãng và không bị nặng nề bởi các khối hộp xếp chồng lên nhau:

### 14.1 Nguyên tắc cốt lõi
- **Hạn chế tối đa việc lồng nhiều khung hộp (Nested card boxes):** Tránh chia nhỏ từng dòng, từng tiêu chí, từng trường thông tin thành các ô card bo góc riêng biệt có nền xám và viền dày.
- **Ưu tiên đường kẻ ngang tinh tế (Divider-First):** Thay thế các khung hộp con bằng bố cục phẳng, phân tách các hàng/mục bằng đường kẻ ngang mờ (`divide-y divide-slate-100 dark:divide-slate-800/80` hoặc `border-t border-slate-100 dark:border-slate-800`).

### 14.2 Áp dụng cụ thể
1. **Danh sách nhiều mục (Criteria / Sub-items / Attributes):**
   - Gom toàn bộ vào 1 khối phẳng duy nhất.
   - Mỗi mục là một hàng linh hoạt có số thứ tự nhỏ gọn, tên tiêu đề (`15px font-semibold`), mô tả phụ bên dưới (`14px text-slate-500`) và giá trị/điểm số căn phải thẳng hàng.
   - Phân cách giữa các hàng bằng `divide-y divide-slate-100 dark:divide-slate-800/80`.
2. **Phân cách giữa các khối nội dung lớn (Sections):**
   - Sử dụng `border-t border-slate-100 dark:border-slate-800 pt-3.5` (hoặc `pt-4`) kèm tiêu đề Sentence case có thanh chỉ báo xanh nhỏ (`h-4 w-1 rounded-full bg-blue-600`).
   - Tuyệt đối không dùng chữ IN HOA toàn bộ cho tiêu đề section (Ví dụ: dùng `Đề bài câu hỏi`, `Đáp án mẫu & Hướng dẫn giải` thay vì `ĐỀ BÀI CÂU HỎI`).
3. **Thanh trạng thái & Cảnh báo inline (Status / Notice bars):**
   - Không dùng nền màu đặc đậm (`bg-amber-50`, `bg-emerald-50`) đóng khung to chắn giữa màn hình nếu không phải là Alert quan trọng cấp hệ thống.
   - Ưu tiên dòng trạng thái phẳng, trong suốt (`py-1 text-xs/text-sm font-semibold` kèm icon semantic `CheckCircle2` / `AlertTriangle`).

---

## 15. Checklist trước khi hoàn thành màn hình

### Typography

- [ ] Web UI dùng Inter.
- [ ] Chữ chính không quá nhạt.
- [ ] Không có weight dưới 400.
- [ ] Button/control dùng 15px.
- [ ] Table body dùng 15px.
- [ ] Không dùng chữ IN HOA tùy tiện.

### Bố cục & Giao diện phẳng

- [ ] Không lồng nhiều khung hộp (card boxes) con bên trong modal/drawer.
- [ ] Danh sách nhiều mục dùng đường kẻ ngang (`divide-y`) thay vì bọc từng card riêng.
- [ ] Tiêu đề Section viết Sentence case, có thể dùng thanh nhấn xanh (`h-4 w-1 bg-blue-600`); thanh trang trí này không được gọi hoặc xử lý như status pill.
- [ ] Thanh trạng thái/khớp điểm inline phẳng, không dùng nền hộp thô.

### Màu sắc & Trạng thái (Color & Status)

- [ ] Nền trang, card, control giữ trắng và trắng xanh (`bg-white`, `bg-slate-50/50`).
- [ ] Không dùng màu trạng thái (xanh lá, đỏ, cam) làm nền lớn toàn trang.
- [ ] Không dùng xanh lá, đỏ, cam cho nội dung thông thường (chỉ dùng Deep Ink).
- [ ] Màu trạng thái chỉ dùng cho icon, chữ chỉ báo trạng thái, viền hoặc nền nhạt.
- [ ] Nút trạng thái nền đậm bắt buộc dùng chữ màu trắng (`text-white`).
- [ ] Chữ màu vàng/cam trên nền trắng đạt tương phản WCAG AA ($\ge 4.5:1$, dùng `text-amber-700` hoặc `text-amber-800`).

### Button/control

- [ ] Nút chính cao 44px.
- [ ] Filter/search/select cao 40px.
- [ ] Nút phụ cao 36px.
- [ ] Nút icon cao 36 hoặc 40px.
- [ ] Tất cả dùng `rounded-xl`, trừ ngoại lệ được nêu rõ.
- [ ] Nhóm 2-3 nút: Chỉ có 1 Primary, cùng chiều cao, nút Danger tách biệt sang trái.
- [ ] Có hover, focus-visible, active, disabled và loading.
- [ ] Loading khóa nút.
- [ ] Icon-only có nhãn hoặc tooltip.
- [ ] Button không chứa câu dài.

### Layout và responsive

- [ ] Không có hai khung ngoài lồng nhau không cần thiết.
- [ ] Không có hai mũi tên trong cùng một select/dropdown.
- [ ] Nút được căn cùng trục với control liên quan.
- [ ] Mobile đạt vùng chạm tối thiểu 44px.
- [ ] Không bị tràn chữ hoặc vỡ layout ở text dài.

## 16. Lệnh kiểm tra kỹ thuật

Chạy trong thư mục `frontend`:

```bash
npm run audit:ui
npx tsc --noEmit --incremental false --pretty false
npm run lint -- --no-cache
npm run build
npm run audit:ui:artifact
```

Khi kiểm tra thủ công, dùng DevTools → Computed Styles và xác nhận:

- `font-family` bắt đầu bằng Inter hoặc font Inter do `next/font` sinh ra.
- Light mode: body/nội dung chính có `color: rgb(2, 6, 23)` (`#020617`).
- Light mode: chữ phụ có `color: rgb(17, 24, 39)` (`#111827`); helper có `rgb(31, 41, 55)` (`#1F2937`).
- Light mode: chỉ placeholder/disabled được dùng `rgb(71, 85, 105)` (`#475569`) và vẫn phải có `opacity: 1`.
- Dark mode: chữ chính/phụ/helper lần lượt là `#F8FAFC`, `#E2E8F0`, `#CBD5E1`; placeholder/disabled là `#94A3B8`.
- Không có nội dung bình thường nào bị giảm độ rõ bằng `opacity < 1` trên phần tử cha.
- Button/control có `font-size: 15px`.
- Button có `font-weight: 600`.
- Border radius là 12px tương ứng `rounded-xl`.
- Chiều cao đúng variant.
- Focus-visible hiển thị rõ.

Sau khi chạy dev hoặc build, CSS artifact phải chứa đủ:

- `--ui-text-primary`, `--ui-text-secondary`, `--ui-text-muted-soft`, `--ui-text-disabled` với đúng giá trị light/dark.
- Selector gốc `.typography-scale` và remap utility trung tính cho light/dark.
- Placeholder và control disabled dùng `--ui-text-disabled` kèm `opacity: 1 !important`.
- Contract `.ui-pill`, `.ui-pill:not(.ui-pill-solid)` và `.ui-pill-solid`.

Không kết luận hoàn thành nếu source đạt nhưng CSS artifact thiếu một trong các contract trên, hoặc chưa xác minh được Computed Styles của màn hình đại diện cho Admin, Giảng viên và Sinh viên.

## 17. Nguyên tắc ưu tiên

Khi có xung đột, ưu tiên theo thứ tự:

```text
Đúng nghiệp vụ
→ An toàn và accessibility
→ Nhất quán shared component/token
→ Dễ đọc, dễ dùng
→ Responsive
→ Hiệu ứng trang trí
```

Không chỉnh từng page riêng nếu có thể chuẩn hóa ở shared component hoặc token dùng chung.

## 18. Quy tắc Sử dụng Màu sắc & Màu Trạng thái (Color Usage & Semantic Status System)

Nhằm đảm bảo giao diện luôn trang nhã, chuyên nghiệp, dịu mắt và đạt chuẩn tiếp cận WCAG AA:

### 18.1 Bảng màu chốt 5 nhóm trạng thái (Outline-first)

Status pill mặc định không dùng nền màu. Màu semantic được thể hiện bằng chữ, viền và icon/chấm trạng thái để giao diện xanh–trắng luôn gọn, không xuất hiện quá nhiều mảng màu cạnh tranh nhau.

| Nhóm ý nghĩa | Ví dụ nghiệp vụ | Chữ sáng/tối | Viền sáng/tối | Nền đặc khi được phép nhấn mạnh |
|---|---|---|---|---|
| **Trung tính** | Bản nháp, Chưa bắt đầu, Lưu trữ, Đã khóa, Chưa công bố | `text-slate-700 dark:text-slate-300` | `border-slate-300 dark:border-slate-600` | `bg-slate-700 text-white` |
| **Thông tin / Đang xử lý** | Đang diễn ra, Đang tải, Đã lên lịch, Đang chấm thi, Đang chạy, Cần chỉnh sửa | `text-blue-700 dark:text-blue-400` | `border-blue-300 dark:border-blue-700` | `bg-blue-600 text-white` |
| **Chờ xử lý** | Chờ duyệt, Chờ xác nhận, Cần bổ sung, Đang xem xét, Chờ xác minh | `text-amber-700 dark:text-amber-400` | `border-amber-400 dark:border-amber-700` | `bg-amber-600 text-white` |
| **Thành công** | Đã duyệt, Đã hoàn thành, Đã nộp, Đã công bố, Đạt, Thành công, Đang hoạt động | `text-emerald-700 dark:text-emerald-400` | `border-emerald-400 dark:border-emerald-700` | `bg-emerald-600 text-white` |
| **Lỗi / Nguy hiểm** | Bị từ chối, Thất bại, Đã hủy, Bị khóa, Không đạt, Vắng thi | `text-rose-700 dark:text-rose-400` | `border-rose-400 dark:border-rose-700` | `bg-rose-600 text-white` |

### 18.2 Hai Hình Thức Hiển Thị của `StatusBadge`

1. **`variant="dot"` (mặc định trong bảng/danh sách):** `[Chấm tròn màu] [Chữ]`. Dùng `text-type-badge`, `font-medium`; hiển thị phẳng, không bọc thêm nền hoặc card.
2. **`variant="pill"` (drawer, card chi tiết, bộ lọc, bộ đếm tab và summary chip):** dùng contract `ui-pill`, `rounded-full`, viền 1px, `text-type-helper` (13px/18px), `font-medium` (500), padding tham chiếu `px-2.5 py-1` hoặc `px-2 py-0.5` khi cần gọn trong bảng.

#### Outline và solid

- `emphasis="outline"` là mặc định: nền trong suốt, chữ và viền theo màu semantic.
- `emphasis="solid"` phải khai báo rõ bằng `ui-pill-solid`; nền màu đậm và chữ trắng.
- Chỉ dùng solid cho trạng thái đang được chọn, trạng thái chính cần nhấn mạnh hoặc cảnh báo khẩn cấp.
- Trong cùng một nhóm thị giác chỉ có tối đa **một** pill solid. Các pill còn lại phải dùng outline.
- Không dùng nền pastel (`bg-*-50`, `bg-*-100`) làm mặc định cho status pill.
- Không dùng `font-semibold` hoặc `font-bold` cho pill; pill luôn dùng weight 500.

```tsx
<StatusBadge status="APPROVED" variant="pill" />

<StatusBadge
  status="IN_PROGRESS"
  variant="pill"
  emphasis="solid"
/>
```

Với nhãn viết trực tiếp chưa thể dùng `StatusBadge`, phải khai báo đủ contract:

```tsx
<span className="ui-pill rounded-full border border-blue-300 px-2.5 py-1 text-type-helper font-medium text-blue-700">
  Đang xử lý
</span>
```

### 18.3 Các Nơi NÊN DÙNG Badge Trạng Thái
- **Kỳ thi:** Nháp (`DRAFT`), Sắp diễn ra (`UPCOMING`), Đang diễn ra (`ONGOING`), Đã kết thúc (`COMPLETED`), Đã hủy (`CANCELLED`).
- **Câu hỏi:** Chờ duyệt (`PENDING`), Đã duyệt (`APPROVED`), Bị từ chối (`REJECTED`), Cần chỉnh sửa (`CHANGE_REQUESTED`).
- **Đề thi:** Bản nháp (`DRAFT`), Đã phát hành (`PUBLISHED`), Đã khóa (`LOCKED`), Đã hủy (`CANCELLED`).
- **Lịch thi:** Chưa bắt đầu (`NOT_STARTED`), Đang diễn ra (`IN_PROGRESS`), Đã hoàn tất (`COMPLETED`), Đã hủy (`CANCELLED`).
- **Sao lưu:** Đang chờ (`PENDING`), Đang chạy (`RUNNING`), Thành công (`SUCCEEDED`), Thất bại (`FAILED`).
- **Tài khoản:** Đang hoạt động (`ACTIVE`), Chờ xác minh (`PENDING_VERIFY`), Bị khóa (`LOCKED`), Không hoạt động (`INACTIVE`).
- **Phúc khảo:** Mới gửi (`NEW`), Đang xử lý (`PROCESSING`), Đã chấp nhận (`ACCEPTED`), Đã từ chối (`REJECTED`).
- **Kết quả:** Đã công bố (`PUBLISHED`), Chưa công bố (`UNPUBLISHED`), Đạt (`PASSED`), Không đạt (`NOT_PASSED`/`FAILED`).

### 18.4 Tuyệt Đối KHÔNG DÙNG Badge Cho
- **Mã kỹ thuật:** Mã `KT-1`, mã sinh viên `SV...`, mã ca thi `LCT...`, mã câu hỏi `Q...` ➔ Dùng `IdentifierBadge` với Inter, `tabular-nums`, màu Deep Ink (`text-slate-900 dark:text-slate-100`); không gắn class `ui-pill`. Khi ở dạng phẳng trong cột bảng, áp dụng cỡ chữ chuẩn **15px** (`text-type-body`) để cân đối với hàng dữ liệu, không dùng khung hộp xám 13px gây lọt thỏm.
- **Tên khoa, tên môn học:** Dùng typography thường (`text-slate-900` / `text-slate-700`).
- **Số lượng, điểm số, ngày tháng:** Dùng text thường kèm `tabular-nums`.
- **Nút hành động:** Bắt buộc dùng component `Button`.
- **Nội dung mô tả thông thường:** Dùng văn bản chuẩn.

### 18.5 Nền trang & Nút trạng thái
- **Nền trang, card, control:** Vẫn giữ nguyên nền trắng (`bg-white`) và trắng xanh (`bg-slate-50`, `bg-slate-50/50`). Tuyệt đối KHÔNG dùng màu trạng thái làm nền lớn toàn trang.
- **Nút thao tác semantic:** Nếu là hành động có thể bấm, phải dùng `Button`, bo góc `rounded-xl`; không dùng status pill để giả làm button.
- **Pill nền đặc:** Chỉ dùng theo điều kiện `emphasis="solid"` tại mục 18.2 và bắt buộc có chữ trắng.

### 18.6 Phân biệt hình dạng bắt buộc

| Thành phần | Bo góc | Cỡ chữ & Ghi chú |
|---|---|---|
| Status pill, filter chip, tab count | `rounded-full` | Dùng `ui-pill`, 13px (`text-type-helper`), font-medium (500) |
| Identifier badge, mã kỹ thuật phẳng | `rounded-lg` | Cột bảng: 15px (`text-type-body`); inline phụ: 13px (`text-type-helper`); `tabular-nums`, Deep Ink |
| Button, input, select, search, dropdown trigger, Segmented control | `rounded-xl` | Control tương tác, chữ 15px (Segmented control: rãnh xám + phím trượt trắng 3D) |
| Card, modal, drawer panel | `rounded-2xl` | Container nội dung |

### 18.7 Checklist kiểm tra pill

- [ ] Có class `ui-pill` và `rounded-full`.
- [ ] Chữ dùng `text-type-helper`, `font-medium`, Inter.
- [ ] Outline là mặc định và không còn nền pastel không cần thiết.
- [ ] Pill có nền đặc phải có `ui-pill-solid` hoặc `emphasis="solid"`.
- [ ] Không có hơn một pill solid trong cùng nhóm thị giác.
- [ ] Mã kỹ thuật dùng `IdentifierBadge`, không bị chuyển thành status pill.
- [ ] Button/control không bị chuyển thành `rounded-full`.
- [ ] Chạy `npm run audit:ui` sau khi chỉnh sửa.

## 19. Quy tắc Chuẩn Hóa Nhãn Hành Động (Action Dropdown & Confirm Modals)

Nhằm đảm bảo giao diện luôn tinh gọn, hiện đại và nhất quán 100% trên tất cả các trang quản lý:

### 19.1 Nhãn Thao Tác trong Dropdown Menu Dòng Bảng (Row Actions)
Vì người dùng đã ở trong ngữ cảnh trang quản lý của đối tượng, Dropdown menu bắt buộc dùng **Động từ ngắn gọn chuẩn mực**, tuyệt đối không thêm đuôi đối tượng dài dòng:
- 👁️ **`Xem chi tiết`** (áp dụng đồng nhất cho Sinh viên, Giảng viên, Môn học, Lớp, Phòng thi, Ca thi, Đề thi, Câu hỏi; không dùng "Xem hồ sơ" hay "Xem chi tiết ca thi").
- ✏️ **`Chỉnh sửa`** (không dùng "Chỉnh sửa ca thi", "Chỉnh sửa môn", "Chỉnh sửa phòng thi"...).
- 🗑️ **`Xóa`** (màu chữ & icon `text-rose-600 dark:text-rose-400`; không dùng "Xóa lịch thi", "Xóa môn học", "Xóa phòng thi"...).
- *(Trong Thùng rác)*:
  - 🔄 **`Khôi phục`** (Icon `RotateCcw`, chữ `text-blue-600 dark:text-blue-400`).
  - 💥 **`Xóa vĩnh viễn`** (Icon `Trash2`, chữ `text-rose-600 dark:text-rose-400`).
- *(Thao tác nghiệp vụ đặc thù)*:
  - 🔒 **`Khóa tài khoản`** / 🔓 **`Mở khóa tài khoản`**
  - 📦 **`Lưu trữ`**
  - ⚙️ **`Cấu hình Rubric`**
  - ✅ **`Phê duyệt`** / ❌ **`Từ chối`**

### 19.2 Style Quy Chuẩn cho Dropdown Menu Item
- Item bình thường: `flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer select-none`
- Item Danger (Xóa/Hủy): Nền trong suốt phẳng sạch sẽ, không dùng nền đỏ/hồng tĩnh hay khi hover (`hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-400 group`). Chữ & Icon bình thường màu trung tính (`text-slate-700 dark:text-slate-200`, icon `text-slate-400 dark:text-slate-500`), khi hover chuyển sang đỏ nổi bật (`group-hover:text-rose-600`).
- Đường kẻ phân cách trước nút Xóa: `<div className="my-1 border-t border-slate-100 dark:border-slate-800" />`

### 19.3 Tiêu Đề Modal Xác Nhận (ConfirmModal)
Ngược lại với Dropdown menu, tiêu đề của `ConfirmModal` khi xóa **bắt buộc nêu rõ tên đối tượng cụ thể** để người dùng không bấm nhầm:
- `Xóa ca thi?`, `Xóa phòng thi?`, `Xóa lớp học?`, `Xóa môn học?`, `Xóa sinh viên?`, `Xóa giảng viên?`, `Xóa kỳ thi?`, `Xóa câu hỏi?`, `Xóa đề thi?`.

## 20. Quy Chuẩn Phân Định 4 Nhóm Dữ Liệu Cốt Lõi (Data Entities System 2026)

Nhằm đảm bảo giao diện luôn mạch lạc, phẳng, thoáng đãng và không bị nhầm lẫn giữa Mã định danh, Trạng thái quy trình và Vai trò:

### 20.1 Bảng Phân Định 4 Nhóm

| Nhóm | Bản chất | Quy cách hiển thị chuẩn | Điều CẤM kỵ |
|---|---|---|---|
| **1. Mã định danh (Identifier)** | Mã kỹ thuật duy nhất: `LCT000122`, `GV017`, `SV2024001`, `KT-101`, `P201`, `Q-99` | Dùng `<IdentifierBadge tone="neutral">LCT000122</IdentifierBadge>`<br>• Cột bảng phẳng: cỡ chữ **15px** (`text-type-body`), `font-medium` (500) hoặc `font-semibold` (600)<br>• Font số `tabular-nums`, màu Deep Ink (`text-slate-900 dark:text-slate-100`) | ❌ **CẤM** nhét cả cụm `"Mã cán bộ:"`, `"Mã SV:"` vào trong badge.<br>❌ **CẤM** dùng `rounded-full` hoặc gắn chấm tròn `●`.<br>❌ **CẤM** bọc khung nền xám nhỏ 13px gây lọt thỏm khi chuyển sang bố cục phẳng. |
| **2. Trạng thái (Lifecycle Status)** | Tiến trình vòng đời: *Đã xác nhận, Chờ duyệt, Từ chối, Đang diễn ra, Đã khóa* | Dùng `<StatusBadge />`<br>• **Trong Bảng dữ liệu**: Bắt buộc dùng `variant="dot"` (`● Đã xác nhận`)<br>• **Trong Drawer / Card**: dùng `variant="pill"` (`rounded-full`, `ui-pill`) | ❌ **CẤM** dùng cho danh từ, vai trò hay chức danh cố định. |
| **3. Vai trò / Chức danh (Role & Position)** | Phân công vai trò: *Giám thị 1 (Chính), Giám thị 2 (Phụ), Trưởng điểm* | **Typography phân cấp phẳng** (Typography-First):<br>• `Giám thị 1 (Chính)`: chữ `text-slate-900 dark:text-slate-100 font-semibold`<br>• `Giám thị 2 (Phụ)`: chữ `text-slate-600 dark:text-slate-400 font-normal` | ❌ **CẤM** gắn chấm `●` giả làm trạng thái.<br>❌ **CẤM** đóng khung hộp badge màu mè tranh chấp với cột Trạng thái. |
| **4. Họ tên & Học hàm/Học vị** | Danh xưng & Tên: *ThS. Nguyễn Đức Thắng* | • Danh xưng gắn liền trước họ tên: `ThS. Nguyễn Đức Thắng`<br>• Thông tin phụ: dùng text `text-type-helper text-slate-500` (`Học vị: ThS`) | ❌ **CẤM** đóng khung badge cho tên hoặc học vị. |

## 21. Quy chuẩn Thiết Kế Phẳng & Chống Rối Rắm (Anti-Bloat & Flat UI Manifesto 2026)

Áp dụng **BẮT BUỘC** cho mọi màn hình, form nhập liệu, modal, drawer và toolbar trong toàn hệ thống. Mọi Agent khi lập kế hoạch (`/plan`), tạo mã (`/create`) hay rà soát (`/audit`) đều phải tuân thủ nghiêm ngặt:

### 21.1 Cấm Lồng Ghép Khung Hộp Rời Rạc (No Nested Box Bloat)
- **Tuyệt đối CẤM** bọc các cụm control nhỏ lẻ (như bộ tăng giảm stepper, cụm radio, cụm preset, nút chọn nhanh) bằng nhiều ô bo góc rời rạc lồi lõm với nền xám.
- **Bộ tăng giảm Stepper:** Phải là một khối phẳng liền mạch duy nhất (`inline-flex items-center rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-0.5`).
- **Phân tách section:** Dùng đường kẻ mảnh hairline phẳng (`border-t border-slate-100 dark:border-slate-800` hoặc `divide-y divide-slate-100`) thay vì nhồi nhét nhiều thẻ Card xám lồng nhau.

### 21.2 Hạn Chế Nền Xám Dày (No Heavy Grey Backgrounds)
- Nền toàn trang, card, modal, drawer giữ trắng sáng thanh thoát (`bg-white`, `bg-slate-50/50`).
- Tuyệt đối không dùng các mảng `bg-slate-100`, `bg-slate-200` to dày làm rãnh nền bao bọc các nhóm nhập liệu.

### 21.3 Dọn Sạch Chữ Thừa & Helper Text Rườm Rà (No Redundant Helper Text)
- **Không nhồi nhét ghi chú dài dòng:** Nếu placeholder hoặc nhãn (label) đã rõ nghĩa, tuyệt đối không chèn thêm các dòng helper text giải thích dài dưới từng ô input.
- **Không lặp lại trạng thái:** Nếu Header của modal/drawer đã có `StatusBadge`, cấm hiển thị thêm cụm `Trạng thái: [ Bản nháp ]` ở Footer.
- **Phân cách thông số nhẹ nhàng:** Dùng dấu chấm `·` phẳng (hoặc ngoặc đơn mảnh) thay vì các khối tag xám hay gạch nối dài rối mắt (VD: `Toán cao cấp · 40 câu · 60 phút`).

### 21.4 Tối Giản Nút Bấm & Chống Giật Layout (Button Minimalism & No Layout Shift)
- **Tối đa 1 Primary CTA duy nhất:** Trong mỗi modal, form hoặc toolbar, chỉ có duy nhất 1 nút chính `variant="primary"` (`bg-blue-600 text-white`). Các nút còn lại bắt buộc dùng `variant="secondary"` hoặc `ghost`.
- **Chống giãn nở khi Loading (Zero Layout Shift):** Khi nút chuyển sang trạng thái `isLoading`, nhãn chữ phải giữ nguyên hoặc dùng chiều rộng cố định (`min-w-[120px]`), spinner xoay chính giữa. Tuyệt đối không đổi sang chuỗi text dài hơn (như đổi từ *"Tạo đề thi"* thành *"Đang sinh đề..."*) làm nút bị phình to hoặc giật màn hình.

### 21.5 Cấm Đóng Khung Badge Tùy Tiện (Badge Minimalism)
- Badge/Pill chỉ dành riêng cho **Trạng thái vòng đời** (`StatusBadge`) hoặc **Mã kỹ thuật** (`IdentifierBadge`).
- Cấm đóng khung badge cho: tên môn, ngày giờ, số câu, điểm số, học vị, dải mã xem trước `(101 – 103)` hay nhãn chức năng.

