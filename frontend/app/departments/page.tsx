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
import { Plus, Trash2, Edit, Building2, Users, GraduationCap, Search, Eye, CheckCircle2 } from 'lucide-react';
import { Department } from '../../types';

export default function DepartmentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerDepartment, setDrawerDepartment] = useState<Department | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
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
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách khoa', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingDepartment(null);
    setFormData({ code: '', name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({ code: dept.code, name: dept.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await api.patch(`/departments/${editingDepartment.id}`, formData);
        setToast({ message: 'Cập nhật khoa thành công!', type: 'success' });
      } else {
        await api.post('/departments', formData);
        setToast({ message: 'Thêm khoa mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const dept = departments.find((d) => d.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Khoa',
      message: `Bạn có chắc chắn muốn xóa khoa ${dept?.name || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/departments/${id}`);
          setToast({ message: 'Đã xóa khoa thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số Khoa/Viện', value: departments.length, subtext: 'Trực thuộc Trường', icon: Building2, color: 'sky' },
    { title: 'Đội ngũ Giảng viên', value: '6 Giảng viên', subtext: 'Cán bộ giảng dạy', icon: GraduationCap, color: 'indigo' },
    { title: 'Sinh viên đào tạo', value: '8 Sinh viên', subtext: 'Theo dõi khảo thí', icon: Users, color: 'emerald' },
    { title: 'Trạng thái Đơn vị', value: '100% Hoạt động', subtext: 'Đã chuẩn hóa mã', icon: CheckCircle2, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Khoa">
      <div className="flex min-h-screen flex-col min-w-0 bg-slate-50/50">
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Danh sách Khoa & Viện Đào tạo</h1>
              <p className="text-xs text-slate-500 mt-0.5">Quản lý các khoa chuyên môn, bộ môn và mã định danh bộ bộ ban</p>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
              >
                <Plus className="h-4 w-4" /> Thêm Khoa mới
              </button>
            )}
          </div>

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Mã khoa, Tên Khoa / Viện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách khoa...</div>
            ) : filteredDepartments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy khoa phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Mã Khoa</th>
                      <th className="p-4">Tên Khoa / Viện</th>
                      <th className="p-4">Giảng viên đại diện</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredDepartments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-sky-700">{d.code}</td>
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                            <Building2 className="h-4 w-4" />
                          </div>
                          {d.name}
                        </td>
                        <td className="p-4 text-xs text-slate-600 font-medium">GS.TS Nguyễn Văn A</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerDepartment(d)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem chi tiết khoa"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => openEditModal(d)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(d.id)}
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
        title={editingDepartment ? 'Chỉnh sửa Khoa' : 'Thêm Khoa Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Khoa</label>
            <input
              type="text"
              required
              placeholder="VD: CNTT"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Khoa / Viện</label>
            <input
              type="text"
              required
              placeholder="VD: Khoa Công nghệ thông tin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Lưu Khoa
            </button>
          </div>
        </form>
      </Modal>

      {/* Department Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerDepartment)}
        onClose={() => setDrawerDepartment(null)}
        title={drawerDepartment?.name || ''}
        subtitle={`Mã đơn vị: ${drawerDepartment?.code}`}
        avatarText={drawerDepartment?.code ? drawerDepartment.code.slice(0, 2) : 'KH'}
        badge={{ label: 'Khoa Chuyên Môn', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }}
        details={[
          { label: 'Mã khoa', value: drawerDepartment?.code, icon: Building2 },
          { label: 'Tên khoa / viện', value: drawerDepartment?.name },
          { label: 'Trưởng khoa đại diện', value: 'GS.TS Nguyễn Văn A', icon: GraduationCap },
          { label: 'Trạng thái hoạt động', value: 'Hoạt động bình thường' },
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
