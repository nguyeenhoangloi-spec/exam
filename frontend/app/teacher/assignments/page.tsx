'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { AppShell } from '../../../components/AppShell';
import { Toast } from '../../../components/Toast';
import { KPICards, KPICardItem } from '../../../components/KPICards';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  PlusCircle,
  Download,
  Award,
  BookOpen,
  DoorOpen,
  UserCheck,
  Eye,
} from 'lucide-react';
import { TeacherAssignmentItem } from '../../../types';

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerDuty, setDrawerDuty] = useState<TeacherAssignmentItem | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchMyAssignments();
  }, [router]);

  const fetchMyAssignments = async () => {
    try {
      const res = await api.get('/teachers/my-assignments');
      setAssignments(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải lịch coi thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = 'Mã môn,Tên môn thi,Vai trò,Ngày thi,Thời gian,Phòng thi,Địa điểm\n';
    const rows = assignments
      .map(
        (a) =>
          `"${a.subjectCode}","${a.subjectName}","${a.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}","${new Date(
            a.examDate,
          ).toLocaleDateString('vi-VN')}","${a.startTime} - ${a.endTime}","${a.roomName || a.roomCode}","${a.building || ''}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lich_coi_thi_giang_vien.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sup1Count = assignments.filter((a) => a.role === 'SUPERVISOR_1').length;
  const sup2Count = assignments.filter((a) => a.role === 'SUPERVISOR_2').length;

  const kpiItems: KPICardItem[] = [
    { title: 'Tổng ca coi thi', value: assignments.length, subtext: 'Học kỳ hiện tại', icon: Calendar, color: 'sky' },
    { title: 'Giám thị 1 (Chính)', value: sup1Count, subtext: 'Chịu trách nhiệm phòng', icon: ShieldCheck, color: 'emerald', trend: 'Đạt chuẩn' },
    { title: 'Giám thị 2 (Hỗ trợ)', value: sup2Count, subtext: 'Phối hợp coi thi', icon: UserCheck, color: 'indigo' },
    { title: 'Trạng thái phân công', value: 'Sẵn sàng', subtext: 'Điểm danh trước 15p', icon: Award, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Lịch coi thi Giảng viên">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Banner Welcome */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
          <div>
            <h1 className="text-xl font-bold mb-1">Chào Thầy/Cô {currentUser?.username} 👨‍🏫</h1>
            <p className="text-emerald-100 text-xs font-medium">
              Danh sách các ca coi thi được phân công. Vui lòng có mặt tại phòng thi trước 15 phút.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 bg-emerald-800/40 hover:bg-emerald-800/60 text-white border border-emerald-400/30 px-4 py-2.5 rounded-xl font-semibold text-xs transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
            <button
              onClick={() => router.push('/question-bank')}
              className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Đóng góp câu hỏi</span>
            </button>
          </div>
        </div>

        {/* KPI Analytics */}
        <KPICards items={kpiItems} />

        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium">Đang tra cứu lịch coi thi...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Chưa có lịch coi thi nào</h3>
            <p className="text-xs text-slate-400 mt-1">Hiện tại Thầy/Cô chưa có lịch phân công coi thi mới trong kỳ này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 relative overflow-hidden hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    {item.subjectCode}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      item.role === 'SUPERVISOR_1'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {item.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.subjectName}</h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Ngày thi: <strong className="text-slate-800">{new Date(item.examDate).toLocaleDateString('vi-VN')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Ca thi: <strong className="text-sky-700 font-bold">{item.startTime} - {item.endTime}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Phòng thi: <strong className="text-emerald-700 font-bold">{item.roomName || item.roomCode}</strong> {item.building && `(${item.building})`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setDrawerDuty(item)}
                    className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-3 py-1.5 rounded-xl transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem chi tiết ca thi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Duty Detail Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerDuty)}
        onClose={() => setDrawerDuty(null)}
        title={drawerDuty?.subjectName || ''}
        subtitle={`Mã môn: ${drawerDuty?.subjectCode}`}
        avatarText="GT"
        badge={{
          label: drawerDuty?.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
          className: drawerDuty?.role === 'SUPERVISOR_1' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
        }}
        details={[
          { label: 'Môn thi', value: drawerDuty?.subjectName, icon: BookOpen },
          { label: 'Mã môn', value: drawerDuty?.subjectCode },
          { label: 'Vai trò giám thị', value: drawerDuty?.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Cán bộ chính)' : 'Giám thị 2 (Cán bộ hỗ trợ)', icon: ShieldCheck },
          { label: 'Ngày thi', value: drawerDuty?.examDate ? new Date(drawerDuty.examDate).toLocaleDateString('vi-VN') : '', icon: Calendar },
          { label: 'Thời gian làm bài', value: `${drawerDuty?.startTime} - ${drawerDuty?.endTime}`, icon: Clock },
          { label: 'Phòng thi phân công', value: drawerDuty?.roomName || drawerDuty?.roomCode, icon: DoorOpen },
          { label: 'Tòa nhà / Địa điểm', value: drawerDuty?.building || 'Nhà A1', icon: MapPin },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
