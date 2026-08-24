import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamRoomsService } from './exam-rooms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExamRoomDto, UpdateExamRoomDto } from './dto/exam-room.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Permissions('EXAM_ROOM_MANAGE')
@Controller('exam-rooms')
export class ExamRoomsController {
  constructor(private readonly examRoomsService: ExamRoomsService) {}

  @Get()
  findAll() {
    return this.examRoomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examRoomsService.findOne(id);
  }

  @Post(':id/lock')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examRoomsService.setLock(req.user, id, true);
  }

  @Post(':id/unlock')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examRoomsService.setLock(req.user, id, false);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateExamRoomDto) {
    return this.examRoomsService.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateExamRoomDto) {
    return this.examRoomsService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examRoomsService.remove(id);
  }
}
