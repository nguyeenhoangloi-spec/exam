import { PrismaClient } from '@prisma/client';
import { ExamArrangementService } from './src/exam-arrangement/exam-arrangement.service';
import { AuditService } from './src/audit/audit.service';

const prisma = new PrismaClient();
const audit = new AuditService(prisma as any);
const service = new ExamArrangementService(prisma as any, audit);

async function main() {
  const schedule = await prisma.examSchedule.findFirst({
    where: { subject: { subjectCode: 'AI1001' } },
    include: { subject: true, examPeriod: true, examPapers: true },
  });

  console.log('AI1001 Schedule:', schedule);
  if (!schedule) return;

  const rooms = await prisma.examRoom.findMany({ take: 4 });
  console.log('Available rooms:', rooms.map(r => ({ id: r.id, code: r.roomCode, cap: r.capacity })));

  try {
    const result = await service.preview({ id: 1 }, schedule.id, rooms.map(r => r.id));
    console.log('Preview Result SUCCESS:', result.summary);
  } catch (err: any) {
    console.error('Preview ERROR:', err);
  }
}

main().finally(() => prisma.$disconnect());
