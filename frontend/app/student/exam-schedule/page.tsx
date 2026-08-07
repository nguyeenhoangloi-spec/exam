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
    { label: 'Tổng số môn thi', value: `${schedules.length} môn`, subtext: 'Học kỳ hiện tại', icon: Calendar, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/60' },
    { label: 'Đã xếp phòng thi', value: `${roomAssignedCount} môn`, subtext: 'Theo lịch thi chuẩn', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/60' },
    { label: 'Thi trắc nghiệm', value: `${tracNghiemCount} môn`, subtext: 'Làm bài trực tuyến', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/60' },
    { label: 'Đã cấp số báo danh', value: `${sbdCount} thí sinh`, subtext: 'Đã duyệt SBD & Ghế', icon: Award, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200/60' },
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
        {/* Hero Banner matching Admin Dashboard style */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003896] via-[#0047BA] to-[#003082] p-6 text-white shadow-md">
          {/* 3D Isometric Vector Illustration Overlay */}
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-85">
            <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M160 20L300 80L160 140L20 80L160 20Z" fill="url(#grid-grad-sched)" fillOpacity="0.15" />
              <path d="M110 110L210 110L230 125L90 125L110 110Z" fill="#93C5FD" fillOpacity="0.4" />
              <path d="M120 60L200 60L200 110L120 110Z" fill="#1E3A8A" fillOpacity="0.7" rx="4" />
              <path d="M124 64L196 64L196 106L124 106Z" fill="#60A5FA" fillOpacity="0.5" />
              <path d="M210 40L260 20L290 50L240 70Z" fill="#FFFFFF" fillOpacity="0.85" />
              <rect x="230" y="38" width="30" height="3" rx="1.5" fill="#3B82F6" transform="rotate(-20 230 38)" />
              <rect x="235" y="46" width="25" height="3" rx="1.5" fill="#93C5FD" transform="rotate(-20 235 46)" />
              <circle cx="90" cy="50" r="14" fill="#34D399" fillOpacity="0.9" />
              <path d="M84 50L88 54L96 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="240" y="80" width="28" height="28" rx="6" fill="#F59E0B" fillOpacity="0.9" />
              <rect x="244" y="84" width="20" height="4" rx="1" fill="white" />
              <circle cx="248" cy="94" r="1.5" fill="white" />
              <circle cx="254" cy="94" r="1.5" fill="white" />
              <circle cx="260" cy="94" r="1.5" fill="white" />
              <defs>
                <linearGradient id="grid-grad-sched" x1="20" y1="20" x2="300" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-sky-200 text-[10.5px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3" />
                Lịch Thi Cá Nhân Sinh Viên
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                Danh sách ca thi & Số báo danh
              </h1>
              <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
                Vui lòng kiểm tra chính xác Mã môn thi, Ngày giờ thi, Phòng thi, Số Báo Danh và Số ghế trước khi đến phòng thi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrintReport}
                className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#003896] px-4 py-2.5 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#003896]" />
                <span>In Lịch thi A4</span>
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-2 rounded-xl bg-[#001E5C] hover:bg-[#001748] text-white px-4 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-xs border border-blue-400/20"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Tải .CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI.map(({ label, value, subtext, icon: Icon, color, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 shadow-2xs flex items-center justify-between`}>
              <div>
                <p className="text-[10.5px] font-semibold text-slate-500">{label}</p>
                <p className={`text-xl font-black ${color} leading-tight mt-0.5`}>{value}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{subtext}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 w-full max-w-xl">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shrink-0 shadow-2xs"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="COMPLETED">Đã kết thúc</option>
            </select>

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm môn thi, kỳ thi, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                        <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Thi thử
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
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
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        Phòng thi:
                      </span>
                      <strong className="text-emerald-700 font-bold">
                        {item.roomName || item.roomCode || 'Tự do'} {item.building ? `(${item.building})` : ''}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Ticket className="w-3.5 h-3.5 text-indigo-500" />
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
