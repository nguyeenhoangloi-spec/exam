'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  const [autoProposal, setAutoProposal] = useState<any | null>(null);
  const [selectedAutoProposalKeys, setSelectedAutoProposalKeys] = useState<string[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
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

  const fetchSupervisors = useCallback(async (scheduleRoomId: string) => {
    if (!scheduleRoomId) {
      setAssignedSupervisors([]);
      return;
    }
    try {
      const res = await api.get(`/exam-supervisors?examScheduleRoomId=${scheduleRoomId}`);
      setAssignedSupervisors(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách giám thị', type: 'error' });
    }
  }, []);

  const selectSchedule = useCallback(async (scheduleId: number) => {
    try {
      const res = await api.get(`/exam-schedules/${scheduleId}`);
      setSelectedSchedule(res.data);
      setAutoProposal(null);
      setSelectedAutoProposalKeys([]);
      const firstRoomId = res.data.examScheduleRooms?.[0]?.id?.toString() || '';
      setSelectedScheduleRoomId(firstRoomId);
      await fetchSupervisors(firstRoomId);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải chi tiết ca thi', type: 'error' });
    }
  }, [fetchSupervisors]);

  const fetchData = useCallback(async () => {
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
        await selectSchedule(resSchedules.data[0].id);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    }
  }, [selectSchedule]);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    void fetchData();
  }, [fetchData, router]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleRoomId || !selectedTeacherId) {
      setToast({ message: 'Vui lòng chọn phòng thi và giảng viên', type: 'error' });
      return;
    }

    try {
      await api.post('/exam-supervisors/assign', {
        examScheduleRoomId: Number(selectedScheduleRoomId),
        teacherId: Number(selectedTeacherId),
        role,
        note,
      });
      setToast({ message: 'Phân công giám thị thành công!', type: 'success' });
      setNote('');
      await selectSchedule(selectedSchedule.id);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi phân công giám thị', type: 'error' });
    }
  };

  const previewAutoAssign = async () => {
    if (!selectedSchedule?.id) return;
    setAutoLoading(true);
    try {
      const res = await api.post('/exam-supervisors/auto-preview', { examScheduleId: selectedSchedule.id });
      setAutoProposal(res.data);
      setSelectedAutoProposalKeys(res.data.proposals.map((proposal: any) => `${proposal.examScheduleRoomId}-${proposal.role}`));
      setToast({ message: 'Đã tạo phương án giám thị xem trước. Chưa ghi dữ liệu.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tạo phương án tự động', type: 'error' });
    } finally {
      setAutoLoading(false);
    }
  };

  const acceptAutoAssign = async () => {
    if (!autoProposal?.proposals?.length) return;
    setAutoLoading(true);
    try {
      const proposals = autoProposal.proposals
        .filter((proposal: any) => selectedAutoProposalKeys.includes(`${proposal.examScheduleRoomId}-${proposal.role}`))
        .map((proposal: any) => ({ examScheduleRoomId: proposal.examScheduleRoomId, teacherId: proposal.teacherId, role: proposal.role }));
      if (!proposals.length) return;
      await api.post('/exam-supervisors/auto-assign', { proposals });
      setAutoProposal(null);
      setSelectedAutoProposalKeys([]);
      setToast({ message: 'Đã lưu phương án phân công tự động.', type: 'success' });
      await selectSchedule(selectedSchedule.id);
    } catch (err: any) {
      setToast({ message: err.message || 'Phương án đã thay đổi, vui lòng xem lại', type: 'error' });
    } finally {
      setAutoLoading(false);
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
          await selectSchedule(selectedSchedule.id);
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
        (s) => {
          const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
          const rName = roomObj?.roomName || roomObj?.roomCode || '';
          return `"${selectedSchedule?.subject?.subjectName || ''}","${rName}","${s.teacher?.fullName || ''}","${s.teacher?.degree || 'TS'}","${
            s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'
          }","${s.note || ''}"`;
        },
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

  const selectedRooms = selectedSchedule?.examScheduleRooms || [];
  const totalAssignments = selectedRooms.reduce(
    (total: number, scheduleRoom: any) => total + (scheduleRoom.supervisors?.length || 0),
    0,
  );
  const requiredAssignments = selectedRooms.length * 2;
  const coverage = requiredAssignments ? Math.round((totalAssignments / requiredAssignments) * 100) : 0;
  const fullyAssignedRooms = selectedRooms.filter((scheduleRoom: any) => (scheduleRoom.supervisors?.length || 0) >= 2).length;

  const kpiItems: KPICardItem[] = [
    { title: 'Lượt phân công', value: totalAssignments, subtext: selectedSchedule ? `Lịch thi đang chọn: ${selectedRooms.length} phòng` : 'Chọn lịch thi để xem', icon: ShieldCheck, color: 'sky' },
    { title: 'Giảng viên khả dụng', value: teachers.length, subtext: 'Danh sách giảng viên hệ thống', icon: GraduationCap, color: 'emerald' },
    { title: 'Tỷ lệ phủ giám thị', value: `${coverage}%`, subtext: requiredAssignments ? `${totalAssignments}/${requiredAssignments} vị trí đã gán` : 'Chưa có phòng thi', icon: CheckCircle2, color: 'indigo' },
    { title: 'Phòng đủ giám thị', value: `${fullyAssignedRooms}/${selectedRooms.length}`, subtext: 'Mỗi phòng cần 2 giám thị', icon: UserCheck, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Phân công Giám thị">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Phân công cán bộ coi thi 1, cán bộ coi thi 2 cho từng phòng thi</p>
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
                  onChange={(e) => void selectSchedule(Number(e.target.value))}
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
                    void fetchSupervisors(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  {selectedSchedule?.examScheduleRooms?.map((sr: any) => {
                    const roomObj = sr.room || sr.examRoom;
                    const name = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || roomObj?.code || '---';
                    const capacity = roomObj?.capacity ?? '---';
                    return (
                      <option key={sr.id} value={sr.id}>
                        Phòng: {name} (Sức chứa: {capacity} chỗ)
                      </option>
                    );
                  })}
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
                  <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                    <button type="button" onClick={() => void previewAutoAssign()} disabled={autoLoading || !selectedSchedule?.id} className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                      {autoLoading ? 'Đang tạo phương án...' : 'Đề xuất tự động'}
                    </button>
                  </div>
                  {autoProposal && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <p className="font-bold">Phương án xem trước · điểm {autoProposal.score}/100</p>
                      <div className="mt-2 space-y-1">
                        {autoProposal.proposals.map((proposal: any) => {
                          const key = `${proposal.examScheduleRoomId}-${proposal.role}`;
                          return <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={selectedAutoProposalKeys.includes(key)} onChange={(event) => setSelectedAutoProposalKeys((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key))} />{proposal.roomCode} · {proposal.teacherName} · {proposal.role}</label>;
                        })}
                      </div>
                      {autoProposal.unassigned?.length > 0 && <p className="mt-2 text-rose-700">Chưa xếp {autoProposal.unassigned.length} vị trí.</p>}
                      <button type="button" onClick={() => void acceptAutoAssign()} disabled={autoLoading || !selectedAutoProposalKeys.length} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Xác nhận lưu phương án đã chọn</button>
                    </div>
                  )}
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
          {
            label: 'Phòng coi thi',
            value: (() => {
              const currentSup = assignedSupervisors.find((item) => item.id === drawerSupervisor?.id);
              const roomObj = currentSup?.examScheduleRoom?.room || currentSup?.examScheduleRoom?.examRoom;
              return roomObj?.roomName || roomObj?.roomCode || 'Chưa xác định';
            })(),
            icon: DoorOpen,
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
    </AppShell>
  );
}
