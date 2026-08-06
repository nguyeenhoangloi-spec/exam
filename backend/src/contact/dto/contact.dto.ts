import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactMessageDto {
    @IsString()
    @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
    @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự.' })
    @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự.' })
    fullName: string;

    @IsEmail({}, { message: 'Email liên hệ không hợp lệ.' })
    @MaxLength(200, { message: 'Email không được vượt quá 200 ký tự.' })
    email: string;

    @IsIn(['STUDENT', 'TEACHER', 'OTHER'], { message: 'Vai trò hệ thống không hợp lệ.' })
    role: 'STUDENT' | 'TEACHER' | 'OTHER';

    @IsString()
    @IsNotEmpty({ message: 'Nội dung yêu cầu không được để trống.' })
    @MinLength(10, { message: 'Nội dung yêu cầu phải có ít nhất 10 ký tự.' })
    @MaxLength(5000, { message: 'Nội dung yêu cầu không được vượt quá 5000 ký tự.' })
    message: string;
}
