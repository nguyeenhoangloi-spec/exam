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

### Token màu (tailwind.config.js)
- Primary: primary-600 (#2563EB), primary-700 (hover), primary-800 (active)
- Success: success-600 (#15803D)
- Warning: warning-600 (#D97706)  
- Danger: danger-600 (#DC2626)
- Text: #0F172A (title), #1F2937 (body), #64748B (muted)
- Surface: slate-50 (page), white (card/modal)

### File paths dùng chung
- Tokens: frontend/tailwind.config.js + frontend/app/globals.css
- Components: frontend/components/ui/ (Button, Input, Card, Badge, Tabs, ...)
- StatusBadge: import { StatusBadge } from '@/components/ui'
- Shell: RouteShell.tsx, Sidebar.tsx, Header.tsx

### 3 quy tắc không thể vi phạm
1. KHÔNG thêm màu hex trực tiếp trong page/component mới
2. KHÔNG tự tạo status color mapping — dùng StatusBadge
3. KHÔNG bỏ qua dark mode — mọi color class phải có dark: variant

### Checklist nhanh trước khi submit
- [ ] Token màu (không hex tùy ý)
- [ ] Typography .edu-* đúng scale
- [ ] Border Radius 4 tầng: 8px (controls/buttons/inputs) -> 12px (cards/tables) -> 16px (modals) -> rounded-full (tròn thực sự)
- [ ] Loading + empty + error + success state
- [ ] dark: variant đầy đủ
- [ ] Responsive 375/768/1024/1440px
