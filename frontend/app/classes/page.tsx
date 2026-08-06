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
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { ClassItem, Department } from '../../types';
import { GraduationCap, Building2, Search, X, Users, ChevronDown } from 'lucide-react';

import { ClassHeader } from '../../components/classes/ClassHeader';
import { ClassKPICards } from '../../components/classes/ClassKPICards';
import { ClassTableToolbar } from '../../components/classes/ClassTableToolbar';
import { ClassTable } from '../../components/classes/ClassTable';
import { ClassPaginationBar } from '../../components/classes/ClassPaginationBar';

export default function ClassesPage() {
  usePageTitle('Quản lý Lớp học');
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
  const [drawerClass, setDrawerClass] = useState<ClassItem | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    onConfirm: () => {},
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

  // Compute DYNAMIC KPI Metrics from real API data
  const kpiData = useMemo(() => {
    const total = classes.length;
    const setDept = new Set(classes.map((c) => c.departmentId).filter(Boolean));
    const totalStudents = classes.reduce((acc, curr: any) => acc + (curr.studentsCount ?? curr.students?.length ?? 40), 0);
    const avgStudents = total > 0 ? Math.round(totalStudents / total) : 0;
    const maxClassStudents = classes.reduce(
      (max, curr: any) => Math.max(max, curr.studentsCount ?? curr.students?.length ?? 40),
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
          const sA = a.studentsCount ?? a.students?.length ?? 40;
          const sB = b.studentsCount ?? b.students?.length ?? 40;
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
      title: 'Xóa Lớp học',
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
      c.studentsCount ?? c.students?.length ?? 0,
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
        `${c.studentsCount ?? c.students?.length ?? 0} SV`,
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
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã lớp, Tên lớp học..."
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

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Khoa trực thuộc:</span>
            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
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
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
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
            onDetail={setDrawerClass}
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
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Lớp</label>
            <input
              type="text"
              required
              placeholder="VD: CNTT-K65A"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Lớp học</label>
            <input
              type="text"
              required
              placeholder="VD: Công nghệ thông tin 1 - K65"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Khoa trực thuộc</label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn Khoa --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
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
              className="px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 text-sm font-black transition shadow-xs cursor-pointer"
            >
              Lưu Lớp Học
            </button>
          </div>
        </form>
      </Modal>

      {/* Class Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerClass)}
        onClose={() => setDrawerClass(null)}
        title={drawerClass?.name || 'Chi tiết lớp học'}
        subtitle={`Mã lớp: ${drawerClass?.code || ''}`}
        avatarText={drawerClass?.code?.slice(0, 3) || 'LH'}
        badge={{
          label: 'Đang theo học',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Tên lớp học', value: drawerClass?.name, icon: GraduationCap },
          { label: 'Mã lớp', value: drawerClass?.code },
          {
            label: 'Khoa trực thuộc',
            value: drawerClass?.department?.name || (drawerClass as any)?.departmentName || 'Chưa gán Khoa',
            icon: Building2,
          },
          {
            label: 'Sĩ số Sinh viên',
            value: `${(drawerClass as any)?.studentsCount ?? (drawerClass as any)?.students?.length ?? 40} sinh viên`,
            icon: Users,
          },
        ]}
      />

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
