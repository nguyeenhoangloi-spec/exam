'use client';

import { downloadCsv } from '../../lib/export-csv';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Printer,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { Toast } from '../../components/Toast';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { ExamSchedule, User } from '../../types';

interface CandidateReport {
  studentId: number;
  studentCode: string;
  fullName: string;
  className: string;
  status: 'SUBMITTED' | 'AUTO_SUBMITTED' | 'GRADED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'ABSENT';
  totalScore: number;
  maxScore: number;
  submittedAt: string | null;
  violationCount: number;
}

interface GradeReportResponse {
  schedule: {
    id: number;
    subjectName: string;
    subjectCode: string;
    periodName: string;
    examDate: string;
    startTime: string;
    endTime: string;
  };
  stats: {
    totalAssigned: number;
    totalSubmitted: number;
    totalAbsent: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    passRate: number;
  };
  candidates: CandidateReport[];
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  GRADED: { label: 'Đã chấm điểm', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SUBMITTED: { label: 'Đã nộp bài', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  AUTO_SUBMITTED: { label: 'Tự động nộp (Hết giờ)', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  UNDER_REVIEW: { label: 'Tạm khóa (Rà soát vi phạm)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_PROGRESS: { label: 'Đang làm bài', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ABSENT: { label: 'Chưa thi / Vắng thi', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function ExamReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [report, setReport] = useState<GradeReportResponse | null>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 1. Tải danh sách lịch thi
  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const response = await api.get<ExamSchedule[]>('/exam-schedules');
      setSchedules(response.data);
      if (response.data.length > 0) {
        setSelectedScheduleId(String(response.data[0].id));
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Không tải được danh sách lịch thi.', type: 'error' });
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  // 2. Tải Báo cáo Điểm thi ca thi chọn
  const fetchReport = useCallback(async (scheduleId: string) => {
    if (!scheduleId) return;
    setLoadingReport(true);
    try {
      const response = await api.get<GradeReportResponse>(`/online-exams/schedule/${scheduleId}/grade-report`);
      setReport(response.data);
    } catch (error: any) {
      setToast({ message: error.message || 'Không tải được báo cáo điểm thi.', type: 'error' });
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) return void router.replace('/login');
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      return void router.replace('/student/exam-schedule');
    }
    setCurrentUser(user);
    fetchSchedules();
  }, [fetchSchedules, router]);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchReport(selectedScheduleId);
    }
  }, [selectedScheduleId, fetchReport]);

  // Lọc thí sinh theo Từ khóa & Trạng thái
  const filteredCandidates = (report?.candidates || []).filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUBMITTED' && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(c.status)) ||
      (statusFilter === 'ABSENT' && c.status === 'ABSENT') ||
      (statusFilter === 'FLAGGED' && (c.status === 'UNDER_REVIEW' || c.violationCount > 0));

    return matchesSearch && matchesStatus;
  });



  // Xuất file CSV / Excel Bảng điểm thi
  const exportCsv = () => {
    if (!report || !filteredCandidates.length) {
      setToast({ message: 'Không có dữ liệu thí sinh để xuất.', type: 'error' });
      return;
    }

    const headers = ['STT', 'Mã Sinh Viên', 'Họ và Tên', 'Lớp', 'Trạng Thái', 'Điểm Số (/10)', 'Thời Gian Nộp', 'Số Lượt Vi Phạm'];
    const rows = filteredCandidates.map((c, idx) => [
      idx + 1,
      `"${c.studentCode}"`,
      `"${c.fullName}"`,
      `"${c.className}"`,
      `"${statusBadgeMap[c.status]?.label || c.status}"`,
      c.status === 'ABSENT' ? 'Vắng thi' : c.totalScore,
      c.submittedAt ? `"${new Date(c.submittedAt).toLocaleString('vi-VN')}"` : '—',
      c.violationCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    downloadCsv(`Bao_Cao_Diem_${report.schedule.subjectCode}_Ca_${report.schedule.id}.csv`, csvContent);
    setToast({ message: 'Đã xuất file Bảng điểm CSV thành công!', type: 'success' });
  };

  // In Báo cáo tổng kết ca thi
  const printReport = () => {
    if (!report) return;
    const printable = window.open('', '_blank', 'width=950,height=750');
    if (!printable) {
      setToast({ message: 'Trình duyệt đang chặn cửa sổ in.', type: 'error' });
      return;
    }

    const candidateRows = filteredCandidates
      .map(
        (c, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${escapeHtml(c.studentCode)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(c.fullName)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(c.className)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${statusBadgeMap[c.status]?.label || c.status}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; ${c.totalScore >= 5 ? 'color: #047857;' : 'color: #b91c1c;'}">${c.status === 'ABSENT' ? 'Vắng' : c.totalScore}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString('vi-VN') : '—'}</td>
      </tr>
    `
      )
      .join('');

    printable.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo Kết quả Ca thi - ${escapeHtml(report.schedule.subjectName)}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; color: #0f172a; padding: 20px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0; }
          .meta { font-size: 11pt; margin-bottom: 20px; line-height: 1.6; }
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11pt; }
          table.data-table th { border: 1px solid #94a3b8; background-color: #f1f5f9; padding: 8px; text-align: center; }
          .signatures { width: 100%; margin-top: 40px; }
          .signatures td { text-align: center; vertical-align: top; width: 50%; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <p style="margin:0; font-weight:bold; font-size: 11pt;">TRƯỜNG ĐẠI HỌC KHẢO THÍ</p>
              <p style="margin:0; font-weight:bold; font-size: 11pt;">HỘI ĐỒNG KHẢO THÍ TRỰC TUYẾN</p>
              <p style="margin:0;">-----------------</p>
            </td>
            <td style="width: 55%; text-align: center;">
              <p style="margin:0; font-weight:bold; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style="margin:0; font-weight:bold; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</p>
              <p style="margin:0;">-----------------</p>
            </td>
          </tr>
        </table>

        <div class="title">BẢNG TỔNG HỢP KẾT QUẢ ĐIỂM THI CA THI</div>
        <div class="meta">
          <p style="margin:2px 0;"><strong>Môn học:</strong> ${escapeHtml(report.schedule.subjectName)} (${escapeHtml(report.schedule.subjectCode)})</p>
          <p style="margin:2px 0;"><strong>Kỳ thi:</strong> ${escapeHtml(report.schedule.periodName)} · <strong>Ngày thi:</strong> ${report.schedule.examDate} (${report.schedule.startTime} - ${report.schedule.endTime})</p>
          <p style="margin:2px 0;"><strong>Thống kê:</strong> Tổng ${report.stats.totalAssigned} thí sinh · Dự thi: ${report.stats.totalSubmitted} (${((report.stats.totalSubmitted/report.stats.totalAssigned)*100||0).toFixed(1)}%) · Vắng: ${report.stats.totalAbsent} · Điểm TB: ${report.stats.avgScore} · Tỷ lệ Đạt: ${report.stats.passRate}%</p>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Mã Sinh Viên</th>
              <th>Họ và Tên</th>
              <th>Lớp Học</th>
              <th>Trạng Thái</th>
              <th>Điểm Thi</th>
              <th>Giờ Nộp</th>
            </tr>
          </thead>
          <tbody>
            ${candidateRows}
          </tbody>
        </table>

        <table class="signatures">
          <tr>
            <td>
              <p style="font-weight: bold; margin-bottom: 60px;">CÁN BỘ COI THÍ CHÍNH</p>
              <p style="font-style: italic;">(Ký và ghi rõ họ tên)</p>
            </td>
            <td>
              <p style="margin-bottom: 4px;">Ngày ..... tháng ..... năm 2026</p>
              <p style="font-weight: bold; margin-bottom: 60px;">GIẢNG VIÊN CHẤM THÍ / TRƯỞNG BỘ MÔN</p>
              <p style="font-style: italic;">(Ký và ghi rõ họ tên)</p>
            </td>
          </tr>
        </table>
        <script>window.onload=()=>window.print();</script>
      </body>
      </html>
    `);
    printable.document.close();
  };

  return (
    <AppShell user={currentUser} title="Báo cáo Điểm thi">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Schedule Filter Section */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h1 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <BarChart3 className="h-6 w-6 text-sky-600" /> Báo cáo Điểm thi & Tổng hợp Kết quả Ca thi
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Thống kê danh sách thí sinh đã thi, vắng thi, điểm chấm tự động và xuất báo cáo ca thi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-600">Chọn Ca thi:</span>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-sky-500 shadow-2xs"
            >
              {!schedules.length && <option value="">Chưa có ca thi nào</option>}
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.subjectName} ({s.subject?.subjectCode}) - Ngày {s.examDate} ({s.startTime})
                </option>
              ))}
            </select>
          </div>
        </section>

        {loadingReport ? (
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        ) : !report ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 font-medium">
            Hãy chọn một Ca thi để xem Báo cáo Điểm chi tiết.
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tổng Thí Sinh</span>
                  <Users className="h-4 w-4 text-sky-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{report.stats.totalAssigned}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">Thí sinh trong danh sách</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Đã Dự Thi</span>
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-emerald-900">{report.stats.totalSubmitted}</p>
                <p className="mt-1 text-[11px] font-bold text-emerald-700">
                  Tỷ lệ: {((report.stats.totalSubmitted / report.stats.totalAssigned) * 100 || 0).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-800">Chưa Thi / Vắng</span>
                  <UserX className="h-4 w-4 text-rose-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-rose-900">{report.stats.totalAbsent}</p>
                <p className="mt-1 text-[11px] font-bold text-rose-700">
                  Vắng: {((report.stats.totalAbsent / report.stats.totalAssigned) * 100 || 0).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800">Điểm Trung Bình</span>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-blue-900">{report.stats.avgScore} <span className="text-sm font-normal text-blue-700">/ 10</span></p>
                <p className="mt-1 text-[11px] font-medium text-blue-700">
                  Cao nhất: {report.stats.highestScore} · Thấp nhất: {report.stats.lowestScore}
                </p>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-800">Tỷ Lệ Đạt (≥ 5.0)</span>
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-purple-900">{report.stats.passRate}%</p>
                <p className="mt-1 text-[11px] font-medium text-purple-700">
                  Đạt: {report.stats.passCount} / {report.stats.totalSubmitted} bài
                </p>
              </div>
            </div>

            {/* Main Candidates Table & Export Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search & Status Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm mã SV, họ tên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-sky-500 w-56"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                  >
                    <option value="ALL">Tất cả sinh viên ({report.candidates.length})</option>
                    <option value="SUBMITTED">Đã nộp bài ({report.stats.totalSubmitted})</option>
                    <option value="ABSENT">Chưa thi / Vắng ({report.stats.totalAbsent})</option>
                    <option value="FLAGGED">Có cảnh báo vi phạm</option>
                  </select>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Xuất Excel/CSV Bảng Điểm
                  </button>
                  <button
                    onClick={printReport}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition shadow-2xs"
                  >
                    <Printer className="h-4 w-4" /> In Báo Cáo Ca Thi
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 uppercase text-slate-600 font-bold">
                    <tr>
                      <th className="px-3 py-3 text-center">STT</th>
                      <th className="px-3 py-3">Mã SV</th>
                      <th className="px-3 py-3">Họ và Tên</th>
                      <th className="px-3 py-3">Lớp học</th>
                      <th className="px-3 py-3 text-center">Trạng thái</th>
                      <th className="px-3 py-3 text-center">Điểm thi (/10)</th>
                      <th className="px-3 py-3 text-center">Thời gian nộp</th>
                      <th className="px-3 py-3 text-center">Cảnh báo vi phạm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {!filteredCandidates.length ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                          Không tìm thấy thí sinh phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c, idx) => (
                        <tr key={c.studentId} className="hover:bg-slate-50/70">
                          <td className="px-3 py-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-3 font-bold text-sky-700">{c.studentCode}</td>
                          <td className="px-3 py-3 font-bold text-slate-800">{c.fullName}</td>
                          <td className="px-3 py-3 text-slate-600">{c.className}</td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                statusBadgeMap[c.status]?.className || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {statusBadgeMap[c.status]?.label || c.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {c.status === 'ABSENT' ? (
                              <span className="font-bold text-rose-600">Vắng thi</span>
                            ) : (
                              <span
                                className={`text-sm font-black ${
                                  c.totalScore >= 8.0
                                    ? 'text-emerald-700'
                                    : c.totalScore >= 5.0
                                    ? 'text-sky-700'
                                    : 'text-rose-600'
                                }`}
                              >
                                {c.totalScore} <span className="text-[10px] font-normal text-slate-400">/ 10</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600">
                            {c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString('vi-VN') : '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {c.violationCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                <AlertTriangle className="h-3 w-3 text-amber-600" /> {c.violationCount} vi phạm
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
