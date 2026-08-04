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
import { Plus, Trash2, Edit, School, Building2, Users, Search, Filter, Eye, GraduationCap } from 'lucide-react';
import { ClassItem, Department } from '../../types';

export default function ClassesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerClass, setDrawerClass] = useState<ClassItem | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
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
      const [resClasses, resDepts] = await Promise.all([
        api.get('/classes'),
        api.get('/departments'),
      ]);
      setClasses(resClasses.data);
      setDepartments(resDepts.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDeptId ? String(c.departmentId) === selectedDeptId : true;
    return matchSearch && matchDept;
  });

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({
      code: `CNTT-K${65 + Math.floor(Math.random() * 2)}`,
      name: '',
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassItem) => {
    setEditingClass(c);
    setFormData({
      code: c.code,
      name: c.name,
      departmentId: c.departmentId ? String(c.departmentId) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
      };
      if (editingClass) {
        await api.patch(`/classes/${editingClass.id}`, payload);
        setToast({ message: 'Cập nhật lớp học thành công!', type: 'success' });
      } else {
        await api.post('/classes', payload);
        setToast({ message: 'Thêm lớp học mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const cls = classes.find((c) => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Lớp học',
      message: `Bạn có chắc chắn muốn xóa lớp ${cls?.name || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/classes/${id}`);
          setToast({ message: 'Đã xóa lớp học thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số lớp học', value: classes.length, subtext: 'Chính quy K65 - K66', icon: School, color: 'sky' },
    { title: 'Khoa đào tạo', value: departments.length, subtext: 'Các khoa chuyên ngành', icon: Building2, color: 'indigo' },
    { title: 'Tổng sinh viên', value: '8 sinh viên', subtext: 'Đã phân chia lớp', icon: Users, color: 'emerald' },
    { title: 'Cố vấn học tập', value: '100% Đã gán', subtext: 'Giảng viên chủ nhiệm', icon: GraduationCap, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Lớp học">
      <div className="flex min-h-screen flex-col min-w-0 bg-slate-50/50">
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quản lý Lớp học Chuyên ngành</h1>
              <p className="text-xs text-slate-500 mt-0.5">Quản lý danh sách lớp học, khoa trực thuộc và phân công cố vấn học tập</p>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
              >
                <Plus className="h-4 w-4" /> Thêm Lớp mới
              </button>
            )}
          </div>

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Mã lớp, Tên lớp học..."
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
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách lớp học...</div>
            ) : filteredClasses.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy lớp học phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Mã Lớp</th>
                      <th className="p-4">Tên Lớp học</th>
                      <th className="p-4">Khoa trực thuộc</th>
                      <th className="p-4">Sĩ số ước tính</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredClasses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-sky-700">{c.code}</td>
                        <td className="p-4 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-4 font-medium text-slate-800">{c.department?.name || '---'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <Users className="h-3.5 w-3.5 text-slate-400" /> 40 Sinh viên
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerClass(c)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem chi tiết lớp"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => openEditModal(c)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(c.id)}
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
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Chỉnh sửa Lớp học' : 'Thêm Lớp học Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Lớp</label>
            <input
              type="text"
              required
              placeholder="VD: CNTT-K65"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Lớp học</label>
            <input
              type="text"
              required
              placeholder="VD: Lớp Công nghệ thông tin K65"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Khoa trực thuộc</label>
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
              Lưu Lớp học
            </button>
          </div>
        </form>
      </Modal>

      {/* Class Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerClass)}
        onClose={() => setDrawerClass(null)}
        title={drawerClass?.name || ''}
        subtitle={`Mã lớp: ${drawerClass?.code}`}
        avatarText={drawerClass?.code ? drawerClass.code.slice(0, 2) : 'LH'}
        badge={{ label: 'Chính quy', className: 'bg-sky-50 text-sky-700 border-sky-200' }}
        details={[
          { label: 'Mã lớp', value: drawerClass?.code, icon: School },
          { label: 'Tên lớp học', value: drawerClass?.name },
          { label: 'Khoa trực thuộc', value: drawerClass?.department?.name, icon: Building2 },
          { label: 'Cố vấn học tập', value: 'GS.TS Nguyễn Văn A', icon: GraduationCap },
          { label: 'Sĩ số', value: '40 sinh viên', icon: Users },
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
