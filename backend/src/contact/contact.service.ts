import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactMessageDto } from './dto/contact.dto';

type SmtpTransportOptions = Parameters<typeof nodemailer.createTransport>[0];

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);
    private readonly transporter: nodemailer.Transporter | null;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (!host || !user || !pass) {
            this.logger.warn(
                'Thiếu cấu hình SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS). Chức năng gửi email liên hệ sẽ bị vô hiệu hóa.',
            );
            this.transporter = null;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port: port || 465,
            secure: this.configService.get<string>('SMTP_SECURE') === 'true',
            auth: { user, pass },
            // Một số môi trường proxy/corporate cần disable pool để tránh kẹt connection
            pool: false,
        } as SmtpTransportOptions);
    }

    /**
     * Gửi email qua Gmail SMTP (nodemailer).
     * - Email được gửi TỪ tài khoản SMTP_USER (Gmail app password).
     * - Email được gửi ĐẾN CONTACT_RECIPIENT (mặc định là chính SMTP_USER).
     */
    async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
        if (!this.transporter) {
            throw new ServiceUnavailableException(
                'Chức năng gửi email chưa được cấu hình. Vui lòng liên hệ Quản trị viên hệ thống.',
            );
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"Trung tâm Khảo thí" <${this.configService.get<string>('SMTP_USER')}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
            this.logger.log(`Email đã gửi thành công: ${info.messageId}`);
            return { messageId: info.messageId };
        } catch (err: any) {
            this.logger.error(`Gửi email thất bại: ${err?.message}`);
            throw new ServiceUnavailableException(
                'Không thể gửi email lúc này. Vui lòng kiểm tra cấu hình SMTP hoặc thử lại sau.',
            );
        }
    }

    /**
     * Xử lý tin nhắn liên hệ từ trang /contact:
     * 1. Gửi email thông báo đến bộ phận hỗ trợ (CONTACT_RECIPIENT).
     * 2. Gửi email xác nhận cho người gửi.
     */
    async handleContactMessage(dto: ContactMessageDto) {
        const { fullName, email, role, message } = dto;

        const roleLabel =
            role === 'STUDENT' ? 'Sinh viên' : role === 'TEACHER' ? 'Giảng viên' : 'Cán bộ / Khác';

        const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        const supportHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#2563eb;padding:16px 24px;color:#fff">
          <h2 style="margin:0;font-size:18px">📩 Yêu cầu hỗ trợ mới từ trang Liên hệ</h2>
        </div>
        <div style="padding:24px;font-size:14px;color:#334155;line-height:1.7">
          <p><strong>👤 Họ và tên:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>📧 Email liên hệ:</strong> ${escapeHtml(email)}</p>
          <p><strong>🎓 Vai trò:</strong> ${roleLabel}</p>
          <p><strong>🕒 Thời gian gửi:</strong> ${now}</p>
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:8px">
            <strong>Nội dung yêu cầu:</strong>
            <p style="margin:8px 0 0;white-space:pre-wrap">${escapeHtml(message)}</p>
          </div>
          <p style="margin-top:16px;color:#94a3b8;font-size:12px">Hệ thống Quản lý Khảo thí - Trang Liên hệ & Hỗ trợ</p>
        </div>
      </div>
    `;

        const confirmHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#16a34a;padding:16px 24px;color:#fff">
          <h2 style="margin:0;font-size:18px">✅ Đã nhận yêu cầu hỗ trợ của bạn</h2>
        </div>
        <div style="padding:24px;font-size:14px;color:#334155;line-height:1.7">
          <p>Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
          <p>Trung tâm Khảo thí đã nhận được yêu cầu hỗ trợ của bạn vào lúc <strong>${now}</strong>.</p>
          <p>Bộ phận Kỹ thuật sẽ phản hồi qua email này trong thời gian sớm nhất (trung bình 15 phút trong giờ hành chính).</p>
          <div style="margin-top:16px;padding:16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px">
            <strong>Trích nội dung yêu cầu:</strong>
            <p style="margin:8px 0 0;white-space:pre-wrap">${escapeHtml(message)}</p>
          </div>
          <p style="margin-top:16px">Nếu cần hỗ trợ khẩn cấp, vui lòng gọi Tổng đài <strong>1800-3926-4357</strong> (miễn phí).</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">Hệ thống Quản lý Khảo thí - Trung tâm Hỗ trợ</p>
        </div>
      </div>
    `;

        const recipient = this.configService.get<string>('CONTACT_RECIPIENT') || this.configService.get<string>('SMTP_USER');

        // Gửi song song 2 email: thông báo cho bộ phận hỗ trợ + xác nhận cho người gửi.
        await Promise.all([
            this.sendEmail({
                to: recipient,
                subject: `[Hỗ trợ khảo thí] Yêu cầu mới từ ${fullName}`,
                text: `Yêu cầu hỗ trợ mới từ ${fullName} (${email}, vai trò: ${roleLabel})\n\n${message}`,
                html: supportHtml,
            }),
            this.sendEmail({
                to: email,
                subject: 'Trung tâm Khảo thí đã nhận yêu cầu hỗ trợ của bạn',
                text: `Xin chào ${fullName},\n\nTrung tâm Khảo thí đã nhận được yêu cầu hỗ trợ của bạn. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.\n\nNội dung: ${message}`,
                html: confirmHtml,
            }),
        ]);

        return {
            success: true,
            message: 'Yêu cầu hỗ trợ đã được gửi thành công.',
        };
    }
}

/** Escape HTML để tránh XSS khi nhúng nội dung người dùng vào email HTML. */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}


