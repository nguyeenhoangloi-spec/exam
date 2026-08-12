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
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { ExamPeriod } from '../../types';
import { Calendar, Clock, Search, X, ChevronDown, FileSpreadsheet } from 'lucide-react';

import { ExamPeriodHeader } from '../../components/exam-periods/ExamPeriodHeader';
import { ExamPeriodKPICards } from '../../components/exam-periods/ExamPeriodKPICards';
import { ExamPeriodTableToolbar } from '../../components/exam-periods/ExamPeriodTableToolbar';
import { ExamPeriodTable, computePeriodStatus } from '../../components/exam-periods/ExamPeriodTable';
import { ExamPeriodPaginationBar } from '../../components/exam-periods/ExamPeriodPaginationBar';
import { FilterSelect } from '../../components/ui/FilterSelect';

export default function ExamPeriodsPage() {

  usePageTitle('Quản lý kỳ thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    semester: true,
    schoolYear: true,
    dateRange: true,
    status: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerPeriod, setDrawerPeriod] = useState<ExamPeriod | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ExamPeriod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    semester: 'HK1',
    schoolYear: '2025-2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'UPCOMING',
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
      const res = await api.get('/exam-periods');
      if (res.data && Array.isArray(res.data)) {
        setPeriods(res.data);
      } else {
        setPeriods([]);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách kỳ thi', type: 'error' });
      setPeriods([]);
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

  // Compute DYNAMIC KPI metrics directly from real API data using real-time status
  const kpiData = useMemo(() => {
    const total = periods.length;
    const upcoming = periods.filter((p) => computePeriodStatus(p) === 'UPCOMING').length;
    const ongoing = periods.filter((p) => computePeriodStatus(p) === 'ONGOING').length;
    const completed = periods.filter((p) => computePeriodStatus(p) === 'COMPLETED').length;
    const cancelled = periods.filter((p) => computePeriodStatus(p) === 'CANCELLED').length;
    return { total, upcoming, ongoing, completed, cancelled };
  }, [periods]);

  // Available School Years & Semesters for Filter Options
  const schoolYearsList = useMemo(() => {
    const setY = new Set<string>();
    periods.forEach((p) => {
      if (p.schoolYear) setY.add(p.schoolYear);
    });
    return Array.from(setY);
  }, [periods]);

  // Filter & Sort Periods
  const filteredPeriods = useMemo(() => {
    return periods
      .filter((p) => {
        const matchSearch =
          (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.semester || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.schoolYear || '').toLowerCase().includes(search.toLowerCase());
        const matchSemester = selectedSemester ? p.semester === selectedSemester : true;
        const matchYear = selectedSchoolYear ? p.schoolYear === selectedSchoolYear : true;
        const matchStatus = selectedStatus ? computePeriodStatus(p) === selectedStatus : true;
        return matchSearch && matchSemester && matchYear && matchStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'date_desc') {
          return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
        }
        if (sortOrder === 'date_asc') {
          return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
        }
        return b.id - a.id;
      });
  }, [periods, search, selectedSemester, selectedSchoolYear, selectedStatus, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredPeriods.length / limit));
  const paginatedPeriods = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPeriods.slice(start, start + limit);
  }, [filteredPeriods, page, limit]);

  const openAddModal = () => {
    setEditingPeriod(null);
    setFormData({
      name: '',
      semester: 'HK1',
      schoolYear: '2025-2026',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'UPCOMING',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: ExamPeriod) => {
    setEditingPeriod(p);
    setFormData({
      name: p.name,
      semester: p.semester,
      schoolYear: p.schoolYear,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      status: p.status || 'UPCOMING',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await api.patch(`/exam-periods/${editingPeriod.id}`, formData);
        setToast({ message: 'Cập nhật kỳ thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-periods', formData);
        setToast({ message: 'Thêm kỳ thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi lưu dữ liệu kỳ thi', type: 'error' });
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id: number) => {
    const item = periods.find((p) => p.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa kỳ thi',
      message: `Bạn có chắc chắn muốn xóa kỳ thi ${item?.name || ''}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-periods/${id}`);
          setToast({ message: 'Đã xóa kỳ thi thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || err?.message || 'Không thể xóa kỳ thi vì đang có dữ liệu liên quan.', type: 'error' });
        }
      },
    });
  };

  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Tên kỳ thi', width: 30 },
      { header: 'Học kỳ', width: 12, align: 'center' as const },
      { header: 'Năm học', width: 15, align: 'center' as const },
      { header: 'Ngày bắt đầu', width: 15, align: 'center' as const },
      { header: 'Ngày kết thúc', width: 15, align: 'center' as const },
      { header: 'Trạng thái', width: 15, align: 'center' as const },
    ];

    const rows = filteredPeriods.map((p, idx) => [
      idx + 1,
      p.name,
      p.semester,
      p.schoolYear,
      p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '',
      p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '',
      p.status === 'COMPLETED' ? 'Đã hoàn thành' : p.status === 'ONGOING' ? 'Đang diễn ra' : 'Sắp diễn ra',
    ]);

    exportToFormattedExcel({
      filename: 'Danh_sach_ky_thi.xls',
      title: 'DANH SÁCH KỲ THI HỆ THỐNG',
      subtitle: 'Trích xuất dữ liệu danh mục kỳ thi',
      columns,
      rows,
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH KỲ THI',
      subtitle: 'Danh sách tổng hợp các kỳ thi',
      metaInfo: [
        { label: 'Tổng số kỳ thi', value: String(periods.length) },
        { label: 'Sắp diễn ra', value: String(kpiData.upcoming) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Tên Kỳ thi', width: '220px' },
        { header: 'Học kỳ', width: '80px', align: 'center' },
        { header: 'Năm học', width: '100px', align: 'center' },
        { header: 'Thời gian', width: '160px', align: 'center' },
        { header: 'Trạng thái', width: '110px', align: 'center' },
      ],
      rows: filteredPeriods.map((p, idx) => [
        idx + 1,
        p.name,
        p.semester,
        p.schoolYear,
        `${p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : ''} - ${p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : ''}`,
        p.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Sắp diễn ra',
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <ExamPeriodHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <ExamPeriodKPICards
          total={kpiData.total}
          upcoming={kpiData.upcoming}
          ongoing={kpiData.ongoing}
          completed={kpiData.completed}
          cancelled={kpiData.cancelled}
        />

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên kỳ thi, học kỳ, năm học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 h-9 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
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

          <div className="flex flex-wrap items-center gap-3">
            {/* Học kỳ */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Học kỳ:</span>
              <FilterSelect
                size="sm"
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả học kỳ</option>
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
                <option value="HK3">Học kỳ Hè</option>
              </FilterSelect>
            </div>

            {/* Năm học */}
            {schoolYearsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Năm học:</span>
                <FilterSelect
                  size="sm"
                  value={selectedSchoolYear}
                  onChange={(e) => {
                    setSelectedSchoolYear(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả năm học</option>
                  {schoolYearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </FilterSelect>
              </div>
            )}

            {/* Trạng thái */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
              <FilterSelect
                size="sm"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="ONGOING">Đang diễn ra</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </FilterSelect>
            </div>
          </div>

        </div>

        {/* Dynamic Table Action Toolbar */}
        <ExamPeriodTableToolbar
          totalCount={filteredPeriods.length}
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
        ) : !paginatedPeriods.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy kỳ thi phù hợp.
          </div>
        ) : (
          <ExamPeriodTable
            periods={paginatedPeriods}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedPeriods.map((p) => p.id) : [])
            }
            onDetail={setDrawerPeriod}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <ExamPeriodPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredPeriods.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      </main>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPeriod ? 'Chỉnh sửa kỳ thi' : 'Tạo kỳ thi mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[15px] font-semibold text-slate-500 mb-1">Tên kỳ thi</label>
            <input
              type="text"
              required
              placeholder="VD: Kỳ thi học kỳ 1 năm học 2025-2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-semibold text-slate-500 mb-1">Học kỳ</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
                <option value="HK3">Học kỳ Hè</option>
              </select>
            </div>
            <div>
              <label className="block text-[15px] font-semibold text-slate-500 mb-1">Năm học</label>
              <input
                type="text"
                required
                placeholder="VD: 2025-2026"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-semibold text-slate-500 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[15px] font-semibold text-slate-500 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {!editingPeriod ? (
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
              <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" size="md" type="submit">
                {editingPeriod ? 'Cập nhật kỳ thi' : 'Lưu kỳ thi'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import danh sách kỳ thi từ Excel"
        templateFileName="danh_sach_ky_thi_mau.csv"
        onImportSuccess={async () => {
          await fetchData();
          setToast({ message: 'Nhập danh sách kỳ thi từ file thành công!', type: 'success' });
        }}
      />

      {/* Period Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerPeriod)}
        onClose={() => setDrawerPeriod(null)}
        title={drawerPeriod?.name || 'Chi tiết kỳ thi'}
        subtitle={`Học kỳ: ${drawerPeriod?.semester || ''} | Năm học: ${drawerPeriod?.schoolYear || ''}`}
        avatarText={drawerPeriod?.semester || 'KT'}
        badge={{
          label: drawerPeriod?.status === 'COMPLETED' ? 'Đã hoàn thành' : drawerPeriod?.status === 'ONGOING' ? 'Đang diễn ra' : 'Sắp diễn ra',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Tên kỳ thi', value: drawerPeriod?.name, icon: Calendar },
          { label: 'Học kỳ', value: drawerPeriod?.semester },
          { label: 'Năm học', value: drawerPeriod?.schoolYear },
          {
            label: 'Thời gian bắt đầu',
            value: drawerPeriod?.startDate ? new Date(drawerPeriod.startDate).toLocaleDateString('vi-VN') : '---',
            icon: Clock,
          },
          {
            label: 'Thời gian kết thúc',
            value: drawerPeriod?.endDate ? new Date(drawerPeriod.endDate).toLocaleDateString('vi-VN') : '---',
            icon: Clock,
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
