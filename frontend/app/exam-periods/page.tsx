'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { downloadCsv } from '../../lib/export-csv';
import { printReport } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { KPICards, KPICardItem } from '../../components/KPICards';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Download,
  Printer,
  Eye,
  Award,
  Layers,
} from 'lucide-react';
import { ExamPeriod } from '../../types';

export default function ExamPeriodsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerPeriod, setDrawerPeriod] = useState<ExamPeriod | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<ExamPeriod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    semester: 'HK1',
    schoolYear: '2025-2026',
    startDate: '2026-08-01',
    endDate: '2026-08-30',
    status: 'UPCOMING',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
    type: 'danger',
    onConfirm: () => {},
  });

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    if (new URLSearchParams(window.location.search).get('action') === 'create' && u.role === 'ADMIN') {
      setEditingPeriod(null);
      setFormData({
        name: '',
        semester: 'HK1',
        schoolYear: '2025-2026',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'UPCOMING',
      });
      setIsModalOpen(true);
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const res = await api.get('/exam-periods');
      setPeriods(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredPeriods = periods.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.semester.toLowerCase().includes(search.toLowerCase()) ||
      p.schoolYear.toLowerCase().includes(search.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingPeriod(null);
    setFormData({
      name: `Kỳ thi Học kỳ 1 Năm học 2025-2026`,
      semester: 'HK1',
      schoolYear: '2025-2026',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'UPCOMING',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: ExamPeriod) => {
    setEditingPeriod(p);
    setFormData({
      name: p.name,
      semester: p.semester,
      schoolYear: p.schoolYear,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      status: p.status || 'UPCOMING',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await api.patch(`/exam-periods/${editingPeriod.id}`, formData);
        setToast({ message: 'Cập nhật kỳ thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-periods', formData);
        setToast({ message: 'Thêm kỳ thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const p = periods.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Kỳ thi',
      message: `Bạn có chắc chắn muốn xóa kỳ thi ${p?.name || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-periods/${id}`);
          setToast({ message: 'Đã xóa kỳ thi thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };



  const exportCsv = () => {
    const headers = 'Tên Kỳ thi,Học kỳ,Năm học,Ngày bắt đầu,Ngày kết thúc,Trạng thái\n';
    const rows = filteredPeriods
      .map(
        (p) =>
          `"${p.name}","${p.semester}","${p.schoolYear}","${
            p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : ''
          }","${p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : ''}","${({ UPCOMING: 'Sắp diễn ra', ONGOING: 'Đang diễn ra', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy', DRAFT: 'Bản nháp' } as Record<string, string>)[p.status] || p.status}"`,
      )
      .join('\n');
    downloadCsv('danh_sach_ky_thi.csv', headers + rows);
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH KỲ THI HỌC KỲ',
      subtitle: 'Danh sách các đợt thi được thiết lập trong hệ thống',
      metaInfo: [
        { label: 'Tổng số kỳ thi', value: String(periods.length) },
        { label: 'Đang diễn ra', value: String(ongoingPeriods) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Tên Kỳ thi', width: '200px' },
        { header: 'Học kỳ', width: '80px', align: 'center' },
        { header: 'Năm học', width: '100px', align: 'center' },
        { header: 'Ngày bắt đầu', width: '110px', align: 'center' },
        { header: 'Ngày kết thúc', width: '110px', align: 'center' },
        { header: 'Trạng thái', width: '110px', align: 'center' },
      ],
      rows: filteredPeriods.map((p, idx) => [
        idx + 1,
        p.name,
        p.semester,
        p.schoolYear,
        p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '---',
        p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '---',
        p.status === 'ONGOING' ? 'Đang diễn ra' : p.status === 'COMPLETED' ? 'Đã kết thúc' : 'Sắp diễn ra',
      ]),
    });
  };

  const ongoingPeriods = periods.filter((period) => period.status === 'ONGOING').length;
  const plannedPeriods = periods.filter((period) => period.status === 'UPCOMING' || period.status === 'ONGOING').length;
  const schoolYears = new Set(periods.map((period) => period.schoolYear)).size;

  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số Kỳ thi', value: periods.length, subtext: 'Kế hoạch khảo thí', icon: Calendar, color: 'sky' },
    { title: 'Kỳ thi đang diễn ra', value: ongoingPeriods, subtext: 'Theo trạng thái kỳ thi', icon: Clock, color: 'emerald' },
    { title: 'Năm học có dữ liệu', value: schoolYears, subtext: 'Năm học trong danh sách kỳ thi', icon: Award, color: 'indigo' },
    { title: 'Kỳ đang chuẩn bị', value: plannedPeriods, subtext: 'Sắp diễn ra hoặc đang diễn ra', icon: CheckCircle2, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Kỳ thi">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Thiết lập các kỳ thi học kỳ, năm học và thời gian đợt thi</p>
          </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 bg-[#1e66f5] hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition"
              >
                <Printer className="h-4 w-4" /> In Báo cáo
              </button>
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-medium text-sm shadow-xs transition"
              >
                <Download className="h-4 w-4" /> Xuất Danh sách
              </button>
              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-[#1e66f5] hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition"
                >
                  <Plus className="h-4 w-4" /> Thêm Kỳ thi
                </button>
              )}
            </div>
          </div>

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Tên kỳ thi, Học kỳ, Năm học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách kỳ thi...</div>
            ) : filteredPeriods.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy kỳ thi phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Tên Kỳ thi</th>
                      <th className="p-4">Học kỳ</th>
                      <th className="p-4">Năm học</th>
                      <th className="p-4">Thời gian</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredPeriods.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                            <Calendar className="h-4 w-4" />
                          </div>
                          {p.name}
                        </td>
                        <td className="p-4 font-semibold text-sky-700">{p.semester}</td>
                        <td className="p-4 font-medium text-slate-800">{p.schoolYear}</td>
                        <td className="p-4 text-xs text-slate-600">
                          {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '---'} -{' '}
                          {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '---'}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {{ UPCOMING: 'Sắp diễn ra', ONGOING: 'Đang diễn ra', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy', DRAFT: 'Bản nháp' }[p.status] || 'Hoạt động'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerPeriod(p)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem chi tiết kỳ thi"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => openEditModal(p)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPeriod ? 'Chỉnh sửa Kỳ thi' : 'Thêm Kỳ thi Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Kỳ thi</label>
            <input
              type="text"
              required
              placeholder="VD: Kỳ thi Học kỳ 1 Năm học 2025-2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Học kỳ</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="HK1">Học kỳ 1 (HK1)</option>
                <option value="HK2">Học kỳ 2 (HK2)</option>
                <option value="HK3">Học kỳ Hè (HK3)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Năm học</label>
              <input
                type="text"
                required
                placeholder="VD: 2025-2026"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm"
            >
              Lưu Kỳ thi
            </button>
          </div>
        </form>
      </Modal>

      {/* Period Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerPeriod)}
        onClose={() => setDrawerPeriod(null)}
        title={drawerPeriod?.name || ''}
        subtitle={`Học kỳ: ${drawerPeriod?.semester} · Năm học: ${drawerPeriod?.schoolYear}`}
        avatarText={drawerPeriod?.semester || 'KT'}
        badge={{ label: ({ UPCOMING: 'Sắp diễn ra', ONGOING: 'Đang diễn ra', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy', DRAFT: 'Bản nháp' } as Record<string, string>)[drawerPeriod?.status || ''] || 'Đang diễn ra', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }}
        details={[
          { label: 'Tên kỳ thi', value: drawerPeriod?.name, icon: Calendar },
          { label: 'Học kỳ', value: drawerPeriod?.semester },
          { label: 'Năm học', value: drawerPeriod?.schoolYear, icon: Award },
          {
            label: 'Ngày bắt đầu',
            value: drawerPeriod?.startDate ? new Date(drawerPeriod.startDate).toLocaleDateString('vi-VN') : '---',
            icon: Clock,
          },
          {
            label: 'Ngày kết thúc',
            value: drawerPeriod?.endDate ? new Date(drawerPeriod.endDate).toLocaleDateString('vi-VN') : '---',
            icon: Clock,
          },
          { label: 'Trạng thái', value: ({ UPCOMING: 'Sắp diễn ra', ONGOING: 'Đang diễn ra', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy', DRAFT: 'Bản nháp' } as Record<string, string>)[drawerPeriod?.status || ''] || 'Hoạt động', icon: CheckCircle2 },
        ]}
      />

      {/* Confirm Popup */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
