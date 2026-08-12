
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
import { ClassItem, Department } from '../../types';
import { GraduationCap, Building2, Search, X, Users, ChevronDown, Phone, Mail, BookOpen, FileSpreadsheet } from 'lucide-react';

import { ClassHeader } from '../../components/classes/ClassHeader';
import { ClassKPICards } from '../../components/classes/ClassKPICards';
import { ClassTableToolbar } from '../../components/classes/ClassTableToolbar';
import { ClassTable } from '../../components/classes/ClassTable';
import { ClassPaginationBar } from '../../components/classes/ClassPaginationBar';

export default function ClassesPage() {
 usePageTitle('Quản lý lớp học');
 const router = useRouter();

 const [currentUser, setCurrentUser] = useState<any>(null);
 const [classes, setClasses] = useState<ClassItem[]>([]);
 const [departments, setDepartments] = useState<Department[]>([]);
 const [search, setSearch] = useState('');
 const [selectedDeptId, setSelectedDeptId] = useState('');
 const [loading, setLoading] = useState(true);

 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(8);
 const [sortOrder, setSortOrder] = useState('newest');
 const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
 const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
 code: true,
 name: true,
 department: true,
 studentCount: true,
 });

 const handleColumnToggle = (key: string) => {
 setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
 };

 const [selected, setSelected] = useState<number[]>([]);

 // Drawer State
 const [drawerClass, setDrawerClass] = useState<ClassItem | null>(null);
 const [drawerTab, setDrawerTab] = useState<'info' | 'students' | 'enrollments'>('info');
 const [drawerDetail, setDrawerDetail] = useState<any>(null);
 const [drawerEnrollments, setDrawerEnrollments] = useState<any[] | null>(null);
 const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
 const [drawerStudentSearch, setDrawerStudentSearch] = useState('');

 // Modal State
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
 onConfirm: () => { },
 });

 const fetchData = useCallback(async () => {
 setLoading(true);
 try {
 const [resClasses, resDepts] = await Promise.all([
 api.get('/classes').catch(() => ({ data: [] })),
 api.get('/departments').catch(() => ({ data: [] })),
 ]);
 setClasses(resClasses.data || []);
 setDepartments(resDepts.data || []);
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải danh sách lớp học', type: 'error' });
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

 // Handle opening drawer
 const handleOpenDrawer = (c: ClassItem) => {
 setDrawerClass(c);
 setDrawerTab('info');
 setDrawerDetail(null);
 setDrawerEnrollments(null);
 setDrawerStudentSearch('');
 };

 // Fetch Drawer Data based on Tabs
 useEffect(() => {
 const fetchDrawerData = async () => {
 if (!drawerClass?.id) return;

 if (drawerTab === 'students' && !drawerDetail) {
 setIsLoadingDrawer(true);
 try {
 const res = await api.get(`/classes/${drawerClass.id}`);
 setDrawerDetail(res.data);
 } catch (err) {
 console.error(err);
 } finally {
 setIsLoadingDrawer(false);
 }
 } else if (drawerTab === 'enrollments' && !drawerEnrollments) {
 setIsLoadingDrawer(true);
 try {
 const res = await api.get(`/classes/${drawerClass.id}/subjects`);
 setDrawerEnrollments(res.data || []);
 } catch (err) {
 setDrawerEnrollments([]);
 } finally {
 setIsLoadingDrawer(false);
 }
 }
 };
 fetchDrawerData();
 }, [drawerClass, drawerTab, drawerDetail, drawerEnrollments]);

 // Compute DYNAMIC KPI Metrics from real API data
 const kpiData = useMemo(() => {
 const total = classes.length;
 const setDept = new Set(classes.map((c) => c.departmentId).filter(Boolean));
 const totalStudents = classes.reduce((acc, curr: any) => acc + (curr._count?.students ?? curr.studentsCount ?? curr.students?.length ?? 0), 0);
 const avgStudents = total > 0 ? Math.round(totalStudents / total) : 0;
 const maxClassStudents = classes.reduce(
 (max, curr: any) => Math.max(max, curr._count?.students ?? curr.studentsCount ?? curr.students?.length ?? 0),
 0,
 );

 return {
 total,
 totalDepartments: setDept.size || departments.length,
 totalStudents,
 avgStudents,
 maxClassStudents,
 };
 }, [classes, departments]);

 // Filter & Sort Classes
 const filteredClasses = useMemo(() => {
 return classes
 .filter((c) => {
 const matchSearch =
 c.name.toLowerCase().includes(search.toLowerCase()) ||
 c.code.toLowerCase().includes(search.toLowerCase());
 const matchDept = selectedDeptId ? String(c.departmentId) === selectedDeptId : true;
 return matchSearch && matchDept;
 })
 .sort((a: any, b: any) => {
 if (sortOrder === 'oldest') return a.id - b.id;
 if (sortOrder === 'name_asc') return a.name.localeCompare(b.name, 'vi');
 if (sortOrder === 'students_desc') {
 const sA = a._count?.students ?? a.studentsCount ?? a.students?.length ?? 0;
 const sB = b._count?.students ?? b.studentsCount ?? b.students?.length ?? 0;
 return sB - sA;
 }
 return b.id - a.id;
 });
 }, [classes, search, selectedDeptId, sortOrder]);

 // Pagination Slice
 const totalPages = Math.max(1, Math.ceil(filteredClasses.length / limit));
 const paginatedClasses = useMemo(() => {
 const start = (page - 1) * limit;
 return filteredClasses.slice(start, start + limit);
 }, [filteredClasses, page, limit]);

 // Class Actions
 const openAddModal = () => {
 setEditingClass(null);
 setFormData({
 code: `CNTT-K66`,
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
 code: formData.code,
 name: formData.name,
 departmentId: Number(formData.departmentId),
 };

 if (editingClass) {
 await api.patch(`/classes/${editingClass.id}`, payload);
 setToast({ message: 'Cập nhật thông tin lớp thành công!', type: 'success' });
 } else {
 await api.post('/classes', payload);
 setToast({ message: 'Tạo lớp học mới thành công!', type: 'success' });
 }
 setIsModalOpen(false);
 fetchData();
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi lưu thông tin lớp học', type: 'error' });
 setIsModalOpen(false);
 }
 };

 const handleDelete = (id: number) => {
 const item = classes.find((c) => c.id === id);
 setConfirmModal({
 isOpen: true,
 title: 'Xóa lớp học',
 message: `Bạn có chắc chắn muốn xóa lớp ${item?.name || ''}?`,
 type: 'danger',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.delete(`/classes/${id}`);
 setToast({ message: 'Đã xóa lớp học thành công!', type: 'success' });
 fetchData();
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi xóa lớp học', type: 'error' });
 }
 },
 });
 };

 const exportExcel = () => {
 const columns = [
 { header: 'STT', width: 8, align: 'center' as const },
 { header: 'Mã Lớp', width: 15 },
 { header: 'Tên Lớp học', width: 35 },
 { header: 'Khoa trực thuộc', width: 25 },
 { header: 'Sĩ số Sinh viên', width: 15, align: 'center' as const },
 ];

 const rows = filteredClasses.map((c: any, idx) => [
 idx + 1,
 c.code,
 c.name,
 c.department?.name || c.departmentName || '',
 c.studentsCount ?? c._count?.students ?? c.students?.length ?? 0,
 ]);

 exportToFormattedExcel({
 filename: 'Danh_sach_lop_hoc.xls',
 title: 'DANH SÁCH LỚP HỌC HỆ THỐNG',
 subtitle: 'Trích xuất dữ liệu danh mục các lớp sinh viên',
 columns,
 rows,
 });
 };

 const handlePrintReport = () => {
 printReport({
 title: 'BÁO CÁO DANH SÁCH LỚP HỌC',
 subtitle: 'Danh sách lớp học và quy mô sĩ số sinh viên',
 metaInfo: [
 { label: 'Tổng số lớp', value: String(classes.length) },
 { label: 'Tổng số sinh viên', value: `${kpiData.totalStudents} SV` },
 ],
 columns: [
 { header: 'STT', width: '40px' },
 { header: 'Mã Lớp', width: '90px' },
 { header: 'Tên Lớp học', width: '220px' },
 { header: 'Khoa trực thuộc', width: '180px' },
 { header: 'Sĩ số', width: '80px', align: 'center' },
 ],
 rows: filteredClasses.map((c: any, idx) => [
 idx + 1,
 c.code,
 c.name,
 c.department?.name || c.departmentName || '',
 `${c.studentsCount ?? c._count?.students ?? c.students?.length ?? 0} SV`,
 ]),
 });
 };

 return (
 <>
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
 {/* Header */}
 <ClassHeader
 onAdd={openAddModal}
 onExport={exportExcel}
 onPrint={handlePrintReport}
 isAdmin={currentUser?.role === 'ADMIN'}
 />

 {/* Dynamic KPI Cards Row calculated from REAL API data */}
 <ClassKPICards
 total={kpiData.total}
 totalDepartments={kpiData.totalDepartments}
 totalStudents={kpiData.totalStudents}
 avgStudents={kpiData.avgStudents}
 maxClassStudents={kpiData.maxClassStudents}
 />

 {/* Filter Card */}
 <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
 <div className="relative flex-1 min-w-[260px]">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <input
 type="text"
 placeholder="Tìm theo mã lớp, tên lớp học..."
 value={search}
 onChange={(e) => {
 setSearch(e.target.value);
 setPage(1);
 }}
 className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
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

 <div className="flex items-center gap-3">
 <span className="text-xs font-semibold text-slate-500">Khoa trực thuộc:</span>
 <div className="relative">
 <select
 value={selectedDeptId}
 onChange={(e) => {
 setSelectedDeptId(e.target.value);
 setPage(1);
 }}
 className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:border-slate-300 transition shadow-2xs"
 >
 <option value="">Tất cả các Khoa</option>
 {departments.map((d) => (
 <option key={d.id} value={String(d.id)}>
 {d.name} ({d.code})
 </option>
 ))}
 </select>
 <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
 </div>
 </div>
 </div>

 {/* Dynamic Table Action Toolbar */}
 <ClassTableToolbar
 totalCount={filteredClasses.length}
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
 ) : !paginatedClasses.length ? (
 <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
 Không tìm thấy lớp học phù hợp.
 </div>
 ) : (
 <ClassTable
 classes={paginatedClasses}
 selected={selected}
 viewMode={viewMode}
 visibleColumns={visibleColumns}
 onSelect={(id, checked) =>
 setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
 }
 onSelectAll={(checked) =>
 setSelected(checked ? paginatedClasses.map((c) => c.id) : [])
 }
 onDetail={handleOpenDrawer}
 onEdit={openEditModal}
 onDelete={handleDelete}
 isAdmin={currentUser?.role === 'ADMIN'}
 />
 )}

 {/* Dynamic Pagination Footer */}
 <ClassPaginationBar
 page={page}
 totalPages={totalPages}
 limit={limit}
 totalItems={filteredClasses.length}
 onPage={setPage}
 onLimit={(v) => {
 setLimit(v);
 setPage(1);
 }}
 />
 </main>

 {/* Edit/Add Class Modal */}
 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title={editingClass ? 'Chỉnh sửa Lớp học' : 'Tạo Lớp học Mới'}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-[15px] font-medium text-[#0F172A] mb-1">Mã lớp</label>
 <input
 type="text"
 required
 placeholder="VD: CNTT-K65A"
 value={formData.code}
 onChange={(e) => setFormData({ ...formData, code: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-[15px] font-medium text-[#0F172A] mb-1">Tên Lớp học</label>
 <input
 type="text"
 required
 placeholder="VD: Công nghệ thông tin 1 - K65"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none"
 />
 </div>

 <div>
 <label className="block text-[15px] font-medium text-[#0F172A] mb-1">Khoa trực thuộc</label>
 <select
 required
 value={formData.departmentId}
 onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none"
 >
 <option value="">-- Chọn Khoa --</option>
 {departments.map((d) => (
 <option key={d.id} value={d.id}>
 {d.name} ({d.code})
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center justify-between pt-4 border-t border-slate-100">
 {!editingClass ? (
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => {
 setIsModalOpen(false);
 setIsImportModalOpen(true);
 }}
 leftIcon={<FileSpreadsheet className="h-4 w-4 text-blue-600" />}
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
 {editingClass ? 'Cập nhật Lớp học' : 'Lưu Lớp Học'}
 </Button>
 </div>
 </div>
 </form>
 </Modal>

 {/* Excel Import Modal */}
 <ExcelImportModal
 isOpen={isImportModalOpen}
 onClose={() => setIsImportModalOpen(false)}
 title="Import danh sách lớp học từ Excel"
 templateFileName="danh_sach_lop_hoc_mau.csv"
 onImportSuccess={async () => {
 await fetchData();
 setToast({ message: 'Nhập danh sách lớp học từ file thành công!', type: 'success' });
 }}
 />

 {/* Custom Profile Drawer */}
 {drawerClass && (
 <div role="dialog" aria-modal="true" aria-label="Thông tin lớp học" className="fixed inset-0 z-[100] flex justify-end">
 <div
 className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
 onClick={() => setDrawerClass(null)}
 />

 <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
 {/* Header - Brand Blue Color matching system standard */}
 <div className="bg-blue-600 p-5 text-white shrink-0 border-b border-blue-700">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3 min-w-0 flex-1">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 font-semibold text-base text-white border border-white/15">
 {drawerClass.code.substring(0, 3).toUpperCase()}
 </div>
 <div className="min-w-0 flex-1 pr-2">
 <h2 className="text-[20px] font-semibold leading-[28px] text-white break-words">
 {drawerClass.name}
 </h2>
 <p className="text-[13px] font-semibold text-blue-200 mt-1 tabular-nums">
 Mã lớp: {drawerClass.code}
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setDrawerClass(null)}
 className="shrink-0 rounded-xl p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
 title="Đóng"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex border-b border-slate-200 px-6 shrink-0 bg-white overflow-x-auto">
 <button
 onClick={() => setDrawerTab('info')}
 className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-[15px] font-medium transition cursor-pointer ${drawerTab === 'info'
 ? 'border-blue-600 text-blue-600 font-semibold'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 Thông tin
 </button>
 <button
 onClick={() => setDrawerTab('students')}
 className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-[15px] font-medium transition cursor-pointer ${drawerTab === 'students'
 ? 'border-blue-600 text-blue-600 font-semibold'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 Sinh viên
 </button>
 <button
 onClick={() => setDrawerTab('enrollments')}
 className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-[15px] font-medium transition cursor-pointer ${drawerTab === 'enrollments'
 ? 'border-blue-600 text-blue-600 font-semibold'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 Môn đăng ký
 </button>
 </div>

 {/* Drawer Body */}
 <div className="flex-1 overflow-y-auto p-6 bg-white">
 {drawerTab === 'info' && (
 <div className="space-y-6 animate-in fade-in duration-300">
 <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
 <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
 <GraduationCap className="h-5 w-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-[#64748B] ">Tên lớp học</p>
 <p className="text-[15px] font-semibold text-[#0F172A]">{drawerClass.name}</p>
 </div>
 </div>

 <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
 <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
 <Building2 className="h-5 w-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-[#64748B] ">Khoa trực thuộc</p>
 <p className="text-[15px] font-semibold text-[#0F172A]">{drawerClass.department?.name || (drawerClass as any).departmentName || 'Chưa gán Khoa'}</p>
 </div>
 </div>

 <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
 <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
 <Users className="h-5 w-5" />
 </div>
 <div>
 <p className="text-[13px] font-semibold text-[#64748B] ">Sĩ số Sinh viên</p>
 <p className="text-[15px] font-semibold text-[#0F172A]">{(drawerClass as any)._count?.students ?? (drawerClass as any).studentsCount ?? (drawerClass as any).students?.length ?? 0} sinh viên</p>
 </div>
 </div>
 </div>
 )}

 {drawerTab === 'students' && (
 <div className="space-y-4 flex flex-col h-full animate-in fade-in duration-300">
 <div className="relative shrink-0">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
 <input
 type="text"
 placeholder="Tìm sinh viên..."
 value={drawerStudentSearch}
 onChange={(e) => setDrawerStudentSearch(e.target.value)}
 className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-[15px] font-medium text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none transition"
 />
 </div>

 {isLoadingDrawer ? (
 <div className="space-y-3 mt-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
 ))}
 </div>
 ) : (
 <div className="flex-1 overflow-y-auto space-y-3 pb-4">
 {drawerDetail?.students
 ?.filter((sv: any) =>
 (sv.fullName || '').toLowerCase().includes(drawerStudentSearch.toLowerCase()) ||
 (sv.studentCode || '').toLowerCase().includes(drawerStudentSearch.toLowerCase())
 )
 .map((sv: any) => (
 <div key={sv.id} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/30 transition-colors flex gap-3">
 <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
 {sv.fullName?.charAt(0) || 'U'}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[15px] font-semibold text-[#0F172A] truncate">{sv.fullName}</p>
 <p className="text-[13px] font-normal text-[#64748B]">{sv.studentCode}</p>
 <div className="flex items-center gap-3 mt-1.5 text-[13px] font-normal text-[#64748B]">
 {sv.email && (
 <span className="flex items-center gap-1">
 <Mail className="h-3.5 w-3.5" />
 <span className="truncate max-w-[100px]">{sv.email}</span>
 </span>
 )}
 {sv.phone && (
 <span className="flex items-center gap-1">
 <Phone className="h-3.5 w-3.5" />
 {sv.phone}
 </span>
 )}
 </div>
 </div>
 </div>
 )) || (
 <div className="text-center text-[15px] font-normal text-[#64748B] mt-10">
 Không có sinh viên nào.
 </div>
 )}

 {drawerDetail?.students?.length > 0 &&
 drawerDetail?.students?.filter((sv: any) =>
 (sv.fullName || '').toLowerCase().includes(drawerStudentSearch.toLowerCase()) ||
 (sv.studentCode || '').toLowerCase().includes(drawerStudentSearch.toLowerCase())
 ).length === 0 && (
 <div className="text-center text-[15px] font-normal text-[#64748B] mt-10">
 Không tìm thấy kết quả phù hợp.
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {drawerTab === 'enrollments' && (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <h3 className="text-[16px] font-semibold text-[#0F172A]">Danh sách môn học đã đăng ký</h3>
 <span className="text-[13px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
 {drawerEnrollments?.length || 0} môn
 </span>
 </div>

 {isLoadingDrawer ? (
 <div className="space-y-3 mt-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
 ))}
 </div>
 ) : drawerEnrollments && drawerEnrollments.length > 0 ? (
 <div className="space-y-3">
 {drawerEnrollments.map((sub: any, idx: number) => (
 <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-emerald-300 transition-all">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3">
 <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0 border border-blue-100">
 <BookOpen className="h-5 w-5" />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className=" tabular-nums text-[13px] font-semibold text-blue-600">
 {sub.subjectCode}
 </span>
 <span className="text-[13px] font-normal text-[#64748B]">{sub.credits} tín chỉ</span>
 </div>
 <p className="text-[15px] font-semibold text-[#0F172A]">{sub.subjectName}</p>
 {sub.departmentName && (
 <p className="text-[13px] font-normal text-[#64748B] mt-0.5">{sub.departmentName}</p>
 )}
 </div>
 </div>
 <div className="text-right shrink-0">
 <span className="text-[13px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
 {sub.semester} ({sub.schoolYear})
 </span>
 <p className="text-[13px] font-normal text-[#64748B] mt-1">
 <span className="font-semibold text-blue-600">{sub.studentCount}</span> SV học
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-12 text-center text-slate-400">
 <BookOpen className="h-10 w-10 text-slate-700 mx-auto mb-2" />
 <p className="text-[15px] font-semibold text-[#0F172A]">Lớp chưa có sinh viên nào đăng ký môn.</p>
 <p className="text-[13px] font-normal text-[#64748B] mt-1">Bạn có thể gán lớp vào môn học tại trang Quản lý môn học.</p>
 <button
 onClick={() => router.push('/subjects')}
 className="mt-4 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[15px] font-medium hover:bg-blue-700 transition cursor-pointer"
 >
 Đến trang quản lý môn học
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 )}

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
 </>
 );
}
