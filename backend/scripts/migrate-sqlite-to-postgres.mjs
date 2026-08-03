import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath =
  process.env.LEGACY_SQLITE_PATH ||
  path.resolve(scriptDirectory, '../prisma/dev.db');
const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const prisma = new PrismaClient();

const all = (table) => sqlite.prepare(`SELECT * FROM "${table}"`).all();
const asDate = (value) => (value ? new Date(value) : null);
const asBoolean = (value) => value === true || value === 1;
const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const historyAction = (value) => {
  const mapping = {
    CREATED: 'CREATE',
    UPDATED: 'UPDATE',
    DRAFT: 'UPDATE',
    PENDING: 'SUBMIT',
    APPROVED: 'APPROVE',
    REJECTED: 'REJECT',
    ARCHIVED: 'ARCHIVE',
  };
  return mapping[String(value || '').toUpperCase()] || 'UPDATE';
};

async function resetIntegerSequences() {
  const tables = [
    'users',
    'departments',
    'classes',
    'students',
    'teachers',
    'subjects',
    'student_subjects',
    'exam_periods',
    'exam_schedules',
    'exam_rooms',
    'exam_schedule_rooms',
    'exam_room_students',
    'exam_supervisors',
    'exam_papers',
    'exam_paper_questions',
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), COALESCE((SELECT MAX(id) FROM "${table}"), 0) > 0)`,
    );
  }
}

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    throw new Error('PostgreSQL đích đã có dữ liệu. Dừng migration để tránh ghi đè.');
  }

  const questionIdMap = new Map();
  const chapterIdMap = new Map();
  const questions = all('questions');
  const subjectChapterPairs = new Map();
  for (const question of questions) {
    subjectChapterPairs.set(`${question.subjectId}:${question.chapter}`, {
      subjectId: question.subjectId,
      chapter: Number(question.chapter),
    });
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.user.createMany({
        data: all('users').map((row) => ({
          id: row.id,
          username: row.username,
          password: row.password,
          email: row.email,
          role: row.role,
          status: row.status,
          createdAt: asDate(row.createdAt),
          updatedAt: asDate(row.updatedAt),
        })),
      });
      await tx.department.createMany({ data: all('departments') });
      await tx.class.createMany({ data: all('classes') });
      await tx.student.createMany({
        data: all('students').map((row) => ({ ...row, dateOfBirth: asDate(row.dateOfBirth) })),
      });
      await tx.teacher.createMany({ data: all('teachers') });
      await tx.subject.createMany({ data: all('subjects') });
      await tx.studentSubject.createMany({ data: all('student_subjects') });
      await tx.examPeriod.createMany({
        data: all('exam_periods').map((row) => ({
          ...row,
          startDate: asDate(row.startDate),
          endDate: asDate(row.endDate),
        })),
      });
      await tx.examSchedule.createMany({
        data: all('exam_schedules').map((row) => ({ ...row, examDate: asDate(row.examDate) })),
      });
      await tx.examRoom.createMany({ data: all('exam_rooms') });
      await tx.examScheduleRoom.createMany({ data: all('exam_schedule_rooms') });
      await tx.examRoomStudent.createMany({ data: all('exam_room_students') });
      await tx.examSupervisor.createMany({ data: all('exam_supervisors') });

      for (const pair of subjectChapterPairs.values()) {
        const id = randomUUID();
        chapterIdMap.set(`${pair.subjectId}:${pair.chapter}`, id);
        await tx.chapter.create({
          data: {
            id,
            subjectId: pair.subjectId,
            code: `CH${String(pair.chapter).padStart(2, '0')}`,
            name: `Chương ${pair.chapter}`,
            order: pair.chapter,
          },
        });
      }

      for (const row of questions) {
        const id = randomUUID();
        questionIdMap.set(row.id, id);
        await tx.question.create({
          data: {
            id,
            code: `Q${String(row.id).padStart(6, '0')}`,
            subjectId: row.subjectId,
            chapterId: chapterIdMap.get(`${row.subjectId}:${row.chapter}`),
            content: row.content,
            normalizedContent: normalize(row.content),
            type: row.questionType,
            difficulty: row.difficulty,
            bloomLevel:
              row.cognitionLevel === 'ADVANCED_APPLY'
                ? 'ANALYZE'
                : row.cognitionLevel || 'UNDERSTAND',
            score: row.score,
            explanation: row.explanation,
            keywords: row.keywords,
            status: row.status,
            rejectionReason: row.rejectionReason,
            isActive: row.status !== 'ARCHIVED',
            createdAt: asDate(row.createdAt),
            updatedAt: asDate(row.updatedAt),
            approvedAt: asDate(row.approvedAt),
            archivedAt: asDate(row.archivedAt),
            createdById: row.createdById,
            approvedById: row.status === 'APPROVED' ? 1 : null,
            statistic: { create: {} },
          },
        });
      }

      const optionOrder = new Map();
      for (const row of all('question_options')) {
        const currentOrder = optionOrder.get(row.questionId) || 0;
        optionOrder.set(row.questionId, currentOrder + 1);
        await tx.questionOption.create({
          data: {
            id: randomUUID(),
            questionId: questionIdMap.get(row.questionId),
            label: row.optionLabel,
            content: row.optionContent,
            isCorrect: asBoolean(row.isCorrect),
            order: currentOrder,
          },
        });
      }

      for (const row of all('question_histories')) {
        await tx.questionHistory.create({
          data: {
            id: randomUUID(),
            questionId: questionIdMap.get(row.questionId),
            action: historyAction(row.action),
            note: row.note,
            changedById: row.createdById,
            createdAt: asDate(row.createdAt),
          },
        });
      }

      await tx.examPaper.createMany({ data: all('exam_papers') });
      for (const row of all('exam_paper_questions')) {
        const questionId = questionIdMap.get(row.questionId);
        await tx.examPaperQuestion.create({
          data: {
            id: row.id,
            examPaperId: row.examPaperId,
            questionId,
            questionOrder: row.questionOrder,
            score: row.score,
            usedAt: new Date(),
          },
        });
        await tx.questionStatistic.update({
          where: { questionId },
          data: { usedCount: { increment: 1 }, lastUsedAt: new Date() },
        });
      }
    },
    { maxWait: 30000, timeout: 120000 },
  );

  await resetIntegerSequences();
  const maximumCode = questions.reduce((max, row) => Math.max(max, Number(row.id)), 0);
  await prisma.$executeRawUnsafe(
    `SELECT setval('question_code_seq', ${Math.max(maximumCode, 1)}, ${maximumCode > 0})`,
  );

  const counts = {
    users: await prisma.user.count(),
    subjects: await prisma.subject.count(),
    chapters: await prisma.chapter.count(),
    questions: await prisma.question.count(),
    options: await prisma.questionOption.count(),
    histories: await prisma.questionHistory.count(),
  };
  console.log(JSON.stringify({ sqlitePath, migrated: counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
