"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const departments_module_1 = require("./departments/departments.module");
const classes_module_1 = require("./classes/classes.module");
const students_module_1 = require("./students/students.module");
const teachers_module_1 = require("./teachers/teachers.module");
const subjects_module_1 = require("./subjects/subjects.module");
const exam_rooms_module_1 = require("./exam-rooms/exam-rooms.module");
const exam_periods_module_1 = require("./exam-periods/exam-periods.module");
const exam_schedules_module_1 = require("./exam-schedules/exam-schedules.module");
const exam_arrangement_module_1 = require("./exam-arrangement/exam-arrangement.module");
const exam_supervisors_module_1 = require("./exam-supervisors/exam-supervisors.module");
const questions_module_1 = require("./questions/questions.module");
const exam_papers_module_1 = require("./exam-papers/exam-papers.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            departments_module_1.DepartmentsModule,
            classes_module_1.ClassesModule,
            students_module_1.StudentsModule,
            teachers_module_1.TeachersModule,
            subjects_module_1.SubjectsModule,
            exam_rooms_module_1.ExamRoomsModule,
            exam_periods_module_1.ExamPeriodsModule,
            exam_schedules_module_1.ExamSchedulesModule,
            exam_arrangement_module_1.ExamArrangementModule,
            exam_supervisors_module_1.ExamSupervisorsModule,
            questions_module_1.QuestionsModule,
            exam_papers_module_1.ExamPapersModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map