---
trigger: contextual
description: >
  Áp dụng khi làm việc với UI/giao diện: tạo page mới, sửa component,
  chuẩn hóa giao diện, review layout, thêm tính năng có UI.
  Kích hoạt khi có từ khóa: component, page, UI, giao diện, chuẩn hóa,
  design, màn hình, layout, table, form, button, modal, toast, badge,
  sidebar, header, dashboard, trang, màu, responsive.
---

# UI Design System — Exam Management

## Bắt buộc đọc trước khi làm bất kỳ tác vụ UI nào

Trước khi tạo, sửa hoặc review bất kỳ file UI nào trong dự án này,
agent PHẢI đọc file skill sau và tuân thủ nghiêm ngặt:

```
.agent/skills/exam-design-system/SKILL.md
```

## Tóm tắt nhanh (đọc skill để có chi tiết đầy đủ)

### 1. Token màu & Font
- **Font Web UI**: Chỉ dùng Inter (`next/font/google`). Tuyệt đối cấm serif và monospace trong UI.
- **Palette**: Black-forward palette (`#0F172A`, `#111827`, `#1F2937`, `#374151`, `#64748B`).
- **Primary**: `primary-600` (#2563EB), `primary-700` (hover), `primary-800` (active).
- **Trạng thái**: Success (#15803D/#10B981), Warning (#D97706/#F59E0B), Danger (#DC2626/#EF4444).

### 2. Cỡ chữ & Weight chuẩn
- **15px**: Button, Control, Input, Select, Textarea, Label, Table body (`font-normal` 400).
- **14px**: Header bảng (`thead th` - `font-medium` 500).
- **18px / 20px / 28px**: Card title / Section title / Page title (`font-semibold` 600).
- **32px**: KPI / Số liệu nổi bật (`font-bold` 700 + `tabular-nums`).

### 3. Controls & Buttons
- **Bo góc**: `rounded-xl` (12px) cho mọi Button, Input, Select, Control. (Avatar/switch mới dùng `rounded-full`).
- **Kích thước**: Nút chính `lg` = 44px (`h-11`), Filter/Control `md` = 40px (`h-10`), Nút phụ `sm` = 36px (`h-9`), `xs` = 32px (`h-8`). Mobile tối thiểu 44px.
- **Nhóm 2-3 nút**: Chỉ duy nhất 1 nút `Primary` trên cùng một nhóm; cùng chiều cao; nút `Danger` (Xóa) tách biệt hẳn sang bên trái (`justify-between`).
- **Tên nút**: Cấu trúc `Động từ + Đối tượng` (ngắn gọn, không viết hoa toàn bộ).
- **Nút loading**: Phải gán `disabled={isLoading}` và `aria-busy={isLoading}`.

### 4. Popup & Toast
- **Toast**: `fixed bottom-5 right-5`, `z-[110]`, `rounded-2xl`, tự đóng 4s.
- **Modal / Drawer**: `z-[100]`, backdrop blur, dark mode hỗ trợ đầy đủ.
- **ConfirmModal / CriticalConfirmModal**: `z-[9999]`.

### 5. Lệnh kiểm tra kỹ thuật
```bash
npm run audit:ui
npx tsc --noEmit --incremental false --pretty false
npm run lint -- --no-cache
npm run build
```
