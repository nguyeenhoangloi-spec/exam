'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Toast } from '../../components/Toast';
import { UserCheck, Trash2, UserPlus } from 'lucide-react';
import { ExamSchedule, Teacher } from '../../types';

export default function ExamSupervisorsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedScheduleRoomId, setSelectedScheduleRoomId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [role, setRole] = useState<string>('SUPERVISOR_1');
  const [note, setNote] = useState<string>('');

  const [assignedSupervisors, setAssignedSupervisors] = useState<any[]>([]);
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
      const [resSchedules, resTeachers] = await Promise.all([
        api.get('/exam-schedules'),
        api.get('/teachers'),
      ]);
      setSchedules(resSchedules.data);
      setTeachers(resTeachers.data);

      if (resTeachers.data.length > 0) {
        setSelectedTeacherId(resTeachers.data[0].id.toString());
      }

      if (resSchedules.data.length > 0) {
        selectSchedule(resSchedules.data[0].id);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    }
  };

  const selectSchedule = async (scheduleId: number) => {
    try {
      const res = await api.get(`/exam-schedules/${scheduleId}`);
      setSelectedSchedule(res.data);
      if (res.data.examScheduleRooms && res.data.examScheduleRooms.length > 0) {
        setSelectedScheduleRoomId(res.data.examScheduleRooms[0].id.toString());
      } else {
        setSelectedScheduleRoomId('');
      }
      fetchAssignedSupervisors(scheduleId);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const fetchAssignedSupervisors = async (scheduleId: number) => {
    try {
      const res = await api.get(`/exam-supervisors?examScheduleId=${scheduleId}`);
      setAssignedSupervisors(res.data);
    } catch (err) {
      setAssignedSupervisors([]);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleRoomId || !selectedTeacherId) {
      setToast({ message: 'Vui lòng chọn phòng thi và giảng viên.', type: 'error' });
      return;
    }

    try {
      await api.post('/exam-supervisors/assign', {
        examScheduleRoomId: parseInt(selectedScheduleRoomId, 10),
        teacherId: parseInt(selectedTeacherId, 10),
        role,
        note,
      });
      setToast({ message: 'Phân công giám thị thành công!', type: 'success' });
      if (selectedSchedule) {
        fetchAssignedSupervisors(selectedSchedule.id);
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Hủy phân công giám thị này?')) return;
    try {
      await api.delete(`/exam-supervisors/${id}`);
      setToast({ message: 'Đã hủy phân công!', type: 'success' });
      if (selectedSchedule) {
        fetchAssignedSupervisors(selectedSchedule.id);
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <AppShell user={currentUser} title="Phân công Giám thị coi thi">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                Thêm Giám thị
              </h2>

              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">1. Chọn lịch thi</label>
                  <select
                    value={selectedSchedule?.id || ''}
                    onChange={(e) => selectSchedule(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500 font-medium"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject?.subjectName} ({new Date(s.examDate).toLocaleDateString('vi-VN')} {s.startTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">2. Chọn phòng thi</label>
                  {selectedSchedule?.examScheduleRooms?.length > 0 ? (
                    <select
                      value={selectedScheduleRoomId}
                      onChange={(e) => setSelectedScheduleRoomId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500 font-medium"
                    >
                      {selectedSchedule.examScheduleRooms.map((sr: any) => (
                        <option key={sr.id} value={sr.id}>
                          {sr.room?.roomCode} ({sr.room?.building})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-red-500">Lịch thi này chưa được xếp phòng thi. Vui lòng xếp phòng thi trước.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">3. Chọn giảng viên coi thi</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500 font-medium"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.teacherCode} - {t.degree})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">4. Vai trò coi thi</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="SUPERVISOR_1">Giám thị 1 (Chính)</option>
                    <option value="SUPERVISOR_2">Giám thị 2 (Phụ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedScheduleRoomId}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition text-sm disabled:opacity-50"
                >
                  Lưu phân công
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Danh sách Giám thị đã phân công
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Phòng thi</th>
                      <th className="px-4 py-3">Giảng viên</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Ghi chú</th>
                      <th className="px-4 py-3 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedSupervisors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Chưa có giám thị nào được phân công cho lịch thi này.
                        </td>
                      </tr>
                    ) : (
                      assignedSupervisors.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {item.examScheduleRoom?.room?.roomCode} ({item.examScheduleRoom?.room?.building})
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{item.teacher?.fullName}</p>
                            <span className="text-xs text-slate-400">{item.teacher?.teacherCode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.role === 'SUPERVISOR_1'
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {item.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{item.note || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteAssignment(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
