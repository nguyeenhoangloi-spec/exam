import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { AuditService } from '../audit/audit.service';
import { AccessPolicyService } from '../access-control/access-policy.service';
import {
  ExamReportExportDto,
  ExamReportExportFormat,
  ExamReportFiltersDto,
  ExamReportPreviewDto,
  ExamReportType,
} from './dto/report-request.dto';

const submittedStatuses = ['SUBMITTED', 'AUTO_SUBMITTED', 'UNDER_REVIEW', 'GRADED'];

type ReportColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
};

const reportCatalog = [
  { type: ExamReportType.EXAM_SUMMARY, name: 'Tổng hợp kỳ thi', description: 'Tổng hợp số lượng dự thi, nộp bài, điểm và tỷ lệ đạt theo ca thi.', group: 'Tổng hợp', formats: ['XLSX', 'CSV', 'PRINT'] },
  { type: ExamReportType.RESULTS_BY_SCHEDULE, name: 'Kết quả theo ca thi', description: 'So sánh kết quả và chất lượng giữa các ca thi, môn học và đơn vị.', group: 'Kết quả', formats: ['XLSX', 'CSV', 'PRINT'] },
  { type: ExamReportType.SCORE_DISTRIBUTION, name: 'Phổ điểm', description: 'Phân bố số bài theo các khoảng điểm và tỷ trọng tương ứng.', group: 'Kết quả', formats: ['XLSX', 'CSV', 'PRINT'] },
  { type: ExamReportType.ATTENDANCE, name: 'Tình hình dự thi', description: 'Số được phân công, đã nộp và vắng thi theo từng ca.', group: 'Thí sinh', formats: ['XLSX', 'CSV', 'PRINT'] },
  { type: ExamReportType.GRADING_PROGRESS, name: 'Tiến độ chấm thi', description: 'Theo dõi số bài đã chấm và còn chờ chấm theo từng ca.', group: 'Chấm thi', formats: ['XLSX', 'CSV', 'PRINT'] },
  { type: ExamReportType.INCIDENTS, name: 'Cảnh báo và vi phạm', description: 'Tổng hợp bài thi bị gắn cờ hoặc có sự cố cần xem xét.', group: 'An toàn thi', formats: ['XLSX', 'CSV', 'PRINT'] },
  { type: ExamReportType.GRADE_APPEALS, name: 'Phúc khảo điểm thi', description: 'Danh sách đơn phúc khảo, trạng thái xử lý và thay đổi điểm.', group: 'Phúc khảo', formats: ['XLSX', 'CSV', 'PRINT'] },
] as const;

@Injectable()
export class ExamReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit?: AuditService,
    private readonly accessPolicy: AccessPolicyService = {
      allowedSubjectIds: async () => null,
      assertSubjectScope: async () => undefined,
    } as unknown as AccessPolicyService,
  ) {}

  getCatalog() {
    return reportCatalog;
  }

  private async officialScheduleWhere(actor: any) {
    const where: any = { deletedAt: null, mode: 'OFFICIAL' };
    const allowedSubjectIds = await this.accessPolicy.allowedSubjectIds(actor);
    if (allowedSubjectIds !== null) where.AND = [{ subjectId: { in: allowedSubjectIds } }];
    if (actor?.role === 'TEACHER') {
      where.AND = [
        ...(where.AND || []),
        { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } },
      ];
    }
    return where;
  }

  async getSchedules(actor: any) {
    return this.prisma.examSchedule.findMany({
      where: await this.officialScheduleWhere(actor),
      include: {
        examPeriod: true,
        subject: true,
        examPapers: { where: { deletedAt: null }, select: { id: true, paperCode: true, status: true } },
        examScheduleRooms: { include: { room: true, _count: { select: { examRoomStudents: true, supervisors: true } } } },
      },
      orderBy: [{ examDate: 'desc' }, { startTime: 'desc' }, { id: 'desc' }],
    });
  }

  async getSummary(actor: any, query: Record<string, string>) {
    const int = (value?: string | number) => {
      if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
      return value && /^\d+$/.test(String(value)) ? Number(value) : undefined;
    };
    const examPeriodId = int(query.examPeriodId);
    const subjectId = int(query.subjectId);
    const departmentId = int(query.departmentId);
    const classId = int(query.classId);
    const fromDate = query.fromDate ? new Date(`${query.fromDate}T00:00:00.000Z`) : undefined;
    const toDate = query.toDate ? new Date(`${query.toDate}T23:59:59.999Z`) : undefined;

    // Báo cáo khảo thí chính thức không bao gồm dữ liệu luyện tập/thi thử.
    const scheduleWhere: any = await this.officialScheduleWhere(actor);
    if (examPeriodId) scheduleWhere.examPeriodId = examPeriodId;
    if (subjectId) scheduleWhere.subjectId = subjectId;
    if (fromDate || toDate) scheduleWhere.examDate = { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) };
    if (departmentId) scheduleWhere.subject = { departmentId };
    if (classId) {
      scheduleWhere.AND = [
        ...(scheduleWhere.AND || []),
        { examScheduleRooms: { some: { examRoomStudents: { some: { student: { classId } } } } } },
      ];
    }
    const schedules: any[] = await this.prisma.examSchedule.findMany({
      where: scheduleWhere,
      select: {
        id: true,
        examPeriodId: true,
        examDate: true,
        subject: { select: { id: true, subjectCode: true, subjectName: true, departmentId: true, department: { select: { id: true, name: true } } } },
        examPeriod: { select: { id: true, name: true } },
        examScheduleRooms: { select: { examRoomStudents: { select: { studentId: true, student: { select: { classId: true, class: { select: { id: true, name: true } } } } } } } },
      },
      orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
    });

    const scheduleIds = schedules.map((schedule) => schedule.id);
    const attempts: any[] = scheduleIds.length
      ? await this.prisma.examAttempt.findMany({
        where: { mode: 'OFFICIAL', onlineExamConfig: { examScheduleId: { in: scheduleIds } } },
        select: { studentId: true, status: true, totalScore: true, submittedAt: true, gradingStatus: true, isFlagged: true, riskScore: true, incidents: { select: { id: true } }, onlineExamConfig: { select: { examScheduleId: true } } },
      })
      : [];

    const attemptsBySchedule = new Map<number, any[]>();
    for (const attempt of attempts) {
      const id = attempt.onlineExamConfig.examScheduleId;
      const list = attemptsBySchedule.get(id) || [];
      list.push(attempt);
      attemptsBySchedule.set(id, list);
    }

    let assigned = 0;
    let submitted = 0;
    let absent = 0;
    let ungraded = 0;
    let flagged = 0;
    let passCount = 0;
    const scores: number[] = [];
    const classes = new Map<number, { id: number; name: string }>();
    const periods = new Map<number, { id: number; name: string }>();
    const subjects = new Map<number, { id: number; code: string; name: string }>();
    const departments = new Map<number, { id: number; name: string }>();
    const scheduleRows = schedules.map((schedule) => {
      periods.set(schedule.examPeriod.id, { id: schedule.examPeriod.id, name: schedule.examPeriod.name });
      subjects.set(schedule.subject.id, { id: schedule.subject.id, code: schedule.subject.subjectCode, name: schedule.subject.subjectName });
      departments.set(schedule.subject.department.id, { id: schedule.subject.department.id, name: schedule.subject.department.name });
      const studentIds = new Set<number>();
      for (const room of schedule.examScheduleRooms) {
        for (const row of room.examRoomStudents) {
          if (!classId || row.student.classId === classId) studentIds.add(row.studentId);
          classes.set(row.student.class.id, { id: row.student.class.id, name: row.student.class.name });
        }
      }
      const scheduleAttempts = (attemptsBySchedule.get(schedule.id) || []).filter((attempt) => studentIds.has(attempt.studentId));
      const scheduleSubmitted = scheduleAttempts.filter((attempt) => submittedStatuses.includes(attempt.status));
      const scheduleScores = scheduleSubmitted.filter((attempt) => typeof attempt.totalScore === 'number').map((attempt) => attempt.totalScore as number);
      const scheduleFlagged = scheduleAttempts.filter((attempt) => attempt.isFlagged || attempt.riskScore > 0 || attempt.incidents.length > 0).length;
      const scheduleUngraded = scheduleSubmitted.filter((attempt) => attempt.totalScore === null).length;
      const schedulePassed = scheduleScores.filter((score) => score >= 5).length;

      assigned += studentIds.size;
      submitted += scheduleSubmitted.length;
      absent += Math.max(0, studentIds.size - scheduleSubmitted.length);
      ungraded += scheduleUngraded;
      flagged += scheduleFlagged;
      passCount += schedulePassed;
      scores.push(...scheduleScores);

      return {
        id: schedule.id,
        examPeriodId: schedule.examPeriodId,
        periodName: schedule.examPeriod.name,
        subjectId: schedule.subject.id,
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName,
        departmentId: schedule.subject.departmentId,
        departmentName: schedule.subject.department.name,
        examDate: schedule.examDate,
        assigned: studentIds.size,
        submitted: scheduleSubmitted.length,
        graded: scheduleScores.length,
        absent: Math.max(0, studentIds.size - scheduleSubmitted.length),
        ungraded: scheduleUngraded,
        flagged: scheduleFlagged,
        passCount: schedulePassed,
        avgScore: scheduleScores.length ? Number((scheduleScores.reduce((a, b) => a + b, 0) / scheduleScores.length).toFixed(2)) : 0,
      };
    });

    const scoreDistribution = {
      excellent: scores.filter((s) => s >= 9.0).length,
      good: scores.filter((s) => s >= 8.0 && s < 9.0).length,
      fair: scores.filter((s) => s >= 7.0 && s < 8.0).length,
      average: scores.filter((s) => s >= 5.0 && s < 7.0).length,
      poor: scores.filter((s) => s < 5.0).length,
      totalGraded: scores.length,
    };

    return {
      filters: { examPeriodId: examPeriodId ?? null, subjectId: subjectId ?? null, departmentId: departmentId ?? null, classId: classId ?? null, fromDate: query.fromDate || null, toDate: query.toDate || null },
      stats: {
        totalExams: new Set(schedules.map((schedule) => schedule.examPeriodId)).size,
        totalSchedules: schedules.length,
        totalAssigned: assigned,
        totalSubmitted: submitted,
        totalGraded: scores.length,
        totalAbsent: absent,
        totalUngraded: ungraded,
        totalFlagged: flagged,
        passCount,
        passRate: scores.length ? Number(((passCount / scores.length) * 100).toFixed(1)) : 0,
        avgScore: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0,
        scoreDistribution,
      },
      schedules: scheduleRows,
      options: {
        classes: Array.from(classes.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        periods: Array.from(periods.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        subjects: Array.from(subjects.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        departments: Array.from(departments.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      },
    };
  }

  async preview(actor: any, dto: ExamReportPreviewDto) {
    const filters = dto.filters || {};
    const summary = await this.getSummary(actor, filters as any);
    const definition = reportCatalog.find((item) => item.type === dto.type);
    const generatedAt = new Date().toISOString();

    let columns: ReportColumn[] = [];
    let rows: Record<string, unknown>[] = [];

    const scheduleColumns: ReportColumn[] = [
      { key: 'periodName', label: 'Kỳ thi' },
      { key: 'subjectCode', label: 'Mã môn' },
      { key: 'subjectName', label: 'Môn thi' },
      { key: 'departmentName', label: 'Khoa' },
      { key: 'examDate', label: 'Ngày thi', align: 'center' },
      { key: 'assigned', label: 'Dự kiến', align: 'right' },
      { key: 'submitted', label: 'Đã nộp', align: 'right' },
      { key: 'graded', label: 'Đã chấm', align: 'right' },
      { key: 'absent', label: 'Vắng', align: 'right' },
      { key: 'ungraded', label: 'Chưa chấm', align: 'right' },
      { key: 'flagged', label: 'Cảnh báo', align: 'right' },
      { key: 'avgScore', label: 'Điểm TB', align: 'right' },
      { key: 'passRate', label: 'Tỷ lệ đạt', align: 'right' },
    ];
    const scheduleRows = summary.schedules.map((row: any) => ({
      ...row,
      examDate: new Date(row.examDate).toLocaleDateString('vi-VN'),
      passRate: row.graded ? Number(((row.passCount / row.graded) * 100).toFixed(1)) : 0,
    }));

    switch (dto.type) {
      case ExamReportType.SCORE_DISTRIBUTION: {
        const distribution = summary.stats.scoreDistribution;
        const total = distribution.totalGraded || 0;
        columns = [
          { key: 'range', label: 'Khoảng điểm' },
          { key: 'classification', label: 'Xếp loại' },
          { key: 'count', label: 'Số bài', align: 'right' },
          { key: 'rate', label: 'Tỷ trọng (%)', align: 'right' },
        ];
        rows = [
          ['9,0 – 10', 'Xuất sắc', distribution.excellent],
          ['8,0 – dưới 9,0', 'Giỏi', distribution.good],
          ['7,0 – dưới 8,0', 'Khá', distribution.fair],
          ['5,0 – dưới 7,0', 'Trung bình', distribution.average],
          ['Dưới 5,0', 'Chưa đạt', distribution.poor],
        ].map(([range, classification, count]) => ({ range, classification, count, rate: total ? Number(((Number(count) / total) * 100).toFixed(1)) : 0 }));
        break;
      }
      case ExamReportType.ATTENDANCE:
        columns = scheduleColumns.filter((column) => ['periodName', 'subjectCode', 'subjectName', 'examDate', 'assigned', 'submitted', 'absent'].includes(column.key));
        rows = scheduleRows;
        break;
      case ExamReportType.GRADING_PROGRESS:
        columns = scheduleColumns.filter((column) => ['periodName', 'subjectCode', 'subjectName', 'examDate', 'submitted', 'graded', 'ungraded'].includes(column.key));
        rows = scheduleRows;
        break;
      case ExamReportType.INCIDENTS:
        columns = scheduleColumns.filter((column) => ['periodName', 'subjectCode', 'subjectName', 'examDate', 'submitted', 'flagged'].includes(column.key));
        rows = scheduleRows.filter((row: any) => row.flagged > 0);
        break;
      case ExamReportType.GRADE_APPEALS: {
        const scheduleWhere = await this.buildScheduleWhere(actor, filters);
        const appeals = await this.prisma.gradeAppeal.findMany({
          where: {
            attempt: { mode: 'OFFICIAL', onlineExamConfig: { examSchedule: scheduleWhere } },
            ...(filters.classId ? { student: { classId: filters.classId } } : {}),
          },
          select: {
            id: true,
            status: true,
            originalScore: true,
            revisedScore: true,
            createdAt: true,
            reviewedAt: true,
            student: { select: { studentCode: true, fullName: true, class: { select: { name: true } } } },
            attempt: { select: { onlineExamConfig: { select: { examSchedule: { select: { subject: { select: { subjectCode: true, subjectName: true } } } } } } } },
          },
          orderBy: { createdAt: 'desc' },
        });
        columns = [
          { key: 'studentCode', label: 'Mã sinh viên' },
          { key: 'studentName', label: 'Họ và tên' },
          { key: 'className', label: 'Lớp' },
          { key: 'subjectCode', label: 'Mã môn' },
          { key: 'subjectName', label: 'Môn thi' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'originalScore', label: 'Điểm cũ', align: 'right' },
          { key: 'revisedScore', label: 'Điểm mới', align: 'right' },
          { key: 'createdAt', label: 'Ngày gửi', align: 'center' },
        ];
        rows = appeals.map((appeal: any) => ({
          studentCode: appeal.student.studentCode,
          studentName: appeal.student.fullName,
          className: appeal.student.class.name,
          subjectCode: appeal.attempt.onlineExamConfig.examSchedule.subject.subjectCode,
          subjectName: appeal.attempt.onlineExamConfig.examSchedule.subject.subjectName,
          status: this.appealStatusLabel(appeal.status),
          originalScore: appeal.originalScore,
          revisedScore: appeal.revisedScore ?? '',
          createdAt: appeal.createdAt.toLocaleDateString('vi-VN'),
        }));
        break;
      }
      case ExamReportType.EXAM_SUMMARY:
      case ExamReportType.RESULTS_BY_SCHEDULE:
      default:
        columns = scheduleColumns;
        rows = scheduleRows;
        break;
    }

    const requestedColumns = new Set(dto.columns || []);
    if (requestedColumns.size) {
      columns = columns.filter((column) => requestedColumns.has(column.key));
    }

    return {
      type: dto.type,
      title: dto.title?.trim() || definition?.name || 'Báo cáo khảo thí',
      description: definition?.description || '',
      generatedAt,
      filters: summary.filters,
      stats: summary.stats,
      columns,
      rows: rows.map((row) => Object.fromEntries(columns.map((column) => [column.key, row[column.key] ?? '']))),
      totalRows: rows.length,
    };
  }

  async export(actor: any, dto: ExamReportExportDto) {
    const preview = await this.preview(actor, dto);
    const date = new Date().toISOString().slice(0, 10);
    const safeName = this.filenamePart(preview.title);

    let buffer: Buffer;
    let contentType: string;
    let filename: string;
    if (dto.format === ExamReportExportFormat.CSV) {
      const lines = [
        preview.columns.map((column) => this.csvCell(column.label)).join(','),
        ...preview.rows.map((row) => preview.columns.map((column) => this.csvCell(row[column.key])).join(',')),
      ];
      buffer = Buffer.from(`\uFEFF${lines.join('\r\n')}`, 'utf8');
      contentType = 'text/csv; charset=utf-8';
      filename = `${safeName}_${date}.csv`;
    } else {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Exam Management System';
      workbook.created = new Date();
      const sheet = workbook.addWorksheet('Báo cáo', { views: [{ state: 'frozen', ySplit: 4 }] });
      const width = Math.max(1, preview.columns.length);
      sheet.mergeCells(1, 1, 1, width);
      sheet.getCell(1, 1).value = preview.title.toUpperCase();
      sheet.getCell(1, 1).font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E66F5' } };
      sheet.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.mergeCells(2, 1, 2, width);
      sheet.getCell(2, 1).value = `Thời điểm xuất: ${new Date(preview.generatedAt).toLocaleString('vi-VN')}, Tổng số bản ghi: ${preview.totalRows}`;
      sheet.getCell(2, 1).alignment = { horizontal: 'center' };
      sheet.getCell(2, 1).font = { name: 'Arial', size: 10, color: { argb: 'FF374151' } };
      const header = sheet.getRow(4);
      header.values = preview.columns.map((column) => column.label);
      header.height = 26;
      header.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E66F5' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      });
      preview.rows.forEach((row, index) => {
        const excelRow = sheet.addRow(preview.columns.map((column) => row[column.key]));
        excelRow.eachCell((cell, columnIndex) => {
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: preview.columns[columnIndex - 1]?.align || 'left' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'FFF8FAFC' : 'FFFFFFFF' } };
          cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        });
      });
      preview.columns.forEach((column, index) => {
        const values = preview.rows.map((row) => String(row[column.key] ?? '').length);
        sheet.getColumn(index + 1).width = Math.min(45, Math.max(12, column.label.length + 3, ...values.map((value) => value + 2)));
      });
      sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: width } };
      buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${safeName}_${date}.xlsx`;
    }

    await this.audit?.write({
      actorId: actor?.id,
      action: 'EXAM_REPORT_EXPORT',
      entityType: 'ExamReport',
      entityId: dto.type,
      description: `Đã xuất ${preview.title} định dạng ${dto.format}`,
      metadata: {
        type: dto.type,
        format: dto.format,
        filters: dto.filters ? { ...dto.filters } : {},
        totalRows: preview.totalRows,
      },
    });

    return { buffer, contentType, filename };
  }

  private async buildScheduleWhere(actor: any, filters: ExamReportFiltersDto) {
    const where: any = await this.officialScheduleWhere(actor);
    if (filters.examPeriodId) where.examPeriodId = filters.examPeriodId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.departmentId) where.subject = { departmentId: filters.departmentId };
    if (filters.fromDate || filters.toDate) {
      where.examDate = {
        ...(filters.fromDate ? { gte: new Date(`${filters.fromDate}T00:00:00.000Z`) } : {}),
        ...(filters.toDate ? { lte: new Date(`${filters.toDate}T23:59:59.999Z`) } : {}),
      };
    }
    if (filters.classId) {
      where.AND = [
        ...(where.AND || []),
        { examScheduleRooms: { some: { examRoomStudents: { some: { student: { classId: filters.classId } } } } } },
      ];
    }
    return where;
  }

  private appealStatusLabel(status: string) {
    return ({ PENDING: 'Chờ tiếp nhận', UNDER_REVIEW: 'Đang xem xét', APPROVED_REGRADE: 'Đã chấp nhận chấm lại', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' } as Record<string, string>)[status] || status;
  }

  private filenamePart(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Bao_Cao';
  }

  private csvCell(value: unknown) {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }
}
