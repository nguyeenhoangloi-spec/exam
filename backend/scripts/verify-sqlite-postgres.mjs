import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import manifest from './sqlite-migration-manifest.json' with { type: 'json' };

import fs from 'node:fs';

const dbUrl = new URL('../prisma/dev.db', import.meta.url);
const hasSqlite = fs.existsSync(dbUrl);
const sqlite = hasSqlite ? new DatabaseSync(dbUrl, { readOnly: true }) : null;
const prisma = new PrismaClient();
const checks = [
  ['users', 'user'], ['departments', 'department'], ['classes', 'class'],
  ['students', 'student'], ['teachers', 'teacher'], ['subjects', 'subject'],
  ['student_subjects', 'studentSubject'], ['exam_periods', 'examPeriod'],
  ['exam_schedules', 'examSchedule'], ['exam_rooms', 'examRoom'],
  ['exam_schedule_rooms', 'examScheduleRoom'], ['exam_room_students', 'examRoomStudent'],
  ['exam_supervisors', 'examSupervisor'], ['questions', 'question'],
  ['question_options', 'questionOption'], ['question_histories', 'questionHistory'],
  ['exam_papers', 'examPaper'], ['exam_paper_questions', 'examPaperQuestion'],
];
let valid = true;
for (const [table, model] of checks) {
  const currentSqlite = sqlite ? Number(sqlite.prepare(`SELECT COUNT(*) count FROM "${table}"`).get().count) : 'N/A (removed)';
  const source = manifest.counts[table];
  const target = await prisma[model].count();
  const ok = source === target;
  valid &&= ok;
  console.log(`${ok ? 'OK' : 'FAIL'} ${table}: snapshot=${source}, PostgreSQL=${target}, current-SQLite=${currentSqlite}`);
}
console.log(`PostgreSQL chapters=${await prisma.chapter.count()}, question_statistics=${await prisma.questionStatistic.count()}`);
if (sqlite) sqlite.close();
await prisma.$disconnect();
if (!valid) process.exitCode = 1;
