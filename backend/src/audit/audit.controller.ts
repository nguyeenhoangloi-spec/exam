import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAuditLogs(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { description: { contains: s, mode: 'insensitive' } },
        { action: { contains: s, mode: 'insensitive' } },
        { entityType: { contains: s, mode: 'insensitive' } },
        { actor: { username: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
