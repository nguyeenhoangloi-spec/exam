'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { ExcelImportModal } from '../../components/ExcelImportModal';
import { Student, ClassItem, User } from '../../types';
import { Search, X, ChevronDown, User as UserIcon, School, Mail, Phone, Calendar } from 'lucide-react';

import { StudentHeader } from '../../components/students/StudentHeader';
import { StudentKPICards } from '../../components/students/StudentKPICards';
import { StudentTableToolbar } from '../../components/students/StudentTableToolbar';
import { StudentTable } from '../../components/students/StudentTable';
import { StudentPaginationBar } from '../../components/students/StudentPaginationBar';

export default function StudentsPage() {
  usePageTitle('Quản lý Sinh viên');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    studentCode: true,
    fullName: true,
    gender: true,
    class: true,
    email: true,
    phone: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '2004-01-01',
    email: '',
    phone: '',
    classId: '',
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resStudents, resClasses] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
      ]);
      setStudents(resStudents.data || []);
      setClasses(resClasses.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu sinh viên', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchData();
  }, [fetchData, router]);

  // Compute DYNAMIC KPI Metrics from real API data
  const kpiData = useMemo(() => {
    return {
      total: students.length,
      withClass: students.filter((s) => Boolean(s.classId)).length,
      totalClasses: classes.length,
    };
  }, [students, classes]);

  // Filter & Sort Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch =
          s.fullName.toLowerCase().includes(search.toLowerCase()) ||
          s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase());
        const matchClass = selectedClassId ? String(s.classId) === selectedClassId : true;
        return matchSearch && matchClass;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
        if (sortOrder === 'name_desc') return b.fullName.localeCompare(a.fullName, 'vi');
        if (sortOrder === 'code_asc') return a.studentCode.localeCompare(b.studentCode);
        return b.id - a.id;
      });
  }, [students, search, selectedClassId, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / limit));
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredStudents.slice(start, start + limit);
  }, [filteredStudents, page, limit]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      studentCode: `SV${new Date().getFullYear()}${String(students.length + 1).padStart(3, '0')}`,
      fullName: '',
      gender: 'Nam',
      dateOfBirth: '2004-01-01',
      email: '',
      phone: '',
      classId: classes[0]?.id ? String(classes[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      studentCode: s.studentCode,
      fullName: s.fullName,
      gender: s.gender || 'Nam',
      dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '2004-01-01',
      email: s.email || '',
      phone: s.phone || '',
      classId: s.classId ? String(s.classId) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, classId: Number(formData.classId) };
      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, payload);
        setToast({ message: 'Cập nhật sinh viên thành công!', type: 'success' });
      } else {
        await api.post('/students', payload);
        setToast({ message: 'Thêm sinh viên mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const s = students.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Sinh viên',
      message: `Bạn có chắc chắn muốn xóa sinh viên ${s?.fullName || ''} (${s?.studentCode || ''})? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/students/${id}`);
          setToast({ message: 'Đã xóa sinh viên thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const exportExcel = () => {
    exportToFormattedExcel({
      filename: `Danh_sach_sinh_vien_${new Date().toISOString().slice(0, 10)}.xls`,
      title: 'DANH SÁCH SINH VIÊN CHÍNH QUY',
      subtitle: `Tổng số: ${filteredStudents.length} sinh viên`,
      columns: [
        { header: 'STT', align: 'center', width: 8 },
        { header: 'Mã SV', align: 'center', width: 16 },
        { header: 'Họ và tên', align: 'left', width: 25 },
        { header: 'Giới tính', align: 'center', width: 12 },
        { header: 'Ngày sinh', align: 'center', width: 14 },
        { header: 'Email', align: 'left', width: 28 },
        { header: 'Số điện thoại', align: 'center', width: 16 },
        { header: 'Lớp sinh hoạt', align: 'left', width: 20 },
      ],
      rows: filteredStudents.map((s, idx) => [
        idx + 1,
        s.studentCode,
        s.fullName,
        s.gender || 'Nam',
        s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('vi-VN') : '',
        s.email,
        s.phone || '',
        s.class?.name || '',
      ]),
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'DANH SÁCH SINH VIÊN CHÍNH QUY',
      subtitle: 'Danh sách sinh viên trong cơ sở dữ liệu đào tạo',
      metaInfo: [
        { label: 'Tổng số sinh viên', value: String(students.length) },
        { label: 'Sinh viên đang lọc', value: String(filteredStudents.length) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã SV', width: '100px', align: 'center' },
        { header: 'Họ và Tên', width: '180px' },
        { header: 'Giới tính', width: '70px', align: 'center' },
        { header: 'Ngày sinh', width: '100px', align: 'center' },
        { header: 'Lớp sinh hoạt', width: '110px', align: 'center' },
        { header: 'Email trường', width: '180px' },
      ],
      rows: filteredStudents.map((s, idx) => [
        idx + 1,
        s.studentCode,
        s.fullName,
        s.gender || 'Nam',
        s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('vi-VN') : '---',
        s.class?.name || '---',
        s.email,
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <StudentHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          onImport={() => setIsImportModalOpen(true)}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <StudentKPICards
          total={kpiData.total}
          withClass={kpiData.withClass}
          totalClasses={kpiData.totalClasses}
          filtered={filteredStudents.length}
        />

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Họ tên, Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Lớp:</span>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setPage(1); }}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả các lớp</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Table Action Toolbar */}
        <StudentTableToolbar
          totalCount={filteredStudents.length}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onRefresh={fetchData}
        />

        {/* Full-Width DataGrid Table */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedStudents.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
            Không tìm thấy Sinh viên phù hợp.
          </div>
        ) : (
          <StudentTable
            students={paginatedStudents}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedStudents.map((s) => s.id) : [])
            }
            onDetail={setDrawerStudent}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Pagination */}
        <StudentPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredStudents.length}
          onPage={setPage}
          onLimit={(v) => { setLimit(v); setPage(1); }}
        />
      </main>

      {/* Add / Edit Modal */}
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none cursor-pointer"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
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
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              Lưu Sinh viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập Danh sách Sinh viên từ Excel"
        templateFileName="danh_sach_sinh_vien_mau.csv"
        onImportSuccess={(data: any[]) => {
          setToast({ message: `Đã nhập thành công ${data.length} sinh viên từ file Excel!`, type: 'success' });
          fetchData();
        }}
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
          { label: 'Mã sinh viên', value: drawerStudent?.studentCode, icon: UserIcon },
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
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
