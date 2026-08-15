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

### 2.2 Thang cỡ chữ Semantic

| Token | Cỡ chữ | Line-height | Weight | Vai trò | Ví dụ |
|---|---:|---:|---|---|---|
| `fs-kpi` | 32px | 38px | 700 | KPI, tổng số nổi bật (+ tabular-nums) | `2.219` |
| `fs-page-title` | 28px (mobile: 24px) | 36px | 600–700 | Tiêu đề trang (h1) | `Ngân hàng câu hỏi` |
| `fs-section-title` | 20px (mobile: 18px) | 28px | 600 | Tiêu đề khu vực (h2) | `Thống kê trạng thái` |
| `fs-card-title` | 18px | 26px | 600 | Tiêu đề card | `Thông tin kỳ thi` |
| `fs-body` | 15px | 24px | 400 | Nội dung thường, button, input, label | `Tạo lịch thi` |
| `fs-body-sm` | 14px | 20px | 500 | Nội dung phụ, header bảng | `Thời gian` |
| `fs-helper` | 13px | 18px | 400–500 | Hướng dẫn, ghi chú, error | `Tối đa 10MB` |
| `fs-badge` | 12px | 18px | 600 | Badge, trạng thái nhỏ | `Đã duyệt` |

### 2.3 Phân cấp Font Weight

- **400 (`font-normal`)**: Nội dung thường, mô tả, tbody cell dữ liệu.
- **500 (`font-medium`)**: Label, header bảng (`thead th`), navigation, mã, ngày tháng, giá trị quét nhanh.
- **600 (`font-semibold`)**: Tiêu đề card, button, action chính, trạng thái semantic.
- **700 (`font-bold`)**: KPI, tổng số hoặc tiêu đề h1 trang.
- **Cấm**: `font-light`, `font-thin`, `font-extralight`, hoặc font-weight < 400 / > 700 trong UI thông thường.
- Không dùng utility `uppercase` cho button, table header hoặc label thông thường.

---

## 3. Bảng màu chuẩn (Black-forward Palette)

### 3.1 Text Colors (Light Mode)

| Token | Hex | Vai trò |
|---|---|---|
| `ui-text-primary` | `#0F172A` | Tiêu đề, nội dung chính |
| `ui-text-body` | `#111827` | Nội dung thường |
| `ui-text-secondary` | `#1F2937` | Label, dữ liệu phụ, header bảng |
| `ui-text-muted-soft` | `#374151` | Metadata, mô tả, thông tin phụ |
| `ui-text-disabled` | `#64748B` | Disabled hoặc không khả dụng |

### 3.2 Semantic Brand & Status Colors

- **Primary (Blue)**: `primary-50` (#EFF6FF), `primary-600` (#2563EB - chuẩn action chính), `primary-700` (#1D4ED8 - hover), `primary-800` (#1E40AF - active).
- **Success (Green)**: `success-600` (#15803D), Toast/Badge emerald (#10B981) — Duyệt, hoàn thành, thành công.
- **Warning (Amber)**: `warning-600` (#D97706), amber (#F59E0B) — Chờ duyệt, cảnh báo.
- **Danger (Red)**: `danger-600` (#DC2626), Toast/Alert red (#EF4444) — Lỗi, từ chối, xóa.
- **Neutral Surface**: `surface-page` (`#F8FAFC` / `slate-50`), `surface` (`#FFFFFF`), `border-default` (`#E2E8F0` / `slate-200`).

### 3.3 Quy tắc màu TUYỆT ĐỐI

- KHÔNG thêm màu hex trực tiếp trong JSX/TSX (trừ các trường hợp print/export có phạm vi riêng).
- Biểu đồ và SVG dùng biến `--ui-chart-*`.
- KHÔNG dùng accent tím/indigo/pink ngoài hệ màu chuẩn.
- KHÔNG truyền đạt trạng thái chỉ bằng màu sắc (phải kèm icon hoặc text).

---

## 4. Quy chuẩn Button & Control

### 4.1 Button ([components/ui/Button.tsx](file:///c:/Users/loiho/.gemini/antigravity-ide/scratch/exam-management/frontend/components/ui/Button.tsx))

- **Bo góc**: `rounded-xl` (12px). Tuyệt đối không dùng `rounded-lg` hay `rounded-full` cho button thông thường.
- **Kích thước**:
  - `lg`: cao **44px** (`h-11`) — Đăng nhập, Tạo lịch thi...
  - `md`: cao **40px** (`h-10`) — Lọc kết quả, Bộ lọc, Xuất Excel...
  - `sm`: cao **36px** (`h-9`) — Đóng, Hủy...
  - `xs`: cao **32px** (`h-8`) — Action phụ rất gọn
  - `icon`: **36×36px** (`h-9 w-9`) — Chuông thông báo, icon đơn
  - `icon-lg`: **40×40px** (`h-10 w-10`) — Làm mới, xem lưới
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
❌ Viết in hoa toàn bộ (`uppercase`) cho button hoặc label  
❌ Đặt Toast ở vị trí khác ngoài `fixed bottom-5 right-5`  
❌ Tự viết status mapping màu tùy tiện thay vì dùng `StatusBadge`  
❌ Để 2 nút Primary cùng xuất hiện trên 1 hàng / nhóm  
❌ Đặt nút Danger liền kề ngay cạnh nút Primary mà không tách biệt sang bên trái  
❌ Bỏ qua dark mode (`dark:`) hoặc bỏ qua trạng thái disabled khi `isLoading`  
❌ Trùng lặp khối Avatar / Menu tài khoản ở cả Header và chân Sidebar (phải áp dụng chuẩn Header-First Profile)

