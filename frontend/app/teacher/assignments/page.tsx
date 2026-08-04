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
  Download,
  Award,
  BookOpen,
  DoorOpen,
  UserCheck,
  Eye,
  Printer,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerDuty, setDrawerDuty] = useState<any | null>(null);

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

  const handleUpdateStatus = async (id: number, status: string) => {
    setBusyId(id);
    try {
      await api.patch(`/teachers/my-assignments/${id}/status`, { status });
      setToast({
        message: status === 'CONFIRMED' ? 'Đã xác nhận tham gia ca coi thi!' : 'Đã gửi yêu cầu xin đổi ca coi thi.',
        type: 'success',
      });
      await fetchMyAssignments();
    } catch (err: any) {
      setToast({ message: err.message || 'Cập nhật trạng thái thất bại.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handlePrintAttendance = async (item: any) => {
    try {
      const res = await api.get(`/teachers/my-assignments/${item.id}/attendance-sheet`);
      const data = res.data;
      const printWin = window.open('', '_blank');
      if (!printWin) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>BẢNG ĐIỂM DANH THÍ SINH PHÒNG THI ${data.room.roomCode}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; font-size: 13px; color: #1e293b; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
            .header p { margin: 4px 0 0 0; font-size: 13px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #334155; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; text-transform: uppercase; font-size: 11px; }
            .center { text-align: center; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
            .sig-box { width: 45%; }
            @media print { body { margin: 15mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>DANH SÁCH ĐIỂM DANH & KÝ TÊN THÍ SINH</h2>
            <p>HỌC KỲ ${data.schedule.periodName || 'HỌC KỲ I'} - MÔN: ${data.schedule.subjectName.toUpperCase()}</p>
          </div>

          <div class="info-grid">
            <div><strong>Mã môn:</strong> ${data.schedule.subjectCode}</div>
            <div><strong>Ngày thi:</strong> ${new Date(data.schedule.examDate).toLocaleDateString('vi-VN')}</div>
            <div><strong>Ca thi / Thời gian:</strong> ${data.schedule.startTime} - ${data.schedule.endTime}</div>
            <div><strong>Phòng thi:</strong> ${data.room.roomCode} (${data.room.building || 'Nhà A'})</div>
            <div><strong>Giám thị phân công:</strong> ${data.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2'}</div>
            <div><strong>Tổng thí sinh:</strong> ${data.students.length} thí sinh</div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="center" style="width: 40px">STT</th>
                <th class="center" style="width: 50px">SBD</th>
                <th class="center" style="width: 50px">Số ghế</th>
                <th style="width: 100px">Mã sinh viên</th>
                <th>Họ và Tên</th>
                <th style="width: 90px">Lớp</th>
                <th class="center" style="width: 120px">Chữ ký thí sinh</th>
                <th style="width: 80px">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${(data.students || [])
                .map(
                  (st: any, idx: number) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td class="center"><strong>${st.examNumber || idx + 1}</strong></td>
                  <td class="center">${st.seatNumber}</td>
                  <td><strong>${st.studentCode}</strong></td>
                  <td>${st.fullName}</td>
                  <td>${st.className}</td>
                  <td></td>
                  <td></td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              <p><strong>CÁN BỘ COI THI 1</strong></p>
              <br/><br/><br/>
              <p><i>(Ký và ghi rõ họ tên)</i></p>
            </div>
            <div class="sig-box">
              <p><strong>CÁN BỘ COI THI 2</strong></p>
              <br/><br/><br/>
              <p><i>(Ký và ghi rõ họ tên)</i></p>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `;

      printWin.document.write(html);
      printWin.document.close();
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tải danh sách điểm danh.', type: 'error' });
    }
  };

  const exportCsv = () => {
    const headers = 'Mã môn,Tên môn thi,Vai trò,Trạng thái,Ngày thi,Thời gian,Phòng thi,Địa điểm\n';
    const rows = assignments
      .map(
        (a) =>
          `"${a.subjectCode}","${a.subjectName}","${a.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}","${
            a.status === 'CONFIRMED' ? 'Đã xác nhận' : a.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận'
          }","${new Date(a.examDate).toLocaleDateString('vi-VN')}","${a.startTime} - ${a.endTime}","${
            a.roomName || a.roomCode
          }","${a.building || ''}"`,
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
  const confirmedCount = assignments.filter((a) => a.status === 'CONFIRMED').length;

  const kpiItems: KPICardItem[] = [
    { title: 'Tổng ca coi thi', value: assignments.length, subtext: 'Học kỳ hiện tại', icon: Calendar, color: 'sky' },
    { title: 'Giám thị 1 (Chính)', value: sup1Count, subtext: 'Chịu trách nhiệm phòng', icon: ShieldCheck, color: 'emerald', trend: 'Đạt chuẩn' },
    { title: 'Đã xác nhận ca', value: `${confirmedCount}/${assignments.length}`, subtext: 'Sẵn sàng gác thi', icon: CheckCircle2, color: 'indigo' },
    { title: 'Quy chế coi thi', value: 'Có mặt -15p', subtext: 'Điểm danh thí sinh', icon: Award, color: 'purple' },
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
              <span>Xuất CSV Lịch Coi Thi</span>
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
            {assignments.map((item) => {
              const examTime = new Date(item.examDate).getTime();
              const todayTime = new Date().setHours(0, 0, 0, 0);
              const isExpired = examTime < todayTime;
              const isLocked = item.status === 'CONFIRMED' || item.status === 'CHANGE_REQUESTED' || isExpired;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 relative overflow-hidden hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      {item.subjectCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'CHANGE_REQUESTED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isExpired
                          ? '🔒 Quá hạn ca thi'
                          : item.status === 'CONFIRMED'
                          ? '🔒 Đã xác nhận (Đã khóa)'
                          : item.status === 'CHANGE_REQUESTED'
                          ? '🔒 Xin đổi ca (Đã khóa)'
                          : '⏳ Chờ xác nhận'}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.role === 'SUPERVISOR_1'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {item.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
                      </span>
                    </div>
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

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        disabled={busyId === item.id || isLocked}
                        onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status === 'CONFIRMED' ? 'Đã khóa ca thi' : 'Xác nhận nhận ca'}
                      </button>

                      <button
                        disabled={busyId === item.id || isLocked}
                        onClick={() => handleUpdateStatus(item.id, 'CHANGE_REQUESTED')}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Xin đổi ca
                      </button>
                    </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handlePrintAttendance(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-sky-600" /> In Danh sách điểm danh
                    </button>

                    <button
                      onClick={() => setDrawerDuty(item)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
          { label: 'Trạng thái ca coi thi', value: drawerDuty?.status === 'CONFIRMED' ? 'Đã xác nhận ca thi' : drawerDuty?.status === 'CHANGE_REQUESTED' ? 'Đã gửi yêu cầu đổi ca' : 'Chờ xác nhận', icon: CheckCircle2 },
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
