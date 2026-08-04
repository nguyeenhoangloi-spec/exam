'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { KPICards, KPICardItem } from '../../components/KPICards';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import {
  Plus,
  Trash2,
  Edit,
  DoorOpen,
  Monitor,
  Users,
  Building,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { ExamRoom } from '../../types';

export default function ExamRoomsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerRoom, setDrawerRoom] = useState<ExamRoom | null>(null);
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    capacity: '40',
    location: '',
    roomType: 'COMPUTER_LAB',
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

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const res = await api.get('/exam-rooms');
      setRooms(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách phòng thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const rName = r.roomName || r.name || '';
    const rCode = r.roomCode || r.code || '';
    const rLoc = r.building || r.location || '';
    const matchSearch =
      rName.toLowerCase().includes(search.toLowerCase()) ||
      rCode.toLowerCase().includes(search.toLowerCase()) ||
      rLoc.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType ? r.roomType === selectedType : true;
    return matchSearch && matchType;
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      code: `PM${200 + rooms.length + 1}`,
      name: '',
      capacity: '40',
      location: 'Tòa nhà A2',
      roomType: 'COMPUTER_LAB',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (r: ExamRoom) => {
    setEditingRoom(r);
    setFormData({
      code: r.roomCode || r.code || '',
      name: r.roomName || r.name || '',
      capacity: String(r.capacity),
      location: r.building || r.location || '',
      roomType: r.roomType || 'COMPUTER_LAB',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        roomCode: formData.code,
        roomName: formData.name,
        capacity: Number(formData.capacity),
        building: formData.location,
        roomType: formData.roomType,
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
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const r = rooms.find((item) => item.id === id);
    const rName = r?.roomName || r?.name || '';
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Phòng thi',
      message: `Bạn có chắc chắn muốn xóa phòng thi ${rName}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-rooms/${id}`);
          setToast({ message: 'Đã xóa phòng thi thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const exportCsv = () => {
    const headers = 'Mã Phòng,Tên Phòng,Sức chứa,Tòa nhà,Loại phòng\n';
    const rows = filteredRooms
      .map(
        (r) =>
          `"${r.roomCode || r.code || ''}","${r.roomName || r.name || ''}","${r.capacity}","${r.building || r.location || ''}","${
            r.roomType === 'COMPUTER_LAB' ? 'Phòng Máy tính' : 'Phòng Lý thuyết'
          }"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_phong_thi.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số phòng thi', value: rooms.length, subtext: 'Hạ tầng cơ sở thi', icon: DoorOpen, color: 'sky' },
    { title: 'Tổng sức chứa', value: `${rooms.reduce((sum, r) => sum + r.capacity, 0)} Chỗ`, subtext: 'Số thí sinh đồng thời', icon: Users, color: 'indigo' },
    { title: 'Phòng thi Máy tính', value: rooms.filter((r) => r.roomType === 'COMPUTER_LAB').length, subtext: 'Thi trắc nghiệm Online', icon: Monitor, color: 'emerald' },
    { title: 'Phòng thi Lý thuyết', value: rooms.filter((r) => r.roomType !== 'COMPUTER_LAB').length, subtext: 'Thi tự luận giấy', icon: Building, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Phòng thi">
      <div className="flex min-h-screen flex-col min-w-0 bg-slate-50/50">
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quản lý Hạ tầng & Phòng thi</h1>
              <p className="text-xs text-slate-500 mt-0.5">Quản lý danh sách phòng máy tính, hội trường thi và sức chứa thí sinh</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-medium text-sm shadow-xs transition"
              >
                <Download className="h-4 w-4" /> Xuất Danh sách
              </button>
              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
                >
                  <Plus className="h-4 w-4" /> Thêm Phòng thi
                </button>
              )}
            </div>
          </div>

          {/* KPI Header Cards */}
          <KPICards items={kpiItems} />

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Mã phòng, Tên phòng, Tòa nhà..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Loại phòng:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="">Tất cả loại phòng</option>
                  <option value="COMPUTER_LAB">Phòng Máy tính</option>
                  <option value="THEORY_ROOM">Phòng Lý thuyết</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách phòng thi...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy phòng thi phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Mã Phòng</th>
                      <th className="p-4">Tên Phòng thi</th>
                      <th className="p-4">Sức chứa</th>
                      <th className="p-4">Tòa nhà</th>
                      <th className="p-4">Loại phòng</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRooms.map((r) => {
                      const code = r.roomCode || r.code || '';
                      const name = r.roomName || r.name || '';
                      const loc = r.building || r.location || 'Chưa cập nhật';
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6 font-bold text-sky-700">{code}</td>
                          <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                              {r.roomType === 'COMPUTER_LAB' ? <Monitor className="h-4 w-4 text-emerald-600" /> : <DoorOpen className="h-4 w-4 text-sky-600" />}
                            </div>
                            {name}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              <Users className="h-3.5 w-3.5 text-slate-400" /> {r.capacity} Chỗ
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-800">{loc}</td>
                          <td className="p-4">
                            {r.roomType === 'COMPUTER_LAB' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                                <Monitor className="h-3.5 w-3.5" /> Phòng Máy tính
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
                                <DoorOpen className="h-3.5 w-3.5" /> Phòng Lý thuyết
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setDrawerRoom(r)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                title="Xem chi tiết phòng"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {currentUser?.role === 'ADMIN' && (
                                <>
                                  <button
                                    onClick={() => openEditModal(r)}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(r.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Chỉnh sửa Phòng thi' : 'Thêm Phòng thi Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Phòng thi</label>
            <input
              type="text"
              required
              placeholder="VD: PM201"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Phòng thi</label>
            <input
              type="text"
              required
              placeholder="VD: Phòng Máy 201 - Tầng 2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sức chứa (Chỗ ngồi)</label>
              <input
                type="number"
                min="1"
                max="200"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Loại phòng</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="COMPUTER_LAB">Phòng Máy tính</option>
                <option value="THEORY_ROOM">Phòng Lý thuyết</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vị trí / Tòa nhà</label>
            <input
              type="text"
              placeholder="VD: Tòa nhà A2 - Khu 1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm"
            >
              Lưu Phòng thi
            </button>
          </div>
        </form>
      </Modal>

      {/* Room Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerRoom)}
        onClose={() => setDrawerRoom(null)}
        title={drawerRoom?.roomName || drawerRoom?.name || ''}
        subtitle={`Mã phòng: ${drawerRoom?.roomCode || drawerRoom?.code}`}
        avatarText={drawerRoom?.roomCode ? drawerRoom.roomCode.slice(0, 2) : 'PT'}
        badge={{
          label: drawerRoom?.roomType === 'COMPUTER_LAB' ? 'Phòng Máy tính' : 'Phòng Lý thuyết',
          className: drawerRoom?.roomType === 'COMPUTER_LAB' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200',
        }}
        details={[
          { label: 'Mã phòng thi', value: drawerRoom?.roomCode || drawerRoom?.code, icon: DoorOpen },
          { label: 'Tên phòng', value: drawerRoom?.roomName || drawerRoom?.name },
          { label: 'Sức chứa tối đa', value: `${drawerRoom?.capacity} Chỗ ngồi`, icon: Users },
          { label: 'Vị trí tòa nhà', value: drawerRoom?.building || drawerRoom?.location || 'Tòa A2', icon: Building },
          { label: 'Tình trạng máy tính', value: drawerRoom?.roomType === 'COMPUTER_LAB' ? '40/40 Máy chạy tốt' : 'Không có', icon: Monitor },
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
    </AppShell>
  );
}
