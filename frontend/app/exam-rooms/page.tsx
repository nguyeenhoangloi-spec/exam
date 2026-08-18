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
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { Button } from '../../components/ui/Button';
import { ExamRoom } from '../../types';
import { DoorOpen, Monitor, Users, Building, Search, X, ChevronDown, FileSpreadsheet } from 'lucide-react';

import { ExamRoomHeader } from '../../components/exam-rooms/ExamRoomHeader';
import { ExamRoomKPICards } from '../../components/exam-rooms/ExamRoomKPICards';
import { ExamRoomFilterPopover } from '../../components/exam-rooms/ExamRoomFilterPopover';
import { ExamRoomTableToolbar } from '../../components/exam-rooms/ExamRoomTableToolbar';
import { ExamRoomTable } from '../../components/exam-rooms/ExamRoomTable';
import { ExamRoomPaginationBar } from '../../components/exam-rooms/ExamRoomPaginationBar';
import { ExamRoomBulkAction } from '../../components/exam-rooms/ExamRoomBulkAction';
import { FilterSelect } from '../../components/ui/FilterSelect';

export default function ExamRoomsPage() {
  usePageTitle('Quản lý phòng thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCapacityRange, setSelectedCapacityRange] = useState('');
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
    capacity: true,
    building: true,
    roomType: true,
    status: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerRoom, setDrawerRoom] = useState<ExamRoom | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    capacity: '40',
    location: 'Tòa A',
    roomType: 'COMPUTER_LAB',
    status: 'AVAILABLE',
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
      const res = await api.get('/exam-rooms');
      if (res.data && Array.isArray(res.data)) {
        setRooms(res.data);
      } else {
        setRooms([]);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách phòng thi', type: 'error' });
      setRooms([]);
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

  // Compute DYNAMIC KPI metrics directly from real API data
  const kpiData = useMemo(() => {
    const total = rooms.length;
    const labCount = rooms.filter((r) => r.roomType === 'COMPUTER_LAB').length;
    const theoryCount = rooms.filter((r) => r.roomType === 'THEORY' || r.roomType === 'THEORY_ROOM' || r.roomType !== 'COMPUTER_LAB').length;
    const totalCapacity = rooms.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
    const setB = new Set<string>();
    rooms.forEach((r) => {
      const b = r.building || r.location;
      if (b) setB.add(b);
    });
    return { total, labCount, theoryCount, totalCapacity, activeBuildingCount: setB.size };
  }, [rooms]);

  // Filter & Sort Rooms
  const filteredRooms = useMemo(() => {
    return rooms
      .filter((r) => {
        const rName = r.roomName || r.name || '';
        const rCode = r.roomCode || r.code || '';
        const rLoc = r.building || r.location || '';
        const matchSearch =
          rName.toLowerCase().includes(search.toLowerCase()) ||
          rCode.toLowerCase().includes(search.toLowerCase()) ||
          rLoc.toLowerCase().includes(search.toLowerCase());
        const matchType = selectedType ? r.roomType === selectedType : true;
        const matchBuilding = selectedBuilding ? (r.building || r.location) === selectedBuilding : true;
        
        let matchCapacity = true;
        const cap = Number(r.capacity) || 40;
        if (selectedCapacityRange === 'under30') matchCapacity = cap < 30;
        else if (selectedCapacityRange === '30to50') matchCapacity = cap >= 30 && cap <= 50;
        else if (selectedCapacityRange === 'over50') matchCapacity = cap > 50;

        return matchSearch && matchType && matchBuilding && matchCapacity;
      })
      .sort((a, b) => {
        if (sortOrder === 'capacity_desc') return (b.capacity || 0) - (a.capacity || 0);
        if (sortOrder === 'capacity_asc') return (a.capacity || 0) - (b.capacity || 0);
        if (sortOrder === 'oldest') return a.id - b.id;
        return b.id - a.id;
      });
  }, [rooms, search, selectedType, selectedBuilding, selectedCapacityRange, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / limit));
  const paginatedRooms = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRooms.slice(start, start + limit);
  }, [filteredRooms, page, limit]);

  // Available Buildings for Filter Select
  const buildingList = useMemo(() => {
    const setB = new Set<string>();
    rooms.forEach((r) => {
      const b = r.building || r.location;
      if (b) setB.add(b);
    });
    return Array.from(setB);
  }, [rooms]);

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      code: '',
      name: '',
      capacity: '40',
      location: 'Tòa A',
      roomType: 'COMPUTER_LAB',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (r: ExamRoom) => {
    setEditingRoom(r);
    setFormData({
      code: r.roomCode || r.code || '',
      name: r.roomName || r.name || '',
      capacity: String(r.capacity ?? 40),
      location: r.building || r.location || '',
      roomType: r.roomType || 'COMPUTER_LAB',
      status: r.status || 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code,
        roomCode: formData.code,
        name: formData.name,
        roomName: formData.name,
        capacity: Number(formData.capacity),
        building: formData.location,
        location: formData.location,
        roomType: formData.roomType,
        status: formData.status,
      };

      if (editingRoom) {
        await api.patch(`/exam-rooms/${editingRoom.id}`, payload);
        setToast({ message: 'Cập nhật phòng thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-rooms', payload);
        setToast({ message: 'Thêm phòng thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi lưu dữ liệu phòng thi', type: 'error' });
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id: number) => {
    const item = rooms.find((r) => r.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa phòng thi?',
      message: `Bạn có chắc chắn muốn xóa phòng thi ${item?.roomName || item?.name || ''}? Dữ liệu sẽ được chuyển vào thùng rác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-rooms/${id}`);
          setToast({ message: 'Đã chuyển phòng thi vào thùng rác thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err?.response?.data?.message || err?.message || 'Không thể xóa phòng thi vì phòng đang được sử dụng.', type: 'error' });
        }
      },
    });
  };

  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Mã phòng', width: 15 },
      { header: 'Tên phòng thi', width: 25 },
      { header: 'Sức chứa', width: 12, align: 'center' as const },
      { header: 'Vị trí / Tòa nhà', width: 20 },
      { header: 'Loại phòng', width: 20, align: 'center' as const },
      { header: 'Trạng thái', width: 15, align: 'center' as const },
    ];

    const rows = filteredRooms.map((r, idx) => [
      idx + 1,
      r.roomCode || r.code || '',
      r.roomName || r.name || '',
      r.capacity ?? 0,
      r.building || r.location || '',
      r.roomType === 'COMPUTER_LAB' ? 'Phòng máy tính' : 'Phòng lý thuyết',
      r.status === 'MAINTENANCE' ? 'Bảo trì' : 'Sẵn sàng',
    ]);

    exportToFormattedExcel({
      filename: 'Danh_sach_phong_thi.xls',
      title: 'DANH SÁCH PHÒNG THI',
      subtitle: 'Trích xuất dữ liệu danh mục phòng thi',
      columns,
      rows,
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH PHÒNG THI',
      subtitle: 'Danh sách phòng thi và sức chứa máy tính',
      metaInfo: [
        { label: 'Tổng số phòng', value: String(rooms.length) },
        { label: 'Tổng sức chứa', value: `${kpiData.totalCapacity} chỗ` },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã Phòng', width: '100px' },
        { header: 'Tên phòng thi', width: '200px' },
        { header: 'Sức chứa', width: '90px', align: 'center' },
        { header: 'Tòa nhà', width: '100px', align: 'center' },
        { header: 'Loại phòng', width: '120px', align: 'center' },
      ],
      rows: filteredRooms.map((r, idx) => [
        idx + 1,
        r.roomCode || r.code || '',
        r.roomName || r.name || '',
        `${r.capacity ?? 0} chỗ`,
        r.building || r.location || '',
        r.roomType === 'COMPUTER_LAB' ? 'Phòng máy' : 'Phòng lý thuyết',
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <ExamRoomHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <ExamRoomKPICards
          total={kpiData.total}
          labCount={kpiData.labCount}
          theoryCount={kpiData.theoryCount}
          totalCapacity={kpiData.totalCapacity}
          activeBuildingCount={kpiData.activeBuildingCount}
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
                placeholder="Tìm theo mã phòng, tên phòng, tòa nhà..."
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
            <ExamRoomFilterPopover
              selectedType={selectedType}
              onTypeChange={(val) => {
                setSelectedType(val);
                setPage(1);
              }}
              selectedBuilding={selectedBuilding}
              onBuildingChange={(val) => {
                setSelectedBuilding(val);
                setPage(1);
              }}
              selectedCapacityRange={selectedCapacityRange}
              onCapacityRangeChange={(val) => {
                setSelectedCapacityRange(val);
                setPage(1);
              }}
              buildingList={buildingList}
              rooms={rooms}
              totalFilteredCount={filteredRooms.length}
              onResetAll={() => {
                setSelectedType('');
                setSelectedBuilding('');
                setSelectedCapacityRange('');
                setPage(1);
              }}
            />
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <ExamRoomTableToolbar
              totalCount={filteredRooms.length}
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
        ) : !paginatedRooms.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy phòng thi phù hợp.
          </div>
        ) : (
          <ExamRoomTable
            rooms={paginatedRooms}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedRooms.map((r) => r.id) : [])
            }
            onDetail={setDrawerRoom}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <ExamRoomPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredRooms.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />

        {/* Floating Bulk Action Bar */}
        <ExamRoomBulkAction
          selectedCount={selected.length}
          totalCount={filteredRooms.length}
          allSelected={selected.length === filteredRooms.length && filteredRooms.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredRooms.length ? [] : filteredRooms.map((r) => r.id))
          }
          onExportExcel={() => {
            const selectedItems = rooms.filter((r) => selected.includes(r.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã phòng', width: 15 },
              { header: 'Tên phòng thi', width: 25 },
              { header: 'Sức chứa', width: 12, align: 'center' as const },
              { header: 'Vị trí / Tòa nhà', width: 20 },
              { header: 'Loại phòng', width: 20, align: 'center' as const },
              { header: 'Trạng thái', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((r, idx) => [
              idx + 1,
              r.roomCode || r.code || '',
              r.roomName || r.name || '',
              r.capacity ?? 0,
              r.building || r.location || '',
              r.roomType === 'COMPUTER_LAB' ? 'Phòng máy tính' : 'Phòng lý thuyết',
              r.status === 'MAINTENANCE' ? 'Bảo trì' : 'Sẵn sàng',
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_phong_thi_da_chon.xls',
              title: 'DANH SÁCH PHÒNG THI ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} phòng thi`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} phòng thi ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = rooms.filter((r) => selected.includes(r.id));
            printReport({
              title: 'BÁO CÁO DANH SÁCH PHÒNG THI ĐÃ CHỌN',
              subtitle: `Tổng số phòng thi được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng đã chọn', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã phòng', width: '90px' },
                { header: 'Tên Phòng thi', width: '180px' },
                { header: 'Sức chứa', width: '70px', align: 'center' },
                { header: 'Tòa nhà', width: '100px' },
                { header: 'Loại phòng', width: '110px' },
                { header: 'Trạng thái', width: '90px', align: 'center' },
              ],
              rows: selectedItems.map((r, idx) => [
                idx + 1,
                r.roomCode || r.code || '',
                r.roomName || r.name || '',
                String(r.capacity ?? 0),
                r.building || r.location || '',
                r.roomType === 'COMPUTER_LAB' ? 'Phòng máy tính' : 'Phòng lý thuyết',
                r.status === 'MAINTENANCE' ? 'Bảo trì' : 'Sẵn sàng',
              ]),
            });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt phòng thi?',
              message: `Bạn có chắc chắn muốn xóa ${count} phòng thi đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/exam-rooms/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setRooms((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} phòng thi`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa phòng thi', type: 'error' });
                }
              },
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Sửa phòng thi' : 'Thêm phòng thi'}
        subtitle={editingRoom ? `Mã phòng: ${editingRoom.code}` : 'Thiết lập sức chứa và thiết bị phòng thi'}
        icon={<DoorOpen className="h-6 w-6 text-white" />}
        badge={editingRoom ? 'Chỉnh sửa' : 'Tạo mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Mã phòng thi</label>
            <input
              type="text"
              required
              placeholder="VD: LAB-A101"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[15px] font-medium text-slate-500 mb-1">Tên phòng thi</label>
            <input
              type="text"
              required
              placeholder="VD: Phòng máy tính A101"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Sức chứa (Chỗ ngồi)</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Tòa nhà / Vị trí</label>
              <input
                type="text"
                required
                placeholder="VD: Tòa A"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Loại phòng</label>
              <FilterSelect containerClassName="w-full"
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
              >
                <option value="COMPUTER_LAB">Phòng máy tính</option>
                <option value="THEORY">Phòng lý thuyết</option>
              </FilterSelect>
            </div>
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Trạng thái</label>
              <FilterSelect 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] focus:border-blue-500 focus:outline-none"
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="MAINTENANCE">Bảo trì</option>
                <option value="BUSY">Đang thi</option>
              </FilterSelect>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {!editingRoom ? (
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
                {editingRoom ? 'Cập nhật phòng thi' : 'Lưu phòng thi'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import danh sách phòng thi từ Excel"
        templateFileName="danh_sach_phong_thi_mau.csv"
        onImportSuccess={async () => {
          await fetchData();
          setToast({ message: 'Nhập danh sách phòng thi từ file thành công!', type: 'success' });
        }}
      />

      {/* Room Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerRoom)}
        onClose={() => setDrawerRoom(null)}
        title={drawerRoom?.roomName || drawerRoom?.name || 'Chi tiết phòng thi'}
        subtitle={`Mã phòng: ${drawerRoom?.roomCode || drawerRoom?.code || ''}`}
        avatarText={drawerRoom?.roomCode?.slice(0, 3) || 'PT'}
        badge={{
          label: drawerRoom?.roomType === 'COMPUTER_LAB' ? 'Phòng máy tính' : 'Phòng lý thuyết',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Tên phòng thi', value: drawerRoom?.roomName || drawerRoom?.name, icon: DoorOpen },
          { label: 'Mã phòng thi', value: drawerRoom?.roomCode || drawerRoom?.code, icon: Building },
          { label: 'Sức chứa tối đa', value: `${drawerRoom?.capacity ?? 0} chỗ ngồi`, icon: Users },
          { label: 'Tòa nhà / Khu vực', value: drawerRoom?.building || drawerRoom?.location || '---', icon: Building },
          { label: 'Loại phòng thi', value: drawerRoom?.roomType === 'COMPUTER_LAB' ? 'Phòng máy tính' : 'Phòng thi lý thuyết', icon: Monitor },
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
