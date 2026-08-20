type ErrorResponse = {
  status?: number;
  data?: { message?: unknown; errorCode?: unknown } | unknown;
  config?: { url?: string };
};

export type UserFacingError = {
  response?: ErrorResponse;
  code?: string;
  message?: string;
  config?: { url?: string };
};

const DEFAULT_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

export type ErrorPresentation = {
  title: string;
  message: string;
  action?: string;
};

function requestUrl(error: UserFacingError) {
  return String(error.response?.config?.url || error.config?.url || '');
}

function rawMessage(error: UserFacingError) {
  const value = (error.response?.data as { message?: unknown } | undefined)?.message;
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'string' && value.trim()) return value.trim();
  return typeof error.message === 'string' && error.message.trim() ? error.message.trim() : '';
}

function rawErrorCode(error: UserFacingError) {
  const value = (error.response?.data as { errorCode?: unknown } | undefined)?.errorCode;
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Chỉ ánh xạ các mã nghiệp vụ đã được backend công khai cho sinh viên.
 * Không dùng hàm này cho lỗi xác thực trước khi đăng nhập để tránh lộ trạng thái tài khoản.
 */
export function getOnlineExamErrorPresentation(errorCode?: string, fallbackMessage?: string): ErrorPresentation | null {
  const code = String(errorCode || '').trim();
  const messages: Record<string, ErrorPresentation> = {
    ACCOUNT_LOCKED: {
      title: 'Tài khoản đang bị khóa',
      message: 'Tài khoản của bạn hiện không thể tham gia ca thi.',
      action: 'Vui lòng liên hệ quản trị viên hoặc cán bộ khảo thí để được hỗ trợ.',
    },
    ACCOUNT_INACTIVE: {
      title: 'Tài khoản chưa hoạt động',
      message: 'Tài khoản của bạn chưa ở trạng thái hoạt động nên chưa thể vào ca thi.',
      action: 'Vui lòng liên hệ quản trị viên để kiểm tra tài khoản.',
    },
    STUDENT_NOT_ELIGIBLE: {
      title: 'Chưa có tên trong danh sách dự thi',
      message: 'Bạn chưa được xếp vào danh sách của ca thi này.',
      action: 'Vui lòng kiểm tra lại lịch thi hoặc liên hệ cán bộ khảo thí.',
    },
    STUDENT_BANNED: {
      title: 'Không đủ điều kiện dự thi',
      message: 'Bạn đang bị hạn chế tham dự ca thi này.',
      action: 'Vui lòng liên hệ cán bộ khảo thí để biết lý do và hướng xử lý.',
    },
    EXAM_NOT_STARTED: {
      title: 'Ca thi chưa mở',
      message: fallbackMessage || 'Chưa đến thời gian bắt đầu ca thi.',
      action: 'Bạn có thể quay lại khi ca thi được mở.',
    },
    EXAM_LATE_ENTRY_EXPIRED: {
      title: 'Đã quá thời hạn vào thi',
      message: fallbackMessage || 'Thời gian được phép vào muộn của ca thi đã kết thúc.',
      action: 'Vui lòng liên hệ cán bộ coi thi nếu bạn cần hỗ trợ.',
    },
    EXAM_ENDED: {
      title: 'Ca thi đã kết thúc',
      message: fallbackMessage || 'Bạn không thể bắt đầu bài thi sau khi ca thi kết thúc.',
    },
    EXAM_NOT_ACTIVE: {
      title: 'Ca thi chưa sẵn sàng',
      message: 'Ca thi hiện chưa ở trạng thái cho phép sinh viên vào làm bài.',
      action: 'Vui lòng chờ cán bộ khảo thí mở ca thi hoặc liên hệ để được hỗ trợ.',
    },
    EXAM_PERIOD_NOT_ACTIVE: {
      title: 'Đợt thi chưa hoạt động',
      message: fallbackMessage || 'Đợt thi hiện chưa cho phép tham gia.',
      action: 'Vui lòng liên hệ cán bộ khảo thí để biết thời điểm mở lại.',
    },
    EXAM_NOT_CONFIGURED: {
      title: 'Ca thi chưa được chuẩn bị xong',
      message: 'Đề thi hoặc cấu hình ca thi chưa sẵn sàng.',
      action: 'Vui lòng liên hệ cán bộ khảo thí để được hỗ trợ.',
    },
    ALREADY_SUBMITTED: {
      title: 'Bạn đã nộp bài',
      message: 'Bài thi này đã được nộp nên không thể bắt đầu lại.',
    },
    ATTEMPT_UNDER_REVIEW: {
      title: 'Bài thi đang được xem xét',
      message: 'Phiên làm bài của bạn đang tạm khóa để kiểm tra theo quy chế.',
      action: 'Vui lòng liên hệ giám thị hoặc quản trị viên để được xử lý.',
    },
    MAX_ATTEMPTS_EXCEEDED: {
      title: 'Đã hết số lần làm bài',
      message: fallbackMessage || 'Bạn đã sử dụng hết số lượt thi được phép.',
      action: 'Vui lòng liên hệ cán bộ khảo thí nếu bạn cần được hỗ trợ.',
    },
    RULES_NOT_ACCEPTED: {
      title: 'Chưa xác nhận quy chế thi',
      message: 'Bạn cần đánh dấu đồng ý tuân thủ quy chế trước khi bắt đầu làm bài.',
    },
    EXAM_PASSWORD_REQUIRED: {
      title: 'Cần mật khẩu ca thi',
      message: 'Vui lòng nhập mật khẩu do cán bộ coi thi cung cấp.',
    },
    EXAM_PASSWORD_INVALID: {
      title: 'Mật khẩu chưa đúng',
      message: 'Mật khẩu ca thi không đúng. Vui lòng kiểm tra và nhập lại.',
    },
    ACCESS_CODE_REQUIRED: {
      title: 'Cần mã truy cập',
      message: 'Vui lòng nhập mã truy cập do cán bộ coi thi cung cấp.',
    },
    ACCESS_CODE_INVALID: {
      title: 'Mã truy cập chưa đúng',
      message: 'Mã truy cập không đúng. Vui lòng kiểm tra và nhập lại.',
    },
  };

  return messages[code] || null;
}

export function formatErrorPresentation(presentation: ErrorPresentation) {
  return [presentation.title, presentation.message, presentation.action].filter(Boolean).join('. ');
}

function isTechnicalMessage(message: string) {
  return /Prisma(Client)?|SQLSTATE|AxiosError|Request failed with status code|ECONNREFUSED|ENOTFOUND|TypeError|SyntaxError|stack trace|\bat [A-Za-z]:\\|\bat .*\/src\//i.test(message);
}

function shorten(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized.length > 200 ? `${normalized.slice(0, 197).trimEnd()}...` : normalized;
}

export function getUserErrorMessage(error: UserFacingError | unknown, fallback = DEFAULT_MESSAGE) {
  const candidate = (error && typeof error === 'object' ? error : {}) as UserFacingError;
  const status = Number(candidate.response?.status || 0);
  const url = requestUrl(candidate);

  if (status === 401) {
    if (/\/auth\/(login|google)/i.test(url)) return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (status === 403) {
    const onlineExamMessage = getOnlineExamErrorPresentation(rawErrorCode(candidate), rawMessage(candidate));
    if (onlineExamMessage) return formatErrorPresentation(onlineExamMessage);

    const forbidden = rawMessage(candidate);
    return forbidden && !isTechnicalMessage(forbidden)
      ? shorten(forbidden)
      : 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status === 409) {
    const conflict = rawMessage(candidate);
    return conflict && !isTechnicalMessage(conflict) ? shorten(conflict) : 'Dữ liệu đã tồn tại hoặc vừa được cập nhật. Vui lòng kiểm tra lại.';
  }
  if (status === 429) return 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.';
  if (status >= 500) return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
  if (!candidate.response || candidate.code === 'ERR_NETWORK' || candidate.code === 'ECONNABORTED' || candidate.code === 'ETIMEDOUT') {
    return candidate.code === 'ECONNABORTED' || candidate.code === 'ETIMEDOUT'
      ? 'Kết nối đang quá tải. Vui lòng thử lại sau.'
      : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }

  const message = rawMessage(candidate);
  if (message && !isTechnicalMessage(message)) return shorten(message);
  if (status === 400 || status === 422) return fallback;
  return fallback;
}
