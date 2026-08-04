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
  BookMarked,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  Award,
  BookOpen,
  DoorOpen,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { PersonalScheduleItem } from '../../../types';

export default function StudentExamSchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<PersonalScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerSchedule, setDrawerSchedule] = useState<PersonalScheduleItem | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchMySchedule();
  }, [router]);

  const fetchMySchedule = async () => {
    try {
      const res = await api.get('/students/my-schedule');
      setSchedules(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải lịch thi cá nhân', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = 'Kỳ thi,Mã môn,Tên môn thi,Ngày thi,Thời gian,Phòng thi,SBD,Số ghế\n';
    const rows = schedules
      .map(
        (s) =>
          `"${s.periodName}","${s.subjectCode}","${s.subjectName}","${new Date(s.examDate).toLocaleDateString(
            'vi-VN',
          )}","${s.startTime} - ${s.endTime}","${s.roomName || s.roomCode}","${s.examNumber || s.registrationNumber || ''}","${
            s.seatNumber || ''
          }"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lich_thi_ca_nhan_sinh_vien.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số môn thi', value: schedules.length, subtext: 'Học kỳ hiện tại', icon: Calendar, color: 'sky' },
    { title: 'Đã xếp phòng thi', value: schedules.filter((schedule) => Boolean(schedule.roomCode || schedule.roomName)).length, subtext: 'Theo lịch thi đã được xếp', icon: CheckCircle2, color: 'emerald' },
    { title: 'Môn thi trắc nghiệm', value: schedules.filter((schedule) => schedule.examType === 'TRAC_NGHIEM').length, subtext: 'Theo lịch thi cá nhân', icon: BookOpen, color: 'indigo' },
    { title: 'Đã cấp số báo danh', value: schedules.filter((schedule) => Boolean(schedule.examNumber || schedule.registrationNumber)).length, subtext: 'Theo lịch thi hiện có', icon: Award, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Lịch thi Cá nhân Sinh viên">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Banner Welcome */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div>
            <h1 className="text-xl font-bold mb-1">Lịch thi cá nhân của bạn 🎓</h1>
            <p className="text-sky-100 text-xs font-medium">
              Vui lòng kiểm tra chính xác Mã môn thi, Ngày giờ thi, Phòng thi, Số Báo Danh và Số ghế trước khi đến phòng thi.
            </p>
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 bg-white text-sky-800 hover:bg-sky-50 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Tải lịch thi (.CSV)</span>
          </button>
        </div>

        {/* KPI Analytics Header */}
        <KPICards items={kpiItems} />

        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium">Đang tra cứu lịch thi...</div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Chưa có lịch thi nào</h3>
            <p className="text-xs text-slate-400 mt-1">Hiện tại bạn chưa có lịch thi nào được phân phòng trong kỳ này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 relative overflow-hidden hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
                    {item.subjectCode}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{item.periodName}</span>
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
                      Thời gian: <strong className="text-sky-700 font-bold">{item.startTime} - {item.endTime}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Phòng thi: <strong className="text-emerald-700 font-bold">{item.roomName || item.roomCode}</strong> {item.building && `(${item.building})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Ticket className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      SBD: <strong className="text-indigo-700 font-bold">{item.examNumber || item.registrationNumber || 'Chưa cấp'}</strong> · Ghế: <strong className="text-indigo-700 font-bold">{item.seatNumber || 'Chưa xếp'}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {item.examType === 'TRAC_NGHIEM' && (
                    <button
                      onClick={() => router.push(`/student/online-exam/${item.examScheduleId || item.scheduleId || item.id}/lobby`)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl shadow-xs transition"
                    >
                      <span>Thi Trực Tuyến</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDrawerSchedule(item)}
                    className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-3 py-1.5 rounded-xl transition ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Schedule Detail Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSchedule)}
        onClose={() => setDrawerSchedule(null)}
        title={drawerSchedule?.subjectName || ''}
        subtitle={`Mã môn: ${drawerSchedule?.subjectCode}`}
        avatarText="LT"
        badge={{
          label: drawerSchedule?.periodName || 'Kỳ thi',
          className: 'bg-sky-50 text-sky-700 border-sky-200',
        }}
        details={[
          { label: 'Môn thi', value: drawerSchedule?.subjectName, icon: BookOpen },
          { label: 'Mã môn', value: drawerSchedule?.subjectCode },
          { label: 'Kỳ thi', value: drawerSchedule?.periodName },
          { label: 'Ngày thi', value: drawerSchedule?.examDate ? new Date(drawerSchedule.examDate).toLocaleDateString('vi-VN') : '', icon: Calendar },
          { label: 'Thời gian làm bài', value: `${drawerSchedule?.startTime} - ${drawerSchedule?.endTime}`, icon: Clock },
          { label: 'Phòng thi', value: drawerSchedule?.roomName || drawerSchedule?.roomCode, icon: DoorOpen },
          { label: 'Tòa nhà / Địa điểm', value: drawerSchedule?.building || 'Nhà A1', icon: MapPin },
          { label: 'Số báo danh (SBD)', value: drawerSchedule?.examNumber || drawerSchedule?.registrationNumber || 'Đã cấp tự động', icon: Ticket },
          { label: 'Vị trí chỗ ngồi', value: drawerSchedule?.seatNumber ? `Ghế số ${drawerSchedule.seatNumber}` : 'Đã phân chỗ' },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
