export const QUESTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm (1 đáp án)',
  MULTIPLE_CHOICE: 'Trắc nghiệm (Nhiều đáp án)',
  TRUE_FALSE: 'Đúng / Sai',
  FILL_BLANK: 'Điền vào chỗ trống',
  ESSAY: 'Tự luận',
};

export const EXAM_TYPE_LABELS: Record<string, string> = {
  TRAC_NGHIEM: 'Trắc nghiệm',
  DIEN_LO: 'Điền khuyết',
  FILL_BLANK: 'Điền khuyết',
  TU_LUAN: 'Tự luận',
  THUC_HANH: 'Thực hành',
  HON_HOP: 'Hỗn hợp',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

export const BLOOM_LABELS: Record<string, string> = {
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};

export const QUESTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  ARCHIVED: 'Kho lưu trữ',
};

export const EXAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã công bố',
  SCHEDULED: 'Đã xếp lịch',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
  PROCTOR: 'Cán bộ coi thi',
};
