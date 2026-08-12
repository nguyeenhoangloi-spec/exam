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
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { Button } from '../../components/ui/Button';
import { ExamRoom } from '../../types';
import { DoorOpen, Monitor, Users, Building, Search, X, ChevronDown, FileSpreadsheet } from 'lucide-react';

import { ExamRoomHeader } from '../../components/exam-rooms/ExamRoomHeader';
import { ExamRoomKPICards } from '../../components/exam-rooms/ExamRoomKPICards';
import { ExamRoomTableToolbar } from '../../components/exam-rooms/ExamRoomTableToolbar';
import { ExamRoomTable } from '../../components/exam-rooms/ExamRoomTable';
import { ExamRoomPaginationBar } from '../../components/exam-rooms/ExamRoomPaginationBar';

export default function ExamRoomsPage() {
  usePageTitle('Quản lý phòng thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Compute DYNAMIC KPI metrics directly from real API data
  const kpiData = useMemo(() => {
    const total = rooms.length;
    const labCount = rooms.filter((r) => r.roomType === 'COMPUTER_LAB').length;
    const theoryCount = rooms.filter((r) => r.roomType === 'THEORY' || r.roomType === 'THEORY_ROOM' || r.roomType !== 'COMPUTER_LAB').length;
    const totalCapacity = rooms.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const buildings = new Set(rooms.map((r) => r.building || r.location).filter(Boolean)).size;
    return { total, labCount, theoryCount, totalCapacity, activeBuildingCount: buildings };
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
        return matchSearch && matchType && matchBuilding;
      })
      .sort((a, b) => {
        if (sortOrder === 'capacity_desc') return (b.capacity || 0) - (a.capacity || 0);
        if (sortOrder === 'capacity_asc') return (a.capacity || 0) - (b.capacity || 0);
        if (sortOrder === 'oldest') return a.id - b.id;
        return b.id - a.id;
      });
  }, [rooms, search, selectedType, selectedBuilding, sortOrder]);

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
      title: 'Xóa phòng thi',
      message: `Bạn có chắc chắn muốn xóa phòng ${item?.roomName || item?.name || ''}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-rooms/${id}`);
          setToast({ message: 'Đã xóa phòng thi thành công!', type: 'success' });
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
      r.roomType === 'COMPUTER_LAB' ? 'Phòng Máy tính' : 'Phòng Lý thuyết',
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
        { header: 'Tên Phòng thi', width: '200px' },
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
        r.roomType === 'COMPUTER_LAB' ? 'Phòng Máy' : 'Phòng Lý thuyết',
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

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã phòng, tên phòng, tòa nhà..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Loại phòng:</span>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:border-slate-300 transition shadow-2xs"
                >
                  <option value="">Tất cả loại phòng</option>
                  <option value="COMPUTER_LAB">Phòng Máy tính</option>
                  <option value="THEORY">Phòng Lý thuyết</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {buildingList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Tòa nhà:</span>
                <div className="relative">
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:border-slate-300 transition shadow-2xs"
                  >
                    <option value="">Tất cả tòa nhà</option>
                    {buildingList.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Table Action Toolbar */}
        <ExamRoomTableToolbar
          totalCount={filteredRooms.length}
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
      </main>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Chỉnh sửa Phòng thi' : 'Tạo Phòng thi Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Mã phòng thi</label>
            <input
              type="text"
              required
              placeholder="VD: LAB-A101"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Phòng thi</label>
            <input
              type="text"
              required
              placeholder="VD: Phòng Máy Tính A101"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sức chứa (Chỗ ngồi)</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tòa nhà / Vị trí</label>
              <input
                type="text"
                required
                placeholder="VD: Tòa A"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Loại phòng</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="COMPUTER_LAB">Phòng Máy tính</option>
                <option value="THEORY">Phòng Lý thuyết</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="MAINTENANCE">Bảo trì</option>
                <option value="BUSY">Đang thi</option>
              </select>
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
                leftIcon={<FileSpreadsheet className="h-4 w-4 text-blue-600" />}
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
                {editingRoom ? 'Cập nhật Phòng thi' : 'Lưu Phòng Thi'}
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
        avatarText={drawerRoom?.building?.slice(-2) || 'RM'}
        badge={{
          label: drawerRoom?.roomType === 'COMPUTER_LAB' ? 'Phòng Máy' : 'Phòng Lý thuyết',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Tên phòng thi', value: drawerRoom?.roomName || drawerRoom?.name, icon: DoorOpen },
          { label: 'Mã phòng thi', value: drawerRoom?.roomCode || drawerRoom?.code },
          { label: 'Sức chứa', value: `${drawerRoom?.capacity ?? 0} chỗ`, icon: Users },
          { label: 'Tòa nhà / Vị trí', value: drawerRoom?.building || drawerRoom?.location, icon: Building },
          { label: 'Loại phòng', value: drawerRoom?.roomType === 'COMPUTER_LAB' ? 'Phòng Máy tính' : 'Phòng Lý thuyết', icon: Monitor },
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
