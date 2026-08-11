# Kế hoạch backup và khôi phục dữ liệu

## 1. Mục tiêu

- Bảo vệ đầy đủ dữ liệu PostgreSQL và file upload.
- Khôi phục được toàn hệ thống sau lỗi máy chủ, lỗi thao tác hoặc hỏng dữ liệu.
- Không để backup chứa secret dạng plaintext hoặc nằm cùng máy với database duy nhất.
- Có lịch backup, thời hạn lưu, cảnh báo, kiểm tra checksum và test restore định kỳ.
- Tách thao tác backup an toàn khỏi thao tác restore có tính phá hủy.

## 2. Hiện trạng đã kiểm tra

### Database

- Ứng dụng dùng PostgreSQL qua Prisma.
- Có hệ thống migration tại `backend/prisma/migrations`.
- Đã có backup thủ công trong `database-backups/`:
  - `exam_20260803.backup` — PostgreSQL custom format.
  - `exam_20260803.sql` — SQL dump.
- Chưa thấy script backup tự động, lịch chạy, retention policy, checksum hoặc quy trình restore được chuẩn hóa.
- Migration/seed chỉ dựng schema hoặc dữ liệu mẫu; không thay thế backup dữ liệu production.

### Rủi ro repository cần xử lý trước production

- `database-backups/exam_20260803.backup` và `database-backups/exam_20260803.sql` hiện đang được Git theo dõi. Đây là rủi ro làm lộ dữ liệu cá nhân, dữ liệu bài thi hoặc thông tin nhạy cảm qua repository, bản clone và CI artifact.
- Trước khi bật backup production phải xác định hai file này chứa dữ liệu gì; ngừng commit backup vào Git, thêm quy tắc ignore phù hợp và đánh giá lịch sử repository. Nếu đã có dữ liệu nhạy cảm trong lịch sử, cần quy trình loại bỏ lịch sử và kiểm tra/đổi các credential liên quan; không tự ý xóa lịch sử trong bước triển khai backup.
- `backend/uploads/` đã bị Git ignore, nên việc backup uploads phải do job backup chuyên dụng đảm nhiệm, không dựa vào Git.

### File ngoài database

Ứng dụng lưu file trực tiếp trên filesystem:

- `backend/uploads/questions/`: ảnh/media câu hỏi.
- `backend/uploads/essay/`: file bài tự luận.

Các file này được database tham chiếu bằng URL/path, vì vậy phải backup cùng snapshot database. Nếu chỉ restore database mà thiếu uploads, câu hỏi và bài tự luận sẽ mất media.

### Dữ liệu cần bảo vệ

- Tài khoản, vai trò và quan hệ sinh viên/giảng viên.
- Kỳ thi, lịch thi, phòng thi, phân công và trạng thái nghiệp vụ.
- Ngân hàng câu hỏi, đáp án, media, đề thi và snapshot đề.
- Bài làm, đáp án, điểm, phúc khảo, incident và audit log.
- File bài tự luận, ảnh/media và metadata file.
- Cấu hình hệ thống cần thiết để đọc dữ liệu; không backup secret plaintext vào repository.

## 3. Nguyên tắc bảo vệ

Áp dụng mô hình `3-2-1-1-0`:

- Có ít nhất 3 bản sao.
- Trên ít nhất 2 loại lưu trữ.
- Có ít nhất 1 bản sao ngoài máy chủ chính.
- Có ít nhất 1 bản sao immutable hoặc offline chống ransomware/xóa nhầm.
- Có 0 lỗi chưa kiểm tra sau khi verify checksum và restore thử.

Backup không được lưu trong cùng thư mục hoặc cùng volume duy nhất với PostgreSQL production. Không đưa file `.env`, JWT secret, OAuth secret hoặc key mã hóa vào archive backup thông thường.

## 4. Mục tiêu khôi phục đề xuất

| Mức | RPO | RTO | Dùng cho |
|---|---:|---:|---|
| Production chuẩn | tối đa 15 phút | tối đa 2 giờ | Database và dữ liệu thi đang vận hành |
| File upload | tối đa 1 giờ | tối đa 4 giờ | Media câu hỏi, bài tự luận |
| Môi trường dev/test | 24 giờ | 1 ngày làm việc | Dữ liệu thử nghiệm |

RPO/RTO cần được chốt lại theo hạ tầng và ngân sách thực tế trước khi chọn công cụ backup.

## 5. Thiết kế các loại backup

### 5.1. PostgreSQL

- Backup full hằng đêm bằng `pg_dump -Fc` hoặc công cụ managed backup.
- Nếu production cần RPO 15 phút, bật WAL archiving hoặc point-in-time recovery thay vì chỉ dựa vào dump hằng ngày.
- Trước backup ghi metadata: thời gian bắt đầu/kết thúc, database version, migration version, row count chính và kích thước file.
- Sau backup chạy checksum SHA-256 và kiểm tra archive có thể đọc bằng `pg_restore --list`.
- Không dùng `prisma db push` để khôi phục production; schema phải đi qua migration/runbook đã kiểm soát.

### 5.2. File upload

- Backup incremental hằng ngày cho `backend/uploads/`.
- Backup full hằng tuần.
- Tạo manifest gồm relative path, byte size, modified time và SHA-256.
- So sánh các path trong database với manifest uploads để phát hiện file tham chiếu nhưng bị thiếu.
- Khi restore phải phục hồi file trước hoặc đồng bộ cùng database, sau đó chạy kiểm tra URL/file integrity.
- Database dump và manifest/uploads phải dùng cùng `snapshotId` và có mốc thời gian rõ ràng. Nếu file có thể thay đổi trong lúc dump, job phải dùng cơ chế nhất quán đã chọn (maintenance/quiesce ngắn, snapshot filesystem hoặc versioned object storage); không được ghép tùy ý database của thời điểm này với uploads của thời điểm khác.

### 5.3. Cấu hình và mã nguồn

- Mã nguồn, migration và cấu hình không nhạy cảm lưu trong Git/CI artifact.
- `.env` production không đưa vào backup chung; secret lưu trong secret manager hoặc kho mã hóa riêng.
- Lưu phiên bản dependency, Prisma schema, migration hiện hành và cấu hình deployment để dựng lại ứng dụng.
- Không backup `node_modules`, `.next`, log runtime lớn hoặc file tạm nếu có thể tái tạo.
- Khi restore vào staging/dev, phải dùng dữ liệu đã ẩn danh hoặc môi trường được kiểm soát; không đưa nguyên dữ liệu sinh viên, bài làm hoặc thông tin đăng nhập production vào môi trường dùng chung.

## 6. Lịch và retention đề xuất

### Production

- WAL/incremental: mỗi 5–15 phút nếu hạ tầng hỗ trợ.
- Database full: mỗi đêm, ngoài giờ thi.
- Upload incremental: mỗi đêm.
- Upload/database full archive: mỗi tuần.
- Archive dài hạn: mỗi tháng.

Quy tắc thời gian:

- Lưu timestamp và tên file theo UTC để tránh nhầm khi đổi máy chủ/múi giờ.
- Lịch hiển thị cho người vận hành theo `Asia/Ho_Chi_Minh`, nhưng thời điểm thực thi và tính tuổi backup phải tính bằng UTC.
- Job phải có distributed lock hoặc cơ chế tương đương để không chạy chồng; bản chạy quá thời gian phải bị đánh dấu lỗi, không được ghi đè bản đang có.

Retention ban đầu:

- Daily: 14 bản.
- Weekly: 8 bản.
- Monthly: 12 bản.
- Bản sao immutable/offsite: tối thiểu 30 ngày, điều chỉnh theo quy định lưu trữ của đơn vị.

Không chạy backup full hoặc restore trong thời gian đang tổ chức thi nếu có thể tránh; các thao tác bảo trì phải có thông báo và kiểm tra tải.

## 7. Mã hóa và phân quyền

- Mã hóa khi truyền bằng TLS và mã hóa at rest tại storage.
- Nếu archive tự mã hóa, dùng khóa quản lý ngoài máy chủ ứng dụng; không lưu key cạnh file backup.
- Backup service account chỉ có quyền đọc database/files cần backup và ghi vào bucket backup, không có quyền xóa toàn bộ archive.
- Restore cần quyền riêng, MFA và ghi audit log.
- Không cho frontend tải trực tiếp backup production.
- Nếu có chức năng tải backup cho admin, file phải được mã hóa, có thời hạn ngắn và audit đầy đủ.

## 8. Kiểm tra tính đúng đắn

Mỗi job backup phải có các bước:

1. Khóa phiên bản/migration hiện tại và ghi thời điểm snapshot.
2. Dump database.
3. Archive uploads và tạo manifest.
4. Tạo checksum.
5. Upload bản sao offsite.
6. Verify file tồn tại, checksum khớp và archive đọc được.
7. Ghi kết quả thành công/thất bại.
8. Gửi cảnh báo nếu job lỗi, thiếu file, dung lượng bất thường hoặc quá thời hạn chưa có backup mới.

- Xóa hoặc cô lập artifact tạm khi job thất bại; chỉ đưa bản có manifest, checksum và trạng thái verify thành công vào retention chính thức.
- Kiểm tra dung lượng storage, chi phí dự kiến, thời gian upload và thời gian restore; cảnh báo trước khi hết dung lượng hoặc vượt ngân sách.

Không coi job hoàn tất chỉ vì command trả exit code 0; phải có verify và lưu log kết quả.

## 9. Quy trình restore

### Restore thử nghiệm

- Hằng tháng restore vào database và storage cô lập.
- Chạy Prisma client/schema check, kiểm tra số bản ghi chính, login test, đọc câu hỏi, mở media, xem bài tự luận và đọc audit log.
- Kiểm tra các liên kết file trong database có file tương ứng.
- Ghi thời gian restore thực tế để đo RTO.
- Kiểm tra bản restore không còn token/session đang hoạt động của production; nếu dùng cho staging, ẩn danh PII và vô hiệu hóa các tích hợp gửi email/OAuth/thanh toán.

### Restore production

1. Xác nhận incident, phạm vi mất dữ liệu và mốc thời gian cần khôi phục.
2. Đóng hoặc chuyển ứng dụng sang maintenance mode.
3. Chọn backup đã verify gần nhất và xác nhận checksum.
4. Snapshot/đổi tên dữ liệu hiện tại nếu còn khả năng cứu vãn.
5. Restore database theo runbook.
6. Restore uploads và kiểm tra manifest.
7. Chạy migration chỉ khi được đánh giá tương thích; không tự động chạy migration phá hủy.
8. Smoke test nghiệp vụ và đối chiếu dữ liệu.
9. Mở lại hệ thống, theo dõi lỗi và ghi biên bản.

Restore không nên đặt thành nút một-click trong giao diện ở giai đoạn đầu vì có thể phá hủy dữ liệu. Nếu sau này cần UI, phải có two-person approval, confirmation phrase, maintenance lock và rollback plan.

## 10. Chức năng backup trong hệ thống

Giai đoạn đầu nên có màn hình admin chỉ để theo dõi:

- Lần backup thành công gần nhất.
- Database/file backup gần nhất.
- Kích thước, checksum, retention và trạng thái verify.
- Cảnh báo backup quá hạn hoặc thiếu uploads.
- Link tới runbook vận hành, không đưa secret hoặc đường dẫn storage nhạy cảm ra client.

Nút “Tạo backup ngay” chỉ tạo job bất đồng bộ có audit log và giới hạn tần suất. Nút restore để ngoài UI, do vận hành thực hiện theo runbook.

## 11. Lộ trình triển khai

### Giai đoạn 1 — Chuẩn hóa local/staging

- Chọn `pg_dump` custom format.
- Viết script backup database + uploads + manifest + checksum.
- Viết script verify và restore vào database cô lập.
- Chốt công cụ lưu trữ trước khi viết script (managed backup, S3-compatible storage, NAS hoặc máy chủ riêng); không hard-code provider vào nghiệp vụ ứng dụng.
- Tạo mẫu metadata cho mỗi snapshot: `snapshotId`, UTC start/end, app commit, migration, database version, file list, checksum, size, storage location và verify status.
- Không ghi đè backup cũ; đặt tên theo UTC timestamp.

### Giai đoạn 2 — Tự động hóa production

- Chạy bằng scheduler/CI/managed backup.
- Đẩy archive tới storage offsite có versioning và retention lock.
- Thêm cảnh báo qua email/Slack/monitoring.
- Tách service account và quyền restore.

### Giai đoạn 3 — Vận hành và kiểm toán

- Restore drill hằng tháng.
- Rà retention hằng quý.
- Kiểm tra quyền truy cập và key rotation.
- Cập nhật runbook sau mỗi incident hoặc thay đổi schema/storage.

## 12. Tiêu chí nghiệm thu

- Có backup database và uploads độc lập, nhưng liên kết được bằng cùng snapshot ID.
- Có ít nhất một bản sao offsite và một retention policy rõ ràng.
- Backup được checksum/verify tự động.
- Restore thử thành công vào môi trường cô lập.
- Có cảnh báo khi backup thất bại hoặc quá hạn.
- Không có secret plaintext trong archive hoặc Git.
- Có runbook restore được kiểm tra bởi người khác ngoài người viết.
- Đo được RPO/RTO thực tế và xác nhận đạt mục tiêu đã chốt.
- Không còn backup dữ liệu thật được Git theo dõi; repository/CI không chứa archive production hoặc secret.
- Có cơ chế ngăn job chạy trùng, xử lý artifact lỗi và theo dõi dung lượng/chi phí storage.

## 13. Các quyết định bắt buộc trước khi triển khai

- Môi trường áp dụng: chỉ staging trước hay production ngay sau nghiệm thu.
- Nơi lưu bản sao offsite và bản immutable: managed provider, S3-compatible storage, NAS hay phương án khác.
- RPO/RTO chính thức cho database, uploads và từng giai đoạn kỳ thi.
- Cửa sổ backup theo `Asia/Ho_Chi_Minh`, thời điểm cấm thao tác trong giờ thi và kênh cảnh báo.
- Thời hạn lưu trữ theo quy định của đơn vị, ngân sách storage/egress và người chịu trách nhiệm restore.
- Chính sách ẩn danh dữ liệu khi restore staging, chính sách quản lý khóa và quy trình xử lý hai người cho restore production.

## 14. Phạm vi chưa triển khai

Đây là kế hoạch phân tích. Chưa tạo job backup, chưa upload archive ra storage ngoài, chưa restore database thật và chưa thêm màn hình admin cho backup. Các thao tác đó cần chốt môi trường production, nơi lưu trữ, retention và quyền vận hành trước khi thực hiện.
