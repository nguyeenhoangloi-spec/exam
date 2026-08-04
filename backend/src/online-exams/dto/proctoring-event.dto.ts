import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventSeverity, ProctoringEventType } from '@prisma/client';

export class ProctoringEventDto {
  @IsEnum(ProctoringEventType)
  @IsNotEmpty()
  eventType: ProctoringEventType;

  @IsEnum(EventSeverity)
  @IsOptional()
  severity?: EventSeverity;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;
}

export class ProctoringEventsBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProctoringEventDto)
  events: ProctoringEventDto[];
}
