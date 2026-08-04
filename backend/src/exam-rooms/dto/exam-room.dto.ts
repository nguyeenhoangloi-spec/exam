import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

const roomStatuses = ['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE', 'LOCKED'] as const;

export class CreateExamRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  roomCode: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  roomName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  building: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  roomType?: string;

  @IsOptional()
  @IsIn(roomStatuses)
  status?: (typeof roomStatuses)[number];
}

export class UpdateExamRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  roomCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  roomName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  building?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  roomType?: string;

  @IsOptional()
  @IsIn(roomStatuses)
  status?: (typeof roomStatuses)[number];
}
