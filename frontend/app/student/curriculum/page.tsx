'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { SortDropdown } from '../../../components/ui/SortDropdown';
import { ColumnToggleDropdown } from '../../../components/ui/ColumnToggleDropdown';
import { Button } from '../../../components/ui/Button';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Search,
  Award,
  Sparkles,
  Building2,
  School,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  List,
  LayoutGrid,
  RefreshCw,
  Printer,
  Download,
  Eye,
  Check,
  BookMarked,
  Info,
} from 'lucide-react';

/* ─── Types ─── */
interface CurriculumItem {
  id: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  type: 'MANDATORY' | 'ELECTIVE';
  recommendedSemester: number;
  note?: string;
  isCompleted?: boolean;
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

interface StatsInfo {
  totalSubjects: number;
  totalCredits: number;
  totalMandatoryCredits: number;
  totalElectiveCredits: number;
  completedCredits: number;
  completedSubjects: number;
}

export default function StudentCurriculumPage() {
  usePageTitle('Khung chương trình đào tạo');
  const router = useRouter();

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<StatsInfo | null>(null);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Toolbar & View state
  const [sortOrder, setSortOrder] = useState('semester_asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [openColumnMenu, setOpenColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    semester: true,
    credits: true,
    type: true,
    status: true,
  });

  // Selection & Pagination
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<CurriculumItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    const authUser = getAuthUser();
    const defaultStudent = {
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
      const res = await api.get('/students/my-curriculum');
      setStudentInfo(res.data.student || defaultStudent);
      setStats(res.data.stats);
      setCurriculumList(res.data.curriculum || []);
    } catch (err: any) {
      setStudentInfo(defaultStudent);
      setToast({
        message: err?.response?.data?.message || err.message || 'Lỗi tải khung chương trình đào tạo',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 600);
    setToast({ message: 'Đã làm mới dữ liệu khung đào tạo', type: 'success' });
  };

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, fetchData]);

  const semesters = useMemo(
    () => Array.from(new Set(curriculumList.map((i) => i.recommendedSemester))).sort((a, b) => a - b),
    [curriculumList]
  );

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    let result = curriculumList.filter((item) => {
      const matchSearch =
        item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
        (item.note || '').toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchSemester = filterSemester === 'ALL' || String(item.recommendedSemester) === filterSemester;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'COMPLETED' && item.isCompleted) ||
        (filterStatus === 'INCOMPLETE' && !item.isCompleted);
      return matchSearch && matchType && matchSemester && matchStatus;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortOrder === 'semester_asc') return a.recommendedSemester - b.recommendedSemester;
      if (sortOrder === 'semester_desc') return b.recommendedSemester - a.recommendedSemester;
      if (sortOrder === 'name_asc') return a.subjectName.localeCompare(b.subjectName, 'vi');
      if (sortOrder === 'name_desc') return b.subjectName.localeCompare(a.subjectName, 'vi');
      if (sortOrder === 'credits_desc') return b.credits - a.credits;
      if (sortOrder === 'credits_asc') return a.credits - b.credits;
      return a.id - b.id;
    });

    return result;
  }, [curriculumList, search, filterType, filterSemester, filterStatus, sortOrder]);

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

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelected((prev) => [...prev, id]);
    } else {
      setSelected((prev) => prev.filter((item) => item !== id));
    }
  };

  const completionPercentage = stats?.totalCredits
    ? Math.min(100, Math.round(((stats.completedCredits || 0) / stats.totalCredits) * 100))
    : 0;

  const KPI_CARDS = [
    {
      title: 'Tổng số môn học',
      value: stats?.totalSubjects ?? 0,
      subtext: `${stats?.completedSubjects ?? 0} môn đã hoàn thành`,
      progressPercent: stats?.totalSubjects ? 100 : 0,
      icon: BookOpen,
      unit: ' môn',
    },
    {
      title: 'Tổng số tín chỉ',
      value: stats?.totalCredits ?? 0,
      subtext: `${stats?.completedCredits ?? 0} TC đã tích lũy (${completionPercentage}%)`,
      progressPercent: stats?.totalCredits ? 100 : 0,
      icon: Layers,
      unit: ' TC',
    },
    {
      title: 'Môn bắt buộc',
      value: stats?.totalMandatoryCredits ?? 0,
      subtext: 'Khối kiến thức cốt lõi',
      progressPercent: stats?.totalCredits ? Math.round(((stats.totalMandatoryCredits || 0) / stats.totalCredits) * 100) : 0,
      icon: Award,
      unit: ' TC',
    },
    {
      title: 'Môn tự chọn',
      value: stats?.totalElectiveCredits ?? 0,
      subtext: 'Chuyên ngành tự chọn',
      progressPercent: stats?.totalCredits ? Math.round(((stats.totalElectiveCredits || 0) / stats.totalCredits) * 100) : 0,
      icon: GraduationCap,
      unit: ' TC',
    },
    {
      title: 'Tiến độ đào tạo',
      value: completionPercentage,
      subtext: `${(stats?.totalSubjects ?? 0) - (stats?.completedSubjects ?? 0)} môn chưa tích lũy`,
      progressPercent: completionPercentage,
      icon: CheckCircle2,
      unit: '%',
    },
  ];

  const handlePrintReport = () => {
    printReport({
      title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO CÁ NHÂN',
      subtitle: `Sinh viên: ${studentInfo?.fullName || ''} (${studentInfo?.studentCode || ''}) - Lớp: ${studentInfo?.className || ''} - Khoa: ${studentInfo?.departmentName || ''}`,
      metaInfo: [
        { label: 'Tổng số môn học', value: `${stats?.totalSubjects ?? 0} môn` },
        { label: 'Tổng số tín chỉ', value: `${stats?.totalCredits ?? 0} TC` },
        { label: 'Đã hoàn thành', value: `${stats?.completedCredits ?? 0} TC (${completionPercentage}%)` },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Học kỳ', width: '70px', align: 'center' },
        { header: 'Mã môn', width: '80px', align: 'center' },
        { header: 'Tên môn học', width: '220px' },
        { header: 'Số TC', width: '60px', align: 'center' },
        { header: 'Loại môn', width: '90px', align: 'center' },
        { header: 'Trạng thái', width: '100px', align: 'center' },
      ],
      rows: filteredList.map((item, idx) => [
        idx + 1,
        `HK ${item.recommendedSemester}`,
        item.subjectCode,
        item.subjectName,
        `${item.credits} TC`,
        item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn',
        item.isCompleted ? 'Đã học' : 'Chưa tích lũy',
      ]),
      signers: [
        { title: 'SINH VIÊN', subtitle: '(Ký và ghi rõ họ tên)' },
        { title: 'PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToFormattedExcel({
      filename: `Khung_chuong_trinh_${studentInfo?.studentCode || 'sinh_vien'}`,
      title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO CÁ NHÂN',
      subtitle: `Sinh viên: ${studentInfo?.fullName} (${studentInfo?.studentCode}) · Lớp: ${studentInfo?.className} · Khoa: ${studentInfo?.departmentName}`,
      columns: [
        { header: 'STT', width: 8, align: 'center' },
        { header: 'Học kỳ', width: 14, align: 'center' },
        { header: 'Mã môn học', width: 14, align: 'center' },
        { header: 'Tên môn học', width: 35, align: 'left' },
        { header: 'Số tín chỉ', width: 12, align: 'center' },
        { header: 'Loại môn', width: 16, align: 'center' },
        { header: 'Trạng thái', width: 16, align: 'center' },
        { header: 'Ghi chú', width: 25, align: 'left' },
      ],
      rows: filteredList.map((item, idx) => [
        idx + 1,
        `Học kỳ ${item.recommendedSemester}`,
        item.subjectCode,
        item.subjectName,
        `${item.credits} TC`,
        item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn',
        item.isCompleted ? 'Đã học' : 'Chưa tích lũy',
        item.note || '',
      ]),
    });
  };

  const columnsList = [
    { key: 'code', label: 'Mã môn học' },
    { key: 'name', label: 'Tên môn học' },
    { key: 'semester', label: 'Học kỳ đào tạo' },
    { key: 'credits', label: 'Số tín chỉ' },
    { key: 'type', label: 'Loại môn' },
    { key: 'status', label: 'Trạng thái' },
  ];

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, totalItems);

  const paginationPages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) paginationPages.push(i);
  } else {
    paginationPages.push(1);
    if (page > 3) paginationPages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      if (!paginationPages.includes(i)) paginationPages.push(i);
    }
    if (page < totalPages - 2) paginationPages.push('...');
    if (!paginationPages.includes(totalPages)) paginationPages.push(totalPages);
  }

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-0.5">
            <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Khung Chương Trình Đào Tạo
            </h1>
            <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
              Sinh viên: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.fullName || '---'}</strong> <IdentifierBadge tone="neutral">{studentInfo?.studentCode || '---'}</IdentifierBadge> &nbsp;•&nbsp; Lớp: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.className || studentInfo?.classCode || '---'}</strong> &nbsp;•&nbsp; Khoa: {studentInfo?.departmentName || studentInfo?.departmentCode || '---'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportExcel}
              leftIcon={<Download className="h-4 w-4 text-slate-500" />}
            >
              Xuất Excel
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handlePrintReport}
              leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
            >
              In Khung Đào Tạo
            </Button>
          </div>
        </div>

        {/* ── 2. Standard 5 KPI Cards Row With Micro Progress Tracks ── */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {KPI_CARDS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                      {item.title}
                    </span>
                    <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                      {item.value.toLocaleString('vi-VN')}
                      {item.unit || ''}
                    </div>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                    <IconComponent className="h-5 w-5 stroke-[2.2]" />
                  </div>
                </div>

                {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                  />
                </div>

                <div className="mt-2.5">
                  <span
                    title={item.subtext}
                    className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                  >
                    {item.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 3. Standard Filter Card Toolbar ── */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo mã môn, tên môn học..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-9 text-[14px] font-medium text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Semester Filter */}
            <FilterSelect
              size="sm"
              value={filterSemester}
              onChange={(e) => {
                setFilterSemester(e.target.value);
                setPage(1);
              }}
              className="w-full"
            >
              <option value="ALL">Tất cả học kỳ đào tạo</option>
              {semesters.map((sem) => (
                <option key={sem} value={String(sem)}>
                  Học kỳ {sem}
                </option>
              ))}
            </FilterSelect>

            {/* Type Filter */}
            <FilterSelect
              size="sm"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full"
            >
              <option value="ALL">Tất cả loại môn học</option>
              <option value="MANDATORY">Môn bắt buộc</option>
              <option value="ELECTIVE">Môn tự chọn</option>
            </FilterSelect>

            {/* Status Filter */}
            <FilterSelect
              size="sm"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full"
            >
              <option value="ALL">Tất cả trạng thái tích lũy</option>
              <option value="COMPLETED">Đã hoàn thành (Đã học)</option>
              <option value="INCOMPLETE">Chưa tích lũy tín chỉ</option>
            </FilterSelect>
          </div>
        </div>

        {/* ── 4. Standard Table Toolbar (Total Count, Sort, Column Toggle, View Mode, Refresh) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-1">
          <span className="text-[15px] font-normal text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems.toLocaleString('vi-VN')}</span> môn học trong khung
          </span>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <FilterSelect
              size="sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="min-w-[190px]"
            >
              <option value="semester_asc">Học kỳ: Tăng dần</option>
              <option value="semester_desc">Học kỳ: Giảm dần</option>
              <option value="name_asc">Tên môn: A - Z</option>
              <option value="name_desc">Tên môn: Z - A</option>
              <option value="credits_desc">Số tín chỉ: Cao nhất</option>
              <option value="credits_asc">Số tín chỉ: Thấp nhất</option>
            </FilterSelect>

            {/* Column Selector */}
            <ColumnToggleDropdown
              columns={columnsList}
              visibleColumns={visibleColumns}
              onToggle={handleColumnToggle}
            />

            {/* View Mode Group */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-xl p-1.5 transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dạng Danh sách chuẩn"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-xl p-1.5 transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dạng Lưới card"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`rounded-xl p-1.5 transition cursor-pointer ${
                  viewMode === 'compact' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dạng Thu gọn"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleManualRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer select-none"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── 5. Standard Content (List / Grid / Compact) ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang tải Khung chương trình đào tạo...</p>
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy môn học nào</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm">
              Không có môn học nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── 5.1 Grid View Mode ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {currentItems.map((item) => {
              const isChecked = selected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 space-y-3 flex flex-col justify-between ${
                    isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="tabular-nums font-medium text-xs text-slate-600 hover:text-blue-600 transition cursor-pointer"
                        >
                          <IdentifierBadge>{item.subjectCode}</IdentifierBadge>
                        </button>
                      </div>

                      <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                        HK {item.recommendedSemester}
                      </span>
                    </div>

                    <div>
                      <h4
                        onClick={() => setDetailItem(item)}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 transition"
                      >
                        {item.subjectName}
                      </h4>
                      {item.note && <p className="text-xs text-slate-400 font-normal mt-0.5 italic truncate">{item.note}</p>}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Số tín chỉ:</span>
                        <strong className="font-semibold text-slate-900 dark:text-slate-100">{item.credits} TC</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Loại môn:</span>
                        {item.type === 'MANDATORY' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <Award className="h-3.5 w-3.5 text-blue-600" /> Bắt buộc
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-500" /> Tự chọn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {item.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Đã học
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Chưa tích lũy
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailItem(item)}
                      leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
                      className="ml-auto"
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 5.2 List & Compact Table Mode ── */
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[13px] font-semibold text-slate-600 dark:text-slate-400 select-none">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    {visibleColumns.code && <th className="py-3 px-4 font-semibold">Mã môn học</th>}
                    {visibleColumns.name && <th className="py-3 px-4 font-semibold">Tên môn học</th>}
                    {visibleColumns.semester && <th className="py-3 px-4 font-semibold text-center">Học kỳ</th>}
                    {visibleColumns.credits && <th className="py-3 px-4 font-semibold text-center">Số TC</th>}
                    {visibleColumns.type && <th className="py-3 px-4 font-semibold">Loại môn</th>}
                    {visibleColumns.status && <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>}
                    <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.map((item) => {
                    const isChecked = selected.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isChecked ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                            className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        {visibleColumns.code && (
                          <td className="py-3.5 px-4">
                            <IdentifierBadge>{item.subjectCode}</IdentifierBadge>
                          </td>
                        )}
                        {visibleColumns.name && (
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer transition" onClick={() => setDetailItem(item)}>
                              {item.subjectName}
                            </div>
                            {item.note && <p className="text-xs text-slate-400 italic truncate max-w-md">{item.note}</p>}
                          </td>
                        )}
                        {visibleColumns.semester && (
                          <td className="py-3.5 px-4 text-center font-medium text-slate-600 dark:text-slate-400">
                            HK {item.recommendedSemester}
                          </td>
                        )}
                        {visibleColumns.credits && (
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                            {item.credits}
                          </td>
                        )}
                        {visibleColumns.type && (
                          <td className="py-3.5 px-4">
                            {item.type === 'MANDATORY' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                <Award className="h-3.5 w-3.5" /> Bắt buộc
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                <GraduationCap className="h-3.5 w-3.5" /> Tự chọn
                              </span>
                            )}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="py-3.5 px-4 text-center">
                            {item.isCompleted ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Đã học
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <Clock className="h-3.5 w-3.5 text-slate-400" /> Chưa học
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailItem(item)}
                            leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
                          >
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. Pagination Bar ── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hiển thị <strong className="text-slate-900 dark:text-slate-100">{startItem}</strong> - <strong className="text-slate-900 dark:text-slate-100">{endItem}</strong> trên tổng số <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> môn học
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {paginationPages.map((pg, idx) => (
                typeof pg === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPage(pg)}
                    className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                      page === pg
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-slate-400 text-xs">...</span>
                )
              ))}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 7. Detail Course Drawer ── */}
        <ProfileDrawer
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailItem?.subjectName || ''}
          subtitle={`Mã môn: ${detailItem?.subjectCode}`}
          avatarText={detailItem?.subjectCode?.slice(0, 2) || 'CT'}
          badge={{
            label: `Học kỳ ${detailItem?.recommendedSemester}`,
            className: 'bg-blue-50 text-blue-700 border border-blue-200',
          }}
          details={[
            { label: 'Tên môn học', value: detailItem?.subjectName, icon: BookOpen },
            { label: 'Mã môn học', value: detailItem?.subjectCode, icon: Info },
            { label: 'Học kỳ đào tạo', value: detailItem ? `Học kỳ ${detailItem.recommendedSemester}` : '', icon: BookMarked },
            { label: 'Số tín chỉ', value: detailItem ? `${detailItem.credits} Tín chỉ` : '', icon: Layers },
            { label: 'Phân loại môn', value: detailItem?.type === 'MANDATORY' ? 'Môn bắt buộc' : 'Môn tự chọn', icon: Award },
            ...(detailItem?.note ? [{ label: 'Ghi chú', value: detailItem.note }] : []),
          ]}
          extraSections={detailItem ? [
            {
              title: 'Trạng thái tích lũy',
              content: detailItem.isCompleted ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 p-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-blue-900 dark:text-blue-100">Đã hoàn thành</p>
                    <p className="text-[12px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Sinh viên đã tích lũy đủ tín chỉ môn học này</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Chưa tích lũy</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Cần đăng ký học theo đúng kế hoạch đào tạo</p>
                  </div>
                </div>
              ),
            },
          ] : undefined}
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </>
  );
}
