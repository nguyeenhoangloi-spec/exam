import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface ExamArchiveConfig {
  retentionYears: number; // Mặc định 2 năm theo Thông tư 08/2021/TT-BGDĐT
  updatedAt?: string;
  updatedBy?: string;
}

@Injectable()
export class ExamArchivesConfigService {
  private readonly logger = new Logger(ExamArchivesConfigService.name);
  readonly configPath = join(process.cwd(), 'backup-runtime', 'archive-config.json');

  async getConfig(): Promise<ExamArchiveConfig> {
    try {
      const raw = await readFile(this.configPath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        retentionYears: typeof parsed.retentionYears === 'number' && parsed.retentionYears >= 2 ? parsed.retentionYears : 2,
        updatedAt: parsed.updatedAt,
        updatedBy: parsed.updatedBy,
      };
    } catch {
      return { retentionYears: 2 };
    }
  }

  async updateConfig(dto: { retentionYears: number }, actor: any): Promise<ExamArchiveConfig> {
    const years = Number(dto?.retentionYears);
    if (!Number.isInteger(years) || years < 2) {
      throw new BadRequestException(
        'Niên hạn lưu trữ bài thi tối thiểu là 02 năm theo Điều 10 Thông tư 08/2021/TT-BGDĐT của Bộ GD&ĐT.',
      );
    }
    if (years > 10) {
      throw new BadRequestException('Niên hạn lưu trữ bài thi tối đa có thể thiết lập là 10 năm.');
    }

    const nextConfig: ExamArchiveConfig = {
      retentionYears: years,
      updatedAt: new Date().toISOString(),
      updatedBy: actor?.username || actor?.email || `User #${actor?.id || 'admin'}`,
    };

    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(nextConfig, null, 2), 'utf8');
    this.logger.log(`Đã cập nhật niên hạn lưu trữ bài thi: ${years} năm bởi ${nextConfig.updatedBy}`);
    return nextConfig;
  }
}
