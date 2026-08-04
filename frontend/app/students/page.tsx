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
  Search,
  Trash2,
  Edit,
  User,
  Users,
  CheckCircle2,
  School,
  Award,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Student, ClassItem } from '../../types';

export default function StudentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '2004-01-01',
    email: '',
    phone: '',
    classId: '',
  });

  // Toast & Confirm State
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
      const [resStudents, resClasses] = await Promise.all([
        api.get('/students'),
        api.get('/classes'),
      ]);
      setStudents(resStudents.data);
      setClasses(resClasses.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClassId ? String(s.classId) === selectedClassId : true;
    return matchSearch && matchClass;
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      studentCode: `SV20260${Math.floor(10 + Math.random() * 90)}`,
      fullName: '',
      gender: 'Nam',
      dateOfBirth: '2004-01-01',
      email: '',
      phone: '',
      classId: classes[0]?.id ? String(classes[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentCode: student.studentCode,
      fullName: student.fullName,
      gender: student.gender || 'Nam',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '2004-01-01',
      email: student.email || '',
      phone: student.phone || '',
      classId: student.classId ? String(student.classId) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        classId: Number(formData.classId),
      };
      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, payload);
        setToast({ message: 'Cập nhật sinh viên thành công!', type: 'success' });
      } else {
        await api.post('/students', payload);
        setToast({ message: 'Thêm sinh viên mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const st = students.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Sinh viên',
      message: `Bạn có chắc chắn muốn xóa sinh viên ${st?.fullName || ''} (${st?.studentCode || ''})? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/students/${id}`);
          setToast({ message: 'Đã xóa sinh viên thành công!', type: 'success' });
          fetchInitialData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const handleImportSuccess = (importedData: any[]) => {
    setToast({ message: `Đã nhập thành công ${importedData.length} sinh viên từ file Excel!`, type: 'success' });
    fetchInitialData();
  };

  const exportCsv = () => {
    const headers = 'Mã SV,Họ và tên,Giới tính,Ngày sinh,Email,Số điện thoại,Lớp\n';
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.studentCode}","${s.fullName}","${s.gender || 'Nam'}","${
            s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('vi-VN') : ''
          }","${s.email}","${s.phone || ''}","${s.class?.name || ''}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_sinh_vien.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng sinh viên', value: students.length, subtext: 'Chính quy K65 - K66', icon: Users, color: 'sky' },
    { title: 'Đang học tập', value: students.length, subtext: 'Đủ ĐK Khảo thí', icon: CheckCircle2, color: 'emerald', trend: '100% Hợp lệ' },
    { title: 'Số lớp học', value: classes.length, subtext: 'Đào tạo chuyên ngành', icon: School, color: 'indigo' },
    { title: 'Tỷ lệ thi đạt', value: '98.5%', subtext: 'Kỳ thi mới nhất', icon: Award, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Sinh viên">
      <div className="flex min-h-screen flex-col min-w-0 bg-slate-50/50">
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quản lý Hồ sơ Sinh viên</h1>
              <p className="text-xs text-slate-500 mt-0.5">Quản lý danh sách sinh viên chính quy, lớp học và điều kiện dự thi</p>
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
                  <Plus className="h-4 w-4" /> Thêm Sinh viên
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
                placeholder="Tìm theo Mã SV, Họ tên, Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Lớp:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="">Tất cả các lớp</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách sinh viên...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Khôn tìm thấy sinh viên phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Mã SV</th>
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Giới tính</th>
                      <th className="p-4">Lớp học</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-sky-700">{s.studentCode}</td>
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                            {s.fullName.slice(-1)}
                          </div>
                          {s.fullName}
                        </td>
                        <td className="p-4">{s.gender || 'Nam'}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {s.class?.name || 'Chưa xếp lớp'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">{s.email}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Đang học
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerStudent(s)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem hồ sơ chi tiết"
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
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Chỉnh sửa Hồ sơ Sinh viên' : 'Thêm Sinh viên Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Sinh viên</label>
            <input
              type="text"
              required
              value={formData.studentCode}
              onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
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
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Lớp học</label>
              <select
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Sinh viên</label>
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
              Lưu Sinh viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập Danh sách Sinh viên từ Excel"
        templateFileName="danh_sach_sinh_vien_mau.csv"
        onImportSuccess={handleImportSuccess}
      />

      {/* Student Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerStudent)}
        onClose={() => setDrawerStudent(null)}
        title={drawerStudent?.fullName || ''}
        subtitle={`Mã sinh viên: ${drawerStudent?.studentCode}`}
        avatarText={drawerStudent?.fullName ? drawerStudent.fullName.slice(-1) : 'SV'}
        badge={{ label: 'Đang học', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }}
        details={[
          { label: 'Mã sinh viên', value: drawerStudent?.studentCode, icon: User },
          { label: 'Họ và tên', value: drawerStudent?.fullName },
          { label: 'Giới tính', value: drawerStudent?.gender || 'Nam' },
          {
            label: 'Ngày sinh',
            value: drawerStudent?.dateOfBirth ? new Date(drawerStudent.dateOfBirth).toLocaleDateString('vi-VN') : '---',
            icon: Calendar,
          },
          { label: 'Lớp học', value: drawerStudent?.class?.name, icon: School },
          { label: 'Email', value: drawerStudent?.email, icon: Mail },
          { label: 'Số điện thoại', value: drawerStudent?.phone || '---', icon: Phone },
        ]}
        extraSections={[
          {
            title: 'Trạng thái Đăng ký Khảo thí',
            content: (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-emerald-800 font-medium">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Đủ điều kiện thi HK1 (2025-2026)
                  </span>
                  <span className="font-bold">Đã duyệt</span>
                </div>
                <p className="text-slate-500">Sinh viên đã hoàn thành đóng học phí và tích lũy đủ 100% số tiết tham gia lớp học.</p>
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
