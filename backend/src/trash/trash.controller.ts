import { Controller, Get, Post, Delete, Query, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TrashService } from './trash.service';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

@Controller('trash')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Permissions('TRASH_MANAGE')

export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Get('stats')
  @Roles('ADMIN')
  getTrashStats() {
    return this.trashService.getTrashStats();
  }

  @Get('items')
  @Roles('ADMIN')
  getTrashItems(
    @Query('type') type: 'schedules' | 'papers' | 'questions',
    @Query('search') search?: string,
  ) {
    return this.trashService.getTrashItems(type || 'schedules', search || '');
  }

  @Post('restore')
  @Roles('ADMIN')
  restoreItem(
    @Request() req: any,
    @Body() body: { type: string; id: number | string },
  ) {
    return this.trashService.restoreItem(req.user.id, body.type, body.id);
  }

  @Post('auto-clean')
  @Roles('ADMIN')
  autoCleanTrash(@Request() req: any) {
    return this.trashService.autoCleanExpiredTrash(30, req.user.id);
  }

  @Delete('permanent')
  @Roles('ADMIN')
  hardDeleteItem(
    @Request() req: any,
    @Body() body: { type: string; id: number | string },
  ) {
    return this.trashService.hardDeleteItem(req.user.id, body.type, body.id);
  }
}
