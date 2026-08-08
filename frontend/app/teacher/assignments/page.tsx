'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { downloadCsv } from '../../../lib/export-csv';
import { printReport } from '../../../lib/export-print';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Download,
  Printer,
  Award,
  BookOpen,
  DoorOpen,
  UserCheck,
  Eye,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function TeacherAssignmentsPage() {
  usePageTitle('Lịch coi thi Giảng viên');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerDuty, setDrawerDuty] = useState<any | null>(null);
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
    onConfirm: () => { },
  });

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
      setLoading(true);
      const res = await api.get('/teachers/my-assignments');
      setAssignments(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải lịch coi thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (id: number, status: string) => {
    const item = assignments.find((a) => a.id === id);
    const isConfirm = status === 'CONFIRMED';
    setConfirmModal({
      isOpen: true,
      title: isConfirm ? 'Xác nhận tham gia ca coi thi' : 'Xin đổi ca coi thi',
      message: isConfirm
        ? `Bạn có chắc chắn xác nhận tham gia ca coi thi ${item?.subjectName || ''} (${item?.startTime || ''} - ${item?.endTime || ''}, phòng ${item?.roomName || item?.roomCode || ''})?`
        : `Bạn có chắc chắn gửi yêu cầu xin đổi ca coi thi ${item?.subjectName || ''} (${item?.startTime || ''} - ${item?.endTime || ''}, phòng ${item?.roomName || item?.roomCode || ''})?`,
      type: isConfirm ? 'success' : 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
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
      },
    });
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
          `"${a.subjectCode}","${a.subjectName}","${a.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}","${a.status === 'CONFIRMED' ? 'Đã xác nhận' : a.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận'
          }","${new Date(a.examDate).toLocaleDateString('vi-VN')}","${a.startTime} - ${a.endTime}","${a.roomName || a.roomCode
          }","${a.building || ''}"`,
      )
      .join('\n');
    downloadCsv('lich_coi_thi_giang_vien.csv', headers + rows);
  };

  const sup1Count = assignments.filter((a) => a.role === 'SUPERVISOR_1').length;
  const confirmedCount = assignments.filter((a) => a.status === 'CONFIRMED').length;

  const handlePrintReport = () => {
    printReport({
      title: 'LỊCH PHÂN CÔNG COI THI CÁ NHÂN GIẢNG VIÊN',
      subtitle: `Giảng viên: ${currentUser?.username || ''} - Tổng hợp các ca thi được phân công gác thi`,
      metaInfo: [
        { label: 'Tổng ca coi thi', value: String(assignments.length) },
        { label: 'Giám thị 1', value: String(sup1Count) },
        { label: 'Giám thị 2', value: String(assignments.length - sup1Count) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Tên môn thi', width: '180px' },
        { header: 'Mã môn', width: '90px', align: 'center' },
        { header: 'Ngày thi', width: '100px', align: 'center' },
        { header: 'Khung giờ', width: '110px', align: 'center' },
        { header: 'Phòng thi', width: '90px', align: 'center' },
        { header: 'Vai trò phân công', width: '110px', align: 'center' },
        { header: 'Trạng thái', width: '110px', align: 'center' },
      ],
      rows: assignments.map((a, idx) => [
        idx + 1,
        a.subjectName,
        a.subjectCode,
        new Date(a.examDate).toLocaleDateString('vi-VN'),
        `${a.startTime} - ${a.endTime}`,
        a.roomName || a.roomCode,
        a.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
        a.status === 'CONFIRMED' ? 'Đã xác nhận' : a.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận',
      ]),
    });
  };

  const KPI = [
    { label: 'Tổng ca coi thi', value: `${assignments.length} ca`, subtext: 'Học kỳ hiện tại', icon: Calendar, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Giám thị 1 (Chính)', value: `${sup1Count} ca`, subtext: 'Chịu trách nhiệm phòng', icon: ShieldCheck, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Đã xác nhận ca', value: `${confirmedCount}/${assignments.length} ca`, subtext: 'Sẵn sàng gác thi', icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Thời gian tập trung', value: 'Trước 15p', subtext: 'Chuẩn bị & điểm danh', icon: Clock, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
  ];

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Hero Banner matching Admin Dashboard style */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 p-6 text-white shadow-md">
          {/* 3D Isometric Vector Illustration Overlay */}
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-85">
            <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M160 20L300 80L160 140L20 80L160 20Z" fill="url(#grid-grad-assign)" fillOpacity="0.15" />
              <path d="M110 110L210 110L230 125L90 125L110 110Z" fill="#93C5FD" fillOpacity="0.4" />
              <path d="M120 60L200 60L200 110L120 110Z" fill="#1E3A8A" fillOpacity="0.7" rx="4" />
              <path d="M124 64L196 64L196 106L124 106Z" fill="#60A5FA" fillOpacity="0.5" />
              <path d="M210 40L260 20L290 50L240 70Z" fill="#FFFFFF" fillOpacity="0.85" />
              <rect x="230" y="38" width="30" height="3" rx="1.5" fill="#3B82F6" transform="rotate(-20 230 38)" />
              <rect x="235" y="46" width="25" height="3" rx="1.5" fill="#93C5FD" transform="rotate(-20 235 46)" />
              <circle cx="90" cy="50" r="14" fill="#34D399" fillOpacity="0.9" />
              <path d="M84 50L88 54L96 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="240" y="80" width="28" height="28" rx="6" fill="#3B82F6" fillOpacity="0.9" />
              <rect x="244" y="84" width="20" height="4" rx="1" fill="white" />
              <circle cx="248" cy="94" r="1.5" fill="white" />
              <circle cx="254" cy="94" r="1.5" fill="white" />
              <circle cx="260" cy="94" r="1.5" fill="white" />
              <defs>
                <linearGradient id="grid-grad-assign" x1="20" y1="20" x2="300" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-blue-200 text-[10.5px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3" />
                Lịch Phân Công Coi Thi
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                Chào Thầy/Cô {currentUser?.username || ''}
              </h1>
              <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
                Danh sách các ca coi thi được phân công. Vui lòng kiểm tra lịch thi và có mặt tại phòng thi trước 15 phút.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrintReport}
                className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-blue-700 px-4 py-2.5 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-700" />
                <span>In Lịch coi thi</span>
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-xs border border-blue-400/20"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards — Standardized White Flat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI.map(({ label, value, subtext, icon: Icon, iconBg }) => (
            <div
              key={label}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {label}
                  </span>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    {value}
                  </p>
                </div>

                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg} transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <span className="text-[10.5px] font-semibold text-slate-400 mt-2">
                {subtext}
              </span>
            </div>
          ))}
        </div>

        {/* Assignments List / Grid */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Đang tra cứu lịch coi thi...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800">Chưa có lịch coi thi nào</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm">
              Hiện tại Thầy/Cô chưa có lịch phân công coi thi mới trong học kỳ này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((item) => {
              const examTime = new Date(item.examDate).getTime();
              const todayTime = new Date().setHours(0, 0, 0, 0);
              const isExpired = examTime < todayTime;
              const isLocked = item.status === 'CONFIRMED' || item.status === 'CHANGE_REQUESTED' || isExpired;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-5 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition duration-200 relative overflow-hidden group"
                >
                  <div className="space-y-3.5">
                    {/* Card top badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {item.subjectCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${isExpired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'CHANGE_REQUESTED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                          {isExpired
                            ? 'Quá hạn ca thi'
                            : item.status === 'CONFIRMED'
                              ? 'Đã xác nhận'
                              : item.status === 'CHANGE_REQUESTED'
                                ? 'Xin đổi ca'
                                : 'Chờ xác nhận'}
                        </span>
                        <span
                          className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${item.role === 'SUPERVISOR_1'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                        >
                          {item.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
                        </span>
                      </div>
                    </div>

                    {/* Subject name */}
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                      {item.subjectName}
                    </h3>

                    {/* Details box */}
                    <div className="space-y-2 text-xs text-slate-600 font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          Ngày thi:
                        </span>
                        <strong className="text-slate-800 font-bold">
                          {new Date(item.examDate).toLocaleDateString('vi-VN')}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          Khung giờ ca:
                        </span>
                        <strong className="text-blue-700 font-bold">
                          {item.startTime} - {item.endTime}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Phòng thi:
                        </span>
                        <strong className="text-slate-700 font-bold">
                          {item.roomName || item.roomCode} {item.building ? `(${item.building})` : ''}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-4 mt-3 border-t border-slate-100 space-y-2.5">
                    {/* Confirmation buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id || isLocked}
                        onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status === 'CONFIRMED' ? 'Đã khóa ca' : 'Xác nhận ca'}
                      </button>

                      <button
                        type="button"
                        disabled={busyId === item.id || isLocked}
                        onClick={() => handleUpdateStatus(item.id, 'CHANGE_REQUESTED')}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Xin đổi ca
                      </button>
                    </div>

                    {/* Secondary print / detail links */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handlePrintAttendance(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Điểm danh A4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDrawerDuty(item)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Chi tiết</span>
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
          className: drawerDuty?.role === 'SUPERVISOR_1' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200',
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
        extraSections={[
          {
            title: 'Xử lý vi phạm & Giám sát trực tuyến',
            content: (
              <button
                type="button"
                onClick={() => drawerDuty?.examScheduleRoomId && router.push(`/teacher/proctor/${drawerDuty.examScheduleRoomId}`)}
                disabled={!drawerDuty?.examScheduleRoomId}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở bảng giám thị Realtime phòng thi này</span>
              </button>
            ),
          },
        ]}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
