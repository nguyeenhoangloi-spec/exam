'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronRight,
} from 'lucide-react';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { FilterSelect } from '../../../components/ui/FilterSelect';
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
    { index: 1, gradeBand: 'Điểm A (8.5 - 10.0)', studentCount: '45 sinh viên', ratio: '25.0%', note: 'Xuất sắc & Giỏi' },
    { index: 2, gradeBand: 'Điểm B / B+ (7.0 - 8.4)', studentCount: '82 sinh viên', ratio: '45.6%', note: 'Khá' },
    { index: 3, gradeBand: 'Điểm C / C+ (5.5 - 6.9)', studentCount: '41 sinh viên', ratio: '22.8%', note: 'Trung bình khá' },
    { index: 4, gradeBand: 'Điểm D / D+ (4.0 - 5.4)', studentCount: '8 sinh viên', ratio: '4.4%', note: 'Trung bình' },
    { index: 5, gradeBand: 'Điểm F (< 4.0)', studentCount: '4 sinh viên', ratio: '2.2%', note: 'Không đạt (Học lại)' },
  ],
  GRADE_APPEAL_MINUTES: [
    { index: 1, appealCode: 'PK-2026-001', student: 'Nguyễn Văn An (SV20260001)', subject: 'Lập trình Web', originalScore: '6.5', reviewedScore: '7.5', result: 'Tăng 1.0 điểm', reviewer: 'TS. Trần Hải' },
    { index: 2, appealCode: 'PK-2026-002', student: 'Lê Hoàng Cường (SV20260003)', subject: 'Mạng máy tính', originalScore: '4.5', reviewedScore: '4.5', result: 'Giữ nguyên', reviewer: 'ThS. Lê Thu Hà' },
  ],
  STUDENT_EXAM_PASS: [
    { index: 1, examNumber: 'SBD-001', studentCode: 'SV20260001', student: 'Nguyễn Văn An', subject: 'Lập trình Web Nâng cao', date: '15/12/2025 07:30', room: 'P.301 (Ghế 01)', note: 'Đủ điều kiện dự thi' },
    { index: 2, examNumber: 'SBD-001', studentCode: 'SV20260001', student: 'Nguyễn Văn An', subject: 'Mạng máy tính', date: '16/12/2025 09:30', room: 'P.405 (Ghế 12)', note: 'Đủ điều kiện dự thi' },
  ],
  SUBJECT_DIRECTORY: [
    { index: 1, code: 'IT4409', name: 'Lập trình Web Nâng cao', credits: '3 TC', department: 'Khoa Công nghệ Thông tin', examType: 'Tự luận + Trắc nghiệm' },
    { index: 2, code: 'IT3080', name: 'Mạng máy tính', credits: '3 TC', department: 'Khoa Công nghệ Thông tin', examType: 'Trắc nghiệm máy' },
    { index: 3, code: 'IT2000', name: 'Cấu trúc dữ liệu & Giải thuật', credits: '4 TC', department: 'Khoa Công nghệ Thông tin', examType: 'Tự luận' },
  ],
  DEPARTMENT_DIRECTORY: [
    { index: 1, code: 'CNTT', name: 'Khoa Công nghệ Thông tin', head: 'PGS.TS Nguyễn Văn A', phone: '024.3869.1234', email: 'cntt@sis.edu.vn' },
    { index: 2, code: 'DTVT', name: 'Khoa Điện tử Viễn thông', head: 'TS. Trần Văn B', phone: '024.3869.5678', email: 'dtvt@sis.edu.vn' },
  ],
  CLASS_DIRECTORY: [
    { index: 1, code: 'CNTT-K68A', name: 'Lớp CNTT Khóa 68 A', count: '45 sinh viên', teacher: 'TS. Trần Hải', department: 'Khoa CNTT' },
    { index: 2, code: 'CNTT-K68B', name: 'Lớp CNTT Khóa 68 B', count: '42 sinh viên', teacher: 'ThS. Lê Thu Hà', department: 'Khoa CNTT' },
  ],
  EXAM_ROOM_DIRECTORY: [
    { index: 1, code: 'P.301-B1', building: 'Tòa nhà B1', capacity: '40 chỗ', type: 'Phòng thi tiêu chuẩn', status: 'Sẵn sàng' },
    { index: 2, code: 'P.405-D3', building: 'Tòa nhà D3', capacity: '50 chỗ', type: 'Phòng thi máy tính', status: 'Sẵn sàng' },
  ],
  EXAM_PERIOD_DIRECTORY: [
    { index: 1, name: 'Học kỳ 1 (2025 - 2026)', startDate: '01/12/2025', endDate: '30/12/2025', state: 'Đang diễn ra', note: 'Kỳ thi chính thức' },
    { index: 2, name: 'Học kỳ 2 (2025 - 2026)', startDate: '01/05/2026', endDate: '30/05/2026', state: 'Dự kiến', note: 'Kế hoạch năm' },
  ],
};

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

export default function DocumentTemplatesPage() {
  usePageTitle('Mẫu biểu in ấn');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(95);
  const [activeTab, setActiveTab] = useState<'settings' | 'templates'>('settings');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'EXAM' | 'GRADES' | 'ACADEMIC' | 'USERS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
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
        setConfig(clone(latestVersion.config));
      }
    } else {
      setDraft(null);
      setConfig(null);
    }
  }, [selected]);

  const updateConfig = (next: Config) => {
    setConfig(next);
  };

  const setHeader = (field: keyof Config['header'], value: string) => {
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

  const applyPreset = (preset: 'DAI_HOC' | 'THPT' | 'HOC_VIEN' | 'TRUNG_TAM') => {
    if (!config) return;
    if (preset === 'DAI_HOC') {
      updateConfig({
        ...config,
        header: {
          ...config.header,
          institutionName: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO',
          facultyName: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        footer: {
          ...config.footer,
          signers: [
            { title: 'TRƯỞNG KHOA', subtitle: '(Ký, ghi rõ họ tên)' },
            { title: 'CÁN BỘ COI THI 1', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      });
      setToast({ type: 'success', message: 'Đã áp dụng mẫu Đại học.' });
    } else if (preset === 'THPT') {
      updateConfig({
        ...config,
        header: {
          ...config.header,
          institutionName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
          facultyName: 'TRƯỜNG THPT CHUYÊN NGUYỄN HUỆ',
          motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
        },
        footer: {
          ...config.footer,
          signers: [
            { title: 'HIỆU TRƯỞNG', subtitle: '(Ký, đóng dấu)' },
            { title: 'GIÁM THỊ PHÒNG THI', subtitle: '(Ký, ghi rõ họ tên)' },
          ],
        },
      });
      setToast({ type: 'success', message: 'Đã áp dụng mẫu THPT.' });
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
      setToast({ type: 'success', message: 'Đã áp dụng mẫu Học viện.' });
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
      setToast({ type: 'success', message: 'Đã áp dụng mẫu Khảo thí.' });
    }
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

  const handleDeleteTemplate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa biểu mẫu này không?')) return;
    try {
      await api.delete(`/document-templates/${id}`);
      setTemplates((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) {
        const remaining = templates.filter((item) => item.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      setToast({ type: 'success', message: 'Đã xóa biểu mẫu thành công.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Không thể xóa biểu mẫu.' });
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
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

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
  }, [templates, categoryFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-type-body text-slate-700 dark:text-slate-300">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <span className="font-medium">Đang tải Studio Biểu mẫu...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full px-6 py-6 space-y-6 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* 1. Header Phẳng Tự Nhiên */}
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-type-page font-semibold text-slate-900 dark:text-slate-100">
            Mẫu biểu in ấn
          </h1>
          <p className="mt-1 text-type-helper text-slate-500 dark:text-slate-400 font-normal">
            Tùy biến tiêu đề, định dạng trang in A4 và áp dụng trực tiếp toàn hệ thống.
          </p>
        </div>

        {/* Action Button Duy Nhất */}
        <Button
          variant="primary"
          size="md"
          onClick={handleSaveAndApply}
          disabled={saving || !draft}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* 2. Workspace Liền Mạch (2 Cột) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Cột Trái: Sidebar Cấu hình có padding chuẩn p-5 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          {/* Segmented Tab Switcher Thuần Túy */}
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-850">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 rounded-xl py-2 text-type-body font-medium transition cursor-pointer text-center ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Thuộc tính in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`flex-1 rounded-xl py-2 text-type-body font-medium transition cursor-pointer text-center ${
                activeTab === 'templates'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Danh sách mẫu ({templates.length})
            </button>
          </div>

          {/* Tab 1: Cấu hình In ấn */}
          {activeTab === 'settings' && draft && config && (
            <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
              {/* Presets 4 nấc thuần text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                    Mẫu cơ quan nhanh
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-850">
                  <button
                    type="button"
                    onClick={() => applyPreset('DAI_HOC')}
                    className="rounded-xl py-1.5 text-type-helper font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Đại học
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('THPT')}
                    className="rounded-xl py-1.5 text-type-helper font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    THPT
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('HOC_VIEN')}
                    className="rounded-xl py-1.5 text-type-helper font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Học viện
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('TRUNG_TAM')}
                    className="rounded-xl py-1.5 text-type-helper font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Khảo thí
                  </button>
                </div>
              </div>

              {/* Đơn vị & Tiêu đề */}
              <div className="pt-4 space-y-3">
                <span className="block text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  Đơn vị & Tiêu đề
                </span>
                <div className="space-y-2.5">
                  <FormInput
                    label="Tên biểu mẫu"
                    value={draft.name}
                    onChange={(v) => setDraft({ ...draft, name: v })}
                    placeholder="Tên biểu mẫu..."
                  />
                  <FormInput
                    label="Cơ quan / Đơn vị chủ quản"
                    value={config.header.institutionName}
                    onChange={(v) => setHeader('institutionName', v)}
                    placeholder="BỘ GIÁO DỤC VÀ ĐÀO TẠO..."
                  />
                  <FormInput
                    label="Khoa / Bộ môn"
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
                  <FormInput
                    label="Quốc hiệu / Khẩu hiệu"
                    value={config.header.motto || ''}
                    onChange={(v) => setHeader('motto', v)}
                    placeholder="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM..."
                  />
                </div>
              </div>

              {/* Khổ giấy & Bố cục */}
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
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-4">
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

              {/* Cột hiển thị bảng */}
              {config.templateType !== 'EXAM_PAPER' && config.columns && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                      Cột hiển thị bảng
                    </span>
                    <span className="text-type-helper text-slate-400 font-normal">
                      {config.columns.filter((c) => c.visible !== false).length}/{config.columns.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {config.columns.map((column, index) => (
                      <div
                        key={column.key}
                        className="flex items-center gap-2"
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
                          className="h-4 w-4 rounded accent-blue-600 shrink-0"
                        />
                        <input
                          value={column.label}
                          onChange={(e) => {
                            const nextCols = clone(config.columns);
                            nextCols[index].label = e.target.value;
                            updateConfig({ ...config, columns: nextCols });
                          }}
                          className="h-9 flex-1 min-w-0 rounded-xl border border-slate-200/90 bg-white px-2.5 text-type-body font-normal text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                        />
                        <div className="w-22 shrink-0">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chân trang & Chữ ký */}
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
                      <div
                        key={sIdx}
                        className="flex items-center gap-2"
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
                            className="rounded-xl p-2 text-slate-400 hover:text-rose-600 cursor-pointer transition"
                            title="Xóa"
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

          {/* Tab 2: Danh sách biểu mẫu (Phẳng, thuần typography) */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, mã..."
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ['ALL', 'Tất cả'],
                    ['EXAM', 'Khảo thí'],
                    ['GRADES', 'Điểm'],
                    ['ACADEMIC', 'Đào tạo'],
                    ['USERS', 'Hồ sơ'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key)}
                    className={`rounded-xl px-2.5 py-1 text-type-helper font-medium transition cursor-pointer ${
                      categoryFilter === key
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Template Items */}
              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800 pt-1">
                {filteredTemplates.map((item) => {
                  const isSelected = item.id === selectedId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setActiveTab('settings');
                      }}
                      className={`w-full py-2.5 px-3 text-left transition cursor-pointer rounded-xl flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-type-body font-medium">
                          {item.name}
                        </div>
                        <div className="text-type-helper text-slate-400 font-normal">
                          {sourceLabels[item.dataSource]} · {item.code}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {(item.code.startsWith('CUSTOM_') || item.code.includes('_COPY_') || !item.isDefault) && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(item.id, e)}
                            className="p-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            title="Xóa biểu mẫu này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <p className="py-6 text-center text-type-helper text-slate-400">
                    Không tìm thấy biểu mẫu.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cột Phải: Canvas A4 Workspace Trực Quan (Tâm Điểm Thị Giác) */}
        <div className="flex flex-col rounded-2xl bg-slate-100/60 p-4 sm:p-8 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-850 min-h-[750px]">
          {/* Floating Context Toolbar Mini */}
          <div className="mx-auto mb-6 flex items-center justify-between gap-3.5 rounded-full border border-slate-200/90 bg-white/90 px-4 py-1.5 shadow-2xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
            <span className="text-type-helper font-medium text-slate-600 dark:text-slate-300">
              {config?.page.size || 'A4'} {config?.page.orientation === 'landscape' ? 'Ngang' : 'Dọc'} · Lề {config?.page.marginMm || 15}mm
            </span>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(50, z - 10))}
                className="rounded-xl p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(95)}
                className="px-1 text-type-badge font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 cursor-pointer"
                title="Đặt lại 95%"
              >
                {zoomScale}%
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(130, z + 10))}
                className="rounded-xl p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <button
              type="button"
              onClick={testPrint}
              disabled={!draft}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-type-helper font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              title="In trang này"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In</span>
            </button>
          </div>

          {/* Vùng Render Tờ Giấy A4 */}
          <div className="flex flex-1 items-start justify-center overflow-auto pb-6">
            {draft && config ? (
              <div
                style={{
                  transform: `scale(${zoomScale / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="flex justify-center"
              >
                {/* Simulation Paper Sheet */}
                <div
                  style={{
                    padding: `${config.page.marginMm}mm`,
                    width: config.page.orientation === 'landscape' ? '297mm' : '210mm',
                    minHeight: config.page.orientation === 'landscape' ? '210mm' : '297mm',
                  }}
                  className="bg-white text-slate-900 shadow-xl rounded-sm border border-slate-300 dark:border-slate-700"
                >
                  {/* Paper Content: Exam Paper vs Tabular Report */}
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
