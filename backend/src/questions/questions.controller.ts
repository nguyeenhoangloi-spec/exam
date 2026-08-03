import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(
    @Query('subjectId') subjectId?: string,
    @Query('chapter') chapter?: string,
    @Query('difficulty') difficulty?: string,
    @Query('status') status?: string,
  ) {
    return this.questionsService.findAll({
      subjectId: subjectId ? parseInt(subjectId, 10) : undefined,
      chapter: chapter ? parseInt(chapter, 10) : undefined,
      difficulty,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Roles('ADMIN', 'TEACHER')
  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.questionsService.create(req.user.id, body);
  }

  @Roles('ADMIN', 'TEACHER')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.questionsService.update(id, body);
  }

  @Roles('ADMIN', 'TEACHER')
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Body() body: { status?: string }) {
    return this.questionsService.approve(id, body?.status || 'APPROVED');
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }
}
