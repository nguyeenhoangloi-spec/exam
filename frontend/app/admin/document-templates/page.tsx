'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  FileCode,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutTemplate,
  Plus,
  Printer,
  Save,
  School,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { Toast } from '../../../components/Toast';
import { printReport, printExamPaper } from '../../../lib/export-print';

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
  align?: 'left' | 'center' | 'right';
  width?: string;
  visible?: boolean;
};

type Config = {
  templateType?: TemplateType;
  page: {
    size: 'A4' | 'A5';
    orientation: 'portrait' | 'landscape';
    marginMm: number;
  };
  header: {
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

type CatalogItem = {
  dataSource: DataSource;
  label: string;
  columns: Column[];
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

const sourceIcons: Record<DataSource, typeof FileText> = {
  EXAM_SCHEDULE_LIST: LayoutTemplate,
  ROOM_DOOR_LIST: School,
  SUPERVISOR_ASSIGNMENT: Users,
  GRADE_REPORT: FileSpreadsheet,
  STUDENT_DIRECTORY: GraduationCap,
  TEACHER_DIRECTORY: BookOpen,
  GENERIC_REPORT: FileCode,
};

const sampleRowsBySource: Record<DataSource, Array<Record<string, any>>> = {
  EXAM_SCHEDULE_LIST: [
    { index: 1, period: 'Học kỳ 1 (2025-2026)', subject: 'IT4409 - Lập trình Web', date: '15/12/2025', time: '07:30 - 09:00', rooms: 'P.301, P.302' },
    { index: 2, period: 'Học kỳ 1 (2025-2026)', subject: 'IT3080 - Mạng máy tính', date: '16/12/2025', time: '09:30 - 11:00', rooms: 'P.405' },
    { index: 3, period: 'Học kỳ 1 (2025-2026)', subject: 'IT2000 - Cấu trúc dữ liệu', date: '18/12/2025', time: '13:30 - 15:00', rooms: 'P.201, P.202, P.203' },
    { index: 4, period: 'Học kỳ 1 (2025-2026)', subject: 'MA1110 - Giải tích 1', date: '20/12/2025', time: '07:30 - 09:30', rooms: 'Hội trường C2' },
  ],
  ROOM_DOOR_LIST: [
    { index: 1, examNumber: 'SBD-001', studentCode: 'SV20260001', student: 'Nguyễn Văn An', dob: '12/05/2004', class: 'CNTT-K68A', seatNumber: 1 },
    { index: 2, examNumber: 'SBD-002', studentCode: 'SV20260002', student: 'Trần Thị Bình', dob: '24/08/2004', class: 'CNTT-K68A', seatNumber: 2 },
    { index: 3, examNumber: 'SBD-003', studentCode: 'SV20260003', student: 'Lê Hoàng Cường', dob: '03/11/2004', class: 'CNTT-K68B', seatNumber: 3 },
    { index: 4, examNumber: 'SBD-004', studentCode: 'SV20260004', student: 'Phạm Minh Đức', dob: '19/02/2004', class: 'CNTT-K68B', seatNumber: 4 },
  ],
  SUPERVISOR_ASSIGNMENT: [
    { index: 1, teacher: 'TS. Trần Hải', department: 'Công nghệ phần mềm', subject: 'Lập trình Web Nâng cao', room: 'P.301 - B1', date: '15/12/2025', role: 'Giám thị 1' },
    { index: 2, teacher: 'ThS. Lê Thu Hà', department: 'Hệ thống thông tin', subject: 'Lập trình Web Nâng cao', room: 'P.301 - B1', date: '15/12/2025', role: 'Giám thị 2' },
    { index: 3, teacher: 'PGS.TS Nguyễn Văn A', department: 'Khoa học máy tính', subject: 'Mạng máy tính', room: 'P.405 - D3', date: '16/12/2025', role: 'Trưởng điểm' },
  ],
  GRADE_REPORT: [
    { index: 1, studentCode: 'SV20260001', student: 'Nguyễn Văn An', class: 'CNTT-K68A', midScore: '8.5', examScore: '9.0', finalScore: '8.8', letterGrade: 'A', status: 'Đạt' },
    { index: 2, studentCode: 'SV20260002', student: 'Trần Thị Bình', class: 'CNTT-K68A', midScore: '7.0', examScore: '8.0', finalScore: '7.6', letterGrade: 'B+', status: 'Đạt' },
    { index: 3, studentCode: 'SV20260003', student: 'Lê Hoàng Cường', class: 'CNTT-K68B', midScore: '6.0', examScore: '6.5', finalScore: '6.3', letterGrade: 'C', status: 'Đạt' },
    { index: 4, studentCode: 'SV20260004', student: 'Phạm Minh Đức', class: 'CNTT-K68B', midScore: '4.0', examScore: '3.0', finalScore: '3.4', letterGrade: 'F', status: 'Học lại' },
  ],
  STUDENT_DIRECTORY: [
    { index: 1, studentCode: 'SV20260001', student: 'Nguyễn Văn An', dob: '12/05/2004', class: 'CNTT-K68A', department: 'Khoa Công nghệ Thông tin' },
    { index: 2, studentCode: 'SV20260002', student: 'Trần Thị Bình', dob: '24/08/2004', class: 'CNTT-K68A', department: 'Khoa Công nghệ Thông tin' },
    { index: 3, studentCode: 'SV20260003', student: 'Lê Hoàng Cường', dob: '03/11/2004', class: 'CNTT-K68B', department: 'Khoa Công nghệ Thông tin' },
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
    { index: 1, examNumber: 'SBD-001', studentCode: 'SV20260001', student: 'Nguyễn Văn An', class: 'CNTT-K68A', paperCount: '02', signature: 'An (Đã nộp)', note: 'Đúng giờ' },
    { index: 2, examNumber: 'SBD-002', studentCode: 'SV20260002', student: 'Trần Thị Bình', class: 'CNTT-K68A', paperCount: '01', signature: 'Bình (Đã nộp)', note: '' },
    { index: 3, examNumber: 'SBD-003', studentCode: 'SV20260003', student: 'Lê Hoàng Cường', class: 'CNTT-K68B', paperCount: '02', signature: 'Cường (Đã nộp)', note: '' },
    { index: 4, examNumber: 'SBD-004', studentCode: 'SV20260004', student: 'Phạm Minh Đức', class: 'CNTT-K68B', paperCount: '00', signature: 'VẮNG (KLD)', note: 'Vắng thi' },
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
  EXAM_BAG_LABEL: [
    { index: 1, label: 'Kỳ thi / Học kỳ', value: 'Kỳ thi Kết thúc Học kỳ 1 (Năm học 2025 - 2026)' },
    { index: 2, label: 'Môn thi / Học phần', value: 'Lập trình Web Nâng cao (Mã HP: IT4409)' },
    { index: 3, label: 'Phòng thi / Địa điểm', value: 'Phòng 402 - Tòa nhà A1' },
    { index: 4, label: 'Ngày thi / Giờ thi', value: '15/12/2025 | 07:30 - 09:00 (90 phút)' },
    { index: 5, label: 'Số lượng bài thi trong túi', value: '38 bài (Tổng cộng 76 tờ giấy thi)' },
    { index: 6, label: 'Cán bộ coi thi niêm phong', value: 'TS. Trần Hải & ThS. Lê Thu Hà' },
  ],
  GRADE_REPORT: sampleRowsBySource.GRADE_REPORT,
  EXAM_SUMMARY_REPORT: [
    { index: 1, subject: 'Lập trình Web Nâng cao (IT4409)', totalStudents: 180, attended: 176, absent: 4, passRate: '94.3%', avgScore: '7.8' },
    { index: 2, subject: 'Mạng máy tính cơ bản (IT3080)', totalStudents: 150, attended: 148, absent: 2, passRate: '91.2%', avgScore: '7.2' },
    { index: 3, subject: 'Cấu trúc dữ liệu & GT (IT2000)', totalStudents: 210, attended: 205, absent: 5, passRate: '88.5%', avgScore: '6.9' },
  ],
  GRADE_DISTRIBUTION_REPORT: [
    { index: 1, scoreRange: '9.0 - 10.0 (Thang điểm A+ / Xuất sắc)', studentCount: 35, percentage: '19.4%', rating: 'Xuất sắc' },
    { index: 2, scoreRange: '8.0 - 8.9 (Thang điểm A / Giỏi)', studentCount: 65, percentage: '36.1%', rating: 'Giỏi' },
    { index: 3, scoreRange: '6.5 - 7.9 (Thang điểm B / Khá)', studentCount: 52, percentage: '28.9%', rating: 'Khá' },
    { index: 4, scoreRange: '5.0 - 6.4 (Thang điểm C / Trung bình)', studentCount: 20, percentage: '11.1%', rating: 'Trung bình' },
    { index: 5, scoreRange: '< 5.0 (Thang điểm F / Yếu kém)', studentCount: 8, percentage: '4.5%', rating: 'Học lại' },
  ],
  GRADE_APPEAL_MINUTES: [
    { index: 1, studentCode: 'SV20260001', student: 'Nguyễn Văn An', subject: 'Toán cao cấp A1', oldScore: '4.5', newScore: '6.0', delta: '+1.5', conclusion: 'Nâng điểm (Sót ý 2)' },
    { index: 2, studentCode: 'SV20260015', student: 'Trần Thị Mai', subject: 'Cơ sở dữ liệu', oldScore: '6.0', newScore: '7.5', delta: '+1.5', conclusion: 'Nâng điểm (Cộng nhầm)' },
    { index: 3, studentCode: 'SV20260042', student: 'Lê Minh Quân', subject: 'Mạng máy tính', oldScore: '5.0', newScore: '5.0', delta: '0.0', conclusion: 'Giữ nguyên điểm' },
  ],
  SUBJECT_DIRECTORY: [
    { index: 1, subjectCode: 'IT4409', subjectName: 'Lập trình Web Nâng cao', credits: 3, department: 'Khoa CNTT', examFormat: 'Trắc nghiệm + Tự luận' },
    { index: 2, subjectCode: 'IT3080', subjectName: 'Mạng máy tính cơ bản', credits: 3, department: 'Khoa CNTT', examFormat: 'Trắc nghiệm máy' },
    { index: 3, subjectCode: 'IT2000', subjectName: 'Cấu trúc dữ liệu & Giải thuật', credits: 4, department: 'Khoa CNTT', examFormat: 'Tự luận' },
    { index: 4, subjectCode: 'MA1110', subjectName: 'Giải tích 1 (Toán cao cấp)', credits: 4, department: 'Viện Toán ứng dụng', examFormat: 'Tự luận' },
  ],
  DEPARTMENT_DIRECTORY: [
    { index: 1, deptCode: 'CNTT', deptName: 'Khoa Công nghệ Thông tin', headName: 'PGS.TS Trần Mạnh Dũng', phone: '024.3869.2456', email: 'cntt@sis.edu.vn' },
    { index: 2, deptCode: 'DTVT', deptName: 'Khoa Điện tử - Viễn thông', headName: 'TS. Nguyễn Văn Hùng', phone: '024.3869.3457', email: 'dtvt@sis.edu.vn' },
    { index: 3, deptCode: 'TOAN', deptName: 'Viện Toán Ứng dụng & Tin học', headName: 'GS.TS Lê Hải Yến', phone: '024.3869.4568', email: 'toan@sis.edu.vn' },
  ],
  CLASS_DIRECTORY: [
    { index: 1, classCode: 'CNTT-K68A', className: 'Kỹ thuật Phần mềm K68A', department: 'Khoa CNTT', advisor: 'TS. Trần Hải', studentCount: 45 },
    { index: 2, classCode: 'CNTT-K68B', className: 'Khoa học Máy tính K68B', department: 'Khoa CNTT', advisor: 'ThS. Lê Thu Hà', studentCount: 42 },
    { index: 3, classCode: 'HTTT-K67', className: 'Hệ thống Thông tin K67', department: 'Khoa CNTT', advisor: 'PGS.TS Nguyễn Văn A', studentCount: 40 },
  ],
  EXAM_ROOM_DIRECTORY: [
    { index: 1, roomCode: 'P.301-A1', roomName: 'Phòng thi Lý thuyết A1-301', building: 'Tòa nhà A1 - Tầng 3', capacity: 40, maxCapacity: 50 },
    { index: 2, roomCode: 'P.302-A1', roomName: 'Phòng thi Lý thuyết A1-302', building: 'Tòa nhà A1 - Tầng 3', capacity: 40, maxCapacity: 50 },
    { index: 3, roomCode: 'LAB-405-B1', roomName: 'Phòng máy thi thực hành', building: 'Tòa nhà B1 - Tầng 4', capacity: 35, maxCapacity: 35 },
    { index: 4, roomCode: 'HT-C2', roomName: 'Hội trường Thi tập trung C2', building: 'Tòa nhà C2', capacity: 120, maxCapacity: 150 },
  ],
  EXAM_PERIOD_DIRECTORY: [
    { index: 1, periodCode: 'HK20251', periodName: 'Kỳ thi Kết thúc Học kỳ 1', academicYear: '2025 - 2026', semester: 'Học kỳ 1', startDate: '15/12/2025', endDate: '30/12/2025' },
    { index: 2, periodCode: 'HK20252', periodName: 'Kỳ thi Kết thúc Học kỳ 2', academicYear: '2025 - 2026', semester: 'Học kỳ 2', startDate: '10/05/2026', endDate: '25/05/2026' },
  ],
  STUDENT_EXAM_PASS: [
    { index: 1, subject: 'Lập trình Web Nâng cao', subjectCode: 'IT4409', date: '15/12/2025', time: '07:30 - 09:00', room: 'P.402 - A1', examNumber: 'SBD-001' },
    { index: 2, subject: 'Cơ sở dữ liệu nâng cao', subjectCode: 'IT3080', date: '18/12/2025', time: '09:30 - 11:00', room: 'P.305 - B1', examNumber: 'SBD-001' },
    { index: 3, subject: 'Cấu trúc dữ liệu & GT', subjectCode: 'IT2000', date: '22/12/2025', time: '13:30 - 15:00', room: 'P.201 - A1', examNumber: 'SBD-001' },
  ],
  STUDENT_DIRECTORY: sampleRowsBySource.STUDENT_DIRECTORY,
  TEACHER_DIRECTORY: sampleRowsBySource.TEACHER_DIRECTORY,
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export default function DocumentTemplatesPage() {
  usePageTitle('Biểu mẫu In ấn');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'templates'>('settings');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'EXAM' | 'GRADES' | 'ACADEMIC' | 'USERS'>('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const selected = useMemo(
    () => templates.find((item) => item.id === selectedId) || null,
    [templates, selectedId],
  );

  const activeVersion = useMemo(() => {
    return selected?.versions.find((version) => version.status === 'PUBLISHED') || selected?.versions[0];
  }, [selected]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesResponse, catalogResponse] = await Promise.all([
        api.get('/document-templates'),
        api.get('/document-templates/catalog'),
      ]);
      const list = templatesResponse.data as Template[];
      setTemplates(list);
      setCatalog(catalogResponse.data as CatalogItem[]);
      setSelectedId((current) => (current && list.some((item) => item.id === current) ? current : list[0]?.id || null));
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không tải được danh sách biểu mẫu.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selected) {
      const copy = clone(selected);
      if (copy.versions[0]?.config) {
        const cfg = copy.versions[0].config;
        if (!cfg.templateType) {
          cfg.templateType = copy.code === 'EXAM_PAPER_OFFICIAL' || copy.name.toLowerCase().includes('đề thi') ? 'EXAM_PAPER' : 'TABLE';
        }
        if (!cfg.header.motto) {
          cfg.header.motto = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
        }
        if (!cfg.examInfo) {
          cfg.examInfo = {
            subjectName: 'Lập trình Web Nâng cao',
            subjectCode: 'IT4409',
            durationMinutes: 60,
            totalScore: 10,
            showScoreBox: true,
            showInstructions: true,
            instructionText: '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)',
          };
        }
      }
      setDraft(copy);
    } else {
      setDraft(null);
    }
  }, [selected]);

  const config = draft?.versions[0]?.config;

  const updateConfig = (next: Config) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            versions: [{ ...current.versions[0], config: next }, ...current.versions.slice(1)],
          }
        : current,
    );
  };

  const setHeader = (field: keyof Config['header'], value: string) => {
    if (!config) return;
    updateConfig({
      ...config,
      header: { ...config.header, [field]: value },
    });
  };

  const setExamInfo = (field: keyof NonNullable<Config['examInfo']>, value: any) => {
    if (!config) return;
    updateConfig({
      ...config,
      examInfo: { ...(config.examInfo || {}), [field]: value },
    });
  };

  const applyPreset = (preset: 'DAI_HOC' | 'THPT' | 'HOC_VIEN' | 'TRUNG_TAM') => {
    if (!config || !draft) return;
    const isExam = config.templateType === 'EXAM_PAPER';

    if (preset === 'DAI_HOC') {
      updateConfig({
        ...config,
        header: {
          ...config.header,
          institutionName: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO',
          facultyName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ - KHOA CÔNG NGHỆ THÔNG TIN',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        footer: {
          ...config.footer,
          signers: isExam
            ? [
                { title: 'CÁN BỘ RA ĐỀ', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'TRƯỞNG BỘ MÔN DUYỆT', subtitle: '(Ký, ghi rõ họ tên)' },
              ]
            : [
                { title: 'HIỆU TRƯỞNG', subtitle: '(Ký, đóng dấu)' },
                { title: 'TRƯỞNG PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký, ghi rõ họ tên)' },
              ],
        },
      });
      setToast({ type: 'success', message: 'Đã áp dụng mẫu trường Đại học chuẩn.' });
    } else if (preset === 'THPT') {
      updateConfig({
        ...config,
        header: {
          ...config.header,
          institutionName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH',
          facultyName: 'TRƯỜNG THPT NGUYỄN DU - TỔ TOÁN - TIN',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        footer: {
          ...config.footer,
          signers: isExam
            ? [
                { title: 'GIÁO VIÊN RA ĐỀ', subtitle: '(Ký, ghi rõ họ tên)' },
                { title: 'TỔ TRƯỞNG CHUYÊN MÔN', subtitle: '(Ký, ghi rõ họ tên)' },
              ]
            : [
                { title: 'HIỆU TRƯỞNG', subtitle: '(Ký, đóng dấu)' },
                { title: 'GIÁO VIÊN CHỦ NHIỆM / GIÁM THỊ', subtitle: '(Ký, ghi rõ họ tên)' },
              ],
        },
      });
      setToast({ type: 'success', message: 'Đã áp dụng mẫu trường THPT chuẩn.' });
    } else if (preset === 'HOC_VIEN') {
      updateConfig({
        ...config,
        header: {
          ...config.header,
          institutionName: 'HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG',
          facultyName: 'KHOA CÔNG NGHỆ THÔNG TIN 1',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        footer: {
          ...config.footer,
          signers: [
            { title: 'GIÁM ĐỐC HỌC VIỆN', subtitle: '(Ký, đóng dấu)' },
            { title: 'TRƯỞNG PHÒNG ĐÀO TẠO', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      });
      setToast({ type: 'success', message: 'Đã áp dụng mẫu Học viện chuẩn.' });
    } else {
      updateConfig({
        ...config,
        header: {
          ...config.header,
          institutionName: 'TRUNG TÂM KHẢO THÍ & ĐÁNH GIÁ CHẤT LƯỢNG',
          facultyName: 'PHÒNG ĐIỀU HÀNH THI & XẾP LỊCH',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        footer: {
          ...config.footer,
          signers: [
            { title: 'GIÁM ĐỐC TRUNG TÂM', subtitle: '(Ký, đóng dấu)' },
            { title: 'CÁN BỘ COI THI', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      });
      setToast({ type: 'success', message: 'Đã áp dụng mẫu Trung tâm Khảo thí.' });
    }
  };

  const saveDraft = async () => {
    if (!draft || !config) return;
    setSaving(true);
    try {
      const response = await api.patch(`/document-templates/${draft.id}`, {
        name: draft.name,
        description: draft.description || '',
        isDefault: draft.isDefault,
        config,
      });
      const updated = response.data as Template;
      setTemplates((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setToast({ type: 'success', message: 'Đã lưu phiên bản nháp mới thành công.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không thể lưu nháp.' });
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await api.post(`/document-templates/${draft.id}/publish`);
      const updated = response.data as Template;
      setTemplates((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setToast({
        type: 'success',
        message: 'Đã phát hành biểu mẫu thành công! Tất cả các lần in trong toàn hệ thống sẽ áp dụng mẫu mới này.',
      });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không thể phát hành biểu mẫu.' });
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await api.post(`/document-templates/${selected.id}/duplicate`);
      const created = response.data as Template;
      setTemplates((items) => [created, ...items]);
      setSelectedId(created.id);
      setToast({ type: 'success', message: 'Đã nhân bản biểu mẫu để bạn chỉnh sửa riêng.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không thể nhân bản biểu mẫu.' });
    } finally {
      setSaving(false);
    }
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
            content: 'Viết đoạn mã TypeScript thiết kế API Guard xác thực JWT và kiểm tra quyền RBAC.',
            score: 5,
            type: 'ESSAY',
          },
        ],
        signers: config.footer.signers,
        footerNotes: config.footer.note,
      });
    } else {
      const columns = config.columns
        .filter((c) => c.visible !== false)
        .map((c) => ({
          header: c.label,
          width: c.width,
          align: c.align || (c.key === 'index' ? 'center' : 'left'),
        }));

      const rows = (sampleRowsByCode[draft.code] || sampleRowsBySource[draft.dataSource] || []).map((row) =>
        config.columns
          .filter((c) => c.visible !== false)
          .map((c) => String(row[c.key] ?? '---')),
      );

      printReport({
        title: config.header.title || draft.name,
        subtitle: config.header.subtitle,
        institutionName: config.header.institutionName,
        facultyName: config.header.facultyName,
        columns,
        rows,
        signers: config.footer.signers,
        footerNotes: config.footer.note,
        templateCode: draft.code,
      });
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      if (categoryFilter === 'ALL') return true;
      if (categoryFilter === 'EXAM') {
        return (
          ['EXAM_PAPER_OFFICIAL', 'EXAM_SCHEDULE_LIST', 'ROOM_DOOR_LIST', 'ROOM_ATTENDANCE_SHEET', 'SUPERVISOR_ASSIGNMENT', 'EXAM_ROOM_MINUTES', 'EXAM_BAG_LABEL'].includes(item.code) ||
          item.name.toLowerCase().includes('đề thi') ||
          item.name.toLowerCase().includes('phòng thi') ||
          item.name.toLowerCase().includes('lịch thi') ||
          item.name.toLowerCase().includes('túi bài')
        );
      }
      if (categoryFilter === 'GRADES') {
        return (
          ['GRADE_REPORT', 'EXAM_SUMMARY_REPORT', 'GRADE_DISTRIBUTION_REPORT', 'GRADE_APPEAL_MINUTES'].includes(item.code) ||
          item.name.toLowerCase().includes('điểm') ||
          item.name.toLowerCase().includes('phúc khảo') ||
          item.name.toLowerCase().includes('báo cáo')
        );
      }
      if (categoryFilter === 'ACADEMIC') {
        return (
          ['SUBJECT_DIRECTORY', 'DEPARTMENT_DIRECTORY', 'CLASS_DIRECTORY', 'EXAM_ROOM_DIRECTORY', 'EXAM_PERIOD_DIRECTORY'].includes(item.code) ||
          item.name.toLowerCase().includes('danh mục') ||
          item.name.toLowerCase().includes('môn học') ||
          item.name.toLowerCase().includes('khoa') ||
          item.name.toLowerCase().includes('lớp') ||
          item.name.toLowerCase().includes('học kỳ')
        );
      }
      if (categoryFilter === 'USERS') {
        return (
          ['STUDENT_DIRECTORY', 'STUDENT_EXAM_PASS', 'TEACHER_DIRECTORY'].includes(item.code) ||
          item.name.toLowerCase().includes('sinh viên') ||
          item.name.toLowerCase().includes('giảng viên') ||
          item.name.toLowerCase().includes('thí sinh') ||
          item.name.toLowerCase().includes('thẻ dự thi')
        );
      }
      return true;
    });
  }, [templates, categoryFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-type-body text-slate-700 dark:text-slate-300">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <span>Đang tải Studio Biểu mẫu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-4 p-3 sm:p-5">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <LayoutTemplate className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-type-page font-semibold text-slate-950 dark:text-slate-50">
                Studio Biểu Mẫu In Ấn
              </h1>
              {draft && activeVersion && (
                <span
                  className={`ui-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-type-helper font-medium ${
                    activeVersion.status === 'PUBLISHED'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  {activeVersion.status === 'PUBLISHED' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Đang phát hành v{activeVersion.version}</span>
                    </>
                  ) : (
                    <span>Bản nháp v{activeVersion.version}</span>
                  )}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-type-helper text-slate-600 dark:text-slate-400 font-normal">
              Chỉnh sửa trực quan, xem trước mẫu in A4 thời gian thực và phát hành đồng bộ cho toàn bộ hệ thống.
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={testPrint}
            disabled={!draft}
            leftIcon={<Printer className="h-4 w-4 text-slate-700 dark:text-slate-300" />}
          >
            In thử ngay
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={duplicate}
            disabled={saving || !draft}
            leftIcon={<Copy className="h-4 w-4 text-slate-700 dark:text-slate-300" />}
          >
            Nhân bản cấu hình
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={saveDraft}
            disabled={saving || !draft}
            leftIcon={<Save className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          >
            Lưu nháp
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={publish}
            disabled={saving || !draft}
            leftIcon={<Send className="h-4 w-4 text-white" />}
          >
            Áp dụng & Phát hành
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[400px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* Left Side: Inspector & Library Panel */}
        <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 p-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-type-body font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Tùy biến Cấu hình</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-type-body font-semibold transition cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60'
              }`}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span>Kho Biểu Mẫu ({templates.length})</span>
            </button>
          </div>

          {/* Tab 1: Template Inspector Form */}
          {activeTab === 'settings' && draft && config && (
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4 space-y-5 divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <span className="text-type-body font-semibold text-slate-950 dark:text-slate-100">
                    Mẫu Cơ Quan Nhanh
                  </span>
                </div>
                <p className="text-type-helper text-slate-600 dark:text-slate-400 font-normal">
                  1-Click để chuyển đổi chuẩn thông tin trường Đại học, THPT hoặc Học viện.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => applyPreset('DAI_HOC')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 text-type-body font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 transition cursor-pointer"
                  >
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <span>Trường Đại học</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('THPT')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 text-type-body font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 transition cursor-pointer"
                  >
                    <School className="h-4 w-4 text-emerald-600" />
                    <span>Trường THPT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('HOC_VIEN')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 text-type-body font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 transition cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Học viện</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('TRUNG_TAM')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 text-type-body font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Trung tâm Khảo thí</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Header & Institution */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <span className="text-type-body font-semibold text-slate-950 dark:text-slate-100">
                    Đơn vị & Tiêu đề
                  </span>
                </div>
                <div className="space-y-2.5">
                  <FormInput
                    label="Tên biểu mẫu"
                    value={draft.name}
                    onChange={(v) => setDraft({ ...draft, name: v })}
                    placeholder="Ví dụ: Đề thi chính thức học kỳ 1"
                  />
                  <FormInput
                    label="Tên cơ quan / Trường"
                    value={config.header.institutionName}
                    onChange={(v) => setHeader('institutionName', v)}
                    placeholder="Ví dụ: BỘ GIÁO DỤC VÀ ĐÀO TẠO hoặc TRƯỜNG THPT NGUYỄN DU"
                  />
                  <FormInput
                    label="Tên Khoa / Bộ môn / Phòng ban"
                    value={config.header.facultyName || ''}
                    onChange={(v) => setHeader('facultyName', v)}
                    placeholder="Ví dụ: KHOA CÔNG NGHỆ THÔNG TIN"
                  />
                  <FormInput
                    label="Tiêu đề in chính"
                    value={config.header.title}
                    onChange={(v) => setHeader('title', v)}
                    placeholder="Ví dụ: ĐỀ THI KẾT THÚC HỌC PHẦN"
                  />
                  <FormInput
                    label="Phụ đề / Học kỳ"
                    value={config.header.subtitle}
                    onChange={(v) => setHeader('subtitle', v)}
                    placeholder="Ví dụ: Học kỳ 1 - Năm học 2025 - 2026"
                  />
                  <FormInput
                    label="Quốc hiệu / Khẩu hiệu"
                    value={config.header.motto || ''}
                    onChange={(v) => setHeader('motto', v)}
                    placeholder="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc"
                  />
                </div>
              </div>

              {/* Section 2: Page Setup & Specific Options */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <span className="text-type-body font-semibold text-slate-950 dark:text-slate-100">
                    Khổ giấy & Bố cục
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <FormSelect
                    label="Khổ giấy"
                    value={config.page.size}
                    onChange={(v) =>
                      updateConfig({
                        ...config,
                        page: { ...config.page, size: v as 'A4' | 'A5' },
                      })
                    }
                    options={[
                      ['A4', 'A4 (Chuẩn)'],
                      ['A5', 'A5 (Nhỏ)'],
                    ]}
                  />
                  <FormSelect
                    label="Hướng giấy"
                    value={config.page.orientation}
                    onChange={(v) =>
                      updateConfig({
                        ...config,
                        page: { ...config.page, orientation: v as 'portrait' | 'landscape' },
                      })
                    }
                    options={[
                      ['portrait', 'Dọc (Portrait)'],
                      ['landscape', 'Ngang (Landscape)'],
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <FormSelect
                    label="Lề trang in"
                    value={String(config.page.marginMm)}
                    onChange={(v) =>
                      updateConfig({
                        ...config,
                        page: { ...config.page, marginMm: Number(v) || 15 },
                      })
                    }
                    options={[
                      ['10', '10 mm (Hẹp)'],
                      ['15', '15 mm (Chuẩn)'],
                      ['20', '20 mm (Rộng)'],
                    ]}
                  />
                  <FormSelect
                    label="Dạng tài liệu"
                    value={config.templateType || 'TABLE'}
                    onChange={(v) =>
                      updateConfig({
                        ...config,
                        templateType: v as TemplateType,
                      })
                    }
                    options={[
                      ['TABLE', 'Bảng dữ liệu'],
                      ['EXAM_PAPER', 'Đề thi chính thức'],
                    ]}
                  />
                </div>

                {/* Specific Options for Exam Papers */}
                {config.templateType === 'EXAM_PAPER' && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-950/30 space-y-2.5">
                    <p className="text-type-body font-semibold text-blue-950 dark:text-blue-200">
                      Tùy chọn Đề thi
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-type-body font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={config.examInfo?.showScoreBox !== false}
                          onChange={(e) => setExamInfo('showScoreBox', e.target.checked)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span>Khung chấm điểm</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-type-body font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={config.examInfo?.showInstructions !== false}
                          onChange={(e) => setExamInfo('showInstructions', e.target.checked)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span>Quy chế phòng thi</span>
                      </label>
                    </div>
                    {config.examInfo?.showInstructions !== false && (
                      <FormInput
                        label="Nội dung quy chế / ghi chú thi"
                        value={
                          config.examInfo?.instructionText ||
                          '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)'
                        }
                        onChange={(v) => setExamInfo('instructionText', v)}
                        placeholder="Nội dung quy chế thi..."
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: Columns for Table Reports */}
              {config.templateType !== 'EXAM_PAPER' && config.columns && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1 rounded-full bg-blue-600" />
                      <span className="text-type-body font-semibold text-slate-950 dark:text-slate-100">
                        Cột hiển thị bảng
                      </span>
                    </div>
                    <span className="text-type-helper text-slate-500 font-normal">
                      {config.columns.filter((c) => c.visible !== false).length}/{config.columns.length} cột
                    </span>
                  </div>
                  <div className="space-y-2">
                    {config.columns.map((column, index) => (
                      <div
                        key={column.key}
                        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <input
                          type="checkbox"
                          aria-label={`Bật/tắt cột ${column.label}`}
                          checked={column.visible !== false}
                          onChange={(e) => {
                            const nextCols = clone(config.columns);
                            nextCols[index].visible = e.target.checked;
                            updateConfig({ ...config, columns: nextCols });
                          }}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <input
                          value={column.label}
                          onChange={(e) => {
                            const nextCols = clone(config.columns);
                            nextCols[index].label = e.target.value;
                            updateConfig({ ...config, columns: nextCols });
                          }}
                          className="h-9 flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <select
                          value={column.align || 'left'}
                          onChange={(e) => {
                            const nextCols = clone(config.columns);
                            nextCols[index].align = e.target.value as Column['align'];
                            updateConfig({ ...config, columns: nextCols });
                          }}
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-type-body font-normal text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <option value="left">Trái</option>
                          <option value="center">Giữa</option>
                          <option value="right">Phải</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Footers & Signatures */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-blue-600" />
                    <span className="text-type-body font-semibold text-slate-950 dark:text-slate-100">
                      Chân trang & Chữ ký
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSigners = [...(config.footer.signers || [])];
                      nextSigners.push({ title: 'CHỨC DANH MỚI', subtitle: '(Ký, ghi rõ họ tên)' });
                      updateConfig({ ...config, footer: { ...config.footer, signers: nextSigners } });
                    }}
                    className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-type-body font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm chữ ký</span>
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
                    placeholder="Ví dụ: Thí sinh nộp lại đề thi cùng bài làm..."
                  />

                  <div className="space-y-2">
                    {config.footer.signers.map((signer, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40"
                      >
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
                            placeholder="Chức danh (Ví dụ: HIỆU TRƯỞNG)"
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-type-body font-medium text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                            placeholder="Ghi chú ký (Ví dụ: Ký, đóng dấu)"
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-type-body font-normal text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
                            className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Xóa chữ ký"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Template Library Catalog */}
          {activeTab === 'templates' && (
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-3 space-y-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {(
                  [
                    ['ALL', `Tất cả (${templates.length})`],
                    ['EXAM', '🎓 Khảo thí & Phòng thi'],
                    ['GRADES', '📊 Điểm & Báo cáo'],
                    ['ACADEMIC', '🏫 Danh mục Đào tạo'],
                    ['USERS', '👥 Thí sinh & GV'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key)}
                    className={`rounded-full px-2.5 py-1 text-type-helper font-medium transition cursor-pointer ${
                      categoryFilter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Template Items List */}
              <div className="space-y-1.5">
                {filteredTemplates.map((item) => {
                  const isSelected = item.id === selectedId;
                  const published = item.versions.some((v) => v.status === 'PUBLISHED');
                  const Icon = sourceIcons[item.dataSource] || FileText;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setActiveTab('settings');
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50/90 shadow-sm dark:border-blue-700 dark:bg-blue-950/60'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                          <span
                            className={`text-type-body font-semibold ${
                              isSelected ? 'text-blue-950 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                        {published ? (
                          <span className="ui-pill inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-type-helper font-medium text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>v{item.versions[0]?.version}</span>
                          </span>
                        ) : (
                          <span className="ui-pill inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-type-helper font-medium text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
                            Nháp
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                        <span>{sourceLabels[item.dataSource]}</span>
                        <span>·</span>
                        <span>{item.code}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Visual A4 Canvas Studio */}
        <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-100/80 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {/* Canvas Toolbar Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 rounded-t-2xl">
            <div className="flex items-center gap-2 text-type-body font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Xem trước trực quan thời gian thực</span>
            </div>

            {/* Zoom & Page Size Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-type-helper text-slate-500 dark:text-slate-400 font-medium">
                {config?.page.size || 'A4'} {config?.page.orientation === 'landscape' ? 'Ngang' : 'Dọc'} · {config?.page.marginMm || 15}mm
              </span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(50, z - 15))}
                  className="rounded-xl p-1 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="px-2 text-type-helper font-semibold text-slate-700 dark:text-slate-300">
                  {zoomScale}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(130, z + 15))}
                  className="rounded-xl p-1 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Scroll Area */}
          <div className="flex flex-1 items-start justify-center overflow-auto p-4 sm:p-8">
            {draft && config ? (
              <div
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full flex justify-center"
              >
                {/* Physical Paper Simulation Sheet */}
                <div
                  style={{
                    padding: `${config.page.marginMm}mm`,
                    width: config.page.orientation === 'landscape' ? '297mm' : '210mm',
                    minHeight: config.page.orientation === 'landscape' ? '210mm' : '297mm',
                  }}
                  className="bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 dark:border-slate-700"
                >
                  {/* Paper Content: Exam Paper Format vs Tabular Report Format */}
                  {config.templateType === 'EXAM_PAPER' ? (
                    /* EXAM PAPER FORMAT */
                    <div className="space-y-3 text-type-body leading-relaxed">
                      {/* Header 2 Columns */}
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="font-semibold text-type-body">
                            {config.header.institutionName || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO'}
                          </div>
                          <div className="font-medium text-type-helper mt-0.5">
                            {config.header.facultyName || 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ - KHOA CNTT'}
                          </div>
                          <div className="mx-auto mt-1 w-28 border-t border-slate-800" />
                        </div>
                        <div>
                          <div className="font-semibold text-type-body">
                            {config.header.motto?.split('\n')[0] || 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'}
                          </div>
                          <div className="font-medium italic text-type-helper mt-0.5">
                            {config.header.motto?.split('\n')[1] || 'Độc lập - Tự do - Hạnh phúc'}
                          </div>
                          <div className="mx-auto mt-1 w-28 border-t border-slate-800" />
                        </div>
                      </div>

                      {/* Main Paper Title */}
                      <div className="text-center pt-2">
                        <h2 className="text-type-page font-semibold">
                          {config.header.title || 'ĐỀ THI KẾT THÚC HỌC PHẦN'}
                        </h2>
                        {config.header.subtitle && (
                          <div className="italic text-type-helper mt-0.5 text-slate-700">
                            {config.header.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Subject & Meta Box */}
                      <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-2 text-center text-type-body">
                        <span className="font-semibold">Môn học:</span>{' '}
                        {config.examInfo?.subjectName || 'Lập trình Web Nâng cao'} &nbsp;|&nbsp;{' '}
                        <span className="font-semibold">Mã HP:</span>{' '}
                        {config.examInfo?.subjectCode || 'IT4409'} &nbsp;|&nbsp;{' '}
                        <span className="font-semibold">Thời gian:</span>{' '}
                        {config.examInfo?.durationMinutes || 60} phút
                      </div>

                      {/* Instructions */}
                      {config.examInfo?.showInstructions !== false && (
                        <div className="text-center italic text-type-helper text-slate-700">
                          {config.examInfo?.instructionText ||
                            '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.)'}
                        </div>
                      )}

                      {/* Score Box */}
                      {config.examInfo?.showScoreBox !== false && (
                        <div className="rounded-xl border border-slate-400 overflow-hidden">
                          <div className="grid grid-cols-4 bg-slate-100 font-semibold text-center text-type-helper border-b border-slate-400 p-1.5">
                            <div>Điểm bằng số</div>
                            <div>Điểm bằng chữ</div>
                            <div>Chữ ký CB chấm 1</div>
                            <div>Chữ ký CB chấm 2</div>
                          </div>
                          <div className="grid grid-cols-4 h-12 text-center">
                            <div className="border-r border-slate-400" />
                            <div className="border-r border-slate-400" />
                            <div className="border-r border-slate-400" />
                            <div />
                          </div>
                        </div>
                      )}

                      {/* Realistic Exam Questions Sample */}
                      <div className="space-y-4 pt-1">
                        <div>
                          <div className="font-semibold">
                            Câu 1 (2.0 điểm): Trình bày sự khác biệt giữa Server-Side Rendering (SSR) và Client-Side Rendering (CSR).
                          </div>
                          <div className="mt-2 space-y-3">
                            <div className="border-b border-dashed border-slate-300 h-6" />
                            <div className="border-b border-dashed border-slate-300 h-6" />
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold">
                            Câu 2 (3.0 điểm): Cho biết đặc điểm của kiến trúc Microservices so với Monolith.
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-4 pt-1.5 text-type-body">
                            <div><strong>A.</strong> Dễ mở rộng độc lập từng module</div>
                            <div><strong>B.</strong> Triển khai phức tạp hơn qua mạng</div>
                            <div><strong>C.</strong> Độc lập về công nghệ và CSDL</div>
                            <div><strong>D.</strong> Tất cả các phương án trên</div>
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold">
                            Câu 3 (5.0 điểm): Viết đoạn mã TypeScript thiết kế API Guard xác thực JWT và kiểm tra quyền RBAC.
                          </div>
                          <div className="mt-2 space-y-3">
                            <div className="border-b border-dashed border-slate-300 h-6" />
                            <div className="border-b border-dashed border-slate-300 h-6" />
                            <div className="border-b border-dashed border-slate-300 h-6" />
                          </div>
                        </div>
                      </div>

                      {/* Footer Note */}
                      {config.footer.note && (
                        <p className="italic text-type-helper pt-3 text-slate-700 font-normal">
                          * {config.footer.note}
                        </p>
                      )}

                      {/* Signers Table */}
                      {config.footer.signers.length > 0 && (
                        <div className="pt-6">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            {config.footer.signers.map((s, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="font-semibold text-type-body">{s.title}</div>
                                <div className="italic text-type-helper text-slate-600 min-h-[55px] font-normal">
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
                    </div>
                  ) : (
                    /* TABULAR REPORT FORMAT (SCHEDULES, ROOMS, GRADES, ETC.) */
                    <div className="space-y-3 text-type-body leading-relaxed">
                      {/* Header 2 Columns */}
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="font-semibold text-type-body">
                            {config.header.institutionName || 'HỆ THỐNG QUẢN LÝ KHẢO THÍ'}
                          </div>
                          {config.header.facultyName && (
                            <div className="font-medium text-type-helper mt-0.5">
                              {config.header.facultyName}
                            </div>
                          )}
                          <div className="mx-auto mt-1 w-24 border-t border-slate-800" />
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

                      {/* Data Table */}
                      <div className="pt-2 ui-table-wrap">
                        <table className="ui-table w-full border-collapse border border-slate-700 text-type-body">
                          <thead>
                            <tr className="bg-slate-100 font-semibold">
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
                                      className="border border-slate-700 p-2 font-normal text-type-body"
                                    >
                                      {row[c.key] ?? '---'}
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
                          <div className="grid grid-cols-2 gap-4 text-center">
                            {config.footer.signers.map((s, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="font-semibold text-type-body">{s.title}</div>
                                <div className="italic text-type-helper text-slate-600 min-h-[55px] font-normal">
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
    </div>
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
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | [string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-type-body font-medium text-slate-800 dark:text-slate-200">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
      >
        {options.map((opt) => {
          const [val, lbl] = Array.isArray(opt) ? opt : [opt, opt];
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </label>
  );
}
