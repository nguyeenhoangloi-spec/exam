import { DocumentTemplateDataSource } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateDocumentTemplateDto {
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{2,63}$/)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsEnum(DocumentTemplateDataSource)
  dataSource!: DocumentTemplateDataSource;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsObject()
  config!: Record<string, unknown>;
}

export class UpdateDocumentTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class RenderDocumentTemplateDto {
  @IsOptional()
  @IsObject()
  filters?: Record<string, string | number | boolean | undefined>;
}
