'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Toast } from '../../components/Toast';
import { Layers, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
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
        const firstPId = resPeriods.data[0].id.toString();
        setSelectedPeriodId(firstPId);
        fetchSchedules(firstPId);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    }
  };

  const fetchSchedules = async (periodId: string) => {
    try {
      const res = await api.get(`/exam-schedules?examPeriodId=${periodId}`);
      setSchedules(res.data);
      if (res.data.length > 0) {
        setSelectedScheduleId(res.data[0].id.toString());
        fetchExistingResults(res.data[0].id);
      } else {
        setSelectedScheduleId('');
        setResult(null);
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const fetchExistingResults = async (scheduleId: number) => {
    try {
      const res = await api.get(`/exam-arrangement/result?examScheduleId=${scheduleId}`);
      if (res.data && res.data.length > 0) {
        const details: any[] = [];
        res.data.forEach((sr: any) => {
          sr.examRoomStudents.forEach((ers: any) => {
            details.push({
              id: ers.id,
              examNumber: ers.examNumber,
              seatNumber: ers.seatNumber,
              studentCode: ers.student?.studentCode,
              fullName: ers.student?.fullName,
              className: ers.student?.class?.name,
              roomCode: sr.room?.roomCode,
              roomName: sr.room?.roomName,
              building: sr.room?.building,
            });
          });
        });
        setResult({ details });
      } else {
        setResult(null);
      }
    } catch (err) {
      setResult(null);
    }
  };

  const toggleRoomSelection = (roomId: number) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(selectedRoomIds.filter((id) => id !== roomId));
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  };

  const handleAutoArrange = async () => {
    if (!selectedScheduleId) {
      setToast({ message: 'Vui lòng chọn lịch thi.', type: 'error' });
      return;
    }
    if (selectedRoomIds.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất một phòng thi.', type: 'error' });
      return;
    }

    setArranging(true);
    try {
      const res = await api.post('/exam-arrangement/auto-arrange', {
        examScheduleId: parseInt(selectedScheduleId, 10),
        roomIds: selectedRoomIds,
      });
      setResult(res.data);
      setToast({ message: res.data.message || 'Xếp phòng thi thành công!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setArranging(false);
    }
  };

  return (
    <AppShell user={currentUser} title="Xếp phòng thi tự động">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          {/* Controls Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              Thiết lập thông số Xếp phòng thi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">1. Chọn kỳ thi</label>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => {
                    setSelectedPeriodId(e.target.value);
                    fetchSchedules(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-medium"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">2. Chọn lịch thi (Môn thi)</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => {
                    setSelectedScheduleId(e.target.value);
                    fetchExistingResults(parseInt(e.target.value, 10));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-medium"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject?.subjectName} ({s.subject?.subjectCode}) - Ngày {new Date(s.examDate).toLocaleDateString('vi-VN')} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                3. Chọn danh sách phòng thi áp dụng:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {rooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => toggleRoomSelection(room.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800">{room.roomCode}</p>
                        <p className="text-xs text-slate-500">Sức chứa: {room.capacity} chỗ</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAutoArrange}
              disabled={arranging}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-sky-500/25 transition disabled:opacity-50 text-sm"
            >
              <Sparkles className="w-5 h-5" />
              <span>{arranging ? 'Đang tự động xếp phòng thi...' : 'Xếp tự động'}</span>
            </button>
          </div>

          {/* Results Table */}
          {result && result.details && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Kết quả xếp phòng thi</h3>
                  <p className="text-xs text-slate-300">Tổng số sinh viên được xếp: {result.details.length} sinh viên</p>
                </div>
                <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Hoàn tất
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Số Báo Danh (SBD)</th>
                      <th className="px-6 py-4">Mã sinh viên</th>
                      <th className="px-6 py-4">Họ và tên</th>
                      <th className="px-6 py-4">Lớp</th>
                      <th className="px-6 py-4">Phòng thi</th>
                      <th className="px-6 py-4">Số ghế</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.details.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-sky-600">{item.examNumber}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.studentCode}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{item.fullName}</td>
                        <td className="px-6 py-4">{item.className}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100 text-xs">
                            {item.roomCode} ({item.building})
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">Ghế #{item.seatNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
