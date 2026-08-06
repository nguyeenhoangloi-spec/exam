'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  Trash2, RotateCcw, Search, CalendarCheck, FileText,
  HelpCircle, AlertTriangle, RefreshCw, Layers
} from 'lucide-react';

interface TrashItem {
  id: number | string;
  type: 'schedules' | 'papers' | 'questions';
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
}

export default function TrashPage() {
  usePageTitle('Thùng rác hệ thống');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'schedules' | 'papers' | 'questions'>('schedules');
  const [stats, setStats] = useState<TrashStats>({ total: 0, schedules: 0, papers: 0, questions: 0 });
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    onConfirm: () => {},
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
      const res = await api.get<TrashItem[]>('/trash/items', {
        params: { type: activeTab, search },
      });
      setItems(res.data || []);
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Không thể tải danh sách thùng rác', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

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
      message: `Bạn có chắc chắn muốn khôi phục "${item.title}" trở lại danh sách hoạt động?`,
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
      message: `CẢNH BÁO: Thao tác này sẽ XÓA VĨNH VIỄN "${item.title}" khỏi Database PostgreSQL và KHÔNG THỂ KHÔI PHỤC! Bạn có chắc chắn?`,
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

  const TAB_ITEMS = [
    { key: 'schedules', label: 'Lịch thi đã xóa', count: stats.schedules, icon: CalendarCheck, color: 'text-blue-600' },
    { key: 'papers', label: 'Đề thi đã xóa', count: stats.papers, icon: FileText, color: 'text-amber-600' },
    { key: 'questions', label: 'Ngân hàng câu hỏi', count: stats.questions, icon: HelpCircle, color: 'text-emerald-600' },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Thùng Rác Hệ Thống
              <span className="text-xs font-extrabold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                {stats.total} mục
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Quản lý các dữ liệu đã bị xóa tạm thời (Soft Delete) · Hỗ trợ khôi phục hoặc dọn dẹp vĩnh viễn
            </p>
          </div>
        </div>

        <button
          onClick={() => { fetchStats(); fetchItems(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TAB_ITEMS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${
                isActive
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t.label}</p>
                <p className={`text-2xl font-black ${t.color}`}>{t.count}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <Icon className={`w-5 h-5 ${t.color}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tabs & Search Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl shrink-0">
            {TAB_ITEMS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  activeTab === t.key
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nội dung đã xóa..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Đang tải danh sách dữ liệu trong thùng rác...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-700">Thùng rác trống</h3>
              <p className="text-xs text-slate-400 font-medium">Không có dữ liệu nào bị xóa trong danh mục này.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="px-5 py-3.5">Nội dung / Đối tượng</th>
                  <th className="px-5 py-3.5">Thời điểm xóa</th>
                  <th className="px-5 py-3.5">Người thực hiện</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-900 leading-snug">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.subTitle}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 whitespace-nowrap">
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px]">
                        {item.deletedBy}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          Khôi phục
                        </button>
                        <button
                          onClick={() => handleHardDelete(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Xóa vĩnh viễn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
