import { Global, Module } from '@nestjs/common';
import { SecurityAuditController } from './security-audit.controller';
import { SecurityAuditService } from './security-audit.service';
import { AuditRequestContextService } from './audit-request-context.service';
import { SecurityAuditRetentionWorker } from './security-audit-retention.worker';
import { SecurityAuditInterceptor } from './security-audit.interceptor';

@Global()
@Module({
  controllers: [SecurityAuditController],
  providers: [SecurityAuditService, AuditRequestContextService, SecurityAuditRetentionWorker, SecurityAuditInterceptor],
  exports: [SecurityAuditService, AuditRequestContextService],
})
export class SecurityAuditModule {}
