'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api, { getCachedData } from '../../../lib/api';
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
  TabBar,
  KPICards,
} from '../../../components/ui';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { StudentCurriculumFilterPopover } from '../../../components/student-curriculum/StudentCurriculumFilterPopover';
import { StudentCurriculumBulkAction } from '../../../components/student-curriculum/StudentCurriculumBulkAction';
import { PageSkeleton } from '../../../components/ui/Skeleton';
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
  BookmarkCheck,
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
  usePageTitle('Chương trình đào tạo');
  const router = useRouter();

  const cachedData = typeof window !== 'undefined' ? getCachedData<{ student?: StudentInfo; stats?: StatsInfo; curriculum?: CurriculumItem[] }>('/students/my-curriculum') : null;
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(cachedData?.student || null);
  const [stats, setStats] = useState<StatsInfo | null>(cachedData?.stats || null);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>(cachedData?.curriculum || []);
  const [loading, setLoading] = useState(!cachedData);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Toolbar & View state
  const [sortOrder, setSortOrder] = useState('semester_asc');
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
  const [limit, setLimit] = useState(10);

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
      if (!curriculumList.length && !cachedData) setLoading(true);
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
  // Cache and list length are initial loading hints; including them would refetch after state updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      setToast({ message: 'Đã làm mới dữ liệu khung chương trình đào tạo!', type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const semesters = useMemo(() => {
    const sems = Array.from(new Set(curriculumList.map((item) => item.recommendedSemester)));
    return sems.sort((a, b) => a - b);
  }, [curriculumList]);

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    let result = curriculumList.filter((item) => {
      const matchSearch =
        item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchSemester = filterSemester === 'ALL' || item.recommendedSemester === Number(filterSemester);
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'COMPLETED' ? item.isCompleted : !item.isCompleted);

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
      return 0;
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
      title: 'Tín chỉ bắt buộc',
      value: stats?.totalMandatoryCredits ?? 0,
      subtext: 'Khối kiến thức cốt lõi',
      progressPercent: stats?.totalCredits ? Math.round(((stats.totalMandatoryCredits || 0) / stats.totalCredits) * 100) : 0,
      icon: CheckCircle2,
      unit: ' TC',
    },
    {
      title: 'Tín chỉ tự chọn',
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
      subtitle: `Sinh viên: ${studentInfo?.fullName || ''} (${studentInfo?.studentCode || ''}), lớp: ${studentInfo?.className || ''}, khoa: ${studentInfo?.departmentName || ''}`,
      facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
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
      templateCode: 'STUDENT_CURRICULUM_REPORT',
    });
  };

  const handleExportExcel = async () => {
    await exportToFormattedExcel({
      filename: `Khung_chuong_trinh_${studentInfo?.studentCode || 'sinh_vien'}`,
      templateCode: 'STUDENT_CURRICULUM_REPORT',
      title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO',
      subtitle: `Sinh viên: ${studentInfo?.fullName} (${studentInfo?.studentCode}), Lớp: ${studentInfo?.className}, Khoa: ${studentInfo?.departmentName}`,
      columns: [
        { header: 'STT', width: 6, align: 'center' },
        { header: 'Học kỳ', width: 12, align: 'center' },
        { header: 'Mã môn học', width: 14, align: 'center' },
        { header: 'Tên môn học', width: 30, align: 'left' },
        { header: 'Số tín chỉ', width: 12, align: 'center' },
        { header: 'Loại môn', width: 14, align: 'center' },
        { header: 'Trạng thái', width: 14, align: 'center' },
        { header: 'Ghi chú', width: 20, align: 'left' },
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

  if (loading && !curriculumList.length) {
    return <PageSkeleton hasKPIs={true} kpiCount={5} variant="table" />;
  }

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 min-h-screen text-slate-900 dark:text-slate-100">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-0.5">
            <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Chương trình đào tạo
            </h1>
            <div className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Sinh viên: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.fullName || '—'}</strong> <IdentifierBadge tone="neutral">{studentInfo?.studentCode || '—'}</IdentifierBadge>
              </span>
              <span>
                Lớp: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.className || studentInfo?.classCode || '—'}</strong>
              </span>
              <span>
                Khoa: <span className="text-slate-700 dark:text-slate-300 font-medium">{studentInfo?.departmentName || studentInfo?.departmentCode || '—'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <DataActionsDropdown
              onExportExcel={handleExportExcel}
              onPrint={handlePrintReport}
              printLabel="In khung đào tạo"
            />
          </div>
        </div>

        {/* ── 2. Standard 5 KPI Cards Row ── */}
        <KPICards items={KPI_CARDS} columns={5} />


        {/* ── Status TabBar ── */}
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả học phần', count: curriculumList.length },
            { key: 'COMPLETED', label: 'Đã hoàn thành', count: curriculumList.filter((c: any) => c.isCompleted).length },
            { key: 'INCOMPLETE', label: 'Chưa tích lũy', count: curriculumList.filter((c: any) => !c.isCompleted).length },
          ]}
          active={filterStatus}
          onChange={(key) => {
            setFilterStatus(key);
            setPage(1);
          }}
        />

        {/* ── Search & Action Toolbar Row (Single Unified Row) ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
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

              <StudentCurriculumFilterPopover
                filterSemester={filterSemester}
                onFilterSemesterChange={(val) => {
                  setFilterSemester(val);
                  setPage(1);
                }}
                filterType={filterType}
                onFilterTypeChange={(val) => {
                  setFilterType(val);
                  setPage(1);
                }}
                filterStatus={filterStatus}
                onFilterStatusChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                semesters={semesters}
                curriculumList={curriculumList}
                totalFilteredCount={totalItems}
                onResetAll={() => {
                  setSearch('');
                  setFilterSemester('ALL');
                  setFilterType('ALL');
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
                { value: 'semester_asc', label: 'Học kỳ: Tăng dần' },
                { value: 'semester_desc', label: 'Học kỳ: Giảm dần' },
                { value: 'name_asc', label: 'Tên môn: A – Z' },
                { value: 'name_desc', label: 'Tên môn: Z – A' },
                { value: 'credits_desc', label: 'Số tín chỉ: Cao nhất' },
                { value: 'credits_asc', label: 'Số tín chỉ: Thấp nhất' },
              ]}
            />

            {/* Column Selector */}
            <ColumnToggleDropdown
              columns={columnsList}
              visibleColumns={visibleColumns}
              onToggle={handleColumnToggle}
            />
          </div>
        </div>

        {/* ── 5. Standard Content (List / Grid / Compact) ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">Đang tải Khung chương trình đào tạo...</p>
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-type-body font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy môn học nào</h3>
            <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 max-w-sm">
              Không có môn học nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          /* ── 5.1 Standard List View Mode (Default Table) ── */
          <div className="ui-table-wrap rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-type-body-sm font-medium text-slate-600 dark:text-slate-400 select-none">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    {visibleColumns.code && <th className="py-3.5 px-4 font-medium whitespace-nowrap">Mã môn học</th>}
                    {visibleColumns.name && <th className="py-3.5 px-4 font-medium min-w-[240px]">Tên môn học</th>}
                    {visibleColumns.semester && <th className="py-3.5 px-4 font-medium text-center whitespace-nowrap">Học kỳ</th>}
                    {visibleColumns.credits && <th className="py-3.5 px-4 font-medium text-center whitespace-nowrap">Số TC</th>}
                    {visibleColumns.type && <th className="py-3.5 px-4 font-medium whitespace-nowrap">Loại môn</th>}
                    {visibleColumns.status && <th className="py-3.5 px-4 font-medium text-center whitespace-nowrap">Trạng thái</th>}
                    <th className="py-3.5 pr-4 text-right font-medium whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.map((item) => {
                    const isChecked = selected.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-blue-50/20' : ''
                          }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                            className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        {visibleColumns.code && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              className="tabular-nums font-medium text-type-body leading-[22px] text-slate-600 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer"
                            >
                              <IdentifierBadge tone="blue">{item.subjectCode}</IdentifierBadge>
                            </button>
                          </td>
                        )}
                        {visibleColumns.name && (
                          <td className="py-3.5 px-4 min-w-[240px]">
                            <div className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer transition text-type-body" onClick={() => setDetailItem(item)}>
                              {item.subjectName}
                            </div>
                            {item.note && <p className="table-meta text-type-helper text-slate-400 italic truncate max-w-md mt-0.5">{item.note}</p>}
                          </td>
                        )}
                        {visibleColumns.semester && (
                          <td className="py-3.5 px-4 text-center font-normal text-slate-600 dark:text-slate-400 text-type-body tabular-nums">
                            HK {item.recommendedSemester}
                          </td>
                        )}
                        {visibleColumns.credits && (
                          <td className="py-3.5 px-4 text-center font-normal text-slate-700 dark:text-slate-300 text-type-body tabular-nums">
                            {item.credits}
                          </td>
                        )}
                        {visibleColumns.type && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.type === 'MANDATORY' ? (
                              <span className="table-badge inline-flex items-center gap-1.5 text-type-helper font-medium text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Bắt buộc
                              </span>
                            ) : (
                              <span className="table-badge inline-flex items-center gap-1.5 text-type-helper font-medium text-blue-600 dark:text-blue-400">
                                <GraduationCap className="h-3.5 w-3.5" /> Tự chọn
                              </span>
                            )}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {item.isCompleted ? (
                              <span className="table-badge inline-flex items-center gap-1.5 text-type-helper font-medium text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Đã học
                              </span>
                            ) : (
                              <span className="table-badge inline-flex items-center gap-1.5 text-type-helper font-medium text-slate-500 dark:text-slate-400">
                                <Clock className="h-3.5 w-3.5 text-slate-400" /> Chưa học
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer select-none"
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
          </div>
        )}

        {/* ── 6. Pagination Bar ── */}
        {totalItems > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onPage={(p) => setPage(p)}
            onLimit={(l) => {
              setLimit(l);
              setPage(1);
            }}
            unit="môn học"
          />
        )}

        {/* Floating Bulk Action Bar */}
        <StudentCurriculumBulkAction
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
              { header: 'Học kỳ', width: 10, align: 'center' as const },
              { header: 'Tín chỉ', width: 10, align: 'center' as const },
              { header: 'Loại môn', width: 15, align: 'center' as const },
              { header: 'Trạng thái', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((item, idx) => [
              idx + 1,
              item.subjectCode,
              item.subjectName,
              `HK ${item.recommendedSemester}`,
              item.credits,
              item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn',
              item.isCompleted ? 'Đã học' : 'Chưa học',
            ]);
            exportToFormattedExcel({
              filename: 'Khung_chuong_trinh_dao_tao_da_chon.xls',
              title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} học phần`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} môn học ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = currentItems.filter((item) => selected.includes(item.id));
            printReport({
              title: 'CHƯƠNG TRÌNH ĐÀO TẠO ĐÃ CHỌN',
              subtitle: `Tổng số môn học được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng môn học', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã Môn', width: '90px', align: 'center' },
                { header: 'Tên Môn Học', width: '220px' },
                { header: 'Học Kỳ', width: '80px', align: 'center' },
                { header: 'Số TC', width: '70px', align: 'center' },
                { header: 'Loại môn', width: '100px', align: 'center' },
              ],
              rows: selectedItems.map((item, idx) => [
                idx + 1,
                item.subjectCode,
                item.subjectName,
                `HK ${item.recommendedSemester}`,
                String(item.credits),
                item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn',
              ]),
            });
          }}
          onClear={() => setSelected([])}
        />

        {/* ── 7. Detail Course Drawer ── */}
        <ProfileDrawer
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailItem?.subjectName || ''}
          subtitle={detailItem?.subjectCode || ''}
          avatarText={detailItem?.subjectCode?.slice(0, 2)?.toUpperCase() || 'CT'}
          badge={{
            label: detailItem?.isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành',
            status: detailItem?.isCompleted ? 'COMPLETED' : 'PENDING',
          }}
          details={[
            { label: 'Tên học phần', value: detailItem?.subjectName, icon: BookOpen },
            { label: 'Mã học phần', value: <IdentifierBadge tone="blue">{detailItem?.subjectCode || '—'}</IdentifierBadge>, icon: Info },
            { label: 'Học kỳ đào tạo', value: detailItem ? `Học kỳ ${detailItem.recommendedSemester}` : '', icon: BookMarked },
            { label: 'Số tín chỉ', value: detailItem ? `${detailItem.credits} tín chỉ` : '', icon: Layers },
            { label: 'Phân loại học phần', value: detailItem?.type === 'MANDATORY' ? 'Môn học bắt buộc' : 'Môn học tự chọn', icon: BookmarkCheck },
            ...(detailItem?.note ? [{ label: 'Ghi chú học phần', value: detailItem.note }] : []),
          ]}
          extraSections={detailItem ? [
            {
              title: 'Trạng thái tích lũy tín chỉ',
              content: (
                <div className="space-y-3">
                  {detailItem.isCompleted ? (
                    <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 p-3.5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-type-helper font-semibold text-emerald-900 dark:text-emerald-100">Đã tích lũy thành công</p>
                        <p className="text-type-helper text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">Sinh viên đã hoàn thành và tích lũy đủ tín chỉ môn học này.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5">
                      <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-type-helper font-semibold text-slate-700 dark:text-slate-300">Chưa tích lũy</p>
                        <p className="text-type-helper text-slate-500 dark:text-slate-400 font-medium mt-0.5">Cần đăng ký học theo đúng kế hoạch đào tạo của khoa.</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDetailItem(null);
                        router.push('/student/results');
                      }}
                      leftIcon={<Award className="w-3.5 h-3.5 text-blue-600" />}
                      className="w-full justify-center"
                    >
                      Tra cứu điểm thi &amp; Kết quả học tập
                    </Button>
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
