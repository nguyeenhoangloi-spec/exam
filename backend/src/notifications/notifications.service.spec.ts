import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationTypeDto } from './dto/notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    examScheduleRoom: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create single notification', async () => {
    prisma.notification.create.mockResolvedValue({ id: 1, userId: 10, title: 'Test' });
    const res = await service.create({
      userId: 10,
      title: 'Test',
      message: 'Test message',
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 10,
        type: NotificationTypeDto.GENERAL,
        title: 'Test',
        message: 'Test message',
        link: undefined,
        metadata: undefined,
      },
    });
    expect(res.id).toBe(1);
  });

  it('should get notifications for current user with unread count', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 1, isRead: false }]);
    prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(5);

    const res = await service.getMyNotifications(10, 10, 0);
    expect(res.items.length).toBe(1);
    expect(res.unreadCount).toBe(1);
    expect(res.total).toBe(5);
  });

  it('should mark a notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue({ id: 1, userId: 10 });
    prisma.notification.update.mockResolvedValue({ id: 1, isRead: true });

    const res = await service.markAsRead(10, 1);
    expect(res.isRead).toBe(true);
  });

  it('should broadcast schedule change to students, teachers and admins', async () => {
    prisma.examScheduleRoom.findMany.mockResolvedValue([
      {
        examRoomStudents: [{ student: { userId: 101, fullName: 'Nguyen Van A' } }],
        supervisors: [{ teacher: { userId: 201, fullName: 'Tran Thi B' } }],
      },
    ]);
    prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.notification.createMany.mockResolvedValue({ count: 3 });

    const res = await service.notifyScheduleChange({
      scheduleId: 5,
      subjectName: 'Toan cao cap',
      oldDate: '2026-09-01',
      oldTime: '08:00',
      newDate: '2026-09-05',
      newTime: '09:00',
      reason: 'Bao tri phong thi',
    });

    expect(prisma.notification.createMany).toHaveBeenCalled();
    expect(res.totalNotified).toBe(3);
  });
});
