import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AiService } from './ai.service';
import { GenerateQuestionDto, GradeEssayDto } from './dto/ai.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  @Get('status')
  @Roles('ADMIN', 'TEACHER')
  getStatus() {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const deepseekKey = this.configService.get<string>('DEEPSEEK_API_KEY');

    return {
      status: 'active',
      providers: {
        gemini: {
          configured: Boolean(geminiKey && geminiKey.length > 0),
          model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash',
          priority: 1,
        },
        deepseek: {
          configured: Boolean(deepseekKey && deepseekKey.length > 0),
          model: this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat',
          baseUrl: this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com',
          priority: 2,
        },
      },
    };
  }

  @Post('grade-essay')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'TEACHER')
  async gradeEssay(@Body() dto: GradeEssayDto) {
    return this.aiService.gradeEssay(dto);
  }

  @Post('generate-questions')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'TEACHER')
  async generateQuestions(@Body() dto: GenerateQuestionDto) {
    return this.aiService.generateQuestions(dto);
  }
}
