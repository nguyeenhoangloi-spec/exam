import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
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
  events: ProctoringEventDto[];
}
