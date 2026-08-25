import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum NotificationTypeDto {
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  EXAM_CANCELLED = 'EXAM_CANCELLED',
  ASSIGNMENT_UPDATE = 'ASSIGNMENT_UPDATE',
  GENERAL = 'GENERAL',
  SYSTEM = 'SYSTEM',
}

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsEnum(NotificationTypeDto)
  @IsOptional()
  type?: NotificationTypeDto;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsOptional()
  metadata?: any;
}
