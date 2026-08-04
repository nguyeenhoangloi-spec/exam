import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAppealDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
