import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationTypeDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationDto) {
    return (this.prisma as any).notification.create({
      data: {
        userId: data.userId,
        type: data.type || NotificationTypeDto.GENERAL,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata,
      },
    });
  }

  async createBulk(items: CreateNotificationDto[]) {
    if (!items.length) return { count: 0 };
    return (this.prisma as any).notification.createMany({
      data: items.map((i) => ({
        userId: i.userId,
        type: i.type || NotificationTypeDto.GENERAL,
        title: i.title,
        message: i.message,
        link: i.link,
        metadata: i.metadata,
      })),
    });
  }

  async getMyNotifications(userId: number, limit = 20, offset = 0) {
    const [items, unreadCount, total] = await Promise.all([
      (this.prisma as any).notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      (this.prisma as any).notification.count({
        where: { userId, isRead: false },
      }),
      (this.prisma as any).notification.count({
        where: { userId },
      }),
    ]);

    return {
      items,
      unreadCount,
      total,
      limit,
      offset,
    };
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await (this.prisma as any).notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: number, id: number) {
    const notif = await (this.prisma as any).notification.findFirst({
      where: { id, userId },
    });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo.');

    return (this.prisma as any).notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return (this.prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Broadcast exam rescheduling notification to all enrolled students and assigned teachers
   */
  async notifyScheduleChange(params: {
    scheduleId: number;
    subjectName: string;
    subjectCode?: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    reason: string;
    roomName?: string;
  }) {
    const scheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: { examScheduleId: params.scheduleId },
      include: {
        examRoomStudents: {
          include: { student: { select: { userId: true, fullName: true, studentCode: true } } },
        },
        supervisors: {
          include: { teacher: { select: { userId: true, fullName: true, teacherCode: true } } },
        },
      },
    });

    const notifItems: CreateNotificationDto[] = [];
    const seenUserIds = new Set<number>();

    // 1. Notify Students
    for (const sr of scheduleRooms) {
      for (const ers of sr.examRoomStudents) {
        const userId = ers.student?.userId;
        if (userId && !seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          notifItems.push({
            userId,
            type: NotificationTypeDto.SCHEDULE_CHANGE,
            title: `Thông báo dời lịch thi môn ${params.subjectName}`,
            message: `Lịch thi môn ${params.subjectName} đã được dời từ ${params.oldDate} (${params.oldTime}) sang ngày ${params.newDate} (${params.newTime})${params.roomName ? ` tại ${params.roomName}` : ''}. Lý do: ${params.reason}`,
            link: '/student/exam-schedule',
            metadata: {
              scheduleId: params.scheduleId,
              subjectName: params.subjectName,
              oldDate: params.oldDate,
              oldTime: params.oldTime,
              newDate: params.newDate,
              newTime: params.newTime,
              reason: params.reason,
            },
          });
        }
      }
    }

    // 2. Notify Teachers
    for (const sr of scheduleRooms) {
      for (const sup of sr.supervisors) {
        const userId = sup.teacher?.userId;
        if (userId && !seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          notifItems.push({
            userId,
            type: NotificationTypeDto.SCHEDULE_CHANGE,
            title: `Điều chỉnh lịch coi thi môn ${params.subjectName}`,
            message: `Ca coi thi môn ${params.subjectName} đã được dời sang ngày ${params.newDate} lúc ${params.newTime}. Lý do: ${params.reason}`,
            link: '/teacher/assignments',
            metadata: {
              scheduleId: params.scheduleId,
              subjectName: params.subjectName,
              oldDate: params.oldDate,
              newDate: params.newDate,
              newTime: params.newTime,
              reason: params.reason,
            },
          });
        }
      }
    }

    // 3. Notify Admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    for (const admin of admins) {
      if (!seenUserIds.has(admin.id)) {
        seenUserIds.add(admin.id);
        notifItems.push({
          userId: admin.id,
          type: NotificationTypeDto.SCHEDULE_CHANGE,
          title: `Đã dời lịch thi môn ${params.subjectName}`,
          message: `Lịch thi môn ${params.subjectName} (ID: ${params.scheduleId}) đã dời sang ${params.newDate} (${params.newTime}). Đã gửi thông báo đến ${seenUserIds.size} người liên quan.`,
          link: '/exam-schedules',
          metadata: {
            scheduleId: params.scheduleId,
            subjectName: params.subjectName,
            newDate: params.newDate,
            newTime: params.newTime,
            reason: params.reason,
          },
        });
      }
    }

    if (notifItems.length > 0) {
      await this.createBulk(notifItems);
    }

    return { totalNotified: notifItems.length };
  }

  /**
   * Broadcast exam cancellation notification to all enrolled students and assigned teachers
   */
  async notifyScheduleCancelled(params: {
    scheduleId: number;
    subjectName: string;
    examDate: string;
    startTime: string;
    reason: string;
  }) {
    const scheduleRooms = await this.prisma.examScheduleRoom.findMany({
      where: { examScheduleId: params.scheduleId },
      include: {
        examRoomStudents: {
          include: { student: { select: { userId: true, fullName: true, studentCode: true } } },
        },
        supervisors: {
          include: { teacher: { select: { userId: true, fullName: true, teacherCode: true } } },
        },
      },
    });

    const notifItems: CreateNotificationDto[] = [];
    const seenUserIds = new Set<number>();

    // 1. Notify Students
    for (const sr of scheduleRooms) {
      for (const ers of sr.examRoomStudents) {
        const userId = ers.student?.userId;
        if (userId && !seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          notifItems.push({
            userId,
            type: NotificationTypeDto.EXAM_CANCELLED,
            title: `Thông báo HỦY ca thi môn ${params.subjectName}`,
            message: `Ca thi môn ${params.subjectName} dự kiến ngày ${params.examDate} (${params.startTime}) đã bị HỦY. Lý do: ${params.reason}. Vui lòng theo dõi thông báo lịch thi bù mới.`,
            link: '/student/exam-schedule',
            metadata: {
              scheduleId: params.scheduleId,
              subjectName: params.subjectName,
              examDate: params.examDate,
              reason: params.reason,
            },
          });
        }
      }
    }

    // 2. Notify Teachers
    for (const sr of scheduleRooms) {
      for (const sup of sr.supervisors) {
        const userId = sup.teacher?.userId;
        if (userId && !seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          notifItems.push({
            userId,
            type: NotificationTypeDto.EXAM_CANCELLED,
            title: `Thông báo HỦY ca coi thi môn ${params.subjectName}`,
            message: `Ca coi thi môn ${params.subjectName} ngày ${params.examDate} (${params.startTime}) đã bị HỦY. Lý do: ${params.reason}. Phân công coi thi của Quý Thầy/Cô đã được giải phóng.`,
            link: '/teacher/assignments',
            metadata: {
              scheduleId: params.scheduleId,
              subjectName: params.subjectName,
              examDate: params.examDate,
              reason: params.reason,
            },
          });
        }
      }
    }

    // 3. Notify Admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    for (const admin of admins) {
      if (!seenUserIds.has(admin.id)) {
        seenUserIds.add(admin.id);
        notifItems.push({
          userId: admin.id,
          type: NotificationTypeDto.EXAM_CANCELLED,
          title: `Đã hủy ca thi môn ${params.subjectName}`,
          message: `Ca thi môn ${params.subjectName} (ID: ${params.scheduleId}) đã bị hủy. Lý do: ${params.reason}. Đã gửi thông báo hủy đến ${seenUserIds.size} người liên quan.`,
          link: '/exam-schedules',
          metadata: {
            scheduleId: params.scheduleId,
            subjectName: params.subjectName,
            reason: params.reason,
          },
        });
      }
    }

    if (notifItems.length > 0) {
      await this.createBulk(notifItems);
    }

    return { totalNotified: notifItems.length };
  }
}
