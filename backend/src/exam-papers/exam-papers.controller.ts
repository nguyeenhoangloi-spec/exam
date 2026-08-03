import { Controller, Post, Get, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ExamPapersService } from './exam-papers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam-papers')
export class ExamPapersController {
  constructor(private readonly examPapersService: ExamPapersService) {}

  @Roles('ADMIN', 'TEACHER')
  @Post('create-random')
  createRandom(@Request() req: any, @Body() body: any) {
    return this.examPapersService.createRandom(req.user, body);
  }

  @Get()
  findAll(@Query('examScheduleId') examScheduleId?: string) {
    return this.examPapersService.findAll(examScheduleId ? parseInt(examScheduleId, 10) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examPapersService.findOne(id);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examPapersService.remove(id);
  }
}
