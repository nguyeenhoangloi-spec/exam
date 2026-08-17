type ErrorResponse = {
  status?: number;
  data?: { message?: unknown } | unknown;
  config?: { url?: string };
};

export type UserFacingError = {
  response?: ErrorResponse;
  code?: string;
  message?: string;
  config?: { url?: string };
};

const DEFAULT_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

function requestUrl(error: UserFacingError) {
  return String(error.response?.config?.url || error.config?.url || '');
}

function rawMessage(error: UserFacingError) {
  const value = (error.response?.data as { message?: unknown } | undefined)?.message;
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'string' && value.trim()) return value.trim();
  return typeof error.message === 'string' && error.message.trim() ? error.message.trim() : '';
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
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
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
