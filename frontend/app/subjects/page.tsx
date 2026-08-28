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
import { SubjectBulkAction } from '../../components/subjects/SubjectBulkAction';
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
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState('newest');
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
  const [drawerOpenSubject, setDrawerOpenSubject] = useState<Subject | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (drawerSubject) {
      setDrawerOpenSubject(drawerSubject);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrawerVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setDrawerVisible(false);
      const timer = setTimeout(() => {
        setDrawerOpenSubject(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [drawerSubject]);

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
        api.get('/subjects'),
        api.get('/departments'),
        api.get('/classes'),
      ]);
      setSubjects(resSubjects.data || []);
      setDepartments(resDepts.data || []);
      setClasses(resClasses.data || []);
      return true;
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách môn học', type: 'error' });
      return false;
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
    if (await fetchData()) setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
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
      title: 'Xóa môn học?',
      message: `Bạn có chắc chắn muốn xóa môn học ${item?.subjectName || ''}? Dữ liệu sẽ được chuyển vào thùng rác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/subjects/${id}`);
          setToast({ message: 'Đã chuyển môn học vào thùng rác thành công!', type: 'success' });
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

  const prepareSubjectExportData = () => {
    const columns = [
      { header: 'STT', width: 6, align: 'center' as const },
      { header: 'Mã môn học', width: 14, align: 'center' as const },
      { header: 'Tên môn học', width: 32, align: 'left' as const },
      { header: 'Số tín chỉ', width: 12, align: 'center' as const },
      { header: 'Khoa đào tạo', width: 24, align: 'left' as const },
      { header: 'Số SV đăng ký', width: 15, align: 'center' as const },
    ];

    const rows = filteredSubjects.map((s: any, idx) => [
      idx + 1,
      s.subjectCode,
      s.subjectName,
      `${s.credits} TC`,
      s.department?.name || '---',
      s._count?.studentSubjects || 0,
    ]);

    const metaInfo = [
      { label: 'Tổng số môn học', value: String(subjects.length) },
      { label: 'Tổng số tín chỉ', value: `${kpiData.totalCredits} TC` },
      { label: 'Môn đang lọc', value: String(filteredSubjects.length) },
    ];

    return { columns, rows, metaInfo };
  };

  const exportExcel = async () => {
    const { columns, rows, metaInfo } = prepareSubjectExportData();

    await exportToFormattedExcel({
      filename: 'Danh_sach_mon_hoc.xls',
      templateCode: 'SUBJECT_DIRECTORY',
      title: 'DANH SÁCH MÔN HỌC',
      subtitle: 'Danh mục môn học và phân bổ tín chỉ đào tạo',
      columns,
      rows,
      metaInfo,
    });
  };

  const handlePrintReport = () => {
    const { columns, rows, metaInfo } = prepareSubjectExportData();

    printReport({
      templateCode: 'SUBJECT_DIRECTORY',
      title: 'DANH SÁCH MÔN HỌC',
      subtitle: 'Danh mục môn học và phân bổ tín chỉ đào tạo',
      metaInfo,
      columns: columns.map((c) => ({
        header: c.header,
        width: typeof c.width === 'number' ? `${c.width * 10}px` : c.width,
        align: c.align,
      })),
      rows,
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
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
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
              className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
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
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <SubjectTableToolbar
              totalCount={filteredSubjects.length}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : !paginatedSubjects.length ? (
          <div className="rounded-2xl border border-slate-200/60 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy môn học phù hợp.
          </div>
        ) : (
          <SubjectTable
            subjects={paginatedSubjects}
            selected={selected}
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

        {/* Floating Bulk Action Bar */}
        <SubjectBulkAction
          selectedCount={selected.length}
          totalCount={filteredSubjects.length}
          allSelected={selected.length === filteredSubjects.length && filteredSubjects.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredSubjects.length ? [] : filteredSubjects.map((s) => s.id))
          }
          onExportExcel={() => {
            const selectedItems = subjects.filter((s) => selected.includes(s.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã môn', width: 15 },
              { header: 'Tên môn học', width: 30 },
              { header: 'Số tín chỉ', width: 12, align: 'center' as const },
              { header: 'Khoa trực thuộc', width: 25 },
            ];
            const rows = selectedItems.map((s, idx) => [
              idx + 1,
              s.subjectCode,
              s.name,
              s.credits,
              s.department?.name || '',
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_mon_hoc_da_chon.xls',
              title: 'DANH SÁCH MÔN HỌC ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} môn học`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} môn học ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = subjects.filter((s) => selected.includes(s.id));
            printReport({
              title: 'BÁO CÁO DANH SÁCH MÔN HỌC ĐÃ CHỌN',
              subtitle: `Tổng số môn học được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng đã chọn', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã môn', width: '90px', align: 'center' },
                { header: 'Tên Môn học', width: '220px' },
                { header: 'Số tín chỉ', width: '80px', align: 'center' },
                { header: 'Khoa trực thuộc', width: '180px' },
              ],
              rows: selectedItems.map((s, idx) => [
                idx + 1,
                s.subjectCode,
                s.name,
                String(s.credits),
                s.department?.name || '---',
              ]),
            });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt môn học?',
              message: `Bạn có chắc chắn muốn xóa ${count} môn học đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/subjects/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setSubjects((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} môn học`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa môn học', type: 'error' });
                }
              },
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Add/Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Sửa môn học' : 'Thêm môn học'}
        subtitle={editingSubject ? `Mã môn: ${editingSubject.subjectCode}` : 'Cấu hình mã môn, số tín chỉ và khoa'}
        icon={<BookOpen className="h-6 w-6 text-white" />}
        badge={editingSubject ? 'Chỉnh sửa' : 'Tạo mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">Mã môn học</label>
            <input type="text" required placeholder="VD: INT101" value={formData.subjectCode}
              onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white" />
          </div>
          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">Tên môn học</label>
            <input type="text" required placeholder="VD: Lập trình Căn bản" value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Số Tín chỉ</label>
              <input type="number" required min={1} max={10} value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white" />
            </div>
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Khoa đào tạo</label>
              <FilterSelect containerClassName="w-full" required value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                <option value="">-- Chọn Khoa --</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </FilterSelect>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {!editingSubject ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsImportModalOpen(true);
                }}
                title="Nhập nhanh từ file Excel / CSV"
                aria-label="Nhập nhanh từ file Excel / CSV"
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
              >
                <FileSpreadsheet className="h-5 w-5" strokeWidth={1.75} />
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
                Hủy bỏ
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
        title="Nhập danh sách môn học"
        templateFileName="danh_sach_mon_hoc_mau.csv"
        entityLabel="môn học"
        templateContent={'subjectCode,subjectName,credits,departmentId\nCS101,Cơ sở dữ liệu,3,1'}
        onImportRows={async (row) => {
          await api.post('/subjects', {
            subjectCode: row.subjectCode || row.code,
            subjectName: row.subjectName || row.name,
            credits: Number(row.credits),
            departmentId: Number(row.departmentId || row.department),
          });
        }}
        onImportSuccess={async () => {
          await fetchData();
          setToast({ message: 'Nhập danh sách môn học từ file thành công!', type: 'success' });
        }}
      />

      {/* Enroll by Class Modal */}
      <Modal
        isOpen={Boolean(enrollClassSubject)}
        onClose={() => setEnrollClassSubject(null)}
        title={`Gán Lớp vào Môn – ${enrollClassSubject?.subjectName || ''}`}
      >
        <form onSubmit={handleEnrollByClass} className="space-y-4">
          {/* Chọn lớp */}
          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">Chọn Lớp</label>
            <div className="relative">
              <FilterSelect
                required
                value={enrollClassData.classId}
                onChange={(e) => setEnrollClassData({ ...enrollClassData, classId: e.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 px-3 pr-8 py-2 text-type-body font-medium focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Chọn lớp để gán --</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} ({c.code}){c.department?.name ? ` – ${c.department.name}` : ''} | {c._count?.students ?? c.students?.length ?? 0} SV
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>

          {/* Học kỳ + Năm học */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Học kỳ</label>
              <FilterSelect containerClassName="w-full" value={enrollClassData.semester}
                onChange={(e) => setEnrollClassData({ ...enrollClassData, semester: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-type-body font-medium focus:border-blue-500 focus:outline-none">
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
                <option value="HK3">Học kỳ Hè</option>
              </FilterSelect>
            </div>
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Năm học</label>
              <input type="text" required value={enrollClassData.schoolYear}
                onChange={(e) => setEnrollClassData({ ...enrollClassData, schoolYear: e.target.value })}
                placeholder="VD: 2025-2026"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body font-medium focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          {/* Preview */}
          {enrollClassData.classId && (
            <div className={`rounded-xl p-4 border ${previewLoading ? 'border-slate-100 bg-slate-50' : enrollClassPreview ? 'border-blue-100 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
              {previewLoading ? (
                <p className="text-type-helper text-slate-400 font-semibold animate-pulse">Đang kiểm tra...</p>
              ) : enrollClassPreview ? (
                <div className="space-y-1">
                  <p className="text-type-helper font-semibold text-blue-800">Xem trước kết quả gán</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center">
                      <p className="text-type-card font-semibold text-slate-800">{enrollClassPreview.totalStudents}</p>
                      <p className="text-type-helper font-semibold text-slate-500">Tổng SV lớp</p>
                    </div>
                    <div className="text-center">
                      <p className="text-type-card font-semibold text-blue-600">{enrollClassPreview.newStudents}</p>
                      <p className="text-type-helper font-semibold text-blue-600">Sẽ được thêm mới</p>
                    </div>
                    <div className="text-center">
                      <p className="text-type-card font-semibold text-slate-500">{enrollClassPreview.alreadyEnrolled}</p>
                      <p className="text-type-helper font-semibold text-slate-500">Đã đăng ký rồi</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-type-helper text-slate-400 font-semibold">Không thể tải thông tin preview.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setEnrollClassSubject(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!enrollClassData.classId || enrollClassLoading}
              isLoading={enrollClassLoading}
            >
              Xác nhận gán lớp
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subject Detail Drawer — Chuẩn Design System & Hoạt ảnh 60 FPS */}
      {drawerOpenSubject && (
        <div role="dialog" aria-modal="true" aria-label="Chi tiết môn học" className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop mờ nền */}
          <div
            className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerVisible ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setDrawerSubject(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <div
              className={`w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/60 dark:border-slate-800 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${drawerVisible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
              {/* Header — Tương phản cao, Phân cấp chuẩn mực */}
              <div className="relative bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/60 dark:border-slate-800 p-6 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Avatar / Icon Badge thương hiệu */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-type-body shadow-sm shadow-blue-500/25 border border-blue-400/30">
                      {drawerOpenSubject.subjectCode.substring(0, 3).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Dòng 1: Tên môn học + Mã môn học (Ngang hàng) */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white break-words" title={drawerOpenSubject.subjectName}>
                          {drawerOpenSubject.subjectName}
                        </h2>
                        <IdentifierBadge tone="neutral" title="Mã môn học">
                          {drawerOpenSubject.subjectCode}
                        </IdentifierBadge>
                      </div>

                      {/* Dòng 2: Tín chỉ với icon GraduationCap */}
                      <div className="flex items-center gap-1.5 text-type-helper font-medium text-slate-600 dark:text-slate-400 min-w-0">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="tabular-nums">{drawerOpenSubject.credits} Tín chỉ</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Đóng */}
                  <button
                    type="button"
                    onClick={() => setDrawerSubject(null)}
                    className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Đóng chi tiết"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-800 px-6 shrink-0 bg-white dark:bg-slate-900 overflow-x-auto">
                {[
                  { key: 'info', label: 'Thông tin', icon: BookOpen },
                  { key: 'classes', label: 'Lớp đã gán', icon: GraduationCap },
                  { key: 'students', label: 'Sinh viên', icon: Users },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDrawerTab(tab.key as any)}
                    className={`whitespace-nowrap border-b-2 px-4 py-3 text-type-body transition cursor-pointer flex items-center gap-2 ${drawerTab === tab.key
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
                      }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content — Black-forward Palette, Không khung lồng */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
                {/* --- TAB INFO --- */}
                {drawerTab === 'info' && (
                  <div className="space-y-6">
                    {/* 3 Thẻ thống kê nhanh */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Sinh viên', value: (drawerOpenSubject as any)._count?.studentSubjects ?? 0 },
                        { label: 'Câu hỏi', value: (drawerOpenSubject as any)._count?.questions ?? 0 },
                        { label: 'Lịch thi', value: (drawerOpenSubject as any)._count?.examSchedules ?? 0 },
                      ].map((m) => (
                        <div key={m.label} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-center">
                          <p className="text-type-section font-semibold text-blue-600 dark:text-blue-400">{m.value}</p>
                          <p className="text-type-helper font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Danh sách thông tin chi tiết */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                        <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                          Chi tiết môn học
                        </h3>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {[
                          { label: 'Mã môn học', value: drawerOpenSubject.subjectCode, icon: BookOpen },
                          { label: 'Tên môn học', value: drawerOpenSubject.subjectName, icon: BookMarked },
                          { label: 'Số tín chỉ', value: `${drawerOpenSubject.credits} tín chỉ`, icon: Award },
                          { label: 'Khoa đào tạo', value: (drawerOpenSubject as any).department?.name || 'Chưa gán', icon: Building2 },
                        ].map((r) => {
                          const Icon = r.icon;
                          return (
                            <div
                              key={r.label}
                              className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group"
                            >
                              <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-type-body font-semibold shrink-0">
                                {Icon && (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                )}
                                <span>{r.label}</span>
                              </span>

                              <span className="font-semibold text-slate-900 dark:text-white text-right text-type-body leading-snug break-words max-w-[62%]">
                                {r.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {currentUser?.role === 'ADMIN' && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          leftIcon={<GraduationCap className="h-4 w-4 shrink-0" />}
                          onClick={() => openEnrollClassModal(drawerOpenSubject)}
                          className="w-full justify-center"
                        >
                          Gán lớp cho môn học
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB CLASSES --- */}
                {drawerTab === 'classes' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Lọc theo học kỳ..."
                        value={drawerFilterSemester}
                        onChange={(e) => setDrawerFilterSemester(e.target.value)}
                        className="h-10 flex-1 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {drawerLoading ? (
                      <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
                    ) : drawerClassSummary.length === 0 ? (
                      <div className="py-12 text-center">
                        <BookMarked className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-type-body-sm font-semibold text-slate-500">Chưa có lớp nào được gán vào môn học này.</p>
                        {currentUser?.role === 'ADMIN' && (
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            onClick={() => openEnrollClassModal(drawerOpenSubject!)}
                            className="mt-3"
                          >
                            Gán lớp
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {drawerClassSummary
                          .filter((c) => !drawerFilterSemester || c.semesters?.some((s: string) => s.toLowerCase().includes(drawerFilterSemester.toLowerCase())))
                          .map((c: any) => (
                            <div key={c.classId} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-type-body-sm font-semibold text-slate-900 dark:text-white">{c.className} <span className="text-type-helper font-normal text-slate-500">({c.classCode})</span></p>
                                <p className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{c.departmentName}</p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {c.semesters?.map((s: string) => (
                                    <IdentifierBadge key={s}>{s}</IdentifierBadge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-type-card font-semibold text-blue-600 dark:text-blue-400">{c.count}</p>
                                <p className="text-type-helper font-semibold text-slate-500">sinh viên</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB STUDENTS --- */}
                {drawerTab === 'students' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative min-w-0">
                        <FilterSelect
                          value={drawerFilterClass}
                          onChange={(e) => setDrawerFilterClass(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 pl-3 pr-7 py-2 text-type-body-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Tất cả lớp</option>
                          {drawerClassesForFilter.map((c) => (
                            <option key={c.id} value={String(c.id)}>{c.label}</option>
                          ))}
                        </FilterSelect>
                      </div>
                      <div className="relative min-w-0">
                        <FilterSelect
                          value={drawerFilterSemester}
                          onChange={(e) => setDrawerFilterSemester(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 pl-3 pr-7 py-2 text-type-body-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
                        >
                          <option value="">Tất cả HK</option>
                          {drawerSemesters.map((s) => <option key={s} value={s}>{s}</option>)}
                        </FilterSelect>
                      </div>
                    </div>

                    <div className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
                      {drawerLoading ? 'Đang tải...' : `${drawerEnrollments.length} sinh viên đã đăng ký`}
                    </div>

                    {drawerLoading ? (
                      <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div>
                    ) : drawerEnrollments.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-type-body-sm font-semibold text-slate-500">Không có sinh viên nào phù hợp.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {drawerEnrollments.map((e: any) => (
                          <div key={e.id} className="py-2.5 px-3 -mx-3 rounded-xl flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <div>
                              <p className="text-type-body-sm font-semibold text-slate-900 dark:text-white">{e.student?.fullName}</p>
                              <p className="text-type-helper font-normal text-slate-500">{e.student?.studentCode} ({e.student?.class?.name || 'Chưa có lớp'})</p>
                            </div>
                            <div className="text-right">
                              <span className="text-type-helper font-medium text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 ui-pill rounded-full px-2 py-0.5">{e.semester}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer — Nút 40px chuẩn Design token */}
              <div className="border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-end shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setDrawerSubject(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
