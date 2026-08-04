import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class StartExamDto {
  @IsString()
  @IsOptional()
  deviceInfo?: string;

  @IsString()
  @IsOptional()
  deviceFingerprint?: string;

  /** Mã truy cập phòng thi (nếu kỳ thi yêu cầu access code) */
  @IsString()
  @IsOptional()
  accessCode?: string;

  /** Sinh viên đã chấp nhận quy định thi hay chưa */
  @IsBoolean()
  @IsOptional()
  rulesAccepted?: boolean;

  /** Webcam có sẵn hay không (kết quả kiểm tra thiết bị phía client) */
  @IsBoolean()
  @IsOptional()
  webcamAvailable?: boolean;

  /** Đã vượt qua bước kiểm tra thiết bị chưa */
  @IsBoolean()
  @IsOptional()
  deviceCheckPassed?: boolean;
}

export class CheckEligibilityQueryDto {
  /** IP của client (dùng để validate IP whitelist) */
  @IsString()
  @IsOptional()
  clientIp?: string;

  /** Device fingerprint */
  @IsString()
  @IsOptional()
  deviceFingerprint?: string;

  /** Access code phòng thi */
  @IsString()
  @IsOptional()
  accessCode?: string;
}
