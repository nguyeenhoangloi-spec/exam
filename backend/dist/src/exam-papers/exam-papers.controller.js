"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamPapersController = void 0;
const common_1 = require("@nestjs/common");
const exam_papers_service_1 = require("./exam-papers.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let ExamPapersController = class ExamPapersController {
    constructor(examPapersService) {
        this.examPapersService = examPapersService;
    }
    createRandom(req, body) {
        return this.examPapersService.createRandom(req.user.id, body);
    }
    findAll(examScheduleId) {
        return this.examPapersService.findAll(examScheduleId ? parseInt(examScheduleId, 10) : undefined);
    }
    findOne(id) {
        return this.examPapersService.findOne(id);
    }
    remove(id) {
        return this.examPapersService.remove(id);
    }
};
exports.ExamPapersController = ExamPapersController;
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Post)('create-random'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExamPapersController.prototype, "createRandom", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('examScheduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamPapersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExamPapersController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExamPapersController.prototype, "remove", null);
exports.ExamPapersController = ExamPapersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('exam-papers'),
    __metadata("design:paramtypes", [exam_papers_service_1.ExamPapersService])
], ExamPapersController);
//# sourceMappingURL=exam-papers.controller.js.map