/**
 * AUDIT & SECURITY LOG TRANSLATION & CONTEXTUAL ENRICHMENT HELPERS
 * Chuẩn hóa 100% Tiếng Việt Chuyên Ngành Khảo Thí & Bảo Mật Hệ Thống
 */

export const TRANSLATED_ACTIONS: Record<string, string> = {
  // --- 1. Xác thực & Tài khoản ---
  LOGIN: 'Đăng nhập hệ thống',
  LOGOUT: 'Đăng xuất hệ thống',
  PASSWORD_RESET: 'Đặt lại mật khẩu tài khoản',
  UPDATE_EXAM_PASSWORD: 'Đổi mật khẩu bảo vệ đề thi',
  SESSION_ACCESS_DENIED: 'Phiên truy cập không hợp lệ',
  PERMISSION_DENIED: 'Từ chối do thiếu quyền hạn',
  ROLE_DENIED: 'Từ chối do sai vai trò quy định',
  AUTH_SESSION_REVOKED: 'Thu hồi phiên đăng nhập',

  // --- 2. In ấn, Xuất dữ liệu & Kho lưu trữ bài thi ---
  PRINT: 'In ấn biểu mẫu',
  EXPORT: 'Xuất dữ liệu',
  EXPORT_EXCEL: 'Xuất tệp Excel',
  EXPORT_CSV: 'Xuất tệp CSV',
  EXAM_PAPER_EXPORT_REQUESTED: 'Yêu cầu xuất tệp đề thi',
  EXAM_PAPER_ANSWER_KEY_VIEWED: 'Tra cứu đáp án & barem đề thi',
  QUESTION_ANSWER_KEY_VIEWED: 'Tra cứu đáp án câu hỏi thi',
  QUESTION_BANK_EXPORTED: 'Xuất ngân hàng câu hỏi',
  EXAM_REPORT_EXPORT: 'Xuất báo cáo kết quả thi',
  EXAM_REPORT_PREVIEWED: 'Xem trước biểu mẫu báo cáo',
  EXAM_REPORT_SUMMARY_VIEWED: 'Xem báo cáo tổng hợp khảo thí',
  ATTENDANCE_SHEET_VIEWED: 'Xem & in danh sách điểm danh phòng thi',
  EXAM_ARCHIVES_CONFIG_VIEWED: 'Xem cấu hình kho lưu trữ bài thi',
  EXAM_ARCHIVES_CONFIG_UPDATED: 'Cập nhật cấu hình kho lưu trữ bài thi',
  EXAM_ARCHIVES_SUMMARY_VIEWED: 'Xem tổng quan kho lưu trữ bài thi',
  EXAM_ARCHIVES_FILTER_OPTIONS_VIEWED: 'Tra cứu danh mục bộ lọc kho bài thi',
  EXAM_ARCHIVED_SCHEDULES_VIEWED: 'Xem danh sách ca thi đã lưu trữ',
  EXAM_ARCHIVED_ATTEMPTS_VIEWED: 'Xem danh sách bài thi lưu trữ của ca thi',
  EXAM_ARCHIVED_BATCH_DOSSIER_EXTRACTED: 'Trích xuất trọn bộ túi hồ sơ lưu trữ bài thi',
  EXAM_ARCHIVED_DISPOSAL_PROPOSAL_VIEWED: 'Xem biên bản đề xuất tiêu hủy bài thi hết hạn',
  EXAM_ARCHIVE_ATTEMPT_DETAIL_VIEWED: 'Xem chi tiết bài làm thí sinh trong kho lưu trữ',
  EXAM_ARCHIVE_INTEGRITY_VERIFIED: 'Kiểm tra toàn vẹn chữ ký số bài thi lưu trữ',

  // --- 3. Coi thi, Khảo thí, Chấm thi & Phúc khảo ---
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  RESTORE: 'Khôi phục',
  ARCHIVE: 'Lưu trữ',
  PUBLISH: 'Phát hành chính thức',
  ARRANGE: 'Xếp phòng thi & số báo danh',
  RESET_ARRANGEMENT: 'Đặt lại xếp phòng thi',
  AUTO_ASSIGN: 'Tự động phân công coi thi',
  AUTO_SCHEDULE: 'Tự động xếp lịch thi',
  ASSIGN: 'Phân công cán bộ coi thi',
  CONFIRM: 'Xác nhận nhiệm vụ coi thi',
  REQUEST_CHANGE: 'Yêu cầu đổi ca coi thi',
  APPROVE_CHANGE: 'Phê duyệt đổi ca coi thi',
  REJECT_CHANGE: 'Từ chối đổi ca coi thi',
  DUPLICATE: 'Nhân bản dữ liệu',
  BULK_UPDATE: 'Cập nhật hàng loạt',
  LOCK: 'Khóa đối tượng',
  UNLOCK: 'Mở khóa đối tượng',
  REOPEN_ENTRY: 'Mở lại lượt nộp bài',
  REOPEN_EXAM_ATTEMPT: 'Mở lại lượt thi cho thí sinh',
  RESOLVE_EXAM_INCIDENT: 'Xử lý sự cố phòng thi',
  RESTORE_EXAM_PAPER: 'Khôi phục đề thi đã xóa',
  REVIEW_GRADE_APPEAL: 'Xem xét đơn phúc khảo',
  REGRADE: 'Chấm lại bài thi phúc khảo',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối phê duyệt',
  APPEAL: 'Gửi đơn phúc khảo',

  // --- 4. Tự luận & Rubric & Trợ lý AI ---
  ESSAY_AI_SUGGEST: 'Trợ lý AI đề xuất chấm điểm',
  ESSAY_GRADE: 'Chấm điểm bài tự luận',
  ESSAY_APPROVE: 'Phê duyệt kết quả chấm tự luận',
  ESSAY_GRADING_SUBMIT: 'Nộp bảng chấm điểm tự luận',
  ESSAY_PUBLISH: 'Công bố điểm bài tự luận',
  ESSAY_REOPEN: 'Mở lại lượt chấm tự luận',
  ESSAY_RETURN: 'Trả lại bài chấm yêu cầu chỉnh sửa',
  ESSAY_ATTEMPT_ANSWER_VIEWED: 'Xem bài làm tự luận của thí sinh',
  RUBRIC_VIEWED: 'Xem barem chấm điểm (Rubric)',
  RUBRIC_UPDATE: 'Cập nhật barem chấm điểm (Rubric)',
  RUBRIC_VERSION_HISTORY_VIEWED: 'Xem lịch sử phiên bản Rubric',
  EXAM_RESULT_VIEWED: 'Tra cứu kết quả thi sinh viên',
  EXAM_ATTEMPT_REVIEW_VIEWED: 'Xem lại bài thi và chi tiết câu trả lời',
  GRADE_REPORT_VIEWED: 'Xem bảng điểm thi chính thức',

  // --- 5. Sao lưu & Phục hồi hệ thống ---
  BACKUP: 'Sao lưu dữ liệu',
  CREATE_BACKUP: 'Tạo bản sao lưu dữ liệu',
  BACKUP_QUEUED: 'Đưa vào hàng đợi sao lưu',
  BACKUP_SUCCEEDED: 'Tạo bản sao lưu thành công',
  BACKUP_RESTORE_REQUESTED: 'Gửi yêu cầu khôi phục dữ liệu',
  BACKUP_RESTORE_APPROVED: 'Phê duyệt khôi phục dữ liệu',
  BACKUP_RESTORE_REJECTED: 'Từ chối khôi phục dữ liệu',
  BACKUP_RESTORE_FAILED: 'Khôi phục dữ liệu thất bại',
  BACKUP_STORAGE_CREATED: 'Thêm vị trí lưu trữ sao lưu',
  BACKUP_STORAGE_UPDATED: 'Cập nhật vị trí lưu trữ sao lưu',
  BACKUP_STORAGE_DELETED: 'Xóa vị trí lưu trữ sao lưu',
  BACKUP_STORAGE_REORDERED: 'Sắp xếp thứ tự ưu tiên nơi lưu trữ',
  BACKUP_STORAGE_TEST_SUCCEEDED: 'Kiểm tra kết nối lưu trữ thành công',
  BACKUP_STORAGE_TEST_FAILED: 'Kiểm tra kết nối lưu trữ thất bại',
  BACKUP_SETTINGS_UPDATED: 'Cập nhật cấu hình tự động sao lưu',
  BACKUP_JOB_CANCELLED: 'Hủy tiến trình sao lưu',
  BACKUP_JOB_DELETED: 'Xóa bản sao lưu dữ liệu',
  BACKUP_JOB_VERIFIED: 'Xác thực tính toàn vẹn bản sao lưu',
  BACKUP_OVERVIEW_VIEWED: 'Xem tổng quan sao lưu hệ thống',
  BACKUP_SETTINGS_VIEWED: 'Xem cấu hình sao lưu hệ thống',
  BACKUP_JOB_VIEWED: 'Xem chi tiết bản sao lưu',

  // --- 6. Ma trận phân quyền & An toàn bảo mật ---
  ACCESS_ROLE_PERMISSION_GRANTED: 'Cấp quyền truy cập cho vai trò',
  ACCESS_ROLE_PERMISSION_REVOKED: 'Thu hồi quyền truy cập của vai trò',
  ACCESS_USER_OVERRIDE_SET: 'Thiết lập quyền ngoại lệ cá nhân',
  ACCESS_USER_OVERRIDE_REMOVED: 'Gỡ bỏ quyền ngoại lệ cá nhân',
  ACCESS_SCOPE_REPLACED: 'Cập nhật phạm vi quản lý dữ liệu',
  ACCESS_CONTROL_OVERVIEW_VIEWED: 'Xem tổng quan ma trận phân quyền',
  ACCESS_CONTROL_HISTORY_VIEWED: 'Xem lịch sử phân quyền',
  USER_EFFECTIVE_PERMISSIONS_VIEWED: 'Tra cứu quyền hạn hiệu lực của tài khoản',
  SECURITY_AUDIT_POLICY_UPDATED: 'Cập nhật chính sách lưu giữ kiểm toán',
  SECURITY_AUDIT_LEGAL_HOLD_APPLIED: 'Áp dụng khóa lưu giữ điều tra pháp lý',
  SECURITY_AUDIT_LEGAL_HOLD_RELEASED: 'Mở khóa lưu giữ điều tra pháp lý',
};

export const TRANSLATED_ENTITIES: Record<string, string> = {
  AUTH: 'Xác thực & Bảo mật',
  EXAMPAPER: 'Đề thi',
  EXAM_PAPER: 'Đề thi',
  EXAMARRANGEMENT: 'Xếp phòng thi',
  EXAMSUPERVISOR: 'Cán bộ coi thi',
  EXAM_SUPERVISOR: 'Cán bộ coi thi',
  PROCTOR_ASSIGNMENT: 'Phân công coi thi',
  EXAMPERIOD: 'Kỳ thi',
  EXAM_PERIOD: 'Kỳ thi',
  EXAMSCHEDULE: 'Lịch thi / Ca thi',
  EXAM_SCHEDULE: 'Lịch thi / Ca thi',
  EXAM_ATTEMPT: 'Bài làm của thí sinh',
  EXAM_REPORT: 'Báo cáo khảo thí',
  EXAM_ARCHIVE: 'Kho lưu trữ bài thi',
  EXAM_ARCHIVE_CONFIG: 'Cấu hình lưu trữ bài thi',
  EXAM_ROOM: 'Phòng thi',
  STUDENT: 'Hồ sơ sinh viên',
  TEACHER: 'Hồ sơ giảng viên',
  DEPARTMENT: 'Khoa / Đơn vị đào tạo',
  SUBJECT: 'Môn học / Học phần',
  QUESTION: 'Câu hỏi thi',
  QUESTION_BANK: 'Ngân hàng câu hỏi',
  QUESTION_RUBRIC: 'Barem chấm tự luận (Rubric)',
  ESSAYREVIEW: 'Chấm bài tự luận',
  GRADEAPPEAL: 'Đơn phúc khảo',
  GRADE_APPEAL: 'Đơn phúc khảo',
  BACKUP: 'Hệ thống sao lưu',
  BACKUPOVERVIEW: 'Tổng quan sao lưu',
  BACKUP_SYSTEM: 'Hệ thống sao lưu',
  BACKUPSETTINGS: 'Cấu hình sao lưu',
  BACKUP_SETTINGS: 'Cấu hình sao lưu',
  BACKUP_STORAGE: 'Vị trí lưu trữ sao lưu',
  BACKUP_JOB: 'Bản sao lưu dữ liệu',
  ACCESSCONTROL: 'Ma trận phân quyền',
  ACCESS_CONTROL: 'Ma trận phân quyền',
  ACCESSROLE: 'Vai trò người dùng',
  USERACCESS: 'Quyền hạn người dùng',
  USER: 'Tài khoản người dùng',
  DOCUMENT_TEMPLATE: 'Biểu mẫu tài liệu',
  SECURITY_AUDIT: 'Kiểm toán an ninh',
  SECURITYAUDITEVENT: 'Sự kiện kiểm toán',
  SecurityAuditEvent: 'Sự kiện kiểm toán',
  SecurityAuditRetentionPolicy: 'Chính sách lưu trữ kiểm toán',
  SecurityAuditLegalHold: 'Khóa điều tra pháp lý',
};

export const secCategoryLabel: Record<string, string> = {
  AUTHENTICATION: 'Xác thực tài khoản',
  AUTHORIZATION: 'Kiểm soát phân quyền',
  DATA_ACCESS: 'Truy cập dữ liệu nhạy cảm',
  DATA_EXPORT: 'Xuất dữ liệu & In ấn',
  EXAMINATION: 'Nghiệp vụ khảo thí',
  BACKUP_RECOVERY: 'Sao lưu & Khôi phục',
  AI_PROCESSING: 'Xử lý Trí tuệ nhân tạo (AI)',
  SYSTEM_SECURITY: 'An toàn hệ thống',
};

export const secOutcomeLabel: Record<string, string> = {
  SUCCESS: 'Thành công',
  DENIED: 'Bị từ chối truy cập',
  FAILURE: 'Lỗi hệ thống',
};

export const secActionLabel: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  ARRANGE: 'Xếp lịch & phòng thi',
  AUTO_ASSIGN: 'Tự động phân công coi thi',
  EXAM_PAPER_ANSWER_KEY_VIEWED: 'Tra cứu đáp án & barem đề thi',
  EXAM_PAPER_EXPORT_REQUESTED: 'Yêu cầu xuất tệp đề thi',
  QUESTION_ANSWER_KEY_VIEWED: 'Xem đáp án ngân hàng câu hỏi',
  QUESTION_BANK_EXPORTED: 'Xuất toàn bộ ngân hàng câu hỏi',
  RUBRIC_VIEWED: 'Xem barem chấm điểm (Rubric)',
  RUBRIC_VERSION_HISTORY_VIEWED: 'Xem lịch sử phiên bản Rubric',
  ESSAY_ATTEMPT_ANSWER_VIEWED: 'Xem chi tiết bài làm tự luận của thí sinh',
  EXAM_RESULT_VIEWED: 'Tra cứu kết quả thi sinh viên',
  EXAM_ATTEMPT_REVIEW_VIEWED: 'Xem lại bài làm & lịch sử thao tác',
  GRADE_REPORT_VIEWED: 'Tra cứu bảng điểm thi chính thức',
  EXAM_REPORT_SUMMARY_VIEWED: 'Xem báo cáo tổng hợp khảo thí',
  EXAM_REPORT_PREVIEWED: 'Xem trước biểu mẫu báo cáo',
  EXAM_REPORT_EXPORT: 'Xuất báo cáo kết quả thi',
  ATTENDANCE_SHEET_VIEWED: 'Xem & in danh sách điểm danh phòng thi',
  EXAM_ARCHIVES_CONFIG_VIEWED: 'Xem cấu hình kho lưu trữ bài thi',
  EXAM_ARCHIVES_CONFIG_UPDATED: 'Cập nhật cấu hình kho lưu trữ bài thi',
  EXAM_ARCHIVES_SUMMARY_VIEWED: 'Xem tổng quan kho lưu trữ bài thi',
  EXAM_ARCHIVES_FILTER_OPTIONS_VIEWED: 'Tra cứu danh mục bộ lọc kho bài thi',
  EXAM_ARCHIVED_SCHEDULES_VIEWED: 'Xem danh sách ca thi đã lưu trữ',
  EXAM_ARCHIVED_ATTEMPTS_VIEWED: 'Xem danh sách bài thi lưu trữ của ca thi',
  EXAM_ARCHIVED_BATCH_DOSSIER_EXTRACTED: 'Trích xuất trọn bộ túi hồ sơ lưu trữ bài thi',
  EXAM_ARCHIVED_DISPOSAL_PROPOSAL_VIEWED: 'Xem biên bản đề xuất tiêu hủy bài thi hết hạn',
  EXAM_ARCHIVE_ATTEMPT_DETAIL_VIEWED: 'Xem chi tiết bài làm thí sinh trong kho lưu trữ',
  EXAM_ARCHIVE_INTEGRITY_VERIFIED: 'Kiểm tra toàn vẹn chữ ký số bài thi lưu trữ',
  BACKUP_OVERVIEW_VIEWED: 'Xem tổng quan sao lưu hệ thống',
  BACKUP_SETTINGS_VIEWED: 'Xem cấu hình sao lưu hệ thống',
  BACKUP_JOB_VIEWED: 'Xem chi tiết bản sao lưu dữ liệu',
  ACCESS_CONTROL_OVERVIEW_VIEWED: 'Xem tổng quan ma trận phân quyền',
  ACCESS_CONTROL_HISTORY_VIEWED: 'Xem lịch sử thay đổi phân quyền',
  USER_EFFECTIVE_PERMISSIONS_VIEWED: 'Tra cứu quyền hạn hiệu lực của tài khoản',
  SESSION_ACCESS_DENIED: 'Phiên truy cập không hợp lệ',
  PERMISSION_DENIED: 'Từ chối do thiếu quyền hạn',
  ROLE_DENIED: 'Từ chối do sai vai trò',
  SECURITY_AUDIT_POLICY_UPDATED: 'Cập nhật chính sách lưu giữ kiểm toán',
  SECURITY_AUDIT_LEGAL_HOLD_APPLIED: 'Áp dụng khóa lưu giữ điều tra pháp lý',
  SECURITY_AUDIT_LEGAL_HOLD_RELEASED: 'Mở khóa lưu giữ điều tra pháp lý',
};

/** Lấy tên nhãn hành động chuẩn 100% tiếng Việt */
export function getActionLabel(action: string): string {
  if (!action) return 'Thao tác hệ thống';
  const normalized = action.toUpperCase().replace(/[\s-]+/g, '_').trim();
  if (TRANSLATED_ACTIONS[normalized]) return TRANSLATED_ACTIONS[normalized];
  if (secActionLabel[normalized]) return secActionLabel[normalized];

  return action
    .replace(/Backup Storage Reordered/gi, 'Sắp xếp nơi lưu trữ')
    .replace(/Backup Storage Updated/gi, 'Cập nhật nơi lưu trữ')
    .replace(/Backup Storage Test Failed/gi, 'Kiểm tra lưu trữ thất bại')
    .replace(/Backup Storage Test Succeeded/gi, 'Kiểm tra lưu trữ thành công')
    .replace(/Backup Storage Created/gi, 'Thêm nơi lưu trữ')
    .replace(/Backup Storage Deleted/gi, 'Xóa nơi lưu trữ')
    .replace(/Backup Settings Updated/gi, 'Cập nhật cấu hình sao lưu')
    .replace(/Backup Job Created/gi, 'Tạo bản sao lưu')
    .replace(/Backup Job Succeeded/gi, 'Sao lưu thành công')
    .replace(/Backup Job Failed/gi, 'Sao lưu thất bại')
    .replace(/Password Reset/gi, 'Đặt lại mật khẩu')
    .replace(/Access Role Updated/gi, 'Cập nhật vai trò')
    .replace(/User Login/gi, 'Đăng nhập hệ thống')
    .replace(/User Logout/gi, 'Đăng xuất hệ thống');
}

/** Lấy tên thực thể chuẩn 100% tiếng Việt */
export function getEntityLabel(type?: string | null): string {
  if (!type) return 'Hệ thống';
  const normalized = type.toUpperCase().replace(/[\s-]+/g, '_').trim();
  return TRANSLATED_ENTITIES[normalized] || TRANSLATED_ENTITIES[type.trim()] || type;
}

/** Format mã ID ngắn gọn */
export function formatShortId(id?: string | null): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  if (trimmed.length <= 12) return `#${trimmed}`;
  return `#${trimmed.slice(0, 8)}…`;
}

/** Format thời gian 2 tầng: Tuyệt đối chuẩn tiếng Việt + Tương đối thân thiện */
export function formatDateTime2Tier(isoString: string): {
  absolute: string;
  relative: string;
  fullTooltip: string;
} {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return { absolute: isoString, relative: '', fullTooltip: isoString };
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const pad = (n: number) => String(n).padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    const absolute = `${hours}:${minutes}:${seconds} · ${day}/${month}/${year}`;
    const fullTooltip = `${hours}:${minutes}:${seconds}, ngày ${day} tháng ${month} năm ${year} (UTC+07:00 Giờ Đông Dương)`;

    let relative = '';
    if (diffSec < 45) {
      relative = 'Vừa xong';
    } else if (diffMin < 60) {
      relative = `${diffMin} phút trước`;
    } else if (diffHour < 24 && date.getDate() === now.getDate()) {
      relative = `Hôm nay lúc ${hours}:${minutes}`;
    } else if (diffDay === 1 || (diffHour < 48 && date.getDate() === now.getDate() - 1)) {
      relative = `Hôm qua lúc ${hours}:${minutes}`;
    } else if (diffDay < 7) {
      relative = `${diffDay} ngày trước`;
    } else {
      relative = `${day}/${month}/${year}`;
    }

    return { absolute, relative, fullTooltip };
  } catch {
    return { absolute: isoString, relative: '', fullTooltip: isoString };
  }
}

/** Diễn giải ngữ cảnh chi tiết 100% tiếng Việt cho bản ghi Nhật ký Thao tác (Activity Log) */
export function formatDetailedAuditDescription(log: {
  action: string;
  entityType?: string;
  entityId?: string | null;
  description?: string;
  metadata?: any;
  actor?: any;
}): string {
  const normAction = (log.action || '').toUpperCase().replace(/[\s-]+/g, '_').trim();
  const shortId = log.entityId ? `#${log.entityId}` : '';
  const desc = log.description?.trim();

  // 1. Xác thực & Tài khoản
  if (normAction === 'LOGIN') {
    const ip = log.metadata?.ipAddress || log.metadata?.ip || '';
    return ip ? `Đăng nhập thành công vào hệ thống từ địa chỉ IP ${ip}` : `Đăng nhập thành công vào phiên làm việc hệ thống`;
  }
  if (normAction === 'LOGOUT') {
    return `Đăng xuất an toàn khỏi phiên làm việc hệ thống`;
  }
  if (normAction === 'PASSWORD_RESET') {
    return `Đặt lại mật khẩu cho tài khoản ${log.metadata?.username || shortId || 'người dùng'}`;
  }
  if (normAction === 'UPDATE_EXAM_PASSWORD') {
    return `Thay đổi mật khẩu bảo vệ đề thi chính thức cho ca thi ${shortId}`;
  }

  // 2. In ấn & Hồ sơ lưu trữ bài thi
  if (normAction === 'EXAM_ARCHIVED_BATCH_DOSSIER_EXTRACTED') {
    return `Trích xuất và in trọn bộ túi hồ sơ lưu trữ bài thi cho ca thi ${shortId}`;
  }
  if (normAction === 'EXAM_ARCHIVED_DISPOSAL_PROPOSAL_VIEWED') {
    return `Xem và in biên bản đề xuất tiêu hủy các bài thi đã hết niên hạn lưu trữ`;
  }
  if (normAction === 'ATTENDANCE_SHEET_VIEWED') {
    return `Xem và in danh sách điểm danh phòng thi cho ca thi ${shortId}`;
  }
  if (normAction === 'EXAM_PAPER_EXPORT_REQUESTED') {
    return `Yêu cầu xuất tệp đề thi chính thức kèm thang điểm (Mã đề: ${shortId})`;
  }
  if (normAction === 'EXAM_REPORT_EXPORT') {
    return `Xuất dữ liệu báo cáo thống kê kết quả thi ra tệp ngoài`;
  }
  if (normAction === 'QUESTION_BANK_EXPORTED') {
    return `Xuất toàn bộ ngân hàng câu hỏi thi ra tệp dữ liệu`;
  }

  // 3. Tra cứu đáp án, bài làm, điểm số
  if (normAction === 'EXAM_PAPER_ANSWER_KEY_VIEWED') {
    return `Tra cứu đáp án gốc và barem thang điểm chi tiết của đề thi ${shortId}`;
  }
  if (normAction === 'QUESTION_ANSWER_KEY_VIEWED') {
    return `Tra cứu đáp án chuẩn và lời giải chi tiết cho câu hỏi ${shortId}`;
  }
  if (normAction === 'ESSAY_ATTEMPT_ANSWER_VIEWED') {
    return `Xem chi tiết nội dung bài làm tự luận của thí sinh (Bài thi: ${shortId})`;
  }
  if (normAction === 'GRADE_REPORT_VIEWED') {
    return `Tra cứu bảng điểm thi và kết quả đánh giá của ca thi ${shortId}`;
  }
  if (normAction === 'EXAM_RESULT_VIEWED') {
    return `Xem kết quả thi và bảng điểm chi tiết của thí sinh (Bài thi: ${shortId})`;
  }
  if (normAction === 'EXAM_ATTEMPT_REVIEW_VIEWED') {
    return `Xem lại toàn bộ bài thi và lịch sử làm bài của thí sinh (Bài thi: ${shortId})`;
  }

  // 4. Chấm thi tự luận & Rubric
  if (normAction === 'ESSAY_AI_SUGGEST') {
    return `Trợ lý AI phân tích và đề xuất gợi ý điểm số cho bài tự luận ${shortId}`;
  }
  if (normAction === 'ESSAY_GRADE') {
    return `Cán bộ chấm thi hoàn tất chấm điểm và nhận xét bài tự luận ${shortId}`;
  }
  if (normAction === 'ESSAY_APPROVE') {
    return `Phê duyệt chính thức kết quả chấm thi bài tự luận ${shortId}`;
  }
  if (normAction === 'ESSAY_PUBLISH') {
    return `Công bố điểm thi bài tự luận chính thức cho thí sinh ${shortId}`;
  }
  if (normAction === 'REVIEW_GRADE_APPEAL') {
    return `Hội đồng phúc khảo xem xét và xử lý đơn phúc khảo bài thi ${shortId}`;
  }
  if (normAction === 'REGRADE') {
    return `Cán bộ chấm lại bài thi phúc khảo theo barem quy định (${shortId})`;
  }

  // 5. Coi thi, Xếp phòng, Đổi ca
  if (normAction === 'AUTO_ASSIGN') {
    return desc || `Tự động phân công cán bộ coi thi cho các phòng thi`;
  }
  if (normAction === 'ARRANGE') {
    return desc || `Hoàn tất xếp phòng thi và phân bổ thí sinh cho ca thi ${shortId}`;
  }
  if (normAction === 'REQUEST_CHANGE') {
    return desc || `Giảng viên gửi yêu cầu xin đổi ca coi thi tại phòng thi ${shortId}`;
  }
  if (normAction === 'APPROVE_CHANGE') {
    return desc || `Phê duyệt yêu cầu đổi ca coi thi tại phòng thi ${shortId}`;
  }

  // 6. Sao lưu & Khôi phục
  if (normAction === 'BACKUP_QUEUED') {
    return `Đưa vào hàng đợi tiến trình tạo bản sao lưu dữ liệu toàn hệ thống`;
  }
  if (normAction === 'BACKUP_SUCCEEDED') {
    return `Tiến trình sao lưu dữ liệu hệ thống đã hoàn thành thành công`;
  }
  if (normAction === 'BACKUP_RESTORE_APPROVED') {
    return `Phê duyệt yêu cầu khôi phục dữ liệu hệ thống từ bản sao lưu ${shortId}`;
  }
  if (normAction === 'BACKUP_JOB_VERIFIED') {
    return `Xác thực tính toàn vẹn chữ ký số SHA-256 của bản sao lưu ${shortId}`;
  }

  // 7. Phân quyền
  if (normAction === 'ACCESS_ROLE_PERMISSION_GRANTED') {
    return `Cấp quyền truy cập mới cho vai trò quản trị trong hệ thống`;
  }
  if (normAction === 'ACCESS_ROLE_PERMISSION_REVOKED') {
    return `Thu hồi quyền truy cập của vai trò người dùng trong hệ thống`;
  }
  if (normAction === 'ACCESS_USER_OVERRIDE_SET') {
    return `Thiết lập quyền hạn ngoại lệ cá nhân cho tài khoản ${shortId}`;
  }
  if (normAction === 'USER_EFFECTIVE_PERMISSIONS_VIEWED') {
    return `Tra cứu ma trận quyền hạn hiệu lực của tài khoản ${shortId}`;
  }

  // 8. Nếu description gốc bằng tiếng Việt có nghĩa rõ ràng
  if (desc && !/^[A-Za-z0-9_\s:-]+$/.test(desc) && desc.length > 5) {
    return desc;
  }

  // 9. Fallback chung có ngữ cảnh
  const act = getActionLabel(normAction);
  const ent = getEntityLabel(log.entityType);
  if (shortId) {
    return `${act} đối tượng ${ent} (Mã định danh: ${shortId})`;
  }
  return `${act} trên phân hệ ${ent}`;
}

/** Diễn giải ngữ cảnh chi tiết 100% tiếng Việt cho Sự kiện Kiểm toán An ninh (Security Event) */
export function formatDetailedSecurityDescription(event: {
  action: string;
  category?: string;
  entityType?: string;
  entityId?: string | null;
  outcome?: string;
  route?: string;
  ipAddress?: string;
  metadata?: any;
  actor?: any;
}): string {
  const normAction = (event.action || '').toUpperCase().replace(/[\s-]+/g, '_').trim();
  const shortId = event.entityId ? `#${event.entityId}` : '';
  const outcomeText = event.outcome === 'DENIED' ? ' (Bị từ chối)' : event.outcome === 'FAILURE' ? ' (Thất bại)' : '';

  if (normAction === 'SESSION_ACCESS_DENIED') {
    return `Phiên truy cập đã hết hạn hoặc không hợp lệ, hệ thống từ chối quyền truy cập đường dẫn ${event.route || ''}`;
  }
  if (normAction === 'PERMISSION_DENIED') {
    return `Tài khoản bị từ chối truy cập do thiếu quyền hạn cần thiết trên đối tượng ${getEntityLabel(event.entityType)} ${shortId}`;
  }
  if (normAction === 'ROLE_DENIED') {
    return `Tài khoản bị từ chối do không thuộc vai trò được phép truy cập chức năng ${event.route || ''}`;
  }
  if (normAction === 'SECURITY_AUDIT_LEGAL_HOLD_APPLIED') {
    return `Áp dụng khóa lưu giữ điều tra pháp lý cho sự kiện kiểm toán ${shortId}`;
  }
  if (normAction === 'SECURITY_AUDIT_LEGAL_HOLD_RELEASED') {
    return `Gỡ bỏ khóa lưu giữ điều tra pháp lý cho sự kiện kiểm toán ${shortId}`;
  }
  if (normAction === 'SECURITY_AUDIT_POLICY_UPDATED') {
    return `Cập nhật chính sách thời gian lưu giữ dữ liệu kiểm toán cho nhóm ${secCategoryLabel[event.category || ''] || event.category}`;
  }

  // Tái sử dụng logic diễn giải phong phú
  const baseDesc = formatDetailedAuditDescription({
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: event.metadata,
    actor: event.actor,
  });

  return `${baseDesc}${outcomeText}`;
}

/** Dịch các khóa thuộc tính Metadata sang tiếng Việt */
export const METADATA_KEY_TRANSLATIONS: Record<string, string> = {
  ip: 'Địa chỉ IP',
  ipAddress: 'Địa chỉ IP',
  status: 'Trạng thái',
  reason: 'Lý do ghi nhận',
  format: 'Định dạng tệp',
  scheduleId: 'Mã ca thi',
  examScheduleId: 'Mã ca thi',
  examPaperId: 'Mã đề thi',
  paperCode: 'Mã đề thi',
  questionCode: 'Mã câu hỏi',
  questionId: 'Mã câu hỏi',
  attemptId: 'Mã bài thi thí sinh',
  studentCode: 'Mã số sinh viên (MSSV)',
  teacherCode: 'Mã giảng viên',
  studentId: 'Mã sinh viên',
  teacherId: 'Mã giảng viên',
  subjectId: 'Mã môn học',
  subjectCode: 'Mã môn học',
  subjectName: 'Tên môn học',
  roomId: 'Mã phòng thi',
  roomCode: 'Mã phòng thi',
  examPeriodId: 'Mã kỳ thi',
  score: 'Điểm số',
  totalScore: 'Tổng điểm',
  oldScore: 'Điểm số ban đầu',
  newScore: 'Điểm số sau điều chỉnh',
  oldData: 'Dữ liệu trước thay đổi',
  newData: 'Dữ liệu sau thay đổi',
  comment: 'Nhận xét của cán bộ',
  teacherComment: 'Nhận xét của cán bộ chấm',
  reviewNote: 'Ghi chú hội đồng phúc khảo',
  proposal: 'Phương án đề xuất',
  changeRequestId: 'Mã yêu cầu đổi ca',
  replacementTeacherId: 'Mã giảng viên thay thế',
  category: 'Nhóm an ninh',
  hotDays: 'Thời gian dữ liệu nóng (ngày)',
  retainDays: 'Thời gian lưu giữ tối thiểu (ngày)',
  rawIpDays: 'Thời gian giữ IP thô (ngày)',
  caseReference: 'Mã hồ sơ điều tra / Biên bản',
  requestId: 'Mã yêu cầu hệ thống',
  userAgent: 'Trình duyệt / Thiết bị',
  timestamp: 'Dấu thời gian',
  note: 'Ghi chú thêm',
};

/** Dịch tên thuộc tính metadata */
export function translateMetadataKey(key: string): string {
  return METADATA_KEY_TRANSLATIONS[key] || key;
}
