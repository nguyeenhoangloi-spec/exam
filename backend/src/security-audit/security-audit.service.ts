import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { Prisma, SecurityAuditCategory, SecurityAuditOutcome } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditRequestContextService } from './audit-request-context.service';
import { CreateLegalHoldDto, SecurityAuditQueryDto, UpdateRetentionPolicyDto } from './dto/security-audit.dto';

type SecurityActor = { id?: number; sub?: number; role?: string } | null | undefined;
type SecurityAuditInput = {
  category: SecurityAuditCategory;
  action: string;
  outcome: SecurityAuditOutcome;
  actor?: SecurityActor;
  subjectUserId?: number;
  entityType?: string;
  entityId?: string | number;
  metadata?: Prisma.InputJsonValue;
};

const DEFAULT_POLICIES: Array<{ category: SecurityAuditCategory; hotDays: number; retainDays: number; rawIpDays: number }> = [
  { category: 'AUTHENTICATION', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'AUTHORIZATION', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'DATA_ACCESS', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'DATA_EXPORT', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'EXAMINATION', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'BACKUP_RECOVERY', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'AI_PROCESSING', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
  { category: 'SYSTEM_SECURITY', hotDays: 90, retainDays: 1825, rawIpDays: 90 },
];

@Injectable()
export class SecurityAuditService {
  private policiesEnsured = false;
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: AuditRequestContextService,
  ) {}

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private stableJson(value: any): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map((item) => this.stableJson(item)).join(',')}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${this.stableJson(value[key])}`).join(',')}}`;
  }

  private sanitize(value: any, depth = 0): any {
    if (depth > 4) return '[truncated]';
    if (Array.isArray(value)) return value.slice(0, 20).map((item) => this.sanitize(item, depth + 1));
    if (!value || typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 500) : value;
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (/password|token|secret|answer|response|content|prompt|cookie|authorization|apiKey/i.test(key)) {
        result[key] = '[redacted]';
      } else {
        result[key] = this.sanitize(item, depth + 1);
      }
    }
    return result;
  }

  private actorId(actor?: SecurityActor) {
    return actor?.id ?? actor?.sub ?? null;
  }

  async ensurePolicies() {
    if (this.policiesEnsured) return;
    await this.prisma.$transaction(DEFAULT_POLICIES.map((policy) => this.prisma.securityAuditRetentionPolicy.upsert({
      where: { category: policy.category },
      create: policy,
      update: {},
    })));
    this.policiesEnsured = true;
  }

  async write(input: SecurityAuditInput) {
    await this.ensurePolicies();
    const request = this.context.get();
    const policy = await this.prisma.securityAuditRetentionPolicy.findUniqueOrThrow({ where: { category: input.category } });
    const occurredAt = new Date();
    const retentionUntil = new Date(occurredAt.getTime() + policy.retainDays * 24 * 60 * 60 * 1000);
    const actorId = this.actorId(input.actor);
    const ipAddress = request.ipAddress?.slice(0, 100) || null;
    const payload = {
      id: randomUUID(),
      occurredAt: occurredAt.toISOString(), category: input.category, action: input.action.slice(0, 120), outcome: input.outcome,
      actorId, subjectUserId: input.subjectUserId ?? null, entityType: input.entityType?.slice(0, 100) || null,
      entityId: input.entityId == null ? null : String(input.entityId).slice(0, 160), requestId: request.requestId || null,
      httpMethod: request.httpMethod || null, route: request.route?.slice(0, 240) || null,
      ipHash: ipAddress ? this.hash(ipAddress) : null, userAgentHash: request.userAgent ? this.hash(request.userAgent) : null,
      metadata: this.sanitize(input.metadata || {}), retentionUntil: retentionUntil.toISOString(),
    };

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026082512)`;
      const previous = await tx.securityAuditEvent.findFirst({ orderBy: { occurredAt: 'desc' }, select: { eventHash: true } });
      const eventHash = this.hash(`${previous?.eventHash || 'GENESIS'}:${this.stableJson(payload)}:${process.env.AUDIT_HASH_SECRET || 'local-audit-integrity-key'}`);
      return tx.securityAuditEvent.create({ data: { ...payload, ipAddress, previousHash: previous?.eventHash || null, eventHash } });
    });
  }

  async list(query: SecurityAuditQueryDto) {
    await this.ensurePolicies();
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const where: Prisma.SecurityAuditEventWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.outcome ? { outcome: query.outcome } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorId ? { actorId: Number(query.actorId) } : {}),
      ...(query.legalHold !== undefined ? { legalHold: query.legalHold } : {}),
      ...(query.from || query.to ? { occurredAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } } : {}),
      ...(query.search ? { OR: [{ action: { contains: query.search, mode: 'insensitive' } }, { entityType: { contains: query.search, mode: 'insensitive' } }, { entityId: { contains: query.search, mode: 'insensitive' } }, { actor: { username: { contains: query.search, mode: 'insensitive' } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.securityAuditEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { actor: { select: { id: true, username: true, email: true, role: true } } } }),
      this.prisma.securityAuditEvent.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async policies() { await this.ensurePolicies(); return this.prisma.securityAuditRetentionPolicy.findMany({ orderBy: { category: 'asc' } }); }

  async updatePolicy(category: SecurityAuditCategory, dto: UpdateRetentionPolicyDto, actorId: number) {
    if (dto.retainDays < 1825) throw new BadRequestException('Nhật ký kiểm toán phải được giữ tối thiểu 5 năm.');
    if (dto.hotDays > dto.retainDays || dto.rawIpDays > dto.retainDays) throw new BadRequestException('Thời gian dữ liệu nóng/IP không được lớn hơn thời gian lưu giữ.');
    const updated = await this.prisma.securityAuditRetentionPolicy.upsert({ where: { category }, create: { category, ...dto, updatedById: actorId }, update: { ...dto, updatedById: actorId } });
    await this.write({ category: 'SYSTEM_SECURITY', action: 'SECURITY_AUDIT_POLICY_UPDATED', outcome: 'SUCCESS', actor: { id: actorId }, entityType: 'SecurityAuditRetentionPolicy', entityId: updated.id, metadata: { category, hotDays: dto.hotDays, retainDays: dto.retainDays, rawIpDays: dto.rawIpDays } });
    return updated;
  }

  async createLegalHold(eventId: string, dto: CreateLegalHoldDto, actorId: number) {
    const event = await this.prisma.securityAuditEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện kiểm toán.');
    const hold = await this.prisma.$transaction(async (tx) => {
      const created = await tx.securityAuditLegalHold.upsert({ where: { eventId }, create: { eventId, reason: dto.reason.slice(0, 1000), caseReference: dto.caseReference?.slice(0, 160), createdById: actorId }, update: { releasedAt: null, reason: dto.reason.slice(0, 1000), caseReference: dto.caseReference?.slice(0, 160), createdById: actorId } });
      await tx.securityAuditEvent.update({ where: { id: eventId }, data: { legalHold: true } });
      return created;
    });
    await this.write({ category: 'SYSTEM_SECURITY', action: 'SECURITY_AUDIT_LEGAL_HOLD_APPLIED', outcome: 'SUCCESS', actor: { id: actorId }, entityType: 'SecurityAuditEvent', entityId: eventId, metadata: { caseReference: dto.caseReference } });
    return hold;
  }

  async releaseLegalHold(eventId: string, actorId: number) {
    const existing = await this.prisma.securityAuditLegalHold.findUnique({ where: { eventId } });
    if (!existing || existing.releasedAt) throw new NotFoundException('Không có legal hold đang hoạt động cho sự kiện này.');
    await this.prisma.$transaction([
      this.prisma.securityAuditLegalHold.update({ where: { eventId }, data: { releasedAt: new Date(), releasedById: actorId } }),
      this.prisma.securityAuditEvent.update({ where: { id: eventId }, data: { legalHold: false } }),
    ]);
    return this.write({ category: 'SYSTEM_SECURITY', action: 'SECURITY_AUDIT_LEGAL_HOLD_RELEASED', outcome: 'SUCCESS', actor: { id: actorId }, entityType: 'SecurityAuditEvent', entityId: eventId });
  }

  async anonymizeExpiredIpAddresses(now = new Date()) {
    await this.ensurePolicies();
    const policies = await this.prisma.securityAuditRetentionPolicy.findMany();
    let changed = 0;
    for (const policy of policies) {
      const cutoff = new Date(now.getTime() - policy.rawIpDays * 86400000);
      const result = await this.prisma.securityAuditEvent.updateMany({ where: { category: policy.category, occurredAt: { lt: cutoff }, ipAddress: { not: null }, legalHold: false }, data: { ipAddress: null } });
      changed += result.count;
    }
    return changed;
  }

  archiveLocation() {
    return process.env.AUDIT_ARCHIVE_ROOT || join(process.cwd(), 'audit-archive');
  }

  async archiveColdEvents(now = new Date()) {
    await this.ensurePolicies();
    const policies = await this.prisma.securityAuditRetentionPolicy.findMany();
    let archived = 0;
    for (const policy of policies) {
      const cutoff = new Date(now.getTime() - policy.hotDays * 86400000);
      const events = await this.prisma.securityAuditEvent.findMany({
        where: { category: policy.category, occurredAt: { lt: cutoff }, archivedAt: null, legalHold: false },
        orderBy: { occurredAt: 'asc' }, take: 5000,
      });
      if (!events.length) continue;
      const root = this.archiveLocation();
      await mkdir(root, { recursive: true });
      const stamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `${policy.category.toLowerCase()}-${stamp}-${randomUUID()}.jsonl.gz`;
      const target = join(root, filename);
      const temporary = `${target}.tmp`;
      const content = events.map((event) => JSON.stringify(event)).join('\n');
      await writeFile(temporary, gzipSync(content), { flag: 'wx' });
      await rename(temporary, target);
      await this.prisma.securityAuditEvent.updateMany({ where: { id: { in: events.map((event) => event.id) }, archivedAt: null }, data: { archivedAt: now } });
      archived += events.length;
    }
    return archived;
  }

  async archiveStatus() {
    await this.ensurePolicies();
    const [total, archived] = await Promise.all([
      this.prisma.securityAuditEvent.count(),
      this.prisma.securityAuditEvent.count({ where: { archivedAt: { not: null } } }),
    ]);
    return { locationConfigured: Boolean(process.env.AUDIT_ARCHIVE_ROOT), locationLabel: process.env.AUDIT_ARCHIVE_ROOT ? 'Thư mục archive đã cấu hình qua AUDIT_ARCHIVE_ROOT' : 'Thư mục mặc định backend/audit-archive', total, archived };
  }

  async verifyIntegrity(limit = 5000) {
    const events = await this.prisma.securityAuditEvent.findMany({ orderBy: { occurredAt: 'asc' }, take: Math.min(5000, Math.max(1, limit)) });
    let previousHash: string | null = null;
    const invalidIds: string[] = [];
    for (const event of events) {
      const payload = { id: event.id, occurredAt: event.occurredAt.toISOString(), category: event.category, action: event.action, outcome: event.outcome, actorId: event.actorId, subjectUserId: event.subjectUserId, entityType: event.entityType, entityId: event.entityId, requestId: event.requestId, httpMethod: event.httpMethod, route: event.route, ipHash: event.ipHash, userAgentHash: event.userAgentHash, metadata: event.metadata || {}, retentionUntil: event.retentionUntil.toISOString() };
      const expected = this.hash(`${previousHash || 'GENESIS'}:${this.stableJson(payload)}:${process.env.AUDIT_HASH_SECRET || 'local-audit-integrity-key'}`);
      if (event.previousHash !== previousHash || event.eventHash !== expected) invalidIds.push(event.id);
      previousHash = event.eventHash;
    }
    return { checked: events.length, valid: invalidIds.length === 0, invalidIds };
  }
}
