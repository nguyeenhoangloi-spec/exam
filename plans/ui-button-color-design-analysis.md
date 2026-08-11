# Phân tích Thiết kế UI — Hệ thống Nút bấm & Màu sắc

## 1. Phạm vi phân tích

Phân tích cách thiết kế UI về **nút bấm** và **hệ thống màu sắc** trong toàn bộ hệ thống Exam Management, đối chiếu với các **chỉ tiêu quy định** trong:

- `frontend/tailwind.config.js` — Bảng màu chủ đề
- `frontend/components/ui/Button.tsx` — Component nút chuẩn
- `frontend/components/ui/Badge.tsx` — Component nhãn chuẩn
- `frontend/components/common/StatusBadge.tsx` — Component trạng thái chuẩn
- `frontend/components/ui/Input.tsx` — Component ô nhập chuẩn
- `GEMINI.md` (mục "🎨 Quy tắc Thiết kế Popup & Thông báo") — Quy định bắt buộc
- Các component dashboard thể hiện cách áp dụng thực tế

---

## 2. Hệ thống màu sắc (Color System)

### 2.1. Bảng màu khai báo trong `tailwind.config.js`

| Nhóm màu | Mã hex các cấp độ | Vai trò |
|---|---|---|
| **Primary (Xanh dương)** | 50 `#eff6ff` → 600 `#2563eb` → 700 `#1d4ed8` → 800 `#1e40af` → 950 `#172554` | Màu chính — hành động chính, liên kết, focus |
| **Success (Xanh lá)** | 50 `#f0fdf4` → 500 `#16a34a` → 600 `#15803d` → 700 `#166534` | Thành công, duyệt, hoàn thành |
| **Warning (Vàng cam)** | 50 `#fffbeb` → 500 `#f59e0b` → 600 `#d97706` → 700 `#b45309` | Cảnh báo, chờ duyệt, đang xử lý |
| **Danger (Đỏ)** | 50 `#fef2f2` → 500 `#ef4444` → 600 `#dc2626` → 700 `#b91c1c` | Lỗi, từ chối, hủy, nguy hiểm |

### 2.2. Quy ước màu chuẩn (sắc thái chính)

| Ý nghĩa | Màu chuẩn | Màu Hover | Màu Active |
|---|---|---|---|
| Hành động chính | `#2563EB` (primary-600) | `#1D4ED8` (primary-700) | `#1E40AF` (primary-800) |
| Thành công | `#16A34A` (green-500) | `#15803D` (green-600) | `#166534` (green-700) |
| Cảnh báo | `#D97706` (amber-600) | `#B45309` (amber-700) | `#92400E` (amber-800) |
| Nguy hiểm | `#DC2626` (red-600) | `#B91C1C` (red-700) | `#991B1B` (red-800) |
| Neutral (text/icon) | `#475569` (slate-600) | — | — |
| Mờ (placeholder) | `#94A3B8` (slate-400) | — | — |

### 2.3. Mã màu nền nhạt dùng cho nền icon/badge (light tint)

| Ý nghĩa | Nền | Border | Chữ |
|---|---|---|---|
| Blue (info/active) | `bg-blue-50` | `border-blue-100`/`border-blue-200` | `text-blue-600` |
| Emerald (success) | `bg-emerald-50` | `border-emerald-200` | `text-emerald-600` |
| Amber (warning) | `bg-amber-50` | `border-amber-200` | `text-amber-600` |
| Rose/Red (danger) | `bg-rose-50` | `border-rose-200` | `text-rose-600` |

---

## 3. Hệ thống nút bấm (Button System)

### 3.1. Component chuẩn `Button.tsx`

#### Danh sách Variant (8 loại)

| Variant | Nền | Chữ | Border | Hover | Active | Mục đích |
|---|---|---|---|---|---|---|
| `primary` | `#2563EB` | trắng | transparent | `#1D4ED8` | `#1E40AF` | Hành động chính (Lưu, Tạo mới) |
| `secondary` | trắng | `#334155` | `#E2E8F0` | bg `#F8FAFC` | bg slate-100 | Hành động phụ (Hủy, Đóng) |
| `outline` | trắng | `#334155` | `#E2E8F0` | bg `#F8FAFC` | bg slate-100 | Giống secondary, nhấn viền |
| `ghost` | transparent | `#64748B` | transparent | bg `#F1F5F9` | bg slate-200 | Hành động nhẹ (Xem, icon) |
| `danger` | `#DC2626` | trắng | transparent | `#B91C1C` | `#991B1B` | Xóa, từ chối, nguy hiểm |
| `danger-outline` | trắng | `#DC2626` | rose-200 | bg `#FEF2F2` | bg rose-100 | Xác nhận xóa/nguy hiểm dạng viền |
| `success` | `#16A34A` | trắng | transparent | `#15803D` | `#166534` | Duyệt, xác nhận thành công |
| `warning` | `#D97706` | trắng | transparent | `#B45309` | `#92400E` | Cảnh báo trước khi thực hiện |

#### Danh sách Kích thước (6 loại)

| Size | Chiều cao | Padding | Font | Border-radius |
|---|---|---|---|---|
| `xs` | 28px (h-7) | px-2.5 | 13px | rounded-lg |
| `sm` | 32px (h-8) | px-[10px] | 13px | rounded-lg |
| `md` | 38px (h-[38px]) | px-3.5 | 14px (text-sm) | rounded-lg |
| `lg` | 42px (h-[42px]) | px-[18px] | 15px | rounded-lg |
| `icon` | 32px (h-8 w-8) | 0 | — | rounded-md |
| `icon-lg` | 34px (h-[34px] w-[34px]) | 0 | — | rounded-lg |

#### Trạng thái (States)

| Trạng thái | Thiết kế |
|---|---|
| **Hover** | Mỗi variant có màu hover tối hơn 1 bậc (primary-700, green-600...) |
| **Active** | Màu active tối hơn 1 bậc nữa (primary-800, green-700...) |
| **Disabled** | `bg-[#E5E7EB]`, chữ `#9CA3AF`, border transparent, `cursor-not-allowed`, `pointer-events-none` |
| **Loading** | Hiển thị icon `Loader2` xoay (`animate-spin`) + chữ, disable toàn bộ |
| **Focus** | `focus:ring-2` màu theo tint: blue `blue-500/30`, red `red-500/30`, green `green-500/30`, amber `amber-500/30`, slate `slate-400/20`, rose `rose-400/20` |
| **Icon bên cạnh** | `leftIcon`/`rightIcon`/`icon` — icon được bọc `<span class="shrink-0">` |

#### Phong cách chung

- `inline-flex items-center justify-center`
- `cursor-pointer select-none`
- `transition-all duration-150`
- Hỗ trợ dark mode qua tailwind `dark:` nhưng chủ yếu light-first
- Border-radius đồng nhất: `rounded-lg` (8px) cho text button, `rounded-md` (6px) cho icon button

---

## 4. Các thành phần màu bổ trợ (Badge & Status)

### 4.1. `Badge.tsx` — Nhãn ngữ nghĩa

| Tone | Màu chữ | Dùng cho |
|---|---|---|
| `slate` | `#475569` | Trung tính, mặc định |
| `blue` | `#2563EB` | Thông tin, active |
| `emerald` | `#15803D` | Thành công |
| `amber` | `#D97706` | Cảnh báo, chờ |
| `rose` | `#DC2626` | Lỗi, nguy hiểm |

- Không nền, không border — chỉ icon + chữ màu (`inline-flex items-center gap-[6px] font-semibold`)

### 4.2. `StatusBadge.tsx` — Trạng thái nghiệp vụ (~31 trạng thái)

| Nhóm | Màu | Trạng thái |
|---|---|---|
| **Success** | `text-[#15803D]` | PUBLISHED, APPROVED, CONFIRMED, COMPLETED, READY, GRADED, SUBMITTED, AUTO_SUBMITTED |
| **Active (blue)** | `text-[#2563EB]` | SCHEDULED, UPCOMING, IN_PROGRESS, ONGOING, IN_USE, DEVICE_CHECK, GRADING |
| **Pending (amber)** | `text-[#D97706]` | WAITING_APPROVAL, PENDING, CHANGE_REQUESTED, UNDER_REVIEW, MAINTENANCE, BUSY, DISCONNECTED |
| **Danger (red)** | `text-[#DC2626]` | CANCELLED, REJECTED, ABSENT |
| **Neutral (slate)** | `text-[#475569]` | DRAFT, ARCHIVED, LOCKED, NOT_STARTED, ROOM_COMPUTER, ROOM_THEORY |

→ Icon + text màu, không badge container. Hỗ trợ dark mode (`dark:text-emerald-400`...).

---

## 5. Đối chiếu với các chỉ tiêu quy định trong GEMINI.md

### 5.1. Quy tắc Popup & Thông báo (bắt buộc)

| Quy định | Giá trị chuẩn | Đối chiếu hệ màu |
|---|---|---|
| Toast Success | Nền `#10B981`, icon `CheckCircle2` | Khớp nhóm success |
| Toast Error | Nền `#EF4444`, icon `AlertCircle` | Khớp nhóm danger |
| ✅ Button toast đóng | Icon `X` trắng, hover `bg-white/15` | Khớp chuẩn nút ghost trên nền màu |
| ConfirmModal danger | Icon `LogOut` rose-600, nền `bg-rose-50 border-rose-200` | Khớp cặp màu rose | 
| ConfirmModal success | Icon `CheckCircle` emerald-600, nền `bg-emerald-50 border-emerald-200` | Khớp cặp màu emerald |
| ConfirmModal info | Icon `Info` blue-600, nền `bg-blue-50 border-blue-200` | Khớp cặp màu blue |
| ConfirmModal warning | Icon `AlertTriangle` amber-600, nền `bg-amber-50 border-amber-200` | Khớp cặp màu amber |
| Nút xác nhận theo type | danger→`variant="danger"`, success→`variant="success"`, info→`variant="primary"`, warning→`variant="secondary"` | Khớp chính xác map variant |
| CriticalConfirmModal | Gradient `from-rose-600 via-rose-700 to-amber-600` | Đúng bậc màu trong bảng màu |
| Error validate | `text-rose-600`, nền `bg-red-100 border-red-200` | Khớp nhóm danger |

### 5.2. Quy tắc chuẩn phát triển (GEMINI.md)

| Chỉ tiêu | Đối chiếu thực tế |
|---|---|
| "Component UI phải dễ tái sử dụng" | ✅ `Button`, `Badge`, `StatusBadge`, `Input` đều là component tái sử dụng có props chuẩn |
| "Form phải có validate rõ ràng" | ✅ Input có trạng thái `error` → border đỏ `#DC2626` + `focus:ring-red-500/20` |
| "Sidebar/header ổn định, responsive" | ✅ Sử dụng box-shadow `2xs` và bảng màu cố định |
| Phân quyền ở backend | Không ảnh hưởng thiết kế UI |

---

## 6. Cách áp dụng trong các component dashboard (thực tiễn)

### 6.1. Card container chuẩn

```tsx
className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
```

- Border-radius `16px`, border `slate-200`, bg trắng, shadow nhẹ `2xs`
- Header card: `border-b border-slate-100`, tiêu đề `text-[17px] font-bold text-slate-900`

### 6.2. Link hành động "Xem tất cả"

```tsx
className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
```

- Màu chữ `blue-600` → hover `blue-700`, kèm icon mũi tên nhỏ → tạo CTA phụ dạng link

### 6.3. Nút chính trong bảng (PendingQuestionList)

| Nút | Variant | Icon | Ý nghĩa |
|---|---|---|---|
| **Duyệt** | `success` + `size="sm"` | `Check` stroke-[3] | Hành động duyệt → xanh lá |
| **Từ chối** | `danger` + `size="sm"` | `X` stroke-[3] | Hành động từ chối → đỏ |
| **Xem chi tiết** | `ghost` + `size="icon"` | `MoreVertical` | Hành động nhẹ → icon 32px |

- `isLoading={busyId === q.id}` → nút đang xử lý hiện spinner, disabled
- `disabled` khi busy → tránh thao tác trùng lặp

### 6.4. Select/filter

```tsx
className="appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-50"
```

- `rounded-xl` (12px), border `slate-200`, icon `ChevronDown` absolute phải → chuẩn dropdown tùy chỉnh

### 6.5. Legend màu trạng thái (ExamProgressOverview)

| Trạng thái | Màu | Biểu diễn |
|---|---|---|
| Chưa bắt đầu | Trắng + border `slate-300` | Chấm tròn rỗng |
| Đang thực hiện | `bg-blue-600` | Chấm tròn đặc xanh |
| Hoàn thành | `bg-emerald-500` | Chấm tròn đặc xanh lá |

### 6.6. Biểu đồ Donut (QuestionStatusChart)

| Trạng thái | Màu | Icon |
|---|---|---|
| Đã duyệt | `#10b981` | `CheckCircle2` emerald |
| Chờ duyệt | `#f59e0b` | `Clock` amber |
| Bị từ chối | `#ef4444` | `XCircle` rose |
| Cần chỉnh sửa | `#3b82f6` | `Pencil` blue |

→ Màu biểu đồ **khớp hoàn toàn** với màu semantics trong StatusBadge/Badge.

---

## 7. Nhận xét tổng hợp

### ✅ Điểm mạnh

1. **Nhất quán semantic color**: Mỗi hành động/trạng thái có 1 màu cố định xuyên suốt (blue=chính, green=thành công, amber=cảnh báo, red=lỗi) từ config → component → màn hình.
2. **Phân cấp hành động rõ ràng**: `primary` (chính) → `secondary/outline` (phụ) → `ghost` (nhẹ); `success`/`danger`/`warning` cho hành động có hậu quả cụ thể.
3. **Đầy đủ trạng thái**: hover, active, disabled, loading, focus ring — mỗi variant đều có đủ.
4. **Kích thước linh hoạt**: 6 size từ `xs` đến `icon-lg` phù hợp mọi ngữ cảnh (bảng, form, toolbar).
5. **Dark mode sẵn sàng**: Badge, StatusBadge, Modal đều có `dark:` variant.
6. **Đối chiếu GEMINI.md đạt**: Popup/Toast/ConfirmModal tuân thủ 100% bảng màu quy định.

### ⚠️ Điểm cần lưu ý

1. **Thiếu variant `info`**: Button không có variant blue-outline riêng (chỉ có `danger-outline`); nhưng `outline` có thể thay thế kèm chữ blue nếu cần.
2. **Trùng lặp secondary/outline**: `secondary` và `outline` có style gần như giống hệt — có thể gộp để giảm bớt, nhưng giữ riêng về mặt ngữ nghĩa.
3. **Màu chart số thập phân**: Donut dùng `#10b981` (hex) trong khi StatusBadge dùng `#15803D` — cùng hue nhưng khác bậc (500 vs 600); không sai nhưng nên dùng chung 1 hằng số nếu cần khớp tuyệt đối.
4. **Badge không có container**: Badge/StatusBadge chỉ có icon + chữ, không có nền — một số màn hình dùng badge có nền riêng (như difficultyBadge trong PendingQuestionList `bg-slate-100 text-slate-600 border-slate-200`) → tồn tại 2 phong cách badge song song.

---

## 8. Kết luận

Hệ thống thiết kế UI về **nút bấm** và **màu sắc** của dự án đạt **đầy đủ các chỉ tiêu quy định**:

| Chỉ tiêu | Đạt |
|---|---|
| Có bảng màu chủ đề định nghĩa tập trung | ✅ |
| Có component nút tái sử dụng với đủ variant ngữ nghĩa | ✅ |
| Có đầy đủ trạng thái hover/active/disabled/loading/focus | ✅ |
| Có nhiều kích thước phù hợp ngữ cảnh | ✅ |
| Màu sắc nhất quán giữa config, component và màn hình | ✅ |
| Đối chiếu đúng quy định popup/toast trong GEMINI.md | ✅ |
| Hỗ trợ dark mode | ✅ |
| Ứng dụng nhất quán trong thực tế (dashboard) | ✅ |