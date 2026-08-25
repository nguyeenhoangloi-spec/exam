import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type AuditRequestContext = {
  requestId?: string;
  ipAddress?: string;
  httpMethod?: string;
  route?: string;
  userAgent?: string;
};

@Injectable()
export class AuditRequestContextService {
  private readonly storage = new AsyncLocalStorage<AuditRequestContext>();

  run(context: AuditRequestContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  get(): AuditRequestContext {
    return this.storage.getStore() || {};
  }
}
