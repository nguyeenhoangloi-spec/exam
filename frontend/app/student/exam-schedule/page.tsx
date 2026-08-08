'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { downloadCsv } from '../../../lib/export-csv';
import { printReport } from '../../../lib/export-print';
import { Toast } from '../../../components/Toast';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import { TabBar } from '../../../components/ui/TabBar';
import {
  BookMarked,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  Printer,
  Award,
  BookOpen,
  DoorOpen,
  CheckCircle2,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { PersonalScheduleItem } from '../../../types';

export default function StudentExamSchedulePage() {
  usePageTitle('Lịch thi Cá nhân Sinh viên');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<PersonalScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerSchedule, setDrawerSchedule] = useState<PersonalScheduleItem | null>(null);
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      setLoading(true);
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
          )}","${s.startTime} - ${s.endTime}","${s.roomName || s.roomCode}","${s.examNumber || s.registrationNumber || ''}","${s.seatNumber || ''
          }"`,
      )
      .join('\n');
    downloadCsv('lich_thi_ca_nhan_sinh_vien.csv', headers + rows);
  };

  const handlePrintReport = () => {
    printReport({
      title: 'LỊCH THI CÁ NHÂN SINH VIÊN',
      subtitle: `Thí sinh: ${currentUser?.username || ''} - Thông tin ca thi và số báo danh`,
      metaInfo: [
        { label: 'Tổng số môn đăng ký thi', value: String(schedules.length) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Kỳ thi', width: '130px' },
        { header: 'Mã môn', width: '80px', align: 'center' },
        { header: 'Tên môn thi', width: '180px' },
        { header: 'Ngày thi', width: '100px', align: 'center' },
        { header: 'Khung giờ', width: '110px', align: 'center' },
        { header: 'Phòng thi', width: '80px', align: 'center' },
        { header: 'SBD / Ghế', width: '90px', align: 'center' },
      ],
      rows: schedules.map((s, idx) => [
        idx + 1,
        s.periodName,
        s.subjectCode,
        s.subjectName,
        new Date(s.examDate).toLocaleDateString('vi-VN'),
        `${s.startTime} - ${s.endTime}`,
        s.roomName || s.roomCode,
        `SBN-${s.seatNumber || idx + 1} (Ghế #${s.seatNumber || idx + 1})`,
      ]),
      signers: [
        { title: 'SINH VIÊN KÝ TÊN', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'XÁC NHẬN CỦA HỘI ĐỒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu)' }
      ]
    });
  };

  const roomAssignedCount = schedules.filter((s) => Boolean(s.roomCode || s.roomName)).length;
  const tracNghiemCount = schedules.filter((s) => s.examType === 'TRAC_NGHIEM').length;
  const sbdCount = schedules.filter((s) => Boolean(s.examNumber || s.registrationNumber)).length;

  const KPI = [
    { label: 'Tổng số môn thi', value: `${schedules.length} môn`, subtext: 'Học kỳ hiện tại', icon: Calendar, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Đã xếp phòng thi', value: `${roomAssignedCount} môn`, subtext: 'Theo lịch thi chuẩn', icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Thi trắc nghiệm', value: `${tracNghiemCount} môn`, subtext: 'Làm bài trực tuyến', icon: BookOpen, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Đã cấp số báo danh', value: `${sbdCount} thí sinh`, subtext: 'Đã duyệt SBD & Ghế', icon: Award, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
  ];

  const modeCounts = useMemo(() => {
    let all = 0, official = 0, mock = 0;
    schedules.forEach((s) => {
      all++;
      if (s.mode === 'MOCK') mock++;
      else official++;
    });
    return { all, official, mock };
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const todayTime = new Date().setHours(0, 0, 0, 0);

    return schedules.filter((s) => {
      const isExpired = new Date(s.examDate).getTime() < todayTime;

      // 1. Mode Filter (Chính thức / Thi thử)
      if (modeFilter !== 'ALL') {
        if (modeFilter === 'OFFICIAL' && s.mode === 'MOCK') return false;
        if (modeFilter === 'MOCK' && s.mode !== 'MOCK') return false;
      }

      // 2. Status Filter (Sắp thi / Đã thi)
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'UPCOMING' && isExpired) return false;
        if (statusFilter === 'COMPLETED' && !isExpired) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (s.subjectCode || '').toLowerCase();
        const name = (s.subjectName || '').toLowerCase();
        const period = (s.periodName || '').toLowerCase();
        const room = (s.roomName || s.roomCode || '').toLowerCase();
        return code.includes(q) || name.includes(q) || period.includes(q) || room.includes(q);
      }

      return true;
    });
  }, [schedules, modeFilter, statusFilter, searchQuery]);

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lịch Thi Cá Nhân Sinh Viên
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Sinh viên: <strong className="text-slate-800 font-extrabold">{currentUser?.fullName || currentUser?.username || '---'}</strong> ({currentUser?.code || currentUser?.username || '---'}) &nbsp;•&nbsp; Kiểm tra phòng thi, SBD và số ghế trước giờ thi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>In Lịch Thi</span>
            </button>
          </div>
        </div>

        {/* ── 2. Standard 4 KPI Cards Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI.map(({ label, value, subtext, icon: Icon, iconBg }) => (
            <div
              key={label}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
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

        {/* Mode & Status Tabs Bar */}
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả ca thi', count: modeCounts.all },
            { key: 'OFFICIAL', label: 'Thi chính thức', count: modeCounts.official },
            { key: 'MOCK', label: 'Thi thử', count: modeCounts.mock },
          ]}
          active={modeFilter}
          onChange={setModeFilter}
        />

        {/* Status Dropdown & Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full max-w-lg">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shrink-0 transition shadow-2xs"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="COMPLETED">Đã kết thúc</option>
            </select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm môn thi, kỳ thi, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 pl-9 pr-8 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Schedule List / Grid */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Đang tra cứu lịch thi cá nhân...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <BookMarked className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800">Không tìm thấy lịch thi nào</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm">
              Không có ca thi nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchedules.map((item) => (
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
                      {item.mode === 'MOCK' ? (
                        <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          Thi thử
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          Chính thức
                        </span>
                      )}
                      <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {item.periodName}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                    {item.subjectName}
                  </h3>

                  {/* Details grid */}
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
                        Khung giờ:
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
                        {item.roomName || item.roomCode || 'Tự do'} {item.building ? `(${item.building})` : ''}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Ticket className="w-3.5 h-3.5 text-blue-500" />
                        SBD / Ghế:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        <strong className="text-blue-700">{item.examNumber || item.registrationNumber || (item.mode === 'MOCK' ? 'Tự do' : 'Chưa cấp')}</strong>
                        <span className="text-slate-400 mx-1">·</span>
                        Ghế #{item.seatNumber || 'Chưa xếp'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/student/online-exam/${item.examScheduleId || item.scheduleId || item.id}/lobby`)}
                    className={[
                      'inline-flex items-center gap-1.5 text-xs font-black text-white px-4 py-2 rounded-xl shadow-xs transition cursor-pointer active:scale-95',
                      item.mode === 'MOCK'
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
                    ].join(' ')}
                  >
                    <span>{item.mode === 'MOCK' ? 'Vào Thi Thử' : 'Vào Phòng Thi Online'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerSchedule(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-xl transition cursor-pointer ml-auto"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    Chi tiết
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
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Môn thi', value: drawerSchedule?.subjectName, icon: BookOpen },
          { label: 'Mã môn', value: drawerSchedule?.subjectCode },
          { label: 'Kỳ thi', value: drawerSchedule?.periodName },
          { label: 'Ngày thi', value: drawerSchedule?.examDate ? new Date(drawerSchedule.examDate).toLocaleDateString('vi-VN') : '', icon: Calendar },
          { label: 'Thời gian làm bài', value: `${drawerSchedule?.startTime} - ${drawerSchedule?.endTime}`, icon: Clock },
          { label: 'Phòng thi', value: drawerSchedule?.roomName || drawerSchedule?.roomCode, icon: DoorOpen },
          { label: 'Tòa nhà / Địa điểm', value: drawerSchedule?.building || 'Chưa cập nhật', icon: MapPin },
          { label: 'Số báo danh (SBD)', value: drawerSchedule?.examNumber || drawerSchedule?.registrationNumber || 'Đã cấp tự động', icon: Ticket },
          { label: 'Vị trí chỗ ngồi', value: drawerSchedule?.seatNumber ? `Ghế số ${drawerSchedule.seatNumber}` : 'Chưa xếp chỗ' },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
