# Đặc tả Design System UI — Exam Management System

> Tài liệu này là nguồn chuẩn cho toàn bộ giao diện quản trị, giảng viên và sinh viên. Phạm vi là UI/UX; không thay đổi API, database, route, phân quyền hoặc logic nghiệp vụ.

## 1. Kết quả khảo sát codebase

- Frontend: Next.js App Router, TypeScript, Tailwind CSS.
- Quy mô hiện tại: 37 route page, 171 file TSX, 10 component UI dùng chung.
- Font hiện tại: Inter, các weight 400–700.
- Shell dùng chung: sidebar cố định 252px, collapsed 72px; header 64px; nội dung có `pt-16`; mobile breakpoint 768px.
- Nền mặc định: `slate-50`; surface: trắng; border chính: slate-200; card bo 16px.
- Component đã có: Button, Input, Select, Textarea, Card, Badge, StatusBadge, Tabs, Skeleton, EmptyState.
- Đã có dark mode nhưng hiện đang được hỗ trợ bằng nhiều lớp override trong `globals.css`.

## 2. Bộ token chính thức

### Màu

| Token | Giá trị | Sử dụng |
|---|---|---|
| `primary-50` | `#EFF6FF` | nền highlight, active nhẹ |
| `primary-600` | `#2563EB` | hành động chính, link, focus |
| `primary-700` | `#1D4ED8` | hover |
| `primary-800` | `#1E40AF` | active/pressed |
| `text-primary` | `#0F172A` | tiêu đề, dữ liệu quan trọng |
| `text-body` | `#1F2937` | nội dung chính |
| `text-secondary` | `#475569` | nhãn, icon trung tính |
| `text-muted` | `#64748B` | helper, metadata |
| `border-default` | `#E2E8F0` | viền card, input, table |
| `surface-page` | `#F8FAFC` | nền trang |
| `surface` | `#FFFFFF` | card, modal, table |
| `success-600` | `#15803D` | duyệt, hoàn thành, thành công |
| `warning-600` | `#D97706` | chờ duyệt, cảnh báo, đang xử lý |
| `danger-600` | `#DC2626` | lỗi, từ chối, xóa, nguy hiểm |

Quy tắc: trong UI mới chỉ dùng token Tailwind/CSS hoặc component dùng chung; không thêm màu hex trực tiếp trong page/component. Không dùng purple/violet cho hành động thông thường. Màu trạng thái phải đi cùng icon hoặc ngữ cảnh, không truyền tải bằng màu duy nhất.

### Typography

| Vai trò | Size / line-height | Weight |
|---|---:|---:|
| Page title | 28 / 36px; mobile 24 / 32px | 700 |
| Section title | 20 / 28px; mobile 18 / 26px | 600 |
| Card title | 18 / 26px | 600 |
| Body | 15 / 24px | 400 |
| Body important | 15 / 24px | 500–600 |
| Secondary | 14 / 20px | 400–500 |
| Helper | 13 / 18px | 400–500 |
| Badge | 12 / 18px | 600 |
| KPI | 32 / 38px | 700 |
| Table header | 14 / 20px | 600 |

Không dùng text nhỏ hơn 12px cho nội dung chức năng. Số liệu, điểm, số lượng và KPI dùng `font-variant-numeric: tabular-nums`.

### Spacing và layout

Dùng lưới 4px/8px: `4, 8, 12, 16, 20, 24, 32px`. Khoảng cách mặc định:

- Page content: 24px desktop, 16px mobile.
- Khoảng cách giữa section: 24px.
- Card padding: 24px; card dense/table card: 20px.
- Form field gap: 16px; label–control: 6–8px.
- Khoảng cách nhóm nút: 8px.
- Grid KPI: 16px; desktop 4 cột nếu đủ chiều rộng, tablet 2 cột, mobile 1 cột.
- Content không vượt quá 1440px nếu màn hình cần căn giữa; các bảng được phép scroll ngang.

### Radius, border, shadow

- Card/table/modal: `16px` (`rounded-2xl`).
- Button/input: `8–10px` (`rounded-lg` hoặc `rounded-[10px]`).
- Avatar/status dot: `rounded-full`.
- Border: 1px `#E2E8F0`; không dùng viền đậm để trang trí.
- Card: shadow nhẹ `shadow-2xs` hoặc `shadow-soft`; hover mới nâng lên `shadow-md`.
- Không trộn ngẫu nhiên `rounded-xl`, `rounded-2xl`, `rounded-3xl` cho cùng một loại component.

## 3. Component contract

### Button

- Variant: `primary`, `secondary/outline`, `ghost`, `danger`, `success`, `warning`.
- Size chuẩn hiện tại: `xs 28px`, `sm 32px`, `md 38px`, `lg 42px`.
- Trên mobile, nút thao tác chính và nút có khả năng chạm phải đạt vùng tương tác tối thiểu 44×44px; có thể giữ visual 38px nhưng tăng hit-area.
- Bắt buộc có hover, active, disabled, loading và `focus-visible`.
- Nút nguy hiểm phải có xác nhận nếu xóa dữ liệu hoặc thay đổi trạng thái không thể đảo ngược.

### Input / Select / Textarea

- Height input/select: 40px desktop; mobile tối thiểu 44px.
- Border mặc định slate-200; focus border primary-600 + ring 2px primary với opacity khoảng 20%.
- Label 15px/20px, helper/error 13px/18px.
- Error phải có màu danger, icon hoặc text giải thích; không chỉ đổi border.
- Placeholder là thông tin gợi ý, không dùng làm label thay thế.

### Card / KPI

- Card nền trắng, border nhẹ, 16px, shadow nhẹ.
- Card header có title + subtitle + action, ngăn cách bằng border mảnh.
- KPI ưu tiên số lớn, label rõ và mô tả/trend bên dưới; không dùng quá nhiều màu nền.

### Table

- Table wrapper `overflow-x-auto`, border + radius 16px.
- Header nền slate-50, chữ 14px/20px semibold.
- Cell chữ 15px/22–24px, padding ngang 16px, dọc 14px.
- Hàng có border-top nhẹ; hover dùng nền primary rất nhạt.
- Cột action thống nhất về một dropdown hoặc nhóm icon button; không trộn quá nhiều kiểu.
- Luôn có loading/skeleton, empty state, error state, pagination và trạng thái filter.

### Status / Badge

- Mặc định dùng icon + màu chữ, không cần nền pill.
- Success: `CheckCircle2` + xanh lá.
- Active/in progress: `PlayCircle`/`Clock` + xanh dương.
- Pending/review: `Clock`/`Eye` + amber.
- Danger/rejected/cancelled: `XCircle`/`AlertCircle` + đỏ.
- Draft/locked/neutral: slate.
- Ánh xạ trạng thái dùng chung từ `StatusBadge.tsx`; không tự tạo màu/status mapping trong từng page.

### Modal, drawer, toast

- Modal/drawer: nền trắng, border nhẹ, radius 16px, overlay tối; focus trap, ESC và click ngoài theo ngữ cảnh.
- Toast cố định `bottom-5 right-5`, `z-[110]`, radius 16px, `px-4 py-3`, chữ trắng, shadow-xl, tự đóng sau 4000ms, `role="status"`, `aria-live="polite"`.
- Success toast: emerald-500 + `CheckCircle2`; error toast: red-500 + `AlertCircle`.
- Modal xác nhận hành động nguy hiểm phải nêu rõ hậu quả và có nút Hủy/Thực hiện.

## 4. Shell và responsive

### Desktop

- Sidebar expanded 252px, collapsed 72px.
- Header cao 64px, luôn cố định, nội dung không bị che bởi header.
- Active navigation: nền primary-50, chữ/icon primary-600, weight 700.
- Nhóm menu dùng label 13px semibold/bold, không cạnh tranh với item.

### Mobile

- Breakpoint chuẩn: 768px.
- Sidebar thành drawer 252px; có overlay và nút đóng.
- Content padding 16px; header không làm layout nhảy.
- Table scroll ngang; toolbar/filter xuống nhiều dòng; không ép chữ quá nhỏ.
- Hit target tối thiểu 44×44px cho nút/icon/menu.

## 5. Phát hiện lệch cần xử lý

Đây là các điểm khiến chưa thể khẳng định giao diện hiện tại đồng bộ 100%:

1. Có 387 lần dùng `#0F172A`, 350 lần `#64748B`, 176 lần `#2563EB` và nhiều màu hex rải trong page; cần chuyển dần về token/component.
2. Font size bị phân mảnh: `text-xs` xuất hiện rất nhiều, đồng thời còn có 10px/11px/13px/15px hard-code; cần loại bỏ nội dung chức năng dưới 12px.
3. Radius phân mảnh: `rounded-xl` và `rounded-2xl` cùng xuất hiện dày; cần quy định rõ theo loại component ở trên.
4. `secondary` và `outline` hiện gần như cùng style; có thể giữ alias để tương thích nhưng tài liệu hóa một tên ưu tiên.
5. `globals.css` có nhiều selector override để sửa legacy/dark mode và alias purple/violet sang blue; nên dùng token tại nguồn để giảm phụ thuộc vào override.
6. Dark mode đang được xử lý bằng override toàn shell, nên mỗi màn hình mới phải kiểm tra cả light/dark; không thêm màu light-only hard-code nếu chưa có dark counterpart.
7. Có các màn hình full-screen như login/contact/online exam; chúng được phép có layout riêng nhưng vẫn phải dùng typography, status, focus và accessibility chung.

## 6. Checklist nghiệm thu “đồng bộ UI”

- [ ] Màu mới chỉ đi qua token/variant, không thêm hex tùy ý.
- [ ] Page title, section title, body, helper dùng đúng scale.
- [ ] Card/table/modal dùng đúng radius, border, shadow.
- [ ] Button có đủ hover/active/disabled/loading/focus.
- [ ] Form có label, helper/error, focus và trạng thái disabled.
- [ ] Status dùng `StatusBadge` hoặc mapping dùng chung.
- [ ] Mọi page có loading, empty, error, success feedback.
- [ ] Responsive kiểm tra tại 375px, 768px, 1024px và 1440px.
- [ ] Kiểm tra keyboard navigation, focus-visible, aria-label và contrast.
- [ ] Kiểm tra light mode và dark mode.
- [ ] Giữ nguyên API, database, route, phân quyền và logic nghiệp vụ.

## 7. Thứ tự chuẩn hóa đề xuất

1. Chốt token và component dùng chung: `globals.css`, `tailwind.config.js`, `components/ui/*`.
2. Chuẩn hóa shell: Sidebar, Header, RouteShell, page container.
3. Chuẩn hóa nhóm CRUD lặp lại: subjects, classes, students, teachers, exam rooms, schedules, periods.
4. Chuẩn hóa nhóm nghiệp vụ phức tạp: question bank, exam papers, reports, grading, proctor.
5. Kiểm tra riêng các flow full-screen: login, online exam, contact.
6. Chạy visual/accessibility audit theo checklist ở mục 6 sau mỗi nhóm.

