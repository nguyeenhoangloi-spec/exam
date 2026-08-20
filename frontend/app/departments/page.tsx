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
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { Department, Subject } from '../../types';
import { Building2, Search, X, Plus, Trash2, BookOpen, GraduationCap, Award, Users } from 'lucide-react';

import { DepartmentHeader } from '../../components/departments/DepartmentHeader';
import { DepartmentKPICards } from '../../components/departments/DepartmentKPICards';
import { DepartmentFilterPopover } from '../../components/departments/DepartmentFilterPopover';
import { DepartmentTableToolbar } from '../../components/departments/DepartmentTableToolbar';
import { DepartmentTable } from '../../components/departments/DepartmentTable';
import { DepartmentPaginationBar } from '../../components/departments/DepartmentPaginationBar';
import { DepartmentBulkAction } from '../../components/departments/DepartmentBulkAction';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { ProfileDrawer } from '../../components/ProfileDrawer';

interface CurriculumItem {
  id: number;
  departmentId: number;
  subjectId: number;
  type: 'MANDATORY' | 'ELECTIVE';
  recommendedSemester: number;
  note: string | null;
  subject: {
    id: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    department?: { id: number; name: string; code: string };
  };
}

export default function DepartmentsPage() {
  usePageTitle('Quản lý khoa');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [hasClassFilter, setHasClassFilter] = useState('');
  const [hasTeacherFilter, setHasTeacherFilter] = useState('');
  const [hasSubjectFilter, setHasSubjectFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    subjectsCount: true,
    classesCount: true,
    teachersCount: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);

  // Custom Drawer State
  const [drawerDepartment, setDrawerDepartment] = useState<Department | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'subjects' | 'classes' | 'teachers' | 'students'>('info');
  const [drawerDetail, setDrawerDetail] = useState<any>(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [drawerStudentSearch, setDrawerStudentSearch] = useState('');

  // Department Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });

  // Curriculum Modal State
  const [curriculumDept, setCurriculumDept] = useState<Department | null>(null);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [addCurriculumForm, setAddCurriculumForm] = useState({
    subjectId: '',
    type: 'MANDATORY' as 'MANDATORY' | 'ELECTIVE',
    recommendedSemester: '1',
    note: '',
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resDepts, resSubs] = await Promise.all([
        api.get('/departments'),
        api.get('/subjects'),
      ]);
      setDepartments(resDepts.data || []);
      setAllSubjects(resSubs.data || []);
      return true;
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách khoa', type: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    if (await fetchData()) setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
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
    const total = departments.length;
    const totalSubjects = departments.reduce((acc, curr: any) => acc + Math.max(curr.subjectsCount || 0, curr._count?.majorSubjects || 0, curr._count?.subjects || 0, curr.subjects?.length || 0), 0);
    const totalClasses = departments.reduce((acc, curr: any) => acc + (curr.classesCount ?? curr._count?.classes ?? curr.classes?.length ?? 0), 0);
    const totalTeachers = departments.reduce((acc, curr: any) => acc + (curr.teachersCount ?? curr._count?.teachers ?? curr.teachers?.length ?? 0), 0);
    return {
      total,
      totalSubjects: totalSubjects || allSubjects.length,
      totalClasses,
      totalTeachers,
      curriculumCount: totalSubjects,
    };
  }, [departments, allSubjects]);

  // Filter & Sort Departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((d: any) => {
        const matchSearch =
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.code.toLowerCase().includes(search.toLowerCase());

        const classCount = d.classesCount ?? d._count?.classes ?? d.classes?.length ?? 0;
        let matchClass = true;
        if (hasClassFilter === 'YES') matchClass = classCount > 0;
        else if (hasClassFilter === 'NO') matchClass = classCount === 0;

        const teacherCount = d.teachersCount ?? d._count?.teachers ?? d.teachers?.length ?? 0;
        let matchTeacher = true;
        if (hasTeacherFilter === 'YES') matchTeacher = teacherCount > 0;
        else if (hasTeacherFilter === 'NO') matchTeacher = teacherCount === 0;

        const subjectCount = Math.max(d.subjectsCount || 0, d._count?.majorSubjects || 0, d._count?.subjects || 0, d.subjects?.length || 0);
        let matchSubject = true;
        if (hasSubjectFilter === 'YES') matchSubject = subjectCount > 0;
        else if (hasSubjectFilter === 'NO') matchSubject = subjectCount === 0;

        return matchSearch && matchClass && matchTeacher && matchSubject;
      })
      .sort((a: any, b: any) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.name.localeCompare(b.name, 'vi');
        if (sortOrder === 'subjects_desc') {
          const sA = a.subjectsCount ?? a.subjects?.length ?? 0;
          const sB = b.subjectsCount ?? b.subjects?.length ?? 0;
          return sB - sA;
        }
        return b.id - a.id;
      });
  }, [departments, search, hasClassFilter, hasTeacherFilter, hasSubjectFilter, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / limit));
  const paginatedDepartments = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredDepartments.slice(start, start + limit);
  }, [filteredDepartments, page, limit]);

  // Drawer Actions
  const handleOpenDrawer = useCallback(async (dept: Department) => {
    setDrawerDepartment(dept);
    setDrawerTab('info');
    setLoadingDrawer(true);
    setDrawerDetail(null);
    setDrawerStudentSearch('');
    try {
      const res = await api.get(`/departments/${dept.id}`);
      setDrawerDetail(res.data);
    } catch (err: any) {
      setToast({ message: 'Lỗi tải chi tiết khoa', type: 'error' });
    } finally {
      setLoadingDrawer(false);
    }
  }, []);

  // Department Actions
  const openAddModal = () => {
    setEditingDepartment(null);
    setFormData({ code: '', name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDepartment(d);
    setFormData({ code: d.code, name: d.name });
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
        setToast({ message: 'Tạo khoa mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi lưu thông tin Khoa', type: 'error' });
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id: number) => {
    const item = departments.find((d) => d.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa khoa?',
      message: `Bạn có chắc chắn muốn xóa khoa ${item?.name || ''}? Dữ liệu sẽ được chuyển vào thùng rác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/departments/${id}`);
          setToast({ message: 'Đã chuyển khoa vào thùng rác thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi xóa khoa', type: 'error' });
        }
      },
    });
  };

  // Curriculum Actions
  const handleOpenCurriculumModal = async (dept: Department) => {
    setCurriculumDept(dept);
    setLoadingCurriculum(true);
    try {
      const res = await api.get(`/departments/${dept.id}/curriculum`);
      setCurriculumList(res.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải khung chương trình', type: 'error' });
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const handleAddCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumDept || !addCurriculumForm.subjectId) {
      setToast({ message: 'Vui lòng chọn môn học để thêm vào khung đào tạo', type: 'error' });
      return;
    }
    try {
      await api.post(`/departments/${curriculumDept.id}/curriculum`, {
        subjectId: Number(addCurriculumForm.subjectId),
        type: addCurriculumForm.type,
        recommendedSemester: Number(addCurriculumForm.recommendedSemester),
        note: addCurriculumForm.note || null,
      });
      setToast({ message: 'Thêm môn học vào khung chương trình thành công!', type: 'success' });
      setAddCurriculumForm({
        subjectId: '',
        type: 'MANDATORY',
        recommendedSemester: '1',
        note: '',
      });
      handleOpenCurriculumModal(curriculumDept);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi thêm môn học vào khung đào tạo', type: 'error' });
    }
  };

  const handleDeleteCurriculum = async (curriculumId: number) => {
    if (!curriculumDept) return;
    try {
      await api.delete(`/departments/${curriculumDept.id}/curriculum/${curriculumId}`);
      setToast({ message: 'Đã xóa môn học khỏi khung chương trình!', type: 'success' });
      handleOpenCurriculumModal(curriculumDept);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi xóa môn khỏi khung đào tạo', type: 'error' });
    }
  };

  // Export Excel Function
  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Mã Khoa', width: 15 },
      { header: 'Tên Khoa đào tạo', width: 35 },
      { header: 'Số môn học', width: 15, align: 'center' as const },
      { header: 'Số lớp học', width: 15, align: 'center' as const },
      { header: 'Số giảng viên', width: 15, align: 'center' as const },
    ];

    const rows = filteredDepartments.map((d: any, idx) => [
      idx + 1,
      d.code,
      d.name,
      Math.max(d.subjectsCount || 0, d._count?.majorSubjects || 0, d._count?.subjects || 0, d.subjects?.length || 0),
      d.classesCount ?? d._count?.classes ?? d.classes?.length ?? 0,
      d.teachersCount ?? d._count?.teachers ?? d.teachers?.length ?? 0,
    ]);

    exportToFormattedExcel({
      filename: 'Danh_sach_khoa_dao_tao.xls',
      title: 'DANH SÁCH KHOA ĐÀO TẠO & VIỆN CHUYÊN NGÀNH',
      subtitle: 'Trích xuất dữ liệu danh mục khoa và cơ cấu trực thuộc',
      columns,
      rows,
    });
  };

  // Print Report
  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH KHOA ĐÀO TẠO',
      subtitle: 'Danh mục Khoa / Viện và tổng hợp quy mô trực thuộc',
      metaInfo: [
        { label: 'Tổng số Khoa', value: String(departments.length) },
        { label: 'Tổng số môn học', value: String(kpiData.totalSubjects) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã Khoa', width: '90px' },
        { header: 'Tên Khoa đào tạo', width: '220px' },
        { header: 'Môn học', width: '90px', align: 'center' },
        { header: 'Lớp học', width: '90px', align: 'center' },
        { header: 'Giảng viên', width: '100px', align: 'center' },
      ],
      rows: filteredDepartments.map((d: any, idx) => [
        idx + 1,
        d.code,
        d.name,
        Math.max(d.subjectsCount || 0, d._count?.majorSubjects || 0, d._count?.subjects || 0, d.subjects?.length || 0),
        d.classesCount ?? d._count?.classes ?? d.classes?.length ?? 0,
        d.teachersCount ?? d._count?.teachers ?? d.teachers?.length ?? 0,
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <DepartmentHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <DepartmentKPICards
          total={kpiData.total}
          totalSubjects={kpiData.totalSubjects}
          totalClasses={kpiData.totalClasses}
          totalTeachers={kpiData.totalTeachers}
          curriculumCount={kpiData.curriculumCount}
        />

        {/* Search & Filter Popover Toolbar Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm mã, tên khoa..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
            />

            {/* Embedded actions on right edge of search input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}

              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

              <DepartmentFilterPopover
                hasClassFilter={hasClassFilter}
                onHasClassChange={(val) => {
                  setHasClassFilter(val);
                  setPage(1);
                }}
                hasTeacherFilter={hasTeacherFilter}
                onHasTeacherChange={(val) => {
                  setHasTeacherFilter(val);
                  setPage(1);
                }}
                hasSubjectFilter={hasSubjectFilter}
                onHasSubjectChange={(val) => {
                  setHasSubjectFilter(val);
                  setPage(1);
                }}
                departments={departments}
                totalFilteredCount={filteredDepartments.length}
                onResetAll={() => {
                  setHasClassFilter('');
                  setHasTeacherFilter('');
                  setHasSubjectFilter('');
                  setSearch('');
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Right: Table Action Toolbar */}
          <div className="shrink-0">
            <DepartmentTableToolbar
              totalCount={filteredDepartments.length}
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

        {/* Full-Width DataGrid Table */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedDepartments.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy Khoa phù hợp.
          </div>
        ) : (
          <DepartmentTable
            departments={paginatedDepartments}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedDepartments.map((d) => d.id) : [])
            }
            onDetail={handleOpenDrawer}
            onOpenCurriculum={handleOpenCurriculumModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <DepartmentPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredDepartments.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />

        {/* Floating Bulk Action Bar */}
        <DepartmentBulkAction
          selectedCount={selected.length}
          totalCount={filteredDepartments.length}
          allSelected={selected.length === filteredDepartments.length && filteredDepartments.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredDepartments.length ? [] : filteredDepartments.map((d) => d.id))
          }
          onExportExcel={() => {
            const selectedItems = departments.filter((d) => selected.includes(d.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã khoa', width: 15 },
              { header: 'Tên khoa/viện', width: 30 },
              { header: 'Số giảng viên', width: 15, align: 'center' as const },
              { header: 'Số môn học', width: 15, align: 'center' as const },
              { header: 'Số lớp học', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((d: any, idx) => [
              idx + 1,
              d.code,
              d.name,
              d.teachers?.length ?? 0,
              d.subjects?.length ?? 0,
              d.classes?.length ?? 0,
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_khoa_da_chon.xls',
              title: 'DANH SÁCH KHOA/VIỆN ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} khoa`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} khoa ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = departments.filter((d) => selected.includes(d.id));
            printReport({
              title: 'BÁO CÁO DANH SÁCH KHOA/VIỆN ĐÃ CHỌN',
              subtitle: `Tổng số khoa được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng đã chọn', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã khoa', width: '90px', align: 'center' },
                { header: 'Tên Khoa/Viện', width: '220px' },
                { header: 'Số giảng viên', width: '100px', align: 'center' },
                { header: 'Số môn học', width: '100px', align: 'center' },
              ],
              rows: selectedItems.map((d: any, idx) => [
                idx + 1,
                d.code,
                d.name,
                String(d.teachers?.length ?? 0),
                String(d.subjects?.length ?? 0),
              ]),
            });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt khoa?',
              message: `Bạn có chắc chắn muốn xóa ${count} khoa đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/departments/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setDepartments((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} khoa`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa khoa', type: 'error' });
                }
              },
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartment ? 'Sửa khoa' : 'Thêm khoa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mã Khoa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: CNTT, DTVT, QTKD..."
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-type-body font-semibold text-slate-800 dark:text-slate-100  focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tên Khoa đào tạo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Khoa Công nghệ Thông tin..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-type-body font-semibold text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary">
              {editingDepartment ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Curriculum Modal */}
      <Modal
        isOpen={Boolean(curriculumDept)}
        onClose={() => setCurriculumDept(null)}
        title={`Khung chương trình đào tạo: ${curriculumDept?.name || ''}`}
      >
        <div className="space-y-5">
          {/* Form thêm môn */}
          {currentUser?.role === 'ADMIN' && (
            <form onSubmit={handleAddCurriculum} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
              <div className="text-type-helper font-semibold text-slate-800  tracking-wider">
                Thêm môn vào khung đào tạo
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <FilterSelect
                    containerClassName="w-full"
                    value={addCurriculumForm.subjectId}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, subjectId: e.target.value })}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subjectName} ({s.subjectCode} - {s.credits} TC)
                      </option>
                    ))}
                  </FilterSelect>
                </div>
                <div>
                  <FilterSelect
                    containerClassName="w-full"
                    value={addCurriculumForm.type}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, type: e.target.value as any })}
                  >
                    <option value="MANDATORY">Bắt buộc</option>
                    <option value="ELECTIVE">Tự chọn</option>
                  </FilterSelect>
                </div>
                <div>
                  <Button type="submit" variant="primary" size="md" className="w-full h-10">
                    <Plus className="h-4 w-4 mr-1" /> Thêm môn
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Danh sách môn */}
          <div className="ui-table-wrap rounded-xl border border-slate-200 overflow-hidden">
            {loadingCurriculum ? (
              <div className="p-8 text-center text-type-helper text-slate-400">Đang tải danh sách học phần...</div>
            ) : curriculumList.length === 0 ? (
              <div className="p-8 text-center text-type-helper text-slate-400 font-medium">
                Chưa có môn học nào trong khung chương trình của khoa này.
              </div>
            ) : (
              <table className="ui-table w-full text-left text-type-body">
                <thead className="bg-slate-50 text-type-body-sm font-medium text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Mã môn</th>
                    <th className="p-3">Tên môn học</th>
                    <th className="p-3 text-center">Số TC</th>
                    <th className="p-3">Tính chất</th>
                    {currentUser?.role === 'ADMIN' && <th className="p-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {curriculumList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-normal font-semibold text-slate-800">{item.subject?.subjectCode}</td>
                      <td className="p-3 font-medium text-slate-800">{item.subject?.subjectName}</td>
                      <td className="p-3 text-center font-semibold text-blue-600">{item.subject?.credits}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-type-body font-semibold ${
                          item.type === 'MANDATORY' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn'}
                        </span>
                      </td>
                      {currentUser?.role === 'ADMIN' && (
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCurriculum(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                            title="Xóa môn"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* Department Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerDepartment)}
        onClose={() => setDrawerDepartment(null)}
        title={drawerDepartment?.name || 'Chi tiết Khoa đào tạo'}
        subtitle={drawerDepartment?.code ? `Mã khoa: ${drawerDepartment.code}` : ''}
        avatarText={drawerDepartment?.code || 'KH'}
        details={[
          { label: 'Mã khoa', value: drawerDepartment?.code, icon: Building2 },
          { label: 'Tên khoa đào tạo', value: drawerDepartment?.name, icon: Building2 },
          {
            label: 'Số môn học',
            value: `${(drawerDepartment as any)?.subjectsCount ?? drawerDepartment?._count?.subjects ?? 0} môn học`,
            icon: BookOpen,
          },
          {
            label: 'Số lớp sinh hoạt',
            value: `${(drawerDepartment as any)?.classesCount ?? drawerDepartment?._count?.classes ?? 0} lớp`,
            icon: GraduationCap,
          },
          {
            label: 'Số giảng viên',
            value: `${(drawerDepartment as any)?.teachersCount ?? drawerDepartment?._count?.teachers ?? 0} giảng viên`,
            icon: Users,
          },
        ]}
      />

      {/* Confirmation Modal */}
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
