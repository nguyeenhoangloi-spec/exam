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
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const ai_service_1 = require("./ai.service");
const question_dto_1 = require("./dto/question.dto");
const questions_service_1 = require("./questions.service");
const csvUpload = (0, platform_express_1.FileInterceptor)('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => callback(file.originalname.toLowerCase().endsWith('.csv') ? null : new common_1.BadRequestException('Chỉ chấp nhận file CSV.'), file.originalname.toLowerCase().endsWith('.csv')),
});
let QuestionsController = class QuestionsController {
    constructor(questions, ai) {
        this.questions = questions;
        this.ai = ai;
    }
    findAll(req, query) {
        return this.questions.findAll(req.user, query);
    }
    statistics(req) {
        return this.questions.statistics(req.user);
    }
    filterOptions(req) {
        return this.questions.filterOptions(req.user);
    }
    template() {
        return this.questions.importTemplate();
    }
    async export(req, query, res) {
        const csv = await this.questions.exportCsv(req.user, query);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
        res.send(csv);
    }
    bulk(req, body) {
        return this.questions.bulkAction(req.user, body);
    }
    preview(req, file) {
        if (!file)
            throw new common_1.BadRequestException('Vui lòng chọn file CSV.');
        return this.questions.importPreview(req.user, file);
    }
    confirm(req, file, raw) {
        if (!file)
            throw new common_1.BadRequestException('Vui lòng gửi lại file CSV.');
        const body = {
            hash: raw.hash,
            rows: Array.isArray(raw.rows) ? raw.rows.map(Number) : JSON.parse(raw.rows || '[]').map(Number),
            overrideDuplicate: raw.overrideDuplicate === true || raw.overrideDuplicate === 'true',
        };
        return this.questions.importConfirm(req.user, file, body);
    }
    generateAi(body) {
        return this.ai.generate(body);
    }
    saveAi(req, body) {
        return this.questions.saveAi(req.user, body);
    }
    create(req, body) {
        return this.questions.create(req.user, body);
    }
    findOne(req, id) {
        return this.questions.findOne(req.user, id);
    }
    update(req, id, body) {
        return this.questions.update(req.user, id, body);
    }
    duplicate(req, id) {
        return this.questions.duplicate(req.user, id);
    }
    submit(req, id) {
        return this.questions.submit(req.user, id);
    }
    approve(req, id) {
        return this.questions.approve(req.user, id);
    }
    reject(req, id, body) {
        return this.questions.reject(req.user, id, body.reason);
    }
    archive(req, id) {
        return this.questions.archive(req.user, id);
    }
    restore(req, id) {
        return this.questions.restore(req.user, id);
    }
    remove(req, id) {
        return this.questions.remove(req.user, id);
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, question_dto_1.QuestionQueryDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "statistics", null);
__decorate([
    (0, common_1.Get)('filter-options'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "filterOptions", null);
__decorate([
    (0, common_1.Get)('import/template'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="question-import-template.csv"'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "template", null);
__decorate([
    (0, common_1.Post)('export'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, question_dto_1.QuestionQueryDto, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "export", null);
__decorate([
    (0, common_1.Post)('bulk-action'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, question_dto_1.BulkActionDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "bulk", null);
__decorate([
    (0, common_1.Post)('import/preview'),
    (0, common_1.UseInterceptors)(csvUpload),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('import/confirm'),
    (0, common_1.UseInterceptors)(csvUpload),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)('ai-generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_dto_1.GenerateAiQuestionsDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "generateAi", null);
__decorate([
    (0, common_1.Post)('ai-save'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, question_dto_1.SaveAiQuestionsDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "saveAi", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, question_dto_1.UpdateQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, question_dto_1.RejectQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "restore", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "remove", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'TEACHER'),
    (0, common_1.Controller)('questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService,
        ai_service_1.AiQuestionsService])
], QuestionsController);
//# sourceMappingURL=questions.controller.js.map