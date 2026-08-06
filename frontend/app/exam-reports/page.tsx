'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { downloadCsv } from '../../lib/export-csv';
import { Toast } from '../../components/Toast';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { ExamSchedule, User } from '../../types';
import { Search, X, Calendar, BookOpen, Clock, ChevronDown, Award, AlertTriangle, GraduationCap, FileCheck } from 'lucide-react';

import { ExamReportHeader } from '../../components/exam-reports/ExamReportHeader';
import { ExamReportKPICards } from '../../components/exam-reports/ExamReportKPICards';
import { ExamReportTableToolbar } from '../../components/exam-reports/ExamReportTableToolbar';
import { ExamReportTable, CandidateReport } from '../../components/exam-reports/ExamReportTable';
import { ExamReportPaginationBar } from '../../components/exam-reports/ExamReportPaginationBar';

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

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
}

export default function ExamReportsPage() {
  usePageTitle('Báo cáo Điểm thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [report, setReport] = useState<GradeReportResponse | null>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState('score_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    studentCode: true,
    fullName: true,
    className: true,
    status: true,
    totalScore: true,
    submittedAt: true,
    violationCount: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerCandidate, setDrawerCandidate] = useState<CandidateReport | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const response = await api.get<ExamSchedule[]>('/exam-schedules');
      const data = response.data || [];
      setSchedules(data);
      if (data.length > 0) {
        setSelectedScheduleId(String(data[0].id));
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Không tải được danh sách lịch thi.', type: 'error' });
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

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

  // Compute DYNAMIC KPI Metrics from real API report
  const kpiData = useMemo(() => {
    if (!report) {
      return {
        totalAssigned: 0,
        totalSubmitted: 0,
        totalAbsent: 0,
        avgScore: 0,
        passRate: 0,
        passCount: 0,
      };
    }
    const candidates = report.candidates || [];
    const totalAssigned = report.stats?.totalAssigned ?? candidates.length;
    const totalSubmitted = report.stats?.totalSubmitted ?? candidates.filter((c) => c.status !== 'ABSENT').length;
    const totalAbsent = report.stats?.totalAbsent ?? candidates.filter((c) => c.status === 'ABSENT').length;
    const passCount = report.stats?.passCount ?? candidates.filter((c) => c.status !== 'ABSENT' && c.totalScore >= 5).length;
    const passRate = report.stats?.passRate ?? (totalSubmitted > 0 ? Math.round((passCount / totalSubmitted) * 100) : 0);
    const avgScore = report.stats?.avgScore ?? 0;

    return {
      totalAssigned,
      totalSubmitted,
      totalAbsent,
      avgScore,
      passRate,
      passCount,
    };
  }, [report]);

  // Filter & Sort Candidates
  const filteredCandidates = useMemo(() => {
    if (!report?.candidates) return [];

    return report.candidates
      .filter((c) => {
        const matchesSearch =
          c.fullName.toLowerCase().includes(search.toLowerCase()) ||
          c.studentCode.toLowerCase().includes(search.toLowerCase()) ||
          c.className.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'SUBMITTED' && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(c.status)) ||
          (statusFilter === 'ABSENT' && c.status === 'ABSENT') ||
          (statusFilter === 'FLAGGED' && (c.status === 'UNDER_REVIEW' || c.violationCount > 0));

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'score_asc') return a.totalScore - b.totalScore;
        if (sortOrder === 'name_asc') return a.fullName.localeCompare(b.fullName, 'vi');
        if (sortOrder === 'violation_desc') return b.violationCount - a.violationCount;
        return b.totalScore - a.totalScore;
      });
  }, [report, search, statusFilter, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / limit));
  const paginatedCandidates = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredCandidates.slice(start, start + limit);
  }, [filteredCandidates, page, limit]);

  // Export CSV
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
      `"${c.status}"`,
      c.status === 'ABSENT' ? 'Vắng thi' : c.totalScore,
      c.submittedAt ? `"${new Date(c.submittedAt).toLocaleString('vi-VN')}"` : '—',
      c.violationCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    downloadCsv(`Bao_Cao_Diem_${report.schedule.subjectCode}_Ca_${report.schedule.id}.csv`, csvContent);
    setToast({ message: 'Đã xuất file Bảng điểm CSV thành công!', type: 'success' });
  };

  // Official Print Report
  const printOfficialReport = () => {
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
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${c.status}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; ${c.totalScore >= 5 ? 'color: #047857;' : 'color: #b91c1c;'}">${c.status === 'ABSENT' ? 'Vắng' : c.totalScore}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString('vi-VN') : '—'}</td>
      </tr>
    `,
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
        </style>
      </head>
      <body>
        <div class="title">BẢNG TỔNG HỢP KẾT QUẢ ĐIỂM THI CA THI</div>
        <div class="meta">
          <p style="margin:2px 0;"><strong>Môn học:</strong> ${escapeHtml(report.schedule.subjectName)} (${escapeHtml(report.schedule.subjectCode)})</p>
          <p style="margin:2px 0;"><strong>Kỳ thi:</strong> ${escapeHtml(report.schedule.periodName)} · <strong>Ngày thi:</strong> ${report.schedule.examDate} (${report.schedule.startTime} - ${report.schedule.endTime})</p>
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
      </body>
      </html>
    `);
    printable.document.close();
    printable.print();
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <ExamReportHeader
          onExport={exportCsv}
          onPrint={printOfficialReport}
        />

        {/* Schedule Selector Toolbar */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Chọn Ca thi / Lịch thi để xem Báo cáo
              </span>
            </div>

            <div className="relative flex-1 max-w-md">
              {/* Custom popup trigger */}
              <button
                type="button"
                disabled={loadingSchedules}
                onClick={() => setShowSchedulePicker(true)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-left hover:bg-white hover:border-blue-300 transition cursor-pointer disabled:opacity-60"
              >
                <span className={selectedScheduleId ? 'text-slate-800 truncate' : 'text-slate-400'}>
                  {loadingSchedules ? 'Đang tải...' : selectedScheduleId
                    ? (() => { const s = schedules.find((x) => String(x.id) === selectedScheduleId); return s ? `[${(s as any).subjectCode || s.subject?.subjectCode || 'MH'}] ${(s as any).subjectName || s.subject?.subjectName} \u00b7 ${s.startTime}\u2013${s.endTime}` : '-- Chọn lịch thi --'; })()
                    : schedules.length === 0 ? 'Không có lịch thi nào' : '-- Chọn lịch thi --'}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              </button>

              {/* Modal popup */}
              {showSchedulePicker && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowSchedulePicker(false)} />
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                        <div>
                          <p className="text-sm font-black text-slate-900">Chọn Lịch thi để xem Báo cáo</p>
                          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                            {schedules.length} lịch thi · chọn để tải điểm
                          </p>
                        </div>
                        <button type="button" onClick={() => setShowSchedulePicker(false)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Body: 2 columns — split by CHÍNH THỨC vs THI THỬ */}
                      <div className="grid grid-cols-2 divide-x divide-slate-100" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

                        {/* LEFT: Chính thức */}
                        <div>
                          <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100 z-10">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              Chính thức ({schedules.filter((s: any) => s.mode !== 'MOCK').length})
                            </span>
                          </div>
                          {schedules.filter((s: any) => s.mode !== 'MOCK').length === 0 ? (
                            <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Chưa có</p>
                          ) : schedules.filter((s: any) => s.mode !== 'MOCK').map((s: any) => {
                            const isActive = selectedScheduleId === String(s.id);
                            const code = s.subjectCode || s.subject?.subjectCode || 'MH';
                            const name = s.subjectName || s.subject?.subjectName || 'Môn học';
                            return (
                              <button key={s.id} type="button"
                                onClick={() => { setSelectedScheduleId(String(s.id)); setPage(1); setShowSchedulePicker(false); }}
                                className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-blue-50 transition cursor-pointer ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''}`}
                              >
                                <p className={`text-xs font-black truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                                  [{code}] {name}
                                </p>
                                <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                                  {s.startTime}–{s.endTime}
                                  {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {/* RIGHT: Thi thử */}
                        <div>
                          <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100 z-10">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              Thi thử ({schedules.filter((s: any) => s.mode === 'MOCK').length})
                            </span>
                          </div>
                          {schedules.filter((s: any) => s.mode === 'MOCK').length === 0 ? (
                            <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Chưa có</p>
                          ) : schedules.filter((s: any) => s.mode === 'MOCK').map((s: any) => {
                            const isActive = selectedScheduleId === String(s.id);
                            const code = s.subjectCode || s.subject?.subjectCode || 'MH';
                            const name = s.subjectName || s.subject?.subjectName || 'Môn học';
                            return (
                              <button key={s.id} type="button"
                                onClick={() => { setSelectedScheduleId(String(s.id)); setPage(1); setShowSchedulePicker(false); }}
                                className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-blue-50 transition cursor-pointer ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''}`}
                              >
                                <p className={`text-xs font-black truncate ${isActive ? 'text-blue-700' : 'text-amber-800'}`}>
                                  [THI THỬ] {name}
                                </p>
                                <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                                  {s.startTime}–{s.endTime}
                                  {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                        <button type="button" onClick={() => setShowSchedulePicker(false)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {report?.schedule && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  <strong className="text-slate-900">{report.schedule.subjectName}</strong> ({report.schedule.subjectCode})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Kỳ thi: <strong className="text-slate-900">{report.schedule.periodName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600 shrink-0" />
                <span>Ngày: <strong className="text-slate-900">{report.schedule.examDate}</strong> ({report.schedule.startTime} - {report.schedule.endTime})</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <ExamReportKPICards
          totalAssigned={kpiData.totalAssigned}
          totalSubmitted={kpiData.totalSubmitted}
          totalAbsent={kpiData.totalAbsent}
          avgScore={kpiData.avgScore}
          passRate={kpiData.passRate}
          passCount={kpiData.passCount}
        />

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Họ tên, Lớp sinh viên..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Lọc theo trạng thái:</span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả Thí sinh</option>
                <option value="SUBMITTED">Đã tham gia / Nộp bài</option>
                <option value="ABSENT">Chưa thi / Vắng thi</option>
                <option value="FLAGGED">Có cảnh báo vi phạm</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Table Action Toolbar */}
        <ExamReportTableToolbar
          totalCount={filteredCandidates.length}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onRefresh={() => fetchReport(selectedScheduleId)}
        />

        {/* Full-Width DataGrid Table */}
        {loadingReport ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedCandidates.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
            Không tìm thấy thí sinh phù hợp trong ca thi này.
          </div>
        ) : (
          <ExamReportTable
            candidates={paginatedCandidates}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedCandidates.map((c) => c.studentId) : [])
            }
            onDetail={setDrawerCandidate}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <ExamReportPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredCandidates.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      </main>

      {/* Candidate Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerCandidate)}
        onClose={() => setDrawerCandidate(null)}
        title={drawerCandidate?.fullName || 'Hồ sơ Thí sinh thi'}
        subtitle={`Mã SV: ${drawerCandidate?.studentCode || ''}`}
        avatarText={drawerCandidate?.studentCode?.slice(0, 3) || 'SV'}
        badge={{
          label: drawerCandidate?.status === 'ABSENT' ? 'Vắng thi' : `Điểm thi: ${drawerCandidate?.totalScore} / 10`,
          className: drawerCandidate?.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }}
        details={[
          { label: 'Họ và Tên', value: drawerCandidate?.fullName },
          { label: 'Mã Sinh viên', value: drawerCandidate?.studentCode },
          { label: 'Lớp sinh viên', value: drawerCandidate?.className, icon: GraduationCap },
          { label: 'Trạng thái nộp bài', value: drawerCandidate?.status, icon: FileCheck },
          {
            label: 'Điểm số đạt được',
            value: drawerCandidate?.status === 'ABSENT' ? 'Không có (Vắng thi)' : `${drawerCandidate?.totalScore} / 10 điểm`,
            icon: Award,
          },
          {
            label: 'Số lượt vi phạm',
            value: `${drawerCandidate?.violationCount || 0} lần`,
            icon: AlertTriangle,
          },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
