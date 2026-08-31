'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { Teacher, Department, User } from '../../types';
import { Search, X, GraduationCap, Building2, Mail, Phone, User as UserIcon, ChevronDown, FileSpreadsheet, UserCheck, Info } from 'lucide-react';

import { TeacherHeader } from '../../components/teachers/TeacherHeader';
import { TeacherKPICards } from '../../components/teachers/TeacherKPICards';
import { TeacherFilterPopover } from '../../components/teachers/TeacherFilterPopover';
import { TeacherTableToolbar } from '../../components/teachers/TeacherTableToolbar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { TeacherTable } from '../../components/teachers/TeacherTable';
import { TeacherPaginationBar } from '../../components/teachers/TeacherPaginationBar';
import { TeacherBulkAction } from '../../components/teachers/TeacherBulkAction';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { DetailDrawer } from '../../components/ui/DetailDrawer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageSkeleton } from '../../components/ui/Skeleton';

import { getCachedData } from '../../lib/api';

const DEGREE_OPTIONS = ['GS.TS', 'PGS.TS', 'TS', 'ThS'];

export default function TeachersPage() {
  usePageTitle('Quản lý giảng viên');
  const router = useRouter();

  const cachedTeachers = typeof window !== 'undefined' ? getCachedData<Teacher[]>('/teachers') : null;
  const cachedDepts = typeof window !== 'undefined' ? getCachedData<Department[]>('/departments') : null;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(cachedTeachers || []);
  const [departments, setDepartments] = useState<Department[]>(cachedDepts || []);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(!cachedTeachers);

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
  const [drawerOpenTeacher, setDrawerOpenTeacher] = useState<Teacher | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (drawerTeacher) {
      setDrawerOpenTeacher(drawerTeacher);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrawerVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setDrawerVisible(false);
      const timer = setTimeout(() => {
        setDrawerOpenTeacher(null);
        setDrawerTab('info');
        setDrawerAssignments([]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [drawerTeacher]);

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
    try {
      const [resTeachers, resDepts] = await Promise.all([
        cachedGet('/teachers'),
        cachedGet('/departments'),
      ]);
      setTeachers(resTeachers.data || []);
      setDepartments(resDepts.data || []);
      return true;
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu giảng viên', type: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    invalidateCache('/teachers');
    invalidateCache('/departments');
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
          (t.email && t.email.toLowerCase().includes(search.toLowerCase()));

        const matchDept = !selectedDeptId || String(t.departmentId) === selectedDeptId;

        let matchDegree = true;
        if (selectedDegree) {
          matchDegree = t.degree?.toLowerCase().includes(selectedDegree.toLowerCase()) ?? false;
        }

        let matchStatus = true;
        if (selectedStatus === 'has_dept') {
          matchStatus = Boolean(t.departmentId);
        } else if (selectedStatus === 'no_dept') {
          matchStatus = !t.departmentId;
        }

        return matchSearch && matchDept && matchDegree && matchStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
        if (sortOrder === 'name_desc') return b.fullName.localeCompare(a.fullName, 'vi');
        if (sortOrder === 'code_asc') return a.teacherCode.localeCompare(b.teacherCode);
        return b.id - a.id;
      });
  }, [teachers, search, selectedDeptId, selectedDegree, selectedStatus, sortOrder]);

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
        invalidateCache('/teachers');
        setToast({ message: 'Cập nhật giảng viên thành công!', type: 'success' });
      } else {
        await api.post('/teachers', payload);
        invalidateCache('/teachers');
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
      title: 'Chuyển giảng viên vào thùng rác?',
      message: (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Xóa giảng viên: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{t?.fullName}&rdquo;</span> (#{t?.teacherCode})
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Dữ liệu giảng viên sẽ được chuyển vào thùng rác và có thể khôi phục lại khi cần.
          </p>
        </div>
      ),
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/teachers/${id}`);
          invalidateCache('/teachers');
          setToast({ message: 'Đã chuyển giảng viên vào thùng rác thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message || 'Xóa giảng viên thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  const handleToggleLock = (t: Teacher) => {
    const isLocked = t.user?.status === 'LOCKED';
    setConfirmModal({
      isOpen: true,
      title: isLocked ? 'Mở khóa tài khoản giảng viên?' : 'Khóa tài khoản giảng viên?',
      message: isLocked ? (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Mở khóa tài khoản: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{t.fullName}&rdquo;</span> (#{t.teacherCode})
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Giảng viên sẽ có thể đăng nhập lại vào hệ thống khảo thí bình thường.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Khóa tài khoản: <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{t.fullName}&rdquo;</span> (#{t.teacherCode})
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Giảng viên sẽ tạm thời không thể đăng nhập vào hệ thống cho đến khi được mở khóa.
          </p>
        </div>
      ),
      type: isLocked ? 'info' : 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/teachers/${t.id}/${isLocked ? 'unlock' : 'lock'}`);
          invalidateCache('/teachers');
          setToast({ message: `Đã ${isLocked ? 'mở khóa' : 'khóa'} tài khoản giảng viên thành công!`, type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Thao tác thất bại', type: 'error' });
        }
      },
    });
  };

  const prepareTeacherExportData = () => {
    const columns = [
      { header: 'STT', align: 'center' as const, width: 6 },
      { header: 'Mã GV', align: 'center' as const, width: 14 },
      { header: 'Họ và tên', align: 'left' as const, width: 24 },
      { header: 'Học vị', align: 'center' as const, width: 14 },
      { header: 'Email', align: 'left' as const, width: 26 },
      { header: 'Số điện thoại', align: 'center' as const, width: 16 },
      { header: 'Khoa trực thuộc', align: 'left' as const, width: 22 },
    ];

    const rows = filteredTeachers.map((t, idx) => [
      idx + 1,
      t.teacherCode,
      t.fullName,
      t.degree || 'ThS',
      t.email,
      t.phone || '---',
      t.department?.name || '---',
    ]);

    const metaInfo = [
      { label: 'Tổng số giảng viên', value: String(teachers.length) },
      { label: 'Giảng viên đang lọc', value: String(filteredTeachers.length) },
    ];

    return { columns, rows, metaInfo };
  };

  const exportExcel = async () => {
    const { columns, rows, metaInfo } = prepareTeacherExportData();

    await exportToFormattedExcel({
      filename: `Danh_sach_giang_vien_${new Date().toISOString().slice(0, 10)}.xls`,
      templateCode: 'TEACHER_DIRECTORY',
      title: 'DANH SÁCH GIẢNG VIÊN',
      subtitle: 'Hồ sơ đội ngũ cán bộ giảng viên và phân khoa trực thuộc',
      columns,
      rows,
      metaInfo,
    });
  };

  const handlePrintReport = () => {
    const { columns, rows, metaInfo } = prepareTeacherExportData();

    printReport({
      templateCode: 'TEACHER_DIRECTORY',
      title: 'DANH SÁCH GIẢNG VIÊN',
      subtitle: 'Hồ sơ đội ngũ cán bộ giảng viên và phân khoa trực thuộc',
      metaInfo,
      columns: columns.map((c) => ({
        header: c.header,
        width: typeof c.width === 'number' ? `${c.width * 10}px` : c.width,
        align: c.align,
      })),
      rows,
    });
  };

  if (loading && !teachers.length) {
    return <PageSkeleton hasKPIs={true} variant="table" />;
  }

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen ">
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

        {/* Search & Unified Smart Filter Popover Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã GV, họ tên, email..."
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

              <TeacherFilterPopover
                selectedDeptId={selectedDeptId}
                onDeptChange={(val) => {
                  setSelectedDeptId(val);
                  setPage(1);
                }}
                selectedDegree={selectedDegree}
                onDegreeChange={(val) => {
                  setSelectedDegree(val);
                  setPage(1);
                }}
                selectedStatus={selectedStatus}
                onStatusChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
                departments={departments}
                teachers={teachers}
                totalFilteredCount={filteredTeachers.length}
                onResetAll={() => {
                  setSelectedDeptId('');
                  setSelectedDegree('');
                  setSelectedStatus('');
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <TeacherTableToolbar
              totalCount={filteredTeachers.length}
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
        ) : !paginatedTeachers.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy Giảng viên phù hợp.
          </div>
        ) : (
          <TeacherTable
            teachers={paginatedTeachers}
            selected={selected}
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

        {/* Floating Bulk Action Bar */}
        <TeacherBulkAction
          selectedCount={selected.length}
          totalCount={filteredTeachers.length}
          allSelected={selected.length === filteredTeachers.length && filteredTeachers.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredTeachers.length ? [] : filteredTeachers.map((t) => t.id))
          }
          onExportExcel={() => {
            const selectedItems = teachers.filter((t) => selected.includes(t.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã GV', align: 'center' as const, width: 16 },
              { header: 'Họ và tên', align: 'left' as const, width: 25 },
              { header: 'Học vị', align: 'center' as const, width: 14 },
              { header: 'Email', align: 'left' as const, width: 28 },
              { header: 'Số điện thoại', align: 'center' as const, width: 16 },
              { header: 'Khoa trực thuộc', align: 'left' as const, width: 24 },
            ];
            const rows = selectedItems.map((t, idx) => [
              idx + 1,
              t.teacherCode,
              t.fullName,
              t.degree || 'TS',
              t.email,
              t.phone || '',
              t.department?.name || '',
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_giang_vien_da_chon.xls',
              title: 'DANH SÁCH GIẢNG VIÊN ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} giảng viên`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} giảng viên ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = teachers.filter((t) => selected.includes(t.id));
            printReport({
              title: 'BÁO CÁO DANH SÁCH GIẢNG VIÊN ĐÃ CHỌN',
              subtitle: `Tổng số giảng viên được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng đã chọn', value: String(selectedItems.length) },
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
              rows: selectedItems.map((t, idx) => [
                idx + 1,
                t.teacherCode,
                t.fullName,
                t.degree || 'TS',
                t.department?.name || '---',
                t.email,
                t.phone || '---',
              ]),
            });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt giảng viên?',
              message: `Bạn có chắc chắn muốn xóa ${count} giảng viên đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/teachers/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setTeachers((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} giảng viên`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa giảng viên', type: 'error' });
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
        title={editingTeacher ? 'Sửa giảng viên' : 'Thêm giảng viên'}
        subtitle={editingTeacher ? `Mã cán bộ: ${editingTeacher.teacherCode}` : 'Cấu hình thông tin cá nhân và học vị'}
        icon={<UserCheck className="h-6 w-6 text-white" />}
        badge={editingTeacher ? 'Chỉnh sửa' : 'Tạo mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Mã giảng viên</label>
              <input
                type="text"
                required
                value={formData.teacherCode}
                onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Học vị / Học hàm</label>
              <FilterSelect
                containerClassName="w-full"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-type-body font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </FilterSelect>
            </div>
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

          <div>
            <label className="block text-type-body font-medium text-slate-500 mb-1">Khoa trực thuộc</label>
            <FilterSelect
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-type-body font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="">-- Chọn Khoa --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </FilterSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-type-body font-medium text-slate-500 mb-1">Email Công vụ</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-type-body focus:border-blue-500 focus:outline-none"
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {!editingTeacher ? (
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
        title="Nhập danh sách giảng viên"
        templateFileName="danh_sach_giang_vien_mau.csv"
        entityLabel="giảng viên"
        templateContent={'teacherCode,fullName,email,departmentId,degree,phone\nGV2026001,Nguyễn Văn Mẫu,mau@example.edu.vn,1,ThS,0900000000'}
        onImportRows={async (row) => {
          await api.post('/teachers', {
            teacherCode: row.teacherCode || row.code,
            fullName: row.fullName || row.name,
            degree: row.degree || 'ThS',
            email: row.email,
            phone: row.phone || undefined,
            departmentId: Number(row.departmentId || row.department),
          });
        }}
        onImportSuccess={(data: any[]) => {
          invalidateCache('/teachers');
          setToast({ message: `Đã nhập thành công ${data.length} giảng viên từ CSV!`, type: 'success' });
          fetchData();
        }}
      />

      {/* Custom Profile Drawer with 3 Tabs — Chuẩn Design System & Hoạt ảnh 60 FPS */}
      <DetailDrawer
        isOpen={Boolean(drawerTeacher)}
        onClose={() => setDrawerTeacher(null)}
        title={drawerTeacher?.fullName || ''}
        subtitle={
          drawerTeacher?.department?.name
            ? `Khoa ${drawerTeacher.department.name.replace(/^Khoa\s+/i, '')}`
            : 'Chưa phân khoa'
        }
        badge={
          drawerTeacher?.teacherCode ? (
            <IdentifierBadge tone="neutral" title="Mã cán bộ">
              {drawerTeacher.teacherCode}
            </IdentifierBadge>
          ) : undefined
        }
        avatarText={drawerTeacher?.fullName || 'GV'}
        maxWidth="md"
        tabs={[
          { id: 'info', label: 'Hồ sơ', icon: UserIcon },
          { id: 'assignments', label: 'Lịch coi thi', icon: GraduationCap },
          { id: 'department', label: 'Khoa', icon: Building2 },
        ]}
        activeTab={drawerTab}
        onTabChange={(tabId) => setDrawerTab(tabId as any)}
        footer={
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setDrawerTeacher(null)}
            >
              Đóng
            </Button>
          </div>
        }
      >
        {/* --- TAB INFO --- */}
        {drawerTab === 'info' && drawerTeacher && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                  Thông tin giảng viên
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  { label: 'Mã cán bộ', value: <IdentifierBadge tone="neutral">{drawerTeacher.teacherCode}</IdentifierBadge>, icon: UserIcon },
                  { label: 'Học vị / Học hàm', value: drawerTeacher.degree || 'Thạc sĩ / Tiến sĩ', icon: GraduationCap },
                  { label: 'Khoa trực thuộc', value: drawerTeacher.department?.name || '---', icon: Building2 },
                  { label: 'Email công vụ', value: drawerTeacher.email, icon: Mail },
                  { label: 'Số điện thoại', value: drawerTeacher.phone || '---', icon: Phone },
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

        {/* --- TAB ASSIGNMENTS --- */}
        {drawerTab === 'assignments' && (
          <div className="space-y-4">
            {loadingAssignments ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : drawerAssignments.length === 0 ? (
              <div className="text-center py-12">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-type-body">Không có lịch phân công coi thi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drawerAssignments.map((assignment: any, index: number) => {
                  const sched = assignment.examScheduleRoom?.examSchedule;
                  const room = assignment.examScheduleRoom?.room;
                  const subject = sched?.subject;
                  return (
                    <div key={index} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:border-blue-300 transition-colors space-y-2.5">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-type-body">
                            {subject?.subjectName || 'Môn thi'}
                          </h4>
                          {subject?.subjectCode && (
                            <div className="mt-1">
                              <IdentifierBadge tone="neutral">{subject.subjectCode}</IdentifierBadge>
                            </div>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 ui-pill rounded-full text-type-helper font-medium shrink-0 ${assignment.role === 'CHINH' || assignment.role === 'SUPERVISOR_1'
                          ? 'bg-blue-50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60'
                          : 'bg-slate-100 text-slate-700 dark:text-slate-300'
                          }`}>
                          {assignment.role === 'CHINH' || assignment.role === 'SUPERVISOR_1' ? 'Giám thị chính' : 'Giám thị phụ'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-type-helper text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phòng thi:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{room?.roomName || room?.roomCode || '---'} {room?.building ? `(${room.building})` : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ngày thi:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {sched?.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : '---'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thời gian:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {sched?.startTime && sched?.endTime ? `${sched.startTime} - ${sched.endTime}` : '---'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Trạng thái:</span>
                          <StatusBadge status={assignment.status || 'CONFIRMED'} customLabel={assignment.status === 'CONFIRMED' ? 'Đã xác nhận' : assignment.status === 'CHANGE_REQUESTED' ? 'Đề nghị thay đổi' : assignment.status || 'Đã phân công'} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB DEPARTMENT --- */}
        {drawerTab === 'department' && drawerTeacher && (
          <div className="rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-type-card font-semibold text-slate-900 dark:text-white">{drawerTeacher.department?.name || 'Chưa phân khoa'}</h3>
            <div className="pt-1">
              <IdentifierBadge tone="neutral">{drawerTeacher.department?.code || 'N/A'}</IdentifierBadge>
            </div>
          </div>
        )}
      </DetailDrawer>

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
