/** Shared formatting helpers (Vietnamese locale, Asia/Ho_Chi_Minh timezone). */

export function formatNumber(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('vi-VN');
}

export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    try {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return String(date);
    }
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    try {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    } catch {
        return String(date);
    }
}

export function formatTimeHHmm(time: string | null | undefined): string {
    if (!time) return '—';
    const match = time.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : time;
}

/** Relative "time ago" in Vietnamese, e.g. "5 phút trước". */
export function timeAgo(date: string | Date | null | undefined): string {
    if (!date) return 'vừa xong';
    let timestamp: number;
    try {
        timestamp = new Date(date).getTime();
    } catch {
        return 'vừa xong';
    }
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return 'vừa xong';
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return formatDate(date);
}

/** Greeting based on the current hour (Asia/Ho_Chi_Minh). */
export function getGreeting(hour = new Date().getHours()): string {
    if (hour < 5) return 'Chúc ngủ ngon';
    if (hour < 11) return 'Chào buổi sáng';
    if (hour < 14) return 'Chào buổi trưa';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
}

export function getGreetingEmoji(hour = new Date().getHours()): string {
    if (hour < 5) return '🌙';
    if (hour < 11) return '☀️';
    if (hour < 14) return '🌤️';
    if (hour < 18) return '⛅';
    return '🌙';
}
