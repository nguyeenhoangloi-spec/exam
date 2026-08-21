import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { GradeAppealsService } from './grade-appeals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { CreateGradeAppealDto } from './dto/create-grade-appeal.dto';
import { ReviewGradeAppealDto } from './dto/review-grade-appeal.dto';

@Controller('grade-appeals')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class GradeAppealsController {
  constructor(private readonly gradeAppealsService: GradeAppealsService) {}

  @Post()
  @Roles('STUDENT')
  async createAppeal(@Request() req: any, @Body() dto: CreateGradeAppealDto) {
    return this.gradeAppealsService.createAppeal(req.user.id, dto);
  }

  @Get('my-appeals')
  @Roles('STUDENT')
  async getMyAppeals(@Request() req: any) {
    return this.gradeAppealsService.getMyAppeals(req.user.id);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @Permissions('GRADE_APPEAL_REVIEW')
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('subjectId') subjectId?: string,
    @Query('search') search?: string,
  ) {
    return this.gradeAppealsService.findAll(req.user, { status, subjectId, search });
  }

  @Get(':id')
  @Roles('STUDENT', 'ADMIN', 'TEACHER')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.gradeAppealsService.findOne(req.user, id);
  }

  @Patch(':id/review')
  @Roles('ADMIN', 'TEACHER')
  @Permissions('GRADE_APPEAL_REVIEW')
  async reviewAppeal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewGradeAppealDto,
  ) {
    return this.gradeAppealsService.reviewAppeal(req.user, id, dto);
  }
}
