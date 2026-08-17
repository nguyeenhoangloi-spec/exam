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
import { Button } from '../../../components/ui/Button';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
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
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import { PersonalScheduleItem } from '../../../types';

export default function StudentExamSchedulePage() {
  usePageTitle('Lịch thi cá nhân');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
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
      const [scheduleRes, profileRes] = await Promise.allSettled([
        api.get('/students/my-schedule'),
        api.get('/students/my-curriculum'),
      ]);
      if (scheduleRes.status === 'fulfilled') {
        setSchedules(scheduleRes.value.data || []);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value.data?.student) {
        setStudentInfo(profileRes.value.data.student);
      }
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
        { title: 'XÁC NHẬN CỦA HỘI ĐỒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu)' },
      ],
    });
  };

  const roomAssignedCount = schedules.filter((s) => Boolean(s.roomCode || s.roomName)).length;
  const tracNghiemCount = schedules.filter((s) => s.examType === 'TRAC_NGHIEM').length;
  const sbdCount = schedules.filter((s) => Boolean(s.examNumber || s.registrationNumber)).length;

  const KPI = [
    {
      label: 'Tổng số môn thi',
      value: `${schedules.length} môn`,
      subtext: 'Học kỳ hiện tại',
      progressPercent: schedules.length > 0 ? 100 : 0,
      icon: Calendar,
    },
    {
      label: 'Đã xếp phòng thi',
      value: `${roomAssignedCount} môn`,
      subtext: 'Theo lịch thi chuẩn',
      progressPercent: schedules.length > 0 ? Math.round((roomAssignedCount / schedules.length) * 100) : 100,
      icon: CheckCircle2,
    },
    {
      label: 'Thi trắc nghiệm',
      value: `${tracNghiemCount} môn`,
      subtext: 'Làm bài trực tuyến',
      progressPercent: schedules.length > 0 ? Math.round((tracNghiemCount / schedules.length) * 100) : 0,
      icon: BookOpen,
    },
    {
      label: 'Đã cấp số báo danh',
      value: `${sbdCount} ca thi`,
      subtext: 'Đã duyệt SBD & Ghế',
      progressPercent: schedules.length > 0 ? Math.round((sbdCount / schedules.length) * 100) : 0,
      icon: Award,
    },
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

    return schedules
      .filter((s) => {
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
      })
      .sort((a, b) => {
        const timeA = new Date(a.examDate || 0).getTime();
        const timeB = new Date(b.examDate || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (b.startTime || '').localeCompare(a.startTime || '');
      });
  }, [schedules, modeFilter, statusFilter, searchQuery]);

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-0.5">
            <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Lịch thi cá nhân
            </h1>
            <div className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Sinh viên: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.fullName || currentUser?.student?.fullName || (currentUser as any)?.fullName || currentUser?.username || '---'}</strong> <IdentifierBadge tone="neutral">{studentInfo?.studentCode || currentUser?.student?.studentCode || currentUser?.code || currentUser?.username || '---'}</IdentifierBadge>
              </span>
              <span>
                Lớp: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{studentInfo?.className || studentInfo?.classCode || currentUser?.student?.class?.name || currentUser?.student?.className || (currentUser as any)?.className || '---'}</strong>
              </span>
              <span>
                Khoa: <span className="text-slate-700 dark:text-slate-300 font-medium">{studentInfo?.departmentName || studentInfo?.departmentCode || currentUser?.student?.class?.department?.name || currentUser?.student?.departmentName || (currentUser as any)?.departmentName || '---'}</span>
              </span>
            </div>
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
              In Lịch Thi
            </Button>
          </div>
        </div>

        {/* ── 2. Standard 4 KPI Cards Row With Micro Progress Tracks ── */}
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
                  <div className="text-[32px] font-semibold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
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

        {/* ── Status Tabs & Search Row (Chuẩn /exam-papers & /teacher/regrade) ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-1">
          <TabBar
            tabs={[
              { key: 'ALL', label: 'Tất cả ca thi', count: modeCounts.all },
              { key: 'OFFICIAL', label: 'Thi chính thức', count: modeCounts.official },
              { key: 'MOCK', label: 'Thi thử', count: modeCounts.mock },
            ]}
            active={modeFilter}
            onChange={setModeFilter}
            className="border-b-0 w-auto pt-0"
          />

          <div className="flex items-center gap-2 shrink-0 pb-1 lg:pb-0">
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm môn thi, kỳ thi, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <FilterSelect
              size="sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="COMPLETED">Đã kết thúc</option>
            </FilterSelect>

            {(searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setModeFilter('ALL');
                }}
                className="h-9 px-2.5 flex items-center gap-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                title="Xóa tất cả bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Schedule List / Grid */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Đang tra cứu lịch thi cá nhân...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BookMarked className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy lịch thi nào</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm">
              Không có ca thi nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchedules.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition duration-200 relative overflow-hidden group"
              >
                <div className="space-y-3.5">
                  {/* Card top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <IdentifierBadge>{item.subjectCode}</IdentifierBadge>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[180px]" title={item.periodName}>
                        {item.periodName}
                      </span>
                      {item.mode === 'MOCK' ? (
                        <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                          Thi thử
                        </span>
                      ) : (
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                          Chính thức
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setDrawerSchedule(item)}
                    className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition line-clamp-1 cursor-pointer"
                    title="Xem chi tiết ca thi"
                  >
                    {item.subjectName}
                  </h3>

                  {/* Details grid */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Ngày thi:
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {new Date(item.examDate).toLocaleDateString('vi-VN')}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Khung giờ:
                      </span>
                      <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                        {item.startTime} - {item.endTime}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Phòng thi:
                      </span>
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                        {item.roomName || (item.roomCode ? <IdentifierBadge tone="neutral">{item.roomCode}</IdentifierBadge> : 'Tự do')} {item.building ? `(${item.building})` : ''}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Ticket className="w-3.5 h-3.5 text-blue-600" />
                        SBD / Ghế:
                      </span>
                      <span className="tabular-nums font-medium text-slate-800 dark:text-slate-200">
                        <strong className="text-blue-600 dark:text-blue-400">{item.examNumber || item.registrationNumber || (item.mode === 'MOCK' ? 'Tự do' : 'Chưa cấp')}</strong>
                        <span className="text-slate-400 mx-1">·</span>
                        Ghế #{item.seatNumber || 'Chưa xếp'}
                      </span>
                    </div>
                    {(item as any).attempt?.gradingStatus === 'PUBLISHED' && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                          <Award className="w-3.5 h-3.5 text-blue-600" />
                          Điểm công bố:
                        </span>
                        <span className="tabular-nums font-medium text-xs text-blue-600 dark:text-blue-400">
                          {(item as any).attempt.totalScore !== null &&
                          (item as any).attempt.totalScore !== undefined &&
                          (item as any).attempt.totalScore !== ''
                            ? `${(item as any).attempt.totalScore}đ`
                            : 'Chưa có điểm'}{' '}
                          {(item as any).attempt.penaltyReason ? `(${(item as any).attempt.penaltyReason})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {(item as any).attempt?.gradingStatus === 'PUBLISHED' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/student/online-exam/${(item as any).attempt.id}/result`)}
                      leftIcon={<Award className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      Xem Kết Quả & Điểm Thi
                    </Button>
                  ) : (
                    <Button
                      variant={item.mode === 'MOCK' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => router.push(`/student/online-exam/${item.examScheduleId || item.scheduleId || item.id}/lobby`)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {item.mode === 'MOCK' ? 'Vào thi thử' : 'Vào phòng thi online'}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrawerSchedule(item)}
                    leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
                    className="ml-auto"
                  >
                    Chi tiết
                  </Button>
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
        avatarText={drawerSchedule?.subjectCode?.slice(0, 2)?.toUpperCase() || 'LT'}
        badge={{
          label: drawerSchedule?.periodName || 'Kỳ thi',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Môn thi', value: drawerSchedule?.subjectName, icon: BookOpen },
          { label: 'Mã học phần', value: <IdentifierBadge tone="blue">{drawerSchedule?.subjectCode || '---'}</IdentifierBadge> },
          { label: 'Kỳ thi khảo thí', value: drawerSchedule?.periodName },
          { label: 'Hình thức thi', value: drawerSchedule?.mode === 'MOCK' ? 'Thi thử trực tuyến' : 'Thi chính thức' },
          { label: 'Ngày thi', value: drawerSchedule?.examDate ? new Date(drawerSchedule.examDate).toLocaleDateString('vi-VN') : '', icon: Calendar },
          { label: 'Khung giờ làm bài', value: `${drawerSchedule?.startTime} - ${drawerSchedule?.endTime}`, icon: Clock },
          { label: 'Phòng thi', value: drawerSchedule?.roomName || (drawerSchedule?.roomCode ? <IdentifierBadge tone="neutral">{drawerSchedule.roomCode}</IdentifierBadge> : 'Tự do'), icon: DoorOpen },
          { label: 'Tòa nhà / Địa điểm', value: drawerSchedule?.building || 'Chưa cập nhật', icon: MapPin },
          { label: 'Số báo danh (SBD)', value: <IdentifierBadge tone="neutral">{drawerSchedule?.examNumber || drawerSchedule?.registrationNumber || (drawerSchedule?.mode === 'MOCK' ? 'Tự do' : 'Chưa cấp')}</IdentifierBadge>, icon: Ticket },
          { label: 'Vị trí ghế ngồi', value: drawerSchedule?.seatNumber ? `Ghế số ${drawerSchedule.seatNumber}` : 'Chưa xếp chỗ' },
        ]}
        extraSections={[
          {
            title: 'Thao Tác Nhanh Ca Thi',
            content: (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Vui lòng có mặt tại phòng thi hoặc vào phòng chờ trực tuyến trước giờ bắt đầu ít nhất 15 phút để chuẩn bị thiết bị và làm thủ tục điểm danh.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  {(drawerSchedule as any)?.attempt?.gradingStatus === 'PUBLISHED' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const id = (drawerSchedule as any)?.attempt?.id;
                        setDrawerSchedule(null);
                        if (id) router.push(`/student/online-exam/${id}/result`);
                      }}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                    >
                      Xem kết quả
                    </Button>
                  ) : (
                    <Button
                      variant={drawerSchedule?.mode === 'MOCK' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => {
                        const targetId = drawerSchedule?.examScheduleId || drawerSchedule?.scheduleId || drawerSchedule?.id;
                        setDrawerSchedule(null);
                        if (targetId) router.push(`/student/online-exam/${targetId}/lobby`);
                      }}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {drawerSchedule?.mode === 'MOCK' ? 'Vào thi thử' : 'Vào phòng thi'}
                    </Button>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
