import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AiQuestionsService } from './ai.service';
import {
  BulkActionDto,
  CreateQuestionDto,
  GenerateAiQuestionsDto,
  ImportConfirmDto,
  QuestionQueryDto,
  RejectQuestionDto,
  SaveAiQuestionsDto,
  UpdateQuestionDto,
} from './dto/question.dto';
import { QuestionsService } from './questions.service';

const csvUpload = FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(file.originalname.toLowerCase().endsWith('.csv') ? null : new BadRequestException('Chỉ chấp nhận file CSV.'), file.originalname.toLowerCase().endsWith('.csv')),
});

const docUpload = FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const ext = file.originalname.toLowerCase();
    const ok = ext.endsWith('.txt') || ext.endsWith('.md') || ext.endsWith('.docx') || ext.endsWith('.pdf');
    callback(ok ? null : new BadRequestException('Chỉ chấp nhận file .txt, .md, .docx, .pdf.'), ok);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questions: QuestionsService,
    private readonly ai: AiQuestionsService,
  ) {}

  @Get()
  findAll(@Request() req: any, @Query() query: QuestionQueryDto) {
    return this.questions.findAll(req.user, query);
  }

  @Get('statistics')
  statistics(@Request() req: any) {
    return this.questions.statistics(req.user);
  }

  @Get('filter-options')
  filterOptions(@Request() req: any) {
    return this.questions.filterOptions(req.user);
  }

  @Get('import/template')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="question-import-template.csv"')
  template() {
    return this.questions.importTemplate();
  }

  @Post('export')
  async export(@Request() req: any, @Body() query: QuestionQueryDto, @Res() res: Response) {
    const csv = await this.questions.exportCsv(req.user, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
    res.send(csv);
  }

  @Post('bulk-action')
  bulk(@Request() req: any, @Body() body: BulkActionDto) {
    return this.questions.bulkAction(req.user, body);
  }

  @Post('import/preview')
  @UseInterceptors(csvUpload)
  preview(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng chọn file CSV.');
    return this.questions.importPreview(req.user, file);
  }

  @Post('import/confirm')
  @UseInterceptors(csvUpload)
  confirm(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() raw: any) {
    if (!file) throw new BadRequestException('Vui lòng gửi lại file CSV.');
    const body: ImportConfirmDto = {
      hash: raw.hash,
      rows: Array.isArray(raw.rows) ? raw.rows.map(Number) : JSON.parse(raw.rows || '[]').map(Number),
      overrideDuplicate: raw.overrideDuplicate === true || raw.overrideDuplicate === 'true',
    };
    return this.questions.importConfirm(req.user, file, body);
  }

  @Post('ai-generate')
  generateAi(@Body() body: GenerateAiQuestionsDto) {
    return this.ai.generate(body);
  }

  @Post('ai-save')
  saveAi(@Request() req: any, @Body() body: SaveAiQuestionsDto) {
    return this.questions.saveAi(req.user, body);
  }

  @Post('ai-extract-text')
  @UseInterceptors(FileInterceptor('file'))
  extractText(@UploadedFile() file: Express.Multer.File) {
    return this.ai.extractDocumentText(file);
  }

  @Post()
  create(@Request() req: any, @Body() body: CreateQuestionDto) {
    return this.questions.create(req.user, body);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.questions.findOne(req.user, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: UpdateQuestionDto) {
    return this.questions.update(req.user, id, body);
  }

  @Post(':id/duplicate')
  duplicate(@Request() req: any, @Param('id') id: string) {
    return this.questions.duplicate(req.user, id);
  }

  @Post(':id/submit')
  submit(@Request() req: any, @Param('id') id: string) {
    return this.questions.submit(req.user, id);
  }

  @Post(':id/approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.questions.approve(req.user, id);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id') id: string, @Body() body: RejectQuestionDto) {
    return this.questions.reject(req.user, id, body.reason);
  }

  @Post(':id/archive')
  archive(@Request() req: any, @Param('id') id: string) {
    return this.questions.archive(req.user, id);
  }

  @Post(':id/restore')
  restore(@Request() req: any, @Param('id') id: string) {
    return this.questions.restore(req.user, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.questions.remove(req.user, id);
  }
}
