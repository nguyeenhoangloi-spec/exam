import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentTemplateDataSource, DocumentTemplateVersionStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AccessPolicyService } from '../access-control/access-policy.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto } from './dto/document-template.dto';
import { SecurityAuditService } from '../security-audit/security-audit.service';

type Align = 'left' | 'center' | 'right';
type TemplateColumn = { key: string; label: string; align?: Align; width?: string; visible?: boolean };
type TemplateConfig = {
  templateType?: 'TABLE' | 'EXAM_PAPER';
  page?: { size?: 'A4' | 'A5'; orientation?: 'portrait' | 'landscape'; marginMm?: number };
  header?: {
    institutionName?: string;
    facultyName?: string;
    title?: string;
    subtitle?: string;
    motto?: string;
  };
  examInfo?: {
    subjectName?: string;
    subjectCode?: string;
    durationMinutes?: number;
    totalScore?: number;
    showScoreBox?: boolean;
    showInstructions?: boolean;
    instructionText?: string;
  };
  columns?: TemplateColumn[];
  footer?: { note?: string; signers?: Array<{ title: string; subtitle?: string }> };
};

const sourceLabel: Record<DocumentTemplateDataSource, string> = {
  EXAM_SCHEDULE_LIST: 'Danh sách lịch thi',
  ROOM_DOOR_LIST: 'Danh sách dán cửa phòng thi',
  SUPERVISOR_ASSIGNMENT: 'Phân công giảng viên coi thi',
  GRADE_REPORT: 'Bảng điểm ca thi',
  STUDENT_DIRECTORY: 'Danh sách sinh viên',
  TEACHER_DIRECTORY: 'Danh sách giảng viên',
  GENERIC_REPORT: 'Báo cáo & Đề thi tổng hợp',
};

const templateCodeColumns: Record<string, TemplateColumn[]> = {
  EXAM_SCHEDULE_LIST: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'period', label: 'Kỳ thi', width: '18%' },
    { key: 'subject', label: 'Môn học', width: '26%' },
    { key: 'date', label: 'Ngày thi', align: 'center', width: '14%' },
    { key: 'time', label: 'Ca thi', align: 'center', width: '14%' },
    { key: 'rooms', label: 'Phòng thi', width: '22%' },
  ],
  ROOM_DOOR_LIST: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'examNumber', label: 'Số báo danh', align: 'center', width: '14%' },
    { key: 'studentCode', label: 'Mã sinh viên', width: '14%' },
    { key: 'student', label: 'Họ và tên thí sinh', width: '28%' },
    { key: 'dob', label: 'Ngày sinh', align: 'center', width: '12%' },
    { key: 'class', label: 'Lớp', width: '14%' },
    { key: 'seatNumber', label: 'Số ghế', align: 'center', width: '12%' },
  ],
  ROOM_ATTENDANCE_SHEET: [
    { key: 'index', label: 'STT', align: 'center', width: '5%' },
    { key: 'examNumber', label: 'SBD', align: 'center', width: '10%' },
    { key: 'studentCode', label: 'MSSV', width: '12%' },
    { key: 'student', label: 'Họ và tên thí sinh', width: '24%' },
    { key: 'class', label: 'Lớp', width: '11%' },
    { key: 'paperCount', label: 'Số tờ', align: 'center', width: '8%' },
    { key: 'signature', label: 'Ký nộp bài', align: 'center', width: '18%' },
    { key: 'note', label: 'Ghi chú', width: '12%' },
  ],
  SUPERVISOR_ASSIGNMENT: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'teacher', label: 'Cán bộ coi thi', width: '24%' },
    { key: 'department', label: 'Khoa / Bộ môn', width: '18%' },
    { key: 'subject', label: 'Môn thi', width: '22%' },
    { key: 'room', label: 'Phòng', align: 'center', width: '10%' },
    { key: 'date', label: 'Ngày thi', align: 'center', width: '10%' },
    { key: 'role', label: 'Nhiệm vụ', align: 'center', width: '10%' },
  ],
  GRADE_REPORT: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'studentCode', label: 'MSSV', width: '12%' },
    { key: 'student', label: 'Họ và tên', width: '24%' },
    { key: 'class', label: 'Lớp', width: '12%' },
    { key: 'midScore', label: 'Điểm QT', align: 'center', width: '10%' },
    { key: 'examScore', label: 'Điểm thi', align: 'center', width: '10%' },
    { key: 'finalScore', label: 'Tổng kết', align: 'center', width: '10%' },
    { key: 'letterGrade', label: 'Điểm chữ', align: 'center', width: '8%' },
    { key: 'status', label: 'Kết quả', align: 'center', width: '8%' },
  ],
  STUDENT_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'studentCode', label: 'Mã SV', width: '14%' },
    { key: 'student', label: 'Họ và tên', width: '26%' },
    { key: 'dob', label: 'Ngày sinh', align: 'center', width: '12%' },
    { key: 'class', label: 'Lớp sinh hoạt', width: '16%' },
    { key: 'department', label: 'Khoa quản lý', width: '26%' },
  ],
  STUDENT_EXAM_PASS: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'subject', label: 'Môn thi', width: '30%' },
    { key: 'subjectCode', label: 'Mã HP', align: 'center', width: '12%' },
    { key: 'date', label: 'Ngày thi', align: 'center', width: '14%' },
    { key: 'time', label: 'Giờ thi', align: 'center', width: '14%' },
    { key: 'room', label: 'Phòng thi', align: 'center', width: '12%' },
    { key: 'examNumber', label: 'SBD', align: 'center', width: '12%' },
  ],
  TEACHER_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'teacherCode', label: 'Mã GV', width: '14%' },
    { key: 'teacher', label: 'Họ và tên', width: '26%' },
    { key: 'degree', label: 'Học vị', align: 'center', width: '16%' },
    { key: 'department', label: 'Khoa / Bộ môn', width: '22%' },
    { key: 'email', label: 'Email công vụ', width: '16%' },
  ],
  SUBJECT_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'subjectCode', label: 'Mã môn', width: '14%' },
    { key: 'subjectName', label: 'Tên môn học', width: '32%' },
    { key: 'credits', label: 'Số TC', align: 'center', width: '10%' },
    { key: 'department', label: 'Khoa phụ trách', width: '24%' },
    { key: 'examFormat', label: 'Hình thức thi', align: 'center', width: '14%' },
  ],
  EXAM_ROOM_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'roomCode', label: 'Mã phòng', width: '16%' },
    { key: 'roomName', label: 'Tên phòng thi', width: '26%' },
    { key: 'building', label: 'Tòa nhà', width: '20%' },
    { key: 'capacity', label: 'Sức chứa', align: 'center', width: '16%' },
    { key: 'maxCapacity', label: 'Tối đa', align: 'center', width: '16%' },
  ],
  EXAM_SUMMARY_REPORT: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'subject', label: 'Môn thi', width: '30%' },
    { key: 'totalStudents', label: 'Tổng thí sinh', align: 'center', width: '13%' },
    { key: 'attended', label: 'Dự thi', align: 'center', width: '11%' },
    { key: 'absent', label: 'Vắng', align: 'center', width: '10%' },
    { key: 'passRate', label: 'Tỷ lệ đạt (%)', align: 'center', width: '15%' },
    { key: 'avgScore', label: 'Điểm TB', align: 'center', width: '15%' },
  ],
  EXAM_ROOM_MINUTES: [
    { key: 'index', label: 'STT', align: 'center', width: '8%' },
    { key: 'item', label: 'Nội dung biên bản bàn giao', width: '52%' },
    { key: 'quantity', label: 'Số lượng', align: 'center', width: '20%' },
    { key: 'status', label: 'Tình trạng', align: 'center', width: '20%' },
  ],
  GRADE_APPEAL_MINUTES: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'studentCode', label: 'MSSV', width: '14%' },
    { key: 'student', label: 'Họ và tên thí sinh', width: '24%' },
    { key: 'subject', label: 'Môn phúc khảo', width: '20%' },
    { key: 'oldScore', label: 'Điểm cũ', align: 'center', width: '9%' },
    { key: 'newScore', label: 'Điểm mới', align: 'center', width: '9%' },
    { key: 'delta', label: 'Lệch', align: 'center', width: '8%' },
    { key: 'conclusion', label: 'Kết luận', align: 'center', width: '10%' },
  ],
  EXAM_SCORE_TRANSCRIPT: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'subjectCode', label: 'Mã môn', align: 'center', width: '14%' },
    { key: 'subjectName', label: 'Tên môn học', width: '30%' },
    { key: 'periodName', label: 'Kỳ thi', width: '20%' },
    { key: 'examDate', label: 'Ngày thi', align: 'center', width: '14%' },
    { key: 'examType', label: 'Hình thức', align: 'center', width: '16%' },
    { key: 'score', label: 'Điểm số', align: 'center', width: '12%' },
    { key: 'status', label: 'Kết quả', align: 'center', width: '14%' },
  ],
  DEPARTMENT_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'code', label: 'Mã khoa', width: '16%' },
    { key: 'name', label: 'Tên Khoa / Đơn vị đào tạo', width: '40%' },
    { key: 'classesCount', label: 'Số lớp sinh hoạt', align: 'center', width: '18%' },
    { key: 'teachersCount', label: 'Số giảng viên', align: 'center', width: '20%' },
  ],
  QUESTION_BANK_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '5%' },
    { key: 'code', label: 'Mã câu hỏi', width: '14%' },
    { key: 'subject', label: 'Môn học', width: '22%' },
    { key: 'content', label: 'Nội dung câu hỏi', width: '35%' },
    { key: 'type', label: 'Loại câu', align: 'center', width: '12%' },
    { key: 'difficulty', label: 'Mức độ', align: 'center', width: '12%' },
  ],
  EXAM_PERIOD_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'name', label: 'Tên kỳ thi học kỳ', width: '32%' },
    { key: 'semester', label: 'Học kỳ', align: 'center', width: '14%' },
    { key: 'schoolYear', label: 'Năm học', align: 'center', width: '16%' },
    { key: 'startDate', label: 'Ngày bắt đầu', align: 'center', width: '16%' },
    { key: 'endDate', label: 'Ngày kết thúc', align: 'center', width: '16%' },
  ],
  SYSTEM_AUDIT_LOG: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'time', label: 'Thời gian ghi nhận', align: 'center', width: '18%' },
    { key: 'actor', label: 'Tài khoản', width: '18%' },
    { key: 'action', label: 'Hành động', width: '20%' },
    { key: 'target', label: 'Đối tượng tác động', width: '18%' },
    { key: 'status', label: 'Trạng thái', align: 'center', width: '20%' },
  ],
  CLASS_DIRECTORY: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'code', label: 'Mã lớp', align: 'center', width: '16%' },
    { key: 'name', label: 'Tên lớp sinh hoạt', width: '34%' },
    { key: 'department', label: 'Khoa trực thuộc', width: '28%' },
    { key: 'studentsCount', label: 'Sĩ số', align: 'center', width: '16%' },
  ],
  STUDENT_CURRICULUM_REPORT: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'semester', label: 'Học kỳ', align: 'center', width: '12%' },
    { key: 'subjectCode', label: 'Mã HP', align: 'center', width: '14%' },
    { key: 'subjectName', label: 'Tên môn học', width: '36%' },
    { key: 'credits', label: 'Số TC', align: 'center', width: '10%' },
    { key: 'type', label: 'Khối kiến thức', align: 'center', width: '12%' },
    { key: 'status', label: 'Tình trạng', align: 'center', width: '10%' },
  ],
  EXAM_BAG_LABEL: [
    { key: 'index', label: 'STT', align: 'center', width: '10%' },
    { key: 'infoLabel', label: 'Thông tin niêm phong', width: '45%' },
    { key: 'infoValue', label: 'Chi tiết ca thi', width: '45%' },
  ],
  EXAM_INCIDENT_REPORT: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'studentCode', label: 'MSSV', width: '12%' },
    { key: 'student', label: 'Họ tên thí sinh vi phạm', width: '22%' },
    { key: 'class', label: 'Lớp', width: '10%' },
    { key: 'violation', label: 'Hành vi vi phạm quy chế', width: '30%' },
    { key: 'evidence', label: 'Tang vật / Minh chứng', width: '20%' },
  ],
  EXAM_SUPERVISOR_HANDOVER: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'item', label: 'Hạng mục bàn giao', width: '44%' },
    { key: 'expectedQty', label: 'Số lượng phát', align: 'center', width: '16%' },
    { key: 'receivedQty', label: 'Số lượng thu hồi', align: 'center', width: '16%' },
    { key: 'sealStatus', label: 'Tình trạng niêm phong', align: 'center', width: '18%' },
  ],
  EXAM_ARCHIVE_LIST: [
    { key: 'index', label: 'STT', align: 'center', width: '6%' },
    { key: 'studentCode', label: 'MSSV', align: 'center', width: '14%' },
    { key: 'fullName', label: 'Họ và tên thí sinh', width: '28%' },
    { key: 'className', label: 'Lớp', align: 'center', width: '14%' },
    { key: 'totalScore', label: 'Điểm', align: 'center', width: '10%' },
    { key: 'sealShort', label: 'Mã niêm phong', align: 'center', width: '14%' },
    { key: 'approvedBy', label: 'Cán bộ duyệt', width: '14%' },
  ],
  EXAM_ARCHIVE_DOSSIER: [
    { key: 'index', label: 'STT', align: 'center', width: '8%' },
    { key: 'item', label: 'Hạng mục hồ sơ lưu trữ', width: '36%' },
    { key: 'value', label: 'Chi tiết trích lục', width: '42%' },
    { key: 'note', label: 'Trạng thái kiểm định', align: 'center', width: '14%' },
  ],
  GENERIC_REPORT: [
    { key: 'index', label: 'STT', align: 'center', width: '10%' },
    { key: 'label', label: 'Nội dung', width: '60%' },
    { key: 'value', label: 'Giá trị', align: 'right', width: '30%' },
  ],
};

const sourceColumns: Record<DocumentTemplateDataSource, TemplateColumn[]> = {
  EXAM_SCHEDULE_LIST: templateCodeColumns.EXAM_SCHEDULE_LIST,
  ROOM_DOOR_LIST: templateCodeColumns.ROOM_DOOR_LIST,
  SUPERVISOR_ASSIGNMENT: templateCodeColumns.SUPERVISOR_ASSIGNMENT,
  GRADE_REPORT: templateCodeColumns.GRADE_REPORT,
  STUDENT_DIRECTORY: templateCodeColumns.STUDENT_DIRECTORY,
  TEACHER_DIRECTORY: templateCodeColumns.TEACHER_DIRECTORY,
  GENERIC_REPORT: templateCodeColumns.GENERIC_REPORT,
};

const defaults: Array<{ code: string; name: string; dataSource: DocumentTemplateDataSource; description: string }> = [
  // ── Nhóm 1: Đề thi & Tổ chức Phòng thi ──
  {
    code: 'EXAM_PAPER_OFFICIAL',
    name: 'Đề thi chính thức',
    dataSource: 'GENERIC_REPORT',
    description: 'Mẫu in đề thi chính thức kèm khung điểm, lời dặn quy chế và chữ ký duyệt đề.',
  },
  {
    code: 'EXAM_SCHEDULE_LIST',
    name: 'Lịch thi theo ca',
    dataSource: 'EXAM_SCHEDULE_LIST',
    description: 'Bảng tổng hợp lịch thi chi tiết theo ngày, ca thi, môn học và phòng thi.',
  },
  {
    code: 'ROOM_DOOR_LIST',
    name: 'Danh sách dán cửa phòng',
    dataSource: 'ROOM_DOOR_LIST',
    description: 'Bảng niêm phong dán tại cửa phòng để thí sinh tra cứu số báo danh, số ghế và phòng thi.',
  },
  {
    code: 'ROOM_ATTENDANCE_SHEET',
    name: 'Danh sách ký nộp bài thi',
    dataSource: 'ROOM_DOOR_LIST',
    description: 'Biểu mẫu phát cho giám thị để thí sinh ký tên nộp bài thi và điểm danh.',
  },
  {
    code: 'SUPERVISOR_ASSIGNMENT',
    name: 'Lịch phân công coi thi',
    dataSource: 'SUPERVISOR_ASSIGNMENT',
    description: 'Lịch phân công cán bộ coi thi 1, cán bộ coi thi 2 và giám sát theo từng ca thi.',
  },
  {
    code: 'EXAM_ROOM_MINUTES',
    name: 'Biên bản phòng thi',
    dataSource: 'GENERIC_REPORT',
    description: 'Biên bản phòng thi ghi nhận thí sinh vắng, số bài thi thu được và bàn giao bài thi.',
  },
  {
    code: 'EXAM_INCIDENT_REPORT',
    name: 'Biên bản vi phạm quy chế thi',
    dataSource: 'GENERIC_REPORT',
    description: 'Biên bản xử lý kỷ luật thí sinh vi phạm quy chế phòng thi kèm tang vật thu giữ.',
  },
  {
    code: 'EXAM_BAG_LABEL',
    name: 'Nhãn niêm phong túi bài thi (A5)',
    dataSource: 'GENERIC_REPORT',
    description: 'Nhãn dán niêm phong túi bài thi và túi đề thi khổ A5 ngang trước khi bàn giao.',
  },

  // ── Nhóm 2: Bàn giao, Khảo thí & Điểm số ──
  {
    code: 'GRADE_REPORT',
    name: 'Bảng điểm thi học phần',
    dataSource: 'GRADE_REPORT',
    description: 'Bảng điểm thi học phần kèm điểm quá trình, điểm thi, điểm tổng kết và chữ ký cán bộ chấm.',
  },
  {
    code: 'GRADE_APPEAL_MINUTES',
    name: 'Biên bản chấm phúc khảo',
    dataSource: 'GENERIC_REPORT',
    description: 'Biên bản làm việc của Hội đồng phúc khảo ghi nhận điểm gốc, điểm chấm lại và kết luận.',
  },
  {
    code: 'STUDENT_EXAM_PASS',
    name: 'Giấy báo dự thi',
    dataSource: 'STUDENT_DIRECTORY',
    description: 'Giấy báo dự thi cá nhân của sinh viên gồm lịch thi, ca thi, phòng thi và số báo danh.',
  },
  {
    code: 'EXAM_SCORE_TRANSCRIPT',
    name: 'Phiếu điểm học tập & thi học phần',
    dataSource: 'GRADE_REPORT',
    description: 'Phiếu điểm tổng hợp kết quả thi và tình trạng hoàn thành môn học của sinh viên.',
  },
  {
    code: 'EXAM_SUMMARY_REPORT',
    name: 'Báo cáo tổng kết khảo thí',
    dataSource: 'GENERIC_REPORT',
    description: 'Báo cáo tổng hợp số lượng thí sinh dự thi, tỷ lệ vắng, tỷ lệ đạt và điểm trung bình.',
  },
  {
    code: 'EXAM_SUPERVISOR_HANDOVER',
    name: 'Biên bản giao nhận hồ sơ coi thi',
    dataSource: 'GENERIC_REPORT',
    description: 'Biên bản giao nhận túi đề thi, phiếu thu bài và hồ sơ phòng thi giữa Khảo thí và Giám thị.',
  },

  // ── Nhóm 3: Danh bạ Đào tạo & Khảo thí ──
  {
    code: 'STUDENT_DIRECTORY',
    name: 'Danh sách sinh viên',
    dataSource: 'STUDENT_DIRECTORY',
    description: 'Bảng in danh sách sinh viên theo lớp, ngành học hoặc toàn khoa.',
  },
  {
    code: 'TEACHER_DIRECTORY',
    name: 'Danh sách giảng viên',
    dataSource: 'TEACHER_DIRECTORY',
    description: 'Bảng in danh sách cán bộ giảng viên theo khoa và học vị.',
  },
  {
    code: 'CLASS_DIRECTORY',
    name: 'Danh sách lớp sinh hoạt',
    dataSource: 'GENERIC_REPORT',
    description: 'Bảng in danh mục các lớp học sinh viên theo khoa quản lý và quy mô sĩ số.',
  },
  {
    code: 'STUDENT_CURRICULUM_REPORT',
    name: 'Khung chương trình đào tạo',
    dataSource: 'STUDENT_DIRECTORY',
    description: 'Khung chương trình đào tạo cá nhân theo học kỳ, số tín chỉ và tiến độ hoàn thành.',
  },
  {
    code: 'DEPARTMENT_DIRECTORY',
    name: 'Danh sách khoa đào tạo',
    dataSource: 'GENERIC_REPORT',
    description: 'Bảng danh mục các khoa đào tạo, viện và bộ môn chuyên ngành trực thuộc trường.',
  },
  {
    code: 'SUBJECT_DIRECTORY',
    name: 'Danh sách môn học',
    dataSource: 'GENERIC_REPORT',
    description: 'Bảng in danh mục môn học, mã học phần, số tín chỉ và khoa phụ trách.',
  },
  {
    code: 'EXAM_ROOM_DIRECTORY',
    name: 'Danh sách phòng thi',
    dataSource: 'GENERIC_REPORT',
    description: 'Bảng in danh mục phòng thi, tòa nhà và sức chứa máy tính.',
  },

  // ── Nhóm 4: Ngân hàng đề, Kỳ thi & Hệ thống ──
  {
    code: 'QUESTION_BANK_DIRECTORY',
    name: 'Ngân hàng câu hỏi thi',
    dataSource: 'GENERIC_REPORT',
    description: 'Bảng tổng hợp danh mục câu hỏi trắc nghiệm và tự luận phân theo môn học và độ khó.',
  },
  {
    code: 'EXAM_PERIOD_DIRECTORY',
    name: 'Danh sách kỳ thi học kỳ',
    dataSource: 'GENERIC_REPORT',
    description: 'Danh mục các đợt thi học kỳ, kế hoạch thời gian bắt đầu và kết thúc kỳ thi.',
  },
  {
    code: 'SYSTEM_AUDIT_LOG',
    name: 'Nhật ký hệ thống & An ninh',
    dataSource: 'GENERIC_REPORT',
    description: 'Báo cáo trích xuất nhật ký hoạt động, kiểm toán an ninh và danh sách bản sao lưu hệ thống.',
  },
  // ── Nhóm 5: Kho lưu trữ & Trích lục bài thi ──
  {
    code: 'EXAM_ARCHIVE_LIST',
    name: 'Danh sách bài thi lưu trữ niêm phong',
    dataSource: 'GRADE_REPORT',
    description: 'Bảng danh sách bài thi lưu trữ kèm mã băm niêm phong số SHA-256 sau khi công bố kết quả.',
  },
  {
    code: 'EXAM_ARCHIVE_DOSSIER',
    name: 'Hồ sơ trích lục bài thi lưu trữ',
    dataSource: 'GENERIC_REPORT',
    description: 'Biểu mẫu in trích lục hồ sơ bài thi đã niêm phong phục vụ kiểm định chất lượng và giải quyết phúc khảo.',
  },
];

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

@Injectable()
export class DocumentTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly accessPolicy: AccessPolicyService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async list() {
    await this.ensureDefaults();
    return this.prisma.documentTemplate.findMany({
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      orderBy: [{ dataSource: 'asc' }, { name: 'asc' }],
    });
  }

  async getPublishedTemplates() {
    await this.ensureDefaults();
    const templates = await this.prisma.documentTemplate.findMany({
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ dataSource: 'asc' }, { name: 'asc' }],
    });

    return templates.map((t) => {
      const activeVersion = t.versions[0];
      const config = (activeVersion?.config as Record<string, unknown>) || this.defaultConfig(t.dataSource, t.name, t.code);
      return {
        id: t.id,
        code: t.code,
        name: t.name,
        dataSource: t.dataSource,
        description: t.description,
        isDefault: t.isDefault,
        version: activeVersion?.version || 1,
        config: this.normalizeConfig(config, t.dataSource, t.name, t.code),
        updatedAt: t.updatedAt,
      };
    });
  }

  async get(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' } } },
    });
    if (!template) throw new NotFoundException('Không tìm thấy biểu mẫu.');
    return template;
  }

  getCatalog() {
    return Object.values(DocumentTemplateDataSource).map((dataSource) => ({
      dataSource,
      label: sourceLabel[dataSource],
      columns: sourceColumns[dataSource],
    }));
  }

  async create(actor: { id: number }, dto: CreateDocumentTemplateDto) {
    const code = dto.code.trim().toUpperCase();
    const config = this.normalizeConfig(dto.config, dto.dataSource, dto.name, code);
    const template = await this.prisma.$transaction(async (tx) => {
      const created = await tx.documentTemplate.create({
        data: {
          code,
          name: dto.name.trim(),
          dataSource: dto.dataSource,
          description: dto.description?.trim(),
          createdById: actor.id,
          updatedById: actor.id,
        },
      });
      await tx.documentTemplateVersion.create({
        data: {
          templateId: created.id,
          version: 1,
          status: 'DRAFT',
          config: config as Prisma.InputJsonValue,
          createdById: actor.id,
        },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'DOCUMENT_TEMPLATE_CREATED',
        entityType: 'DOCUMENT_TEMPLATE',
        entityId: created.id,
        description: `Đã tạo biểu mẫu ${created.name}.`,
        metadata: { code, dataSource: dto.dataSource },
      }, tx);
      return created;
    });
    return this.get(template.id);
  }

  async saveDraft(actor: { id: number }, id: string, dto: UpdateDocumentTemplateDto) {
    const template = await this.get(id);
    const latest = template.versions[0];
    const config = dto.config
      ? this.normalizeConfig(dto.config, template.dataSource, dto.name || template.name, template.code)
      : latest?.config;
    if (!config) throw new BadRequestException('Biểu mẫu chưa có cấu hình hợp lệ.');

    await this.prisma.$transaction(async (tx) => {
      await tx.documentTemplate.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description?.trim(),
          isDefault: dto.isDefault,
          updatedById: actor.id,
        },
      });
      if (dto.isDefault) {
        await tx.documentTemplate.updateMany({
          where: { dataSource: template.dataSource, id: { not: id } },
          data: { isDefault: false },
        });
      }
      const nextVersion = (latest?.version || 0) + 1;
      await tx.documentTemplateVersion.create({
        data: {
          templateId: id,
          version: nextVersion,
          status: 'DRAFT',
          config: config as Prisma.InputJsonValue,
          createdById: actor.id,
        },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'DOCUMENT_TEMPLATE_DRAFT_SAVED',
        entityType: 'DOCUMENT_TEMPLATE',
        entityId: id,
        description: `Đã lưu nháp phiên bản ${nextVersion} của biểu mẫu ${template.name}.`,
        metadata: { version: nextVersion },
      }, tx);
    });
    return this.get(id);
  }

  async publish(actor: { id: number }, id: string) {
    const template = await this.get(id);
    const draft = template.versions.find((item) => item.status === 'DRAFT') || template.versions[0];
    if (!draft) throw new BadRequestException('Chưa có phiên bản để phát hành.');

    await this.prisma.$transaction(async (tx) => {
      await tx.documentTemplateVersion.updateMany({
        where: { templateId: id, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' },
      });
      await tx.documentTemplateVersion.update({
        where: { id: draft.id },
        data: { status: 'PUBLISHED', publishedById: actor.id, publishedAt: new Date() },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'DOCUMENT_TEMPLATE_PUBLISHED',
        entityType: 'DOCUMENT_TEMPLATE',
        entityId: id,
        description: `Đã phát hành phiên bản ${draft.version} của biểu mẫu ${template.name}.`,
        metadata: { version: draft.version },
      }, tx);
    });
    return this.get(id);
  }

  async duplicate(actor: { id: number }, id: string) {
    const source = await this.get(id);
    const active = source.versions.find((item) => item.status === 'PUBLISHED') || source.versions[0];
    if (!active) throw new BadRequestException('Biểu mẫu nguồn chưa có cấu hình.');
    return this.create(actor, {
      code: `${source.code}_COPY_${Date.now()}`.slice(0, 64),
      name: `${source.name} - Bản sao`,
      dataSource: source.dataSource,
      description: source.description || undefined,
      config: active.config as Record<string, unknown>,
    });
  }

  async delete(actor: { id: number }, id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Không tìm thấy biểu mẫu cần xóa.');

    await this.prisma.$transaction(async (tx) => {
      await tx.documentTemplateVersion.deleteMany({
        where: { templateId: id },
      });
      await tx.documentTemplate.delete({
        where: { id },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'DOCUMENT_TEMPLATE_DELETED',
        entityType: 'DOCUMENT_TEMPLATE',
        entityId: id,
        description: `Đã xóa biểu mẫu ${template.name} (${template.code}).`,
      }, tx);
    });

    return { success: true, message: 'Đã xóa biểu mẫu thành công.' };
  }

  async render(code: string, actor: { id: number; role: string }, filters: Record<string, unknown> = {}) {
    await this.ensureDefaults();
    const template = await this.prisma.documentTemplate.findUnique({
      where: { code },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    if (!template) throw new NotFoundException('Không tìm thấy biểu mẫu được yêu cầu.');
    const version = template.versions[0];
    if (!version) throw new BadRequestException('Biểu mẫu chưa được phát hành.');

    const config = this.normalizeConfig(version.config as Record<string, unknown>, template.dataSource, template.name, template.code);
    const rows = await this.resolveRows(template.dataSource, actor, filters);

    await this.securityAudit.write({
      category: 'DATA_EXPORT',
      action: 'DOCUMENT_TEMPLATE_RENDERED',
      outcome: 'SUCCESS',
      actor,
      entityType: 'DOCUMENT_TEMPLATE',
      entityId: template.id,
      metadata: { code: template.code, version: version.version, dataSource: template.dataSource, rowCount: rows.length },
    });

    return {
      template: { code: template.code, name: template.name, version: version.version, dataSource: template.dataSource },
      html: this.toHtml(config, rows),
      rows: rows.length,
    };
  }

  private async ensureDefaults() {
    const validCodes = new Set(defaults.map((d) => d.code));

    // 1. Cập nhật hoặc tạo mới 14 mẫu cốt lõi chuẩn
    for (const item of defaults) {
      const existing = await this.prisma.documentTemplate.findUnique({ where: { code: item.code } });
      if (existing) {
        // Cập nhật lại tên và mô tả ngắn gọn nếu đã có trong DB
        if (existing.name !== item.name || existing.description !== item.description) {
          await this.prisma.documentTemplate.update({
            where: { id: existing.id },
            data: { name: item.name, description: item.description },
          });
        }
        continue;
      }
      const config = this.defaultConfig(item.dataSource, item.name, item.code);
      await this.prisma.documentTemplate.create({
        data: {
          ...item,
          isDefault: true,
          versions: {
            create: {
              version: 1,
              status: 'PUBLISHED',
              config: config as Prisma.InputJsonValue,
              publishedAt: new Date(),
            },
          },
        },
      });
    }

    // 2. Dọn dẹp các mẫu mặc định cũ không còn trong danh sách chuẩn
    const obsoleteTemplates = await this.prisma.documentTemplate.findMany({
      where: {
        isDefault: true,
        code: { notIn: Array.from(validCodes) },
      },
    });

    for (const obsolete of obsoleteTemplates) {
      await this.prisma.documentTemplateVersion.deleteMany({ where: { templateId: obsolete.id } });
      await this.prisma.documentTemplate.delete({ where: { id: obsolete.id } });
    }
  }

  private defaultConfig(dataSource: DocumentTemplateDataSource, name: string, code?: string): Required<TemplateConfig> {
    const isExamPaper = code === 'EXAM_PAPER_OFFICIAL' || name.toLowerCase().includes('đề thi');

    if (isExamPaper) {
      return {
        templateType: 'EXAM_PAPER',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'KHOA CÔNG NGHỆ THÔNG TIN',
          title: 'ĐỀ THI KẾT THÚC HỌC PHẦN',
          subtitle: 'Học kỳ 1 - Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {
          subjectName: 'Lập trình Web Nâng cao',
          subjectCode: 'IT4409',
          durationMinutes: 60,
          totalScore: 10,
          showScoreBox: true,
          showInstructions: true,
          instructionText: '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)',
        },
        columns: [],
        footer: {
          note: 'Đề thi gồm 02 trang. Thí sinh nộp lại đề thi cùng bài làm.',
          signers: [
            { title: 'CÁN BỘ RA ĐỀ', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG BỘ MÔN DUYỆT', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      };
    }

    const availableCols = (code && templateCodeColumns[code]) || sourceColumns[dataSource] || [];

    // Specific configurations per document type
    if (code === 'EXAM_BAG_LABEL') {
      return {
        templateType: 'TABLE',
        page: { size: 'A5', orientation: 'landscape', marginMm: 10 },
        header: {
          institutionName: 'HỘI ĐỒNG KHẢO THÍ & TUYỂN SINH',
          facultyName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          title: 'NHÃN NIÊM PHONG TÚI BÀI THI KẾT THÚC HỌC PHẦN',
          subtitle: 'Học kỳ 1 - Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Túi bài thi phải được niêm phong bằng tem chữ ký ngay tại phòng thi trước khi bàn giao.',
          signers: [
            { title: 'CÁN BỘ COI THI 1', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CÁN BỘ COI THI 2', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'THƯ KÝ TIẾP NHẬN', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      };
    }

    if (code === 'EXAM_ROOM_MINUTES') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'HỘI ĐỒNG KHẢO THÍ & ĐBCL',
          facultyName: 'PHÒNG QUẢN LÝ ĐÀO TẠO',
          title: 'BIÊN BẢN COI THI & BÀN GIAO TÚI BÀI THI',
          subtitle: 'Phòng thi: P.402 - Tòa A1 | Ca thi: 07:30 - 09:00',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, 01 bản lưu túi bài, 01 bản lưu phòng Khảo thí.',
          signers: [
            { title: 'CÁN BỘ COI THI 1', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CÁN BỘ COI THI 2', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG ĐIỂM THI', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      };
    }

    if (code === 'GRADE_APPEAL_MINUTES') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'HỘI ĐỒNG KHẢO THÍ & ĐBCL',
          facultyName: 'BAN CHẤM PHÚC KHẢO BÀI THI',
          title: 'BIÊN BẢN HỘI ĐỒNG CHẤM PHÚC KHẢO BÀI THI',
          subtitle: 'Kỳ thi Kết thúc học phần - Học kỳ 1',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Kết quả chấm phúc khảo là kết quả điểm thi chính thức cuối cùng của học phần.',
          signers: [
            { title: 'CÁN BỘ CHẤM LẠI 1', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CÁN BỘ CHẤM LẠI 2', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CHỦ TỊCH HỘI ĐỒNG PHÚC KHẢO', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      };
    }

    if (code === 'STUDENT_EXAM_PASS') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
          title: 'THẺ DỰ THI & GIẤY BÁO DỰ THI KỲ THI KẾT THÚC HỌC PHẦN',
          subtitle: 'Thí sinh: Nguyễn Văn An | MSSV: SV20260001 | Lớp: CNTT-K68',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Lưu ý: Thí sinh phải mang theo Thẻ sinh viên hoặc CCCD/CMND khi vào phòng thi và có mặt trước giờ thi 15 phút.',
          signers: [
            { title: 'THÍ SINH XÁC NHẬN', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG ĐÀO TẠO', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'EXAM_SCORE_TRANSCRIPT') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
          title: 'PHIẾU ĐIỂM HỌC TẬP & THI HỌC PHẦN',
          subtitle: 'Sinh viên: Nguyễn Văn An (SV20260001), Lớp: CNTT-K68A, Khoa: Công nghệ Thông tin',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Bảng điểm có giá trị xác nhận kết quả học tập và thi kết thúc học phần của sinh viên.',
          signers: [
            { title: 'SINH VIÊN XÁC NHẬN', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG ĐÀO TẠO', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'DEPARTMENT_DIRECTORY') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG TỔ CHỨC CÁN BỘ & ĐÀO TẠO',
          title: 'DANH SÁCH KHOA ĐÀO TẠO & VIỆN CHUYÊN NGÀNH',
          subtitle: 'Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Danh mục đơn vị đào tạo chính thức được ban hành theo quyết định của Ban Giám hiệu.',
          signers: [
            { title: 'NGƯỜI LẬP BẢNG', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG TỔ CHỨC CÁN BỘ', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'QUESTION_BANK_DIRECTORY') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'HỘI ĐỒNG KHẢO THÍ & ĐBCL',
          title: 'NGÂN HÀNG CÂU HỎI THI KẾT THÚC HỌC PHẦN',
          subtitle: 'Kho lưu trữ đề thi và câu hỏi chuẩn hóa',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Tài liệu mật phục vụ công tác khảo thí. Nghiêm cấm sao chép và phát tán ra ngoài.',
          signers: [
            { title: 'CÁN BỘ QUẢN LÝ NGÂN HÀNG', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CHỦ TỊCH HỘI ĐỒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'EXAM_PERIOD_DIRECTORY') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
          title: 'KẾ HOẠCH TỔ CHỨC CÁC KỲ THI HỌC KỲ',
          subtitle: 'Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Kế hoạch kỳ thi là căn cứ để các Khoa và Bộ môn triển khai ra đề và chuẩn bị thi.',
          signers: [
            { title: 'NGƯỜI LẬP KẾ HOẠCH', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG ĐÀO TẠO', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'SYSTEM_AUDIT_LOG') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'TRUNG TÂM CÔNG NGHỆ THÔNG TIN',
          title: 'BÁO CÁO KIỂM TOÁN VÀ NHẬT KÝ HỆ THỐNG',
          subtitle: 'Hệ thống Quản lý Khảo thí & Khóa an toàn',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Nhật ký được ký số và xác thực chuỗi toàn vẹn mật mã SHA-256.',
          signers: [
            { title: 'QUẢN TRỊ VIÊN HỆ THỐNG', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'GIÁM ĐỐC TRUNG TÂM CNTT', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'EXAM_ARCHIVE_LIST') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 12 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG KHẢO THÍ & ĐBCL',
          title: 'DANH SÁCH BÀI THI LƯU TRỮ ĐÃ NIÊM PHONG',
          subtitle: 'Kỳ thi Kết thúc học phần – Lưu trữ đào tạo chính quy',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Danh sách bài thi đã được chốt điểm chính thức và niêm phong số bằng thuật toán SHA-256 theo quy chế Bộ GD&ĐT.',
          signers: [
            { title: 'CÁN BỘ CHẤM THI', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu xác nhận)' },
          ],
        },
      };
    }

    if (code === 'EXAM_ARCHIVE_DOSSIER') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 12 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG KHẢO THÍ & ĐBCL',
          title: 'HỒ SƠ LƯU TRỮ BÀI THI KẾT THÚC HỌC PHẦN',
          subtitle: '(Bản trích lục niêm phong lưu trữ đào tạo)',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Hồ sơ lưu trữ điện tử chính quy. Bất kỳ sự thay đổi dữ liệu nào đều sẽ làm sai lệch mã băm niêm phong số.',
          signers: [
            { title: 'CÁN BỘ CHẤM THI', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG KHẢO THÍ & ĐBCL', subtitle: '(Ký, đóng dấu lưu trữ)' },
          ],
        },
      };
    }

    if (code === 'EXAM_SUMMARY_REPORT' || code === 'GRADE_DISTRIBUTION_REPORT') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG KHẢO THÍ & ĐẢM BẢO CHẤT LƯỢNG',
          title: name.toUpperCase(),
          subtitle: 'Kỳ thi Học kỳ 1 - Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Báo cáo được trích xuất tự động và lưu trữ tại Cơ sở dữ liệu Khảo thí trường.',
          signers: [
            { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'BAN GIÁM HIỆU PHÊ DUYỆT', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'EXAM_INCIDENT_REPORT') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'HỘI ĐỒNG KHẢO THÍ & ĐBCL',
          facultyName: 'BAN THANH TRA & XỬ LÝ KỶ LUẬT PHÒNG THI',
          title: 'BIÊN BẢN XỬ LÝ VI PHẠM QUY CHẾ THI',
          subtitle: 'Kỳ thi Kết thúc học phần - Học kỳ 1',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Biên bản được lập ngay khi phát hiện vi phạm, có chữ ký của thí sinh và các cán bộ coi thi trong phòng.',
          signers: [
            { title: 'THÍ SINH VI PHẠM', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CÁN BỘ COI THI 1', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG ĐIỂM THI', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'EXAM_SUPERVISOR_HANDOVER') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'HỘI ĐỒNG KHẢO THÍ & ĐBCL',
          facultyName: 'PHÒNG QUẢN LÝ KHẢO THÍ & ĐÀO TẠO',
          title: 'BIÊN BẢN GIAO NHẬN ĐỀ THI & HỒ SƠ COI THI',
          subtitle: 'Kỳ thi Học kỳ 1 - Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Hai bên đã kiểm tra đầy đủ số lượng túi đề còn nguyên niêm phong và danh sách điểm danh trước ca thi.',
          signers: [
            { title: 'CÁN BỘ BÀN GIAO (KHẢO THÍ)', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CÁN BỘ NHẬN (GIÁM THỊ)', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG ĐIỂM THI', subtitle: '(Ký, xác nhận)' },
          ],
        },
      };
    }

    if (code === 'CLASS_DIRECTORY') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG ĐÀO TẠO & CÔNG TÁC SINH VIÊN',
          title: 'DANH SÁCH LỚP HỌC & SĨ SỐ SINH VIÊN',
          subtitle: 'Năm học 2025 - 2026',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Dữ liệu được trích xuất từ Hệ thống Quản trị Đào tạo & Khảo thí.',
          signers: [
            { title: 'NGƯỜI LẬP BẢNG', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG ĐÀO TẠO', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    if (code === 'STUDENT_CURRICULUM_REPORT') {
      return {
        templateType: 'TABLE',
        page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
        header: {
          institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
          facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
          title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO CÁ NHÂN',
          subtitle: 'Sinh viên: Nguyễn Văn An (SV20260001), Lớp: CNTT-K68A, Khoa: Công nghệ Thông tin',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        examInfo: {},
        columns: availableCols,
        footer: {
          note: 'Khung chương trình đào tạo tích lũy dùng để đối chiếu xét điều kiện tốt nghiệp và dự thi học phần.',
          signers: [
            { title: 'SINH VIÊN XÁC NHẬN', subtitle: '(Ký và ghi rõ họ tên)' },
            { title: 'TRƯỞNG PHÒNG ĐÀO TẠO', subtitle: '(Ký, đóng dấu)' },
          ],
        },
      };
    }

    return {
      templateType: 'TABLE',
      page: { size: 'A4', orientation: 'portrait', marginMm: 15 },
      header: {
        institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
        facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
        title: name.toUpperCase(),
        subtitle: 'Dữ liệu học vụ và khảo thí năm học 2025 - 2026',
        motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
      },
      examInfo: {},
      columns: availableCols,
      footer: {
        note: 'Dữ liệu được xuất từ Hệ thống Quản lý Khảo thí.',
        signers: [
          { title: 'NGƯỜI LẬP BẢNG', subtitle: '(Ký, ghi rõ họ tên)' },
          { title: 'TRƯỞNG ĐƠN VỊ PHỤ TRÁCH', subtitle: '(Ký, ghi rõ họ tên)' },
        ],
      },
    };
  }

  private normalizeConfig(
    raw: Record<string, unknown>,
    source: DocumentTemplateDataSource,
    fallbackName: string,
    code?: string,
  ): Required<TemplateConfig> {
    const base = this.defaultConfig(source, fallbackName, code);
    const input = raw as TemplateConfig;
    const isExamPaper = base.templateType === 'EXAM_PAPER' || input.templateType === 'EXAM_PAPER' || code === 'EXAM_PAPER_OFFICIAL';

    let columns: TemplateColumn[] = [];
    if (!isExamPaper) {
      const allowedDefs = (code && templateCodeColumns[code]) || sourceColumns[source] || [];
      const validKeys = new Set(allowedDefs.map((column) => column.key));
      columns = Array.isArray(input.columns)
        ? input.columns
            .filter((column) => column && validKeys.has(column.key))
            .map((column) => ({
              ...(allowedDefs.find((item) => item.key === column.key) || { key: column.key, label: column.label }),
              label: String(column.label || allowedDefs.find((item) => item.key === column.key)?.label || column.key).slice(0, 80),
              align: ['left', 'center', 'right'].includes(column.align || '') ? column.align : undefined,
              width: typeof column.width === 'string' ? column.width.slice(0, 12) : undefined,
              visible: column.visible !== false,
            }))
        : base.columns;

      if (!columns.some((column) => column.visible !== false)) {
        columns = base.columns;
      }
    }

    const page = input.page || {};
    const margin = Number(page.marginMm);

    return {
      templateType: isExamPaper ? 'EXAM_PAPER' : 'TABLE',
      page: {
        size: page.size === 'A5' ? 'A5' : 'A4',
        orientation: page.orientation === 'landscape' ? 'landscape' : 'portrait',
        marginMm: Number.isFinite(margin) && margin >= 5 && margin <= 30 ? margin : base.page.marginMm,
      },
      header: {
        institutionName: String(input.header?.institutionName || base.header.institutionName).slice(0, 160),
        facultyName: String(input.header?.facultyName ?? base.header.facultyName ?? '').slice(0, 160),
        title: String(input.header?.title || fallbackName).slice(0, 160),
        subtitle: String(input.header?.subtitle || '').slice(0, 240),
        motto: String(input.header?.motto || base.header.motto || '').slice(0, 200),
      },
      examInfo: {
        subjectName: String(input.examInfo?.subjectName || base.examInfo?.subjectName || 'Môn học khảo thí').slice(0, 120),
        subjectCode: String(input.examInfo?.subjectCode || base.examInfo?.subjectCode || 'Mã HP').slice(0, 30),
        durationMinutes: Number(input.examInfo?.durationMinutes || base.examInfo?.durationMinutes || 60),
        totalScore: Number(input.examInfo?.totalScore || base.examInfo?.totalScore || 10),
        showScoreBox: input.examInfo?.showScoreBox !== false,
        showInstructions: input.examInfo?.showInstructions !== false,
        instructionText: String(input.examInfo?.instructionText || base.examInfo?.instructionText || '').slice(0, 300),
      },
      columns,
      footer: {
        note: String(input.footer?.note || '').slice(0, 500),
        signers: Array.isArray(input.footer?.signers) && input.footer!.signers!.length
          ? input.footer!.signers!.slice(0, 4).map((signer) => ({
              title: String(signer.title || '').slice(0, 100),
              subtitle: String(signer.subtitle || '').slice(0, 120),
            }))
          : base.footer.signers,
      },
    };
  }

  private async resolveRows(source: DocumentTemplateDataSource, actor: { id: number; role: string }, filters: Record<string, unknown>) {
    const date = (value: Date) => new Intl.DateTimeFormat('vi-VN').format(value);
    const scheduleWhere: any = { deletedAt: null, mode: 'OFFICIAL' };
    if (filters.examPeriodId) scheduleWhere.examPeriodId = Number(filters.examPeriodId);
    if (actor.role === 'TEACHER') {
      const subjectIds = await this.accessPolicy.allowedSubjectIds(actor);
      const restrictions: any[] = [{ examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } }];
      if (subjectIds !== null) restrictions.push({ subjectId: { in: subjectIds } });
      scheduleWhere.AND = restrictions;
    }

    if (source === 'EXAM_SCHEDULE_LIST') {
      const items = await this.prisma.examSchedule.findMany({
        where: scheduleWhere,
        include: { examPeriod: true, subject: true, examScheduleRooms: { include: { room: true } } },
        orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
      });
      return items.map((item, index) => ({
        index: index + 1,
        period: item.examPeriod.name,
        subject: `${item.subject.subjectCode} - ${item.subject.subjectName}`,
        date: date(item.examDate),
        time: `${item.startTime} - ${item.endTime}`,
        rooms: item.examScheduleRooms.map((entry) => entry.room.roomCode).join(', ') || 'Chưa xếp phòng',
      }));
    }

    if (source === 'ROOM_DOOR_LIST') {
      const items = await this.prisma.examScheduleRoom.findMany({
        where: { examSchedule: scheduleWhere },
        include: { room: true, examSchedule: { include: { subject: true } }, _count: { select: { examRoomStudents: true } } },
        orderBy: { id: 'asc' },
      });
      return items.map((item, index) => ({
        index: index + 1,
        room: item.room.roomCode,
        subject: `${item.examSchedule.subject.subjectCode} - ${item.examSchedule.subject.subjectName}`,
        date: date(item.examSchedule.examDate),
        time: `${item.examSchedule.startTime} - ${item.examSchedule.endTime}`,
        students: item._count.examRoomStudents,
      }));
    }

    if (source === 'SUPERVISOR_ASSIGNMENT') {
      const supervisorWhere: Prisma.ExamSupervisorWhereInput = {};
      if (filters.examScheduleId) {
        supervisorWhere.examScheduleRoom = { examScheduleId: Number(filters.examScheduleId) };
      }
      if (actor.role === 'TEACHER') {
        supervisorWhere.teacher = { userId: actor.id };
      }
      const items = await this.prisma.examSupervisor.findMany({
        where: supervisorWhere,
        include: { teacher: true, examScheduleRoom: { include: { room: true, examSchedule: { include: { subject: true } } } } },
        orderBy: { id: 'asc' },
      });
      return items.map((item, index) => ({
        index: index + 1,
        teacher: `${item.teacher.teacherCode} - ${item.teacher.fullName}`,
        subject: `${item.examScheduleRoom.examSchedule.subject.subjectCode} - ${item.examScheduleRoom.examSchedule.subject.subjectName}`,
        room: item.examScheduleRoom.room.roomCode,
        date: date(item.examScheduleRoom.examSchedule.examDate),
        role: item.role,
      }));
    }

    if (source === 'STUDENT_DIRECTORY') {
      const items = await this.prisma.student.findMany({ include: { class: true }, orderBy: { studentCode: 'asc' } });
      return items.map((item, index) => ({
        index: index + 1,
        studentCode: item.studentCode,
        student: item.fullName,
        class: item.class.name,
        email: item.email,
      }));
    }

    if (source === 'TEACHER_DIRECTORY') {
      const items = await this.prisma.teacher.findMany({ include: { department: true }, orderBy: { teacherCode: 'asc' } });
      return items.map((item, index) => ({
        index: index + 1,
        teacherCode: item.teacherCode,
        teacher: item.fullName,
        department: item.department.name,
        email: item.email,
      }));
    }

    if (source === 'GRADE_REPORT') {
      const items = await this.prisma.examAttempt.findMany({
        where: { mode: 'OFFICIAL', onlineExamConfig: { examSchedule: scheduleWhere } },
        include: { student: true, onlineExamConfig: { include: { examSchedule: { include: { subject: true } } } } },
        orderBy: [{ student: { studentCode: 'asc' } }, { attemptNumber: 'asc' }],
      });
      return items.map((item, index) => ({
        index: index + 1,
        studentCode: item.student.studentCode,
        student: item.student.fullName,
        subject: `${item.onlineExamConfig.examSchedule.subject.subjectCode} - ${item.onlineExamConfig.examSchedule.subject.subjectName}`,
        score: item.totalScore == null ? 'Chưa có điểm' : item.totalScore,
        status: item.publishedAt ? 'Đã công bố' : item.gradingStatus === 'PUBLISHED' ? 'Đã duyệt' : 'Chưa công bố',
      }));
    }

    return [
      { index: 1, label: 'Thời điểm lập báo cáo', value: new Date().toLocaleString('vi-VN') },
      { index: 2, label: 'Người yêu cầu', value: actor.role },
    ];
  }

  private toHtml(config: Required<TemplateConfig>, rows: Array<Record<string, unknown>>) {
    if (config.templateType === 'EXAM_PAPER') {
      const signers = config.footer.signers.map((signer) => `<td><strong>${escapeHtml(signer.title)}</strong><em>${escapeHtml(signer.subtitle || '')}</em></td>`).join('');
      return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(config.header.title)}</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;color:#000000;margin:0}.document{padding:${config.page.marginMm}mm}.header-table{width:100%;border-collapse:collapse;margin-bottom:12px}.header-table td{vertical-align:top;border:none}.inst-box{text-align:center;font-size:11pt;font-weight:bold}.motto-box{text-align:center;font-size:11pt;font-weight:bold}.title{text-align:center;font-size:16pt;font-weight:bold;text-transform:uppercase;margin:10px 0 4px}.subtitle{text-align:center;font-style:italic;margin-bottom:12px}.score-table{width:100%;border-collapse:collapse;margin:12px 0;table-layout:fixed}.score-table th,.score-table td{border:1px solid #000000;padding:6px 8px;text-align:center}.question{margin:14px 0}.q-title{font-weight:bold;margin-bottom:6px}.options{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding-left:14px}.note{margin-top:14px;font-style:italic}.signers{width:100%;margin-top:34px;table-layout:fixed;page-break-inside:avoid}.signers td{text-align:center;vertical-align:top;width:${100 / (config.footer.signers.length || 1)}%}.signers em{display:block;margin-top:6px;min-height:50px}@page{size:${config.page.size} ${config.page.orientation};margin:0}@media print{.document{padding:${config.page.marginMm}mm}}</style></head><body><main class="document"><table class="header-table"><tr><td style="width:50%" class="inst-box"><div>${escapeHtml(config.header.institutionName)}</div><div style="font-weight:normal;margin-top:4px">${escapeHtml(config.header.facultyName)}</div><div style="font-weight:bold;margin-top:6px;border-top:1px solid #000000;display:inline-block;padding-top:2px;width:120px"></div></td><td style="width:50%" class="motto-box"><div>${escapeHtml(config.header.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div><div style="font-weight:bold;margin-top:4px;font-style:italic">Độc lập - Tự do - Hạnh phúc</div><div style="border-top:1px solid #000000;display:inline-block;padding-top:2px;width:120px"></div></td></tr></table><h1 class="title">${escapeHtml(config.header.title)}</h1>${config.header.subtitle ? `<div class="subtitle">${escapeHtml(config.header.subtitle)}</div>` : ''}<div style="text-align:center;margin-bottom:12px"><strong>Môn thi:</strong> ${escapeHtml(config.examInfo?.subjectName || 'Lập trình Web Nâng cao')} &nbsp;|&nbsp; <strong>Mã HP:</strong> ${escapeHtml(config.examInfo?.subjectCode || 'IT4409')} &nbsp;|&nbsp; <strong>Thời gian:</strong> ${config.examInfo?.durationMinutes || 60} phút</div>${config.examInfo?.showInstructions ? `<div style="text-align:center;font-style:italic;font-size:10.5pt;margin-bottom:10px">${escapeHtml(config.examInfo?.instructionText || '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)')}</div>` : ''}${config.examInfo?.showScoreBox ? `<table class="score-table"><tr><th style="width:25%">Điểm bằng số</th><th style="width:25%">Điểm bằng chữ</th><th style="width:25%">Chữ ký CB chấm 1</th><th style="width:25%">Chữ ký CB chấm 2</th></tr><tr style="height:48px"><td></td><td></td><td></td><td></td></tr></table>` : ''}<div class="question"><div class="q-title">Câu 1 (2.0 điểm): Trình bày sự khác biệt giữa Server-Side Rendering (SSR) và Client-Side Rendering (CSR).</div><div style="min-height:70px;border-bottom:1px dashed #000000;margin-bottom:10px"></div></div><div class="question"><div class="q-title">Câu 2 (3.0 điểm): Cho biết kết quả của đoạn mã JavaScript và giải thích cơ chế Event Loop.</div><div class="options"><div><strong>A.</strong> Đơn luồng không chặn (Non-blocking I/O)</div><div><strong>B.</strong> Đa luồng song song thực thụ</div><div><strong>C.</strong> Đồng bộ tuyệt đối theo thứ tự</div><div><strong>D.</strong> Tất cả các phương án trên đều sai</div></div></div><div class="question"><div class="q-title">Câu 3 (5.0 điểm): Thiết kế kiến trúc cơ sở dữ liệu cho hệ thống khảo thí hỗ trợ phân quyền RBAC và ghi vết bảo mật.</div><div style="min-height:90px;border-bottom:1px dashed #000000;margin-bottom:10px"></div></div>${config.footer.note ? `<p class="note">${escapeHtml(config.footer.note)}</p>` : ''}<table class="signers"><tr>${signers}</tr></table></main></body></html>`;
    }

    const columns = config.columns.filter((column) => column.visible !== false);
    const head = columns.map((column) => `<th style="text-align:${column.align || 'center'};${column.width ? `width:${escapeHtml(column.width)};` : ''}">${escapeHtml(column.label)}</th>`).join('');
    const body = rows.map((row) => `<tr>${columns.map((column) => `<td style="text-align:${column.align || (column.key === 'index' ? 'center' : 'left')}">${escapeHtml(row[column.key])}</td>`).join('')}</tr>`).join('');
    const signers = config.footer.signers.map((signer) => `<td><strong>${escapeHtml(signer.title)}</strong><em>${escapeHtml(signer.subtitle || '')}</em></td>`).join('');
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(config.header.title)}</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;color:#000000;margin:0}.document{padding:${config.page.marginMm}mm}.header-table{width:100%;border-collapse:collapse;margin-bottom:14px;table-layout:fixed}.header-table td{vertical-align:top;border:none}.inst-box{text-align:center;font-size:11pt;font-weight:bold}.motto-box{text-align:center;font-size:11pt;font-weight:bold}.title{text-align:center;font-size:15pt;font-weight:bold;text-transform:uppercase;margin:12px 0 4px}.subtitle{text-align:center;font-style:italic;margin-bottom:14px;font-size:11pt}.data{width:100%;border-collapse:collapse;table-layout:fixed;page-break-inside:auto}.data thead{display:table-header-group}.data tr{page-break-inside:avoid;page-break-after:auto}.data th{background:transparent;font-weight:bold;color:#000000;border:1px solid #000000;padding:6px 8px;font-size:11pt}.data td{border:1px solid #000000;padding:6px 8px;font-size:11pt;color:#000000;word-break:break-word}.note{margin-top:12px;font-style:italic;font-size:10.5pt}.signers{width:100%;margin-top:34px;table-layout:fixed;page-break-inside:avoid}.signers td{text-align:center;vertical-align:top;width:${100 / (config.footer.signers.length || 1)}%}.signers em{display:block;margin-top:6px;min-height:55px;font-style:italic;font-size:10.5pt}@page{size:${config.page.size} ${config.page.orientation};margin:0}@media print{.document{padding:${config.page.marginMm}mm}}</style></head><body><main class="document"><table class="header-table"><tr><td style="width:50%" class="inst-box"><div>${escapeHtml(config.header.institutionName)}</div>${config.header.facultyName ? `<div style="font-weight:normal;margin-top:3px">${escapeHtml(config.header.facultyName)}</div>` : ''}<div style="border-top:1px solid #000000;display:inline-block;padding-top:2px;width:110px;margin-top:5px"></div></td><td style="width:50%" class="motto-box"><div>${escapeHtml(config.header.motto || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')}</div><div style="font-weight:bold;margin-top:3px;font-style:italic">Độc lập - Tự do - Hạnh phúc</div><div style="border-top:1px solid #000000;display:inline-block;padding-top:2px;width:110px;margin-top:5px"></div></td></tr></table><h1 class="title">${escapeHtml(config.header.title)}</h1>${config.header.subtitle ? `<div class="subtitle">${escapeHtml(config.header.subtitle)}</div>` : ''}<table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${config.footer.note ? `<p class="note">${escapeHtml(config.footer.note)}</p>` : ''}<table class="signers"><tr>${signers}</tr></table></main></body></html>`;
  }
}
