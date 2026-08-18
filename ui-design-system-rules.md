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
Màu chữ chính     = Đen xanh đậm (Cool Slate), không dùng xám lợt
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

## 6. Màu chữ (Cool Slate 5-Tier Typography System)

Áp dụng chuẩn hóa 5 tầng màu chữ dựa trên dải **Cool Slate** (pha sắc xanh đen sâu), vừa đảm bảo độ tương phản sắc nét thực tế theo chuẩn WCAG AA/AAA, vừa tự động thích ứng mượt mà giữa Light Mode và Dark Mode.

### 6.1 Bảng phân cấp 5 tầng màu chuẩn

| Cấp bậc | Vai trò | Light Mode (Hex & Tailwind) | Dark Mode (Hex & Tailwind) | Utility Shortcut | Mục đích sử dụng |
|---|---|---|---|---|---|
| **Tầng 1** | **Tiêu đề & Nội dung chính** | `#0F172A` (`slate-900`) | `#F8FAFC` (`slate-50`) | `.text-main` | Tên trang, KPI, tiêu đề card, họ tên sinh viên/giảng viên, mã đề |
| **Tầng 2** | **Chữ phụ, Label, Cột bảng** | `#334155` (`slate-700`) | `#E2E8F0` (`slate-200`) | `.text-sub` | Nhãn form, header cột bảng, tên khoa/lớp, điều hướng |
| **Tầng 3** | **Mô tả, Helper, Ghi chú** | `#64748B` (`slate-500`) | `#94A3B8` (`slate-400`) | `.text-helper` | Ghi chú ca thi, hướng dẫn tải file, thời gian diễn ra, metadata |
| **Tầng 4** | **Placeholder, Vô hiệu hóa** | `#94A3B8` (`slate-400`) | `#64748B` (`slate-500`) | `.text-placeholder` | Chữ mờ trong ô input (`Tìm kiếm...`), nút bị khóa, icon mờ |
| **Tầng 5** | **Chữ trên nền đậm/xanh** | `#FFFFFF` (`white`) | `#FFFFFF` (`white`) | `.text-inverse` | Chữ trên nút Primary xanh, badge trạng thái đặc biệt |

### 6.2 Tokens CSS tương thích hệ thống
| Token CSS | Giá trị Light | Giá trị Dark | Vai trò |
|---|---|---|---|
| `ui-text-primary` | `#0F172A` (`slate-900`) | `#F8FAFC` (`slate-50`) | Tiêu đề, KPI, nội dung chính |
| `ui-text-body` | `#0F172A` (`slate-900`) | `#F8FAFC` (`slate-50`) | Nội dung văn bản thường |
| `ui-text-secondary` | `#334155` (`slate-700`) | `#E2E8F0` (`slate-200`) | Label form, header bảng, điều hướng |
| `ui-text-muted-soft` | `#64748B` (`slate-500`) | `#94A3B8` (`slate-400`) | Metadata, mô tả, thông tin phụ |
| `ui-text-disabled` | `#94A3B8` (`slate-400`) | `#64748B` (`slate-500`) | Placeholder, disabled, copyright |

### 6.3 Nguyên tắc sử dụng & Quy chuẩn WCAG thực tế
- **Quy chuẩn tương phản WCAG:** Các cặp màu chữ quan trọng phải được kiểm tra tương phản theo chuẩn **WCAG AA** (tỷ lệ $\ge 4.5:1$ cho văn bản thường, $\ge 3:1$ cho văn bản lớn/đậm); nội dung nhỏ ưu tiên đạt **AAA** ($\ge 7:1$) khi có thể.
- **Giới hạn màu xám nhạt (`text-slate-400` / `text-slate-400/80`):** Chỉ dùng cho Placeholder, Disabled state, Copyright footer và Metadata phụ; tuyệt đối không dùng cho nội dung cần đọc.
- **Không dùng màu đen tuyệt đối `#000000`** và không dùng xám lợt làm màu chữ chính.
- Ưu tiên dùng các class semantic shortcut (`text-main`, `text-sub`, `text-helper`, `text-placeholder`, `text-inverse`) để code ngắn gọn và tự động đảo màu khi chuyển Dark Mode.
- Không tạo phân cấp chỉ bằng màu; kết hợp linh hoạt cỡ chữ, weight, vị trí và spacing.

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
- **Ngoại lệ bo góc:** Submenu items trong Sidebar, Badge nhỏ, Tooltip và Chip trạng thái vi mô được phép dùng `rounded-lg` (8px).
- Chữ button: 15px, weight 600, line-height khoảng 22–24px.
- Khoảng cách icon và chữ: 8px.
- Padding ngang: khoảng 12–18px tùy kích thước.
- **Quy tắc "Một nút Primary":** Chỉ có duy nhất 1 nút Primary trong cùng một nhóm thao tác hoặc một vùng chức năng (Toolbar, Modal Footer, Form Action Bar). Không cấm việc một trang có nhiều nút Primary ở các khối chức năng tách biệt.
- **Quy tắc Gradient & Ngoại lệ:** Không lạm dụng gradient trong màn hình quản trị và bảng dữ liệu; ngoại lệ cho phép: Trang đăng nhập (Login), Khu vực thương hiệu và Nút Active Tab trên Sidebar.
- Không dùng chữ IN HOA toàn bộ cho button thông thường.
- Không dùng `rounded-full` cho button thông thường.

### 7.1 Bảng phân cấp 5 bậc nút bấm (Button Hierarchy System 2026)

| Bậc | Phân loại | Quy cách thị giác (Visual Specs) | Quy tắc Icon & Viền | Khi nào sử dụng (Use Cases) | Ví dụ thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bậc 1** | **Primary CTA** *(Nút chính)* | • **Nền**: Xanh dương đậm `#2563EB` (`bg-primary-600 hover:bg-primary-700`)<br>• **Chữ**: Trắng `#FFFFFF` (`text-white font-semibold`)<br>• **Viền**: Không viền (`border-transparent`)<br>• **Đổ bóng**: `shadow-2xs` | • Có thể có icon dấu `+` hoặc icon xác nhận.<br>• **Chỉ có 1 nút Primary** trong 1 nhóm thao tác. | Hành động chủ đạo, quan trọng nhất của trang, form hoặc modal. | `[ + Phân công ]`<br>`[ + Thêm câu hỏi ]`<br>`[ Lưu thay đổi ]` |
| **Bậc 2** | **Soft Accent** *(Phụ thông minh)* | • **Nền**: Xanh nhạt vừa vặn (`bg-blue-100 dark:bg-blue-900/40`, hover/active `bg-blue-200/90`)<br>• **Chữ**: Xanh đậm (`text-blue-700`, hover/active `text-blue-800 font-semibold`)<br>• **Viền**: **Không viền** (`border-transparent`) | • **KHÔNG DÙNG ICON** (thuần chữ thanh thoát).<br>• Đứng cạnh nút Primary mà không tranh chấp độ nổi bật. | Các tính năng bổ trợ đặc biệt, thuật toán, tự động hóa, sinh đề, xem trước. | `[ Tự động ]`<br>`[ Sinh ma trận ]`<br>`[ Xem trước ]` |
| **Bậc 3** | **Secondary** *(Thao tác chuẩn)* | • **Nền**: Trắng / Xám rất nhạt (`bg-white hover:bg-slate-50 dark:bg-slate-900`)<br>• **Chữ**: Xám đen Cool Slate (`text-slate-800 dark:text-slate-100 font-semibold`)<br>• **Viền**: Viền mảnh (`border border-slate-200/90 dark:border-slate-700`) | • Thường đi kèm icon chức năng phía trước (Lọc, Cột, Excel, In). | Bộ lọc, Sắp xếp cột, Xuất Excel, In ấn, Tải mẫu biểu. | `[ Bộ lọc ]`<br>`[ Xuất Excel ]`<br>`[ Chọn cột ]` |
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
- [ ] Tiêu đề Section viết Sentence case, có thanh pill xanh (`h-4 w-1 bg-blue-600`).
- [ ] Thanh trạng thái/khớp điểm inline phẳng, không dùng nền hộp thô.

### Màu sắc & Trạng thái (Color & Status)

- [ ] Nền trang, card, control giữ trắng và trắng xanh (`bg-white`, `bg-slate-50/50`).
- [ ] Không dùng màu trạng thái (xanh lá, đỏ, cam) làm nền lớn toàn trang.
- [ ] Không dùng xanh lá, đỏ, cam cho nội dung thông thường (chỉ dùng Cool Slate).
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
```

Khi kiểm tra thủ công, dùng DevTools → Computed Styles và xác nhận:

- `font-family` bắt đầu bằng Inter hoặc font Inter do `next/font` sinh ra.
- Button/control có `font-size: 15px`.
- Button có `font-weight: 600`.
- Border radius là 12px tương ứng `rounded-xl`.
- Chiều cao đúng variant.
- Focus-visible hiển thị rõ.

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

### 18.1 Bảng màu chốt 5 Nhóm Trạng Thái (Nền Siêu Nhạt & Chữ Đậm Tương Phản Cao)

| Nhóm Ý Nghĩa | Ví Dụ Nghiệp Vụ | Màu Sắc | Nền Nhạt (Hex & Tailwind) | Chữ Đậm (Hex & Tailwind) | Viền Nhạt |
|---|---|---|---|---|---|
| **Trung tính** | Bản nháp, Chưa bắt đầu, Lưu trữ, Đã khóa, Chưa công bố | **Xám xanh** | `#F1F5F9`<br>`bg-slate-100 dark:bg-slate-800` | `#334155`<br>`text-slate-700 dark:text-slate-300` | `border-slate-200 dark:border-slate-700` |
| **Thông tin / Đang xử lý** | Đang diễn ra, Đang tải, Đã lên lịch, Đang chấm thi, Đang chạy, Cần chỉnh sửa | **Xanh dương** | `#EFF6FF`<br>`bg-blue-50 dark:bg-blue-950/40` | `#1D4ED8`<br>`text-blue-700 dark:text-blue-400` | `border-blue-200 dark:border-blue-800/60` |
| **Chờ xử lý** | Chờ duyệt, Chờ xác nhận, Cần bổ sung, Đang xem xét, Chờ xác minh | **Vàng cam** | `#FFFBEB`<br>`bg-amber-50 dark:bg-amber-950/40` | `#B45309`<br>`text-amber-700 dark:text-amber-400` | `border-amber-200 dark:border-amber-800/60` |
| **Thành công** | Đã duyệt, Đã hoàn thành, Đã nộp, Đã công bố, Đạt, Thành công, Đang hoạt động | **Xanh lá** | `#F0FDF4`<br>`bg-emerald-50 dark:bg-emerald-950/40` | `#15803D`<br>`text-emerald-700 dark:text-emerald-400` | `border-emerald-200 dark:border-emerald-800/60` |
| **Lỗi / Nguy hiểm** | Bị từ chối, Thất bại, Đã hủy, Bị khóa, Không đạt, Vắng thi | **Đỏ** | `#FEF2F2`<br>`bg-rose-50 dark:bg-rose-950/40` | `#B91C1C`<br>`text-rose-700 dark:text-rose-400` | `border-rose-200 dark:border-rose-800/60` |

### 18.2 Hai Hình Thức Hiển Thị của `StatusBadge`
1. **`variant="dot"` (Mặc định trong bảng/danh sách):** `[Chấm tròn màu] [Chữ đậm]` — Bố cục phẳng phân tách bằng đường kẻ ngang (`divide-y`), không bọc card box dày.
2. **`variant="pill"` (Trong Drawer, Card chi tiết, Summary Chip):** `[Nền siêu nhạt + Chữ đậm + Viền mờ]` — Bo góc `rounded-lg` (8px), padding `px-2.5 py-0.5`.

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
- **Mã kỹ thuật:** Mã `KT-1`, mã sinh viên `SV...`, mã câu hỏi `Q...` ➔ Dùng `IdentifierBadge` dạng nhãn xám kỹ thuật (`bg-slate-100 text-slate-700 font-medium tabular-nums`) hoặc chữ thường.
- **Tên khoa, tên môn học:** Dùng typography thường (`text-slate-900` / `text-slate-700`).
- **Số lượng, điểm số, ngày tháng:** Dùng text thường kèm `tabular-nums`.
- **Nút hành động:** Bắt buộc dùng component `Button`.
- **Nội dung mô tả thông thường:** Dùng văn bản chuẩn.

### 18.5 Nền trang & Nút trạng thái
- **Nền trang, card, control:** Vẫn giữ nguyên nền trắng (`bg-white`) và trắng xanh (`bg-slate-50`, `bg-slate-50/50`). Tuyệt đối KHÔNG dùng màu trạng thái làm nền lớn toàn trang.
- **Nút trạng thái nền đậm:** Nút có nền màu đậm (`bg-blue-600`, `bg-emerald-600`, `bg-rose-600`, `bg-amber-600`) bắt buộc dùng chữ màu trắng (`text-white`).

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
- Item bình thường: `flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[14.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer select-none`
- Item Danger: `flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[14.5px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer select-none`
- Đường kẻ phân cách trước nút Xóa: `<div className="my-1 border-t border-slate-100 dark:border-slate-800" />`

### 19.3 Tiêu Đề Modal Xác Nhận (ConfirmModal)
Ngược lại với Dropdown menu, tiêu đề của `ConfirmModal` khi xóa **bắt buộc nêu rõ tên đối tượng cụ thể** để người dùng không bấm nhầm:
- `Xóa ca thi?`, `Xóa phòng thi?`, `Xóa lớp học?`, `Xóa môn học?`, `Xóa sinh viên?`, `Xóa giảng viên?`, `Xóa kỳ thi?`, `Xóa câu hỏi?`, `Xóa đề thi?`.

