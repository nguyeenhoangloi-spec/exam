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
import { ExcelImportModal } from '../../components/ExcelImportModal';
import {
  Plus,
  Trash2,
  Edit,
  GraduationCap,
  Award,
  ShieldCheck,
  HelpCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Eye,
  Building2,
  Mail,
  Phone,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Teacher, Department } from '../../types';

export default function TeachersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [drawerTeacher, setDrawerTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    teacherCode: '',
    fullName: '',
    degree: 'TS',
    email: '',
    phone: '',
    departmentId: '',
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
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [resTeachers, resDepts] = await Promise.all([
        api.get('/teachers'),
        api.get('/departments'),
      ]);
      setTeachers(resTeachers.data);
      setDepartments(resDepts.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherCode.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDeptId ? String(t.departmentId) === selectedDeptId : true;
    return matchSearch && matchDept;
  });

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      teacherCode: `GV00${teachers.length + 1}`,
      fullName: '',
      degree: 'TS',
      email: '',
      phone: '',
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      teacherCode: t.teacherCode,
      fullName: t.fullName,
      degree: t.degree || 'TS',
      email: t.email || '',
      phone: t.phone || '',
      departmentId: t.departmentId ? String(t.departmentId) : '',
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
      if (editingTeacher) {
        await api.patch(`/teachers/${editingTeacher.id}`, payload);
        setToast({ message: 'Cập nhật giảng viên thành công!', type: 'success' });
      } else {
        await api.post('/teachers', payload);
        setToast({ message: 'Thêm giảng viên mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const t = teachers.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Giảng viên',
      message: `Bạn có chắc chắn muốn xóa giảng viên ${t?.fullName || ''} (${t?.teacherCode || ''})? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/teachers/${id}`);
          setToast({ message: 'Đã xóa giảng viên thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const handleImportSuccess = (data: any[]) => {
    setToast({ message: `Đã nhập thành công ${data.length} giảng viên từ file Excel!`, type: 'success' });
    fetchData();
  };

  const exportCsv = () => {
    const headers = 'Mã GV,Họ và tên,Học vị,Email,Số điện thoại,Khoa trực thuộc\n';
    const rows = filteredTeachers
      .map(
        (t) =>
          `"${t.teacherCode}","${t.fullName}","${t.degree || 'TS'}","${t.email}","${t.phone || ''}","${
            t.department?.name || ''
          }"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_giang_vien.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng giảng viên', value: teachers.length, subtext: 'Trực thuộc các Khoa', icon: GraduationCap, color: 'sky' },
    { title: 'Trình độ TS / GS', value: '83.3%', subtext: 'Tỷ lệ trình độ cao', icon: Award, color: 'indigo', trend: 'Đạt chuẩn Bộ GD' },
    { title: 'Ca coi thi phân công', value: '12 ca', subtext: 'Kỳ thi HK1 (2025-2026)', icon: ShieldCheck, color: 'emerald' },
    { title: 'Câu hỏi đóng góp', value: '48 câu', subtext: 'Ngân hàng câu hỏi', icon: HelpCircle, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Giảng viên">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Quản lý danh mục cán bộ giảng dạy, học vị, khoa và lịch coi thi</p>
          </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
              >
                <FileSpreadsheet className="h-4 w-4" /> Nhập Excel
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
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
                >
                  <Plus className="h-4 w-4" /> Thêm Giảng viên
                </button>
              )}
            </div>
          </div>

          {/* KPI Header Cards */}
          <KPICards items={kpiItems} />

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Mã GV, Họ tên, Email..."
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
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách giảng viên...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy giảng viên phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Mã GV</th>
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Học vị</th>
                      <th className="p-4">Khoa trực thuộc</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-sky-700">{t.teacherCode}</td>
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                            {t.fullName.slice(-1)}
                          </div>
                          {t.fullName}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                            {t.degree || 'TS'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{t.department?.name || '---'}</td>
                        <td className="p-4 text-xs text-slate-500">{t.email}</td>
                        <td className="p-4 text-xs text-slate-600">{t.phone || '---'}</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerTeacher(t)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem hồ sơ chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => openEditModal(t)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(t.id)}
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
        title={editingTeacher ? 'Chỉnh sửa Giảng viên' : 'Thêm Giảng viên Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Giảng viên</label>
            <input
              type="text"
              required
              value={formData.teacherCode}
              onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Họ và tên</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Học vị / Học hàm</label>
              <select
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="GS.TS">GS.TS</option>
                <option value="PGS.TS">PGS.TS</option>
                <option value="TS">TS (Tiến sĩ)</option>
                <option value="ThS">ThS (Thạc sĩ)</option>
              </select>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Công vụ</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              Lưu Giảng viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập Danh sách Giảng viên từ Excel"
        templateFileName="danh_sach_giang_vien_mau.csv"
        onImportSuccess={handleImportSuccess}
      />

      {/* Teacher Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerTeacher)}
        onClose={() => setDrawerTeacher(null)}
        title={drawerTeacher?.fullName || ''}
        subtitle={`Mã cán bộ: ${drawerTeacher?.teacherCode}`}
        avatarText={drawerTeacher?.fullName ? drawerTeacher.fullName.slice(-1) : 'GV'}
        badge={{ label: drawerTeacher?.degree || 'TS', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }}
        details={[
          { label: 'Mã giảng viên', value: drawerTeacher?.teacherCode, icon: User },
          { label: 'Họ và tên', value: drawerTeacher?.fullName },
          { label: 'Học vị / Học hàm', value: drawerTeacher?.degree || 'TS', icon: GraduationCap },
          { label: 'Khoa trực thuộc', value: drawerTeacher?.department?.name, icon: Building2 },
          { label: 'Email công vụ', value: drawerTeacher?.email, icon: Mail },
          { label: 'Số điện thoại', value: drawerTeacher?.phone || '---', icon: Phone },
        ]}
        extraSections={[
          {
            title: 'Lịch Phân công Giám thị Coi thi',
            content: (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div>
                    <p className="font-bold text-slate-800">Phòng thi PM201 - Ca 1 (08:00 - 09:30)</p>
                    <p className="text-slate-500 mt-0.5">Kỳ thi HK1 (2025-2026) · Môn OOP</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-1 font-bold text-sky-700 text-[10px]">Giám thị 1</span>
                </div>
              </div>
            ),
          },
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
