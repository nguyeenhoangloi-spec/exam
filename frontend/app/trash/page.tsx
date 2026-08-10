'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { TrashPaginationBar } from '../../components/trash/TrashPaginationBar';
import {
  Trash2, RotateCcw, Search, CalendarCheck, FileText,
  HelpCircle, RefreshCw, ChevronDown, Clock, Users, Building2, GraduationCap, BookOpen, CheckCircle2, SlidersHorizontal, Eye, MoreVertical, List, LayoutGrid, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';

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
          <h1 className="text-[28px] font-bold leading-[36px] text-[#0F172A] tracking-tight flex items-center gap-2">
            {currentCategoryInfo.title}
            <span className="text-[13px] font-semibold text-[#64748B]">
              {items.length} mục
            </span>
          </h1>
          <p className="text-[15px] font-normal leading-[22px] text-[#64748B] mt-1">
            {currentCategoryInfo.subtitle} · Tự động dọn dẹp và hủy vĩnh viễn sau 30 ngày
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAutoClean}
            leftIcon={<Trash2 className="h-4 w-4 text-[#64748B]" />}
            title="Quét và xóa vĩnh viễn toàn bộ bản ghi trong Thùng rác đã quá 30 ngày"
          >
            Dọn dẹp tự động (&gt; 30 ngày)
          </Button>
          <button
            type="button"
            onClick={() => { fetchItems(); fetchStats(); }}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition active:scale-95 cursor-pointer select-none"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê KPI Card (Tất cả dùng duy nhất Màu Chủ Đạo Xanh Dương Blue) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lịch thi đã xóa */}
        <button
          type="button"
          onClick={() => setActiveCategory('schedules')}
          className={`group p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${activeCategory === 'schedules'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">LỊCH THI ĐÃ XÓA</p>
            <p className="text-[32px] font-bold leading-[38px] text-[#0F172A]">{stats.schedules}</p>
            <p className="text-[13px] font-normal text-[#64748B]">Lịch thi khảo thí</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${activeCategory === 'schedules' ? 'bg-[#2563EB] text-white' : 'bg-blue-50 text-[#2563EB] border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
            }`}>
            <CalendarCheck className="w-5 h-5" />
          </div>
        </button>

        {/* Card 2: Đề thi đã xóa */}
        <button
          type="button"
          onClick={() => setActiveCategory('papers')}
          className={`group p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${activeCategory === 'papers'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">ĐỀ THI ĐÃ XÓA</p>
            <p className="text-[32px] font-bold leading-[38px] text-[#0F172A]">{stats.papers}</p>
            <p className="text-[13px] font-normal text-[#64748B]">Bộ đề thi trắc nghiệm / tự luận</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${activeCategory === 'papers' ? 'bg-[#2563EB] text-white' : 'bg-blue-50 text-[#2563EB] border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
            }`}>
            <FileText className="w-5 h-5" />
          </div>
        </button>

        {/* Card 3: Ngân hàng câu hỏi */}
        <button
          type="button"
          onClick={() => setActiveCategory('questions')}
          className={`group p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${activeCategory === 'questions'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">CÂU HỎI ĐÃ XÓA</p>
            <p className="text-[32px] font-bold leading-[38px] text-[#0F172A]">{stats.questions}</p>
            <p className="text-[13px] font-normal text-[#64748B]">Ngân hàng câu hỏi</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${activeCategory === 'questions' ? 'bg-[#2563EB] text-white' : 'bg-blue-50 text-[#2563EB] border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
            }`}>
            <HelpCircle className="w-5 h-5" />
          </div>
        </button>

        {/* Card 4: Tài khoản / Khác */}
        <button
          type="button"
          onClick={() => setActiveCategory('users')}
          className={`group p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${['users', 'subjects', 'classes'].includes(activeCategory)
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">TÀI KHOẢN / KHÁC</p>
            <p className="text-[32px] font-bold leading-[38px] text-[#0F172A]">{(stats.users || 0) + (stats.subjects || 0) + (stats.classes || 0)}</p>
            <p className="text-[13px] font-normal text-[#64748B]">Người dùng, Môn học, Lớp</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${['users', 'subjects', 'classes'].includes(activeCategory) ? 'bg-[#2563EB] text-white' : 'bg-blue-50 text-[#2563EB] border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
            }`}>
            <Users className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Thanh Tìm Kiếm & Lọc Danh Mục (Search & Filter Bar Chuẩn Quy Tắc) */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã, Nội dung, Tên dữ liệu đã xóa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px] font-normal text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[15px] font-medium text-[#334155] whitespace-nowrap">Danh mục:</span>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer shadow-2xs"
          >
            <option value="schedules">Lịch thi đã xóa ({stats.schedules})</option>
            <option value="papers">Đề thi đã xóa ({stats.papers})</option>
            <option value="questions">Ngân hàng câu hỏi ({stats.questions})</option>
            <option value="users">Tài khoản / Sinh viên ({stats.users || 0})</option>
            <option value="subjects">Môn học ({stats.subjects || 0})</option>
            <option value="classes">Lớp học ({stats.classes || 0})</option>
          </select>
        </div>
      </div>

      {/* Main Data Table Header & Actions Chuẩn Hệ Thống */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-[15px] font-normal text-[#334155]">
            <span className="font-semibold text-[#0F172A]">{sortedItems.length}</span> kết quả
          </p>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <option value="newest">Sắp xếp: Mới nhất</option>
                <option value="oldest">Sắp xếp: Cũ nhất</option>
                <option value="title_asc">Tên: A - Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            </div>

            {/* Column Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenColumnMenu(!openColumnMenu)}
                className="h-9 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#2563EB]" />
                <span>Chọn cột</span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
              </button>

              {openColumnMenu && (
                <div
                  className="absolute right-0 top-full z-30 mt-1.5 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-[14px] space-y-2"
                  onMouseLeave={() => setOpenColumnMenu(false)}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-semibold text-[#0F172A] text-[14px]">Hiển thị cột</span>
                    <span className="text-[13px] text-[#64748B] font-normal">Click để ẩn/hiện</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 cursor-pointer font-medium text-[#334155] rounded-lg">
                      <span>Thời điểm xóa</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns.deletedAt}
                        onChange={() => setVisibleColumns((prev) => ({ ...prev, deletedAt: !prev.deletedAt }))}
                        className="rounded text-[#2563EB] cursor-pointer h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 cursor-pointer font-medium text-[#334155] rounded-lg">
                      <span>Tự động hủy</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns.expiresIn}
                        onChange={() => setVisibleColumns((prev) => ({ ...prev, expiresIn: !prev.expiresIn }))}
                        className="rounded text-[#2563EB] cursor-pointer h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 cursor-pointer font-medium text-[#334155] rounded-lg">
                      <span>Người xóa</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns.deletedBy}
                        onChange={() => setVisibleColumns((prev) => ({ ...prev, deletedBy: !prev.deletedBy }))}
                        className="rounded text-[#2563EB] cursor-pointer h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Switcher 3 Icon */}
            <div className="flex items-center h-9 rounded-xl border border-slate-200 bg-white px-1 shadow-2xs gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-7 w-7 flex items-center justify-center rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                title="Xem dạng danh sách"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-7 w-7 flex items-center justify-center rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-blue-50 text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                title="Xem dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`h-7 w-7 flex items-center justify-center rounded-lg transition cursor-pointer ${viewMode === 'compact' ? 'bg-blue-50 text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                title="Xem dạng thu gọn"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchItems()}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition active:scale-95 cursor-pointer select-none border border-slate-200 bg-white shadow-2xs"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render Dữ Liệu Thực Tế Theo 3 Chế Độ Xem (View Mode) */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-7 h-7 border-2 border-blue-200 border-t-[#2563EB] rounded-full animate-spin mx-auto" />
            <p className="text-[15px] font-normal text-[#64748B]">Đang tải danh sách dữ liệu...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-[#64748B]">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#0F172A]">Thùng rác trống</h3>
            <p className="text-[15px] text-[#64748B] font-normal">Không có dữ liệu nào bị xóa trong danh mục này.</p>
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
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-[#64748B] flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <span className={`inline-flex items-center gap-[6px] text-[14px] leading-5 font-semibold ${remainingDays <= 5 ? 'text-[#DC2626]' : 'text-[#D97706]'
                        }`}>
                        <Clock className="w-3.5 h-3.5" />
                        Còn {remainingDays} ngày
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#0F172A] text-[18px] leading-[26px] line-clamp-2">{item.title}</h4>
                      <p className="text-[14px] font-normal text-[#64748B] mt-1 line-clamp-2">{item.subTitle}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[14px] space-y-1 text-[#475569] font-normal">
                      {visibleColumns.deletedAt && (
                        <p className="flex justify-between">
                          <span className="text-[#64748B]">Thời điểm xóa:</span>
                          <span className="font-medium text-[#0F172A]">{item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}</span>
                        </p>
                      )}
                      {visibleColumns.deletedBy && (
                        <p className="flex justify-between">
                          <span className="text-[#64748B]">Người xóa:</span>
                          <span className="font-medium text-[#0F172A]">{item.deletedBy}</span>
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
        ) : (
          /* CHẾ ĐỘ XEM TABLE (LIST / COMPACT) */
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
                <thead className="bg-slate-50 text-[14px] font-semibold uppercase tracking-wider text-[#475569] border-b border-slate-200">
                  <tr>
                    <th className={`px-5 w-10 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded-md border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Nội dung / Dữ liệu đã xóa</th>
                    {visibleColumns.deletedAt && <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Thời điểm xóa</th>}
                    {visibleColumns.expiresIn && <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Tự động hủy</th>}
                    {visibleColumns.deletedBy && <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Người xóa</th>}
                    {visibleColumns.actions && <th className={`px-5 text-right ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Thao tác</th>}
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
                        <td className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                            className="h-4 w-4 rounded-md border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[#64748B] flex items-center justify-center shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-[#0F172A] text-[15px] leading-snug">{item.title}</p>
                              <p className="text-[13px] text-[#64748B] font-normal mt-0.5">{item.subTitle}</p>
                            </div>
                          </div>
                        </td>
                        {visibleColumns.deletedAt && (
                          <td className={`px-5 font-normal text-[#334155] whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                          </td>
                        )}
                        {visibleColumns.expiresIn && (
                          <td className={`px-5 whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            <span className={`inline-flex items-center gap-[6px] text-[14px] leading-5 font-semibold ${remainingDays <= 5
                                ? 'text-[#DC2626]'
                                : 'text-[#D97706]'
                              }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Còn {remainingDays} ngày
                            </span>
                          </td>
                        )}
                        {visibleColumns.deletedBy && (
                          <td className={`px-5 font-normal text-[#334155] whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            <span className="text-[14px] font-medium text-[#334155]">
                              {item.deletedBy}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className={`px-5 text-right whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleRestore(item)}
                                title="Khôi phục dữ liệu"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer active:scale-95 select-none"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleHardDelete(item)}
                                title="Xóa vĩnh viễn"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95 select-none"
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
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    }>
      <TrashPageContent />
    </Suspense>
  );
}
