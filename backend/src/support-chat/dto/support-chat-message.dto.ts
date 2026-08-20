import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SupportChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập câu hỏi cần hỗ trợ.' })
  @MinLength(2, { message: 'Câu hỏi cần có ít nhất 2 ký tự.' })
  @MaxLength(500, { message: 'Câu hỏi hỗ trợ không được vượt quá 500 ký tự.' })
  message: string;
}
