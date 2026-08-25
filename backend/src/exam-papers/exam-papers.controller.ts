import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { CreateRandomExamPaperDto, ExamPaperQueryDto, UpdateExamPasswordDto } from './dto/exam-paper.dto';
import { ExamPapersService } from './exam-papers.service';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@Controller('exam-papers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN', 'TEACHER')
@Permissions('EXAM_PAPER_MANAGE')
export class ExamPapersController {
  constructor(private readonly examPapersService: ExamPapersService) {}

  @Post('create-random')
  createRandom(@Request() req: any, @Body() body: CreateRandomExamPaperDto) {
    if (body.confirm !== true) throw new BadRequestException('Phải xem trước và xác nhận ma trận đề trước khi lưu.');
    return this.examPapersService.createRandom(req.user, body);
  }

  @Post('preview-random')
  previewRandom(@Request() req: any, @Body() body: CreateRandomExamPaperDto) {
    return this.examPapersService.previewRandom(req.user, body);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: ExamPaperQueryDto) {
    return this.examPapersService.findAll(req.user, query.examScheduleId);
  }

  @Get(':id')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_PAPER_ANSWER_KEY_VIEWED', entityType: 'EXAM_PAPER', entityIdParam: 'id' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examPapersService.findOne(req.user, id);
  }

  /**
   * The Word file is generated in the browser, so the server cannot observe a
   * completed download. Record the authorised export request immediately
   * before the browser receives the data for that operation.
   */
  @Post(':id/export-audit')
  recordExport(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { format?: string; includeAnswerKey?: boolean },
  ) {
    return this.examPapersService.recordExport(req.user, id, body);
  }

  @Roles('ADMIN', 'TEACHER')
  @Post(':id/publish')
  publish(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.examPapersService.publish(req.user, id, body);
  }

  @Roles('ADMIN', 'TEACHER')
  @Patch(':id/password')
  updatePassword(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateExamPasswordDto,
  ) {
    return this.examPapersService.updatePassword(req.user, id, body);
  }

  @Roles('ADMIN')
  @Post(':id/archive')
  archive(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examPapersService.archive(req.user, id);
  }

  @Roles('ADMIN')
  @Post(':id/restore')
  restore(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examPapersService.restore(req.user, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examPapersService.remove(req.user, id);
  }
}
