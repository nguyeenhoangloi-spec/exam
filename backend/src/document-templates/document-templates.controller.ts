import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { CreateDocumentTemplateDto, RenderDocumentTemplateDto, UpdateDocumentTemplateDto } from './dto/document-template.dto';
import { DocumentTemplatesService } from './document-templates.service';

@Controller('document-templates')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class DocumentTemplatesController {
  constructor(private readonly templates: DocumentTemplatesService) {}

  @Get('catalog')
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  catalog() {
    return this.templates.getCatalog();
  }

  @Get('published')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  @Permissions('DOCUMENT_TEMPLATE_USE')
  getPublished() {
    return this.templates.getPublishedTemplates();
  }

  @Get()
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  list() {
    return this.templates.list();
  }

  @Post()
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  create(@Request() req: any, @Body() dto: CreateDocumentTemplateDto) {
    return this.templates.create(req.user, dto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  get(@Param('id') id: string) {
    return this.templates.get(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  saveDraft(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDocumentTemplateDto) {
    return this.templates.saveDraft(req.user, id, dto);
  }

  @Post(':id/publish')
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  publish(@Request() req: any, @Param('id') id: string) {
    return this.templates.publish(req.user, id);
  }

  @Post(':id/duplicate')
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  duplicate(@Request() req: any, @Param('id') id: string) {
    return this.templates.duplicate(req.user, id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('DOCUMENT_TEMPLATE_MANAGE')
  delete(@Request() req: any, @Param('id') id: string) {
    return this.templates.delete(req.user, id);
  }

  @Post(':code/render')
  @Roles('ADMIN', 'TEACHER')
  @Permissions('DOCUMENT_TEMPLATE_USE')
  render(@Request() req: any, @Param('code') code: string, @Body() dto: RenderDocumentTemplateDto) {
    return this.templates.render(code, req.user, dto.filters || {});
  }
}
