'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
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
  BookOpen,
  Monitor,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { ExamSchedule, ExamPeriod, Subject } from '../../types';

export default function ExamSchedulesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerSchedule, setDrawerSchedule] = useState<ExamSchedule | null>(null);
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

  // Toast & Confirm
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
      const params = new URLSearchParams(window.location.search);
      const authUser = getAuthUser();
      if (params.get('action') === 'create' && authUser?.role === 'ADMIN') {
        openAddModal();
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchPeriod = selectedPeriodId ? String(s.examPeriodId) === selectedPeriodId : true;
    const subName = s.subject?.subjectName || '';
    const subCode = s.subject?.subjectCode || '';
    const matchSearch =
      subName.toLowerCase().includes(search.toLowerCase()) ||
      subCode.toLowerCase().includes(search.toLowerCase());
    return matchPeriod && matchSearch;
  });

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      examPeriodId: selectedPeriodId || (periods[0]?.id ? String(periods[0].id) : ''),
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '09:30',
      examType: 'TRAC_NGHIEM',
      note: 'Thi trắc nghiệm máy tính',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sch: ExamSchedule) => {
    setEditingSchedule(sch);
    setFormData({
      examPeriodId: String(sch.examPeriodId),
      subjectId: String(sch.subjectId),
      examDate: sch.examDate ? new Date(sch.examDate).toISOString().split('T')[0] : '',
      startTime: sch.startTime || '08:00',
      endTime: sch.endTime || '09:30',
      examType: sch.examType || 'TRAC_NGHIEM',
      note: sch.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        examPeriodId: Number(formData.examPeriodId),
        subjectId: Number(formData.subjectId),
      };
      if (editingSchedule) {
        await api.patch(`/exam-schedules/${editingSchedule.id}`, payload);
        setToast({ message: 'Cập nhật lịch thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-schedules', payload);
        setToast({ message: 'Tạo lịch thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const sch = schedules.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Lịch thi',
      message: `Bạn có chắc chắn muốn xóa lịch thi môn ${sch?.subject?.subjectName || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-schedules/${id}`);
          setToast({ message: 'Đã xóa lịch thi thành công!', type: 'success' });
          fetchInitialData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const exportCsv = () => {
    const headers = 'Môn thi,Mã môn,Ngày thi,Giờ thi,Hình thức,Ghi chú\n';
    const rows = filteredSchedules
      .map(
        (s) =>
          `"${s.subject?.subjectName || ''}","${s.subject?.subjectCode || ''}","${
            s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : ''
          }","${s.startTime} - ${s.endTime}","${
            s.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm Online' : 'Tự luận'
          }","${s.note || ''}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_lich_thi.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng ca thi đã lập', value: schedules.length, subtext: 'Tất cả các môn thi', icon: Calendar, color: 'sky' },
    { title: 'Thi trắc nghiệm máy', value: schedules.filter((s) => s.examType === 'TRAC_NGHIEM').length, subtext: 'Chấm điểm tự động', icon: Monitor, color: 'emerald' },
    { title: 'Giám thị phân công', value: '100% Đã xếp', subtext: 'Cán bộ coi thi', icon: Users, color: 'indigo' },
    { title: 'Trạng thái Lịch thi', value: 'Đã công bố', subtext: 'Cho sinh viên xem', icon: CheckCircle2, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Lịch thi">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Xếp ca thi, ngày thi, hình thức thi trắc nghiệm và gán phòng máy tính</p>
          </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-medium text-sm shadow-xs transition"
              >
                <Download className="h-4 w-4" /> Xuất Danh sách
              </button>
              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
                >
                  <Plus className="h-4 w-4" /> Thêm Ca thi Mới
                </button>
              )}
            </div>
          </div>

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Tên môn học, Mã môn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Kỳ thi:</span>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="">Tất cả Kỳ thi</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải lịch thi...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy ca thi phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Môn thi</th>
                      <th className="p-4">Ngày thi</th>
                      <th className="p-4">Giờ thi</th>
                      <th className="p-4">Hình thức</th>
                      <th className="p-4">Ghi chú</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSchedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p>{sch.subject?.subjectName || '---'}</p>
                            <p className="text-xs text-sky-700 font-semibold">{sch.subject?.subjectCode}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-700">
                          {sch.examDate ? new Date(sch.examDate).toLocaleDateString('vi-VN') : '---'}
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-900">
                          {sch.startTime} - {sch.endTime}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                            <Monitor className="h-3.5 w-3.5" /> {sch.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm Online' : 'Tự luận'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">{sch.note || '---'}</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerSchedule(sch)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem chi tiết ca thi"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => openEditModal(sch)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(sch.id)}
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
        title={editingSchedule ? 'Chỉnh sửa Ca thi' : 'Tạo Ca thi Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Môn thi</label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="">-- Chọn Môn thi --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectName} ({sub.subjectCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ngày thi</label>
              <input
                type="date"
                required
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hình thức thi</label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="TRAC_NGHIEM">Trắc nghiệm Online</option>
                <option value="TU_LUAN">Tự luận Giấy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giờ kết thúc</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ghi chú</label>
            <input
              type="text"
              placeholder="VD: Mang theo thẻ sinh viên"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
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
              Lưu Ca thi
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSchedule)}
        onClose={() => setDrawerSchedule(null)}
        title={drawerSchedule?.subject?.subjectName || ''}
        subtitle={`Mã môn: ${drawerSchedule?.subject?.subjectCode}`}
        avatarText={drawerSchedule?.subject?.subjectCode ? drawerSchedule.subject.subjectCode.slice(0, 2) : 'LT'}
        badge={{ label: 'Đã xếp lịch', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }}
        details={[
          { label: 'Môn thi', value: drawerSchedule?.subject?.subjectName, icon: BookOpen },
          { label: 'Mã môn', value: drawerSchedule?.subject?.subjectCode },
          {
            label: 'Ngày thi',
            value: drawerSchedule?.examDate ? new Date(drawerSchedule.examDate).toLocaleDateString('vi-VN') : '---',
            icon: Calendar,
          },
          { label: 'Khung giờ', value: `${drawerSchedule?.startTime} - ${drawerSchedule?.endTime}`, icon: Clock },
          { label: 'Hình thức thi', value: drawerSchedule?.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm Online' : 'Tự luận' },
          { label: 'Ghi chú', value: drawerSchedule?.note || 'Không có' },
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
