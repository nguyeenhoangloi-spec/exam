'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import { ExamSchedule, ExamPeriod, Subject } from '../../types';

export default function ExamSchedulesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [formData, setFormData] = useState({
    examPeriodId: '',
    subjectId: '',
    examDate: '2026-08-15',
    startTime: '08:00',
    endTime: '09:30',
    examType: 'TRAC_NGHIEM',
    note: '',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      const [resPeriods, resSubjects, resSchedules] = await Promise.all([
        api.get('/exam-periods'),
        api.get('/subjects'),
        api.get('/exam-schedules'),
      ]);
      setPeriods(resPeriods.data);
      setSubjects(resSubjects.data);
      setSchedules(resSchedules.data);
      if (resPeriods.data.length > 0) {
        setSelectedPeriodId(resPeriods.data[0].id.toString());
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulesByPeriod = async (periodId?: string) => {
    setLoading(true);
    try {
      const url = periodId ? `/exam-schedules?examPeriodId=${periodId}` : '/exam-schedules';
      const res = await api.get(url);
      setSchedules(res.data);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      examPeriodId: selectedPeriodId || periods[0]?.id?.toString() || '',
      subjectId: subjects[0]?.id?.toString() || '',
      examDate: '2026-08-15',
      startTime: '08:00',
      endTime: '09:30',
      examType: 'TRAC_NGHIEM',
      note: 'Thi trắc nghiệm tập trung',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sch: ExamSchedule) => {
    setEditingSchedule(sch);
    setFormData({
      examPeriodId: sch.examPeriodId.toString(),
      subjectId: sch.subjectId.toString(),
      examDate: new Date(sch.examDate).toISOString().split('T')[0],
      startTime: sch.startTime,
      endTime: sch.endTime,
      examType: sch.examType,
      note: sch.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        examPeriodId: parseInt(formData.examPeriodId, 10),
        subjectId: parseInt(formData.subjectId, 10),
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        examType: formData.examType,
        note: formData.note,
      };

      if (editingSchedule) {
        await api.patch(`/exam-schedules/${editingSchedule.id}`, payload);
        setToast({ message: 'Cập nhật lịch thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-schedules', payload);
        setToast({ message: 'Tạo lịch thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchSchedulesByPeriod(selectedPeriodId);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa lịch thi này?')) return;
    try {
      await api.delete(`/exam-schedules/${id}`);
      setToast({ message: 'Đã xóa lịch thi!', type: 'success' });
      fetchSchedulesByPeriod(selectedPeriodId);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <AppShell user={currentUser} title="Quản lý Lịch thi">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Lọc kỳ thi:</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => {
                  setSelectedPeriodId(e.target.value);
                  fetchSchedulesByPeriod(e.target.value);
                }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-sky-500 shadow-sm min-w-[240px]"
              >
                <option value="">Tất cả kỳ thi</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo lịch thi mới</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Môn thi</th>
                    <th className="px-6 py-4">Kỳ thi</th>
                    <th className="px-6 py-4">Ngày thi</th>
                    <th className="px-6 py-4">Giờ thi</th>
                    <th className="px-6 py-4">Hình thức</th>
                    <th className="px-6 py-4">Phòng thi & Số lượng</th>
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
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Chưa có lịch thi nào.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{sch.subject?.subjectName}</p>
                          <span className="text-xs text-slate-400">{sch.subject?.subjectCode}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{sch.examPeriod?.name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {new Date(sch.examDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-sky-600">
                          {sch.startTime} - {sch.endTime}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium">
                            {sch.examType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {sch.examScheduleRooms && sch.examScheduleRooms.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {sch.examScheduleRooms.map((sr: any) => (
                                <span key={sr.id} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2 py-0.5 rounded font-medium">
                                  {sr.room.roomCode} ({sr._count?.examRoomStudents || 0} SV)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium">Chưa xếp phòng</span>
                          )}
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(sch)}
                              className="p-1.5 hover:bg-slate-100 text-sky-600 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(sch.id)}
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
        title={editingSchedule ? 'Sửa lịch thi' : 'Tạo lịch thi mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kỳ thi</label>
              <select
                value={formData.examPeriodId}
                onChange={(e) => setFormData({ ...formData, examPeriodId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Môn thi</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} ({s.subjectCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ngày thi</label>
            <input
              type="date"
              required
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Giờ bắt đầu (startTime)</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Giờ kết thúc (endTime)</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Hình thức thi</label>
            <select
              value={formData.examType}
              onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="TRAC_NGHIEM">Trắc nghiệm máy tính</option>
              <option value="TU_LUAN">Tự luận trên giấy</option>
              <option value="VAN_DAP">Vấn đáp</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
            />
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
              Lưu lịch thi
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
