---
name: exam-design-system
description: >
  Design System chuẩn cho Exam Management System (Next.js + TypeScript + Tailwind CSS).
  Kích hoạt khi: tạo page mới, sửa component UI, chuẩn hóa giao diện, thêm tính năng có UI,
  review layout, hoặc khi có từ khóa "component", "page", "UI", "giao diện", "chuẩn hóa", "design".
  Đây là nguồn chuẩn DUY NHẤT cho toàn bộ token, component contract và shell layout.
---

# 🎨 Exam Design System — Nguồn Chuẩn UI

> **Đã xác minh khớp 100% với codebase** (kiểm tra ngày 2026-08-11).
> Stack: Next.js App Router · TypeScript · Tailwind CSS · Inter font.

---

## 1. Quy mô & cấu trúc codebase

| Chỉ số | Giá trị |
|---|---|
| Route pages | 37 (trong `frontend/app/**`) |
| File TSX | 171 |
| UI components dùng chung | 10 (trong `frontend/components/ui/`) |
| Shared components | `frontend/components/` (Header, Sidebar, RouteShell, Toast, ConfirmModal, Modal, v.v.) |

**Paths quan trọng:**
- Token: `frontend/tailwind.config.js` + `frontend/app/globals.css`
- UI primitives: `frontend/components/ui/` (Button, Input, Card, Badge, Tabs, FilterSelect, Skeleton, TabBar, EmptyState, index)
- StatusBadge: `frontend/components/common/StatusBadge.tsx` → re-exported qua `ui/index.tsx`
- Shell: `frontend/components/RouteShell.tsx`, `Sidebar.tsx`, `Header.tsx`

---

## 2. Token màu — CHỈ dùng các token này

### Tailwind config đã có sẵn (tailwind.config.js)

Token primary (blue):
- primary-50  = #EFF6FF  → nền highlight, active nhẹ
- primary-600 = #2563EB  → hành động chính, link, focus ← CHUẨN
- primary-700 = #1D4ED8  → hover
- primary-800 = #1E40AF  → active/pressed

Token success (green):
- success-600 = #15803D  → duyệt, hoàn thành, thành công ← CHUẨN

Token warning (amber):
- warning-600 = #D97706  → chờ duyệt, cảnh báo ← CHUẨN

Token danger (red):
- danger-600  = #DC2626  → lỗi, từ chối, xóa ← CHUẨN

### Text colors

| Vai trò | Hex | Dùng cho |
|---|---|---|
| text-primary | #0F172A | tiêu đề, dữ liệu quan trọng |
| text-body | #1F2937 | nội dung chính |
| text-secondary | #475569 | nhãn, icon trung tính |
| text-muted | #64748B | helper, metadata |
| border-default | #E2E8F0 (slate-200) | viền card, input, table |
| surface-page | #F8FAFC (slate-50) | nền trang |
| surface | #FFFFFF | card, modal, table |

### Quy tắc màu TUYỆT ĐỐI

- KHÔNG thêm màu hex trực tiếp trong page/component mới
- KHÔNG dùng purple/violet cho hành động thông thường
- KHÔNG dùng màu duy nhất để truyền đạt trạng thái — phải kèm icon hoặc text

---

## 3. Typography Scale

Dùng class utility .edu-* hoặc Tailwind tương đương:

| Class | Size | Line-h | Weight | Dùng cho |
|---|---|---|---|---|
| .edu-page-title | 28px (mobile: 24px) | 36px | 700 | h1 mỗi page |
| .edu-section-title | 20px (mobile: 18px) | 28px | 600 | h2 section |
| .edu-card-title | 18px | 26px | 600 | Tiêu đề card |
| .edu-body | 15px | 24px | 400 | Nội dung chính |
| .edu-body-important | 15px | 24px | 500-600 | Dữ liệu quan trọng |
| .edu-secondary | 14px | 20px | 400-500 | Label, mô tả phụ |
| .edu-helper | 13px | 18px | 400-500 | Helper text, error |
| .edu-badge | 12px | 18px | 600 | Badge, tag |
| .edu-kpi | 32px | 38px | 700 | Số KPI (+ tabular-nums) |
| .edu-table-header | 14px | 20px | 600 | th trong bảng |
| .edu-table-content | 15px | 22px | 400 | td trong bảng |

Quy tắc:
- Không dùng text nhỏ hơn 12px cho nội dung chức năng
- Số liệu/điểm/KPI: thêm font-variant-numeric: tabular-nums (.edu-numeric)
- Font weight tối đa: 700 (Inter chỉ load 400-700)

---

## 4. Spacing & Layout

Lưới 4px/8px: 4, 8, 12, 16, 20, 24, 32px

| Mục | Desktop | Mobile |
|---|---|---|
| Page padding | p-6 (24px) | p-4 (16px) |
| Section gap | gap-6 (24px) | gap-4 |
| Card padding | p-6 | p-4 hoặc p-5 |
| Form field gap | gap-4 (16px) | — |
| Label → control | space-y-1.5 (6px) | — |
| Nút nhóm | gap-2 (8px) | — |
| KPI grid | gap-4, 4 cột → 2 cột → 1 cột | — |

---

## 5. Radius, Border, Shadow

| Loại | Radius | Class |
|---|---|---|
| Card / Table / Modal | 16px | rounded-2xl |
| Button / Input | 8-10px | rounded-lg hoặc rounded-[10px] |
| Avatar / Status dot | full | rounded-full |
| Icon container | 12px | rounded-xl |

Border: 1px border-slate-200/90. Không dùng border đậm trang trí.

Shadow:
- Card bình thường: shadow-2xs
- Card hover: shadow-md
- Không trộn rounded-xl, rounded-2xl, rounded-3xl cùng loại component

---

## 6. Component Contract

### 6.1 Button (components/ui/Button.tsx)

Variants: primary | secondary | outline | ghost | danger | danger-outline | success | warning
(secondary và outline là alias — ưu tiên dùng secondary)

Sizes:
- xs = h-7 (28px)
- sm = h-8 (32px)
- md = h-[38px] ← mặc định
- lg = h-[42px]
- icon = h-8 w-8
- icon-lg = h-[34px] w-[34px]

Props: isLoading, leftIcon, rightIcon, icon, disabled

Checklist:
- hover, active, disabled, loading, focus-visible đều có sẵn trong component
- Nút nguy hiểm (xóa/thay đổi không thể đảo ngược) PHẢI dùng ConfirmModal
- Mobile: hit-area tối thiểu 44×44px

### 6.2 Input / Select / Textarea (components/ui/Input.tsx)

Spec chuẩn:
- Height: h-10 (40px desktop) — mobile tối thiểu 44px
- Border mặc định: border-slate-200/90
- Focus: focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20
- Radius: rounded-[10px]
- Label: text-[15px] font-medium
- Helper/Error: text-[13px]

Checklist:
- Luôn có label — không dùng placeholder thay label
- Error state: màu danger + text giải thích
- Disabled: disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed

### 6.3 Card (components/ui/Card.tsx)

Import: import { Card, CardHeader, CardBody, CardFooter, StatisticCard } from '@/components/ui';

Spec:
- Class gốc: rounded-2xl border border-slate-200/90 bg-white shadow-2xs
- Padding mặc định: p-6 (dùng prop noPadding để bỏ)
- Hover: thêm hover:shadow-md transition
- Header: border-bottom border-slate-100, pb-4 mb-4

### 6.4 StatusBadge (components/common/StatusBadge.tsx)

Import: import { StatusBadge } from '@/components/ui';

LUÔN dùng StatusBadge — không tự tạo status mapping trong page.

Icon mapping chuẩn:
- Success/Active: CheckCircle2 + emerald/success color
- In progress: PlayCircle/Clock + blue/primary
- Pending/Review: Clock/Eye + amber/warning
- Danger/Rejected: XCircle/AlertCircle + red/danger
- Draft/Locked/Neutral: slate

### 6.5 Table

Wrapper bắt buộc:
```
<div className="ui-table-wrap">
  <table className="ui-table">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

Spec (từ globals.css):
- Header: bg-slate-50 text-[14px] font-semibold
- Cell: text-[15px] px-4 py-3.5
- Row hover: hover:bg-slate-50/60
- LUÔN có: loading skeleton, empty state, error state, pagination

### 6.6 Toast (components/Toast.tsx)

Vị trí: fixed bottom-5 right-5 — KHÔNG đặt ở vị trí khác!

Spec:
- z-index: z-[100000]
- Border radius: rounded-2xl
- Padding: px-4 py-3
- Tự đóng sau: 4000ms
- Success: bg #10B981 + icon CheckCircle2
- Error: bg #EF4444 + icon AlertCircle
- Accessibility: role="status" + aria-live="polite"

### 6.7 ConfirmModal (components/ConfirmModal.tsx)

Dùng cho mọi action nguy hiểm hoặc không thể đảo ngược.

Props:
- isOpen, onClose, onConfirm(reason?)
- title, message
- type: 'danger' | 'success' | 'warning' | 'info' (default: 'danger')
- requireReason, confirmText, cancelText, isLoading

Spec: z-[9999], overlay bg-slate-950/60 backdrop-blur-sm, rounded-2xl, max-w-sm

### 6.8 Modal (components/Modal.tsx)

Overlay: fixed inset-0 z-[100], bg-slate-950/55 backdrop-blur-[2px]
Spec: rounded-2xl, max-w-2xl, close khi click overlay, ESC để đóng

---

## 7. Shell Layout

### 7.1 RouteShell (components/RouteShell.tsx)

Desktop:
- Sidebar fixed left: 252px expanded / 72px collapsed
- Header fixed top: 64px (h-16)
- main: margin-left 252/72px, padding-top 64px (pt-16)

Mobile (< 768px):
- Sidebar = drawer 252px + overlay button
- Header: full width, left: 0
- main: no margin-left

Full-screen routes (KHÔNG có sidebar/header):
/login, /student/online-exam, /contact, /forgot-password

### 7.2 Sidebar states

- Expanded: md:ml-[252px]
- Collapsed: ml-[72px] + sidebar-text-node ẩn
- State lưu: localStorage key "sidebar-collapsed"
- Collapsed class trên html: "sidebar-collapsed"

### 7.3 Active navigation style

Active: bg-primary-50 text-primary-600 font-bold
Inactive: text-slate-700 hover:bg-slate-100
Group label: text-[13px] font-semibold text-slate-400 uppercase tracking-wider

---

## 8. Dark Mode

Dark mode dùng class .dark trên html.
Theme lưu trong localStorage key "theme".

Quy tắc khi viết component mới:
- bg-white → dark:bg-slate-900
- bg-slate-50 → dark:bg-slate-800
- text-slate-900 → dark:text-slate-100
- border-slate-200 → dark:border-slate-700
- Không dùng light-only hex nếu chưa có dark counterpart

Lưu ý: Legacy dark override trong globals.css dưới .app-shell-main.
Component mới KHÔNG được phụ thuộc vào override này — phải tự có dark: variant.

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Hành vi |
|---|---|---|
| Mobile | < 768px | Sidebar = drawer, padding 16px, table scroll ngang |
| Tablet | 768px-1023px | Sidebar collapsed, KPI grid 2 cột |
| Desktop | >= 1024px | Sidebar expanded, KPI grid 4 cột |
| Wide | >= 1440px | Content max-w nếu cần căn giữa |

Hit target mobile: tối thiểu 44×44px cho mọi button/icon/menu item.

---

## 10. Page Template Chuẩn

Mỗi page mới phải có đủ:
1. Page Header: h1 (edu-page-title) + mô tả + action button
2. Filter/Search card
3. Loading state (Skeleton)
4. Error state (EmptyState với description lỗi)
5. Empty state (EmptyState tiêu chuẩn)
6. Data table/list
7. Pagination
8. Toast feedback cho mọi CUD action

---

## 11. Checklist Nghiệm thu

Trước khi hoàn thành bất kỳ màn hình nào:

- [ ] Màu chỉ qua token Tailwind, không thêm hex tùy ý
- [ ] Typography dùng đúng .edu-* scale
- [ ] Card/table/modal dùng rounded-2xl, border-slate-200/90, shadow-2xs
- [ ] Button: hover/active/disabled/loading/focus-visible đủ
- [ ] Form: label, helper/error, focus, disabled đủ
- [ ] Status dùng StatusBadge hoặc Badge từ ui
- [ ] Mọi page: loading + empty + error + success feedback
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Dark mode: dark: variant cho mọi color class
- [ ] Keyboard nav, focus-visible, aria-label
- [ ] KHÔNG thay đổi API, database, route, phân quyền, nghiệp vụ

---

## 12. Anti-patterns — TUYỆT ĐỐI KHÔNG làm

❌ Dùng hex trực tiếp: style={{ color: '#2563EB' }}
❌ Tự tạo status color mapping trong page
❌ Dùng purple/violet cho hành động thông thường
❌ Bỏ qua dark mode (thiếu dark: variant)
❌ Text nhỏ hơn 12px trong nội dung chức năng
❌ Trộn radius: Card phải là rounded-2xl, không dùng rounded-xl hay rounded-3xl
❌ Toast ở vị trí khác fixed bottom-5 right-5
❌ Status badge tự tạo không qua StatusBadge component
