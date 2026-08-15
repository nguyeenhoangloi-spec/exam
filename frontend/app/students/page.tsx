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
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';

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
    onConfirm: () => { },
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

  const handleRefresh = async () => {
    await fetchData();
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
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
        setToast({ message: 'Cập nhật sinh viên thành công!', type: 'success' });
      } else {
        await api.post('/students', payload);
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
      title: 'Xóa sinh viên',
      message: `Bạn có chắc chắn muốn xóa sinh viên ${s?.fullName || ''} (${s?.studentCode || ''})? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/students/${id}`);
          setToast({ message: 'Đã xóa sinh viên thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message || 'Xóa sinh viên thất bại. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  const handleToggleLock = (s: Student) => {
    const isLocked = s.user?.status === 'LOCKED';
    const actionText = isLocked ? 'Mở khóa đăng nhập' : 'Khóa đăng nhập';
    setConfirmModal({
      isOpen: true,
      title: `${actionText} tài khoản sinh viên`,
      message: isLocked
        ? `Bạn có chắc chắn muốn MỞ KHÓA tài khoản cho sinh viên "${s.fullName}" (${s.studentCode})? Sinh viên sẽ có thể đăng nhập lại hệ thống.`
        : `Bạn có chắc chắn muốn KHÓA ĐĂNG NHẬP tài khoản sinh viên "${s.fullName}" (${s.studentCode})? Sinh viên sẽ KHÔNG THỂ ĐĂNG NHẬP vào hệ thống nữa!`,
      type: isLocked ? 'info' : 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/students/${s.id}/${isLocked ? 'unlock' : 'lock'}`);
          setToast({ message: `Đã ${isLocked ? 'mở khóa' : 'khóa'} tài khoản sinh viên thành công!`, type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || 'Thao tác thất bại', type: 'error' });
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
      title: 'BÁO CÁO DANH SÁCH SINH VIÊN',
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
          {/* Left: Search input + 1 Unified Filter Button */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* Search Input Field */}
            <div className="relative flex-1 min-w-[240px]">
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

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <StudentTableToolbar
              totalCount={filteredStudents.length}
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
        ) : !paginatedStudents.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
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
      </main>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Chỉnh sửa hồ sơ sinh viên' : 'Thêm sinh viên mới'}
        subtitle={editingStudent ? `MSSV: ${editingStudent.studentCode}` : 'Nhập thông tin cá nhân và xếp lớp đào tạo cho sinh viên'}
        icon={<UserIcon className="h-6 w-6 text-white" />}
        badge={editingStudent ? 'Chỉnh sửa' : 'Tạo mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Mã sinh viên</label>
            <input
              type="text"
              required
              value={formData.studentCode}
              onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Giới tính</label>
              <FilterSelect
                containerClassName="w-full"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </FilterSelect>
            </div>
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Lớp học</label>
              <FilterSelect
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-normal focus:border-blue-500 focus:outline-none cursor-pointer"
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
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Email Sinh viên</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none"
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
            {!editingStudent ? (
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
        title="Nhập Danh sách Sinh viên từ Excel"
        templateFileName="danh_sach_sinh_vien_mau.csv"
        onImportSuccess={(data: any[]) => {
          setToast({ message: `Đã nhập thành công ${data.length} sinh viên từ file Excel!`, type: 'success' });
          fetchData();
        }}
      />

      {/* CUSTOM DRAWER: 3 TABS */}
      {drawerStudent && (
        <div role="dialog" aria-modal="true" aria-label="Thông tin sinh viên" className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* Header - Modern Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 text-white shrink-0 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 font-semibold text-base text-white border border-white/20 shadow-xs">
                    {drawerStudent.fullName.trim().split(' ').pop()?.charAt(0).toUpperCase() || 'SV'}
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <h2 className="text-[18px] font-semibold leading-snug text-white line-clamp-2 break-words">
                      {drawerStudent.fullName}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <IdentifierBadge tone="inverse">MSSV: {drawerStudent.studentCode}</IdentifierBadge>
                      <span className="text-[13px] font-semibold text-blue-100/90">Lớp: {drawerStudent.class?.name || 'Chưa xếp lớp'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerStudent(null)}
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
                    className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-[15px] font-medium transition cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              {drawerTab === 'info' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">Mã sinh viên</span>
                        <IdentifierBadge tone="neutral">{drawerStudent.studentCode}</IdentifierBadge>
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
                    <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Thông tin học tập</h3>
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
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl border border-blue-100 p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-xs font-semibold ">Môn đăng ký</span>
                      </div>
                      <p className="edu-kpi text-blue-900">
                        {drawerSubjects ? drawerSubjects.length : '--'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-100 p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-semibold ">Lịch thi</span>
                      </div>
                      <p className="edu-kpi text-blue-900">
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
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : !drawerSubjects || drawerSubjects.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                      <BookOpen className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600">Sinh viên chưa đăng ký môn nào</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 text-sm">
                        <span className="font-semibold text-blue-900">Tổng quan:</span>
                        <span className="font-semibold text-blue-700">
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
                                <h4 className="text-sm font-semibold text-slate-800">{sub.subjectName || sub.name}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Mã môn: <IdentifierBadge tone="neutral">{sub.subjectCode || sub.code}</IdentifierBadge></p>
                                {sub.department?.name && (
                                  <p className="text-xs text-slate-400 mt-0.5">{sub.department.name}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold">
                                  {sub.credits} TC
                                </span>
                                <p className="text-[12px] font-semibold text-slate-400 mt-1 ">{item.semester} • {item.schoolYear || item.year || ''}</p>
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
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : !drawerSchedule || drawerSchedule.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                      <Clock className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600">Chưa có lịch thi nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {drawerSchedule.map((sched: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hover:border-blue-300 transition-colors">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-slate-700">
                                {sched.examDate ? new Date(sched.examDate).toLocaleDateString('vi-VN') : '---'} • {sched.startTime || ''} - {sched.endTime || ''}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[12px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {formatExamType(sched.examType)}
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">{sched.subjectName || 'Môn thi'}</h4>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">Mã môn: <IdentifierBadge tone="neutral">{sched.subjectCode}</IdentifierBadge></p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>Phòng: {sched.roomName || <IdentifierBadge tone="neutral">{sched.roomCode}</IdentifierBadge>} ({sched.building})</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>SBD: <IdentifierBadge tone="neutral">{sched.examNumber || '---'}</IdentifierBadge></span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>Số ghế: <span className="font-semibold text-blue-600">{sched.seatNumber || '--'}</span></span>
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
