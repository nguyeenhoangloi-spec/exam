import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Cấu hình hiển thị media (Ảnh / Video / Âm thanh) cho một ca thi.
 * Tất cả field đều tùy chọn — chỉ cập nhật field được gửi lên.
 */
export class UpdateMediaDisplayConfigDto {
    @IsOptional()
    @IsBoolean()
    showImages?: boolean;

    @IsOptional()
    @IsBoolean()
    showVideos?: boolean;

    @IsOptional()
    @IsBoolean()
    showAudios?: boolean;
}
