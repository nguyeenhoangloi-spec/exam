import { Body, Controller, Param, ParseIntPipe, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OnlineExamsService } from './online-exams.service';
import { UpdateMediaDisplayConfigDto } from './dto/media-display-config.dto';

/**
 * Cấu hình ca thi cho Giảng viên/Admin
 * (tách khỏi controller STUDENT để tránh xung đột role guard)
 */
@Controller('online-exam-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnlineExamConfigController {
    constructor(private readonly onlineExamsService: OnlineExamsService) { }

    /**
     * PATCH /online-exam-config/:scheduleId/media-display
     * Bật/tắt hiển thị Ảnh / Video / Âm thanh cho ca thi
     */
    @Patch(':scheduleId/media-display')
    @Roles('ADMIN', 'TEACHER')
    updateMediaDisplay(
        @Request() req: any,
        @Param('scheduleId', ParseIntPipe) scheduleId: number,
        @Body() dto: UpdateMediaDisplayConfigDto,
    ) {
        return this.onlineExamsService.updateMediaDisplayConfig(req.user, scheduleId, dto);
    }
}
