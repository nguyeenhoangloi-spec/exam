'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import { ExamRoom } from '../../types';

export default function ExamRoomsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null);
  const [formData, setFormData] = useState({
    roomCode: '',
    roomName: '',
    building: '',
    capacity: '40',
    roomType: 'THI_LY_THUYET',
    status: 'AVAILABLE',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      roomCode: '',
      roomName: '',
      building: 'Nhà A2',
      capacity: '40',
      roomType: 'THI_LY_THUYET',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room: ExamRoom) => {
    setEditingRoom(room);
    setFormData({
      roomCode: room.roomCode,
      roomName: room.roomName,
      building: room.building,
      capacity: room.capacity.toString(),
      roomType: room.roomType,
      status: room.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.patch(`/exam-rooms/${editingRoom.id}`, {
          roomName: formData.roomName,
          building: formData.building,
          capacity: parseInt(formData.capacity, 10),
          roomType: formData.roomType,
          status: formData.status,
        });
        setToast({ message: 'Cập nhật phòng thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-rooms', {
          roomCode: formData.roomCode,
          roomName: formData.roomName,
          building: formData.building,
          capacity: parseInt(formData.capacity, 10),
          roomType: formData.roomType,
          status: formData.status,
        });
        setToast({ message: 'Thêm phòng thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa phòng thi này?')) return;
    try {
      await api.delete(`/exam-rooms/${id}`);
      setToast({ message: 'Đã xóa phòng thi!', type: 'success' });
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={currentUser} title="Quản lý Phòng thi" />

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-xl font-bold text-slate-800">Danh sách Phòng thi</h1>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm phòng thi</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Mã phòng</th>
                    <th className="px-6 py-4">Tên phòng</th>
                    <th className="px-6 py-4">Tòa nhà</th>
                    <th className="px-6 py-4">Sức chứa</th>
                    <th className="px-6 py-4">Loại phòng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    {currentUser?.role === 'ADMIN' && <th className="px-6 py-4 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Đang tải...
                      </td>
                    </tr>
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Chưa có phòng thi nào.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">{room.roomCode}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{room.roomName}</td>
                        <td className="px-6 py-4">{room.building}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{room.capacity} chỗ</td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-md text-xs border border-indigo-100">
                            {room.roomType === 'THI_MAY_TINH' ? 'Thi máy tính' : 'Thi lý thuyết'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-xs">
                            {room.status}
                          </span>
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(room)}
                              className="p-1.5 hover:bg-slate-100 text-sky-600 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(room.id)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Sửa phòng thi' : 'Thêm phòng thi mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mã phòng thi</label>
              <input
                type="text"
                required
                disabled={!!editingRoom}
                value={formData.roomCode}
                onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên phòng</label>
              <input
                type="text"
                required
                value={formData.roomName}
                onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tòa nhà / Dãy nhà</label>
              <input
                type="text"
                required
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Sức chứa (Ghế)</label>
              <input
                type="number"
                min={10}
                max={200}
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Loại phòng</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="THI_LY_THUYET">Thi lý thuyết</option>
                <option value="THI_MAY_TINH">Thi máy tính</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="AVAILABLE">Hoạt động (AVAILABLE)</option>
                <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm"
            >
              Lưu phòng thi
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
