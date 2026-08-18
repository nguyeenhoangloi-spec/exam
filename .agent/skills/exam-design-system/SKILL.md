---
name: exam-design-system
description: >
  Design System chuẩn cho Exam Management System (Next.js + TypeScript + Tailwind CSS).
  Kích hoạt khi: tạo page mới, sửa component UI, chuẩn hóa giao diện, thêm tính năng có UI,
  review layout, hoặc khi có từ khóa "component", "page", "UI", "giao diện", "chuẩn hóa", "design".
  Đây là nguồn chuẩn DUY NHẤT cho toàn bộ token, component contract và shell layout.
---

# 🎨 Exam Design System — Nguồn Chuẩn UI Toàn Hệ Thống

> **Đã đồng bộ và cập nhật theo bộ quy chuẩn chuẩn mực của hệ thống** ([ui-design-system-rules.md](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/ui-design-system-rules.md) & `scripts/audit-ui.mjs`).
> Stack: Next.js App Router · TypeScript · Tailwind CSS · Inter Font.

---

## 1. Quy tắc nhớ nhanh

```text
Font Web UI       = Inter (không dùng serif hoặc monospace trong Web UI)
Màu chữ chính     = Black-forward (#0F172A, #111827, #1F2937), không dùng xám lợt
Cỡ chữ chuẩn      = 15px (Button, Control, Input, Label, Table body)
Weight chuẩn      = 400 (Body/Table cell), 500 (Label/Table header), 600 (Button/Title), 700 (KPI/H1)
Bo góc controls   = rounded-xl (12px cho Button, Input, Select, Textarea, Filter)
Nút chính (lg)    = cao 44px (h-11)
Control/Filter(md)= cao 40px (h-10)
Nút phụ (sm)      = cao 36px (h-9)
Nút phụ gọn (xs)  = cao 32px (h-8)
Nhóm 2-3 nút      = Chỉ 1 Primary, cùng chiều cao, nút Danger tách biệt hẳn sang trái
Icon button       = 36×36px (icon) hoặc 40×40px (icon-lg)
Mobile            = vùng chạm tối thiểu 44px
Modal / Drawer    = z-[100]
Toast             = fixed bottom-5 right-5, z-[110], rounded-2xl, tự đóng sau 4s
ConfirmModal      = z-[9999], rounded-2xl, max-w-sm / max-w-lg
```

---

## 2. Font Family & Typography Scale

### 2.1 Font Family

Chỉ dùng Inter làm font chính cho toàn bộ Web UI:

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

**Tuyệt đối cấm trong Web UI:**
- Times New Roman, Georgia, Cambria, `serif`, `font-serif`.
- `font-mono` / monospace cho nội dung thông thường (các thẻ `code`, `pre`, `kbd` trong UI kế thừa Inter).

*(Ngoại lệ file xuất: Word/Báo cáo in dùng Times New Roman; Excel dùng Arial).*

### 2.2 Thang cỡ chữ Semantic & Line-Height

| Token | Cỡ chữ | Line-height | Tỷ lệ | Weight | Vai trò | Ví dụ |
|---|---:|---:|---:|---|---|---|
| `fs-kpi` | 32px | 38px | ~1.2x | 700 | KPI, tổng số nổi bật (+ tabular-nums) | `2.219` |
| `fs-page-title` | 28px (mobile: 24px) | 36px | ~1.3x | 600–700 | Tiêu đề trang (h1) | `Ngân hàng câu hỏi` |
| `fs-section-title` | 20px (mobile: 18px) | 28px | 1.4x | 600 | Tiêu đề khu vực (h2) | `Thống kê trạng thái` |
| `fs-card-title` | 18px | 26px | ~1.45x | 600 | Tiêu đề card, tiêu đề modal/drawer | `Thông tin kỳ thi` |
| `fs-body` | 15px | 24px | **1.6x** | 400–500 | **Cỡ chữ chính:** Nội dung, button, input, label | `Tạo lịch thi` |
| `fs-body-sm` | 14px | 20px | ~1.43x | 500 | Nội dung phụ, header bảng (`thead th`) | `Thời gian` |
| `fs-helper` | 13px | 18px | ~1.38x | 400 | Hướng dẫn, ghi chú, error | `Tối đa 10MB` |
| `fs-badge` | 12px | 18px | 1.5x | 500–600 | Badge, trạng thái nhỏ | `Đã duyệt` |

*Lưu ý:* Cỡ chữ chính 15px bắt buộc kèm `line-height: 24px` để tối ưu cho tiếng Việt có dấu (`ắ`, `ế`, `ộ`, `ữ`), chống dính dòng và căn giữa hoàn hảo trong button/input.

### 2.3 Phân cấp Font Weight & Chống nhiễu thị giác

- **400 (`font-normal`)**: Nội dung thường, mô tả, tbody cell dữ liệu, placeholder.
- **500 (`font-medium`)**: Label, header bảng (`thead th`), navigation menu, mã định danh, ngày tháng.
- **600 (`font-semibold`)**: Tiêu đề card, button chính (Primary), trạng thái semantic.
- **700 (`font-bold`)**: KPI, tổng số hoặc tiêu đề h1 trang.
- **Nguyên tắc cốt lõi:** *Không làm cả nhóm chữ đều đậm; mỗi nhóm thông tin chỉ có 1 điểm nhấn chính, các phần tử xung quanh hạ xuống 400 hoặc màu nhạt hơn.*
- **Cấm**: `font-light`, `font-thin`, `font-extralight`, hoặc font-weight < 400 / > 700 trong UI thông thường. Không dùng `uppercase` cho button/label.

---

## 3. Bảng màu chuẩn (Cool Slate 5-Tier Typography & Status Palette)

### 3.1 Text Colors (5-Tier Cool Slate System)

| Cấp bậc | Vai trò | Light Mode (Hex & Tailwind) | Dark Mode (Hex & Tailwind) | Utility Shortcut | Mục đích sử dụng |
|---|---|---|---|---|---|
| **Tầng 1** | **Tiêu đề & Nội dung chính** | `#0F172A` (`slate-900`) | `#F8FAFC` (`slate-50`) | `.text-main` | Tên trang, KPI, tiêu đề card, họ tên sinh viên/giảng viên, mã đề |
| **Tầng 2** | **Chữ phụ, Label, Cột bảng** | `#334155` (`slate-700`) | `#E2E8F0` (`slate-200`) | `.text-sub` | Nhãn form, header cột bảng, tên khoa/lớp, điều hướng |
| **Tầng 3** | **Mô tả, Helper, Ghi chú** | `#64748B` (`slate-500`) | `#94A3B8` (`slate-400`) | `.text-helper` | Ghi chú ca thi, hướng dẫn tải file, thời gian diễn ra, metadata |
| **Tầng 4** | **Placeholder, Vô hiệu hóa** | `#94A3B8` (`slate-400`) | `#64748B` (`slate-500`) | `.text-placeholder` | Chữ mờ trong ô input (`Tìm kiếm...`), nút bị khóa, icon mờ |
| **Tầng 5** | **Chữ trên nền đậm/xanh** | `#FFFFFF` (`white`) | `#FFFFFF` (`white`) | `.text-inverse` | Chữ trên nút Primary xanh, badge trạng thái đặc biệt |

### 3.2 Semantic Brand & Status Colors (Bảng màu 5 nhóm chốt)

- **Trung tính (Neutral - Xám xanh):** Nền `#F1F5F9` (`bg-slate-100 dark:bg-slate-800`), Chữ `#334155` (`text-slate-700 dark:text-slate-300`), Viền `border-slate-200` — Nháp, Chưa bắt đầu, Lưu trữ, Đã khóa, Chưa công bố.
- **Thông tin / Đang xử lý (Info - Xanh dương):** Nền `#EFF6FF` (`bg-blue-50 dark:bg-blue-950/40`), Chữ `#1D4ED8` (`text-blue-700 dark:text-blue-400`), Viền `border-blue-200` — Đang diễn ra, Đang tải, Đã lên lịch, Đang chấm thi, Đang chạy, Cần chỉnh sửa.
- **Chờ xử lý (Warning - Vàng cam):** Nền `#FFFBEB` (`bg-amber-50 dark:bg-amber-950/40`), Chữ `#B45309` (`text-amber-700 dark:text-amber-400`), Viền `border-amber-200` — Chờ duyệt, Chờ xác nhận, Cần bổ sung, Đang xem xét, Chờ xác minh.
- **Thành công (Success - Xanh lá):** Nền `#F0FDF4` (`bg-emerald-50 dark:bg-emerald-950/40`), Chữ `#15803D` (`text-emerald-700 dark:text-emerald-400`), Viền `border-emerald-200` — Đã duyệt, Đã hoàn thành, Đã nộp, Đã công bố, Đạt, Thành công, Đang hoạt động.
- **Lỗi / Nguy hiểm (Danger - Đỏ):** Nền `#FEF2F2` (`bg-rose-50 dark:bg-rose-950/40`), Chữ `#B91C1C` (`text-rose-700 dark:text-rose-400`), Viền `border-rose-200` — Bị từ chối, Thất bại, Đã hủy, Bị khóa, Không đạt, Vắng thi.

### 3.3 Quy tắc sử dụng màu sắc TUYỆT ĐỐI & WCAG thực tế

- **Nền trang, card, control:** Vẫn giữ nguyên nền trắng và trắng xanh (`bg-white`, `bg-slate-50/50`, `bg-blue-50/30`, `dark:bg-slate-900`). Tuyệt đối KHÔNG dùng các màu trạng thái (xanh lá, đỏ, cam) làm nền lớn toàn trang.
- **Màu văn bản thông thường:** Bắt buộc dùng dải màu **Cool Slate** (`slate-900`, `slate-700`, `slate-500`). CẤM dùng xanh lá, đỏ, cam cho văn bản đọc thông thường.
- **Màu trạng thái Semantic:** Chỉ dùng cho icon, chữ chỉ báo trạng thái, viền hoặc nền nhạt:
  - `variant="dot"`: Dùng trong bảng/danh sách phẳng (chấm tròn + chữ đậm).
  - `variant="pill"`: Dùng trong Drawer, Card chi tiết, Tag tóm tắt (nền siêu nhạt + chữ đậm + viền mờ).
- **Phân loại NÊN DÙNG Badge:** Kỳ thi, Câu hỏi, Đề thi, Lịch thi, Sao lưu, Tài khoản, Phúc khảo, Kết quả.
- **Phân loại KHÔNG DÙNG Badge:** Mã kỹ thuật (`KT-1`, mã SV, mã câu hỏi ➔ dùng `IdentifierBadge` xám hoặc chữ thường), Tên khoa/môn, Điểm số/ngày tháng, Nút hành động, Nội dung mô tả.
- **Nút trạng thái nền đậm:** Nút có nền màu đậm (`bg-blue-600`, `bg-emerald-600`, `bg-rose-600`, `bg-amber-600`) bắt buộc dùng chữ màu trắng (`text-white`).
- **Quy chuẩn tương phản WCAG:** Các cặp màu chữ quan trọng phải được kiểm tra tương phản theo chuẩn **WCAG AA** (tỷ lệ $\ge 4.5:1$ cho văn bản thường, $\ge 3:1$ cho văn bản lớn/đậm). Chữ màu vàng/cam không được đặt trên nền trắng nếu độ tương phản thấp; bắt buộc dùng `text-amber-700` (`#B45309`, 4.8:1) hoặc `text-amber-800`.
- **Giới hạn màu xám nhạt (`text-slate-400` / `text-slate-400/80`):** Chỉ dùng cho Placeholder, Disabled state, Copyright footer và Metadata phụ; tuyệt đối không dùng cho nội dung cần đọc.
- **Quy tắc Gradient & Ngoại lệ:** Không dùng gradient trong màn hình quản trị và dữ liệu; ngoại lệ cho phép: Trang đăng nhập (Login), Khu vực thương hiệu và Nút Active Tab trên Sidebar.
- KHÔNG thêm màu hex trực tiếp trong JSX/TSX (ưu tiên dùng utility shortcuts `.text-main`, `.text-sub`, `.text-helper`, `.text-placeholder`, `.text-inverse` hoặc các class `slate-*`).
- Biểu đồ và SVG dùng biến `--ui-chart-*`.
- KHÔNG dùng accent tím/indigo/pink ngoài hệ màu chuẩn.
- KHÔNG truyền đạt trạng thái chỉ bằng màu sắc (phải kèm icon hoặc text).

---

## 4. Quy chuẩn Button & Control

### 4.1 Button ([components/ui/Button.tsx](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/ui/Button.tsx))

- **Bo góc**: `rounded-xl` (12px).
- **Ngoại lệ bo góc:** Submenu items trong Sidebar, Badge nhỏ, Tooltip và Chip trạng thái vi mô được phép dùng `rounded-lg` (8px).
- **Kích thước**:
  - `lg`: cao **44px** (`h-11`) — Nút hành động chính của trang (Primary CTA), Đăng nhập, Tạo lịch thi...
  - `md`: cao **40px** (`h-10`) — Nút thao tác bảng, toolbar, Lọc kết quả, Bộ lọc, Xuất Excel...
  - `sm`: cao **36px** (`h-9`) — Nút phụ, Đóng, Hủy...
  - `xs`: cao **32px** (`h-8`) — Action phụ rất gọn
  - `icon`: **36×36px** (`h-9 w-9`) — Chuông thông báo, icon đơn
  - `icon-lg`: **40×40px** (`h-10 w-10`) — Làm mới, xem lưới
- **Phân cấp 5 Bậc Nút Bấm (Button Hierarchy 2026)**:
  - **Bậc 1 (Primary CTA)**: Nền xanh dương đậm `bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-2xs` (Duy nhất 1 nút chính trong nhóm: `[ + Phân công ]`, `[ Lưu ]`).
  - **Bậc 2 (Soft Accent)**: `variant="soft"` — Nền xanh siêu nhạt `bg-blue-50 dark:bg-blue-950/60`, chữ xanh đậm `text-blue-700 dark:text-blue-300 font-semibold`, **KHÔNG VIỀN**, **KHÔNG ICON**, dùng cho tính năng tự động / AI / sinh ma trận (`[ Tự động ]`, `[ Sinh ma trận ]`).
  - **Bậc 3 (Secondary)**: `variant="secondary"` — Nền trắng viền mảnh `bg-white border-slate-200/90 text-slate-800` (Bộ lọc, Chọn cột, Xuất Excel).
  - **Bậc 4 (Ghost)**: `variant="ghost"` — Trong suốt, không viền (Đóng, Hủy, Bỏ qua).
  - **Bậc 5 (Danger)**: `variant="danger"` / `variant="danger-outline"` — Nút xóa nguy hiểm, đặt tách biệt sang trái.
- **Quy tắc Một nút Primary**: Chỉ có duy nhất 1 nút Primary trong cùng một nhóm thao tác hoặc một vùng chức năng (Toolbar, Modal Footer, Form Action Bar).
- **Typography button**: 15px, `font-semibold` (weight 600).
- **Nội dung button**: Cấu trúc `Động từ + Đối tượng` (Ví dụ: `Tạo lịch thi`, `Xuất Excel`, `Đăng nhập`). Không viết câu dài, không IN HOA toàn bộ.
- **State bắt buộc**: Hover, focus-visible, active (`scale-[0.98]`), disabled, loading (`disabled={isLoading}` + `aria-busy={isLoading}`).
- **Icon-only button**: Bắt buộc có `aria-label` hoặc tooltip/title.

### 4.2 Control (Input / Select / Textarea / Filter)

- Bo góc: `rounded-xl` (12px).
- Chiều cao mặc định: **40px** (mobile tối thiểu 44px).
- Font: 15px, Inter.
- Label: 15px, `font-medium` (weight 500), `text-slate-800 dark:text-slate-200`.
- Helper/Error: 13px.
- Select/Dropdown: Chỉ có 1 mũi tên, không lồng 2 lớp khung ngoài. Căn cùng trục với nút action.

---

## 5. Bố cục & Phân chia Nhóm Nút (2 nút / 3 nút trên một hàng)

### 5.1 Quy tắc cốt lõi:
1. **Chỉ có DUY NHẤT 1 nút Primary** trong một cụm nhóm nút.
2. **Đồng nhất kích thước:** Tất cả các nút trong cùng một hàng phải có **cùng chiều cao** (`h-10` hoặc `h-11`) và **cùng bo góc** `rounded-xl`.
3. **Khoảng cách:** Dùng `gap-2` (8px) cho toolbar danh sách hoặc `gap-3` (12px) cho modal footer / form actions.

### 5.2 Nhóm 2 nút (Modal Footer / Form Actions)
- **Thứ tự chuẩn:** Nút phụ (Secondary/Ghost) đứng trước ➔ Nút chính (Primary) đứng sau (ngoài cùng bên phải).
```text
[ Hủy (Secondary) ]   [ Lưu thay đổi (Primary) ]
```
```tsx
<div className="flex items-center justify-end gap-3 pt-4">
  <Button variant="secondary" onClick={onClose}>Hủy</Button>
  <Button variant="primary" onClick={onSave}>Lưu thay đổi</Button>
</div>
```

### 5.3 Nhóm 3 nút
1. **Tiến trình Form (Hủy ➔ Lưu nháp ➔ Xuất bản):**
   Căn phải (`justify-end`), độ ưu tiên tăng dần từ trái sang phải: `Ghost` ➔ `Secondary` ➔ `Primary`.
   ```tsx
   <div className="flex items-center justify-end gap-2.5">
     <Button variant="ghost" onClick={onCancel}>Hủy</Button>
     <Button variant="secondary" onClick={onSaveDraft}>Lưu nháp</Button>
     <Button variant="primary" onClick={onPublish}>Xuất bản</Button>
   </div>
   ```
2. **Có Thao tác Nguy hiểm (Xóa vs Hủy / Lưu):**
   Nút `Danger` (Xóa) PHẢI nằm tách biệt hẳn về bên trái (`justify-between`), cách xa cụm nút Xác nhận.
   ```tsx
   <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
     <Button variant="danger-outline" onClick={onDelete}>Xóa bản ghi</Button>
     <div className="flex items-center gap-2">
       <Button variant="secondary" onClick={onClose}>Hủy</Button>
       <Button variant="primary" onClick={onUpdate}>Cập nhật</Button>
     </div>
   </div>
   ```
3. **Toolbar / Bộ lọc danh sách:**
   Các nút bổ trợ là `secondary`, nút thêm mới chính là `primary`.
   ```tsx
   <div className="flex items-center gap-2">
     <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Xuất Excel</Button>
     <Button variant="secondary" leftIcon={<Upload className="w-4 h-4" />}>Nhập CSV</Button>
     <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Tạo mới</Button>
   </div>
   ```
4. **Toolbar Chấm thi / Trợ lý AI (Ghost ➔ Secondary ➔ Primary):**
   Phân cấp 3 bậc thị giác: Thao tác gợi ý/trợ lý (`ghost` - phẳng) ➔ Lưu nháp/tiến độ (`secondary` - viền) ➔ Chốt hành động duyệt/hoàn tất (`primary` - đặc).
   ```tsx
   <div className="flex items-center gap-2">
     <Button variant="ghost" size="sm" onClick={handleAiSuggest}>Mẫu chấm AI</Button>
     <Button variant="secondary" size="sm" onClick={handleSave}>Lưu điểm</Button>
     <Button variant="primary" size="sm" onClick={handleSubmit}>Gửi duyệt</Button>
   </div>
   ```

### 5.4 Xử lý trên Mobile (< 768px)
- **Modal footer:** Dùng `flex-col-reverse` (Nút Primary lên trên cùng để ngón tay cái dễ thao tác nhất, nút Hủy nằm dưới cùng).
- **Toolbar:** Gom các nút `secondary` vào menu `...` (More Actions), chỉ giữ lại nút `Primary` trên hàng.

---

## 6. Popup, Modal, Toast & Hộp thoại

### 6.1 Toast ([components/Toast.tsx](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/Toast.tsx))

- **Vị trí**: Cố định góc dưới bên phải `fixed bottom-5 right-5` (CẤM đặt góc trái hoặc phía trên).
- **Z-Index**: `z-[110]`.
- **Hình dạng & Màu sắc**: `rounded-2xl`, `px-4 py-3`, chữ trắng 14px font-semibold.
  - Success: nền `#10B981` (emerald-500), icon `CheckCircle2`.
  - Error: nền `#EF4444` (red-500), icon `AlertCircle`.
- **Thời gian**: Tự đóng sau 4000ms.
- **Accessibility**: `role="status"`, `aria-live="polite"`.

### 6.2 Modal ([components/Modal.tsx](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/Modal.tsx)) & Drawer

- **Overlay**: `fixed inset-0 z-[100]`, nền `bg-slate-950/55 backdrop-blur-[2px]`.
- **Hộp**: `rounded-2xl`, `max-w-2xl`, `bg-white dark:bg-slate-900`, `shadow-2xl`.
- **Header**: `bg-slate-50 dark:bg-slate-800`, tiêu đề `text-lg font-semibold`. Đóng khi click ngoài hoặc ESC.

### 6.3 ConfirmModal ([components/ConfirmModal.tsx](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/ConfirmModal.tsx)) & CriticalConfirmModal

- **Z-Index**: `z-[9999]` (nổi cao nhất).
- **Overlay**: `fixed inset-0 bg-slate-950/60 backdrop-blur-sm`.
- **Hộp**: `rounded-2xl`, `max-w-sm` (ConfirmModal) hoặc `max-w-lg` (CriticalConfirmModal).
- Dùng cho mọi thao tác nguy hiểm, xóa dữ liệu hoặc thay đổi không thể đảo ngược.

---

## 7. Table & Danh sách Dữ liệu

### 7.1 Wrapper bắt buộc

```tsx
<div className="ui-table-wrap">
  <table className="ui-table">
    <thead>
      <tr>
        <th>Mã SV</th>
        <th>Họ và tên</th>
        <th>Trạng thái</th>
      </tr>
    </thead>
    <tbody>
      {/* rows */}
    </tbody>
  </table>
</div>
```

### 7.2 Chuẩn Typography Table

- **Header (`th`)**: Cỡ chữ **14px**, `font-medium` (weight 500), `bg-slate-50 dark:bg-slate-800`.
- **Cell (`td`)**: Cỡ chữ **15px**, `font-normal` (weight 400).
- **Trạng thái**: Dùng [StatusBadge](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/common/StatusBadge.tsx) (`import { StatusBadge } from '@/components/ui'`).
- **Mã định danh / Số báo danh**: Dùng [IdentifierBadge](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/ui/IdentifierBadge.tsx) (`rounded-lg`, 13px, `tabular-nums`).
- **Luôn có**: Skeleton loading, EmptyState khi rỗng, Pagination khi nhiều trang.

### 7.3 Quy chuẩn Bố cục Phẳng & Hạn chế Khung Hộp (Flat Layout & Divider-First)

- **Hạn chế tối đa việc lồng nhiều khung hộp (Nested card boxes):** Tránh chia nhỏ từng dòng, từng tiêu chí, từng trường thông tin thành các ô card bo góc riêng biệt có nền xám và viền dày bên trong modal/drawer.
- **Ưu tiên đường kẻ ngang tinh tế (Divider-First):** Thay thế các khung hộp con bằng bố cục phẳng, phân tách các hàng/mục bằng đường kẻ ngang mờ (`divide-y divide-slate-100 dark:divide-slate-800/80` hoặc `border-t border-slate-100 dark:border-slate-800`).
- **Danh sách nhiều mục (Criteria / Attributes):** Gom vào 1 khối phẳng, mỗi mục gồm số thứ tự nhỏ, tên tiêu đề (`15px font-semibold`), mô tả phụ bên dưới (`14px text-slate-500`) và giá trị/điểm số căn phải thẳng hàng.
- **Tiêu đề Section:** Dùng Sentence case (`Đề bài câu hỏi`, `Đáp án mẫu & Hướng dẫn giải`), chữ `15px font-semibold`, có thanh chỉ báo dọc xanh (`h-4 w-1 rounded-full bg-blue-600`). TUYỆT ĐỐI KHÔNG dùng chữ IN HOA toàn bộ.
- **Thanh trạng thái / Cảnh báo inline:** Không dùng nền hộp màu đặc dày (`bg-amber-50`); ưu tiên dạng dòng chữ phẳng trong suốt kèm icon semantic (`CheckCircle2` / `AlertTriangle`).

### 7.4 Quy Chuẩn Nhãn Hành Động (Action Dropdown & Confirm Modals)

- **Dropdown Menu dòng bảng (Row Actions):** Bắt buộc dùng **Động từ ngắn gọn**, không thêm đuôi đối tượng dài dòng:
  - 👁️ `Xem chi tiết` (không dùng "Xem hồ sơ" hay "Xem chi tiết ca thi").
  - ✏️ `Chỉnh sửa` (không dùng "Chỉnh sửa ca thi", "Chỉnh sửa môn"...).
  - 🗑️ `Xóa` (màu chữ & icon `text-rose-600 dark:text-rose-400`).
  - 🔄 `Khôi phục` & 💥 `Xóa vĩnh viễn` (trong Thùng rác).
  - Thao tác đặc thù: 🔒 `Khóa tài khoản` / 🔓 `Mở khóa tài khoản`, 📦 `Lưu trữ`, ⚙️ `Cấu hình Rubric`, ✅ `Phê duyệt`, ❌ `Từ chối`.
- **Hộp thoại xác nhận (ConfirmModal):** Tiêu đề bắt buộc nêu rõ tên đối tượng cụ thể (`Xóa ca thi?`, `Xóa phòng thi?`, `Xóa môn học?`, `Xóa sinh viên?`, `Xóa giảng viên?`, `Xóa lớp học?`, `Xóa đề thi?`, `Xóa câu hỏi?`).

---

## 8. Dark Mode & Responsive

### 8.1 Dark Mode

- Sử dụng class `.dark` trên `<html>`.
- Mọi component UI/JSX phải tự cung cấp `dark:` variant đầy đủ (ví dụ: `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-slate-100`, `border-slate-200 dark:border-slate-700`).

### 8.2 Responsive Breakpoints

| Breakpoint | Chiều rộng | Hành vi |
|---|---|---|
| Mobile | < 768px | Sidebar dạng drawer, padding p-4, table cuộn ngang, touch target 44px |
| Tablet | 768px–1023px | Sidebar collapsed (72px), KPI grid 2 cột |
| Desktop | >= 1024px | Sidebar expanded (252px), Header 64px, KPI grid 4 cột |
| Wide | >= 1440px | Nội dung mở rộng hoặc max-w căn giữa |

---

## 9. Lệnh kiểm tra kỹ thuật trước khi bàn giao

Chạy trong thư mục `frontend`:

```bash
npm run audit:ui
npx tsc --noEmit --incremental false --pretty false
npm run lint -- --no-cache
npm run build
```

---

## 10. Anti-patterns — TUYỆT ĐỐI KHÔNG làm

❌ Dùng mã màu hex trực tiếp trong style hoặc class: `style={{ color: '#2563EB' }}` hay `bg-[#2563EB]`  
❌ Dùng `rounded-lg` (8px) hoặc `rounded` cho Button/Input/Select (phải dùng `rounded-xl` / 12px)  
❌ Dùng `rounded-full` cho button thông thường hoặc input  
❌ Dùng font serif (`font-serif`) hoặc monospace (`font-mono`) trong Web UI  
❌ Dùng cỡ chữ 10px, 11px, 12px, 14px, 16px cho nội dung body/button (chuẩn là 15px)  
❌ Dùng font-weight < 400 (`font-light`, `font-thin`) hoặc > 700 (`font-black`) trong UI thông thường  
❌ Viết in hoa toàn bộ (`uppercase`) cho button, label hoặc tiêu đề section  
❌ Chia quá nhiều khung hộp (nested card boxes) con bao quanh từng mục; phải dùng bố cục phẳng với đường kẻ ngang `divide-y`  
❌ Đặt Toast ở vị trí khác ngoài `fixed bottom-5 right-5`  
❌ Tự viết status mapping màu tùy tiện thay vì dùng `StatusBadge`  
❌ Để 2 nút Primary cùng xuất hiện trên 1 hàng / nhóm  
❌ Đặt nút Danger liền kề ngay cạnh nút Primary mà không tách biệt sang bên trái  
❌ Bỏ qua dark mode (`dark:`) hoặc bỏ qua trạng thái disabled khi `isLoading`  
❌ Trùng lặp khối Avatar / Menu tài khoản ở cả Header và chân Sidebar (phải áp dụng chuẩn Header-First Profile)

