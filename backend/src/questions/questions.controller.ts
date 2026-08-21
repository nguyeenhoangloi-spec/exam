import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { validateOrReject } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { AiQuestionsService } from './ai.service';
import {
  BulkActionDto,
  CreateQuestionDto,
  GenerateAiQuestionsDto,
  ImportConfirmDto,
  ImportPreviewDto,
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

const spreadsheetUpload = FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const ok = /\.(csv|xlsx)$/i.test(file.originalname);
    callback(ok ? null : new BadRequestException('Chỉ chấp nhận file CSV hoặc XLSX.'), ok);
  },
});

const docUpload = FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const ext = file.originalname.toLowerCase();
    const ok = ext.endsWith('.txt') || ext.endsWith('.md') || ext.endsWith('.docx') || ext.endsWith('.pdf');
    callback(ok ? null : new BadRequestException('Chỉ chấp nhận file .txt, .md, .docx, .pdf.'), ok);
  },
});

const ALLOWED_MEDIA_MIME =
  /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm)|audio\/(mpeg|wav|ogg))$/;

const mediaUpload = FilesInterceptor('files', 10, {
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const ok = ALLOWED_MEDIA_MIME.test(file.mimetype);
    callback(ok ? null : new BadRequestException('Chỉ chấp nhận ảnh (jpg/png/gif/webp), video (mp4/webm) hoặc audio (mp3/wav/ogg).'), ok);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN', 'TEACHER')
@Permissions('QUESTION_MANAGE')
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
  statistics(@Request() req: any, @Query() query: QuestionQueryDto) {
    return this.questions.statistics(req.user, query);
  }

  @Get('filter-options')
  filterOptions(@Request() req: any) {
    return this.questions.filterOptions(req.user);
  }

  @Get('import/template')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="mau-nhap-cau-hoi.csv"')
  template() {
    return this.questions.importTemplate();
  }

  @Post('media/preview')
  @UseInterceptors(mediaUpload)
  previewMedia(@Request() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    return this.questions.previewMedia(req.user, files);
  }

  @Post('media/upload')
  @UseInterceptors(mediaUpload)
  uploadMedia(@Request() req: any, @UploadedFiles() files: Express.Multer.File[], @Body('questionId') questionId: string, @Body('optionId') optionId?: string) {
    if (!questionId) throw new BadRequestException('Thiếu questionId khi tải ảnh.');
    return this.questions.uploadMedia(req.user, questionId, optionId, files);
  }

  @Delete('media/:id')
  removeMedia(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.removeMedia(req.user, id);
  }

  @Post('export')
  async export(@Request() req: any, @Body() query: QuestionQueryDto, @Res() res: Response) {
    const csv = await this.questions.exportCsv(req.user, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="danh-sach-cau-hoi.csv"');
    res.send(csv);
  }

  @Post('bulk-action')
  bulk(@Request() req: any, @Body() body: BulkActionDto) {
    return this.questions.bulkAction(req.user, body);
  }

  @Post('import/preview')
  @UseInterceptors(spreadsheetUpload)
  preview(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() raw: any) {
    if (!file) throw new BadRequestException('Vui lòng chọn file CSV hoặc XLSX.');
    return this.questions.importPreview(req.user, file, this.parseImportMeta(raw));
  }

  @Post('import/confirm')
  @UseInterceptors(spreadsheetUpload)
  async confirm(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Body() raw: any) {
    if (!file) throw new BadRequestException('Vui lòng gửi lại file CSV hoặc XLSX.');
    let body: ImportConfirmDto;
    try {
      body = Object.assign(new ImportConfirmDto(), {
        hash: raw.hash,
        rows: Array.isArray(raw.rows) ? raw.rows.map(Number) : JSON.parse(raw.rows || '[]').map(Number),
        overrideDuplicate: raw.overrideDuplicate === true || raw.overrideDuplicate === 'true',
        subjectId: raw.subjectId ? Number(raw.subjectId) : undefined,
        chapterId: raw.chapterId || undefined,
        defaultType: raw.defaultType || undefined,
        defaultDifficulty: raw.defaultDifficulty || undefined,
        defaultBloomLevel: raw.defaultBloomLevel || undefined,
        defaultScore: raw.defaultScore ? Number(raw.defaultScore) : undefined,
        applyDefaultsToMissingOnly: raw.applyDefaultsToMissingOnly === undefined ? true : raw.applyDefaultsToMissingOnly === true || raw.applyDefaultsToMissingOnly === 'true',
        overrides: raw.overrides || undefined,
      });
      await validateOrReject(body);
    } catch {
      throw new BadRequestException('Dữ liệu xác nhận import không hợp lệ.');
    }
    return this.questions.importConfirm(req.user, file, body);
  }

  private parseImportMeta(raw: any): ImportPreviewDto {
    const body = Object.assign(new ImportPreviewDto(), {
      subjectId: raw?.subjectId ? Number(raw.subjectId) : undefined,
      chapterId: raw?.chapterId || undefined,
      defaultType: raw?.defaultType || undefined,
      defaultDifficulty: raw?.defaultDifficulty || undefined,
      defaultBloomLevel: raw?.defaultBloomLevel || undefined,
      defaultScore: raw?.defaultScore ? Number(raw.defaultScore) : undefined,
      applyDefaultsToMissingOnly: raw?.applyDefaultsToMissingOnly === undefined ? true : raw.applyDefaultsToMissingOnly === true || raw.applyDefaultsToMissingOnly === 'true',
    });
    return body;
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
  @UseInterceptors(docUpload)
  extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng chọn tài liệu để trích xuất.');
    return this.ai.extractDocumentText(file);
  }

  @Post()
  create(@Request() req: any, @Body() body: CreateQuestionDto) {
    return this.questions.create(req.user, body);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.findOne(req.user, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: UpdateQuestionDto) {
    return this.questions.update(req.user, id, body);
  }

  @Post(':id/duplicate')
  duplicate(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.duplicate(req.user, id);
  }

  @Post(':id/submit')
  submit(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.submit(req.user, id);
  }

  @Post(':id/approve')
  approve(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.approve(req.user, id);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: RejectQuestionDto) {
    return this.questions.reject(req.user, id, body.reason);
  }

  @Post(':id/archive')
  archive(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.archive(req.user, id);
  }

  @Post(':id/restore')
  restore(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.restore(req.user, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.questions.remove(req.user, id);
  }
}
