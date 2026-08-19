'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { TrashPaginationBar } from '../../components/trash/TrashPaginationBar';
import { TrashBulkAction } from '../../components/trash/TrashBulkAction';
import { TrashFilterPopover } from '../../components/trash/TrashFilterPopover';
import {
  Trash2, RotateCcw, Search, CalendarCheck, FileText, X,
  HelpCircle, RefreshCw, ChevronDown, Clock, Users, Building2, GraduationCap, BookOpen, CheckCircle2, SlidersHorizontal, Eye, MoreVertical, List, LayoutGrid, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { SortDropdown } from '../../components/ui/SortDropdown';
import { ColumnToggleDropdown } from '../../components/ui/ColumnToggleDropdown';
import { ViewModeSegmentedControl } from '../../components/ui/ViewModeSegmentedControl';

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
  const [expiryFilter, setExpiryFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [detailItem, setDetailItem] = useState<TrashItem | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detailItem) {
        setDetailItem(null);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailItem]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { },
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<TrashStats>('/trash/stats');
      setStats(res.data);
      return true;
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể tải thống kê thùng rác', type: 'error' });
      return false;
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
      return true;
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Không thể tải danh sách thùng rác', type: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search]);

  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    setIsSpinning(true);
    try {
      const [statsOk, itemsOk] = await Promise.all([fetchStats(), fetchItems()]);
      if (statsOk && itemsOk) setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSpinning(false), 600);
    }
  };

  const getRemainingDays = useCallback((deletedAt?: string) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  }, []);

  const sortedItems = useMemo(() => {
    let result = [...items];
    if (expiryFilter === 'URGENT') {
      result = result.filter((i) => getRemainingDays(i.deletedAt) < 7);
    } else if (expiryFilter === 'RECENT') {
      result = result.filter((i) => getRemainingDays(i.deletedAt) > 20);
    }

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.deletedAt || 0).getTime() - new Date(b.deletedAt || 0).getTime());
    } else if (sortOrder === 'title_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [items, expiryFilter, sortOrder, getRemainingDays]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, expiryFilter, sortOrder]);

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
      title: 'Khôi phục dữ liệu?',
      message: `Bạn có chắc chắn muốn khôi phục "${item.title}" trở lại hệ thống?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post('/trash/restore', { type: item.type, id: item.id });
          setToast({ message: 'Đã khôi phục dữ liệu thành công!', type: 'success' });
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Khôi phục thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  const handleHardDelete = (item: TrashItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa vĩnh viễn dữ liệu?',
      message: `CẢNH BÁO: Thao tác này sẽ XÓA VĨNH VIỄN "${item.title}" khỏi Database và KHÔNG THỂ KHÔI PHỤC! Bạn có chắc chắn muốn thực hiện?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete('/trash/permanent', { data: { type: item.type, id: item.id } });
          setToast({ message: 'Đã xóa vĩnh viễn dữ liệu khỏi hệ thống thành công!', type: 'success' });
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Xóa vĩnh viễn thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
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

  const handleBulkRestore = () => {
    const count = selectedIds.length;
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục hàng loạt?',
      message: `Bạn có chắc chắn muốn khôi phục ${count} bản ghi đã chọn trở lại hệ thống?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await Promise.allSettled(
            selectedItems.map((item) => api.post('/trash/restore', { type: item.type, id: item.id }))
          );
          setToast({ message: `Đã khôi phục thành công ${count} bản ghi!`, type: 'success' });
          setSelectedIds([]);
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Khôi phục thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  const handleBulkHardDelete = () => {
    const count = selectedIds.length;
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    setConfirmModal({
      isOpen: true,
      title: 'Xóa vĩnh viễn hàng loạt?',
      message: `CẢNH BÁO: Thao tác này sẽ XÓA VĨNH VIỄN ${count} bản ghi đã chọn khỏi Database và KHÔNG THỂ KHÔI PHỤC! Bạn có chắc chắn muốn thực hiện?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await Promise.allSettled(
            selectedItems.map((item) => api.delete('/trash/permanent', { data: { type: item.type, id: item.id } }))
          );
          setToast({ message: `Đã xóa vĩnh viễn ${count} bản ghi khỏi hệ thống thành công!`, type: 'success' });
          setSelectedIds([]);
          fetchStats();
          fetchItems();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Xóa vĩnh viễn thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  const handleAutoClean = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Tự động dọn dẹp Thùng rác?',
      message: 'Hệ thống sẽ quét và XÓA VĨNH VIỄN toàn bộ các bản ghi trong Thùng rác đã quá 30 ngày. Bạn có chắc chắn muốn thực hiện?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await api.post('/trash/auto-clean');
          const count = res.data?.totalCleaned ?? 0;
          setToast({
            message: count > 0 ? `Đã tự động dọn dẹp vĩnh viễn ${count} bản ghi quá 30 ngày!` : 'Không có bản ghi nào quá 30 ngày cần dọn dẹp.',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>{currentCategoryInfo.title}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-type-helper font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {items.length} mục
            </span>
          </h1>
          <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            {currentCategoryInfo.subtitle} · Tự động dọn dẹp và hủy vĩnh viễn sau 30 ngày
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
        </div>
      </div>

      {/* 4 Thẻ Thống Kê KPI Card (Đồng bộ 100% chuẩn Xanh & Trắng) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            key: 'schedules',
            title: 'Lịch thi đã xóa',
            value: stats.schedules,
            subtext: 'Lịch thi khảo thí',
            progressPercent: stats.schedules > 0 ? 100 : 0,
            icon: CalendarCheck,
          },
          {
            key: 'papers',
            title: 'Đề thi đã xóa',
            value: stats.papers,
            subtext: 'Bộ đề thi trắc nghiệm / tự luận',
            progressPercent: stats.papers > 0 ? 100 : 0,
            icon: FileText,
          },
          {
            key: 'questions',
            title: 'Câu hỏi đã xóa',
            value: stats.questions,
            subtext: 'Ngân hàng câu hỏi',
            progressPercent: stats.questions > 0 ? 100 : 0,
            icon: HelpCircle,
          },
          {
            key: 'users',
            title: 'Tài khoản / khác',
            value: (stats.users || 0) + (stats.subjects || 0) + (stats.classes || 0),
            subtext: 'Người dùng, Môn học, Lớp',
            progressPercent: ((stats.users || 0) + (stats.subjects || 0) + (stats.classes || 0)) > 0 ? 100 : 0,
            icon: Users,
            isExtraCategory: true,
          },
        ].map((item) => {
          const IconComponent = item.icon;
          const isSelected = item.isExtraCategory
            ? ['users', 'subjects', 'classes'].includes(activeCategory)
            : activeCategory === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveCategory(item.key);
                setPage(1);
                router.push(`/trash?type=${item.key}`);
              }}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-md ${
                isSelected
                  ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate tracking-normal">
                    {item.title}
                  </span>
                  <div className="text-type-kpi font-bold leading-[38px] tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
                    {item.value}
                  </div>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold transition-all duration-200 group-hover:scale-105 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                  }`}
                >
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

              <div className="mt-2.5 w-full">
                <span
                  title={item.subtext}
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {item.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Action Toolbar Row (Single Unified Row) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search Input Field + Popover Button */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mục đã xóa..."
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd
                className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                onClick={() => searchInputRef.current?.focus()}
                title="Nhấn phím / để tìm nhanh"
              >
                /
              </kbd>
            )}
          </div>

          <TrashFilterPopover
            activeCategory={activeCategory}
            onActiveCategoryChange={(val) => {
              setActiveCategory(val);
              setPage(1);
              router.push(`/trash?type=${val}`);
            }}
            expiryFilter={expiryFilter}
            onExpiryFilterChange={(val) => {
              setExpiryFilter(val);
              setPage(1);
            }}
            stats={stats}
            totalFilteredCount={sortedItems.length}
            onResetAll={() => {
              setSearch('');
              setActiveCategory('schedules');
              setExpiryFilter('');
              setPage(1);
              router.push('/trash?type=schedules');
            }}
          />
        </div>

        {/* Right: Table Action Controls */}
        <div className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2">
              <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
                Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{sortedItems.length.toLocaleString('vi-VN')}</span> kết quả
              </span>
            </div>

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

              {/* View Mode Segmented Control */}
              <ViewModeSegmentedControl
                viewMode={viewMode}
                onChange={(mode) => setViewMode(mode)}
              />

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
        </div>
      </div>

        {/* Render Dữ Liệu Thực Tế Theo 3 Chế Độ Xem (View Mode) */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-type-helper font-semibold text-slate-500">Đang tải danh sách dữ liệu...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-type-card font-semibold text-slate-900">Thùng rác trống</h3>
            <p className="text-type-body text-slate-500 font-normal">Không có dữ liệu nào bị xóa trong danh mục này.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* CHẾ ĐỘ XEM GRID (LƯỚI THẺ CARD UI) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map((item) => {
              const remainingDays = getRemainingDays(item.deletedAt);
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md tabular-nums border border-slate-200 dark:border-slate-700 truncate">
                          {categoryLabelMap[item.type] || item.type}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-[6px] text-type-helper leading-5 font-semibold ${
                        remainingDays <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        Còn {remainingDays} ngày
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-type-card leading-[26px] line-clamp-2">{item.title}</h4>
                      {item.subTitle && (
                        <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.subTitle}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-type-helper space-y-1 text-slate-600 dark:text-slate-400 font-normal">
                      {visibleColumns.deletedAt && (
                        <p className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Thời điểm xóa:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}</span>
                        </p>
                      )}
                      {visibleColumns.deletedBy && (
                        <p className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Người xóa:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.deletedBy}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-type-body-sm font-medium transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Xem chi tiết</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        title="Khôi phục"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition cursor-pointer select-none"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHardDelete(item)}
                        title="Xóa vĩnh viễn"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer select-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition duration-200 gap-3.5 ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                  }`}
                >
                  {/* Left: Checkbox + Title + Meta chips */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md tabular-nums border border-slate-200 dark:border-slate-700">
                          {categoryLabelMap[item.type] || item.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 text-type-helper text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-normal">
                        {item.subTitle && (
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-sm">
                            {item.subTitle}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          remainingDays <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
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
                            Bởi: <strong className="text-slate-600 dark:text-slate-300 font-medium">{item.deletedBy}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      title="Xem chi tiết"
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer select-none"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestore(item)}
                      title="Khôi phục dữ liệu"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition cursor-pointer active:scale-95 select-none"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHardDelete(item)}
                      title="Xóa vĩnh viễn"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer active:scale-95 select-none"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
             <div className="ui-table-wrap overflow-x-auto">
               <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 w-10 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5">Nội dung / Dữ liệu đã xóa</th>
                    {visibleColumns.deletedAt && <th className="px-5 py-3.5 whitespace-nowrap">Thời điểm xóa</th>}
                    {visibleColumns.expiresIn && <th className="px-5 py-3.5 whitespace-nowrap">Tự động hủy</th>}
                    {visibleColumns.deletedBy && <th className="px-5 py-3.5 whitespace-nowrap">Người xóa</th>}
                    {visibleColumns.actions && <th className="px-5 text-right py-3.5 whitespace-nowrap">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {paginatedItems.map((item) => {
                    const remainingDays = getRemainingDays(item.deletedAt);
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className={`transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${isSelected ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-5 py-3.5 text-center w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                            className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3.5 min-w-[240px]">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-type-body leading-snug">{item.title}</p>
                            {item.subTitle && (
                              <p className="table-meta text-type-helper leading-[20px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">{item.subTitle}</p>
                            )}
                          </div>
                        </td>
                        {visibleColumns.deletedAt && (
                          <td className="table-meta px-5 font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap py-3.5 text-type-body-sm">
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                          </td>
                        )}
                        {visibleColumns.expiresIn && (
                          <td className="px-5 whitespace-nowrap py-3.5">
                            <span className={`table-badge inline-flex items-center gap-[6px] text-type-helper leading-[20px] font-medium ${
                              remainingDays <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Còn {remainingDays} ngày
                            </span>
                          </td>
                        )}
                        {visibleColumns.deletedBy && (
                          <td className="px-5 font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap py-3.5 text-type-body">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {item.deletedBy}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="px-5 text-right whitespace-nowrap py-3.5">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setDetailItem(item)}
                                title="Xem chi tiết"
                                className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer select-none"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRestore(item)}
                                title="Khôi phục dữ liệu"
                                className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer active:scale-95 select-none"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleHardDelete(item)}
                                title="Xóa vĩnh viễn"
                                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer active:scale-95 select-none"
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

        {/* Floating Bulk Action Bar */}
        <TrashBulkAction
          selectedCount={selectedIds.length}
          totalCount={sortedItems.length}
          allSelected={selectedIds.length === sortedItems.length && sortedItems.length > 0}
          onToggleAll={() =>
            setSelectedIds(selectedIds.length === sortedItems.length ? [] : sortedItems.map((i) => i.id))
          }
          onRestore={handleBulkRestore}
          onHardDelete={handleBulkHardDelete}
          onClear={() => setSelectedIds([])}
        />

        {/* ── Standardized ProfileDrawer ── */}
        <ProfileDrawer
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailItem?.title || 'Chi tiết bản ghi'}
          subtitle={`Mã #${detailItem?.id || ''}`}
          avatarText={detailItem?.title?.slice(0, 2)?.toUpperCase() || 'TR'}
          badge={{
            label: categoryLabelMap[detailItem?.type || ''] || detailItem?.type || 'Thùng rác',
            className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
          }}
          details={[
            { label: 'Danh mục dữ liệu', value: categoryLabelMap[detailItem?.type || ''] || detailItem?.type || '---' },
            ...(detailItem?.subTitle ? [{ label: 'Mô tả / Kỳ thi', value: detailItem.subTitle }] : []),
            { label: 'Thời điểm xóa', value: detailItem?.deletedAt ? new Date(detailItem.deletedAt).toLocaleString('vi-VN') : '---' },
            { label: 'Người thực hiện xóa', value: detailItem?.deletedBy || 'Hệ thống' },
          ]}
          extraSections={[
            {
              title: 'Thời hạn lưu trữ trong thùng rác',
              content: (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-type-helper">
                    <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Thời gian còn lại
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      Còn {getRemainingDays(detailItem?.deletedAt)} ngày nữa
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        getRemainingDays(detailItem?.deletedAt) <= 7
                          ? 'bg-rose-500'
                          : getRemainingDays(detailItem?.deletedAt) <= 15
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(5, (getRemainingDays(detailItem?.deletedAt) / 30) * 100)}%` }}
                    />
                  </div>

                  <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                    Sau thời gian lưu trữ 30 ngày, hệ thống sẽ tự động dọn dẹp và xóa vĩnh viễn bản ghi khỏi cơ sở dữ liệu.
                  </p>
                </div>
              ),
            },
            {
              title: 'Thao tác bản ghi',
              content: (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      if (item) handleHardDelete(item);
                    }}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Xóa vĩnh viễn
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      if (item) handleRestore(item);
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Khôi phục
                  </Button>
                </div>
              ),
            },
          ]}
        />
    </main>
  );
}

export default function TrashPage() {
  return (
    <Suspense fallback={
      <div className="p-12 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-type-helper font-semibold text-slate-500">Đang tải...</p>
      </div>
    }>
      <TrashPageContent />
    </Suspense>
  );
}
