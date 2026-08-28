import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { ContactModule } from './contact/contact.module';
import { SupportChatModule } from './support-chat/support-chat.module';
import { SecurityModule } from './common/security/security.module';
import { EssayModule } from './essay/essay.module';
import { AiModule } from './ai/ai.module';
import { TrashModule } from './trash/trash.module';
import { PracticeModule } from './practice/practice.module';
import { GradeAppealsModule } from './grade-appeals/grade-appeals.module';
import { ExamReportsModule } from './exam-reports/exam-reports.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { BackupsModule } from './backups/backup.module';
import { AccessControlModule } from './access-control/access-control.module';
import { DocumentTemplatesModule } from './document-templates/document-templates.module';
import { SecurityAuditModule } from './security-audit/security-audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExamArchivesModule } from './exam-archives/exam-archives.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SecurityModule,
    AuditModule,
    SecurityAuditModule,
    NotificationsModule,
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
    EssayModule,
    ContactModule,
    SupportChatModule,
    AiModule,
    TrashModule,
    PracticeModule,
    GradeAppealsModule,
    ExamReportsModule,
    BackupsModule,
    AccessControlModule,
    DocumentTemplatesModule,
    ExamArchivesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
})
export class AppModule {}
