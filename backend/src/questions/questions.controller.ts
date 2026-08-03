import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AiQuestionsService } from './ai.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService, private readonly ai: AiQuestionsService) {}

  @Roles('ADMIN', 'TEACHER')
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@Request() req: any, @UploadedFile() file: any) {
    if (!file) throw new Error('Vui lòng chọn file Excel hoặc CSV.');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    return this.questionsService.bulkCreate(req.user.id, rows);
  }

  @Roles('ADMIN', 'TEACHER')
  @Post('ai-generate')
  generate(@Body() body: any) { return this.ai.generate(body); }

  @Roles('ADMIN', 'TEACHER')
  @Post('extract-document')
  @UseInterceptors(FileInterceptor('file'))
  async extractDocument(@UploadedFile() file: any) {
    if (!file) throw new Error('Vui lòng chọn file Word hoặc PDF.');
    const text = await this.ai.extractDocument(file);
    if (!text.trim()) throw new Error('Không đọc được nội dung tài liệu.');
    return { text: text.slice(0, 120000), fileName: file.originalname };
  }

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
