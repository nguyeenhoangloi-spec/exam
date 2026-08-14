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
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Teacher, Department, User } from '../../types';
import { Search, X, GraduationCap, Building2, Mail, Phone, User as UserIcon, Info, ChevronDown, FileSpreadsheet, UserCheck } from 'lucide-react';

import { TeacherHeader } from '../../components/teachers/TeacherHeader';
import { TeacherKPICards } from '../../components/teachers/TeacherKPICards';
import { TeacherTableToolbar } from '../../components/teachers/TeacherTableToolbar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { TeacherTable } from '../../components/teachers/TeacherTable';
import { TeacherPaginationBar } from '../../components/teachers/TeacherPaginationBar';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';

const DEGREE_OPTIONS = ['GS.TS', 'PGS.TS', 'TS', 'ThS'];

export default function TeachersPage() {
 usePageTitle('Quản lý giảng viên');
 const router = useRouter();

 const [currentUser, setCurrentUser] = useState<User | null>(null);
 const [teachers, setTeachers] = useState<Teacher[]>([]);
 const [departments, setDepartments] = useState<Department[]>([]);
 const [search, setSearch] = useState('');
 const [selectedDeptId, setSelectedDeptId] = useState('');
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
 onConfirm: () => { },
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

  const handleRefresh = async () => {
    await fetchData();
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

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
 const matchDept = !selectedDeptId || String(t.departmentId) === selectedDeptId;
 return matchSearch && matchDept;
 })
 .sort((a, b) => {
 if (sortOrder === 'oldest') return a.id - b.id;
 if (sortOrder === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
 if (sortOrder === 'name_desc') return b.fullName.localeCompare(a.fullName, 'vi');
 if (sortOrder === 'code_asc') return a.teacherCode.localeCompare(b.teacherCode);
 return b.id - a.id;
 });
 }, [teachers, search, selectedDeptId, sortOrder]);

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
 setToast({ message: err.message || 'Lưu thông tin giảng viên thất bại. Vui lòng thử lại.', type: 'error' });
 }
 };

 const handleDelete = (id: number) => {
 const t = teachers.find((item) => item.id === id);
 setConfirmModal({
 isOpen: true,
 title: 'Xóa giảng viên',
 message: `Bạn có chắc muốn xóa giảng viên ${t?.fullName || ''} (${t?.teacherCode || ''})? Hành động này không thể hoàn tác.`,
 type: 'danger',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.delete(`/teachers/${id}`);
 setToast({ message: 'Đã xóa giảng viên thành công!', type: 'success' });
 fetchData();
 } catch (err: any) {
 setToast({ message: err.message || 'Xóa giảng viên thất bại. Vui lòng thử lại.', type: 'error' });
 }
 },
 });
 };

 const handleToggleLock = (t: Teacher) => {
 const isLocked = t.user?.status === 'LOCKED';
 const actionText = isLocked ? 'Mở khóa đăng nhập' : 'Khóa đăng nhập';
 setConfirmModal({
 isOpen: true,
 title: `${actionText} tài khoản giảng viên`,
 message: isLocked
 ? `Bạn có chắc chắn muốn MỞ KHÓA tài khoản cho giảng viên "${t.fullName}" (${t.teacherCode})? Giảng viên sẽ có thể đăng nhập lại hệ thống.`
 : `Bạn có chắc chắn muốn KHÓA ĐĂNG NHẬP tài khoản giảng viên "${t.fullName}" (${t.teacherCode})? Giảng viên sẽ KHÔNG THỂ ĐĂNG NHẬP vào hệ thống nữa!`,
 type: isLocked ? 'info' : 'warning',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.post(`/teachers/${t.id}/${isLocked ? 'unlock' : 'lock'}`);
 setToast({ message: `Đã ${isLocked ? 'mở khóa' : 'khóa'} tài khoản giảng viên thành công!`, type: 'success' });
 fetchData();
 } catch (err: any) {
 setToast({ message: err?.response?.data?.message || 'Thao tác thất bại', type: 'error' });
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
 isAdmin={currentUser?.role === 'ADMIN'}
 />

 {/* Dynamic KPI Cards Row calculated from REAL API data */}
 <TeacherKPICards
 total={kpiData.total}
 withDegree={kpiData.withDegree}
 withDept={kpiData.withDept}
 filtered={filteredTeachers.length}
 />

 {/* Filter Toolbar */}
 <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5">
 <div className="relative flex-1 w-full min-w-[280px]">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input
 type="text"
 placeholder="Tìm theo mã GV, họ tên, email..."
 value={search}
 onChange={(e) => {
 setSearch(e.target.value);
 setPage(1);
 }}
 className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
 />
 {search && (
 <button
 type="button"
 onClick={() => {
 setSearch('');
 setPage(1);
 }}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 )}
 </div>

          {/* Filter Select Dropdowns Group */}
          <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Khoa trực thuộc:</span>
              <FilterSelect
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setPage(1);
                }}
                size="md"
              >
                <option value="">Tất cả các Khoa</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </FilterSelect>
            </div>
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
 onRefresh={handleRefresh}
 loading={loading}
 />

 {/* Full-Width DataGrid Table */}
 {loading ? (
 <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
 {[1, 2, 3, 4, 5].map((i) => (
 <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
 ))}
 </div>
 ) : !paginatedTeachers.length ? (
 <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
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
 onToggleLock={handleToggleLock}
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
    title={editingTeacher ? 'Chỉnh sửa hồ sơ giảng viên' : 'Thêm giảng viên mới'}
    subtitle={editingTeacher ? `Mã cán bộ: ${editingTeacher.teacherCode}` : 'Cấu hình thông tin cá nhân và học hàm/học vị giảng viên'}
    icon={<UserCheck className="h-6 w-6 text-white" />}
    badge={editingTeacher ? 'Chỉnh sửa' : 'Tạo mới'}
  >
 <form onSubmit={handleSubmit} className="space-y-4">
 {!editingTeacher && (
 <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium flex items-start gap-2">
 <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
 <span><strong>Lưu ý:</strong> Tài khoản và mật khẩu mặc định được khởi tạo là <strong>Mã giảng viên</strong> (Ví dụ: GV001).</span>
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Mã giảng viên</label>
 <input
 type="text"
 required
 value={formData.teacherCode}
 onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Học vị / Học hàm</label>
 <FilterSelect containerClassName="w-full"
 value={formData.degree}
 onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
 >
 {DEGREE_OPTIONS.map((d) => (
 <option key={d} value={d}>{d}</option>
 ))}
 </FilterSelect>
 </div>
 </div>

 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Họ và tên</label>
 <input
 type="text"
 required
 value={formData.fullName}
 onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Khoa trực thuộc</label>
 <FilterSelect 
 required
 value={formData.departmentId}
 onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
 >
 <option value="">-- Chọn Khoa --</option>
 {departments.map((d) => (
 <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
 ))}
 </FilterSelect>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Email Công vụ</label>
 <input
 type="email"
 required
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Số điện thoại</label>
 <input
 type="text"
 value={formData.phone}
 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
 className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none"
 />
 </div>
 </div>

 <div className="flex items-center justify-between pt-4 border-t border-slate-100">
 {!editingTeacher ? (
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => {
 setIsModalOpen(false);
 setIsImportModalOpen(true);
 }}
 leftIcon={<FileSpreadsheet className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
 >
 Import Excel
 </Button>
 ) : (
 <div />
 )}
 <div className="flex items-center gap-2.5">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => setIsModalOpen(false)}
 >
 Hủy
 </Button>
 <Button
 type="submit"
 variant="primary"
 size="md"
 >
              {editingTeacher ? 'Cập nhật giảng viên' : 'Lưu giảng viên'}
 </Button>
 </div>
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
 <div role="dialog" aria-modal="true" aria-label="Thông tin giảng viên" className="fixed inset-0 z-[100] flex justify-end">
 {/* Overlay */}
 <div
 className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity"
 onClick={() => setDrawerTeacher(null)}
 />
 {/* Drawer Panel */}
 <div className="relative w-full max-w-md bg-slate-50 dark:bg-slate-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
 {/* Header - Modern Gradient matching ProfileDrawer */}
<div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 text-white shrink-0 shadow-xs">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3 min-w-0 flex-1">
<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md font-semibold text-base text-white border border-white/25 shadow-2xs">
 {drawerTeacher.fullName.trim().split(' ').pop()?.charAt(0).toUpperCase() || 'GV'}
 </div>
 <div className="min-w-0 flex-1 pr-2">
<h2 className="text-[18px] font-semibold leading-snug text-white line-clamp-2 break-words">
 {drawerTeacher.fullName}
 </h2>
 <div className="mt-1.5">
  <IdentifierBadge tone="inverse">Mã cán bộ: {drawerTeacher.teacherCode}</IdentifierBadge>
 </div>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setDrawerTeacher(null)}
 className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/15 hover:text-white transition cursor-pointer"
 title="Đóng"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* Tabs */}
<div className="flex border-b border-slate-200 dark:border-slate-700 px-6 shrink-0 bg-white dark:bg-slate-900 overflow-x-auto">
 {[
 { id: 'info', label: 'Thông tin' },
 { id: 'assignments', label: 'Lịch coi thi' },
 { id: 'department', label: 'Khoa' },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setDrawerTab(tab.id as any)}
 className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-[15px] font-medium transition cursor-pointer ${drawerTab === tab.id
 ? 'border-blue-600 text-blue-600 font-semibold'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
 {drawerTab === 'info' && (
 <div className="space-y-4">
 <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
 <UserIcon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-slate-500">Mã giảng viên</p>
 <IdentifierBadge tone="neutral">{drawerTeacher.teacherCode}</IdentifierBadge>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
 <GraduationCap className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-slate-500">Học vị / Học hàm</p>
 <p className="text-[15px] font-semibold text-slate-900">{drawerTeacher.degree || 'Thạc sĩ / Tiến sĩ'}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
 <Building2 className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-slate-500">Khoa trực thuộc</p>
 <p className="text-[15px] font-semibold text-slate-900">{drawerTeacher.department?.name || '---'}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
 <Mail className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-slate-500">Email công vụ</p>
 <p className="text-[15px] font-semibold text-slate-900">{drawerTeacher.email}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
 <Phone className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-slate-500">Số điện thoại</p>
 <p className="text-[15px] font-semibold text-slate-900">{drawerTeacher.phone || '---'}</p>
 </div>
 </div>
 </div>
 </div>
 )}

 {drawerTab === 'assignments' && (
 <div className="space-y-4">
 {loadingAssignments ? (
 <div className="flex justify-center p-8">
 <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
 </div>
 ) : drawerAssignments.length === 0 ? (
 <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-2xs text-center">
 <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
 <Info className="w-8 h-8 text-slate-400" />
 </div>
 <p className="text-slate-500 font-medium text-[15px]">Không có lịch coi thi</p>
 </div>
 ) : (
 <div className="space-y-3">
 {drawerAssignments.map((assignment: any, index: number) => {
 const sched = assignment.examScheduleRoom?.examSchedule;
 const room = assignment.examScheduleRoom?.room;
 const subject = sched?.subject;
 return (
 <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-blue-200 transition-colors space-y-2">
 <div className="flex justify-between items-start">
 <div>
 <h4 className="font-semibold text-slate-900 text-[15px]">
 {subject?.subjectName || 'Môn thi'}
 </h4>
 {subject?.subjectCode && (
 <span className="text-[13px] font-medium text-slate-500">Mã môn: <IdentifierBadge tone="neutral">{subject.subjectCode}</IdentifierBadge></span>
 )}
 </div>
 <span className={`px-2.5 py-1 rounded-lg text-[13px] font-semibold shrink-0 ${assignment.role === 'CHINH' || assignment.role === 'SUPERVISOR_1' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-700'
 }`}>
 {assignment.role === 'CHINH' || assignment.role === 'SUPERVISOR_1' ? 'Giám thị chính' : 'Giám thị phụ'}
 </span>
 </div>
 <div className="space-y-1.5 text-[13px] text-slate-600 border-t border-slate-100 pt-2 font-medium">
 <div className="flex justify-between">
 <span className="text-slate-500">Phòng thi:</span>
 <span className="font-semibold text-slate-900">{room?.roomName || room?.roomCode || '---'} {room?.building ? `(${room.building})` : ''}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500">Ngày thi:</span>
 <span className="font-semibold text-slate-900">
 {sched?.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : '---'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500">Thời gian:</span>
 <span className="font-semibold text-slate-900">
 {sched?.startTime && sched?.endTime ? `${sched.startTime} - ${sched.endTime}` : '---'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500">Trạng thái:</span>
 <StatusBadge status={assignment.status || 'CONFIRMED'} customLabel={assignment.status === 'CONFIRMED' ? 'Đã xác nhận' : assignment.status === 'CHANGE_REQUESTED' ? 'Đề nghị thay đổi' : assignment.status || 'Đã phân công'} />
 <span className={`sr-only ${assignment.status === 'CONFIRMED'
 ? 'text-emerald-600 before:content-[\'✓\'] before:mr-1'
 : assignment.status === 'CHANGE_REQUESTED'
 ? 'text-amber-600 before:content-[\'•\'] before:mr-1'
 : 'text-slate-900 before:content-[\'•\'] before:mr-1'
 }`}>
 {assignment.status === 'CONFIRMED'
 ? 'Đã xác nhận'
 : assignment.status === 'CHANGE_REQUESTED'
 ? 'Đề nghị thay đổi'
 : assignment.status || 'Đã phân công'}
 </span>
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
 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs text-center space-y-2">
 <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
 <Building2 className="w-8 h-8" />
 </div>
 <h3 className="text-[20px] font-semibold text-slate-900">{drawerTeacher.department?.name || 'Chưa phân khoa'}</h3>
 <p className="text-[13px] font-semibold text-blue-600">Mã khoa: <IdentifierBadge tone="neutral">{drawerTeacher.department?.code || 'N/A'}</IdentifierBadge></p>
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
