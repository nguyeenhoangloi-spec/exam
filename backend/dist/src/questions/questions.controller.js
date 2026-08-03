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
exports.QuestionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const XLSX = require("xlsx");
const questions_service_1 = require("./questions.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const ai_service_1 = require("./ai.service");
let QuestionsController = class QuestionsController {
    constructor(questionsService, ai) {
        this.questionsService = questionsService;
        this.ai = ai;
    }
    async import(req, file) {
        if (!file)
            throw new Error('Vui lòng chọn file Excel hoặc CSV.');
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
        return this.questionsService.bulkCreate(req.user.id, rows);
    }
    generate(body) { return this.ai.generate(body); }
    async extractDocument(file) {
        if (!file)
            throw new Error('Vui lòng chọn file Word hoặc PDF.');
        const text = await this.ai.extractDocument(file);
        if (!text.trim())
            throw new Error('Không đọc được nội dung tài liệu.');
        return { text: text.slice(0, 120000), fileName: file.originalname };
    }
    findAll(subjectId, chapter, difficulty, status) {
        return this.questionsService.findAll({
            subjectId: subjectId ? parseInt(subjectId, 10) : undefined,
            chapter: chapter ? parseInt(chapter, 10) : undefined,
            difficulty,
            status,
        });
    }
    findOne(id) {
        return this.questionsService.findOne(id);
    }
    create(req, body) {
        return this.questionsService.create(req.user.id, body);
    }
    update(id, body) {
        return this.questionsService.update(id, body);
    }
    approve(id, body) {
        return this.questionsService.approve(id, body?.status || 'APPROVED');
    }
    remove(id) {
        return this.questionsService.remove(id);
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "import", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Post)('ai-generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "generate", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Post)('extract-document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "extractDocument", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('subjectId')),
    __param(1, (0, common_1.Query)('chapter')),
    __param(2, (0, common_1.Query)('difficulty')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "approve", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "remove", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService, ai_service_1.AiQuestionsService])
], QuestionsController);
//# sourceMappingURL=questions.controller.js.map