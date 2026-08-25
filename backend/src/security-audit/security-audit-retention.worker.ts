import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SecurityAuditService } from './security-audit.service';

@Injectable()
export class SecurityAuditRetentionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SecurityAuditRetentionWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly securityAudit: SecurityAuditService) {}

  onModuleInit() {
    void this.run();
    this.timer = setInterval(() => void this.run(), 12 * 60 * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async run() {
    try {
      const changed = await this.securityAudit.anonymizeExpiredIpAddresses();
      if (changed) this.logger.log(`Đã ẩn IP gốc của ${changed} sự kiện kiểm toán hết hạn.`);
      const archived = await this.securityAudit.archiveColdEvents();
      if (archived) this.logger.log(`Đã nén archive ${archived} sự kiện kiểm toán hết giai đoạn nóng.`);
    } catch (error: any) {
      this.logger.error(`Không thể chạy retention nhật ký kiểm toán: ${error?.message || error}`);
    }
  }
}
