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
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
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
 SlidersHorizontal,
 ChevronDown,
 List,
 LayoutGrid,
 Layers,
 Check,
} from 'lucide-react';
import { SortDropdown } from '../../../components/ui/SortDropdown';
import { ColumnToggleDropdown } from '../../../components/ui/ColumnToggleDropdown';

export default function TeacherAssignmentsPage() {
 usePageTitle('Lịch coi thi Giảng viên');
 const router = useRouter();
 const [currentUser, setCurrentUser] = useState<any>(null);
 const [assignments, setAssignments] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [busyId, setBusyId] = useState<number | null>(null);
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
 const [drawerDuty, setDrawerDuty] = useState<any | null>(null);

 // Toolbar Controls State
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    setIsSpinning(true);
    await fetchMyAssignments();
    setTimeout(() => setIsSpinning(false), 500);
  };

 const [sortOrder, setSortOrder] = useState<string>('newest');
 const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
 const [openColumnMenu, setOpenColumnMenu] = useState(false);
 const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
   period: true,
   subject: true,
   time: true,
   room: true,
   role: true,
   status: true,
   actions: true,
 });

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
 body { font-family: 'Times New Roman', Times, serif; margin: 30px; font-size: 13px; color: #1e293b; }
 .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
 .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
 .header p { margin: 4px 0 0 0; font-size: 13px; font-weight: bold; }
 .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 13px; }
 table { width: 100%; border-collapse: collapse; margin-top: 10px; }
 th, td { border: 1px solid #334155; padding: 8px 10px; text-align: left; }
 th { background-color: #f1f5f9; text-transform: uppercase; font-size: 12px; }
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
    {
      label: 'Tổng ca coi thi',
      value: `${assignments.length} ca`,
      subtext: 'Học kỳ hiện tại',
      progressPercent: assignments.length > 0 ? 100 : 0,
      icon: Calendar,
    },
    {
      label: 'Giám thị 1 (Chính)',
      value: `${sup1Count} ca`,
      subtext: 'Chịu trách nhiệm phòng',
      progressPercent: assignments.length > 0 ? Math.round((sup1Count / assignments.length) * 100) : 0,
      icon: ShieldCheck,
    },
    {
      label: 'Đã xác nhận ca',
      value: `${confirmedCount}/${assignments.length} ca`,
      subtext: 'Sẵn sàng gác thi',
      progressPercent: assignments.length > 0 ? Math.round((confirmedCount / assignments.length) * 100) : 100,
      icon: CheckCircle2,
    },
    {
      label: 'Thời gian tập trung',
      value: 'Trước 15p',
      subtext: 'Chuẩn bị & điểm danh',
      progressPercent: 100,
      icon: Clock,
    },
  ];

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-0.5">
            <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Lịch Phân Công Coi Thi
            </h1>
            <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
              Giảng viên: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{currentUser?.fullName || currentUser?.username || '---'}</strong> <IdentifierBadge tone="neutral">{currentUser?.code || currentUser?.username || '---'}</IdentifierBadge> &nbsp;•&nbsp; Danh sách ca coi thi được phân công trong học kỳ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={exportCsv}
              leftIcon={<Download className="h-4 w-4 text-slate-500" />}
            >
              Xuất CSV
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handlePrintReport}
              leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
            >
              In Lịch Coi Thi
            </Button>
          </div>
        </div>

        {/* KPI Cards — Standardized White Flat Cards with Micro Progress Tracks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {KPI.map(({ label, value, subtext, progressPercent, icon: Icon }) => (
            <div
              key={label}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {label}
                  </span>
                  <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                    {value}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={subtext}
                  className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {subtext}
                </span>
              </div>
            </div>
          ))}
        </div>

  {/* Table Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{assignments.length.toLocaleString('vi-VN')}</span> ca coi thi
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <SortDropdown
              value={sortOrder}
              onChange={(val) => setSortOrder(val)}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'name_asc', label: 'Môn thi: A - Z' },
              ]}
            />

            {/* Column Selector */}
            <ColumnToggleDropdown
              columns={[
                { key: 'period', label: 'Kỳ thi' },
                { key: 'subject', label: 'Môn thi' },
                { key: 'time', label: 'Thời gian' },
                { key: 'room', label: 'Phòng thi' },
                { key: 'role', label: 'Vai trò' },
                { key: 'status', label: 'Trạng thái' },
                { key: 'actions', label: 'Thao tác' },
              ]}
              visibleColumns={visibleColumns}
              onToggle={(key) => setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
            />

            {/* View Mode Pills */}
            <div className="h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Dạng thẻ"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Dạng danh sách"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Dạng thu gọn"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefreshClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
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
 <h3 className="text-base font-semibold text-slate-800">Chưa có lịch coi thi nào</h3>
 <p className="text-xs font-medium text-slate-500 max-w-sm">
 Hiện tại Thầy/Cô chưa có lịch phân công coi thi mới trong học kỳ này.
 </p>
 </div>
  ) : viewMode === 'compact' ? (
    /* ── 5.1 Compact View Mode (Dạng thu gọn 1 dòng per item) ── */
    <div className="space-y-2">
      {assignments.map((item) => {
        const examTime = new Date(item.examDate).getTime();
        const todayTime = new Date().setHours(0, 0, 0, 0);
        const isExpired = examTime < todayTime;
        const isLocked = item.status === 'CONFIRMED' || item.status === 'CHANGE_REQUESTED' || isExpired;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs hover:border-blue-300 hover:shadow-xs transition gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">
                {item.subjectCode?.slice(0, 3) || 'HP'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-semibold text-slate-900 truncate">{item.subjectName}</h4>
                  <IdentifierBadge>{item.subjectCode}</IdentifierBadge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {new Date(item.examDate).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {item.startTime} - {item.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.roomName || <IdentifierBadge tone="neutral">{item.roomCode}</IdentifierBadge>}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge
                status={isExpired ? 'CANCELLED' : item.status === 'CONFIRMED' ? 'CONFIRMED' : item.status === 'CHANGE_REQUESTED' ? 'CHANGE_REQUESTED' : 'PENDING'}
                customLabel={isExpired ? 'Quá hạn ca' : item.status === 'CONFIRMED' ? 'Đã xác nhận' : item.status === 'CHANGE_REQUESTED' ? 'Xin đổi' : 'Chờ xác nhận'}
              />
              <Button
                variant={item.status === 'CONFIRMED' ? 'success' : 'primary'}
                size="xs"
                disabled={busyId === item.id || isLocked}
                isLoading={busyId === item.id}
                onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}
              >
                {item.status === 'CONFIRMED' ? 'Khóa' : 'Xác nhận'}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDrawerDuty(item)}
              >
                <Eye className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  ) : viewMode === 'list' ? (
    /* ── 5.2 List View Mode (Dạng bảng danh sách) ── */
    <div className="ui-table-wrap rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="ui-table w-full text-left text-[15px] text-slate-700 border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50 text-[14px] font-medium text-slate-700">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">STT</th>
              {visibleColumns.subject !== false && <th className="py-3.5 px-4 min-w-[200px]">Môn thi & Mã HP</th>}
              {visibleColumns.time !== false && <th className="py-3.5 px-4 whitespace-nowrap">Thời gian & Ca thi</th>}
              {visibleColumns.room !== false && <th className="py-3.5 px-4 whitespace-nowrap">Phòng thi / Tòa nhà</th>}
              {visibleColumns.role !== false && <th className="py-3.5 px-4 whitespace-nowrap">Vai trò</th>}
              {visibleColumns.status !== false && <th className="py-3.5 px-4 whitespace-nowrap">Trạng thái ca</th>}
              {visibleColumns.actions !== false && <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 text-[15px] font-normal">
            {assignments.map((item, idx) => {
              const examTime = new Date(item.examDate).getTime();
              const todayTime = new Date().setHours(0, 0, 0, 0);
              const isExpired = examTime < todayTime;
              const isLocked = item.status === 'CONFIRMED' || item.status === 'CHANGE_REQUESTED' || isExpired;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                  {visibleColumns.subject !== false && (
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{item.subjectName}</div>
                      <IdentifierBadge>{item.subjectCode}</IdentifierBadge>
                    </td>
                  )}
                  {visibleColumns.time !== false && (
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{new Date(item.examDate).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[15px] font-medium text-blue-600">{item.startTime} - {item.endTime}</div>
                    </td>
                  )}
                  {visibleColumns.room !== false && (
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{item.roomName || <IdentifierBadge tone="neutral">{item.roomCode}</IdentifierBadge>}</div>
                      <div className="text-[15px] text-slate-500">{item.building || 'Nhà A1'}</div>
                    </td>
                  )}
                  {visibleColumns.role !== false && (
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                      {item.role === 'SUPERVISOR_1' ? (
                        <span className="text-blue-700 font-medium">Giám thị 1</span>
                      ) : (
                        <span className="text-slate-600">Giám thị 2</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.status !== false && (
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge
                        status={isExpired ? 'CANCELLED' : item.status === 'CONFIRMED' ? 'CONFIRMED' : item.status === 'CHANGE_REQUESTED' ? 'CHANGE_REQUESTED' : 'PENDING'}
                        customLabel={isExpired ? 'Quá hạn ca thi' : item.status === 'CONFIRMED' ? 'Đã xác nhận' : item.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận'}
                      />
                    </td>
                  )}
                  {visibleColumns.actions !== false && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant={item.status === 'CONFIRMED' ? 'success' : 'primary'}
                          size="xs"
                          disabled={busyId === item.id || isLocked}
                          isLoading={busyId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}
                        >
                          {item.status === 'CONFIRMED' ? 'Đã khóa' : 'Xác nhận'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handlePrintAttendance(item)}
                          title="Điểm danh A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDrawerDuty(item)}
                          title="Chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    /* ── 5.3 Grid View Mode ── */
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
 <IdentifierBadge>{item.subjectCode}</IdentifierBadge>
 <div className="flex items-center gap-1.5">
 <StatusBadge
 status={isExpired ? 'CANCELLED' : item.status === 'CONFIRMED' ? 'CONFIRMED' : item.status === 'CHANGE_REQUESTED' ? 'CHANGE_REQUESTED' : 'PENDING'}
 customLabel={isExpired ? 'Quá hạn ca thi' : item.status === 'CONFIRMED' ? 'Đã xác nhận' : item.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận'}
 />
 <span className="text-[13px] font-semibold text-slate-600">
 {item.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
 </span>
 </div>
 </div>

 {/* Subject name */}
 <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
 {item.subjectName}
 </h3>

 {/* Details box */}
 <div className="space-y-2 text-xs text-slate-600 font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
 <div className="flex items-center justify-between">
 <span className="flex items-center gap-2 text-slate-500">
 <Calendar className="w-3.5 h-3.5 text-blue-500" />
 Ngày thi:
 </span>
 <strong className="text-slate-800 font-semibold">
 {new Date(item.examDate).toLocaleDateString('vi-VN')}
 </strong>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-2 text-slate-500">
 <Clock className="w-3.5 h-3.5 text-blue-500" />
 Khung giờ ca:
 </span>
 <strong className="text-blue-700 font-semibold">
 {item.startTime} - {item.endTime}
 </strong>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-2 text-slate-500">
 <MapPin className="w-3.5 h-3.5 text-slate-400" />
 Phòng thi:
 </span>
 <strong className="text-slate-700 font-semibold">
 {item.roomName || <IdentifierBadge tone="neutral">{item.roomCode}</IdentifierBadge>} {item.building ? `(${item.building})` : ''}
 </strong>
 </div>
 </div>
 </div>

 {/* Actions Area */}
 <div className="pt-4 mt-3 border-t border-slate-100 space-y-2.5">
 {/* Confirmation buttons */}
 <div className="flex items-center justify-between gap-2.5">
 <Button
 variant={item.status === 'CONFIRMED' ? 'success' : 'primary'}
 size="sm"
 disabled={busyId === item.id || isLocked}
 isLoading={busyId === item.id}
 onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}
 leftIcon={<CheckCircle2 className="w-4 h-4" />}
 className="flex-1"
 >
 {item.status === 'CONFIRMED' ? 'Đã khóa ca' : 'Xác nhận ca'}
 </Button>

 <Button
 variant="warning"
 size="sm"
 disabled={busyId === item.id || isLocked}
 onClick={() => handleUpdateStatus(item.id, 'CHANGE_REQUESTED')}
 leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
 >
 {item.status === 'CHANGE_REQUESTED' ? 'Đã xin đổi' : 'Xin đổi ca'}
 </Button>
 </div>

 {/* Secondary print / detail links */}
 <div className="flex items-center justify-between pt-1">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handlePrintAttendance(item)}
 leftIcon={<Printer className="w-3.5 h-3.5 text-blue-600" />}
 >
 Điểm danh A4
 </Button>

 <Button
 variant="ghost"
 size="sm"
 onClick={() => setDrawerDuty(item)}
 leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
 >
 Chi tiết
 </Button>
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
 <Button
 variant="primary"
 size="md"
 onClick={() => drawerDuty?.examScheduleRoomId && router.push(`/teacher/proctor/${drawerDuty.examScheduleRoomId}`)}
 disabled={!drawerDuty?.examScheduleRoomId}
 leftIcon={<ExternalLink className="w-4 h-4" />}
 className="w-full"
 >
 Mở bảng giám thị Realtime phòng thi này
 </Button>
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
