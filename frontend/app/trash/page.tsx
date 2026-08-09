'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  Trash2, RotateCcw, Search, CalendarCheck, FileText,
  HelpCircle, RefreshCw, ChevronDown, Clock, Users, Building2, GraduationCap, BookOpen, CheckCircle2, SlidersHorizontal, Eye, MoreVertical, List, LayoutGrid, Layers
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {currentCategoryInfo.title}
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {items.length} mục
            </span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {currentCategoryInfo.subtitle} · Tự động dọn dẹp và hủy vĩnh viễn sau 30 ngày
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleAutoClean}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
            title="Quét và xóa vĩnh viễn toàn bộ bản ghi trong Thùng rác đã quá 30 ngày"
          >
            <Trash2 className="h-4 w-4 text-slate-500" />
            <span>Dọn dẹp tự động (&gt; 30 ngày)</span>
          </button>
          <button
            type="button"
            onClick={() => { fetchItems(); fetchStats(); }}
            className="p-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95 cursor-pointer"
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
          className={`p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${activeCategory === 'schedules'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">LỊCH THI ĐÃ XÓA</p>
            <p className="text-2xl font-black text-slate-900">{stats.schedules}</p>
            <p className="text-[11px] font-semibold text-slate-400">Lịch thi khảo thí</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeCategory === 'schedules' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
            <CalendarCheck className="w-5 h-5" />
          </div>
        </button>

        {/* Card 2: Đề thi đã xóa */}
        <button
          type="button"
          onClick={() => setActiveCategory('papers')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${activeCategory === 'papers'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">ĐỀ THI ĐÃ XÓA</p>
            <p className="text-2xl font-black text-slate-900">{stats.papers}</p>
            <p className="text-[11px] font-semibold text-slate-400">Bộ đề thi trắc nghiệm / tự luận</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeCategory === 'papers' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
            <FileText className="w-5 h-5" />
          </div>
        </button>

        {/* Card 3: Ngân hàng câu hỏi */}
        <button
          type="button"
          onClick={() => setActiveCategory('questions')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${activeCategory === 'questions'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">CÂU HỎI ĐÃ XÓA</p>
            <p className="text-2xl font-black text-slate-900">{stats.questions}</p>
            <p className="text-[11px] font-semibold text-slate-400">Ngân hàng câu hỏi</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeCategory === 'questions' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
            <HelpCircle className="w-5 h-5" />
          </div>
        </button>

        {/* Card 4: Tài khoản / Khác */}
        <button
          type="button"
          onClick={() => setActiveCategory('users')}
          className={`p-5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${['users', 'subjects', 'classes'].includes(activeCategory)
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
            }`}
        >
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">TÀI KHOẢN / KHÁC</p>
            <p className="text-2xl font-black text-slate-900">{(stats.users || 0) + (stats.subjects || 0) + (stats.classes || 0)}</p>
            <p className="text-[11px] font-semibold text-slate-400">Người dùng, Môn học, Lớp</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${['users', 'subjects', 'classes'].includes(activeCategory) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
            <Users className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Thanh Tìm Kiếm & Lọc Danh Mục (Search & Filter Bar Chuẩn Quy Tắc) */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã, Nội dung, Tên dữ liệu đã xóa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Danh mục:</span>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
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
          <p className="text-xs font-bold text-slate-700">
            <span className="font-black text-slate-900">{items.length}</span> kết quả
          </p>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200/80 bg-white pl-3 pr-7 py-1.5 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <option value="newest">Sắp xếp: Mới nhất</option>
                <option value="oldest">Sắp xếp: Cũ nhất</option>
                <option value="title_asc">Tên: A - Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Column Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenColumnMenu(!openColumnMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                <span>Chọn cột</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
              </button>

              {openColumnMenu && (
                <div
                  className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl text-xs space-y-2"
                  onMouseLeave={() => setOpenColumnMenu(false)}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-extrabold text-slate-900 text-xs">Hiển thị cột</span>
                    <span className="text-[10px] text-slate-400 font-medium">Click để ẩn/hiện</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 cursor-pointer font-bold text-slate-700 rounded-lg">
                      <span>Thời điểm xóa</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns.deletedAt}
                        onChange={() => setVisibleColumns((prev) => ({ ...prev, deletedAt: !prev.deletedAt }))}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 cursor-pointer font-bold text-slate-700 rounded-lg">
                      <span>Tự động hủy vĩnh viễn</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns.expiresIn}
                        onChange={() => setVisibleColumns((prev) => ({ ...prev, expiresIn: !prev.expiresIn }))}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 cursor-pointer font-bold text-slate-700 rounded-lg">
                      <span>Người xóa</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns.deletedBy}
                        onChange={() => setVisibleColumns((prev) => ({ ...prev, deletedBy: !prev.deletedBy }))}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Switcher 3 Icon theo bức ảnh mẫu */}
            <div className="flex items-center rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                title="Xem dạng danh sách"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                title="Xem dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'compact' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                title="Xem dạng thu gọn"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchItems()}
              className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-2xs"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Render Dữ Liệu Thực Tế Theo 3 Chế Độ Xem (View Mode) */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Đang tải danh sách dữ liệu...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-700">Thùng rác trống</h3>
            <p className="text-xs text-slate-400 font-medium">Không có dữ liệu nào bị xóa trong danh mục này.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* CHẾ ĐỘ XEM GRID (LƯỚI THẺ CARD UI) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item) => {
              const remainingDays = getRemainingDays(item.deletedAt);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold ${remainingDays <= 5 ? 'text-rose-700' : 'text-amber-700'
                        }`}>
                        <Clock className="w-3 h-3" />
                        Còn {remainingDays} ngày
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{item.subTitle}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600 font-medium">
                      {visibleColumns.deletedAt && (
                        <p className="flex justify-between">
                          <span className="text-slate-400">Thời điểm xóa:</span>
                          <span className="font-bold">{item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}</span>
                        </p>
                      )}
                      {visibleColumns.deletedBy && (
                        <p className="flex justify-between">
                          <span className="text-slate-400">Người xóa:</span>
                          <span className="font-bold">{item.deletedBy}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleRestore(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-100" />
                      Khôi phục
                    </button>
                    <button
                      onClick={() => handleHardDelete(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-100" />
                      Xóa vĩnh viễn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CHẾ ĐỘ XEM TABLE (LIST / COMPACT) */
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
                  <tr>
                    <th className={`px-5 w-10 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === sortedItems.length && sortedItems.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Nội dung / Dữ liệu đã xóa</th>
                    {visibleColumns.deletedAt && <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Thời điểm xóa</th>}
                    {visibleColumns.expiresIn && <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Tự động hủy vĩnh viễn</th>}
                    {visibleColumns.deletedBy && <th className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Người xóa</th>}
                    {visibleColumns.actions && <th className={`px-5 text-right ${viewMode === 'compact' ? 'py-2.5' : 'py-3.5'}`}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortedItems.map((item) => {
                    const remainingDays = getRemainingDays(item.deletedAt);
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className={`transition hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/60' : ''}`}
                      >
                        <td className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className={`px-5 ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 leading-snug">{item.title}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.subTitle}</p>
                            </div>
                          </div>
                        </td>
                        {visibleColumns.deletedAt && (
                          <td className={`px-5 font-semibold text-slate-600 whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                          </td>
                        )}
                        {visibleColumns.expiresIn && (
                          <td className={`px-5 whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold ${remainingDays <= 5
                                ? 'text-rose-700'
                                : 'text-amber-700'
                              }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Còn {remainingDays} ngày
                            </span>
                          </td>
                        )}
                        {visibleColumns.deletedBy && (
                          <td className={`px-5 font-bold text-slate-700 whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                              {item.deletedBy}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className={`px-5 text-right whitespace-nowrap ${viewMode === 'compact' ? 'py-2.5' : 'py-4'}`}>
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleRestore(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-100" />
                                Khôi phục
                              </button>
                              <button
                                onClick={() => handleHardDelete(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-100" />
                                Xóa vĩnh viễn
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
