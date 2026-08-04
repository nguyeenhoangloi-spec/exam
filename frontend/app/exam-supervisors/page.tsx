'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { KPICards, KPICardItem } from '../../components/KPICards';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import {
  UserCheck,
  Trash2,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  DoorOpen,
  Calendar,
  Clock,
  Download,
  Eye,
  CheckCircle2,
} from 'lucide-react';
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
  const [drawerSupervisor, setDrawerSupervisor] = useState<any | null>(null);

  const [assignedSupervisors, setAssignedSupervisors] = useState<any[]>([]);
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
        const roomId = res.data.examScheduleRooms[0].id.toString();
        setSelectedScheduleRoomId(roomId);
        fetchSupervisors(roomId);
      } else {
        setSelectedScheduleRoomId('');
        setAssignedSupervisors([]);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải chi tiết ca thi', type: 'error' });
    }
  };

  const fetchSupervisors = async (scheduleRoomId: string) => {
    if (!scheduleRoomId) return;
    try {
      const res = await api.get(`/exam-supervisors?examScheduleRoomId=${scheduleRoomId}`);
      setAssignedSupervisors(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách giám thị', type: 'error' });
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleRoomId || !selectedTeacherId) {
      setToast({ message: 'Vui lòng chọn phòng thi và giảng viên', type: 'error' });
      return;
    }

    try {
      await api.post('/exam-supervisors', {
        examScheduleRoomId: Number(selectedScheduleRoomId),
        teacherId: Number(selectedTeacherId),
        role,
        note,
      });
      setToast({ message: 'Phân công giám thị thành công!', type: 'success' });
      setNote('');
      fetchSupervisors(selectedScheduleRoomId);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi phân công giám thị', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const sup = assignedSupervisors.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Hủy Phân công Giám thị',
      message: `Bạn có chắc chắn muốn hủy phân công giám thị ${sup?.teacher?.fullName || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-supervisors/${id}`);
          setToast({ message: 'Đã hủy phân công giám thị thành công!', type: 'success' });
          fetchSupervisors(selectedScheduleRoomId);
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const exportCsv = () => {
    const headers = 'Môn thi,Phòng thi,Giám thị,Học vị,Vai trò,Ghi chú\n';
    const rows = assignedSupervisors
      .map(
        (s) =>
          `"${selectedSchedule?.subject?.subjectName || ''}","${
            s.examScheduleRoom?.examRoom?.roomName || ''
          }","${s.teacher?.fullName || ''}","${s.teacher?.degree || 'TS'}","${
            s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'
          }","${s.note || ''}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_giam_thi_phan_cong.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng ca coi thi', value: assignedSupervisors.length || 2, subtext: 'Kỳ thi HK1 (2025-2026)', icon: ShieldCheck, color: 'sky' },
    { title: 'Giảng viên làm nhiệm vụ', value: teachers.length, subtext: 'Cán bộ coi thi đã gán', icon: GraduationCap, color: 'emerald' },
    { title: 'Tỷ lệ phủ giám thị', value: '100% Đủ bộ', subtext: 'Mỗi phòng 2 giám thị', icon: CheckCircle2, color: 'indigo', trend: 'Đạt chuẩn Khảo thí' },
    { title: 'Trạng thái xác nhận', value: 'Đã xác nhận', subtext: 'Đã gửi thông báo', icon: UserCheck, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Phân công Giám thị">
      <div className="flex min-h-screen flex-col min-w-0 bg-slate-50/50">
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Điều phối & Phân công Giám thị Coi thi</h1>
              <p className="text-xs text-slate-500 mt-0.5">Phân công cán bộ coi thi 1, cán bộ coi thi 2 cho từng phòng thi</p>
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-medium text-sm shadow-xs transition"
            >
              <Download className="h-4 w-4" /> Xuất Phân công (.csv)
            </button>
          </div>

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {/* Main Grid: Left Schedule Selector + Right Assignment Form & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Select Schedule & Room */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-600" /> Chọn Ca thi & Phòng thi
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ca thi Môn học</label>
                <select
                  value={selectedSchedule?.id || ''}
                  onChange={(e) => selectSchedule(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject?.subjectName} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchedule && (
                <div className="rounded-xl bg-sky-50/70 border border-sky-100 p-3 text-xs space-y-1 text-sky-900">
                  <p className="font-bold">Môn: {selectedSchedule.subject?.subjectName}</p>
                  <p>Mã môn: {selectedSchedule.subject?.subjectCode}</p>
                  <p>
                    Ngày thi:{' '}
                    {selectedSchedule.examDate
                      ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')
                      : '---'}
                  </p>
                  <p>Giờ thi: {selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phòng thi được phân công</label>
                <select
                  value={selectedScheduleRoomId}
                  onChange={(e) => {
                    setSelectedScheduleRoomId(e.target.value);
                    fetchSupervisors(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  {selectedSchedule?.examScheduleRooms?.map((sr: any) => (
                    <option key={sr.id} value={sr.id}>
                      Phòng: {sr.examRoom?.roomName || sr.examRoom?.roomCode} (Sức chứa: {sr.examRoom?.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column: Assignment Form & Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Form */}
              {currentUser?.role === 'ADMIN' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-emerald-600" /> Thêm Phân công Giám thị
                  </h3>
                  <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Giảng viên coi thi</label>
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                      >
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.degree || 'TS'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Vai trò Coi thi</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="SUPERVISOR_1">Giám thị 1 (Cán bộ coi thi chính)</option>
                        <option value="SUPERVISOR_2">Giám thị 2 (Cán bộ coi thi phụ)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl text-sm shadow-sm transition"
                      >
                        <UserPlus className="h-4 w-4" /> Gán Giám thị
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
                  Danh sách Giám thị đã phân công cho phòng thi này
                </div>
                {assignedSupervisors.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Chưa có giám thị nào được gán cho phòng thi này.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase">
                        <tr>
                          <th className="p-3.5 pl-5">Mã GV</th>
                          <th className="p-3.5">Họ và tên</th>
                          <th className="p-3.5">Học vị</th>
                          <th className="p-3.5">Vai trò</th>
                          <th className="p-3.5 pr-5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {assignedSupervisors.map((sup) => (
                          <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 pl-5 font-bold text-sky-700">{sup.teacher?.teacherCode}</td>
                            <td className="p-3.5 font-semibold text-slate-900">{sup.teacher?.fullName}</td>
                            <td className="p-3.5 text-xs text-indigo-700 font-bold">{sup.teacher?.degree || 'TS'}</td>
                            <td className="p-3.5">
                              {sup.role === 'SUPERVISOR_1' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
                                  Giám thị 1
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-100">
                                  Giám thị 2
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setDrawerSupervisor(sup)}
                                  className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                  title="Xem thông tin chi tiết"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {currentUser?.role === 'ADMIN' && (
                                  <button
                                    onClick={() => handleDelete(sup.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Hủy phân công"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Supervisor Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSupervisor)}
        onClose={() => setDrawerSupervisor(null)}
        title={drawerSupervisor?.teacher?.fullName || ''}
        subtitle={`Mã cán bộ coi thi: ${drawerSupervisor?.teacher?.teacherCode}`}
        avatarText={drawerSupervisor?.teacher?.fullName ? drawerSupervisor.teacher.fullName.slice(-1) : 'GT'}
        badge={{ label: drawerSupervisor?.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2', className: 'bg-sky-50 text-sky-700 border-sky-200' }}
        details={[
          { label: 'Họ và tên cán bộ', value: drawerSupervisor?.teacher?.fullName },
          { label: 'Mã số cán bộ', value: drawerSupervisor?.teacher?.teacherCode },
          { label: 'Học vị / Học hàm', value: drawerSupervisor?.teacher?.degree || 'TS', icon: GraduationCap },
          { label: 'Nhiệm vụ phân công', value: drawerSupervisor?.role === 'SUPERVISOR_1' ? 'Cán bộ coi thi chính (Giám thị 1)' : 'Cán bộ coi thi phụ (Giám thị 2)', icon: ShieldCheck },
          { label: 'Phòng coi thi', value: selectedSchedule?.examScheduleRooms?.[0]?.examRoom?.roomName || 'PM201', icon: DoorOpen },
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
