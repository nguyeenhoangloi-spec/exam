'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { TrashPaginationBar } from '../../components/trash/TrashPaginationBar';
import {
  Trash2, RotateCcw, Search, CalendarCheck, FileText, X,
  HelpCircle, RefreshCw, ChevronDown, Clock, Users, Building2, GraduationCap, BookOpen, CheckCircle2, SlidersHorizontal, Eye, MoreVertical, List, LayoutGrid, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { SortDropdown } from '../../components/ui/SortDropdown';
import { ColumnToggleDropdown } from '../../components/ui/ColumnToggleDropdown';

interface TrashItem {
  id: number | string;
  type: string;
  title: string;
  subTitle: string;
  deletedAt: string;
  deletedBy: string;
  raw: any;
}

interface TrashStats {
  total: number;
  schedules: number;
  papers: number;
  questions: number;
  users?: number;
  classes?: number;
  subjects?: number;
}

const categoryLabelMap: Record<string, string> = {
  schedules: 'Lịch thi',
  papers: 'Đề thi',
  questions: 'Câu hỏi',
  users: 'Tài khoản / Sinh viên',
  subjects: 'Môn học',
  classes: 'Lớp học',
};

function TrashPageContent() {
  usePageTitle('Thùng rác hệ thống');
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');

  const [stats, setStats] = useState<TrashStats>({ total: 0, schedules: 0, papers: 0, questions: 0 });
  const [activeCategory, setActiveCategory] = useState<string>(typeParam || 'schedules');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [openColumnMenu, setOpenColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    deletedAt: true,
    expiresIn: true,
    deletedBy: true,
    actions: true,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (typeParam) {
      setActiveCategory(typeParam);
    }
  }, [typeParam]);

  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { },
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<TrashStats>('/trash/stats');
      setStats(res.data);
    } catch (e) {
      console.warn('Failed to fetch trash stats', e);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const fetchType = activeCategory === 'ALL' ? 'schedules' : activeCategory;
      const res = await api.get<TrashItem[]>('/trash/items', {
        params: { type: fetchType, search },
      });
      setItems(res.data || []);
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Không thể tải danh sách thùng rác', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search]);

  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    setIsSpinning(true);
    try {
      await Promise.all([fetchStats(), fetchItems()]);
      setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSpinning(false), 600);
    }
  };

  const sortedItems = useMemo(() => {
    let result = [...items];
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.deletedAt || 0).getTime() - new Date(b.deletedAt || 0).getTime());
    } else if (sortOrder === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [items, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      router.replace('/login');
      return;
    }
    fetchStats();
    fetchItems();
  }, [fetchStats, fetchItems, router]);

  const handleRestore = (item: TrashItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục dữ liệu',
      message: `Bạn có chắc chắn muốn khôi phục "${item.title}" trở lại hệ thống?`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post('/trash/restore', { type: item.type, id: item.id });
          setToast({ message: 'Khôi phục dữ liệu thành công!', type: 'success' });
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Khôi phục thất bại', type: 'error' });
        }
      },
    });
  };

  const handleHardDelete = (item: TrashItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa vĩnh viễn dữ liệu',
      message: `CẢNH BÁO: Thao tác này sẽ XÓA VĨNH VIỄN "${item.title}" khỏi Database và KHÔNG THỂ KHÔI PHỤC! Bạn có chắc chắn?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete('/trash/permanent', { data: { type: item.type, id: item.id } });
          setToast({ message: 'Đã xóa vĩnh viễn dữ liệu khỏi hệ thống!', type: 'success' });
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Xóa vĩnh viễn thất bại', type: 'error' });
        }
      },
    });
  };

  const getRemainingDays = (deletedAt?: string) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number | string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleAutoClean = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Tự động dọn dẹp Thùng Rác',
      message: 'Hệ thống sẽ quét và XÓA VĨNH VIỄN toàn bộ các bản ghi trong Thùng rác đã quá 30 ngày. Bạn có chắc chắn muốn thực hiện?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await api.post('/trash/auto-clean');
          const count = res.data?.totalCleaned ?? 0;
          setToast({
            message: count > 0 ? `🧹 Đã tự động dọn dẹp vĩnh viễn ${count} bản ghi quá 30 ngày!` : 'Thành công: Không có bản ghi nào quá 30 ngày cần dọn dẹp.',
            type: 'success',
          });
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Không thể dọn dẹp thùng rác', type: 'error' });
        }
      },
    });
  };

  const CATEGORY_MAP: Record<string, { title: string; subtitle: string; label: string }> = {
    schedules: { title: 'Lịch thi đã xóa', subtitle: 'Quản lý các lịch thi khảo thí đã bị xóa tạm thời', label: 'Lịch thi đã xóa' },
    papers: { title: 'Đề thi đã xóa', subtitle: 'Quản lý các bộ đề thi trắc nghiệm & tự luận đã bị xóa tạm thời', label: 'Đề thi đã xóa' },
    questions: { title: 'Ngân hàng câu hỏi đã xóa', subtitle: 'Quản lý các câu hỏi trong ngân hàng đã bị xóa tạm thời', label: 'Ngân hàng câu hỏi' },
    users: { title: 'Người dùng & Sinh viên đã xóa', subtitle: 'Quản lý tài khoản người dùng và sinh viên đã bị khóa/xóa', label: 'Tài khoản / Sinh viên' },
    subjects: { title: 'Môn học đã xóa', subtitle: 'Quản lý các môn học đã bị tạm ẩn khỏi hệ thống', label: 'Môn học' },
    classes: { title: 'Lớp học đã xóa', subtitle: 'Quản lý các lớp học đã bị tạm ẩn khỏi hệ thống', label: 'Lớp học' },
  };

  const currentCategoryInfo = CATEGORY_MAP[activeCategory] || {
    title: 'Lịch thi đã xóa',
    subtitle: 'Quản lý các dữ liệu đã bị xóa tạm thời theo danh mục đã chọn',
    label: 'Lịch thi',
  };

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Page Header Động Theo Đúng Mục Đang Chọn */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 tracking-tight flex items-center gap-2">
            {currentCategoryInfo.title}
            <span className="text-[13px] font-semibold text-slate-500">
              {items.length} mục
            </span>
          </h1>
          <p className="text-[15px] font-normal leading-[22px] text-slate-500 mt-1">
            {currentCategoryInfo.subtitle} · Tự động dọn dẹp và hủy vĩnh viễn sau 30 ngày
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAutoClean}
            leftIcon={<Trash2 className="h-4 w-4 text-slate-500" />}
            title="Quét và xóa vĩnh viễn toàn bộ bản ghi trong Thùng rác đã quá 30 ngày"
          >
            Dọn dẹp tự động (&gt; 30 ngày)
          </Button>
          <button
            type="button"
            onClick={handleRefreshClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer select-none shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê KPI Card (Đồng bộ 100% chuẩn Golden Master) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lịch thi đã xóa */}
        <button
          type="button"
          onClick={() => setActiveCategory('schedules')}
          className={`group flex flex-col justify-between p-4 rounded-xl border text-left transition cursor-pointer shadow-2xs ${activeCategory === 'schedules'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-md'
            }`}
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="space-y-1 min-w-0">
              <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">Lịch thi đã xóa</span>
              <div className="text-[32px] font-bold leading-[38px] tracking-tight tabular-nums text-slate-900">{stats.schedules}</div>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${activeCategory === 'schedules' ? 'bg-primary-600 text-white border-primary-600' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
              }`}>
              <CalendarCheck className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100/80 w-full">
            <span className="text-[13px] font-normal text-slate-500 block truncate">Lịch thi khảo thí</span>
          </div>
        </button>

        {/* Card 2: Đề thi đã xóa */}
        <button
          type="button"
          onClick={() => setActiveCategory('papers')}
          className={`group flex flex-col justify-between p-4 rounded-xl border text-left transition cursor-pointer shadow-2xs ${activeCategory === 'papers'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-md'
            }`}
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="space-y-1 min-w-0">
              <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">Đề thi đã xóa</span>
              <div className="text-[32px] font-bold leading-[38px] tracking-tight tabular-nums text-slate-900">{stats.papers}</div>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${activeCategory === 'papers' ? 'bg-primary-600 text-white border-primary-600' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
              }`}>
              <FileText className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100/80 w-full">
            <span className="text-[13px] font-normal text-slate-500 block truncate">Bộ đề thi trắc nghiệm / tự luận</span>
          </div>
        </button>

        {/* Card 3: Ngân hàng câu hỏi */}
        <button
          type="button"
          onClick={() => setActiveCategory('questions')}
          className={`group flex flex-col justify-between p-4 rounded-xl border text-left transition cursor-pointer shadow-2xs ${activeCategory === 'questions'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-md'
            }`}
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="space-y-1 min-w-0">
              <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">Câu hỏi đã xóa</span>
              <div className="text-[32px] font-bold leading-[38px] tracking-tight tabular-nums text-slate-900">{stats.questions}</div>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${activeCategory === 'questions' ? 'bg-primary-600 text-white border-primary-600' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
              }`}>
              <HelpCircle className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100/80 w-full">
            <span className="text-[13px] font-normal text-slate-500 block truncate">Ngân hàng câu hỏi</span>
          </div>
        </button>

        {/* Card 4: Tài khoản / Khác */}
        <button
          type="button"
          onClick={() => setActiveCategory('users')}
          className={`group flex flex-col justify-between p-4 rounded-xl border text-left transition cursor-pointer shadow-2xs ${['users', 'subjects', 'classes'].includes(activeCategory)
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-md'
            }`}
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="space-y-1 min-w-0">
              <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">Tài khoản / khác</span>
              <div className="text-[32px] font-bold leading-[38px] tracking-tight tabular-nums text-slate-900">{(stats.users || 0) + (stats.subjects || 0) + (stats.classes || 0)}</div>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${['users', 'subjects', 'classes'].includes(activeCategory) ? 'bg-primary-600 text-white border-primary-600' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
              }`}>
              <Users className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100/80 w-full">
            <span className="text-[13px] font-normal text-slate-500 block truncate">Người dùng, Môn học, Lớp</span>
          </div>
        </button>
      </div>

      {/* Filter Card Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5">
        {/* Search Input Field */}
        <div className="relative flex-1 w-full min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã, nội dung, tên dữ liệu đã xóa..."
            className="h-9 w-full h-9 rounded-xl border border-slate-200/90 bg-white dark:bg-slate-900/50 pl-10 pr-9 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Select Dropdowns Group */}
        <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Danh mục:</span>
            <FilterSelect
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              size="md"
            >
              <option value="schedules">Lịch thi đã xóa ({stats.schedules})</option>
              <option value="papers">Đề thi đã xóa ({stats.papers})</option>
              <option value="questions">Ngân hàng câu hỏi ({stats.questions})</option>
              <option value="users">Tài khoản / Sinh viên ({stats.users || 0})</option>
              <option value="subjects">Môn học ({stats.subjects || 0})</option>
              <option value="classes">Lớp học ({stats.classes || 0})</option>
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* Main Data Table Header & Actions Chuẩn Hệ Thống */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-[15px] font-normal text-slate-700">
            <span className="font-semibold text-slate-900">{sortedItems.length}</span> kết quả
          </p>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <SortDropdown
              value={sortOrder}
              onChange={(val) => setSortOrder(val)}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'title_asc', label: 'Tên: A - Z' },
              ]}
            />

            {/* Column Selector */}
            <ColumnToggleDropdown
              columns={[
                { key: 'deletedAt', label: 'Thời điểm xóa' },
                { key: 'expiresIn', label: 'Tự động hủy' },
                { key: 'deletedBy', label: 'Người xóa' },
              ]}
              visibleColumns={visibleColumns}
              onToggle={(key) => setVisibleColumns((prev: any) => ({ ...prev, [key]: !prev[key] }))}
            />

            {/* View Mode Switcher 3 Icon */}
            <div className="flex items-center h-9 rounded-xl border border-slate-200 bg-white px-1 shadow-2xs gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-9 w-9 flex items-center justify-center rounded-xl transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-400 hover:text-slate-700'}`}
                title="Xem dạng danh sách"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-9 w-9 flex items-center justify-center rounded-xl transition cursor-pointer ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-400 hover:text-slate-700'}`}
                title="Xem dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`h-9 w-9 flex items-center justify-center rounded-xl transition cursor-pointer ${viewMode === 'compact' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-400 hover:text-slate-700'}`}
                title="Xem dạng thu gọn"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 select-none"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Render Dữ Liệu Thực Tế Theo 3 Chế Độ Xem (View Mode) */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Đang tải danh sách dữ liệu...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-slate-900">Thùng rác trống</h3>
            <p className="text-[15px] text-slate-500 font-normal">Không có dữ liệu nào bị xóa trong danh mục này.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* CHẾ ĐỘ XEM GRID (LƯỚI THẺ CARD UI) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map((item) => {
              const remainingDays = getRemainingDays(item.deletedAt);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <span className={`inline-flex items-center gap-[6px] text-[14px] leading-5 font-semibold ${remainingDays <= 5 ? 'text-danger-600' : 'text-warning-600'
                        }`}>
                        <Clock className="w-3.5 h-3.5" />
                        Còn {remainingDays} ngày
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 text-[18px] leading-[26px] line-clamp-2">{item.title}</h4>
                      <p className="text-[14px] font-normal text-slate-500 mt-1 line-clamp-2">{item.subTitle}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[14px] space-y-1 text-slate-600 font-normal">
                      {visibleColumns.deletedAt && (
                        <p className="flex justify-between">
                          <span className="text-slate-500">Thời điểm xóa:</span>
                          <span className="font-medium text-slate-900">{item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}</span>
                        </p>
                      )}
                      {visibleColumns.deletedBy && (
                        <p className="flex justify-between">
                          <span className="text-slate-500">Người xóa:</span>
                          <span className="font-medium text-slate-900">{item.deletedBy}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRestore(item)}
                      title="Khôi phục"
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleHardDelete(item)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Xóa vĩnh viễn
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'compact' ? (
          /* CHẾ ĐỘ XEM THẺ THANH NGANG THU GỌN (COMPACT CARD ROW MODE) */
          <div className="space-y-2.5">
            {paginatedItems.map((item) => {
              const remainingDays = getRemainingDays(item.deletedAt);
              const isSelected = selectedIds.includes(item.id);
              const typeShort = item.type === 'schedules' ? 'LT' : item.type === 'papers' ? 'ĐT' : item.type === 'questions' ? 'CH' : item.type === 'users' ? 'TK' : item.type === 'subjects' ? 'MH' : 'TR';

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                  }`}
                >
                  {/* Left: Checkbox + Avatar Code Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-primary-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80">
                      {typeShort}
                    </div>

                    {/* Middle: Title + SubTitle + Meta chips */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums border border-slate-200">
                          {categoryLabelMap[item.type] || item.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                        {item.subTitle && (
                          <span className="text-slate-600 truncate max-w-sm">
                            {item.subTitle}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          remainingDays <= 5 ? 'text-danger-600' : 'text-warning-600'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Còn {remainingDays} ngày</span>
                        </span>
                        {item.deletedAt && (
                          <span className="text-slate-400">
                            Xóa lúc: {new Date(item.deletedAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                        {item.deletedBy && (
                          <span className="text-slate-400">
                            Bởi: <strong className="text-slate-600 font-medium">{item.deletedBy}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(item)}
                      title="Khôi phục dữ liệu"
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition cursor-pointer active:scale-95 select-none"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHardDelete(item)}
                      title="Xóa vĩnh viễn"
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95 select-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CHẾ ĐỘ XEM TABLE (LIST MODE) */
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
             <div className="ui-table-wrap overflow-x-auto">
               <table className="ui-table w-full text-left text-[15px] text-slate-700 border-collapse">
                <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-5 w-10 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded-md border-slate-300 text-primary-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5">Nội dung / Dữ liệu đã xóa</th>
                    {visibleColumns.deletedAt && <th className="px-5 py-3.5">Thời điểm xóa</th>}
                    {visibleColumns.expiresIn && <th className="px-5 py-3.5">Tự động hủy</th>}
                    {visibleColumns.deletedBy && <th className="px-5 py-3.5">Người xóa</th>}
                    {visibleColumns.actions && <th className="px-5 text-right py-3.5">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {paginatedItems.map((item) => {
                    const remainingDays = getRemainingDays(item.deletedAt);
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className={`transition hover:bg-slate-50/60 ${isSelected ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                            className="h-4 w-4 rounded-md border-slate-300 text-primary-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-[15px] leading-snug">{item.title}</p>
                              <p className="text-[15px] leading-[22px] text-slate-500 font-normal mt-0.5">{item.subTitle}</p>
                            </div>
                          </div>
                        </td>
                        {visibleColumns.deletedAt && (
                          <td className="px-5 font-normal text-slate-700 whitespace-nowrap py-4">
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                          </td>
                        )}
                        {visibleColumns.expiresIn && (
                          <td className="px-5 whitespace-nowrap py-4">
                            <span className={`inline-flex items-center gap-[6px] text-[15px] leading-[22px] font-medium ${remainingDays <= 5
                                ? 'text-danger-600'
                                : 'text-warning-600'
                              }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Còn {remainingDays} ngày
                            </span>
                          </td>
                        )}
                        {visibleColumns.deletedBy && (
                          <td className="px-5 font-normal text-slate-700 whitespace-nowrap py-4">
                            <span className="text-[15px] leading-[22px] font-medium text-slate-700">
                              {item.deletedBy}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="px-5 text-right whitespace-nowrap py-4">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleRestore(item)}
                                title="Khôi phục dữ liệu"
                                className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 transition cursor-pointer active:scale-95 select-none"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleHardDelete(item)}
                                title="Xóa vĩnh viễn"
                                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95 select-none"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Thanh Phân Trang Chuẩn Hệ Thống */}
        {sortedItems.length > 0 && (
          <TrashPaginationBar
            page={page}
            totalPages={totalPages}
            limit={pageSize}
            totalItems={sortedItems.length}
            categoryLabel={categoryLabelMap[activeCategory] || 'dữ liệu'}
            onPage={(p) => setPage(p)}
            onLimit={(l) => {
              setPageSize(l);
              setPage(1);
            }}
          />
        )}
      </div>
    </main>
  );
}

export default function TrashPage() {
  return (
    <Suspense fallback={
      <div className="p-12 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Đang tải...</p>
      </div>
    }>
      <TrashPageContent />
    </Suspense>
  );
}
