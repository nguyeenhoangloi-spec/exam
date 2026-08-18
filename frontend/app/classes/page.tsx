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
import { ClassItem, Department } from '../../types';
import { GraduationCap, Building2, Search, X, Users, ChevronDown, Phone, Mail, BookOpen, FileSpreadsheet, School } from 'lucide-react';

import { ClassHeader } from '../../components/classes/ClassHeader';
import { ClassKPICards } from '../../components/classes/ClassKPICards';
import { ClassFilterPopover } from '../../components/classes/ClassFilterPopover';
import { ClassTableToolbar } from '../../components/classes/ClassTableToolbar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { ClassTable } from '../../components/classes/ClassTable';
import { ClassPaginationBar } from '../../components/classes/ClassPaginationBar';
import { ClassBulkAction } from '../../components/classes/ClassBulkAction';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { ProfileDrawer } from '../../components/ProfileDrawer';

export default function ClassesPage() {
  usePageTitle('Quản lý lớp học');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSizeRange, setSelectedSizeRange] = useState('');
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
        api.get('/classes'),
        api.get('/departments'),
      ]);
      setClasses(resClasses.data || []);
      setDepartments(resDepts.data || []);
      return true;
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách lớp học', type: 'error' });
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
      .filter((c: any) => {
        const matchSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase());
        const matchDept = selectedDeptId ? String(c.departmentId) === selectedDeptId : true;
        
        let matchSize = true;
        const count = c._count?.students ?? c.studentsCount ?? c.students?.length ?? 0;
        if (selectedSizeRange === 'over40') matchSize = count > 40;
        else if (selectedSizeRange === '20to40') matchSize = count >= 20 && count <= 40;
        else if (selectedSizeRange === 'under20') matchSize = count < 20;

        return matchSearch && matchDept && matchSize;
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
  }, [classes, search, selectedDeptId, selectedSizeRange, sortOrder]);

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
      title: 'Xóa lớp học?',
      message: `Bạn có chắc chắn muốn xóa lớp học ${item?.name || ''}? Dữ liệu sẽ được chuyển vào thùng rác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/classes/${id}`);
          setToast({ message: 'Đã chuyển lớp học vào thùng rác thành công!', type: 'success' });
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
                placeholder="Tìm mã, tên lớp..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
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
                  className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-[12px] text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}
            </div>

            {/* 1 Nút Bộ Lọc Duy Nhất Đa Chiều */}
            <ClassFilterPopover
              selectedDeptId={selectedDeptId}
              onDeptChange={(val) => {
                setSelectedDeptId(val);
                setPage(1);
              }}
              selectedSizeRange={selectedSizeRange}
              onSizeRangeChange={(val) => {
                setSelectedSizeRange(val);
                setPage(1);
              }}
              departments={departments}
              classes={classes}
              totalFilteredCount={filteredClasses.length}
              onResetAll={() => {
                setSelectedDeptId('');
                setSelectedSizeRange('');
                setPage(1);
              }}
            />
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <ClassTableToolbar
              totalCount={filteredClasses.length}
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

        {/* Floating Bulk Action Bar */}
        <ClassBulkAction
          selectedCount={selected.length}
          totalCount={filteredClasses.length}
          allSelected={selected.length === filteredClasses.length && filteredClasses.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredClasses.length ? [] : filteredClasses.map((c) => c.id))
          }
          onExportExcel={() => {
            const selectedItems = classes.filter((c) => selected.includes(c.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã lớp', width: 15 },
              { header: 'Tên lớp học', width: 30 },
              { header: 'Khoa trực thuộc', width: 25 },
              { header: 'Sĩ số', width: 12, align: 'center' as const },
            ];
            const rows = selectedItems.map((c, idx) => [
              idx + 1,
              c.code,
              c.name,
              c.department?.name || '',
              c._count?.students ?? 0,
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_lop_hoc_da_chon.xls',
              title: 'DANH SÁCH LỚP HỌC ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} lớp học`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} lớp học ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = classes.filter((c) => selected.includes(c.id));
            printReport({
              title: 'BÁO CÁO DANH SÁCH LỚP HỌC ĐÃ CHỌN',
              subtitle: `Tổng số lớp học được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng đã chọn', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã lớp', width: '90px', align: 'center' },
                { header: 'Tên Lớp học', width: '200px' },
                { header: 'Khoa trực thuộc', width: '180px' },
                { header: 'Sĩ số', width: '80px', align: 'center' },
              ],
              rows: selectedItems.map((c, idx) => [
                idx + 1,
                c.code,
                c.name,
                c.department?.name || '---',
                String(c._count?.students ?? 0),
              ]),
            });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt lớp học?',
              message: `Bạn có chắc chắn muốn xóa ${count} lớp học đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/classes/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setClasses((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} lớp học`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa lớp học', type: 'error' });
                }
              },
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Add/Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Sửa lớp' : 'Thêm lớp'}
        subtitle={editingClass ? `Mã lớp: ${editingClass.code}` : 'Thêm lớp học vào danh mục quản lý'}
        icon={<GraduationCap className="h-6 w-6 text-white" />}
        badge={editingClass ? 'Chỉnh sửa' : 'Tạo mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Mã lớp</label>
            <input
              type="text"
              required
              placeholder="VD: CNTT-K66A"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Tên lớp học</label>
            <input
              type="text"
              required
              placeholder="VD: Công nghệ thông tin K66 - Lớp A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Khoa trực thuộc</label>
            <FilterSelect
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              size="md"
              className="w-full"
            >
              <option value="">-- Chọn Khoa --</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} ({d.code})
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit">
              {editingClass ? 'Lưu thay đổi' : 'Tạo lớp học'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách lớp học từ Excel"
        templateFileName="mau_danh_sach_lop.csv"
        onImportSuccess={() => { void fetchData(); }}
      />

      {/* Class Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerClass)}
        onClose={() => setDrawerClass(null)}
        title={drawerClass?.name || 'Chi tiết Lớp sinh hoạt'}
        subtitle={`Mã lớp: ${drawerClass?.code || ''}`}
        avatarText={drawerClass?.code || 'LH'}
        badge={{
          label: `${(drawerClass as any)?.studentCount ?? drawerClass?._count?.students ?? 0} Sinh viên`,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Mã lớp sinh hoạt', value: drawerClass?.code, icon: School },
          { label: 'Tên lớp học', value: drawerClass?.name, icon: GraduationCap },
          {
            label: 'Khoa trực thuộc',
            value: drawerClass?.department?.name || 'Chưa gán',
            icon: Building2,
          },
          {
            label: 'Sĩ số sinh viên',
            value: `${(drawerClass as any)?.studentCount ?? drawerClass?._count?.students ?? 0} sinh viên`,
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

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
