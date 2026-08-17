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
Màu chữ chính     = đen xanh đậm, không dùng xám lợt
Cỡ chữ chuẩn      = 15px
Weight tối thiểu  = 400
Bố cục            = Phẳng, hạn chế khung hộp, dùng đường kẻ ngang (divide-y / border-t)
Nút/control       = rounded-xl
Nút chính         = cao 44px
Control/filter    = cao 40px
Nút phụ           = cao 36px
Nhóm 2-3 nút      = Chỉ 1 Primary, cùng chiều cao, tách nút Danger sang trái
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

## 4. Cỡ chữ chuẩn

Hệ thống có 8 cỡ chữ semantic chính trên desktop:

| Token | Cỡ chữ | Line-height | Vai trò | Ví dụ |
|---|---:|---:|---|---|
| `fs-kpi` | 32px | 38px | KPI, tổng số nổi bật | `2.219` |
| `fs-page-title` | 28px | 36px | Tiêu đề trang | `Ngân hàng câu hỏi` |
| `fs-section-title` | 20px | 28px | Tiêu đề khu vực | `Thống kê trạng thái` |
| `fs-card-title` | 18px | 26px | Tiêu đề card | `Thông tin kỳ thi` |
| `fs-body` | 15px | 24px | Nội dung, button, input, label | `Tạo lịch thi` |
| `fs-body-sm` | 14px | 20px | Nội dung phụ, header bảng | `Thời gian` |
| `fs-helper` | 13px | 18px | Hướng dẫn, ghi chú | `Tối đa 10MB` |
| `fs-badge` | 12px | 18px | Badge, trạng thái nhỏ | `Đã duyệt` |

Quy tắc bổ sung:

- Nội dung bảng: 15px.
- Header bảng: 14px, không dùng chữ quá mảnh.
- Button/control có chữ: mặc định 15px.
- Nút icon-only không có chữ nhưng vẫn phải có vùng chạm đúng chuẩn.
- Mobile: tiêu đề trang 24px, tiêu đề section 18px.
- Không dùng 10px hoặc 11px cho nội dung UI thông thường.

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
- Không làm nhiều phần tử cạnh nhau cùng đậm nhất.

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

## 6. Màu chữ

### Light mode — black-forward palette

Không dùng màu đen tuyệt đối `#000000` cho mọi nơi và không dùng xám lợt làm màu chữ chính.

| Token | Màu | Vai trò |
|---|---|---|
| `ui-text-primary` | `#0F172A` | Tiêu đề, nội dung chính |
| `ui-text-body` | `#111827` | Nội dung thường |
| `ui-text-secondary` | `#1F2937` | Label, dữ liệu phụ, header bảng |
| `ui-text-muted-soft` | `#374151` | Metadata, mô tả, thông tin phụ |
| `ui-text-disabled` | `#64748B` | Disabled hoặc không khả dụng |

Nguyên tắc:

- Chữ chính phải nhìn gần như đen và rõ trên nền trắng.
- Chữ phụ vẫn phải đọc dễ, không được nhạt quá.
- Chỉ metadata, placeholder và disabled mới được nhẹ hơn.
- Không tạo phân cấp chỉ bằng màu; kết hợp cỡ chữ, weight, vị trí và spacing.

### Dark mode

Dark mode dùng chữ sáng có tương phản phù hợp trên nền tối; không ép palette đen của light mode sang dark mode.

## 7. Quy chuẩn nút bấm

### Kích thước chuẩn

| Variant | Kích thước | Ví dụ |
|---|---:|---|
| `xs` | cao 32px | action phụ rất gọn |
| `sm` | cao 36px | `Đóng`, `Hủy` |
| `md` | cao 40px | `Bộ lọc`, `Lọc kết quả`, `Xuất Excel` |
| `lg` | cao 44px | `Đăng nhập`, `Tạo lịch thi` |
| `icon` | 36×36px | chuông, thao tác nhỏ |
| `icon-lg` | 40×40px | làm mới, xem dạng lưới |

Mobile áp dụng vùng chạm tối thiểu 44px, kể cả khi variant desktop là `xs`, `sm` hoặc icon.

### Ví dụ trong hệ thống

| Nút | Chuẩn |
|---|---|
| `Đăng nhập với Google` | `lg`, 44px |
| `Đăng nhập` | `lg`, 44px |
| `Tạo lịch thi` | `lg`, 44px |
| `Lọc kết quả` | `md`, 40px |
| `Bộ lọc` | `md`, 40px |
| `Mới nhất`, `Chọn cột` | `md`, 40px |
| `Xuất Excel`, `In báo cáo` | `md`, 40px |
| `Đóng`, `Hủy` | `sm`, 36px |
| Chuông thông báo | `icon`, 36×36px |
| Làm mới, xem dạng lưới | `icon-lg`, 40×40px |

### Hình dạng và typography

- Nút/control thông thường dùng `rounded-xl` — 12px.
- Chữ button: 15px, weight 600, line-height khoảng 22–24px.
- Khoảng cách icon và chữ: 8px.
- Padding ngang: khoảng 12–18px tùy kích thước.
- Không dùng chữ IN HOA toàn bộ cho button thông thường.
- Không dùng `rounded-full` cho button thông thường.

### Variant màu

- Primary: xanh dương, dùng cho action chính.
- Secondary/outline: nền trắng, viền nhẹ, chữ đậm.
- Ghost: nền trong suốt, dùng cho action phụ.
- Danger: đỏ, dùng cho xóa hoặc thao tác nguy hiểm.
- Success: xanh lá, dùng cho xác nhận thành công.

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

## 16. Nguyên tắc ưu tiên

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
