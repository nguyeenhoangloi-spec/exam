'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { cachedGet, invalidateCache } from '../../lib/api-cache';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ExcelImportModal } from '../../components/ExcelImportModal';
import { getSmartMonogram } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Student, ClassItem, User } from '../../types';
import { Search, X, ChevronDown, User as UserIcon, School, Mail, Phone, Calendar, BookOpen, Clock, FileText, CheckCircle2, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { formatExamType } from '../../lib/enum-labels';

import { StudentHeader } from '../../components/students/StudentHeader';
import { StudentKPICards } from '../../components/students/StudentKPICards';
import { StudentFilterPopover } from '../../components/students/StudentFilterPopover';
import { StudentTableToolbar } from '../../components/students/StudentTableToolbar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { StudentTable } from '../../components/students/StudentTable';
import { StudentPaginationBar } from '../../components/students/StudentPaginationBar';
import { StudentBulkAction } from '../../components/students/StudentBulkAction';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { PageSkeleton } from '../../components/ui/Skeleton';

export default function StudentsPage() {
  usePageTitle('Quản lý sinh viên');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
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
  const [drawerOpenStudent, setDrawerOpenStudent] = useState<Student | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (drawerStudent) {
      setDrawerOpenStudent(drawerStudent);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrawerVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setDrawerVisible(false);
      const timer = setTimeout(() => {
        setDrawerOpenStudent(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [drawerStudent]);

  const [drawerTab, setDrawerTab] = useState<'info' | 'subjects' | 'schedule'>('info');
  const [drawerSubjects, setDrawerSubjects] = useState<any[] | null>(null);
  const [drawerSchedule, setDrawerSchedule] = useState<any[] | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  const openDrawer = (s: Student) => {
    setDrawerStudent(s);
    setDrawerTab('info');
    fetchDrawerSubjects(s.id);
    fetchDrawerSchedule(s.id);
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
    message: React.ReactNode;
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
      const [resStudents, resClasses] = await Promise.all([
        cachedGet('/students'),
        cachedGet('/classes'),
      ]);
      setStudents(resStudents.data || []);
      setClasses(resClasses.data || []);
      return true;
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu sinh viên', type: 'error' });
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
    invalidateCache('/students');
    invalidateCache('/classes');
    if (await fetchData()) setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

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
          (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

        const matchClass = selectedClassId ? String(s.classId) === selectedClassId : true;

        let matchGender = true;
        if (selectedGender) {
          matchGender = s.gender?.toLowerCase() === selectedGender.toLowerCase();
        }

        let matchStatus = true;
        if (selectedStatus === 'has_class') {
          matchStatus = Boolean(s.classId);
        } else if (selectedStatus === 'no_class') {
          matchStatus = !s.classId;
        }

        return matchSearch && matchClass && matchGender && matchStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
        if (sortOrder === 'name_desc') return b.fullName.localeCompare(a.fullName, 'vi');
        if (sortOrder === 'code_asc') return a.studentCode.localeCompare(b.studentCode);
        return b.id - a.id;
      });
  }, [students, search, selectedClassId, selectedGender, selectedStatus, sortOrder]);

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
        invalidateCache('/students');
        setToast({ message: 'Cập nhật sinh viên thành công!', type: 'success' });
      } else {
        await api.post('/students', payload);
        invalidateCache('/students');
        setToast({ message: 'Thêm sinh viên mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lưu thông tin sinh viên thất bại. Vui lòng thử lại.', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const s = students.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Chuyển sinh viên vào thùng rác?',
      message: (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Xóa sinh viên: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{s?.fullName}&rdquo;</span> (#{s?.studentCode})
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Dữ liệu sinh viên sẽ được chuyển vào thùng rác và có thể khôi phục lại khi cần.
          </p>
        </div>
      ),
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/students/${id}`);
          invalidateCache('/students');
          setToast({ message: 'Đã chuyển sinh viên vào thùng rác thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message || 'Xóa sinh viên thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  const handleToggleLock = (s: Student) => {
    const isLocked = s.user?.status === 'LOCKED';
    setConfirmModal({
      isOpen: true,
      title: isLocked ? 'Mở khóa tài khoản sinh viên?' : 'Khóa tài khoản sinh viên?',
      message: isLocked ? (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Mở khóa tài khoản: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{s.fullName}&rdquo;</span> (#{s.studentCode})
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Sinh viên sẽ có thể đăng nhập lại vào hệ thống khảo thí bình thường.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Khóa tài khoản: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{s.fullName}&rdquo;</span> (#{s.studentCode})
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Sinh viên sẽ tạm thời không thể đăng nhập vào hệ thống cho đến khi được mở khóa.
          </p>
        </div>
      ),
      type: isLocked ? 'info' : 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/students/${s.id}/${isLocked ? 'unlock' : 'lock'}`);
          invalidateCache('/students');
          setToast({ message: `Đã ${isLocked ? 'mở khóa' : 'khóa'} tài khoản sinh viên thành công!`, type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Thao tác thất bại', type: 'error' });
        }
      },
    });
  };

  const prepareStudentExportData = () => {
    const columns = [
      { header: 'STT', align: 'center' as const, width: 6 },
      { header: 'Mã SV', align: 'center' as const, width: 14 },
      { header: 'Họ và tên', align: 'left' as const, width: 24 },
      { header: 'Giới tính', align: 'center' as const, width: 10 },
      { header: 'Ngày sinh', align: 'center' as const, width: 14 },
      { header: 'Lớp sinh hoạt', align: 'left' as const, width: 16 },
      { header: 'Email trường', align: 'left' as const, width: 26 },
      { header: 'Số điện thoại', align: 'center' as const, width: 14 },
    ];

    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      s.studentCode,
      s.fullName,
      s.gender || 'Nam',
      s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('vi-VN') : '---',
      s.class?.name || '---',
      s.email,
      s.phone || '---',
    ]);

    const metaInfo = [
      { label: 'Tổng số sinh viên', value: String(students.length) },
      { label: 'Sinh viên đang lọc', value: String(filteredStudents.length) },
    ];

    return { columns, rows, metaInfo };
  };

  const exportExcel = async () => {
    const { columns, rows, metaInfo } = prepareStudentExportData();

    await exportToFormattedExcel({
      filename: `Danh_sach_sinh_vien_${new Date().toISOString().slice(0, 10)}.xls`,
      templateCode: 'STUDENT_DIRECTORY',
      title: 'DANH SÁCH SINH VIÊN',
      subtitle: 'Danh sách sinh viên trong cơ sở dữ liệu đào tạo',
      columns,
      rows,
      metaInfo,
    });
  };

  const handlePrintReport = () => {
    const { columns, rows, metaInfo } = prepareStudentExportData();

    printReport({
      templateCode: 'STUDENT_DIRECTORY',
      title: 'DANH SÁCH SINH VIÊN',
      subtitle: 'Danh sách sinh viên trong cơ sở dữ liệu đào tạo',
      metaInfo,
      columns: columns.map((c) => ({
        header: c.header,
        width: typeof c.width === 'number' ? `${c.width * 10}px` : c.width,
        align: c.align,
      })),
      rows,
    });
  };

  if (loading && !students.length) {
    return <PageSkeleton hasKPIs={true} variant="table" />;
  }

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen animate-in fade-in-0 duration-200">
        {/* Header */}
        <StudentHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <StudentKPICards
          total={kpiData.total}
          withClass={kpiData.withClass}
          totalClasses={kpiData.totalClasses}
          filtered={filteredStudents.length}
        />

        {/* Search & Unified Smart Filter Popover Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã SV, họ tên, email..."
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

              <StudentFilterPopover
                selectedClassId={selectedClassId}
                onClassChange={(val) => {
                  setSelectedClassId(val);
                  setPage(1);
                }}
                selectedGender={selectedGender}
                onGenderChange={(val) => {
                  setSelectedGender(val);
                  setPage(1);
                }}
                selectedStatus={selectedStatus}
                onStatusChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
                classes={classes}
                students={students}
                totalFilteredCount={filteredStudents.length}
                onResetAll={() => {
                  setSelectedClassId('');
                  setSelectedGender('');
                  setSelectedStatus('');
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <StudentTableToolbar
              totalCount={filteredStudents.length}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </div>
        </div>

        {/* Full-Width DataGrid Table */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedStudents.length ? (
          <div className="rounded-2xl border border-slate-200/60 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy Sinh viên phù hợp.
          </div>
        ) : (
          <StudentTable
            students={paginatedStudents}
            selected={selected}
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
            onToggleLock={handleToggleLock}
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
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />

        {/* Floating Bulk Action Bar */}
        <StudentBulkAction
          selectedCount={selected.length}
          totalCount={filteredStudents.length}
          allSelected={selected.length === filteredStudents.length && filteredStudents.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredStudents.length ? [] : filteredStudents.map((s) => s.id))
          }
          onExportExcel={() => {
            const selectedItems = students.filter((s) => selected.includes(s.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã SV', width: 15 },
              { header: 'Họ và tên', width: 25 },
              { header: 'Giới tính', width: 12, align: 'center' as const },
              { header: 'Lớp học', width: 15, align: 'center' as const },
              { header: 'Email', width: 25 },
              { header: 'Số điện thoại', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((s, idx) => [
              idx + 1,
              s.studentCode,
              s.fullName,
              s.gender === 'FEMALE' ? 'Nữ' : 'Nam',
              s.class?.name || '---',
              s.email,
              s.phone || '---',
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_sinh_vien_da_chon.xls',
              title: 'DANH SÁCH SINH VIÊN ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} sinh viên`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} sinh viên ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = students.filter((s) => selected.includes(s.id));
            printReport({
              title: 'BÁO CÁO DANH SÁCH SINH VIÊN ĐÃ CHỌN',
              subtitle: `Tổng số sinh viên được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng đã chọn', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã SV', width: '90px', align: 'center' },
                { header: 'Họ và Tên', width: '180px' },
                { header: 'Giới tính', width: '80px', align: 'center' },
                { header: 'Lớp học', width: '120px', align: 'center' },
                { header: 'Email', width: '180px' },
                { header: 'Số điện thoại', width: '100px', align: 'center' },
              ],
              rows: selectedItems.map((s, idx) => [
                idx + 1,
                s.studentCode,
                s.fullName,
                s.gender === 'FEMALE' ? 'Nữ' : 'Nam',
                s.class?.name || '---',
                s.email,
                s.phone || '---',
              ]),
            });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt sinh viên?',
              message: `Bạn có chắc chắn muốn xóa ${count} sinh viên đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/students/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setStudents((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} sinh viên`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa sinh viên', type: 'error' });
                }
              },
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Sửa sinh viên' : 'Thêm sinh viên'}
        subtitle={editingStudent ? `MSSV: ${editingStudent.studentCode}` : 'Nhập thông tin cá nhân và lớp học'}
        icon={<UserIcon className="h-6 w-6 text-white" />}
        badge={editingStudent ? 'Chỉnh sửa' : 'Tạo mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">Mã sinh viên</label>
            <input
              type="text"
              required
              value={formData.studentCode}
              onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">Họ và tên</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Giới tính</label>
              <FilterSelect
                containerClassName="w-full"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-type-body font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </FilterSelect>
            </div>
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Lớp học</label>
              <FilterSelect
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-type-body font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
                ))}
              </FilterSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Email Sinh viên</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-type-body focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-type-body focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {!editingStudent ? (
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
                {editingStudent ? 'Cập nhật sinh viên' : 'Lưu sinh viên'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách sinh viên"
        templateFileName="danh_sach_sinh_vien_mau.csv"
        entityLabel="sinh viên"
        templateContent={'studentCode,fullName,email,classId,gender,dateOfBirth,phone\nSV2026099,Nguyễn Văn Mẫu,mau@example.edu.vn,1,Nam,2004-01-01,0900000000'}
        onImportRows={async (row) => {
          await api.post('/students', {
            studentCode: row.studentCode || row.code,
            fullName: row.fullName || row.name,
            email: row.email,
            gender: row.gender || 'Nam',
            dateOfBirth: row.dateOfBirth || '2004-01-01',
            phone: row.phone || undefined,
            classId: Number(row.classId || row.class),
          });
        }}
        onImportSuccess={(data: any[]) => {
          invalidateCache('/students');
          setToast({ message: `Đã nhập thành công ${data.length} sinh viên từ CSV!`, type: 'success' });
          fetchData();
        }}
      />

      {/* CUSTOM DRAWER: 3 TABS — Chuẩn Design System & Hoạt ảnh 60 FPS */}
      {drawerOpenStudent && (
        <div role="dialog" aria-modal="true" aria-label="Thông tin sinh viên" className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop mờ nền */}
          <div
            className={`fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerVisible ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={closeDrawer}
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
                    {/* Avatar thương hiệu */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-semibold text-type-body shadow-sm shadow-blue-500/25 border border-blue-400/30">
                      {getSmartMonogram(drawerOpenStudent.fullName, 'SV')}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Dòng 1: Họ tên + Mã sinh viên (Ngang hàng) */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-type-card font-semibold leading-snug text-slate-900 dark:text-white break-words" title={drawerOpenStudent.fullName}>
                          {drawerOpenStudent.fullName}
                        </h2>
                        <IdentifierBadge tone="neutral" title="Mã sinh viên">
                          {drawerOpenStudent.studentCode}
                        </IdentifierBadge>
                      </div>

                      {/* Dòng 2: Lớp sinh hoạt với icon School */}
                      <div className="flex items-center gap-1.5 text-type-helper font-medium text-slate-600 dark:text-slate-400 min-w-0">
                        <School className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="truncate" title={drawerOpenStudent.class?.name || 'Chưa xếp lớp'}>
                          {drawerOpenStudent.class?.name ? `Lớp ${drawerOpenStudent.class.name.replace(/^Lớp\s+/i, '')}` : 'Chưa xếp lớp'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Đóng */}
                  <button
                    type="button"
                    onClick={closeDrawer}
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
                  { id: 'info', label: 'Hồ sơ', icon: FileText },
                  { id: 'subjects', label: 'Môn đăng ký', icon: BookOpen },
                  { id: 'schedule', label: 'Lịch thi', icon: Clock },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = drawerTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTabChange(t.id as any)}
                      className={`whitespace-nowrap border-b-2 px-4 py-3 text-type-body transition cursor-pointer flex items-center gap-2 ${isActive
                          ? 'border-blue-600 text-blue-600 font-semibold'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content — Black-forward Palette, Không khung lồng */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
                {drawerTab === 'info' && (
                  <div className="space-y-6">
                    {/* Thống kê nhanh */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">Môn đăng ký</span>
                        </div>
                        <p className="text-type-section font-semibold text-blue-600 dark:text-blue-400">
                          {drawerSubjects ? `${drawerSubjects.length} môn` : '--'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">Lịch thi</span>
                        </div>
                        <p className="text-type-section font-semibold text-blue-600 dark:text-blue-400">
                          {drawerSchedule ? `${drawerSchedule.length} ca` : '--'}
                        </p>
                      </div>
                    </div>

                    {/* Danh sách thông tin cá nhân & đào tạo */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                        <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                          Hồ sơ sinh viên
                        </h3>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {[
                          { label: 'Mã sinh viên', value: <IdentifierBadge tone="neutral">{drawerOpenStudent.studentCode}</IdentifierBadge>, icon: UserIcon },
                          { label: 'Họ và tên', value: drawerOpenStudent.fullName, icon: UserIcon },
                          { label: 'Giới tính', value: drawerOpenStudent.gender || 'Nam', icon: UserIcon },
                          {
                            label: 'Ngày sinh',
                            value: drawerOpenStudent.dateOfBirth ? new Date(drawerOpenStudent.dateOfBirth).toLocaleDateString('vi-VN') : '---',
                            icon: Calendar,
                          },
                          { label: 'Lớp sinh hoạt', value: drawerOpenStudent.class?.name || '---', icon: School },
                          { label: 'Email', value: drawerOpenStudent.email || '---', icon: Mail },
                          { label: 'Số điện thoại', value: drawerOpenStudent.phone || '---', icon: Phone },
                        ].map((r, idx) => {
                          const Icon = r.icon;
                          return (
                            <div
                              key={idx}
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
                  </div>
                )}

                {/* --- TAB SUBJECTS --- */}
                {drawerTab === 'subjects' && (
                  <div className="space-y-4">
                    {loadingTab ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    ) : !drawerSubjects || drawerSubjects.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-type-body-sm font-semibold text-slate-500">Sinh viên chưa đăng ký môn học nào.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/60 rounded-xl px-4 py-3 border border-blue-200/80 dark:border-blue-800/60 text-type-body-sm">
                          <span className="font-semibold text-blue-900 dark:text-blue-200">Tổng cộng:</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">
                            {drawerSubjects.length} môn | {drawerSubjects.reduce((acc: number, item: any) => acc + (item.subject?.credits || item.credits || 0), 0)} tín chỉ
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {drawerSubjects.map((item: any, idx: number) => {
                            const sub = item.subject || item;
                            return (
                              <div key={idx} className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-type-body font-semibold text-slate-900 dark:text-white break-words">{sub.subjectName || sub.name}</h4>
                                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                                    <IdentifierBadge tone="neutral">{sub.subjectCode || sub.code}</IdentifierBadge>
                                    <span className="text-type-helper font-semibold text-slate-500">{item.semester} – {item.schoolYear || item.year || ''}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="inline-block px-2.5 py-1 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 ui-pill rounded-full text-type-helper font-medium">
                                    {sub.credits} TC
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* --- TAB SCHEDULE --- */}
                {drawerTab === 'schedule' && (
                  <div className="space-y-4">
                    {loadingTab ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    ) : !drawerSchedule || drawerSchedule.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-type-body-sm font-semibold text-slate-500">Chưa có lịch thi nào cho sinh viên này.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drawerSchedule.map((sched: any, idx: number) => (
                          <div key={idx} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                            <div className="bg-slate-50/90 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-type-helper font-semibold text-slate-800 dark:text-slate-200">
                                  {sched.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : '---'} ({sched.startTime || ''} – {sched.endTime || ''})
                                </span>
                              </div>
                              <span className="px-2.5 py-0.5 ui-pill rounded-full text-type-helper font-medium text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                                {formatExamType(sched.examType)}
                              </span>
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="text-type-body font-semibold text-slate-900 dark:text-white">{sched.subjectName || 'Môn thi'}</h4>
                                <div className="mt-1">
                                  <IdentifierBadge tone="neutral">{sched.subjectCode}</IdentifierBadge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-type-helper pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                  <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>Phòng: <strong className="font-semibold text-slate-900 dark:text-white">{sched.roomName || sched.roomCode}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                  <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>SBD: <strong className="font-semibold text-blue-600">{sched.examNumber || '---'}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>Số ghế: <strong className="font-semibold text-blue-600">{sched.seatNumber || '--'}</strong></span>
                                </div>
                                {sched.periodName && (
                                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
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

              {/* Footer — Nút 40px chuẩn Design token */}
              <div className="border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-end shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={closeDrawer}
                >
                  Đóng
                </Button>
              </div>
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
