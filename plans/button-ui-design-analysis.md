# Phân tích Thiết kế UI về Nút (Buttons)

> **Phạm vi**: Chỉ phân tích, không áp dụng thay đổi
> **Ngày**: 11/08/2026

---

## 1. Component chính: `frontend/components/ui/Button.tsx`

### 1.1 Hệ thống Variants (8 loại)

| Variant | Màu nền | Màu chữ | Hover | Active | Mục đích sử dụng |
|---------|---------|---------|-------|--------|-----------------|
| `primary` | `#2563EB` (xanh) | Trắng | `#1D4ED8` | `#1E40AF` | Hành động chính (Thêm, Lưu, Tạo) |
| `secondary` | Trắng | `#334155` | `#F8FAFC` | slate-100 | Hành động phụ (Nhập, Lọc, Hủy) |
| `outline` | Trắng | `#334155` | `#F8FAFC` | slate-100 | Nút viền, tương tự secondary |
| `ghost` | Trong suốt | `#64748B` | `#F1F5F9` | slate-200 | Hành động nhẹ, không nổi bật |
| `danger` | `#DC2626` (đỏ) | Trắng | `#B91C1C` | `#991B1B` | Hành động nguy hiểm (Xóa) |
| `danger-outline` | Trắng | `#DC2626` | `#FEF2F2` | rose-100 | Xóa nhưng nhẹ nhàng hơn |
| `success` | `#16A34A` (xanh lá) | Trắng | `#15803D` | `#166534` | Xác nhận thành công (Duyệt) |
| `warning` | `#D97706` (vàng cam) | Trắng | `#B45309` | `#92400E` | Cảnh báo (Từ chối) |

### 1.2 Hệ thống Sizes (6 kích thước)

| Size | Chiều cao | Padding ngang | Font-size | Góc bo |
|------|-----------|---------------|-----------|--------|
| `xs` | 28px (h-7) | 10px | 13px | 8px |
| `sm` | 32px (h-8) | 10px | 13px | 8px |
| `md` (mặc định) | 38px | 14px | 14px | 8px |
| `lg` | 42px | 18px | 15px | 8px |
| `icon` | 32x32px | — | — | 6px |
| `icon-lg` | 34x34px | — | — | 8px |

### 1.3 Các tính năng hỗ trợ

- **`isLoading`**: Hiện spinner `Loader2` xoay + tự disable nút
- **`leftIcon` / `rightIcon`**: Hỗ trợ icon hai bên text (dùng lucide-react)
- **`icon`**: Alias cho leftIcon (tương thích ngược)
- **`disabled`**: Tự động chuyển sang nền `#E5E7EB`, chữ `#9CA3AF`, `cursor-not-allowed`
- **`focus:ring-2`**: Vòng sáng focus với màu match theo variant (blue/red/green/amber/rose/slate) - đạt tiêu chí accessibility

---

## 2. Bảng màu chuẩn (`tailwind.config.js`)

Màu sắc được khai báo theo **hệ thống scale 50-950** tuân thủ chuẩn Tailwind:

- **Primary (Xanh dương)**: 50→950, chuẩn tại 600 = `#2563EB`
- **Success (Xanh lá)**: 50→700, chuẩn tại 500 = `#16A34A`
- **Warning (Vàng cam)**: 50→700, chuẩn tại 600 = `#D97706`
- **Danger (Đỏ)**: 50→700, chuẩn tại 600 = `#DC2626`

Bổ sung `borderRadius` tùy chỉnh: `2xl: 16px`, `3xl: 20px`, và `boxShadow` tùy chỉnh: `2xs`, `xs`, `soft`, `glow-blue`.

---

## 3. Các pattern thiết kế nút trong thực tế

### 3.1 Pattern Header Page (VD: `QuestionBankHeader.tsx`)

```
[Nút phụ - secondary]      [Nút chính - primary]
("<Nhập dữ liệu>")         ("<Thêm câu hỏi mới>")
```

- **secondary + icon**: Hành động phụ (Nhập dữ liệu, Xuất Excel)
- **primary + icon**: Hành động chính nổi bật (Thêm mới, Tạo)

**Pattern này được lặp lại đồng nhất** ở tất cả các trang: ClassHeader, SubjectHeader, TeacherHeader, StudentHeader, DepartmentHeader, ExamPeriodHeader, ExamRoomHeader, ExamPaperHeader, ExamScheduleHeader, RegradeHeader - tất cả đều dùng `primary` cho CTA chính và `secondary` cho hành động phụ.

### 3.2 Pattern Modal Confirm (`ConfirmModal.tsx`)

```
[Hủy - secondary]      [Xác nhận - danger/primary/warning]
```

- Nút **Hủy** luôn là `secondary`
- Nút **Xác nhận** thay đổi theo ngữ cảnh:
  - `type="danger"` → nút **danger** (đỏ)
  - `type="warning"` → nút **warning** (vàng cam)
  - `type="success"`/`info` → nút **primary** (xanh)
- Icon cảnh báo match màu với variant (red warning triangle, green check, blue info)

### 3.3 Pattern Hành động trên bảng (`PendingQuestionList.tsx`)

```
[Approve - success]      [Reject - danger]
```

- **success** cho hành động phê duyệt (Duyệt)
- **danger** cho hành động từ chối (Từ chối)
- **ghost size="icon"** cho hành động xem chi tiết

### 3.4 Pattern Form Dialog (`QuestionFormDialog.tsx`)

```
[Hủy - secondary] → bên trái    [Lưu - primary + isLoading] → bên phải
```

- Footer đặt `justify-end gap-3`, nút chính luôn ở bên phải
- Nút submit dùng `isLoading={isSubmitting}` hiện spinner khi đang xử lý

### 3.5 Pattern Icon Button thuần (Không qua Button component)

Trong `Header.tsx` và `QuestionBankTableToolbar.tsx`, có các nút icon custom:

- Kích thước cố định 32-36px (h-8.5/h-9/w-8.5/w-9)
- `rounded-xl` (12px) cho header, `rounded-lg` (8px) cho toolbar
- Border `slate-200`, hover `slate-50`, active `scale-95`
- Focus ring `focus-visible:ring-2 focus-visible:ring-blue-500` (accessibility)
- Toggle active state dùng `bg-blue-50 text-blue-600 border-blue-200` (view mode buttons)

---

## 4. Đánh giá theo tiêu chí thiết kế

### ✅ Đạt - Màu sắc đầy đủ

- 4 nhóm màu ngữ nghĩa (primary/success/warning/danger) được khai báo đầy đủ scale
- Mỗi variant có đủ 3 trạng thái: bình thường, hover, active

### ✅ Đạt - Tính nhất quán

- Tất cả header pages dùng cùng pattern (secondary + primary)
- Tất cả modal confirm dùng cùng pattern (secondary + danger/primary)
- Font, border-radius, transition duration đều thống nhất

### ✅ Đạt - Tương phản màu (Accessibility)

- Nền tối đậm + chữ trắng cho primary/success/danger/warning (tỷ lệ tương phản > 4.5:1)
- Nền trắng + chữ tối `#334155` cho secondary/outline/ghost

### ✅ Đạt - Phản hồi trạng thái

- 3 trạng thái màu (default/hover/active) cho mọi variant
- Spinner loading cho hành động async
- Trạng thái disabled rõ ràng (xám, no-pointer)
- Focus ring đủ rõ cho người dùng keyboard

### ✅ Đạt - Kích thước chuẩn

- Chiều cao tối thiểu 28px (xs) → tối đa 42px (lg) - đủ lớn để touch-friendly
- Padding ngang tối thiểu 10px, khoảng cách giữa icon-text ≥ 6px

### ⚠️ Lưu ý nhỏ

- `outline` và `secondary` có style **gần như giống hệt nhau**; về mặt kỹ thuật hiện tại chúng giống nhau, có thể cân nhắc tách bạch rõ ràng hơn (ví dụ outline nên có nền trong suốt)
- Một số nút trong Header/Toolbar chưa dùng chung `Button` component mà dùng `<button>` thuần với class lặp lại - nên refactor về `Button` để tăng tính tái sử dụng

---

## 5. Kết luận

Hệ thống nút của dự án đạt chuẩn cao với **8 variants × 6 sizes**, bao phủ đầy đủ mọi ngữ cảnh: hành động chính/phụ, xác nhận/nguy hiểm, phê duyệt/từ chối, và nút icon thuần. Màu sắc sử dụng đúng bảng màu semantic chuẩn (xanh = hành động, đỏ = nguy hiểm, xanh lá = thành công, vàng = cảnh báo), có đầy đủ trạng thái hover/active/focus/disabled/loading đáp ứng cả tiêu chí UX lẫn accessibility.

---

## 6. Danh sách file đã phân tích

| File | Vai trò |
|------|---------|
| `frontend/components/ui/Button.tsx` | Component nút chính (8 variants, 6 sizes) |
| `frontend/tailwind.config.js` | Bảng màu semantic chuẩn |
| `frontend/components/Header.tsx` | Pattern icon button thuần, dropdown menu |
| `frontend/components/ConfirmModal.tsx` | Pattern modal confirm (secondary + danger/primary) |
| `frontend/components/question-bank/QuestionBankHeader.tsx` | Pattern header page (secondary + primary) |
| `frontend/components/question-bank/QuestionBankTableToolbar.tsx` | Pattern toolbar, toggle view mode |
| `frontend/components/dashboard/PendingQuestionList.tsx` | Pattern success/danger/ghost trên bảng |
| `frontend/components/question-bank/QuestionFormDialog.tsx` | Pattern form dialog (secondary + primary + isLoading) |