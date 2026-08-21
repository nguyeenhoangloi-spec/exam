'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import {
  Button,
  DataActionsDropdown,
  IdentifierBadge,
  FilterSelect,
  PaginationBar,
  SortDropdown,
  ColumnToggleDropdown,
  ViewModeSegmentedControl,
  TabBar,
} from '../../../components/ui';
import { StudentResultFilterPopover } from '../../../components/student-results/StudentResultFilterPopover';
import { StudentResultBulkAction } from '../../../components/student-results/StudentResultBulkAction';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import { downloadCsv } from '../../../lib/export-csv';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  X,
  MessageSquare,
  CheckCheck,
  AlertCircle,
  SlidersHorizontal,
  List,
  LayoutGrid,
  Layers,
  ChevronLeft,
  ChevronRight,
  Check,
  GraduationCap,
} from 'lucide-react';

interface ExamResultItem {
  id: string;
  attemptId: string | null;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  schoolYear: string;
  semester: string;
  periodName: string;
  examDate: string;
  examType: string;
  roomName: string;
  submissionTime: string | null;
  status: 'PASSED' | 'FAILED' | 'GRADING' | 'UNPUBLISHED';
  score: number | null;
  mcqScore: number | null;
  mcqMax: number | null;
  essayScore: number | null;
  essayMax: number | null;
  lecturerComments: string | null;
  canAppeal: boolean;
  publishedAt: string | null;
}

interface StudentInfo {
  id: number;
  studentCode: string;
  fullName: string;
  className: string;
  classCode: string;
  departmentName: string;
  departmentCode: string;
}

interface SummaryStats {
  totalExams: number;
  avgScore: number;
  passedCount: number;
  failedCount: number;
}

export default function StudentResultsPage() {
  usePageTitle('Kết quả bài thi');
  const router = useRouter();

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalExams: 0,
    avgScore: 0,
    passedCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Toolbar & View state
  const [sortOrder, setSortOrder] = useState<string>('date_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [openColumnMenu, setOpenColumnMenu] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    period: true,
    date: true,
    type: true,
    score: true,
    status: true,
  });

  // Selection & Pagination
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(8);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal State
  const [detailItem, setDetailItem] = useState<ExamResultItem | null>(null);
  const [selectedExamForAppeal, setSelectedExamForAppeal] = useState<ExamResultItem | null>(null);
  const [showAppealModal, setShowAppealModal] = useState<boolean>(false);
  const [appealReason, setAppealReason] = useState<string>('');
  const [submittingAppeal, setSubmittingAppeal] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    const authUser = getAuthUser();
    const defaultStudent: StudentInfo = {
      id: authUser?.student?.id || authUser?.id || 1,
      studentCode: authUser?.student?.studentCode || authUser?.username || 'sv048',
      fullName: authUser?.student?.fullName || (authUser as any)?.fullName || authUser?.username || 'sv048',
      className: authUser?.student?.class?.name || 'CNTT-K18A',
      classCode: authUser?.student?.class?.code || 'CNTT-K18A',
      departmentName: authUser?.student?.class?.department?.name || 'Công nghệ thông tin',
      departmentCode: authUser?.student?.class?.department?.code || 'CNTT',
    };

    try {
      setLoading(true);
      const res = await api.get('/students/my-results');
      if (res.data) {
        setStudentInfo(res.data.student || defaultStudent);
        setStats(res.data.stats || { totalExams: 0, avgScore: 0, passedCount: 0, failedCount: 0 });
        setResults(res.data.results || []);
      }
    } catch (err: any) {
      setStudentInfo(defaultStudent);
      setStats({ totalExams: 0, avgScore: 0, passedCount: 0, failedCount: 0 });
      setResults([]);
      setToast({
        message: err?.message || 'Không thể tải kết quả thi. Vui lòng thử lại sau.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const [myAppeals, setMyAppeals] = useState<any[]>([]);

  const fetchMyAppeals = useCallback(async () => {
    try {
      const res = await api.get('/grade-appeals/my-appeals');
      if (res.data) {
        setMyAppeals(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // fallback silent
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchMyAppeals();
  }, [fetchData, fetchMyAppeals]);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsSpinning(true);
    try {
      await Promise.all([fetchData(), fetchMyAppeals()]);
      setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSpinning(false), 600);
    }
  };

  const handleSubmitAppeal = async () => {
    const target = selectedExamForAppeal || detailItem;
    if (!target || !target.attemptId) {
      setToast({ message: 'Không tìm thấy thông tin lượt thi trực tuyến để gửi đơn phúc khảo.', type: 'error' });
      return;
    }
    if (!appealReason.trim()) {
      setToast({ message: 'Vui lòng nhập chi tiết lý do xin phúc khảo.', type: 'error' });
      return;
    }

    try {
      setSubmittingAppeal(true);
      await api.post('/grade-appeals', {
        attemptId: target.attemptId,
        reason: appealReason.trim(),
      });

      setToast({
        message: 'Gửi yêu cầu phúc khảo thành công! Đơn của bạn đã được chuyển đến Giảng viên / Trưởng bộ môn.',
        type: 'success',
      });
      setShowAppealModal(false);
      setSelectedExamForAppeal(null);
      setAppealReason('');
      fetchData();
      fetchMyAppeals();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Không thể gửi yêu cầu phúc khảo. Vui lòng thử lại sau.',
        type: 'error',
      });
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const academicYears = useMemo(() => {
    const years = Array.from(new Set(results.map((r) => r.schoolYear)));
    return years.sort();
  }, [results]);

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    let result = results.filter((item) => {
      const matchSearch =
        item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
        item.periodName.toLowerCase().includes(search.toLowerCase());

      const matchYear = filterYear === 'ALL' || item.schoolYear === filterYear;
      const matchSemester = filterSemester === 'ALL' || item.semester === filterSemester;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchYear && matchSemester && matchStatus;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortOrder === 'date_desc') return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
      if (sortOrder === 'date_asc') return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      if (sortOrder === 'score_desc') return (b.score || 0) - (a.score || 0);
      if (sortOrder === 'score_asc') return (a.score || 0) - (b.score || 0);
      if (sortOrder === 'code_asc') return a.subjectCode.localeCompare(b.subjectCode, 'vi');
      if (sortOrder === 'name_asc') return a.subjectName.localeCompare(b.subjectName, 'vi');
      return 0;
    });

    return result;
  }, [results, search, filterYear, filterSemester, filterStatus, sortOrder]);

  // Pagination calculations
  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredList.slice(start, start + limit);
  }, [filteredList, page, limit]);

  const allSelected = currentItems.length > 0 && currentItems.every((i) => selected.includes(i.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = currentItems.map((i) => i.id);
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(currentItems.map((i) => i.id));
      setSelected((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelected((prev) => [...prev, id]);
    } else {
      setSelected((prev) => prev.filter((item) => item !== id));
    }
  };

  const passRate = stats.totalExams > 0 ? Math.round((stats.passedCount / stats.totalExams) * 100) : 0;

  const statusCounts = useMemo(() => {
    let all = results.length;
    let passed = 0;
    let failed = 0;
    let grading = 0;
    let unpublished = 0;

    results.forEach((r) => {
      if (r.status === 'PASSED') passed++;
      else if (r.status === 'FAILED') failed++;
      else if (r.status === 'GRADING') grading++;
      else unpublished++;
    });

    return { all, passed, failed, grading, unpublished };
  }, [results]);

  // 4 KPI Cards
  const KPI_CARDS = [
    {
      title: 'Số môn đã thi',
      value: stats.totalExams,
      subtext: 'Tất cả môn đã tham gia',
      progressPercent: stats.totalExams > 0 ? 100 : 0,
      icon: BookOpen,
      unit: ' môn',
    },
    {
      title: 'Điểm trung bình (GPA)',
      value: stats.avgScore.toFixed(1),
      subtext: 'Thang điểm 10',
      progressPercent: Math.min(Math.max(stats.avgScore * 10, 0), 100),
      icon: Award,
      unit: ' / 10',
    },
    {
      title: 'Số môn đạt',
      value: stats.passedCount,
      subtext: 'Hoàn thành môn học',
      progressPercent: stats.totalExams > 0 ? Math.round((stats.passedCount / stats.totalExams) * 100) : 100,
      icon: CheckCircle2,
      unit: ' môn',
    },
    {
      title: 'Số môn chưa đạt',
      value: stats.failedCount,
      subtext: 'Cần đăng ký thi/học lại',
      progressPercent: stats.totalExams > 0 ? Math.round((stats.failedCount / stats.totalExams) * 100) : 0,
      icon: XCircle,
      unit: ' môn',
    },
  ];

  const handleExportExcel = () => {
    exportToFormattedExcel({
      filename: `Ket_qua_thi_${studentInfo?.studentCode || 'sinh_vien'}`,
      title: 'BÁO CÁO KẾT QUẢ THI SINH VIÊN',
      subtitle: `Sinh viên: ${studentInfo?.fullName || ''} (${studentInfo?.studentCode || ''}) · Lớp: ${studentInfo?.className || ''} · Khoa: ${studentInfo?.departmentName || ''}`,
      columns: [
        { header: 'STT', width: 8, align: 'center' },
        { header: 'Mã môn', width: 14, align: 'center' },
        { header: 'Tên môn học', width: 35, align: 'left' },
        { header: 'Kỳ thi', width: 25, align: 'left' },
        { header: 'Ngày thi', width: 14, align: 'center' },
        { header: 'Hình thức', width: 18, align: 'center' },
        { header: 'Điểm số', width: 12, align: 'center' },
        { header: 'Kết quả', width: 16, align: 'center' },
      ],
      rows: filteredList.map((r, idx) => [
        idx + 1,
        r.subjectCode,
        r.subjectName,
        r.periodName,
        new Date(r.examDate).toLocaleDateString('vi-VN'),
        r.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm' : r.examType === 'TU_LUAN' ? 'Tự luận' : 'Hỗn hợp',
        r.score !== null ? r.score.toFixed(1) : '---',
        r.status === 'PASSED' ? 'Đạt' : r.status === 'FAILED' ? 'Chưa đạt' : r.status === 'GRADING' ? 'Đang chấm' : 'Chờ công bố',
      ]),
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO KẾT QUẢ THI SINH VIÊN',
      subtitle: `Sinh viên: ${studentInfo?.fullName || ''} (${studentInfo?.studentCode || ''}) - Lớp: ${studentInfo?.className || ''} - Khoa: ${studentInfo?.departmentName || ''}`,
      metaInfo: [
        { label: 'Số môn đã thi', value: `${stats.totalExams} môn` },
        { label: 'Điểm trung bình (GPA)', value: `${stats.avgScore.toFixed(1)} / 10` },
        { label: 'Số môn đạt', value: `${stats.passedCount} môn` },
        { label: 'Số môn chưa đạt', value: `${stats.failedCount} môn` },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã môn', width: '80px', align: 'center' },
        { header: 'Môn học', width: '180px' },
        { header: 'Kỳ thi', width: '130px' },
        { header: 'Ngày thi', width: '100px', align: 'center' },
        { header: 'Hình thức', width: '110px', align: 'center' },
        { header: 'Điểm', width: '70px', align: 'center' },
        { header: 'Kết quả', width: '90px', align: 'center' },
      ],
      rows: filteredList.map((r, idx) => [
        idx + 1,
        r.subjectCode,
        r.subjectName,
        r.periodName,
        new Date(r.examDate).toLocaleDateString('vi-VN'),
        r.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm' : r.examType === 'TU_LUAN' ? 'Tự luận' : 'Hỗn hợp',
        r.score !== null ? r.score.toFixed(1) : '---',
        r.status === 'PASSED' ? 'Đạt' : r.status === 'FAILED' ? 'Chưa đạt' : r.status === 'GRADING' ? 'Đang chấm' : 'Chờ công bố',
      ]),
      signers: [
        { title: 'SINH VIÊN', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
      ],
    });
  };

  const columnsList = [
    { key: 'code', label: 'Mã môn học' },
    { key: 'name', label: 'Tên môn học' },
    { key: 'period', label: 'Kỳ thi' },
    { key: 'date', label: 'Ngày thi' },
    { key: 'type', label: 'Hình thức thi' },
    { key: 'score', label: 'Điểm số' },
    { key: 'status', label: 'Kết quả' },
  ];

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInlineStatus = (status: ExamResultItem['status']) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-type-helper text-success-500">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-success-500" />
            <span>Đạt</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-type-helper text-danger-600">
            <XCircle className="w-4 h-4 shrink-0 text-danger-600" />
            <span>Chưa đạt</span>
          </span>
        );
      case 'GRADING':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-type-helper text-primary-600">
            <Loader2 className="w-4 h-4 shrink-0 text-primary-600 animate-spin" />
            <span>Đang chấm</span>
          </span>
        );
      case 'UNPUBLISHED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-type-helper text-warning-600">
            <Clock className="w-4 h-4 shrink-0 text-warning-600" />
            <span>Chờ công bố</span>
          </span>
        );
    }
  };

  const formatExamType = (type: string) => {
    switch (type) {
      case 'TRAC_NGHIEM':
        return 'Trắc nghiệm';
      case 'TU_LUAN':
        return 'Tự luận';
      case 'DIEN_LO':
      case 'FILL_IN':
        return 'Điền khuyết';
      case 'HON_HOP':
      case 'MIXED':
        return 'Trắc nghiệm & Tự luận';
      case 'VAN_DAP':
      case 'ORAL':
        return 'Vấn đáp';
      case 'THUC_HANH':
      case 'PRACTICE':
        return 'Thực hành';
      default:
        return type;
    }
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-0.5">
            <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Kết quả bài thi
            </h1>
            <div className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Sinh viên: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.fullName || '---'}</strong> <IdentifierBadge tone="neutral">{studentInfo?.studentCode || '---'}</IdentifierBadge>
              </span>
              <span>
                Lớp: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.className || studentInfo?.classCode || '---'}</strong>
              </span>
              <span>
                Khoa: <span className="text-slate-700 dark:text-slate-300 font-medium">{studentInfo?.departmentName || studentInfo?.departmentCode || '---'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <DataActionsDropdown
              onExportExcel={handleExportExcel}
              exportLabel="Xuất file Excel"
              onPrint={handlePrintReport}
              printLabel="In bảng điểm"
            />
          </div>
        </div>

        {/* ── 2. Standard 4 KPI Cards Row With Micro Progress Tracks ── */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_CARDS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                      {item.title}
                    </span>
                    <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                      {item.value}
                      {item.unit || ''}
                    </div>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                    <IconComponent className="h-5 w-5 stroke-[2.2]" />
                  </div>
                </div>

                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                  />
                </div>

                <div className="mt-2.5">
                  <span
                    title={item.subtext}
                    className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                  >
                    {item.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 3. Search & Action Toolbar Row (Single Unified Row) ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã môn, tên môn học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
            />

            {/* Embedded actions on right edge of search input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}

              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

              <StudentResultFilterPopover
                filterYear={filterYear}
                onFilterYearChange={(val) => {
                  setFilterYear(val);
                  setPage(1);
                }}
                filterSemester={filterSemester}
                onFilterSemesterChange={(val) => {
                  setFilterSemester(val);
                  setPage(1);
                }}
                filterStatus={filterStatus}
                onFilterStatusChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                academicYears={academicYears}
                results={results}
                totalFilteredCount={totalItems}
                onResetAll={() => {
                  setSearch('');
                  setFilterYear('ALL');
                  setFilterSemester('ALL');
                  setFilterStatus('ALL');
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Right: Table Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Sort */}
            <SortDropdown
              value={sortOrder}
              onChange={(val) => setSortOrder(val)}
              options={[
                { value: 'date_desc', label: 'Ngày thi: Mới nhất' },
                { value: 'date_asc', label: 'Ngày thi: Cũ nhất' },
                { value: 'score_desc', label: 'Điểm số: Cao nhất' },
                { value: 'score_asc', label: 'Điểm số: Thấp nhất' },
                { value: 'code_asc', label: 'Mã môn: A - Z' },
                { value: 'name_asc', label: 'Tên môn: A - Z' },
              ]}
            />

            {/* Column Selector */}
            <ColumnToggleDropdown
              columns={columnsList}
              visibleColumns={visibleColumns}
              onToggle={handleColumnToggle}
            />

            {/* View Mode Segmented Control */}
            <ViewModeSegmentedControl
              viewMode={viewMode}
              onChange={(mode) => setViewMode(mode)}
            />

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 select-none"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── 4. Status TabBar ── */}
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả kết quả', count: statusCounts.all },
            { key: 'PASSED', label: 'Đạt', count: statusCounts.passed },
            { key: 'FAILED', label: 'Chưa đạt', count: statusCounts.failed },
            { key: 'GRADING', label: 'Đang chấm', count: statusCounts.grading },
            ...(statusCounts.unpublished > 0 ? [{ key: 'UNPUBLISHED', label: 'Chờ công bố', count: statusCounts.unpublished }] : []),
          ]}
          active={filterStatus}
          onChange={(key) => {
            setFilterStatus(key);
            setPage(1);
          }}
        />

        {/* ── 5. Standard Content (List / Grid / Compact) ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-type-helper font-semibold text-slate-500">Đang tải kết quả thi sinh viên...</p>
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Award className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-type-body font-semibold text-slate-800">Không tìm thấy kết quả thi nào</h3>
            <p className="text-type-helper font-medium text-slate-500 max-w-sm">
              Không có kết quả thi nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── 5.1 Grid View Mode ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentItems.map((item) => {
              const isChecked = selected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                    }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="tabular-nums font-medium text-type-helper text-slate-600 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer shrink-0"
                        >
                          <IdentifierBadge tone="blue">{item.subjectCode}</IdentifierBadge>
                        </button>
                      </div>

                      <span className="text-type-helper font-medium text-slate-600 dark:text-slate-400 px-2 py-0.5 ui-pill rounded-full tabular-nums border border-slate-200 dark:border-slate-700">
                        {item.schoolYear}
                      </span>
                    </div>

                    <div>
                      <h4
                        onClick={() => setDetailItem(item)}
                        className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        {item.subjectName}
                      </h4>
                      <p className="text-type-helper text-slate-400 font-normal mt-0.5 truncate">{item.periodName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-type-helper text-slate-600 dark:text-slate-400 font-normal pt-1 border-t border-slate-100/70 dark:border-slate-800/70">
                      <div>
                        <span className="text-slate-400 text-type-helper block">Hình thức</span>
                        <strong className="font-semibold text-slate-900 dark:text-slate-100 text-type-helper block truncate">{formatExamType(item.examType)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-type-helper block">Ngày thi</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-type-helper block">{new Date(item.examDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-type-helper block">Số tín chỉ</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-type-helper block">{item.credits} tín chỉ</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-type-helper block">Điểm số</span>
                        <span className={`font-semibold text-type-helper block ${item.score !== null && item.score >= 4.0 ? 'text-slate-900 dark:text-slate-100' : item.score !== null ? 'text-rose-600' : 'text-slate-400'}`}>
                          {item.score !== null ? `${item.score.toFixed(1)} / 10` : '---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-type-helper">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-type-body-sm font-medium transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Xem chi tiết</span>
                    </button>
                    <div>
                      {renderInlineStatus(item.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'compact' ? (
          /* ── 5.2 Compact View Mode (Dạng Thẻ Thanh Ngang Thu Gọn) ── */
          <div className="space-y-2.5">
            {currentItems.map((item) => {
              const isChecked = selected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                    }`}
                >
                  {/* Left: Checkbox + CodeBadge + Name + Meta Chips */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />

                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="shrink-0"
                    >
                      <IdentifierBadge tone="blue">{item.subjectCode}</IdentifierBadge>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                        >
                          {item.subjectName}
                        </button>
                        <span className="text-type-helper font-medium text-slate-600 dark:text-slate-400 px-2 py-0.5 ui-pill rounded-full">
                          {formatExamType(item.examType)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 text-type-helper text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{item.periodName}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(item.examDate).toLocaleDateString('vi-VN')}</span>
                        </span>
                        {item.roomName && (
                          <span className="text-slate-500 dark:text-slate-400">
                            Phòng: <strong className="text-slate-700 dark:text-slate-300 font-medium">{item.roomName}</strong>
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {item.credits} tín chỉ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score, Status & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.score !== null && (
                      <span className={`text-type-helper font-medium px-2.5 py-1 ui-pill rounded-full border tabular-nums ${item.score >= 4.0
                          ? 'bg-slate-100 text-slate-800 border-slate-200 dark:text-slate-200 dark:border-slate-700'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:text-rose-300'
                        }`}>
                        {item.score.toFixed(1)} điểm
                      </span>
                    )}
                    <div>
                      {renderInlineStatus(item.status)}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                      title="Xem chi tiết kết quả thi"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 5.3 Standard List View Mode (Default Table) ── */
          <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="p-3.5 pl-4 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã môn</th>}
                  {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[240px]">Môn học</th>}
                  {visibleColumns.period !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Kỳ thi</th>}
                  {visibleColumns.date !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Ngày thi</th>}
                  {visibleColumns.type !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Hình thức thi</th>}
                  {visibleColumns.score !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Điểm số</th>}
                  {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Kết quả</th>}
                  <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {currentItems.map((item) => {
                  const isChecked = selected.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40 ${isChecked ? 'bg-blue-50/60 dark:bg-blue-950/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Code */}
                      {visibleColumns.code !== false && (
                        <td className="p-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="tabular-nums font-medium text-type-body leading-[22px] text-slate-600 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer"
                          >
                            <IdentifierBadge tone="blue">{item.subjectCode}</IdentifierBadge>
                          </button>
                        </td>
                      )}

                      {/* Name */}
                      {visibleColumns.name !== false && (
                        <td className="p-3.5 min-w-[240px]">
                          <p
                            onClick={() => setDetailItem(item)}
                            className="font-medium text-slate-900 dark:text-slate-100 text-type-body leading-[22px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            {item.subjectName}
                          </p>
                          <p className="table-meta text-type-helper leading-[20px] text-slate-400 font-normal mt-0.5">{item.credits} tín chỉ</p>
                        </td>
                      )}

                      {/* Period */}
                      {visibleColumns.period !== false && (
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-type-body leading-[22px] font-medium text-slate-700 dark:text-slate-300">
                            {item.periodName}
                          </span>
                        </td>
                      )}

                      {/* Date */}
                      {visibleColumns.date !== false && (
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <span className="text-type-body leading-[22px] font-medium text-slate-600 dark:text-slate-400">
                            {new Date(item.examDate).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                      )}

                      {/* Type */}
                      {visibleColumns.type !== false && (
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-type-body leading-[22px] font-medium text-slate-600 dark:text-slate-400">
                            {formatExamType(item.examType)}
                          </span>
                        </td>
                      )}

                      {/* Score */}
                      {visibleColumns.score !== false && (
                        <td className="p-3.5 whitespace-nowrap text-center">
                          {item.score !== null ? (
                            <span className={`font-semibold text-type-body leading-[22px] ${item.score >= 4.0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>
                              {item.score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="table-meta text-slate-400 font-normal text-type-body-sm leading-[22px] italic">---</span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status !== false && (
                        <td className="p-3.5 whitespace-nowrap">
                          {renderInlineStatus(item.status)}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer select-none"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 6. Standard Pagination Bar (Hiển thị 1 - X trong Y Kết quả, Page Buttons, Rows Per Page) ── */}
        {totalItems > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            limit={limit}
            totalItems={totalItems}
            unit="kết quả thi"
            onPage={(p) => setPage(p)}
            onLimit={(l) => { setLimit(l); setPage(1); }}
            limitOptions={[8, 15, 25, 50]}
          />
        )}

        {/* Floating Bulk Action Bar */}
        <StudentResultBulkAction
          selectedCount={selected.length}
          totalCount={totalItems}
          allSelected={allSelected}
          onToggleAll={() => handleSelectAll(!allSelected)}
          onExportExcel={() => {
            const selectedItems = currentItems.filter((item) => selected.includes(item.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã môn', width: 15 },
              { header: 'Tên môn học', width: 30 },
              { header: 'Tín chỉ', width: 10, align: 'center' as const },
              { header: 'Kỳ thi', width: 20 },
              { header: 'Ngày thi', width: 15, align: 'center' as const },
              { header: 'Điểm số', width: 12, align: 'center' as const },
              { header: 'Kết quả', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((item, idx) => [
              idx + 1,
              item.subjectCode,
              item.subjectName,
              item.credits,
              item.periodName,
              item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : '---',
              item.score !== null ? item.score.toFixed(1) : '---',
              item.status === 'PASSED' ? 'Đạt' : item.status === 'FAILED' ? 'Chưa đạt' : 'Chờ điểm',
            ]);
            exportToFormattedExcel({
              filename: 'Ket_qua_thi_sinh_vien_da_chon.xls',
              title: 'KẾT QUẢ THI SINH VIÊN ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} kết quả học phần`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} kết quả ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = currentItems.filter((item) => selected.includes(item.id));
            printReport({
              title: 'BÁO CÁO KẾT QUẢ THI CÁ NHÂN',
              subtitle: `Tổng số học phần được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng học phần', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã HP', width: '90px', align: 'center' },
                { header: 'Tên Môn Học', width: '220px' },
                { header: 'Số TC', width: '70px', align: 'center' },
                { header: 'Điểm', width: '70px', align: 'center' },
                { header: 'Trạng thái', width: '100px', align: 'center' },
              ],
              rows: selectedItems.map((item, idx) => [
                idx + 1,
                item.subjectCode,
                item.subjectName,
                String(item.credits),
                item.score !== null ? item.score.toFixed(1) : '---',
                item.status === 'PASSED' ? 'Đạt' : item.status === 'FAILED' ? 'Chưa đạt' : 'Chờ điểm',
              ]),
            });
          }}
          onClear={() => setSelected([])}
        />

        {/* ── 7. Detail Result Drawer ── */}
        <ProfileDrawer
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailItem?.subjectName || ''}
          subtitle={detailItem?.subjectCode || ''}
          avatarText={detailItem?.subjectCode?.slice(0, 2)?.toUpperCase() || 'KQ'}
          badge={detailItem ? {
            status: detailItem.status,
            label: detailItem.status === 'PASSED' ? 'Đạt (Qua môn)' : detailItem.status === 'FAILED' ? 'Chưa đạt' : detailItem.status === 'GRADING' ? 'Đang chấm điểm' : 'Chưa công bố',
          } : undefined}
          details={[
            { label: 'Môn thi', value: detailItem?.subjectName, icon: BookOpen },
            { label: 'Mã học phần', value: <IdentifierBadge tone="blue">{detailItem?.subjectCode || '---'}</IdentifierBadge> },
            { label: 'Kỳ thi', value: `${detailItem?.schoolYear} — ${detailItem?.semester}` },
            { label: 'Số tín chỉ', value: `${detailItem?.credits} tín chỉ` },
            { label: 'Ngày thi', value: detailItem?.examDate ? new Date(detailItem.examDate).toLocaleDateString('vi-VN') : '', icon: Calendar },
            { label: 'Hình thức thi', value: detailItem ? formatExamType(detailItem.examType) : '', icon: GraduationCap },
            { label: 'Phòng thi', value: detailItem?.roomName ? <IdentifierBadge tone="neutral">{detailItem.roomName}</IdentifierBadge> : 'Tự do', icon: BookOpen },
            { label: 'Thời gian nộp bài', value: detailItem?.submissionTime ? new Date(detailItem.submissionTime).toLocaleString('vi-VN') : '---', icon: Clock },
          ]}
          extraSections={detailItem ? [
            {
              title: 'Kết quả & Điểm số',
              content: (
                <div className="space-y-3">
                  {detailItem.score !== null ? (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 p-3.5 space-y-2">
                      {detailItem.mcqScore !== null && (
                        <div className="flex items-center justify-between text-type-helper text-slate-700 dark:text-slate-300">
                          <span className="font-medium">Trắc nghiệm</span>
                          <span className="font-semibold tabular-nums">{detailItem.mcqScore.toFixed(1)} / {detailItem.mcqMax?.toFixed(1) || '10.0'}</span>
                        </div>
                      )}
                      {detailItem.essayScore !== null && (
                        <div className="flex items-center justify-between text-type-helper text-slate-700 dark:text-slate-300">
                          <span className="font-medium">Tự luận</span>
                          <span className="font-semibold tabular-nums">{detailItem.essayScore.toFixed(1)} / {detailItem.essayMax?.toFixed(1) || '10.0'}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between">
                        <span className="text-type-helper font-semibold text-slate-800 dark:text-slate-200">Tổng điểm bài thi</span>
                        <span className={`tabular-nums font-semibold text-type-card ${detailItem.score >= 4.0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>{detailItem.score.toFixed(1)} / 10 điểm</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 text-type-helper font-semibold ${detailItem.status === 'GRADING' ? 'text-blue-600' : 'text-amber-600'}`}>
                      {detailItem.status === 'GRADING' ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                      {detailItem.status === 'GRADING' ? 'Bài thi đang trong quá trình chấm điểm.' : 'Điểm số chưa được duyệt công bố.'}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">Trạng thái:</span>
                    {renderInlineStatus(detailItem.status)}
                  </div>

                  {detailItem.attemptId && (
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const id = detailItem.attemptId;
                          setDetailItem(null);
                          if (id) router.push(`/student/online-exam/${id}/result`);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                        className="w-full justify-center"
                      >
                        Xem bài thi
                      </Button>
                    </div>
                  )}

                  {(() => {
                    const existingAppeal = myAppeals.find((a) => a.attemptId === detailItem.attemptId);
                    if (existingAppeal) {
                      const statusLabel = existingAppeal.status === 'PENDING'
                        ? 'Đang chờ duyệt'
                        : existingAppeal.status === 'APPROVED_REGRADE'
                        ? 'Đã duyệt chấm lại'
                        : existingAppeal.status === 'REJECTED'
                        ? 'Bị từ chối'
                        : 'Đang xử lý';
                      return (
                        <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/80 text-type-helper text-amber-800 dark:text-amber-300 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-medium">Đơn phúc khảo: {statusLabel}</span>
                          </div>
                        </div>
                      );
                    }
                    if (detailItem.canAppeal) {
                      return (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedExamForAppeal(detailItem);
                            setShowAppealModal(true);
                          }}
                          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                          className="w-full justify-center"
                        >
                          Xin phúc khảo
                        </Button>
                      );
                    }
                    return null;
                  })()}
                </div>
              ),
            },
            ...(detailItem.lecturerComments ? [{
              title: 'Nhận xét của giảng viên',
              content: (
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-type-helper text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{detailItem.lecturerComments}</p>
                </div>
              ),
            }] : []),
          ] : undefined}
        />

        {/* ── 8. Appeal Modal ── */}
        <Modal
          isOpen={showAppealModal && Boolean(detailItem || selectedExamForAppeal)}
          onClose={() => {
            setShowAppealModal(false);
            setSelectedExamForAppeal(null);
          }}
          title="Gửi yêu cầu phúc khảo"
          subtitle={`Môn học: ${(detailItem || selectedExamForAppeal)?.subjectName} (${(detailItem || selectedExamForAppeal)?.subjectCode})`}
          icon={<MessageSquare className="h-6 w-6 text-white" />}
          badge="Phúc khảo"
          variant="gradient"
          size="md"
        >
          {(detailItem || selectedExamForAppeal) && (
            <div className="space-y-4 text-type-helper -mt-1">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Môn học: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{(detailItem || selectedExamForAppeal)?.subjectName}</strong> ({(detailItem || selectedExamForAppeal)?.subjectCode})
              </p>
              <label className="block font-medium text-slate-700 dark:text-slate-300 text-type-body">
                Lý do xin phúc khảo:
              </label>
              <textarea
                rows={4}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Nhập chi tiết lý do đề nghị chấm lại bài thi..."
                className="w-full min-h-[100px] rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition shadow-2xs"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setShowAppealModal(false);
                    setSelectedExamForAppeal(null);
                  }}
                  disabled={submittingAppeal}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmitAppeal}
                  isLoading={submittingAppeal}
                  leftIcon={<CheckCheck className="h-4 w-4" />}
                >
                  Gửi yêu cầu
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </>
  );
}
