export const QUESTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm',
  ESSAY: 'Tự luận',
  FILL_BLANK: 'Điền khuyết',
};

export const EXAM_TYPE_LABELS: Record<string, string> = {
  TRAC_NGHIEM: 'Trắc nghiệm',
  DIEN_LO: 'Điền khuyết',
  DIEN_KHUYES: 'Điền khuyết',
  DIEN_KHUYET: 'Điền khuyết',
  FILL_BLANK: 'Điền khuyết',
  TU_LUAN: 'Tự luận',
  THUC_HANH: 'Thực hành',
  HON_HOP: 'Hỗn hợp',
  OFFLINE_PAPER: 'Thi tập trung (Giấy)',
  ONLINE_MCQ: 'Thi trực tuyến',
  OFFLINE: 'Thi tập trung',
  ONLINE: 'Thi trực tuyến',
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

/** Format any raw exam type string into standard Vietnamese label */
export function formatExamType(type?: string): string {
  if (!type) return 'Trắc nghiệm';
  const u = type.toUpperCase().trim();
  if (u === 'OFFLINE_PAPER' || u === 'OFFLINE' || u === 'GIAY') return 'Thi tập trung (Giấy)';
  if (u === 'ONLINE_MCQ' || u === 'ONLINE' || u === 'TRUC_TUYEN') return 'Thi trực tuyến';
  if (u === 'TRAC_NGHIEM' || u === 'MCQ' || u === 'SINGLE_CHOICE') return 'Trắc nghiệm';
  if (u === 'TU_LUAN' || u === 'ESSAY') return 'Tự luận';
  if (u === 'DIEN_LO' || u === 'DIEN_KHUYES' || u === 'DIEN_KHUYET' || u === 'FILL_BLANK' || u === 'DIEN') return 'Điền khuyết';
  if (u === 'HON_HOP' || u === 'MIXED') return 'Hỗn hợp';
  if (u === 'THUC_HANH' || u === 'PRACTICE') return 'Thực hành';
  if (u === 'OFFICIAL') return 'Thi chính thức';
  if (u === 'MOCK') return 'Thi thử';
  if (u === 'RETAKE') return 'Thi lại';
  return EXAM_TYPE_LABELS[u] || QUESTION_TYPE_LABELS[u] || type;
}

/** Format exam mode (OFFICIAL / MOCK / RETAKE) into Vietnamese */
export function formatExamMode(mode?: string): string {
  if (!mode) return 'Thi chính thức';
  const u = mode.toUpperCase().trim();
  if (u === 'MOCK') return 'Thi thử';
  if (u === 'RETAKE') return 'Thi lại';
  return 'Thi chính thức';
}
