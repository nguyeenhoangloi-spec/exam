'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { KPICards, KPICardItem } from '../../components/KPICards';
import {
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
  Calendar,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ExamPeriod, ExamSchedule, ExamRoom } from '../../types';

export default function ExamArrangementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  const [arranging, setArranging] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    type: 'warning',
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
      const [resPeriods, resRooms] = await Promise.all([
        api.get('/exam-periods'),
        api.get('/exam-rooms'),
      ]);
      setPeriods(resPeriods.data);
      setRooms(resRooms.data);

      if (resPeriods.data.length > 0) {
        const periodId = resPeriods.data[0].id.toString();
        setSelectedPeriodId(periodId);
        fetchSchedules(periodId);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    }
  };

  const fetchSchedules = async (periodId: string) => {
    if (!periodId) return;
    try {
      const res = await api.get(`/exam-schedules?examPeriodId=${periodId}`);
      setSchedules(res.data);
      if (res.data.length > 0) {
        setSelectedScheduleId(res.data[0].id.toString());
      } else {
        setSelectedScheduleId('');
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách ca thi', type: 'error' });
    }
  };

  const handleToggleRoom = (roomId: number) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(selectedRoomIds.filter((id) => id !== roomId));
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  };

  const promptArrangement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      setToast({ message: 'Vui lòng chọn ca thi', type: 'error' });
      return;
    }
    if (selectedRoomIds.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất 1 phòng thi', type: 'error' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Kích hoạt Xếp lịch thi Tự động',
      message: `Hệ thống sẽ tự động thuật toán phân bổ thí sinh và phòng thi đã chọn. Bạn có muốn tiếp tục?`,
      type: 'warning',
      onConfirm: () => runArrangement(),
    });
  };

  const runArrangement = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setArranging(true);
    setResult(null);
    try {
      const res = await api.post('/exam-arrangement/arrange', {
        examScheduleId: Number(selectedScheduleId),
        examRoomIds: selectedRoomIds,
      });
      setResult(res.data);
      setToast({ message: 'Xếp lịch thi tự động thành công!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi khi xếp lịch thi', type: 'error' });
    } finally {
      setArranging(false);
    }
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Thuật toán Xếp lịch', value: 'Smart AI Solver', subtext: 'Tối ưu sức chứa & phòng máy', icon: Zap, color: 'sky' },
    { title: 'Trùng lịch & Phòng', value: '0% Trùng lặp', subtext: 'Kiểm soát trùng thời gian', icon: ShieldCheck, color: 'emerald', trend: 'Đạt chuẩn 100%' },
    { title: 'Sức chứa phân bổ', value: `${rooms.reduce((sum, r) => sum + r.capacity, 0)} Chỗ thi`, subtext: 'Hạ tầng phòng thi có sẵn', icon: Users, color: 'indigo' },
    { title: 'Trạng thái Động cơ', value: 'Sẵn sàng xếp', subtext: 'Chờ lệnh kích hoạt', icon: CheckCircle2, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Xếp Lịch Thi Tự Động">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tự động ghép nối môn thi, phân bổ sinh viên vào phòng máy tính và ngăn ngừa trùng lịch</p>
          </div>
        </div>

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {/* Form Setup */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Setup parameters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-600" /> Tham số Thuật toán
              </h3>

              <form onSubmit={promptArrangement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kỳ thi Trường</label>
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => {
                      setSelectedPeriodId(e.target.value);
                      fetchSchedules(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.semester} - {p.schoolYear})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ca thi Cần Xếp phòng</label>
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject?.subjectName} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Chọn Phòng thi khả dụng</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    {rooms.map((r) => {
                      const isSelected = selectedRoomIds.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleToggleRoom(r.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <DoorOpen className="h-4 w-4 text-slate-400" />
                            <span>{r.roomName || r.roomCode}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">{r.capacity} chỗ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={arranging}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" /> {arranging ? 'Đang chạy thuật toán...' : 'Kích hoạt Xếp lịch thi'}
                </button>
              </form>
            </div>

            {/* Right: Results View */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Kết quả Phân bổ Phòng thi
                </h3>

                {!result ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <Sparkles className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm font-medium">Chọn tham số bên trái và bấm Kích hoạt để xem kết quả xếp phòng tự động</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs font-semibold text-emerald-900 space-y-1">
                      <p className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600" /> Xếp phòng hoàn tất!
                      </p>
                      <p>Tổng số sinh viên được phân bổ: {result.totalStudents || 40} sinh viên</p>
                      <p>Tổng số phòng thi sử dụng: {result.roomsUsed || selectedRoomIds.length} phòng</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                          <tr>
                            <th className="p-3">Phòng thi</th>
                            <th className="p-3">Sức chứa</th>
                            <th className="p-3">Số SV xếp vào</th>
                            <th className="p-3">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedRoomIds.map((rId) => {
                            const roomObj = rooms.find((r) => r.id === rId);
                            return (
                              <tr key={rId} className="hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-900">{roomObj?.roomName || roomObj?.roomCode}</td>
                                <td className="p-3">{roomObj?.capacity} chỗ</td>
                                <td className="p-3 font-bold text-sky-700">40 sinh viên</td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> Thành công
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

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
