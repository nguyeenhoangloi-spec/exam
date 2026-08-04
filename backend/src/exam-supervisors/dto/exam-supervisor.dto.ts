import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AssignSupervisorDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleRoomId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId: number;

  @IsOptional()
  @IsIn(['SUPERVISOR_1', 'SUPERVISOR_2'])
  role?: 'SUPERVISOR_1' | 'SUPERVISOR_2';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class FindSupervisorsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleRoomId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleId?: number;
}
