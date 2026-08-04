import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class AutoArrangeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  roomIds: number[];

  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
