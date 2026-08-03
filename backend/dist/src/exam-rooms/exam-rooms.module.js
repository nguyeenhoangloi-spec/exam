"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamRoomsModule = void 0;
const common_1 = require("@nestjs/common");
const exam_rooms_service_1 = require("./exam-rooms.service");
const exam_rooms_controller_1 = require("./exam-rooms.controller");
let ExamRoomsModule = class ExamRoomsModule {
};
exports.ExamRoomsModule = ExamRoomsModule;
exports.ExamRoomsModule = ExamRoomsModule = __decorate([
    (0, common_1.Module)({
        controllers: [exam_rooms_controller_1.ExamRoomsController],
        providers: [exam_rooms_service_1.ExamRoomsService],
        exports: [exam_rooms_service_1.ExamRoomsService],
    })
], ExamRoomsModule);
//# sourceMappingURL=exam-rooms.module.js.map