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
import { ExcelImportModal } from '../../components/ExcelImportModal';
import { Student, ClassItem, User } from '../../types';
import { Search, X, ChevronDown, User as UserIcon, School, Mail, Phone, Calendar, BookOpen, Clock, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

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
  
  // Custom Drawer State
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'subjects' | 'schedule'>('info');
  const [drawerSubjects, setDrawerSubjects] = useState<any[] | null>(null);
  const [drawerSchedule, setDrawerSchedule] = useState<any[] | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  const openDrawer = (s: Student) => {
    setDrawerStudent(s);
    setDrawerTab('info');
    setDrawerSubjects(null);
    setDrawerSchedule(null);
  };

  const closeDrawer = () => {
    setDrawerStudent(null);
    setDrawerTab('info');
    setDrawerSubjects(null);
    setDrawerSchedule(null);
  };

  const fetchDrawerSubjects = async (studentId: number) => {
    if (drawerSubjects) return;
    setLoadingTab(true);
    try {
      const res = await api.get(`/students/${studentId}/subjects`);
      setDrawerSubjects(res.data || []);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Không thể tải danh sách môn học', type: 'error' });
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchDrawerSchedule = async (studentId: number) => {
    if (drawerSchedule) return;
    setLoadingTab(true);
    try {
      const res = await api.get(`/students/${studentId}/exam-schedule`);
      setDrawerSchedule(res.data || []);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Không thể tải lịch thi', type: 'error' });
    } finally {
      setLoadingTab(false);
    }
  };

  const handleTabChange = (tab: 'info' | 'subjects' | 'schedule') => {
    setDrawerTab(tab);
    if (drawerStudent) {
      if (tab === 'subjects') {
        fetchDrawerSubjects(drawerStudent.id);
      } else if (tab === 'schedule') {
        fetchDrawerSchedule(drawerStudent.id);
      }
    }
  };


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
            onDetail={openDrawer}
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

      {/* CUSTOM DRAWER: 3 TABS */}
      {drawerStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />
          <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
            
            {/* Header (gradient from-blue-600 to-indigo-700) */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shadow-inner">
                    {drawerStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">{drawerStudent.fullName}</h2>
                    <p className="text-blue-100 text-sm mt-1">{drawerStudent.studentCode}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                      {drawerStudent.class?.name || 'Chưa xếp lớp'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors text-blue-100 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
              {[
                { id: 'info', label: 'Thông tin', icon: FileText },
                { id: 'subjects', label: 'Môn đăng ký', icon: BookOpen },
                { id: 'schedule', label: 'Lịch thi', icon: Clock },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = drawerTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {drawerTab === 'info' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Mã sinh viên</span>
                        <p className="text-sm font-medium text-slate-800">{drawerStudent.studentCode}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Họ và tên</span>
                        <p className="text-sm font-medium text-slate-800">{drawerStudent.fullName}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Giới tính</span>
                        <p className="text-sm font-medium text-slate-800">{drawerStudent.gender || 'Nam'}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Ngày sinh</span>
                        <p className="text-sm font-medium text-slate-800">
                          {drawerStudent.dateOfBirth ? new Date(drawerStudent.dateOfBirth).toLocaleDateString('vi-VN') : '---'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Thông tin học tập</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <School className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold">Lớp học</p>
                          <p className="font-medium text-slate-800">{drawerStudent.class?.name || '---'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold">Email</p>
                          <p className="font-medium text-slate-800">{drawerStudent.email || '---'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold">Số điện thoại</p>
                          <p className="font-medium text-slate-800">{drawerStudent.phone || '---'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* KPI Metrics in Info tab */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Môn đăng ký</span>
                      </div>
                      <p className="text-2xl font-black text-blue-900">
                        {drawerSubjects ? drawerSubjects.length : '--'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4">
                      <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Lịch thi</span>
                      </div>
                      <p className="text-2xl font-black text-amber-900">
                        {drawerSchedule ? drawerSchedule.length : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'subjects' && (
                <div className="space-y-4">
                  {loadingTab ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : !drawerSubjects || drawerSubjects.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                      <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600">Sinh viên chưa đăng ký môn nào</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 text-sm">
                        <span className="font-semibold text-blue-900">Tổng quan:</span>
                        <span className="font-bold text-blue-700">
                          {drawerSubjects.length} môn / {drawerSubjects.reduce((acc: number, item: any) => acc + (item.subject?.credits || item.credits || 0), 0)} tín chỉ
                        </span>
                      </div>
                      <div className="space-y-3">
                        {drawerSubjects.map((item: any, idx: number) => {
                          const sub = item.subject || item;
                          return (
                            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start gap-3 hover:border-blue-300 transition-colors">
                              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">{sub.subjectName || sub.name}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Mã môn: <span className="font-bold text-slate-700">{sub.subjectCode || sub.code}</span></p>
                                {sub.department?.name && (
                                  <p className="text-xs text-slate-400 mt-0.5">{sub.department.name}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                                  {sub.credits} TC
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{item.semester} • {item.schoolYear || item.year || ''}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {drawerTab === 'schedule' && (
                <div className="space-y-4">
                  {loadingTab ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : !drawerSchedule || drawerSchedule.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                      <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600">Chưa có lịch thi nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {drawerSchedule.map((sched: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hover:border-indigo-300 transition-colors">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs font-bold text-slate-700">
                                {sched.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : '---'} • {sched.startTime || ''} - {sched.endTime || ''}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                              {sched.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm' : sched.examType === 'TU_LUAN' ? 'Tự luận' : sched.examType || 'Thi'}
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{sched.subjectName || 'Môn thi'}</h4>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">Mã môn: {sched.subjectCode}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>Phòng: <span className="font-bold text-slate-800">{sched.roomCode || sched.roomName} ({sched.building})</span></span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>SBD: <span className="font-bold text-blue-600">{sched.examNumber || '---'}</span></span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>Số ghế: <span className="font-bold text-emerald-600">{sched.seatNumber || '--'}</span></span>
                              </div>
                              {sched.periodName && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{sched.periodName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
