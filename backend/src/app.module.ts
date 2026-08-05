import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ExamRoomsModule } from './exam-rooms/exam-rooms.module';
import { ExamPeriodsModule } from './exam-periods/exam-periods.module';
import { ExamSchedulesModule } from './exam-schedules/exam-schedules.module';
import { ExamArrangementModule } from './exam-arrangement/exam-arrangement.module';
import { ExamSupervisorsModule } from './exam-supervisors/exam-supervisors.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamPapersModule } from './exam-papers/exam-papers.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OnlineExamsModule } from './online-exams/online-exams.module';
import { ProctorModule } from './proctor/proctor.module';

import { SecurityModule } from './common/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SecurityModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ClassesModule,
    StudentsModule,
    TeachersModule,
    SubjectsModule,
    ExamRoomsModule,
    ExamPeriodsModule,
    ExamSchedulesModule,
    ExamArrangementModule,
    ExamSupervisorsModule,
    QuestionsModule,
    ExamPapersModule,
    DashboardModule,
    OnlineExamsModule,
    ProctorModule,
  ],
})
export class AppModule {}
