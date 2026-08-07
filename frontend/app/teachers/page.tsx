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
import { Teacher, Department, User } from '../../types';
import { Search, X, GraduationCap, Building2, Mail, Phone, User as UserIcon, Info } from 'lucide-react';

import { TeacherHeader } from '../../components/teachers/TeacherHeader';
import { TeacherKPICards } from '../../components/teachers/TeacherKPICards';
import { TeacherTableToolbar } from '../../components/teachers/TeacherTableToolbar';
import { TeacherTable } from '../../components/teachers/TeacherTable';
import { TeacherPaginationBar } from '../../components/teachers/TeacherPaginationBar';

const DEGREE_OPTIONS = ['GS.TS', 'PGS.TS', 'TS', 'ThS'];

export default function TeachersPage() {
  usePageTitle('Quản lý Giảng viên');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    teacherCode: true,
    fullName: true,
    degree: true,
    department: true,
    email: true,
    phone: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerTeacher, setDrawerTeacher] = useState<Teacher | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'assignments' | 'department'>('info');
  const [drawerAssignments, setDrawerAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    if (drawerTab === 'assignments' && drawerTeacher) {
      const fetchAssignments = async () => {
        setLoadingAssignments(true);
        try {
          const res = await api.get('/exam-supervisors', { params: { teacherId: drawerTeacher.id } });
          setDrawerAssignments(res.data || []);
        } catch (error) {
          setDrawerAssignments([]);
        } finally {
          setLoadingAssignments(false);
        }
      };
      fetchAssignments();
    }
  }, [drawerTab, drawerTeacher]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    teacherCode: '',
    fullName: '',
    degree: 'TS',
    email: '',
    phone: '',
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTeachers, resDepts] = await Promise.all([
        api.get('/teachers').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
      ]);
      setTeachers(resTeachers.data || []);
      setDepartments(resDepts.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu giảng viên', type: 'error' });
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
      total: teachers.length,
      withDegree: teachers.filter((t) => Boolean(t.degree?.trim())).length,
      withDept: teachers.filter((t) => Boolean(t.departmentId)).length,
    };
  }, [teachers]);

  // Filter & Sort Teachers
  const filteredTeachers = useMemo(() => {
    return teachers
      .filter((t) => {
        const matchSearch =
          t.fullName.toLowerCase().includes(search.toLowerCase()) ||
          t.teacherCode.toLowerCase().includes(search.toLowerCase()) ||
          t.email.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
        if (sortOrder === 'name_desc') return b.fullName.localeCompare(a.fullName, 'vi');
        if (sortOrder === 'code_asc') return a.teacherCode.localeCompare(b.teacherCode);
        return b.id - a.id;
      });
  }, [teachers, search, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / limit));
  const paginatedTeachers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredTeachers.slice(start, start + limit);
  }, [filteredTeachers, page, limit]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      teacherCode: `GV${String(teachers.length + 1).padStart(3, '0')}`,
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
      const payload = { ...formData, departmentId: Number(formData.departmentId) };
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
      message: `Bạn có chắc muốn xóa giảng viên ${t?.fullName || ''} (${t?.teacherCode || ''})? Hành động này không thể hoàn tác.`,
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

  const exportExcel = () => {
    exportToFormattedExcel({
      filename: `Danh_sach_giang_vien_${new Date().toISOString().slice(0, 10)}.xls`,
      title: 'DANH SÁCH GIẢNG VIÊN ĐÀO TẠO KHẢO THÍ',
      subtitle: `Tổng số: ${filteredTeachers.length} giảng viên`,
      columns: [
        { header: 'STT', align: 'center', width: 8 },
        { header: 'Mã GV', align: 'center', width: 16 },
        { header: 'Họ và tên', align: 'left', width: 25 },
        { header: 'Học vị', align: 'center', width: 14 },
        { header: 'Email', align: 'left', width: 28 },
        { header: 'Số điện thoại', align: 'center', width: 16 },
        { header: 'Khoa trực thuộc', align: 'left', width: 24 },
      ],
      rows: filteredTeachers.map((t, idx) => [
        idx + 1,
        t.teacherCode,
        t.fullName,
        t.degree || 'TS',
        t.email,
        t.phone || '',
        t.department?.name || '',
      ]),
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'DANH SÁCH GIẢNG VIÊN ĐÀO TẠO KHẢO THÍ',
      subtitle: 'Hồ sơ đội ngũ giảng viên và phân khoa trực thuộc',
      metaInfo: [
        { label: 'Tổng số giảng viên', value: String(teachers.length) },
        { label: 'Giảng viên đang lọc', value: String(filteredTeachers.length) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã GV', width: '90px', align: 'center' },
        { header: 'Họ và Tên', width: '180px' },
        { header: 'Học vị', width: '80px', align: 'center' },
        { header: 'Khoa trực thuộc', width: '150px' },
        { header: 'Email công vụ', width: '180px' },
        { header: 'Số điện thoại', width: '100px', align: 'center' },
      ],
      rows: filteredTeachers.map((t, idx) => [
        idx + 1,
        t.teacherCode,
        t.fullName,
        t.degree || 'TS',
        t.department?.name || '---',
        t.email,
        t.phone || '---',
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <TeacherHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          onImport={() => setIsImportModalOpen(true)}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <TeacherKPICards
          total={kpiData.total}
          withDegree={kpiData.withDegree}
          withDept={kpiData.withDept}
          filtered={filteredTeachers.length}
        />

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã GV, Họ tên, Email..."
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
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Table Action Toolbar */}
        <TeacherTableToolbar
          totalCount={filteredTeachers.length}
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
        ) : !paginatedTeachers.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
            Không tìm thấy Giảng viên phù hợp.
          </div>
        ) : (
          <TeacherTable
            teachers={paginatedTeachers}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedTeachers.map((t) => t.id) : [])
            }
            onDetail={(t) => {
              setDrawerTeacher(t);
              setDrawerTab('info');
            }}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Pagination */}
        <TeacherPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredTeachers.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      </main>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Chỉnh sửa Giảng viên' : 'Thêm Giảng viên Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingTeacher && (
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-700 font-medium flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span><strong>Lưu ý:</strong> Tài khoản và mật khẩu mặc định được khởi tạo là <strong>Mã giảng viên</strong> (Ví dụ: GV001).</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Học vị / Học hàm</label>
              <select
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none cursor-pointer"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Khoa trực thuộc</label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none cursor-pointer"
            >
              <option value="">-- Chọn Khoa --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
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
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              Lưu Giảng viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập Danh sách Giảng viên từ Excel"
        templateFileName="danh_sach_giang_vien_mau.csv"
        onImportSuccess={(data: any[]) => {
          setToast({ message: `Đã nhập thành công ${data.length} giảng viên từ file Excel!`, type: 'success' });
          fetchData();
        }}
      />

      {/* Custom Profile Drawer with 3 Tabs */}
      {drawerTeacher && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity"
            onClick={() => setDrawerTeacher(null)}
          />
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="relative pt-8 pb-6 px-6 bg-gradient-to-br from-amber-600 to-orange-700 text-white shrink-0">
              <button 
                onClick={() => setDrawerTeacher(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm border border-white/30 shadow-inner">
                  {drawerTeacher.fullName.slice(-1)}
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-tight">{drawerTeacher.fullName}</h2>
                  <p className="text-amber-100 text-sm mt-1 font-medium">Mã cán bộ: {drawerTeacher.teacherCode}</p>
                </div>
              </div>
              
              <div className="mt-6 flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                {[
                  { id: 'info', label: 'Thông tin' },
                  { id: 'assignments', label: 'Lịch coi thi' },
                  { id: 'department', label: 'Khoa' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as any)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      drawerTab === tab.id 
                        ? 'bg-white text-orange-700 shadow-sm' 
                        : 'text-amber-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {drawerTab === 'info' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Mã giảng viên</p>
                        <p className="text-sm font-semibold text-slate-800">{drawerTeacher.teacherCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Học vị / Học hàm</p>
                        <p className="text-sm font-semibold text-slate-800">{drawerTeacher.degree || 'TS'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Khoa trực thuộc</p>
                        <p className="text-sm font-semibold text-slate-800">{drawerTeacher.department?.name || '---'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Email công vụ</p>
                        <p className="text-sm font-semibold text-slate-800">{drawerTeacher.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Số điện thoại</p>
                        <p className="text-sm font-semibold text-slate-800">{drawerTeacher.phone || '---'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'assignments' && (
                <div className="space-y-4">
                  {loadingAssignments ? (
                    <div className="flex justify-center p-8">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : drawerAssignments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
                      <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Info className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Không có lịch coi thi</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drawerAssignments.map((assignment: any, index: number) => {
                        const sched = assignment.examScheduleRoom?.examSchedule;
                        const room = assignment.examScheduleRoom?.room;
                        const subject = sched?.subject;
                        return (
                          <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-orange-200 transition-colors space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">
                                  {subject?.subjectName || 'Môn thi'}
                                </h4>
                                {subject?.subjectCode && (
                                  <span className="text-xs font-semibold text-slate-500">Mã môn: {subject.subjectCode}</span>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                                assignment.role === 'CHINH' || assignment.role === 'SUPERVISOR_1' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {assignment.role === 'CHINH' || assignment.role === 'SUPERVISOR_1' ? 'Giám thị chính' : 'Giám thị phụ'}
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Phòng thi:</span>
                                <span className="font-bold text-slate-800">{room?.roomName || room?.roomCode || '---'} {room?.building ? `(${room.building})` : ''}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Ngày thi:</span>
                                <span className="font-bold text-slate-800">
                                  {sched?.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : '---'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Thời gian:</span>
                                <span className="font-bold text-slate-800">
                                  {sched?.startTime && sched?.endTime ? `${sched.startTime} - ${sched.endTime}` : '---'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Trạng thái:</span>
                                <span className="font-bold text-emerald-600">{assignment.status || 'Đã phân công'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'department' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                  <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-4">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{drawerTeacher.department?.name || 'Chưa phân khoa'}</h3>
                  <p className="text-sm font-medium text-slate-500 uppercase">Mã khoa: {drawerTeacher.department?.code || 'N/A'}</p>
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
