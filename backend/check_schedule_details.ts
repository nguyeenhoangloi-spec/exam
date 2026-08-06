import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const scheduleId = 13;
  console.log('=== CHECKING SCHEDULE ID', scheduleId, '===');

  const schedule = await prisma.examSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      examPeriod: true,
      subject: true,
      onlineExamConfig: {
        include: { examPaper: true },
      },
      examScheduleRooms: {
        include: {
          room: true,
          examRoomStudents: {
            include: { student: true },
          },
        },
      },
    },
  });

  if (!schedule) {
    console.log('Schedule 13 NOT FOUND!');
    return;
  }

  console.log('Schedule:', {
    id: schedule.id,
    examDate: schedule.examDate,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    status: schedule.status,
    examType: schedule.examType,
    mode: schedule.mode,
  });

  console.log('Exam Period:', {
    id: schedule.examPeriod?.id,
    name: schedule.examPeriod?.name,
    status: schedule.examPeriod?.status,
  });

  console.log('Online Exam Config:', schedule.onlineExamConfig ? {
    id: schedule.onlineExamConfig.id,
    examPaperId: schedule.onlineExamConfig.examPaperId,
    examPaperStatus: schedule.onlineExamConfig.examPaper?.status,
  } : 'NO CONFIG');

  // Check published exam papers
  const publishedPapers = await prisma.examPaper.findMany({
    where: { examScheduleId: scheduleId, deletedAt: null },
  });
  console.log('Published Papers count for schedule 13:', publishedPapers.length, publishedPapers.map(p => ({ id: p.id, title: p.title, status: p.status })));

  // Check students assigned
  const rooms = schedule.examScheduleRooms;
  console.log('Total Rooms assigned to Schedule 13:', rooms.length);
  for (const r of rooms) {
    console.log(`Room: ${r.room?.roomCode || r.roomId}, Total Students: ${r.examRoomStudents.length}`);
    if (r.examRoomStudents.length > 0) {
      console.log('Sample students:', r.examRoomStudents.slice(0, 3).map(ers => ({ code: ers.student?.studentCode, name: ers.student?.fullName, examNum: ers.examNumber, seat: ers.seatNumber })));
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
