"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamArrangementModule = void 0;
const common_1 = require("@nestjs/common");
const exam_arrangement_service_1 = require("./exam-arrangement.service");
const exam_arrangement_controller_1 = require("./exam-arrangement.controller");
let ExamArrangementModule = class ExamArrangementModule {
};
exports.ExamArrangementModule = ExamArrangementModule;
exports.ExamArrangementModule = ExamArrangementModule = __decorate([
    (0, common_1.Module)({
        controllers: [exam_arrangement_controller_1.ExamArrangementController],
        providers: [exam_arrangement_service_1.ExamArrangementService],
        exports: [exam_arrangement_service_1.ExamArrangementService],
    })
], ExamArrangementModule);
//# sourceMappingURL=exam-arrangement.module.js.map