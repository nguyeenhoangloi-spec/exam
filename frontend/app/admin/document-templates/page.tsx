'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Edit2,
  MoveUp,
  MoveDown,
  Calculator,
  RotateCcw,
  Upload,
} from 'lucide-react';
import api, { getCachedData } from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { SlidingSegmentedControl } from '../../../components/ui/SlidingSegmentedControl';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { printReport, printExamPaper } from '../../../lib/export-print';
import { PageSkeleton } from '../../../components/ui/Skeleton';
import { DynamicImage } from '../../../components/ui/DynamicImage';
import { DEFAULT_DNC_LOGO_DATA_URL } from '../../../lib/school-logo';

type DataSource =
  | 'EXAM_SCHEDULE_LIST'
  | 'ROOM_DOOR_LIST'
  | 'SUPERVISOR_ASSIGNMENT'
  | 'GRADE_REPORT'
  | 'STUDENT_DIRECTORY'
  | 'TEACHER_DIRECTORY'
  | 'GENERIC_REPORT';

type TemplateType = 'TABLE' | 'EXAM_PAPER';

type Column = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  width?: string;
  visible: boolean;
  type?: 'FIELD' | 'FORMULA';
  formula?: string;
  decimals?: number;
};

type Config = {
  templateType?: TemplateType;
  page: {
    size: 'A4' | 'A5';
    orientation: 'portrait' | 'landscape';
    marginMm: number;
  };
  header: {
    logoUrl?: string;
    showLogo?: boolean;
    institutionName: string;
    facultyName?: string;
    title: string;
    subtitle: string;
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
    essayHeaderMode?: 'STANDARD' | 'ANONYMIZED_CUT';
    duplexPrinting?: boolean;
    phachCodePrefix?: string;
  };
  columns: Column[];
  footer: {
    note: string;
    signers: Array<{ title: string; subtitle?: string }>;
  };
};

type Version = {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  config: Config;
  publishedAt?: string | null;
};

type Template = {
  id: string;
  code: string;
  name: string;
  dataSource: DataSource;
  description?: string | null;
  isDefault: boolean;
  updatedAt: string;
  versions: Version[];
};

const sourceLabels: Record<DataSource, string> = {
  EXAM_SCHEDULE_LIST: 'Danh sách lịch thi',
  ROOM_DOOR_LIST: 'Danh sách dán cửa',
  SUPERVISOR_ASSIGNMENT: 'Phân công coi thi',
  GRADE_REPORT: 'Bảng điểm ca thi',
  STUDENT_DIRECTORY: 'Danh sách sinh viên',
  TEACHER_DIRECTORY: 'Danh sách giảng viên',
  GENERIC_REPORT: 'Báo cáo & Đề thi',
};

const sampleRowsBySource: Record<DataSource, Array<Record<string, any>>> = {
  EXAM_SCHEDULE_LIST: [
    { index: 1, period: 'Học kỳ 1 (2025-2026)', subject: 'IT4409 - Lập trình Web', date: '15/12/2025', time: '07:30 - 09:00', rooms: 'P.301, P.302' },
    { index: 2, period: 'Học kỳ 1 (2025-2026)', subject: 'IT3080 - Mạng máy tính', date: '16/12/2025', time: '09:30 - 11:00', rooms: 'P.405' },
    { index: 3, period: 'Học kỳ 1 (2025-2026)', subject: 'IT2000 - Cấu trúc dữ liệu', date: '18/12/2025', time: '13:30 - 15:00', rooms: 'P.201, P.202, P.203' },
    { index: 4, period: 'Học kỳ 1 (2025-2026)', subject: 'MA1110 - Giải tích 1', date: '20/12/2025', time: '07:30 - 09:30', rooms: 'Hội trường C2' },
  ],
  ROOM_DOOR_LIST: [
    { index: 1, examNumber: 'SBD-001', studentCode: 'SV20260001', student: 'Nguyễn Văn An', fullName: 'Nguyễn Văn An', dob: '12/05/2004', class: 'CNTT-K68A', className: 'CNTT-K68A', seatNumber: 1 },
    { index: 2, examNumber: 'SBD-002', studentCode: 'SV20260002', student: 'Trần Thị Bình', fullName: 'Trần Thị Bình', dob: '24/08/2004', class: 'CNTT-K68A', className: 'CNTT-K68A', seatNumber: 2 },
    { index: 3, examNumber: 'SBD-003', studentCode: 'SV20260003', student: 'Lê Hoàng Cường', fullName: 'Lê Hoàng Cường', dob: '03/11/2004', class: 'CNTT-K68B', className: 'CNTT-K68B', seatNumber: 3 },
    { index: 4, examNumber: 'SBD-004', studentCode: 'SV20260004', student: 'Phạm Minh Đức', fullName: 'Phạm Minh Đức', dob: '19/02/2004', class: 'CNTT-K68B', className: 'CNTT-K68B', seatNumber: 4 },
  ],
  SUPERVISOR_ASSIGNMENT: [
    { index: 1, teacher: 'TS. Trần Hải', department: 'Công nghệ phần mềm', subject: 'Lập trình Web Nâng cao', room: 'P.301 - B1', date: '15/12/2025', role: 'Giám thị 1' },
    { index: 2, teacher: 'ThS. Lê Thu Hà', department: 'Hệ thống thông tin', subject: 'Lập trình Web Nâng cao', room: 'P.301 - B1', date: '15/12/2025', role: 'Giám thị 2' },
    { index: 3, teacher: 'PGS.TS Nguyễn Văn A', department: 'Khoa học máy tính', subject: 'Mạng máy tính', room: 'P.405 - D3', date: '16/12/2025', role: 'Trưởng điểm' },
  ],
  GRADE_REPORT: [
    { index: 1, studentCode: 'SV20260001', student: 'Nguyễn Văn An', fullName: 'Nguyễn Văn An', class: 'CNTT-K68A', className: 'CNTT-K68A', midScore: 8.5, examScore: 9.0, finalScore: 8.8, totalScore: 8.8, letterGrade: 'A', status: 'Đạt' },
    { index: 2, studentCode: 'SV20260002', student: 'Trần Thị Bình', fullName: 'Trần Thị Bình', class: 'CNTT-K68A', className: 'CNTT-K68A', midScore: 7.0, examScore: 8.0, finalScore: 7.6, totalScore: 7.6, letterGrade: 'B+', status: 'Đạt' },
    { index: 3, studentCode: 'SV20260003', student: 'Lê Hoàng Cường', fullName: 'Lê Hoàng Cường', class: 'CNTT-K68B', className: 'CNTT-K68B', midScore: 6.0, examScore: 6.5, finalScore: 6.3, totalScore: 6.3, letterGrade: 'C', status: 'Đạt' },
    { index: 4, studentCode: 'SV20260004', student: 'Phạm Minh Đức', fullName: 'Phạm Minh Đức', class: 'CNTT-K68B', className: 'CNTT-K68B', midScore: 4.0, examScore: 3.0, finalScore: 3.4, totalScore: 3.4, letterGrade: 'F', status: 'Học lại' },
  ],
  STUDENT_DIRECTORY: [
    { index: 1, studentCode: 'SV20260001', student: 'Nguyễn Văn An', fullName: 'Nguyễn Văn An', dob: '12/05/2004', class: 'CNTT-K68A', className: 'CNTT-K68A', department: 'Khoa Công nghệ Thông tin' },
    { index: 2, studentCode: 'SV20260002', student: 'Trần Thị Bình', fullName: 'Trần Thị Bình', dob: '24/08/2004', class: 'CNTT-K68A', className: 'CNTT-K68A', department: 'Khoa Công nghệ Thông tin' },
    { index: 3, studentCode: 'SV20260003', student: 'Lê Hoàng Cường', fullName: 'Lê Hoàng Cường', dob: '03/11/2004', class: 'CNTT-K68B', className: 'CNTT-K68B', department: 'Khoa Công nghệ Thông tin' },
  ],
  TEACHER_DIRECTORY: [
    { index: 1, teacherCode: 'GV0102', teacher: 'TS. Trần Hải', degree: 'Tiến sĩ', department: 'Bộ môn CN Phần mềm', email: 'hai.tran@sis.edu.vn' },
    { index: 2, teacherCode: 'GV0105', teacher: 'ThS. Lê Thu Hà', degree: 'Thạc sĩ', department: 'Bộ môn HT Thông tin', email: 'ha.lethu@sis.edu.vn' },
    { index: 3, teacherCode: 'GV0089', teacher: 'PGS.TS Nguyễn Văn A', degree: 'Phó Giáo sinh', department: 'Bộ môn Khoa học Máy tính', email: 'a.nguyenvan@sis.edu.vn' },
  ],
  GENERIC_REPORT: [
    { index: 1, label: 'Tổng số sinh viên toàn trường', value: '18,450' },
    { index: 2, label: 'Tổng số phòng thi sẵn sàng', value: '120 phòng' },
    { index: 3, label: 'Số ca thi đã tổ chức thành công', value: '450 ca' },
    { index: 4, label: 'Tỷ lệ sinh viên hoàn thành đúng hạn', value: '98.6%' },
  ],
};

const sampleRowsByCode: Record<string, Array<Record<string, any>>> = {
  EXAM_SCHEDULE_LIST: sampleRowsBySource.EXAM_SCHEDULE_LIST,
  ROOM_DOOR_LIST: sampleRowsBySource.ROOM_DOOR_LIST,
  ROOM_ATTENDANCE_SHEET: [
    { index: 1, examNumber: 'SBD-001', studentCode: 'SV20260001', student: 'Nguyễn Văn An', fullName: 'Nguyễn Văn An', class: 'CNTT-K68A', paperCount: '02', signature: 'An (Đã nộp)', note: 'Đúng giờ' },
    { index: 2, examNumber: 'SBD-002', studentCode: 'SV20260002', student: 'Trần Thị Bình', fullName: 'Trần Thị Bình', class: 'CNTT-K68A', paperCount: '01', signature: 'Bình (Đã nộp)', note: '' },
    { index: 3, examNumber: 'SBD-003', studentCode: 'SV20260003', student: 'Lê Hoàng Cường', fullName: 'Lê Hoàng Cường', class: 'CNTT-K68B', paperCount: '02', signature: 'Cường (Đã nộp)', note: '' },
    { index: 4, examNumber: 'SBD-004', studentCode: 'SV20260004', student: 'Phạm Minh Đức', fullName: 'Phạm Minh Đức', class: 'CNTT-K68B', paperCount: '00', signature: 'VẮNG (KLD)', note: 'Vắng thi' },
  ],
  SUPERVISOR_ASSIGNMENT: sampleRowsBySource.SUPERVISOR_ASSIGNMENT,
  EXAM_ROOM_MINUTES: [
    { index: 1, item: '1. Tổng số thí sinh theo danh sách phân phòng', quantity: '40 sinh viên', status: 'Khớp danh sách' },
    { index: 2, item: '2. Số lượng thí sinh thực tế có mặt dự thi', quantity: '38 sinh viên', status: 'Có mặt đầy đủ thẻ SV' },
    { index: 3, item: '3. Số lượng thí sinh vắng mặt (SV20260012, SV20260034)', quantity: '02 sinh viên', status: 'Không có lý do' },
    { index: 4, item: '4. Tổng số bài thi thu được thực tế', quantity: '38 bài thi', status: 'Khớp số người thi' },
    { index: 5, item: '5. Tổng số tờ giấy thi nộp lại', quantity: '76 tờ', status: 'Đã kiểm đếm đủ' },
    { index: 6, item: '6. Tình hình trật tự kỷ luật phòng thi', quantity: '00 trường hợp vi phạm', status: 'Nghiêm túc, an toàn' },
  ],
  GRADE_REPORT: sampleRowsBySource.GRADE_REPORT,
  EXAM_SUMMARY_REPORT: [
    { index: 1, subject: 'Lập trình Web Nâng cao (IT4409)', totalStudents: 180, attended: 176, absent: 4, passRate: '94.3%', avgScore: '7.8' },
    { index: 2, subject: 'Mạng máy tính cơ bản (IT3080)', totalStudents: 150, attended: 148, absent: 2, passRate: '91.2%', avgScore: '7.2' },
    { index: 3, subject: 'Cấu trúc dữ liệu & GT (IT2000)', totalStudents: 210, attended: 205, absent: 5, passRate: '88.5%', avgScore: '6.9' },
  ],
  GRADE_APPEAL_MINUTES: [
    { index: 1, studentCode: 'SV20260001', student: 'Nguyễn Văn An', fullName: 'Nguyễn Văn An', subject: 'Lập trình Web', oldScore: '6.5', newScore: '7.5', delta: '+1.0', conclusion: 'Tăng điểm' },
    { index: 2, studentCode: 'SV20260003', student: 'Lê Hoàng Cường', fullName: 'Lê Hoàng Cường', subject: 'Mạng máy tính', oldScore: '4.5', newScore: '4.5', delta: '0.0', conclusion: 'Giữ nguyên' },
  ],
  STUDENT_EXAM_PASS: [
    { index: 1, subject: 'Lập trình Web Nâng cao', subjectCode: 'IT4409', date: '15/12/2025', time: '07:30', room: 'P.301', examNumber: 'SBD-001' },
    { index: 2, subject: 'Mạng máy tính', subjectCode: 'IT3080', date: '16/12/2025', time: '09:30', room: 'P.405', examNumber: 'SBD-001' },
  ],
  SUBJECT_DIRECTORY: [
    { index: 1, subjectCode: 'IT4409', subjectName: 'Lập trình Web Nâng cao', credits: '3 TC', department: 'Khoa Công nghệ Thông tin', examFormat: 'Tự luận + Trắc nghiệm' },
    { index: 2, subjectCode: 'IT3080', subjectName: 'Mạng máy tính', credits: '3 TC', department: 'Khoa Công nghệ Thông tin', examFormat: 'Trắc nghiệm máy' },
    { index: 3, subjectCode: 'IT2000', subjectName: 'Cấu trúc dữ liệu & Giải thuật', credits: '4 TC', department: 'Khoa Công nghệ Thông tin', examFormat: 'Tự luận' },
  ],
  EXAM_ROOM_DIRECTORY: [
    { index: 1, roomCode: 'P.301-B1', roomName: 'Phòng 301 - Tòa B1', building: 'Tòa B1', capacity: '40 chỗ', maxCapacity: '45 chỗ' },
    { index: 2, roomCode: 'P.405-D3', roomName: 'Phòng 405 - Tòa D3', building: 'Tòa D3', capacity: '50 chỗ', maxCapacity: '55 chỗ' },
  ],
  DEPARTMENT_DIRECTORY: [
    { index: 1, code: 'CNTT', name: 'Khoa Công nghệ Thông tin', classesCount: '18 lớp', teachersCount: '34 giảng viên' },
    { index: 2, code: 'KTTV', name: 'Khoa Kinh tế & Quản trị', classesCount: '24 lớp', teachersCount: '42 giảng viên' },
    { index: 3, code: 'LUAT', name: 'Khoa Luật học', classesCount: '12 lớp', teachersCount: '20 giảng viên' },
  ],
  QUESTION_BANK_DIRECTORY: [
    { index: 1, code: 'Q-IT01', subject: 'Lập trình Web', content: 'Trình bày mô hình MVC trong NestJS?', type: 'Tự luận', difficulty: 'Trung bình' },
    { index: 2, code: 'Q-IT02', subject: 'Mạng máy tính', content: 'Giao thức TCP hoạt động ở tầng nào của OSI?', type: 'Trắc nghiệm', difficulty: 'Dễ' },
    { index: 3, code: 'Q-IT03', subject: 'Cấu trúc dữ liệu', content: 'Độ phức tạp thuật toán QuickSort trường hợp xấu nhất?', type: 'Trắc nghiệm', difficulty: 'Khó' },
  ],
  EXAM_PERIOD_DIRECTORY: [
    { index: 1, name: 'Kỳ thi Kết thúc Học kỳ 1 (2025-2026)', semester: 'Học kỳ 1', schoolYear: '2025-2026', startDate: '15/12/2025', endDate: '30/12/2025' },
    { index: 2, name: 'Kỳ thi Phụ & Đánh giá Bổ sung HK1', semester: 'Học kỳ 1', schoolYear: '2025-2026', startDate: '10/01/2026', endDate: '18/01/2026' },
  ],
  EXAM_SCORE_TRANSCRIPT: [
    { index: 1, subjectCode: 'IT4409', subjectName: 'Lập trình Web Nâng cao', periodName: 'Học kỳ 1 (2025-2026)', examDate: '15/12/2025', examType: 'Trắc nghiệm', score: '9.0', status: 'Đạt' },
    { index: 2, subjectCode: 'IT3080', subjectName: 'Mạng máy tính cơ bản', periodName: 'Học kỳ 1 (2025-2026)', examDate: '16/12/2025', examType: 'Tự luận', score: '8.0', status: 'Đạt' },
    { index: 3, subjectCode: 'IT2000', subjectName: 'Cấu trúc dữ liệu & GT', periodName: 'Học kỳ 1 (2025-2026)', examDate: '18/12/2025', examType: 'Hỗn hợp', score: '6.5', status: 'Đạt' },
  ],
  CLASS_DIRECTORY: [
    { index: 1, code: 'CNTT-K68A', name: 'Công nghệ Thông tin K68A', department: 'Khoa Công nghệ Thông tin', studentsCount: '45 SV' },
    { index: 2, code: 'CNTT-K68B', name: 'Công nghệ Thông tin K68B', department: 'Khoa Công nghệ Thông tin', studentsCount: '42 SV' },
    { index: 3, code: 'KTPM-K68', name: 'Kỹ thuật Phần mềm K68', department: 'Khoa Công nghệ Thông tin', studentsCount: '38 SV' },
    { index: 4, code: 'HTTT-K68', name: 'Hệ thống Thông tin K68', department: 'Khoa Công nghệ Thông tin', studentsCount: '40 SV' },
  ],
  STUDENT_CURRICULUM_REPORT: [
    { index: 1, semester: 'Học kỳ 1', subjectCode: 'IT4409', subjectName: 'Lập trình Web Nâng cao', credits: '3 TC', type: 'Chuyên ngành', status: 'Đã hoàn thành' },
    { index: 2, semester: 'Học kỳ 1', subjectCode: 'IT3080', subjectName: 'Mạng máy tính', credits: '3 TC', type: 'Cơ sở ngành', status: 'Đã hoàn thành' },
    { index: 3, semester: 'Học kỳ 2', subjectCode: 'IT2000', subjectName: 'Cấu trúc dữ liệu & GT', credits: '4 TC', type: 'Cơ sở ngành', status: 'Đang học' },
    { index: 4, semester: 'Học kỳ 2', subjectCode: 'IT4999', subjectName: 'Khóa luận tốt nghiệp', credits: '10 TC', type: 'Tốt nghiệp', status: 'Chưa học' },
  ],
  EXAM_BAG_LABEL: [
    { index: 1, infoLabel: 'Kỳ thi & Học kỳ', infoValue: 'Kỳ thi Kết thúc Học kỳ 1 (2025-2026)' },
    { index: 2, infoLabel: 'Học phần / Môn thi', infoValue: 'Lập trình Web Nâng cao (IT4409)' },
    { index: 3, infoLabel: 'Phòng thi / Ca thi', infoValue: 'P.301 - Tòa B1 | Ca: 07:30 - 09:00' },
    { index: 4, infoLabel: 'Số bài thi / Số tờ', infoValue: '38 bài thi / 76 tờ giấy thi' },
    { index: 5, infoLabel: 'Cán bộ coi thi 1 & 2', infoValue: 'TS. Trần Hải (CB1) - ThS. Lê Thu Hà (CB2)' },
  ],
  EXAM_INCIDENT_REPORT: [
    { index: 1, studentCode: 'SV20260012', student: 'Vũ Quốc Hùng', fullName: 'Vũ Quốc Hùng', class: 'CNTT-K68A', className: 'CNTT-K68A', violation: 'Mang điện thoại vào phòng thi', evidence: '01 iPhone 13 Pro Max (Đã niêm phong)' },
    { index: 2, studentCode: 'SV20260045', student: 'Đặng Thanh Tâm', fullName: 'Đặng Thanh Tâm', class: 'CNTT-K68B', className: 'CNTT-K68B', violation: 'Sử dụng tài liệu photo thu nhỏ', evidence: '02 mảnh phao giấy A6 (Đã bấm ghim bài)' },
  ],
  EXAM_SUPERVISOR_HANDOVER: [
    { index: 1, item: '1. Túi đề thi chính thức niêm phong (P.301)', expectedQty: '01 túi (45 bản)', receivedQty: '01 túi (Đã mở tại phòng)', sealStatus: 'Nguyên vẹn trước thi' },
    { index: 2, item: '2. Danh sách thí sinh & Phiếu điểm danh', expectedQty: '02 bản in', receivedQty: '02 bản (Đủ chữ ký SV)', sealStatus: 'Hợp lệ 100%' },
    { index: 3, item: '3. Giấy thi, giấy nháp đã đóng dấu tròn', expectedQty: '100 tờ thi / 50 nháp', receivedQty: '76 tờ bài / 24 tờ thừa', sealStatus: 'Đã kiểm đếm khớp' },
    { index: 4, item: '4. Túi bài thi niêm phong có chữ ký CBCT', expectedQty: '01 túi', receivedQty: '01 túi (38 bài thi)', sealStatus: 'Đã dán tem niêm phong' },
  ],
  SYSTEM_AUDIT_LOG: [
    { index: 1, time: '27/08/2026 08:30:15', actor: 'admin_sys', action: 'EXPORT_DATA', target: 'DOCUMENT_TEMPLATE', status: 'Thành công' },
    { index: 2, time: '27/08/2026 08:15:22', actor: 'gv_hai', action: 'GRADE_SUBMIT', target: 'EXAM_ATTEMPT', status: 'Thành công' },
    { index: 3, time: '27/08/2026 07:45:00', actor: 'system_cron', action: 'AUTO_BACKUP', target: 'DATABASE_SNAPSHOT', status: 'Thành công' },
  ],
  EXAM_ARCHIVE_LIST: [
    { index: 1, studentCode: 'SV20260001', fullName: 'Nguyễn Văn An', className: 'CNTT-K68A', totalScore: '9.0', sealShort: 'A1B2C3D4', approvedBy: 'Hội đồng Khảo thí' },
    { index: 2, studentCode: 'SV20260002', fullName: 'Trần Thị Bình', className: 'CNTT-K68A', totalScore: '8.0', sealShort: 'E5F6G7H8', approvedBy: 'Hội đồng Khảo thí' },
    { index: 3, studentCode: 'SV20260003', fullName: 'Lê Hoàng Cường', className: 'CNTT-K68B', totalScore: '6.5', sealShort: 'J9K0L1M2', approvedBy: 'Hội đồng Khảo thí' },
  ],
  EXAM_ARCHIVE_DOSSIER: [
    { index: 1, item: '1. Thông tin thí sinh & Học phần', value: 'Nguyễn Văn An (SV20260001) | Lập trình Web Nâng cao (IT4409)', note: 'Khớp danh sách' },
    { index: 2, item: '2. Mã niêm phong số (SHA-256)', value: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', note: 'Toàn vẹn 100%' },
    { index: 3, item: '3. Điểm số chính thức & Cán bộ chấm', value: '9.0 / 10.0 đ | Cán bộ chấm: TS. Trần Hải | Duyệt: Hội đồng Khảo thí', note: 'Đã công bố' },
    { index: 4, item: '4. Tình trạng lưu trữ đào tạo', value: 'Bản trích lục niêm phong lưu trữ đào tạo chính quy', note: 'Đạt chuẩn lưu trữ' },
  ],
};

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function renderCellValue(column: Column, row: Record<string, any>) {
  return row[column.key] !== undefined && row[column.key] !== null ? String(row[column.key]) : '---';
}

export default function DocumentTemplatesPage() {
  usePageTitle('Mẫu biểu in ấn');
  const cachedTemplates = typeof window !== 'undefined' ? getCachedData<Template[]>('/document-templates') : null;
  const [loading, setLoading] = useState(!cachedTemplates);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(cachedTemplates || []);
  const [selectedId, setSelectedId] = useState<string | null>(cachedTemplates?.[0]?.id || null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(95);
  const [activeTab, setActiveTab] = useState<'settings' | 'columns'>('settings');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!templates.length && !cachedTemplates) setLoading(true);
    try {
      const response = await api.get('/document-templates');
      const list = response.data as Template[];
      setTemplates(list);
      if (list.length > 0) {
        setSelectedId((current) => current || list[0].id);
      }
    } catch (error: any) {
      setToast({
        type: 'error',
        message: error?.response?.data?.message || 'Không thể tải danh sách biểu mẫu.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const selected = useMemo(() => {
    return templates.find((item) => item.id === selectedId) || null;
  }, [templates, selectedId]);

  useEffect(() => {
    if (selected) {
      setDraft(clone(selected));
      const latestVersion = selected.versions[0];
      if (latestVersion && latestVersion.config) {
        const loadedConfig = clone(latestVersion.config);
        if (!loadedConfig.header) {
          loadedConfig.header = {
            institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
            facultyName: 'KHOA CÔNG NGHỆ THÔNG TIN',
            title: selected.name.toUpperCase(),
            subtitle: 'Học kỳ 1 - Năm học 2025 - 2026',
            motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
          };
        } else {
          if (!loadedConfig.header.institutionName?.trim()) {
            loadedConfig.header.institutionName = 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
          }
          if (!loadedConfig.header.facultyName?.trim()) {
            loadedConfig.header.facultyName = 'KHOA CÔNG NGHỆ THÔNG TIN';
          }
          if (!loadedConfig.header.title?.trim()) {
            loadedConfig.header.title = selected.name.toUpperCase();
          }
          if (!loadedConfig.header.subtitle?.trim()) {
            loadedConfig.header.subtitle = 'Học kỳ 1 - Năm học 2025 - 2026';
          }
          if (!loadedConfig.header.motto?.trim()) {
            loadedConfig.header.motto = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
          }
        }
        setConfig(loadedConfig);
      }
    } else {
      setDraft(null);
      setConfig(null);
    }
  }, [selected]);

  const updateConfig = (next: Config) => {
    setConfig(next);
  };

  const setHeader = (field: keyof Config['header'], value: any) => {
    if (!config) return;
    updateConfig({
      ...config,
      header: {
        ...config.header,
        [field]: value,
      },
    });
  };

  const setExamInfo = (field: keyof NonNullable<Config['examInfo']>, value: any) => {
    if (!config) return;
    updateConfig({
      ...config,
      examInfo: {
        ...(config.examInfo || {}),
        [field]: value,
      },
    });
  };

  const handleSaveAndApply = async () => {
    if (!draft || !config) return;
    setSaving(true);
    try {
      await api.patch(`/document-templates/${draft.id}`, {
        name: draft.name,
        description: draft.description || '',
        isDefault: draft.isDefault,
        config,
      });
      const publishRes = await api.post(`/document-templates/${draft.id}/publish`);
      const updated = publishRes.data as Template;
      setTemplates((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setDraft(clone(updated));
      setToast({ type: 'success', message: 'Đã lưu và áp dụng biểu mẫu thành công.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không thể lưu biểu mẫu.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTemplateId(id);
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/document-templates/${deleteTemplateId}`);
      setTemplates((prev) => prev.filter((item) => item.id !== deleteTemplateId));
      if (selectedId === deleteTemplateId) {
        const remaining = templates.filter((item) => item.id !== deleteTemplateId);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      setToast({ type: 'success', message: 'Đã xóa biểu mẫu thành công.' });
      setDeleteTemplateId(null);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không thể xóa biểu mẫu.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    if (!config?.columns) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.columns.length) return;
    const nextCols = clone(config.columns);
    const temp = nextCols[index];
    nextCols[index] = nextCols[targetIndex];
    nextCols[targetIndex] = temp;
    updateConfig({ ...config, columns: nextCols });
  };

  const testPrint = () => {
    if (!config || !draft) return;
    const isExam = config.templateType === 'EXAM_PAPER';
    if (isExam) {
      printExamPaper({
        institutionName: config.header.institutionName,
        facultyName: config.header.facultyName,
        motto: config.header.motto,
        paperTitle: config.header.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN',
        subtitle: config.header.subtitle,
        subjectName: config.examInfo?.subjectName || 'Lập trình Web Nâng cao',
        subjectCode: config.examInfo?.subjectCode || 'IT4409',
        paperCode: draft.code || 'DE_THI_MAU_01',
        durationMinutes: config.examInfo?.durationMinutes || 60,
        totalScore: config.examInfo?.totalScore || 10,
        showScoreBox: config.examInfo?.showScoreBox !== false,
        showInstructions: config.examInfo?.showInstructions !== false,
        instructionText: config.examInfo?.instructionText,
        questions: [
          {
            index: 1,
            content: 'Trình bày sự khác biệt giữa Server-Side Rendering (SSR) và Client-Side Rendering (CSR).',
            score: 2,
            type: 'ESSAY',
          },
          {
            index: 2,
            content: 'Cho biết đặc điểm của kiến trúc Microservices so với Monolith.',
            score: 3,
            type: 'SINGLE_CHOICE',
            options: [
              { key: 'A', text: 'Dễ mở rộng độc lập từng module' },
              { key: 'B', text: 'Triển khai phức tạp hơn qua mạng' },
              { key: 'C', text: 'Độc lập về công nghệ và CSDL' },
              { key: 'D', text: 'Tất cả các phương án trên', isCorrect: true },
            ],
          },
          {
            index: 3,
            content: 'Viết API Endpoint xử lý đăng ký môn học và kiểm tra trùng lịch thi bằng Prisma ORM.',
            score: 5,
            type: 'ESSAY',
          },
        ],
        pageSize: config.page.size,
        signers: config.footer.signers,
        footerNotes: config.footer.note,
      });
    } else {
      const activeColumns = config.columns.filter((c) => c.visible !== false);
      const columns = activeColumns.map((c) => ({
        header: c.label,
        width: c.width,
        align: c.align || (c.key === 'index' ? 'center' : 'left'),
      }));

      const rawRows = sampleRowsByCode[draft.code] || sampleRowsBySource[draft.dataSource] || [];
      const rows = rawRows.map((row) =>
        activeColumns.map((c) => renderCellValue(c, row))
      );

      printReport({
        title: config.header.title || draft.name,
        subtitle: config.header.subtitle,
        institutionName: config.header.institutionName,
        facultyName: config.header.facultyName,
        columns,
        rows,
        pageSize: config.page.size,
        orientation: config.page.orientation,
        signers: config.footer.signers,
        footerNotes: config.footer.note,
        templateCode: draft.code,
      });
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [templates, searchQuery]);

  if (loading) {
    return <PageSkeleton hasKPIs={false} variant="cards" />;
  }

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* 1. Header Tiêu Chuẩn Hệ Thống */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
            Mẫu biểu & Báo cáo in ấn
          </h1>
          <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            Tùy biến tiêu đề, khổ giấy A4/A5, căn lề và cấu trúc cột hiển thị cho các phôi in ấn toàn hệ thống.
          </p>
        </div>

        {/* Duy nhất 1 Primary CTA trên Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAndApply}
            disabled={saving || !draft}
            className="min-w-[140px]"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* 2. Workspace Liền Mạch: Cột Trái Rộng Rãi 500px - Không Bị Che Chữ */}
      <div className="w-full rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[500px_minmax(0,1fr)] items-stretch">
        {/* Cột Trái: Sidebar Cấu hình */}
        <div className="flex flex-col p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Sliding Segmented Control với Animation Trượt Mượt Mà */}
          <SlidingSegmentedControl<'settings' | 'columns'>
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            fullWidth
            size="md"
            options={[
              { value: 'settings', label: 'Thiết lập in ấn' },
              { value: 'columns', label: 'Danh sách Mẫu', count: templates.length },
            ]}
          />

          {/* Vùng Nội Dung Cấu Hình Cột Trái: Tab Thiết lập in ấn LUÔN LUÔN là khung chuẩn master duy nhất */}
          <div className="relative flex-1">
            {/* Tab 1: Thiết lập In ấn (Luôn giữ nguyên trong layout flow để định hình độ dài chuẩn bất biến) */}
            <div
              className={`space-y-5 divide-y divide-slate-100 dark:divide-slate-800 ${
                activeTab === 'settings'
                  ? 'opacity-100'
                  : 'invisible opacity-0 pointer-events-none select-none aria-hidden'
              }`}
            >
              {/* Section 1: Đơn vị & Tiêu đề */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-type-body font-semibold text-slate-900 dark:text-slate-100">
                    Đơn vị & Tiêu đề
                  </span>
                  <span className="text-type-helper text-slate-500 font-normal">
                    {sourceLabels[draft?.dataSource || 'GENERIC_REPORT'] || draft?.dataSource}
                  </span>
                </div>
                {draft && config && (
                  <div className="space-y-2.5">
                    <FormInput
                      label="Tên biểu mẫu"
                      value={draft.name}
                      onChange={(v) => setDraft({ ...draft, name: v })}
                      placeholder="Tên biểu mẫu..."
                    />
                    <FormInput
                      label="Tên Trường / Cơ quan"
                      value={config.header.institutionName}
                      onChange={(v) => setHeader('institutionName', v)}
                      placeholder="TRƯỜNG ĐẠI HỌC NAM CẦN THƠ..."
                    />

                    {/* Logo Trường / Đơn vị Đào tạo */}
                    <div className="pt-1 pb-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={config.header.showLogo !== false}
                            onChange={(e) => setHeader('showLogo', e.target.checked)}
                            className="h-4 w-4 rounded accent-blue-600 cursor-pointer shrink-0"
                          />
                          <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                            Hiển thị Logo trường trên phôi in
                          </span>
                        </label>
                      </div>

                      {config.header.showLogo !== false && (
                        <div className="flex items-center justify-between gap-4 py-0.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 shrink-0 flex items-center justify-center overflow-hidden">
                              <DynamicImage
                                src={config.header.logoUrl || DEFAULT_DNC_LOGO_DATA_URL}
                                alt="Logo trường"
                                className="h-full w-full object-contain"
                              />
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="text-type-body font-semibold text-slate-900 dark:text-slate-100 truncate">
                                ĐH Nam Cần Thơ (DNC)
                              </div>
                              <div className="text-type-helper text-slate-500 dark:text-slate-400 font-normal truncate">
                                {config.header.logoUrl ? 'Logo tùy chỉnh đã tải lên' : 'Logo mặc định hệ thống (PNG, JPG, SVG)'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {Boolean(config.header.logoUrl) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHeader('logoUrl', '');
                                  setToast({ message: 'Đã đặt lại logo mặc định của trường (DNC)', type: 'success' });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 text-type-body font-medium active:scale-[0.96] transition-colors duration-150 ease-out cursor-pointer select-none"
                                title="Đặt lại logo mặc định DNC"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Mặc định</span>
                              </button>
                            )}

                            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200/90 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800 text-type-body font-medium text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs active:scale-[0.96] transition-colors duration-150 ease-out select-none">
                              <Upload className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                              <span>Đổi logo</span>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 2 * 1024 * 1024) {
                                    setToast({ message: 'Dung lượng ảnh logo không được vượt quá 2MB', type: 'error' });
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvt) => {
                                    const base64 = uploadEvt.target?.result as string;
                                    if (base64) {
                                      setHeader('logoUrl', base64);
                                      setToast({ message: 'Đã tải lên logo trường thành công', type: 'success' });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <FormInput
                      label="Khoa / Đơn vị tổ chức"
                      value={config.header.facultyName || ''}
                      onChange={(v) => setHeader('facultyName', v)}
                      placeholder="KHOA CÔNG NGHỆ THÔNG TIN..."
                    />
                    <FormInput
                      label="Tiêu đề chính"
                      value={config.header.title}
                      onChange={(v) => setHeader('title', v)}
                      placeholder="ĐỀ THI KẾT THÚC HỌC PHẦN..."
                    />
                    <FormInput
                      label="Phụ đề / Học kỳ"
                      value={config.header.subtitle}
                      onChange={(v) => setHeader('subtitle', v)}
                      placeholder="Học kỳ 1 - Năm học 2025 - 2026..."
                    />
                    {/* Quốc hiệu / Tiêu ngữ chuẩn */}
                    <div className="pt-1.5 space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={Boolean(config.header.motto?.trim())}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setHeader(
                              'motto',
                              enabled
                                ? 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc'
                                : ''
                            );
                          }}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-blue-600 shrink-0"
                        />
                        <span className="text-type-body font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                          Hiển thị Quốc hiệu & Tiêu ngữ chuẩn (NĐ 30/2020)
                        </span>
                      </label>

                      {Boolean(config.header.motto?.trim()) && (
                        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-center space-y-0.5 select-none">
                          <p className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                          </p>
                          <p className="text-type-helper font-medium italic text-slate-700 dark:text-slate-300">
                            Độc lập – Tự do – Hạnh phúc
                          </p>
                          <div className="w-16 h-px bg-slate-400 dark:bg-slate-500 mx-auto mt-1" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Khổ giấy & Định dạng */}
              {config && (
                <div className="pt-4 space-y-3">
                  <span className="block text-type-body font-semibold text-slate-900 dark:text-slate-100">
                    Khổ giấy & Định dạng
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="mb-1 block text-type-body font-medium text-slate-800 dark:text-slate-200">
                        Khổ giấy
                      </span>
                      <FilterSelect
                        value={config.page.size}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            page: { ...config.page, size: e.target.value as 'A4' | 'A5' },
                          })
                        }
                        options={[
                          { value: 'A4', label: 'A4' },
                          { value: 'A5', label: 'A5' },
                        ]}
                        fullWidth
                      />
                    </div>

                    <div>
                      <span className="mb-1 block text-type-body font-medium text-slate-800 dark:text-slate-200">
                        Hướng giấy
                      </span>
                      <FilterSelect
                        value={config.page.orientation}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            page: { ...config.page, orientation: e.target.value as 'portrait' | 'landscape' },
                          })
                        }
                        options={[
                          { value: 'portrait', label: 'Dọc' },
                          { value: 'landscape', label: 'Ngang' },
                        ]}
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="mb-1 block text-type-body font-medium text-slate-800 dark:text-slate-200">
                        Lề trang
                      </span>
                      <FilterSelect
                        value={String(config.page.marginMm)}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            page: { ...config.page, marginMm: Number(e.target.value) || 15 },
                          })
                        }
                        options={[
                          { value: '10', label: '10 mm' },
                          { value: '15', label: '15 mm' },
                          { value: '20', label: '20 mm' },
                        ]}
                        fullWidth
                      />
                    </div>

                    <div>
                      <span className="mb-1 block text-type-body font-medium text-slate-800 dark:text-slate-200">
                        Dạng tài liệu
                      </span>
                      <FilterSelect
                        value={config.templateType || 'TABLE'}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            templateType: e.target.value as TemplateType,
                          })
                        }
                        options={[
                          { value: 'TABLE', label: 'Bảng dữ liệu' },
                          { value: 'EXAM_PAPER', label: 'Đề thi' },
                        ]}
                        fullWidth
                      />
                    </div>
                  </div>

                  {config.templateType === 'EXAM_PAPER' && (
                    <div className="pt-3 space-y-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-type-body font-medium text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={config.examInfo?.showScoreBox !== false}
                            onChange={(e) => setExamInfo('showScoreBox', e.target.checked)}
                            className="h-4 w-4 rounded accent-blue-600"
                          />
                          <span>Khung chấm điểm</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-type-body font-medium text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={config.examInfo?.showInstructions !== false}
                            onChange={(e) => setExamInfo('showInstructions', e.target.checked)}
                            className="h-4 w-4 rounded accent-blue-600"
                          />
                          <span>Quy chế phòng thi</span>
                        </label>
                      </div>

                      {config.examInfo?.showInstructions !== false && (
                        <FormInput
                          label="Nội dung quy chế"
                          value={
                            config.examInfo?.instructionText ||
                            '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)'
                          }
                          onChange={(v) => setExamInfo('instructionText', v)}
                          placeholder="Nội dung quy chế..."
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Cấu trúc Cột (Khung cuộn tối đa 160px) */}
              {config && config.templateType !== 'EXAM_PAPER' && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-type-body font-semibold text-slate-900 dark:text-slate-100">
                        Cấu trúc Cột ({config.columns?.length || 0})
                      </span>
                      <p className="text-type-helper text-slate-500 font-normal">
                        Bật/tắt hiển thị, đặt tên tiêu đề và căn chỉnh lề
                      </p>
                    </div>
                  </div>

                  {/* Danh sách cột phẳng với khung cuộn tối đa 160px */}
                  <div className="max-h-[160px] overflow-y-auto custom-scrollbar pr-1 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                    {config.columns?.map((column, index) => (
                      <div key={column.key || index} className="pt-2.5 first:pt-0 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          {/* Checkbox visible */}
                          <input
                            type="checkbox"
                            aria-label={`Bật/tắt cột ${column.label}`}
                            checked={column.visible !== false}
                            onChange={(e) => {
                              const nextCols = clone(config.columns);
                              nextCols[index].visible = e.target.checked;
                              updateConfig({ ...config, columns: nextCols });
                            }}
                            className="h-4 w-4 rounded accent-blue-600 shrink-0"
                          />

                          {/* Header input */}
                          <input
                            value={column.label}
                            onChange={(e) => {
                              const nextCols = clone(config.columns);
                              nextCols[index].label = e.target.value;
                              updateConfig({ ...config, columns: nextCols });
                            }}
                            placeholder="Tên cột"
                            className="h-9 flex-1 min-w-0 rounded-xl border border-slate-200/90 bg-white px-2.5 text-type-body font-medium text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                          />

                          {/* Align Selector: Rộng rãi không bị che chữ */}
                          <div className="w-[94px] shrink-0">
                            <FilterSelect
                              value={column.align || 'left'}
                              onChange={(e) => {
                                const nextCols = clone(config.columns);
                                nextCols[index].align = e.target.value as Column['align'];
                                updateConfig({ ...config, columns: nextCols });
                              }}
                              options={[
                                { value: 'left', label: 'Trái' },
                                { value: 'center', label: 'Giữa' },
                                { value: 'right', label: 'Phải' },
                              ]}
                              fullWidth
                            />
                          </div>

                          {/* Move Up / Down */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveColumn(index, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-xl transition cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <MoveUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === config.columns.length - 1}
                            onClick={() => handleMoveColumn(index, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-xl transition cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <MoveDown className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Column Button */}
                          {config.columns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextCols = config.columns.filter((_, idx) => idx !== index);
                                updateConfig({ ...config, columns: nextCols });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                              title="Xóa cột này khỏi mẫu in"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Chân trang & Chữ ký */}
              {config && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                      Chân trang & Chữ ký
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSigners = [...(config.footer.signers || [])];
                        nextSigners.push({ title: 'CHỨC DANH', subtitle: '(Ký, ghi rõ họ tên)' });
                        updateConfig({ ...config, footer: { ...config.footer, signers: nextSigners } });
                      }}
                      className="text-type-helper font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                    >
                      + Thêm người ký
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <FormInput
                      label="Ghi chú cuối trang"
                      value={config.footer.note}
                      onChange={(v) =>
                        updateConfig({
                          ...config,
                          footer: { ...config.footer, note: v },
                        })
                      }
                      placeholder="Ghi chú cuối trang..."
                    />

                    <div className="space-y-2 pt-1">
                      {config.footer.signers.map((signer, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <div className="flex-1 space-y-1.5">
                            <input
                              value={signer.title}
                              onChange={(e) => {
                                const nextSigners = clone(config.footer.signers);
                                nextSigners[sIdx].title = e.target.value;
                                updateConfig({
                                  ...config,
                                  footer: { ...config.footer, signers: nextSigners },
                                });
                              }}
                              placeholder="Chức danh"
                              className="h-9 w-full rounded-xl border border-slate-200/90 bg-white px-2.5 text-type-body font-medium text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                            />
                            <input
                              value={signer.subtitle || ''}
                              onChange={(e) => {
                                const nextSigners = clone(config.footer.signers);
                                nextSigners[sIdx].subtitle = e.target.value;
                                updateConfig({
                                  ...config,
                                  footer: { ...config.footer, signers: nextSigners },
                                });
                              }}
                              placeholder="Ghi chú ký"
                              className="h-9 w-full rounded-xl border border-slate-200/90 bg-white px-2.5 text-type-body font-normal text-slate-700 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300"
                            />
                          </div>
                          {config.footer.signers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextSigners = config.footer.signers.filter((_, idx) => idx !== sIdx);
                                updateConfig({
                                  ...config,
                                  footer: { ...config.footer, signers: nextSigners },
                                });
                              }}
                              className="rounded-xl p-2 text-slate-400 hover:text-rose-600 cursor-pointer transition shrink-0"
                              title="Xóa người ký"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab 2: Danh Sách Mẫu Biểu (Lấp đầy trọn vẹn 100% không gian theo đúng độ dài của Tab 1) */}
            {activeTab === 'columns' && (
              <div className="absolute inset-0 flex flex-col space-y-3 bg-white dark:bg-slate-900 z-10">
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm biểu mẫu..."
                    className="h-9 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                  />
                </div>

                {/* Danh sách mẫu: Thiết kế phẳng thanh lịch, bo góc mềm mại rounded-xl, thanh chỉ báo active */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                  {filteredTemplates.map((template) => {
                    const isSelected = template.id === selectedId;
                    return (
                      <div
                        key={template.id}
                        onClick={() => {
                          setSelectedId(template.id);
                          setActiveTab('settings');
                        }}
                        className={`group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100'
                            : 'hover:bg-slate-100/70 text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Thanh chỉ báo xanh bo tròn mép trái khi Active */}
                        {isSelected && (
                          <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-blue-600 rounded-r-full" />
                        )}

                        <div className={`flex-1 min-w-0 space-y-0.5 ${isSelected ? 'pl-2' : ''}`}>
                          <span
                            className={`block text-type-body-sm truncate ${
                              isSelected
                                ? 'font-semibold text-blue-700 dark:text-blue-400'
                                : 'font-semibold text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {template.name}
                          </span>
                          <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate font-normal">
                            {sourceLabels[template.dataSource] || template.dataSource}{' '}
                            <span className="text-slate-300 dark:text-slate-700">|</span>{' '}
                            <span className="tabular-nums">{template.code}</span>
                          </p>
                        </div>

                        {!template.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(template.id, e)}
                            className="rounded-xl p-1.5 text-slate-400 hover:text-rose-600 transition opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                            title="Xóa mẫu"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Studio Canvas Cố Định 95% - Bằng Đáy Khít Với Cột Trái */}
        <div className="flex flex-col bg-slate-100/70 dark:bg-slate-950/70 overflow-hidden h-full min-h-0">
          {/* Top Bar Tinh Gọn - Tối Giản Nút & Chữ */}
          {/* Top Bar Tinh Gọn & Đẳng Cấp 2026 */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/60 shrink-0 z-10 sticky top-0">
            {/* Header Bên Trái: Blue Pill + Title + Metadata */}
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-1 bg-blue-600 rounded-full shrink-0" />
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                Xem trước
              </span>
              <span className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                ({config?.page.size || 'A4'} | {config?.page.orientation === 'landscape' ? 'Khổ ngang' : 'Khổ dọc'})
              </span>
            </div>

            {/* Controls Bên Phải: Hoàn toàn không nền, dùng hiệu ứng bấm co giãn Tactile Scaling */}
            <div className="flex items-center gap-2">
              {/* Stepper Zoom: Không nền, hiệu ứng scale khi bấm */}
              <div className="inline-flex items-center gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(50, s - 5))}
                  className="p-1 rounded-xl text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:scale-120 active:scale-80 transition-all duration-150 cursor-pointer"
                  title="Thu nhỏ (-5%)"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(95)}
                  className="px-1.5 py-0.5 tabular-nums text-type-helper text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 font-semibold cursor-pointer hover:scale-110 active:scale-90 transition-all duration-150 select-none"
                  title="Bấm để đặt lại chuẩn 95%"
                >
                  {zoomScale}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(150, s + 5))}
                  className="p-1 rounded-xl text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:scale-120 active:scale-80 transition-all duration-150 cursor-pointer"
                  title="Phóng to (+5%)"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <div className="h-3.5 w-px bg-slate-200/80 dark:bg-slate-800 mx-0.5" />

              {/* Nút In Thử Nghiệm: Không nền, hiệu ứng nhấn co giãn mượt mà */}
              <button
                type="button"
                onClick={testPrint}
                disabled={!draft || !config}
                className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-xl text-type-body-sm font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
                title="In thử nghiệm biểu mẫu này (PDF / Máy in)"
              >
                <Printer className="h-4 w-4" />
                <span>In thử</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport: Không gian Studio rộng mở, ôm theo đúng độ dài của Tab Thiết lập in ấn */}
          <div className="flex-1 flex justify-center items-center overflow-hidden p-6 lg:p-8 select-none bg-slate-100/60 dark:bg-slate-950/60 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:24px_24px]">
            {draft && config ? (
              <div
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="transition-all shrink-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.06)] rounded-xs"
              >
                <div
                  style={{
                    width: config.page.orientation === 'landscape' ? '297mm' : '210mm',
                    minHeight: config.page.orientation === 'landscape' ? '210mm' : '297mm',
                    padding: `${config.page.marginMm || 15}mm`,
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                  className="bg-white text-slate-950 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] rounded-xs transition-all dark:bg-white dark:text-slate-950 text-left"
                >
                  {config.templateType === 'EXAM_PAPER' ? (
                    /* EXAM PAPER FORMAT */
                    <div className="space-y-3.5 text-type-body leading-relaxed">
                      {/* 1. NẾU LÀ ĐỀ THI TỰ LUẬN RỌC PHÁCH 120MM */}
                      {config.examInfo?.essayHeaderMode === 'ANONYMIZED_CUT' ? (
                        <>
                          {/* Header 2 Cột Chuẩn Trường & Quốc hiệu */}
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              {config.header.showLogo !== false && (
                                <DynamicImage
                                  src={config.header.logoUrl || DEFAULT_DNC_LOGO_DATA_URL}
                                  alt="Logo trường"
                                  className="h-11 w-11 object-contain shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-type-body">
                                  {config.header.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ'}
                                </div>
                                {config.header.facultyName && (
                                  <div className="font-medium text-type-helper mt-0.5">
                                    {config.header.facultyName}
                                  </div>
                                )}
                                <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-type-body">
                                {config.header.motto?.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'}
                              </div>
                              <div className="font-medium italic text-type-helper mt-0.5">
                                {config.header.motto?.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc'}
                              </div>
                              <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                            </div>
                          </div>

                          {/* Tiêu đề & Mã đề */}
                          <div className="text-center pt-1 relative">
                            <h2 className="text-type-page font-semibold">
                              {config.header.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN'}
                            </h2>
                            {config.header.subtitle && (
                              <div className="italic text-type-helper mt-0.5 font-normal text-slate-600">
                                {config.header.subtitle}
                              </div>
                            )}
                            <div className="text-right text-type-body-sm font-semibold mt-1">
                              MÃ ĐỀ THI: <strong>101</strong>
                            </div>
                          </div>

                          {/* Khung thông tin học phần */}
                          <div className="border border-slate-900 p-2.5 space-y-1 text-type-body-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div><strong>Môn học:</strong> {config.examInfo?.subjectName || 'Lập trình Web Nâng cao'}</div>
                              <div><strong>Mã học phần:</strong> {config.examInfo?.subjectCode || 'IT4409'}</div>
                              <div><strong>Thời gian làm bài:</strong> {config.examInfo?.durationMinutes || 60} phút</div>
                              <div><strong>Thang điểm:</strong> {config.examInfo?.totalScore || 10} điểm</div>
                            </div>
                          </div>

                          {/* Bảng Thông tin thí sinh & Ô Số Phách 1 in sẵn */}
                          <table className="w-full border-collapse border border-slate-900 text-type-body-sm">
                            <tbody>
                              <tr>
                                <td colSpan={2} className="border border-slate-900 p-1.5 w-[54%]">
                                  <strong>Họ và tên thí sinh:</strong> ................................................................
                                </td>
                                <td className="border border-slate-900 p-1.5 w-[23%]">
                                  <strong>MSSV:</strong> ...................................
                                </td>
                                <td rowSpan={3} className="border border-slate-900 p-2 text-center align-middle bg-slate-50 w-[23%]">
                                  <div className="text-type-helper font-semibold">SỐ PHÁCH</div>
                                  <div className="text-type-tiny italic text-slate-500">(Phách 1)</div>
                                  <div className="mt-1 tabular-nums text-type-body font-semibold tracking-wider border border-dashed border-slate-900 px-2 py-0.5 bg-white inline-block rounded">
                                    P101-001
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 w-[28%]"><strong>Lớp HP:</strong> ............................</td>
                                <td className="border border-slate-900 p-1.5 w-[26%]"><strong>Phòng thi:</strong> ................</td>
                                <td className="border border-slate-900 p-1.5 w-[23%]"><strong>SBD:</strong> ........................</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 w-[28%]"><strong>Ngày thi:</strong> ...../...../202...</td>
                                <td className="border border-slate-900 p-1.5 w-[26%]"><strong>Ca thi:</strong> ................</td>
                                <td className="border border-slate-900 p-1.5 w-[23%]"><strong>Chữ ký SV:</strong> ................</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Khung Cán bộ coi thi (54px) */}
                          <table className="w-full border-collapse border border-slate-900 text-type-body-sm">
                            <thead>
                              <tr>
                                <th className="border border-slate-900 p-1 text-center font-medium w-1/2">CÁN BỘ COI THI 1</th>
                                <th className="border border-slate-900 p-1 text-center font-medium w-1/2">CÁN BỘ COI THI 2</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-900 h-14 p-1 text-center align-top text-type-helper italic text-slate-600">
                                  (Ký và ghi rõ họ tên)
                                </td>
                                <td className="border border-slate-900 h-14 p-1 text-center align-top text-type-helper italic text-slate-600">
                                  (Ký và ghi rõ họ tên)
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Đường cắt phách */}
                          <div className="pt-2 text-center text-type-helper font-semibold border-t-2 border-dashed border-slate-900 tracking-wider">
                            ✂ ─── ĐƯỜNG CẮT PHÁCH (RỌC PHÁCH TRƯỚC KHI CHẤM BÀI) ─── ✂
                          </div>

                          {/* Thanh Mini-Header môn thi */}
                          <div className="flex justify-between items-center text-type-helper font-semibold pt-1">
                            <div>MÔN THI: {config.examInfo?.subjectName || 'LẬP TRÌNH WEB NÂNG CAO'} ({config.examInfo?.subjectCode || 'IT4409'})</div>
                            <div>MÃ ĐỀ THI: 101 | THỜI GIAN: {config.examInfo?.durationMinutes || 60} PHÚT</div>
                          </div>

                          {/* Bảng Khớp Phách 2 & Chấm điểm 5 cột của Giám khảo */}
                          <table className="w-full border-collapse border border-slate-900 text-type-body-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-900 p-1.5 text-center font-medium w-[20%]">SỐ PHÁCH (Phách 2)</th>
                                <th className="border border-slate-900 p-1.5 text-center font-medium w-[16%]">ĐIỂM (Số)</th>
                                <th className="border border-slate-900 p-1.5 text-center font-medium w-[24%]">ĐIỂM (Chữ)</th>
                                <th className="border border-slate-900 p-1.5 text-center font-medium w-[20%]">CÁN BỘ CHẤM 1</th>
                                <th className="border border-slate-900 p-1.5 text-center font-medium w-[20%]">CÁN BỘ CHẤM 2</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-900 h-14 p-1 text-center align-middle bg-slate-50">
                                  <div className="tabular-nums text-type-body font-semibold tracking-wider border border-dashed border-slate-900 px-2 py-0.5 bg-white inline-block rounded">
                                    P101-001
                                  </div>
                                </td>
                                <td className="border border-slate-900 h-14 p-1 text-center align-middle font-semibold text-type-title"></td>
                                <td className="border border-slate-900 h-14 p-1.5 align-top text-type-helper italic text-slate-600">
                                  Điểm chữ: .............................
                                </td>
                                <td className="border border-slate-900 h-14 p-1 text-center align-top text-type-helper italic text-slate-600">
                                  (Ký, ghi rõ họ tên)
                                </td>
                                <td className="border border-slate-900 h-14 p-1 text-center align-top text-type-helper italic text-slate-600">
                                  (Ký, ghi rõ họ tên)
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Khối đề bài tự luận */}
                          <div className="border border-slate-900 p-3 space-y-2 text-type-body-sm">
                            <div className="font-semibold text-type-body">ĐỀ BÀI:</div>
                            <div className="space-y-1.5">
                              <div><strong>Câu 1 (3.0 điểm):</strong> Phân tích mô hình kiến trúc Next.js App Router và Server Components.</div>
                              <div><strong>Câu 2 (3.0 điểm):</strong> Trình bày quy trình bảo mật phân quyền RBAC và kiểm soát truy cập trong hệ thống khảo thí.</div>
                              <div><strong>Câu 3 (4.0 điểm):</strong> Thiết kế cấu trúc bảng cơ sở dữ liệu và viết truy vấn tổng hợp điểm thi kết thúc học phần.</div>
                            </div>
                            <div className="text-center italic text-type-tiny text-slate-500 pt-1 border-t border-dashed border-slate-400">
                              ── (HẾT ĐỀ THI) ──
                            </div>
                          </div>

                          {/* Vùng làm bài */}
                          <div className="space-y-1.5 pt-1">
                            <div className="font-semibold text-type-body-sm">BÀI LÀM:</div>
                            <div className="space-y-3">
                              {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="border-b border-dashed border-slate-400 h-5" />
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        /* 2. MẪU ĐỀ THI TIÊU CHUẨN (NON-CUT) */
                        <>
                          {/* Header 2 Cột Chuẩn */}
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="flex items-center justify-center gap-2.5">
                              {config.header.showLogo !== false && (
                                <DynamicImage
                                  src={config.header.logoUrl || DEFAULT_DNC_LOGO_DATA_URL}
                                  alt="Logo trường"
                                  className="h-11 w-11 object-contain shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-type-body">
                                  {config.header.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ'}
                                </div>
                                {config.header.facultyName && (
                                  <div className="font-medium text-type-helper mt-0.5">
                                    {config.header.facultyName}
                                  </div>
                                )}
                                <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-type-body">
                                {config.header.motto?.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'}
                              </div>
                              <div className="font-medium italic text-type-helper mt-0.5">
                                {config.header.motto?.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc'}
                              </div>
                              <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                            </div>
                          </div>

                          {/* Tiêu đề đề thi */}
                          <div className="text-center pt-1">
                            <h2 className="text-type-page font-semibold">
                              {config.header.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN'}
                            </h2>
                            {config.header.subtitle && (
                              <div className="italic text-type-helper mt-0.5 font-normal text-slate-600">
                                {config.header.subtitle}
                              </div>
                            )}
                          </div>

                          {/* Khung thông tin học phần */}
                          <div className="border border-slate-900 p-2.5 space-y-1 text-type-body-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div><strong>Môn học:</strong> {config.examInfo?.subjectName || 'Lập trình Web Nâng cao'}</div>
                              <div><strong>Mã học phần:</strong> {config.examInfo?.subjectCode || 'IT4409'}</div>
                              <div><strong>Thời gian làm bài:</strong> {config.examInfo?.durationMinutes || 60} phút</div>
                              <div><strong>Thang điểm:</strong> {config.examInfo?.totalScore || 10} điểm</div>
                            </div>
                            {config.examInfo?.showInstructions !== false && (
                              <div className="pt-1 italic text-type-helper border-t border-dashed border-slate-400 font-normal">
                                {config.examInfo?.instructionText ||
                                  '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)'}
                              </div>
                            )}
                          </div>

                          {/* Bảng thông tin thí sinh 1 dòng chuẩn */}
                          <table className="w-full border-collapse border border-slate-900 text-type-body-sm">
                            <tbody>
                              <tr>
                                <td colSpan={2} className="border border-slate-900 p-1.5 w-[68%]">
                                  <strong>Họ và tên thí sinh:</strong> ................................................................
                                </td>
                                <td className="border border-slate-900 p-1.5 w-[32%]">
                                  <strong>MSSV:</strong> ...................................
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 w-[36%]"><strong>Lớp HP:</strong> ............................</td>
                                <td className="border border-slate-900 p-1.5 w-[32%]"><strong>Phòng thi:</strong> ................</td>
                                <td className="border border-slate-900 p-1.5 w-[32%]"><strong>SBD:</strong> ........................</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 w-[36%]"><strong>Ngày thi:</strong> ...../...../202...</td>
                                <td className="border border-slate-900 p-1.5 w-[32%]"><strong>Ca thi:</strong> ................</td>
                                <td className="border border-slate-900 p-1.5 w-[32%]"><strong>Chữ ký SV:</strong> ................</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Khung Giám thị và Chấm điểm (56px) */}
                          {config.examInfo?.showScoreBox !== false && (
                            <table className="w-full border-collapse border border-slate-900 text-type-body-sm">
                              <thead>
                                <tr>
                                  <th className="border border-slate-900 p-1 text-center font-medium w-[24%]">CÁN BỘ COI THI 1</th>
                                  <th className="border border-slate-900 p-1 text-center font-medium w-[24%]">CÁN BỘ COI THI 2</th>
                                  <th className="border border-slate-900 p-1 text-center font-medium w-[22%]">ĐIỂM (Số)</th>
                                  <th className="border border-slate-900 p-1 text-center font-medium w-[30%]">ĐIỂM (Chữ) &amp; CB CHẤM</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-slate-900 h-14 p-1 text-center align-top text-type-helper italic text-slate-600">
                                    (Ký và ghi rõ họ tên)
                                  </td>
                                  <td className="border border-slate-900 h-14 p-1 text-center align-top text-type-helper italic text-slate-600">
                                    (Ký và ghi rõ họ tên)
                                  </td>
                                  <td className="border border-slate-900 h-14 p-1 text-center align-middle font-semibold text-type-title"></td>
                                  <td className="border border-slate-900 h-14 p-1.5 align-top text-type-helper text-slate-700">
                                    <em>Điểm chữ: .............................</em><br />
                                    <em>CB Chấm: .............................</em>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          )}

                          {/* Danh sách câu hỏi */}
                          <div className="space-y-3 pt-2">
                            <div>
                              <p className="font-semibold text-type-body">
                                Câu 1 (2.0 điểm): Trình bày sự khác biệt giữa Server-Side Rendering (SSR) và Client-Side Rendering (CSR).
                              </p>
                              <div className="pl-4 pt-1 space-y-1 text-slate-700 italic font-normal text-type-body-sm">
                                [Phần làm bài của thí sinh...]
                              </div>
                            </div>

                            <div>
                              <p className="font-semibold text-type-body">
                                Câu 2 (3.0 điểm): Cho biết đặc điểm của kiến trúc Microservices so với Monolith?
                              </p>
                              <div className="pl-4 pt-1 space-y-1 font-normal text-type-body-sm">
                                <div>A. Dễ mở rộng độc lập từng module</div>
                                <div>B. Triển khai phức tạp hơn qua mạng</div>
                                <div>C. Độc lập về công nghệ và CSDL</div>
                                <div>D. Tất cả các phương án trên</div>
                              </div>
                            </div>

                            <div>
                              <p className="font-semibold text-type-body">
                                Câu 3 (5.0 điểm): Viết API Endpoint xử lý đăng ký môn học và kiểm tra trùng lịch thi bằng Prisma ORM.
                              </p>
                              <div className="pl-4 pt-1 space-y-1 text-slate-700 italic font-normal text-type-body-sm">
                                [Phần làm bài của thí sinh...]
                              </div>
                            </div>
                          </div>

                          {/* Khung chữ ký duyệt đề */}
                          {config.footer.signers.length > 0 && (
                            <div className="pt-6">
                              <div
                                className="grid gap-4 text-center"
                                style={{
                                  gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, config.footer.signers.length))}, minmax(0, 1fr))`,
                                }}
                              >
                                {config.footer.signers.map((s, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="font-semibold text-type-body">{s.title}</div>
                                    <div className="italic text-type-helper text-slate-600 min-h-[45px] font-normal">
                                      {s.subtitle || ''}
                                    </div>
                                    <div className="text-slate-400 font-normal">
                                      ...................................
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    /* TABULAR REPORT FORMAT (SCHEDULES, ROOMS, GRADES, DYNAMIC FORMULAS) */
                    <div className="space-y-3 text-type-body leading-relaxed">
                      {/* Header 2 Columns or 1 Column */}
                      {Boolean(config.header.motto?.trim()) ? (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            {config.header.showLogo !== false && (
                              <DynamicImage
                                src={config.header.logoUrl || DEFAULT_DNC_LOGO_DATA_URL}
                                alt="Logo trường"
                                className="h-11 w-11 object-contain shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-type-body">
                                {config.header.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ'}
                              </div>
                              {config.header.facultyName && (
                                <div className="font-medium text-type-helper mt-0.5">
                                  {config.header.facultyName}
                                </div>
                              )}
                              <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-type-body">
                              {config.header.motto?.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'}
                            </div>
                            <div className="font-medium italic text-type-helper mt-0.5">
                              {config.header.motto?.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc'}
                            </div>
                            <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2.5 text-center">
                          {config.header.showLogo !== false && (
                            <DynamicImage
                              src={config.header.logoUrl || DEFAULT_DNC_LOGO_DATA_URL}
                              alt="Logo trường"
                              className="h-11 w-11 object-contain shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-type-body">
                              {config.header.institutionName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ'}
                            </div>
                            {config.header.facultyName && (
                              <div className="font-medium text-type-helper mt-0.5">
                                {config.header.facultyName}
                              </div>
                            )}
                            <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <div className="text-center pt-2">
                        <h2 className="text-type-page font-semibold">
                          {config.header.title || draft.name}
                        </h2>
                        {config.header.subtitle && (
                          <div className="italic text-type-helper mt-0.5 text-slate-700 font-normal">
                            {config.header.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Data Table with Dynamic Formula Support */}
                      <div className="pt-2 ui-table-wrap">
                        <table className="ui-table w-full border-collapse border border-slate-700 text-type-body">
                          <thead>
                            <tr className="bg-slate-100 font-medium">
                              {config.columns
                                .filter((c) => c.visible !== false)
                                .map((c) => (
                                  <th
                                    key={c.key}
                                    style={{
                                      textAlign: c.align || 'center',
                                      width: c.width,
                                    }}
                                    className="border border-slate-700 p-2 font-medium"
                                  >
                                    {c.label}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(sampleRowsByCode[draft.code] || sampleRowsBySource[draft.dataSource] || []).map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={rIdx % 2 ? 'bg-slate-50/80' : 'bg-white'}
                              >
                                {config.columns
                                  .filter((c) => c.visible !== false)
                                  .map((c) => (
                                    <td
                                      key={c.key}
                                      style={{
                                        textAlign: c.align || (c.key === 'index' ? 'center' : 'left'),
                                      }}
                                      className={`border border-slate-700 p-2 font-normal text-type-body ${c.type === 'FORMULA' ? 'text-blue-700 font-medium' : ''
                                        }`}
                                    >
                                      {renderCellValue(c, row)}
                                    </td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Note */}
                      {config.footer.note && (
                        <p className="italic text-type-helper pt-2 text-slate-700 font-normal">
                          * {config.footer.note}
                        </p>
                      )}

                      {/* Date & Signatures */}
                      <div className="pt-4">
                        <div className="text-right italic text-type-body mb-3 font-normal">
                          Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{' '}
                          {new Date().getFullYear()}
                        </div>
                        {config.footer.signers.length > 0 && (
                          <div
                            className="grid gap-4 text-center"
                            style={{
                              gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, config.footer.signers.length))}, minmax(0, 1fr))`,
                            }}
                          >
                            {config.footer.signers.map((s, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="font-semibold text-type-body">{s.title}</div>
                                <div className="italic text-type-helper text-slate-600 min-h-[45px] font-normal">
                                  {s.subtitle || ''}
                                </div>
                                <div className="text-slate-400 font-normal">
                                  ...................................
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center text-type-body text-slate-500 font-normal">
                Chọn hoặc tạo một biểu mẫu để bắt đầu xem trước trực quan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTemplateId && (
        <ConfirmModal
          isOpen={Boolean(deleteTemplateId)}
          onClose={() => setDeleteTemplateId(null)}
          onConfirm={handleConfirmDeleteTemplate}
          title="Xác nhận xóa biểu mẫu"
          message="Bạn có chắc chắn muốn xóa biểu mẫu này không? Thao tác này không thể hoàn tác."
          type="danger"
          confirmText="Xác nhận xóa"
          cancelText="Hủy bỏ"
          isLoading={isDeleting}
        />
      )}
    </main>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-type-body font-medium text-slate-800 dark:text-slate-200">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-type-body font-normal text-slate-900 outline-none transition focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
      />
    </label>
  );
}
