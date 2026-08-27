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
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
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
  AlertTriangle,
  Eye,
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import { ViewModeSegmentedControl } from '../../../components/ui/ViewModeSegmentedControl';
import { StudentScheduleCalendarView } from '../../../components/student/StudentScheduleCalendarView';
import { StatusBadge } from '../../../components/common/StatusBadge';
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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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
      title: 'THẺ DỰ THI & LỊCH THI CÁ NHÂN SINH VIÊN',
      subtitle: `Thí sinh: ${currentUser?.username || ''} - Thông tin ca thi và số báo danh`,
      facultyName: 'HỘI ĐỒNG KHẢO THÍ & ĐẢM BẢO CHẤT LƯỢNG',
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
      templateCode: 'STUDENT_EXAM_PASS',
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
            <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Lịch thi cá nhân
            </h1>
            <div className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
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

          <div className="flex items-center gap-2.5">
            <DataActionsDropdown
              onExport={exportCsv}
              exportLabel="Xuất file CSV"
              onPrint={handlePrintReport}
              printLabel="In lịch thi cá nhân"
            />
          </div>
        </div>

        {/* ── 2. Standard 4 KPI Cards Row With Micro Progress Tracks ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {KPI.map(({ label, value, subtext, progressPercent, icon: Icon }) => (
            <div
              key={label}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {label}
                  </span>
                  <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
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
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
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
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 pl-10 pr-9 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
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
                className="h-9 px-2.5 flex items-center gap-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-type-helper font-semibold transition-colors cursor-pointer shrink-0"
                title="Xóa tất cả bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}

            {/* View Mode Switcher: Lịch [ 📅 ] & Bảng [ ☰ ] (Ưu tiên Lịch trước) */}
            <ViewModeSegmentedControl
              viewMode={viewMode}
              onChange={(m) => setViewMode(m as 'calendar' | 'list')}
              supportedModes={['calendar', 'list']}
            />
          </div>
        </div>

        {/* Schedule Content (Calendar View hoặc List Table View) */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-type-body-sm font-semibold text-slate-500 dark:text-slate-400">Đang tra cứu lịch thi cá nhân...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BookMarked className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-type-body font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy lịch thi nào</h3>
            <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 max-w-sm">
              Không có ca thi nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          /* ── 1. Chế độ Xem Lịch Tuần (Mặc định mở sẵn) ── */
          <StudentScheduleCalendarView
            schedules={filteredSchedules}
            onDetail={setDrawerSchedule}
          />
        ) : (
          /* ── 2. Chế độ Xem Bảng Danh Sách (Table) ── */
          <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <table className="ui-table w-full text-left text-type-body leading-[22px] text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800 select-none">
                <tr>
                  <th scope="col" className="p-3.5 pl-4 font-medium whitespace-nowrap text-center w-12">STT</th>
                  <th scope="col" className="p-3.5 font-medium min-w-[220px]">Học phần</th>
                  <th scope="col" className="p-3.5 font-medium whitespace-nowrap">Thời gian thi</th>
                  <th scope="col" className="p-3.5 font-medium whitespace-nowrap">Phòng thi</th>
                  <th scope="col" className="p-3.5 font-medium whitespace-nowrap">SBD / Ghế</th>
                  <th scope="col" className="p-3.5 font-medium whitespace-nowrap text-center">Hình thức</th>
                  <th scope="col" className="p-3.5 pr-4 font-medium text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredSchedules.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3.5 pl-4 text-center tabular-nums text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    {/* 1. Học phần: Mã môn + Tên môn trên 1 hàng */}
                    <td className="p-3.5 min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <IdentifierBadge tone="blue">{item.subjectCode}</IdentifierBadge>
                        <button
                          type="button"
                          onClick={() => setDrawerSchedule(item)}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition text-left leading-snug truncate"
                          title={item.subjectName}
                        >
                          {item.subjectName}
                        </button>
                      </div>
                    </td>

                    {/* 2. Thời gian thi: Ngày + Giờ */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {new Date(item.examDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 font-normal mx-2">|</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                        {item.startTime} – {item.endTime}
                      </span>
                    </td>

                    {/* 3. Phòng thi */}
                    <td className="p-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {item.roomName || item.roomCode || 'Tự do'} {item.building ? `(${item.building})` : ''}
                    </td>

                    {/* 4. SBD / Ghế */}
                    <td className="p-3.5 whitespace-nowrap tabular-nums font-medium text-slate-800 dark:text-slate-200">
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {item.examNumber || item.registrationNumber || (item.mode === 'MOCK' ? 'Tự do' : 'Chưa cấp')}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 font-normal mx-2">|</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Ghế #{item.seatNumber || '---'}
                      </span>
                    </td>

                    {/* 5. Hình thức: StatusBadge chuẩn quy định */}
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <StatusBadge
                        status={item.mode === 'MOCK' ? 'SCHEDULED' : 'CONFIRMED'}
                        customLabel={item.mode === 'MOCK' ? 'Thi thử' : 'Chính thức'}
                      />
                    </td>

                    {/* 6. Thao tác */}
                    <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {(item as any).attempt?.hasPublishedResult ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/student/online-exam/${(item as any).attempt.id}/result`)}
                            leftIcon={<Award className="w-3.5 h-3.5 text-blue-600" />}
                          >
                            Điểm thi
                          </Button>
                        ) : (
                          <Button
                            variant={item.mode === 'MOCK' ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => router.push(`/student/online-exam/${item.examScheduleId || item.scheduleId || item.id}/lobby`)}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {item.mode === 'MOCK' ? 'Vào thi thử' : 'Vào thi'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Schedule Detail Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSchedule)}
        onClose={() => setDrawerSchedule(null)}
        title={drawerSchedule?.subjectName || ''}
        subtitle={drawerSchedule?.subjectCode || ''}
        avatarText={drawerSchedule?.subjectCode?.slice(0, 2)?.toUpperCase() || 'LT'}
        badge={drawerSchedule ? {
          status: (drawerSchedule as any).status || 'UPCOMING',
          label: (drawerSchedule as any).status === 'COMPLETED' ? 'Đã hoàn thành' : (drawerSchedule as any).status === 'ONGOING' ? 'Đang diễn ra' : 'Sắp diễn ra',
        } : undefined}
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
                <p className="text-type-helper text-slate-500 font-normal leading-relaxed">
                  Vui lòng có mặt tại phòng thi hoặc vào phòng chờ trực tuyến trước giờ bắt đầu ít nhất 15 phút để chuẩn bị thiết bị và làm thủ tục điểm danh.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  {(drawerSchedule as any)?.attempt?.hasPublishedResult ? (
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
                  ) : ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'UNDER_REVIEW'].includes((drawerSchedule as any)?.attempt?.status) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const id = (drawerSchedule as any)?.attempt?.id;
                        setDrawerSchedule(null);
                        if (id) router.push(`/student/online-exam/${id}/result`);
                      }}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      Xem bài nộp
                    </Button>
                  ) : ['IN_PROGRESS', 'DISCONNECTED', 'DEVICE_CHECK', 'READY'].includes((drawerSchedule as any)?.attempt?.status) ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const targetId = drawerSchedule?.examScheduleId || drawerSchedule?.scheduleId || drawerSchedule?.id;
                        setDrawerSchedule(null);
                        if (targetId) router.push(`/student/online-exam/${targetId}/lobby`);
                      }}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Tiếp tục làm bài
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
