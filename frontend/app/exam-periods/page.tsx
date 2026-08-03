'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import { ExamPeriod } from '../../types';

export default function ExamPeriodsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
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

  const openAddModal = () => {
    setEditingPeriod(null);
    setFormData({
      name: 'Kỳ thi Cuối học kỳ 1 (2025-2026)',
      semester: 'HK1',
      schoolYear: '2025-2026',
      startDate: '2026-08-01',
      endDate: '2026-08-30',
      status: 'UPCOMING',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (period: ExamPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      semester: period.semester,
      schoolYear: period.schoolYear,
      startDate: new Date(period.startDate).toISOString().split('T')[0],
      endDate: new Date(period.endDate).toISOString().split('T')[0],
      status: period.status,
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
        setToast({ message: 'Thêm kỳ thi thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa kỳ thi này?')) return;
    try {
      await api.delete(`/exam-periods/${id}`);
      setToast({ message: 'Đã xóa kỳ thi!', type: 'success' });
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <AppShell user={currentUser} title="Quản lý Kỳ thi">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-xl font-bold text-slate-800">Danh sách Kỳ thi</h1>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo kỳ thi mới</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Tên kỳ thi</th>
                    <th className="px-6 py-4">Học kỳ</th>
                    <th className="px-6 py-4">Năm học</th>
                    <th className="px-6 py-4">Ngày bắt đầu</th>
                    <th className="px-6 py-4">Ngày kết thúc</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    {currentUser?.role === 'ADMIN' && <th className="px-6 py-4 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Đang tải...
                      </td>
                    </tr>
                  ) : periods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Chưa có kỳ thi nào.
                      </td>
                    </tr>
                  ) : (
                    periods.map((period) => (
                      <tr key={period.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">{period.name}</td>
                        <td className="px-6 py-4 font-medium">{period.semester}</td>
                        <td className="px-6 py-4">{period.schoolYear}</td>
                        <td className="px-6 py-4">{new Date(period.startDate).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4">{new Date(period.endDate).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              period.status === 'ONGOING'
                                ? 'bg-emerald-50 text-emerald-700'
                                : period.status === 'UPCOMING'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {period.status}
                          </span>
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(period)}
                              className="p-1.5 hover:bg-slate-100 text-sky-600 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(period.id)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPeriod ? 'Sửa kỳ thi' : 'Tạo kỳ thi mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên kỳ thi</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Học kỳ</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="HK1">Học kỳ 1 (HK1)</option>
                <option value="HK2">Học kỳ 2 (HK2)</option>
                <option value="HK_HE">Học kỳ Hè (HK_HE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Năm học</label>
              <input
                type="text"
                required
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ngày kết thúc</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="UPCOMING">Sắp diễn ra (UPCOMING)</option>
              <option value="ONGOING">Đang diễn ra (ONGOING)</option>
              <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm"
            >
              Lưu kỳ thi
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
