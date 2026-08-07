import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

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
  teacherId?: number;

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

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateSupervisorStatusDto {
  @IsIn(['CONFIRMED', 'CHANGE_REQUESTED', 'REJECTED', 'CHANGE_APPROVED', 'COMPLETED', 'ABSENT'])
  status: 'CONFIRMED' | 'CHANGE_REQUESTED' | 'REJECTED' | 'CHANGE_APPROVED' | 'COMPLETED' | 'ABSENT';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AutoSupervisorPreviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleId: number;
}

export class AutoSupervisorProposalDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleRoomId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId: number;

  @IsIn(['SUPERVISOR_1', 'SUPERVISOR_2'])
  role: 'SUPERVISOR_1' | 'SUPERVISOR_2';
}

export class AutoSupervisorAcceptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AutoSupervisorProposalDto)
  proposals: AutoSupervisorProposalDto[];
}
