export interface SupportKnowledgeArticle {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
}

// This is intentionally curated server-side knowledge. It is safe to expose to
// unauthenticated users and never contains answers, unpublished scores or data
// belonging to another user.
export const SUPPORT_KNOWLEDGE: SupportKnowledgeArticle[] = [
  {
    id: 'art-1',
    title: 'Xử lý mất kết nối khi đang làm bài thi trực tuyến',
    keywords: ['rớt mạng', 'mất mạng', 'mất kết nối', 'wifi', 'internet', 'autosave', 'lưu bài'],
    answer: 'Khi mất kết nối, hãy giữ nguyên tab làm bài và khôi phục mạng. Hệ thống có cơ chế lưu tự động; nếu sự cố kéo dài, hãy báo cán bộ coi thi hoặc gửi yêu cầu hỗ trợ để được ghi nhận.',
  },
  {
    id: 'art-2',
    title: 'Tra cứu lịch thi, số báo danh và phòng thi',
    keywords: ['lịch thi', 'phòng thi', 'số báo danh', 'sbd', 'ca thi', 'ghế ngồi'],
    answer: 'Sau khi đăng nhập, sinh viên vào mục Lịch thi cá nhân để xem môn thi, thời gian, số báo danh, phòng và vị trí ngồi. Nếu thiếu môn thi, hãy gửi yêu cầu hỗ trợ kèm tên môn học.',
  },
  {
    id: 'art-3',
    title: 'Nộp đơn phúc khảo và theo dõi kết quả',
    keywords: ['phúc khảo', 'khiếu nại điểm', 'đơn điểm', 'xem điểm', 'kết quả'],
    answer: 'Bạn chỉ có thể nộp phúc khảo trong thời gian nhà trường cho phép sau khi điểm đã được công bố. Vào mục Kết quả, chọn học phần phù hợp rồi gửi lý do phúc khảo.',
  },
  {
    id: 'art-4',
    title: 'Hướng dẫn ngắn về ngân hàng câu hỏi',
    keywords: ['ngân hàng câu hỏi', 'tạo câu hỏi', 'duyệt câu hỏi', 'bloom', 'import câu hỏi'],
    answer: 'Giảng viên tạo hoặc nhập câu hỏi, gắn môn học và mức độ Bloom, sau đó gửi duyệt. Chỉ câu hỏi đã được duyệt mới được dùng trong đề thi chính thức.',
  },
  {
    id: 'art-5',
    title: 'Quy chế thi trực tuyến',
    keywords: ['quy chế', 'fullscreen', 'camera', 'microphone', 'chuyển tab', 'gian lận'],
    answer: 'Khi thi trực tuyến, hãy tuân thủ yêu cầu về toàn màn hình, camera/microphone nếu kỳ thi quy định, và không chuyển tab. Sự cố kỹ thuật cần được báo ngay cho cán bộ coi thi.',
  },
  {
    id: 'art-6',
    title: 'Khôi phục mật khẩu và đăng nhập',
    keywords: ['quên mật khẩu', 'mật khẩu', 'không đăng nhập', 'đăng nhập', 'google'],
    answer: 'Nếu quên mật khẩu, dùng chức năng Quên mật khẩu tại trang đăng nhập. Trợ lý không thể xem, gửi hoặc thay đổi mật khẩu; nếu không nhận được email khôi phục, hãy gửi yêu cầu hỗ trợ.',
  },
];
