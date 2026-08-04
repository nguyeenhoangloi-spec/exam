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
  BookOpen,
  Building2,
  Award,
  Layers,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Subject, Department } from '../../types';

export default function SubjectsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerSubject, setDrawerSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: '3',
    departmentId: '',
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
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [resSubjects, resDepts] = await Promise.all([
        api.get('/subjects'),
        api.get('/departments'),
      ]);
      setSubjects(resSubjects.data);
      setDepartments(resDepts.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách môn học', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchSearch =
      s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDeptId ? String(s.departmentId) === selectedDeptId : true;
    return matchSearch && matchDept;
  });

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      subjectCode: `SUB00${subjects.length + 1}`,
      subjectName: '',
      credits: '3',
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData({
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      credits: String(sub.credits),
      departmentId: sub.departmentId ? String(sub.departmentId) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        credits: Number(formData.credits),
        departmentId: Number(formData.departmentId),
      };
      if (editingSubject) {
        await api.patch(`/subjects/${editingSubject.id}`, payload);
        setToast({ message: 'Cập nhật môn học thành công!', type: 'success' });
      } else {
        await api.post('/subjects', payload);
        setToast({ message: 'Thêm môn học mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const sub = subjects.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Môn học',
      message: `Bạn có chắc chắn muốn xóa môn ${sub?.subjectName || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/subjects/${id}`);
          setToast({ message: 'Đã xóa môn học thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const exportCsv = () => {
    const headers = 'Mã Môn,Tên Môn học,Số tín chỉ,Khoa quản lý\n';
    const rows = filteredSubjects
      .map(
        (s) =>
          `"${s.subjectCode}","${s.subjectName}","${s.credits}","${s.department?.name || ''}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_mon_hoc.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số môn học', value: subjects.length, subtext: 'Chương trình đào tạo', icon: BookOpen, color: 'sky' },
    { title: 'Tổng số tín chỉ', value: `${subjects.reduce((sum, s) => sum + s.credits, 0)} Tín`, subtext: 'Số tín chỉ tích lũy', icon: Award, color: 'indigo' },
    { title: 'Số chương học', value: '17 Chương', subtext: 'Phân bổ trong đề thi', icon: Layers, color: 'purple' },
    { title: 'Tỷ lệ phủ ngân hàng', value: '100%', subtext: 'Đã sẵn sàng thi', icon: CheckCircle2, color: 'emerald', trend: 'Đã tạo ma trận đề' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Môn học">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Quản lý các môn học, tín chỉ, ma trận đề thi và ngân hàng câu hỏi</p>
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
                  <Plus className="h-4 w-4" /> Thêm Môn học
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
                placeholder="Tìm theo Mã môn, Tên môn học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Khoa:</span>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="">Tất cả các Khoa</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách môn học...</div>
            ) : filteredSubjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy môn học phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Mã Môn</th>
                      <th className="p-4">Tên Môn học</th>
                      <th className="p-4">Số Tín chỉ</th>
                      <th className="p-4">Khoa quản lý</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSubjects.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-sky-700">{s.subjectCode}</td>
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          {s.subjectName}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                            {s.credits} Tín chỉ
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{s.department?.name || '---'}</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerSubject(s)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem chi tiết môn học"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id)}
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
        title={editingSubject ? 'Chỉnh sửa Môn học' : 'Thêm Môn học Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Môn học</label>
            <input
              type="text"
              required
              placeholder="VD: INT1001"
              value={formData.subjectCode}
              onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Môn học</label>
            <input
              type="text"
              required
              placeholder="VD: Lập trình Hướng đối tượng"
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Số tín chỉ</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Khoa quản lý</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">-- Chọn Khoa --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
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
              Lưu Môn học
            </button>
          </div>
        </form>
      </Modal>

      {/* Subject Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSubject)}
        onClose={() => setDrawerSubject(null)}
        title={drawerSubject?.subjectName || ''}
        subtitle={`Mã môn: ${drawerSubject?.subjectCode}`}
        avatarText={drawerSubject?.subjectCode ? drawerSubject.subjectCode.slice(0, 2) : 'MH'}
        badge={{ label: `${drawerSubject?.credits} Tín chỉ`, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }}
        details={[
          { label: 'Mã môn học', value: drawerSubject?.subjectCode, icon: BookOpen },
          { label: 'Tên môn học', value: drawerSubject?.subjectName },
          { label: 'Số tín chỉ', value: `${drawerSubject?.credits} Tín chỉ`, icon: Award },
          { label: 'Khoa trực thuộc', value: drawerSubject?.department?.name, icon: Building2 },
          { label: 'Số chương bài giảng', value: '4 Chương học', icon: Layers },
          { label: 'Tỷ lệ câu hỏi', value: 'Đã sẵn sàng tạo đề thi', icon: HelpCircle },
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
