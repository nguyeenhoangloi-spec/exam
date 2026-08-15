'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { Subject, Department } from '../../types';
import { BookOpen, Building2, Search, X, Award, ChevronDown, Users, GraduationCap, BookMarked, FileSpreadsheet } from 'lucide-react';

import { SubjectHeader } from '../../components/subjects/SubjectHeader';
import { SubjectKPICards } from '../../components/subjects/SubjectKPICards';
import { SubjectFilterPopover } from '../../components/subjects/SubjectFilterPopover';
import { SubjectTableToolbar } from '../../components/subjects/SubjectTableToolbar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { SubjectTable } from '../../components/subjects/SubjectTable';
import { SubjectPaginationBar } from '../../components/subjects/SubjectPaginationBar';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';

export default function SubjectsPage() {
  usePageTitle('Quản lý môn học');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [filterCredits, setFilterCredits] = useState('');
  const [filterHasStudents, setFilterHasStudents] = useState('');
  const [loading, setLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    subjectCode: true,
    subjectName: true,
    credits: true,
    department: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerSubject, setDrawerSubject] = useState<Subject | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'classes' | 'students'>('info');
 const [drawerEnrollments, setDrawerEnrollments] = useState<any[]>([]);
 const [drawerClassSummary, setDrawerClassSummary] = useState<any[]>([]);
 const [drawerLoading, setDrawerLoading] = useState(false);
 const [drawerFilterClass, setDrawerFilterClass] = useState('');
 const [drawerFilterSemester, setDrawerFilterSemester] = useState('');
 const [drawerFilterYear, setDrawerFilterYear] = useState('');

 // CRUD Modal State
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isImportModalOpen, setIsImportModalOpen] = useState(false);
 const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
 const [formData, setFormData] = useState({
 subjectCode: '',
 subjectName: '',
 credits: '3',
 departmentId: '',
 });

 // Enroll by Class Modal State
 const [enrollClassSubject, setEnrollClassSubject] = useState<Subject | null>(null);
 const [enrollClassData, setEnrollClassData] = useState({ classId: '', semester: 'HK1', schoolYear: '2025-2026' });
 const [enrollClassPreview, setEnrollClassPreview] = useState<any>(null);
 const [enrollClassLoading, setEnrollClassLoading] = useState(false);
 const [previewLoading, setPreviewLoading] = useState(false);

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
 const [resSubjects, resDepts, resClasses] = await Promise.all([
 api.get('/subjects').catch(() => ({ data: [] })),
 api.get('/departments').catch(() => ({ data: [] })),
 api.get('/classes').catch(() => ({ data: [] })),
 ]);
 setSubjects(resSubjects.data || []);
 setDepartments(resDepts.data || []);
 setClasses(resClasses.data || []);
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải danh sách môn học', type: 'error' });
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

 const handleRefresh = async () => {
    await fetchData();
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

 // Load drawer data when subject or tab changes
 useEffect(() => {
 if (!drawerSubject) return;
 if (drawerTab === 'info') return;
 setDrawerLoading(true);
 if (drawerTab === 'classes') {
 api.get(`/subjects/${drawerSubject.id}/enrollments/summary`)
 .then((r) => setDrawerClassSummary(r.data || []))
 .catch(() => setDrawerClassSummary([]))
 .finally(() => setDrawerLoading(false));
 } else if (drawerTab === 'students') {
 const params: any = {};
 if (drawerFilterClass) params.classId = drawerFilterClass;
 if (drawerFilterSemester) params.semester = drawerFilterSemester;
 if (drawerFilterYear) params.schoolYear = drawerFilterYear;
 api.get(`/subjects/${drawerSubject.id}/enrollments`, { params })
 .then((r) => setDrawerEnrollments(r.data || []))
 .catch(() => setDrawerEnrollments([]))
 .finally(() => setDrawerLoading(false));
 }
 }, [drawerSubject, drawerTab, drawerFilterClass, drawerFilterSemester, drawerFilterYear]);

 const openDrawer = (s: Subject) => {
 setDrawerSubject(s);
 setDrawerTab('info');
 setDrawerEnrollments([]);
 setDrawerClassSummary([]);
 setDrawerFilterClass('');
 setDrawerFilterSemester('');
 setDrawerFilterYear('');
 };

 const kpiData = useMemo(() => {
 const total = subjects.length;
 const totalCredits = subjects.reduce((acc, curr) => acc + (curr.credits || 0), 0);
 const setDept = new Set(subjects.map((s) => s.departmentId).filter(Boolean));
 const threeCreditCount = subjects.filter((s) => s.credits === 3).length;
 const questionCount = subjects.filter((s: any) => (s._count?.questions || 0) > 0).length;
 return { total, totalCredits, totalDepartments: setDept.size || departments.length, threeCreditCount, questionCount };
 }, [subjects, departments]);

 const filteredSubjects = useMemo(() => {
 return subjects
 .filter((s: any) => {
 const matchSearch =
 s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
 s.subjectCode.toLowerCase().includes(search.toLowerCase());
 const matchDept = selectedDeptId ? String(s.departmentId) === selectedDeptId : true;
 const matchCredits = filterCredits ? String(s.credits) === filterCredits : true;
 const matchStudents =
 filterHasStudents === 'yes' ? (s._count?.studentSubjects || 0) > 0
 : filterHasStudents === 'no' ? (s._count?.studentSubjects || 0) === 0
 : true;
 return matchSearch && matchDept && matchCredits && matchStudents;
 })
 .sort((a, b) => {
 if (sortOrder === 'oldest') return a.id - b.id;
 if (sortOrder === 'name_asc') return a.subjectName.localeCompare(b.subjectName, 'vi');
 if (sortOrder === 'credits_desc') return b.credits - a.credits;
 return b.id - a.id;
 });
 }, [subjects, search, selectedDeptId, sortOrder, filterCredits, filterHasStudents]);

 const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / limit));
 const paginatedSubjects = useMemo(() => {
 const start = (page - 1) * limit;
 return filteredSubjects.slice(start, start + limit);
 }, [filteredSubjects, page, limit]);

 const openAddModal = () => {
 setEditingSubject(null);
 setFormData({ subjectCode: '', subjectName: '', credits: '3', departmentId: departments[0]?.id ? String(departments[0].id) : '' });
 setIsModalOpen(true);
 };

 const openEditModal = (s: Subject) => {
 setEditingSubject(s);
 setFormData({ subjectCode: s.subjectCode, subjectName: s.subjectName, credits: String(s.credits), departmentId: s.departmentId ? String(s.departmentId) : '' });
 setIsModalOpen(true);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 const payload = { subjectCode: formData.subjectCode, subjectName: formData.subjectName, credits: Number(formData.credits), departmentId: Number(formData.departmentId) };
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
 setToast({ message: err.message || 'Lỗi lưu thông tin môn học', type: 'error' });
 setIsModalOpen(false);
 }
 };

 const handleDelete = (id: number) => {
 const item = subjects.find((s) => s.id === id);
 setConfirmModal({
 isOpen: true,
 title: 'Xóa môn học',
 message: `Bạn có chắc chắn muốn xóa môn ${item?.subjectName || ''}?`,
 type: 'danger',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.delete(`/subjects/${id}`);
 setToast({ message: 'Đã xóa môn học thành công!', type: 'success' });
 fetchData();
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi xóa môn học', type: 'error' });
 }
 },
 });
 };

 // Enroll by Class Handlers
 const openEnrollClassModal = (s: Subject) => {
 setEnrollClassSubject(s);
 setEnrollClassData({ classId: '', semester: 'HK1', schoolYear: '2025-2026' });
 setEnrollClassPreview(null);
 };

 const fetchPreview = useCallback(async (subjectId: number, classId: string, semester: string, schoolYear: string) => {
 if (!classId) { setEnrollClassPreview(null); return; }
 setPreviewLoading(true);
 try {
 const r = await api.get(`/subjects/${subjectId}/enroll-class/preview`, { params: { classId, semester, schoolYear } });
 setEnrollClassPreview(r.data);
 } catch {
 setEnrollClassPreview(null);
 } finally {
 setPreviewLoading(false);
 }
 }, []);

 useEffect(() => {
 if (!enrollClassSubject || !enrollClassData.classId) { setEnrollClassPreview(null); return; }
 const t = setTimeout(() => {
 fetchPreview(enrollClassSubject.id, enrollClassData.classId, enrollClassData.semester, enrollClassData.schoolYear);
 }, 400);
 return () => clearTimeout(t);
 }, [enrollClassSubject, enrollClassData.classId, enrollClassData.semester, enrollClassData.schoolYear, fetchPreview]);

 const handleEnrollByClass = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!enrollClassSubject || !enrollClassData.classId) return;
 setEnrollClassLoading(true);
 try {
 const r = await api.post(`/subjects/${enrollClassSubject.id}/enroll-by-class`, {
 classId: Number(enrollClassData.classId),
 semester: enrollClassData.semester,
 schoolYear: enrollClassData.schoolYear,
 });
 setToast({ message: `Đã gán ${r.data.successCount} sinh viên lớp ${r.data.className} vào môn ${enrollClassSubject.subjectName}.`, type: 'success' });
 setEnrollClassSubject(null);
 fetchData();
 } catch (err: any) {
 setToast({ message: err.response?.data?.message || 'Lỗi khi gán lớp vào môn học', type: 'error' });
 } finally {
 setEnrollClassLoading(false);
 }
 };

 const exportExcel = () => {
 exportToFormattedExcel({
 filename: 'Danh_sach_mon_hoc.xls',
 title: 'DANH SÁCH MÔN HỌC HỆ THỐNG',
 subtitle: 'Trích xuất dữ liệu danh mục môn học',
 columns: [
 { header: 'STT', width: 8, align: 'center' as const },
 { header: 'Mã môn học', width: 15 },
 { header: 'Tên môn học', width: 35 },
 { header: 'Số tín chỉ', width: 12, align: 'center' as const },
 { header: 'Khoa đào tạo', width: 25 },
 { header: 'Số SV đăng ký', width: 15, align: 'center' as const },
 ],
 rows: filteredSubjects.map((s: any, idx) => [
 idx + 1, s.subjectCode, s.subjectName, s.credits,
 s.department?.name || '', s._count?.studentSubjects || 0,
 ]),
 });
 };

 const handlePrintReport = () => {
 printReport({
 title: 'BÁO CÁO DANH SÁCH MÔN HỌC',
 subtitle: 'Danh sách môn học và phân bổ tín chỉ',
 metaInfo: [
 { label: 'Tổng số môn học', value: String(subjects.length) },
 { label: 'Tổng số tín chỉ', value: `${kpiData.totalCredits} TC` },
 ],
 columns: [
 { header: 'STT', width: '40px' },
 { header: 'Mã Môn', width: '90px' },
 { header: 'Tên Môn học', width: '220px' },
 { header: 'Số TC', width: '70px', align: 'center' },
 { header: 'Khoa đào tạo', width: '180px' },
 { header: 'Số SV', width: '70px', align: 'center' },
 ],
 rows: filteredSubjects.map((s: any, idx) => [
 idx + 1, s.subjectCode, s.subjectName, `${s.credits} TC`,
 s.department?.name || '', s._count?.studentSubjects || 0,
 ]),
 });
 };

 // Unique semesters from drawer data for filter dropdown
 const drawerSemesters = useMemo(() => {
 const set = new Set<string>();
 drawerEnrollments.forEach((e: any) => { if (e.semester) set.add(e.semester); });
 drawerClassSummary.forEach((c: any) => c.semesters?.forEach((s: string) => set.add(s.split(' / ')[0])));
 return Array.from(set).sort();
 }, [drawerEnrollments, drawerClassSummary]);

 const drawerClassesForFilter = useMemo(() => {
 const map = new Map<number, string>();
 drawerEnrollments.forEach((e: any) => {
 if (e.student?.class) map.set(e.student.class.id, `${e.student.class.code} - ${e.student.class.name}`);
 });
 return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
 }, [drawerEnrollments]);

 return (
 <>
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
 <SubjectHeader
 onAdd={openAddModal}
 onExport={exportExcel}
 onPrint={handlePrintReport}
 isAdmin={currentUser?.role === 'ADMIN'}
 />

 <SubjectKPICards
 total={kpiData.total}
 totalCredits={kpiData.totalCredits}
 totalDepartments={kpiData.totalDepartments}
 threeCreditCount={kpiData.threeCreditCount}
 questionCount={kpiData.questionCount}
 />

        {/* Search & Unified Smart Filter Popover Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Search input + 1 Unified Filter Button */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* Search Input Field */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm theo mã môn, tên môn học..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}
            </div>

            {/* 1 Nút Bộ Lọc Duy Nhất Đa Chiều */}
            <SubjectFilterPopover
              selectedDeptId={selectedDeptId}
              onDeptChange={(val) => {
                setSelectedDeptId(val);
                setPage(1);
              }}
              filterCredits={filterCredits}
              onCreditsChange={(val) => {
                setFilterCredits(val);
                setPage(1);
              }}
              filterHasStudents={filterHasStudents}
              onHasStudentsChange={(val) => {
                setFilterHasStudents(val);
                setPage(1);
              }}
              departments={departments}
              subjects={subjects}
              totalFilteredCount={filteredSubjects.length}
              onResetAll={() => {
                setSelectedDeptId('');
                setFilterCredits('');
                setFilterHasStudents('');
                setPage(1);
              }}
            />
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <SubjectTableToolbar
              totalCount={filteredSubjects.length}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </div>
        </div>

 {loading ? (
 <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
 {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
 </div>
 ) : !paginatedSubjects.length ? (
 <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
 Không tìm thấy môn học phù hợp.
 </div>
 ) : (
 <SubjectTable
 subjects={paginatedSubjects}
 selected={selected}
 viewMode={viewMode}
 visibleColumns={visibleColumns}
 onSelect={(id, checked) => setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))}
 onSelectAll={(checked) => setSelected(checked ? paginatedSubjects.map((s) => s.id) : [])}
 onDetail={openDrawer}
 onEnroll={openEnrollClassModal}
 onEdit={openEditModal}
 onDelete={handleDelete}
 isAdmin={currentUser?.role === 'ADMIN'}
 />
 )}

 <SubjectPaginationBar
 page={page}
 totalPages={totalPages}
 limit={limit}
 totalItems={filteredSubjects.length}
 onPage={setPage}
 onLimit={(v) => { setLimit(v); setPage(1); }}
 />
 </main>

  {/* Add/Edit Subject Modal */}
  <Modal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title={editingSubject ? 'Chỉnh sửa môn học' : 'Tạo môn học mới'}
    subtitle={editingSubject ? `Mã môn: ${editingSubject.subjectCode}` : 'Cấu hình mã môn, số tín chỉ và khoa quản lý'}
    icon={<BookOpen className="h-6 w-6 text-white" />}
    badge={editingSubject ? 'Chỉnh sửa' : 'Tạo mới'}
  >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Mã môn học</label>
 <input type="text" required placeholder="VD: INT101" value={formData.subjectCode}
 onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
 className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white" />
 </div>
 <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Tên môn học</label>
 <input type="text" required placeholder="VD: Lập trình Căn bản" value={formData.subjectName}
 onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
 className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Số Tín chỉ</label>
 <input type="number" required min={1} max={10} value={formData.credits}
 onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
 className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white" />
 </div>
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Khoa đào tạo</label>
 <FilterSelect containerClassName="w-full" required value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
 className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
 <option value="">-- Chọn Khoa --</option>
 {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
 </FilterSelect>
 </div>
 </div>
 <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
 {!editingSubject ? (
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
 {editingSubject ? 'Cập nhật môn học' : 'Lưu môn học'}
 </Button>
 </div>
 </div>
 </form>
 </Modal>

 {/* Excel Import Modal */}
 <ExcelImportModal
 isOpen={isImportModalOpen}
 onClose={() => setIsImportModalOpen(false)}
 title="Import danh sách môn học từ Excel"
 templateFileName="danh_sach_mon_hoc_mau.csv"
 onImportSuccess={async () => {
 await fetchData();
 setToast({ message: 'Nhập danh sách môn học từ file thành công!', type: 'success' });
 }}
 />

 {/* Enroll by Class Modal */}
 <Modal
 isOpen={Boolean(enrollClassSubject)}
 onClose={() => setEnrollClassSubject(null)}
 title={`Gán Lớp vào Môn — ${enrollClassSubject?.subjectName || ''}`}
 >
 <form onSubmit={handleEnrollByClass} className="space-y-4">
 {/* Chọn lớp */}
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Chọn Lớp</label>
 <div className="relative">
 <FilterSelect 
 required
 value={enrollClassData.classId}
 onChange={(e) => setEnrollClassData({ ...enrollClassData, classId: e.target.value })}
 className="w-full appearance-none rounded-xl border border-slate-200 px-3 pr-8 py-2 text-[15px] font-medium focus:border-blue-500 focus:outline-none cursor-pointer"
 >
 <option value="">-- Chọn lớp để gán --</option>
 {classes.map((c: any) => (
 <option key={c.id} value={String(c.id)}>
 {c.code} — {c.name} {c.department?.name ? `(${c.department.name})` : ''} · {c._count?.students ?? c.students?.length ?? 0} SV
 </option>
 ))}
 </FilterSelect>
 </div>
 </div>

 {/* Học kỳ + Năm học */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Học kỳ</label>
 <FilterSelect containerClassName="w-full" value={enrollClassData.semester}
 onChange={(e) => setEnrollClassData({ ...enrollClassData, semester: e.target.value })}
 className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-medium focus:border-blue-500 focus:outline-none">
 <option value="HK1">Học kỳ I</option>
 <option value="HK2">Học kỳ II</option>
 <option value="HK3">Học kỳ Hè</option>
 </FilterSelect>
 </div>
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Năm học</label>
 <input type="text" required value={enrollClassData.schoolYear}
 onChange={(e) => setEnrollClassData({ ...enrollClassData, schoolYear: e.target.value })}
 placeholder="VD: 2025-2026"
 className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] font-medium focus:border-blue-500 focus:outline-none" />
 </div>
 </div>

 {/* Preview */}
 {enrollClassData.classId && (
 <div className={`rounded-xl p-4 border ${previewLoading ? 'border-slate-100 bg-slate-50' : enrollClassPreview ? 'border-blue-100 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
 {previewLoading ? (
 <p className="text-xs text-slate-400 font-semibold animate-pulse">Đang kiểm tra...</p>
 ) : enrollClassPreview ? (
 <div className="space-y-1">
 <p className="text-xs font-semibold text-blue-800">Xem trước kết quả gán</p>
 <div className="grid grid-cols-3 gap-2 mt-2">
 <div className="text-center">
 <p className="text-lg font-semibold text-slate-800">{enrollClassPreview.totalStudents}</p>
 <p className="text-[12px] font-semibold text-slate-500">Tổng SV lớp</p>
 </div>
 <div className="text-center">
 <p className="text-lg font-semibold text-blue-600">{enrollClassPreview.newStudents}</p>
 <p className="text-[12px] font-semibold text-blue-600">Sẽ được thêm mới</p>
 </div>
 <div className="text-center">
 <p className="text-lg font-semibold text-slate-500">{enrollClassPreview.alreadyEnrolled}</p>
 <p className="text-[12px] font-semibold text-slate-500">Đã đăng ký rồi</p>
 </div>
 </div>
 </div>
 ) : (
 <p className="text-xs text-slate-400 font-semibold">Không thể tải thông tin preview.</p>
 )}
 </div>
 )}

 <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => setEnrollClassSubject(null)}
 >
 Hủy
 </Button>
 <Button
 type="submit"
 variant="primary"
 size="md"
 disabled={!enrollClassData.classId || enrollClassLoading}
 isLoading={enrollClassLoading}
 >
 Xác nhận Gán Lớp
 </Button>
 </div>
 </form>
 </Modal>

 {/* Subject Detail Drawer */}
 {drawerSubject && (
 <div role="dialog" aria-modal="true" aria-label="Chi tiết môn học" className="fixed inset-0 z-[100] flex justify-end">
 <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setDrawerSubject(null)} />
  <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full">
 {/* Header - Modern Gradient matching ProfileDrawer */}
<div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 text-white shrink-0 shadow-xs">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3 min-w-0 flex-1">
<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md font-semibold text-base text-white border border-white/25 shadow-2xs">
 {drawerSubject.subjectCode.substring(0, 2).toUpperCase()}
 </div>
 <div className="min-w-0 flex-1 pr-2">
<h2 className="text-[18px] font-semibold leading-snug text-white line-clamp-2 break-words">
 {drawerSubject.subjectName}
 </h2>
 <p className="text-[13px] font-semibold text-blue-100/90 mt-1.5 tabular-nums">
 Mã môn: {drawerSubject.subjectCode} • {drawerSubject.credits} Tín chỉ
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setDrawerSubject(null)}
 className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
 title="Đóng"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* Tabs */}
  <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 shrink-0 bg-white dark:bg-slate-900 overflow-x-auto">
 {[
 { key: 'info', label: 'Thông tin', icon: BookOpen },
 { key: 'classes', label: 'Lớp đã gán', icon: GraduationCap },
 { key: 'students', label: 'Sinh viên', icon: Users },
 ].map((tab) => (
 <button
 key={tab.key}
 onClick={() => setDrawerTab(tab.key as any)}
 className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-[15px] font-medium transition cursor-pointer flex items-center gap-2 ${drawerTab === tab.key
 ? 'border-blue-600 text-blue-600 font-semibold'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 <tab.icon className="h-4 w-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Tab Content */}
  <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-slate-900">
 {/* --- TAB INFO --- */}
 {drawerTab === 'info' && (
 <div className="space-y-4">
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: 'Sinh viên', value: (drawerSubject as any)._count?.studentSubjects ?? 0, color: 'blue' },
 { label: 'Câu hỏi', value: (drawerSubject as any)._count?.questions ?? 0, color: 'emerald' },
 { label: 'Lịch thi', value: (drawerSubject as any)._count?.examSchedules ?? 0, color: 'blue' },
 ].map((m) => (
 <div key={m.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
 <p className={`text-xl font-semibold text-${m.color}-600`}>{m.value}</p>
 <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{m.label}</p>
 </div>
 ))}
 </div>

 <div className="space-y-2">
 {[
 { label: 'Mã môn học', value: drawerSubject.subjectCode },
 { label: 'Tên môn học', value: drawerSubject.subjectName },
 { label: 'Số tín chỉ', value: `${drawerSubject.credits} tín chỉ` },
 { label: 'Khoa đào tạo', value: (drawerSubject as any).department?.name || 'Chưa gán' },
 ].map((r) => (
 <div key={r.label} className="flex items-start justify-between py-2.5 border-b border-slate-100">
 <span className="text-xs font-semibold text-slate-500">{r.label}</span>
 <span className="text-xs font-semibold text-slate-800 text-right max-w-[60%]">{r.value}</span>
 </div>
 ))}
 </div>

 {currentUser?.role === 'ADMIN' && (
 <button
 onClick={() => openEnrollClassModal(drawerSubject)}
 className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
 >
 <GraduationCap className="h-4 w-4" />
 Gán Lớp vào Môn học
 </button>
 )}
 </div>
 )}

 {/* --- TAB CLASSES --- */}
 {drawerTab === 'classes' && (
 <div className="space-y-3">
 {/* Filter */}
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Lọc theo học kỳ..."
 value={drawerFilterSemester}
 onChange={(e) => setDrawerFilterSemester(e.target.value)}
 className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[15px] font-normal focus:border-blue-500 focus:outline-none"
 />
 </div>

 {drawerLoading ? (
 <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
 ) : drawerClassSummary.length === 0 ? (
 <div className="py-12 text-center">
 <BookMarked className="h-8 w-8 text-slate-700 mx-auto mb-2" />
 <p className="text-xs font-semibold text-slate-400">Chưa có lớp nào được gán vào môn học này.</p>
 {currentUser?.role === 'ADMIN' && (
 <button onClick={() => openEnrollClassModal(drawerSubject!)}
 className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer">
 Gán Lớp Ngay
 </button>
 )}
 </div>
 ) : (
 drawerClassSummary
 .filter((c) => !drawerFilterSemester || c.semesters?.some((s: string) => s.toLowerCase().includes(drawerFilterSemester.toLowerCase())))
 .map((c: any) => (
 <div key={c.classId} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold text-slate-800">{c.classCode} — {c.className}</p>
 <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{c.departmentName}</p>
 <div className="flex flex-wrap gap-1 mt-1.5">
 {c.semesters?.map((s: string) => (
 <IdentifierBadge key={s}>{s}</IdentifierBadge>
 ))}
 </div>
 </div>
 <div className="text-right shrink-0">
 <p className="text-lg font-semibold text-blue-600">{c.count}</p>
 <p className="text-[12px] font-semibold text-slate-500">sinh viên</p>
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {/* --- TAB STUDENTS --- */}
 {drawerTab === 'students' && (
 <div className="space-y-3">
 {/* Filters */}
 <div className="flex flex-wrap gap-2">
 <div className="relative w-full sm:w-72 md:w-80">
 <FilterSelect value={drawerFilterClass} onChange={(e) => setDrawerFilterClass(e.target.value)}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-7 py-2 text-[15px] font-normal focus:outline-none cursor-pointer">
 <option value="">Tất cả lớp</option>
 {drawerClassesForFilter.map((c) => <option key={c.id} value={String(c.id)}>{c.label}</option>)}
 </FilterSelect>
 </div>
 <div className="relative">
 <FilterSelect value={drawerFilterSemester} onChange={(e) => setDrawerFilterSemester(e.target.value)}
 className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-7 py-2 text-[15px] font-normal focus:outline-none cursor-pointer">
 <option value="">Tất cả HK</option>
 {drawerSemesters.map((s) => <option key={s} value={s}>{s}</option>)}
 </FilterSelect>
 </div>
 </div>

 {/* Summary */}
 <div className="text-xs font-semibold text-slate-500">
 {drawerLoading ? 'Đang tải...' : `${drawerEnrollments.length} sinh viên`}
 </div>

 {drawerLoading ? (
 <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div>
 ) : drawerEnrollments.length === 0 ? (
 <div className="py-12 text-center">
 <Users className="h-8 w-8 text-slate-700 mx-auto mb-2" />
 <p className="text-xs font-semibold text-slate-400">Không có sinh viên nào phù hợp.</p>
 </div>
 ) : (
 <div className="space-y-1.5">
 {drawerEnrollments.map((e: any) => (
 <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition">
 <div>
 <p className="text-xs font-semibold text-slate-800">{e.student?.fullName}</p>
 <p className="text-[12px] font-semibold text-slate-400">{e.student?.studentCode} · {e.student?.class?.name || 'Chưa có lớp'}</p>
 </div>
 <div className="text-right">
 <span className="text-[12px] font-semibold text-blue-700 bg-blue-50 rounded-md px-1.5 py-0.5">{e.semester}</span>
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
