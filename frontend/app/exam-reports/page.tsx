'use client';
import { FilterSelect } from '../../components/ui/FilterSelect';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { downloadCsv } from '../../lib/export-csv';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { Toast } from '../../components/Toast';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ExamSchedule, User } from '../../types';
import { Search, X, Calendar, BookOpen, Clock, ChevronDown, Award, AlertTriangle, GraduationCap, FileCheck, RotateCcw } from 'lucide-react';

import { ExamReportHeader } from '../../components/exam-reports/ExamReportHeader';
import { ExamReportKPICards } from '../../components/exam-reports/ExamReportKPICards';
import { ExamReportFiltersCard } from '../../components/exam-reports/ExamReportFiltersCard';
import { ExamReportFilterPopover } from '../../components/exam-reports/ExamReportFilterPopover';
import { ExamReportTableToolbar } from '../../components/exam-reports/ExamReportTableToolbar';
import { ExamReportTable, CandidateReport } from '../../components/exam-reports/ExamReportTable';
import { ExamReportPaginationBar } from '../../components/exam-reports/ExamReportPaginationBar';
import { TabBar } from '../../components/ui/TabBar';

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

interface SummaryResponse {
  stats: {
    totalExams: number;
    totalSchedules: number;
    totalAssigned: number;
    totalSubmitted: number;
    totalAbsent: number;
    totalUngraded: number;
    totalFlagged: number;
    passCount: number;
    passRate: number;
    avgScore: number;
  };
  schedules: Array<{
    id: number;
    periodName: string;
    subjectCode: string;
    subjectName: string;
    departmentName: string;
    examDate: string;
    assigned: number;
    submitted: number;
    absent: number;
    ungraded: number;
    flagged: number;
    passCount: number;
    avgScore: number;
  }>;
  options?: {
    classes: Array<{ id: number; name: string }>;
    periods: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; code: string; name: string }>;
    departments: Array<{ id: number; name: string }>;
  };
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

function computeScheduleStatus(s: {
  status?: string;
  statusBadge?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
}): 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' {
  const rawStatus = (s.statusBadge || s.status || '').toUpperCase();
  if (rawStatus === 'CANCELLED' || rawStatus === 'REJECTED') {
    return 'CANCELLED';
  }

  if (!s.examDate) {
    return (rawStatus as any) || 'UPCOMING';
  }

  try {
    const now = new Date();
    let dateStr = s.examDate;
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return (rawStatus as any) || 'UPCOMING';
    const [y, m, d] = parts;

    const [startH, startM] = (s.startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (s.endTime || '23:59').split(':').map(Number);

    const startDateTime = new Date(y, m - 1, d, startH || 0, startM || 0);
    const endDateTime = new Date(y, m - 1, d, endH || 23, endM || 59);

    if (now < startDateTime) {
      return 'UPCOMING';
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'ONGOING';
    } else {
      return 'COMPLETED';
    }
  } catch {
    return (rawStatus as any) || 'UPCOMING';
  }
}

function getScheduleTypeBadge(s: any) {
  const mode = (s.mode || '').toUpperCase();
  const examType = (s.examType || '').toUpperCase();

  if (mode === 'MOCK' || examType.includes('THỬ')) {
    return {
      label: 'Thi thử',
      key: 'MOCK',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
  }
  if (mode === 'RETAKE' || examType.includes('LẠI') || examType.includes('CẢI THIỆN')) {
    return {
      label: 'Thi lại',
      key: 'RETAKE',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
  }
  return {
    label: 'Chính thức',
    key: 'OFFICIAL',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
  };
}

function getExamFormatBadge(s: any) {
  const raw = (s.examType || '').toUpperCase();
  if (raw === 'TU_LUAN' || raw.includes('TỰ LUẬN') || raw.includes('ESSAY')) {
    return {
      label: 'Tự luận',
      key: 'TU_LUAN',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
  }
  if (raw === 'DIEN_LO' || raw === 'DIEN_KHUYES' || raw === 'DIEN_KHUYET' || raw === 'FILL_BLANK' || raw.includes('ĐIỀN') || raw.includes('BLANK')) {
    return {
      label: 'Điền khuyết',
      key: 'FILL_BLANK',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
  }
  if (raw === 'HON_HOP' || raw.includes('HỖN HỢP') || (raw.includes('TRẮC NGHIỆM') && raw.includes('TỰ LUẬN'))) {
    return {
      label: 'Hỗn hợp',
      key: 'HON_HOP',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
  }
  if (raw === 'THUC_HANH' || raw.includes('THỰC HÀNH')) {
    return {
      label: 'Thực hành',
      key: 'THUC_HANH',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
  }
  return {
    label: 'Trắc nghiệm',
    key: 'TRAC_NGHIEM',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
}

function getScheduleStatusBadge(s: any) {
  const st = computeScheduleStatus(s);
  if (st === 'ONGOING') {
    return { label: 'Đang diễn ra', key: 'ONGOING', dotClass: 'bg-blue-500', textClass: 'text-blue-700 font-semibold' };
  }
  if (st === 'UPCOMING') {
    return { label: 'Sắp diễn ra', key: 'UPCOMING', dotClass: 'bg-blue-500', textClass: 'text-blue-700 font-semibold' };
  }
  if (st === 'CANCELLED') {
    return { label: 'Đã hủy', key: 'CANCELLED', dotClass: 'bg-rose-500', textClass: 'text-rose-700 font-semibold' };
  }
  return { label: 'Đã kết thúc', key: 'COMPLETED', dotClass: 'bg-slate-300', textClass: 'text-slate-500 font-medium' };
}

export default function ExamReportsPage() {
  usePageTitle('Báo cáo thống kê');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [report, setReport] = useState<GradeReportResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFilters, setSummaryFilters] = useState({ examPeriodId: 'ALL', subjectId: 'ALL', departmentId: 'ALL', classId: 'ALL', fromDate: '', toDate: '' });
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetSummaryFilters = () => {
    setSummaryFilters({
      examPeriodId: 'ALL',
      subjectId: 'ALL',
      departmentId: 'ALL',
      classId: 'ALL',
      fromDate: '',
      toDate: '',
    });
  };

  // Modal filter states for schedule picker
  const [modalSearch, setModalSearch] = useState('');
  const [modalModeFilter, setModalModeFilter] = useState<'ALL' | 'OFFICIAL' | 'MOCK' | 'RETAKE'>('ALL');
  const [modalFormatFilter, setModalFormatFilter] = useState<'ALL' | 'TRAC_NGHIEM' | 'TU_LUAN' | 'FILL_BLANK' | 'HON_HOP' | 'THUC_HANH'>('ALL');
  const [modalSubjectFilter, setModalSubjectFilter] = useState<string>('ALL');
  const [modalStatusFilter, setModalStatusFilter] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED'>('ALL');

  // Extract unique subjects from schedules
  const availableSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { code: string; name: string }>();
    schedules.forEach((s: any) => {
      const code = s.subjectCode || s.subject?.subjectCode || '';
      const name = s.subjectName || s.subject?.subjectName || '';
      if (code) {
        subjectsMap.set(code, { code, name: name || code });
      }
    });
    return Array.from(subjectsMap.values());
  }, [schedules]);

  // Compute counts for schedule types (mode)
  const modeCounts = useMemo(() => {
    let official = 0;
    let mock = 0;
    let retake = 0;
    schedules.forEach((s: any) => {
      const typeInfo = getScheduleTypeBadge(s);
      if (typeInfo.key === 'OFFICIAL') official++;
      else if (typeInfo.key === 'MOCK') mock++;
      else if (typeInfo.key === 'RETAKE') retake++;
    });
    return { all: schedules.length, official, mock, retake };
  }, [schedules]);

  // Compute counts for exam formats (Trắc nghiệm, Tự luận, Điền khuyết...)
  const formatCounts = useMemo(() => {
    let tracNghiem = 0;
    let tuLuan = 0;
    let dienKhuyet = 0;
    let honHop = 0;
    let thucHanh = 0;
    schedules.forEach((s: any) => {
      const fmt = getExamFormatBadge(s);
      if (fmt.key === 'TU_LUAN') tuLuan++;
      else if (fmt.key === 'FILL_BLANK') dienKhuyet++;
      else if (fmt.key === 'HON_HOP') honHop++;
      else if (fmt.key === 'THUC_HANH') thucHanh++;
      else tracNghiem++;
    });
    return { all: schedules.length, tracNghiem, tuLuan, dienKhuyet, honHop, thucHanh };
  }, [schedules]);

  // Modal filtered schedules
  const modalFilteredSchedules = useMemo(() => {
    return schedules.filter((s: any) => {
      const code = (s.subjectCode || s.subject?.subjectCode || '').toLowerCase();
      const name = (s.subjectName || s.subject?.subjectName || '').toLowerCase();
      const period = (s.periodName || s.examPeriod?.name || '').toLowerCase();
      const q = modalSearch.trim().toLowerCase();

      const matchesSearch = !q || code.includes(q) || name.includes(q) || period.includes(q);

      const typeInfo = getScheduleTypeBadge(s);
      const matchesMode =
        modalModeFilter === 'ALL' ||
        (modalModeFilter === 'OFFICIAL' && typeInfo.key === 'OFFICIAL') ||
        (modalModeFilter === 'MOCK' && typeInfo.key === 'MOCK') ||
        (modalModeFilter === 'RETAKE' && typeInfo.key === 'RETAKE');

      const fmtInfo = getExamFormatBadge(s);
      const matchesFormat =
        modalFormatFilter === 'ALL' || fmtInfo.key === modalFormatFilter;

      const sCode = s.subjectCode || s.subject?.subjectCode || '';
      const matchesSubject = modalSubjectFilter === 'ALL' || sCode === modalSubjectFilter;

      const statusInfo = getScheduleStatusBadge(s);
      const matchesStatus = modalStatusFilter === 'ALL' || statusInfo.key === modalStatusFilter;

      return matchesSearch && matchesMode && matchesFormat && matchesSubject && matchesStatus;
    });
  }, [schedules, modalSearch, modalModeFilter, modalFormatFilter, modalSubjectFilter, modalStatusFilter]);

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

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(summaryFilters).forEach(([key, value]) => {
        if (value && value !== 'ALL') params.set(key, value);
      });
      const response = await api.get<SummaryResponse>(`/exam-reports/summary?${params.toString()}`);
      setSummary(response.data);
    } catch (error: any) {
      setToast({ message: error.message || 'Không tải được thống kê tổng hợp.', type: 'error' });
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryFilters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  const handleRefresh = async () => {
    if (selectedScheduleId) {
      await fetchReport(selectedScheduleId);
    } else {
      await fetchSchedules();
    }
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

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

  // Tab Counts for Candidate Status TabBar
  const tabCounts = useMemo(() => {
    const list = report?.candidates || [];
    const total = list.length;
    const submitted = list.filter((c) => ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(c.status)).length;
    const absent = list.filter((c) => c.status === 'ABSENT').length;
    const flagged = list.filter((c) => c.status === 'UNDER_REVIEW' || c.violationCount > 0).length;
    return { total, submitted, absent, flagged };
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

  const exportSummaryExcel = () => {
    if (!summary) {
      setToast({ message: 'Chưa có dữ liệu tổng hợp để xuất.', type: 'error' });
      return;
    }
    exportToFormattedExcel({
      filename: `Bao_Cao_Tong_Hop_${new Date().toISOString().slice(0, 10)}.xls`,
      title: 'BÁO CÁO THỐNG KÊ KẾT QUẢ THI',
      subtitle: `Kỳ thi: ${summary.stats.totalExams} · Ca thi: ${summary.stats.totalSchedules}`,
      columns: [
        { header: 'STT', align: 'center', width: 8 },
        { header: 'Kỳ thi', width: 28 },
        { header: 'Mã môn', width: 14 },
        { header: 'Môn học', width: 28 },
        { header: 'Khoa', width: 24 },
        { header: 'Ngày thi', align: 'center', width: 14 },
        { header: 'Được gán', align: 'center', width: 14 },
        { header: 'Đã nộp', align: 'center', width: 14 },
        { header: 'Vắng', align: 'center', width: 14 },
        { header: 'Chưa chấm', align: 'center', width: 14 },
        { header: 'Bất thường', align: 'center', width: 14 },
        { header: 'Điểm TB', align: 'center', width: 14 },
      ],
      rows: summary.schedules.map((row, index) => [
        index + 1, row.periodName, row.subjectCode, row.subjectName, row.departmentName,
        new Date(row.examDate).toLocaleDateString('vi-VN'), row.assigned, row.submitted,
        row.absent, row.ungraded, row.flagged, row.avgScore,
      ]),
    });
    setToast({ message: 'Đã xuất báo cáo Excel thành công.', type: 'success' });
  };

  const exportSummaryCsv = () => {
    if (!summary) {
      setToast({ message: 'Chưa có dữ liệu tổng hợp để xuất.', type: 'error' });
      return;
    }
    const headers = ['STT', 'Kỳ thi', 'Mã môn', 'Môn học', 'Khoa', 'Ngày thi', 'Được gán', 'Đã nộp', 'Vắng', 'Chưa chấm', 'Bất thường', 'Điểm TB'];
    const rows = summary.schedules.map((row, index) => [
      index + 1, row.periodName, row.subjectCode, row.subjectName, row.departmentName,
      new Date(row.examDate).toLocaleDateString('vi-VN'), row.assigned, row.submitted,
      row.absent, row.ungraded, row.flagged, row.avgScore,
    ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
    downloadCsv(`Bao_Cao_Tong_Hop_${new Date().toISOString().slice(0, 10)}.csv`, `${headers.join(',')}\n${rows.join('\n')}`);
    setToast({ message: 'Đã xuất báo cáo CSV thành công.', type: 'success' });
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
          onExport={exportSummaryCsv}
          onExportExcel={exportSummaryExcel}
          onPrint={printOfficialReport}
        />


        <ExamReportKPICards
          totalExams={summary?.stats.totalExams ?? 0}
          totalSchedules={summary?.stats.totalSchedules ?? 0}
          totalAssigned={summary?.stats.totalAssigned ?? kpiData.totalAssigned}
          totalSubmitted={summary?.stats.totalSubmitted ?? kpiData.totalSubmitted}
          totalAbsent={summary?.stats.totalAbsent ?? kpiData.totalAbsent}
          totalUngraded={summary?.stats.totalUngraded ?? 0}
          totalFlagged={summary?.stats.totalFlagged ?? 0}
          avgScore={summary?.stats.avgScore ?? kpiData.avgScore}
          passRate={summary?.stats.passRate ?? kpiData.passRate}
          passCount={summary?.stats.passCount ?? kpiData.passCount}
        />

        {/* ── 3. Active Exam Session Strip ── */}
        {(() => {
          const activeSched = schedules.find((x) => String(x.id) === selectedScheduleId);
          const typeBadge = activeSched ? getScheduleTypeBadge(activeSched) : null;

          return (
            <ExamReportFiltersCard
              reportSchedule={report?.schedule}
              activeTypeBadge={typeBadge}
              loadingSchedules={loadingSchedules}
              onOpenSchedulePicker={() => setShowSchedulePicker(true)}
            />
          );
        })()}

        {/* Modal popup */}
        {showSchedulePicker && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={() => setShowSchedulePicker(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
                  <div>
                    <p className="text-[20px] font-semibold text-slate-900 tracking-tight leading-none">Chọn Lịch thi để xem Báo cáo</p>
                    <p className="text-[13px] text-slate-500 font-semibold mt-1">
                      Phân loại theo dạng lịch thi, môn học & trạng thái
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSchedulePicker(false)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
                    title="Đóng"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Filter Controls Bar: Clean & Minimalist */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo Tên môn, Mã môn, Kỳ thi..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-[15px] font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    />
                    {modalSearch && (
                      <button
                        type="button"
                        onClick={() => setModalSearch('')}
                        className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Row 1: Status Tabs */}
                  <TabBar
                    tabs={[
                      { key: 'ALL', label: 'Tất cả', count: modeCounts.all },
                      { key: 'OFFICIAL', label: 'Chính thức', count: modeCounts.official },
                      { key: 'MOCK', label: 'Thi thử', count: modeCounts.mock },
                      ...(modeCounts.retake > 0 ? [{ key: 'RETAKE', label: 'Thi lại', count: modeCounts.retake }] : []),
                    ]}
                    active={modalModeFilter}
                    onChange={(key) => setModalModeFilter(key as any)}
                  />

                  {/* Row 2: Secondary Dropdown Filters */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <FilterSelect
                      value={modalFormatFilter}
                      onChange={(e) => setModalFormatFilter(e.target.value as any)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[15px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Hình thức: Tất cả</option>
                      <option value="TRAC_NGHIEM">Hình thức: Trắc nghiệm</option>
                      <option value="TU_LUAN">Hình thức: Tự luận</option>
                      <option value="FILL_BLANK">Hình thức: Điền khuyết</option>
                      <option value="HON_HOP">Hình thức: Hỗn hợp</option>
                      <option value="THUC_HANH">Hình thức: Thực hành</option>
                    </FilterSelect>

                    <FilterSelect
                      value={modalSubjectFilter}
                      onChange={(e) => setModalSubjectFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[15px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[200px]"
                    >
                      <option value="ALL">Môn học: Tất cả</option>
                      {availableSubjects.map((sb) => (
                        <option key={sb.code} value={sb.code}>
                          [{sb.code}] {sb.name}
                        </option>
                      ))}
                    </FilterSelect>

                    <FilterSelect
                      value={modalStatusFilter}
                      onChange={(e) => setModalStatusFilter(e.target.value as any)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[15px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Trạng thái: Tất cả</option>
                      <option value="ONGOING">Đang diễn ra</option>
                      <option value="UPCOMING">Sắp diễn ra</option>
                      <option value="COMPLETED">Đã kết thúc</option>
                    </FilterSelect>

                    {(modalSearch || modalModeFilter !== 'ALL' || modalFormatFilter !== 'ALL' || modalSubjectFilter !== 'ALL' || modalStatusFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalSearch('');
                          setModalModeFilter('ALL');
                          setModalFormatFilter('ALL');
                          setModalSubjectFilter('ALL');
                          setModalStatusFilter('ALL');
                        }}
                        className="p-1 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer select-none ml-auto"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* List of filtered schedules */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-400 px-1">
                    <span>
                      Hiển thị {modalFilteredSchedules.length} / {schedules.length} ca thi
                    </span>
                  </div>

                  {modalFilteredSchedules.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs font-semibold text-slate-500">Không tìm thấy ca thi phù hợp với bộ lọc hiện tại.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setModalSearch('');
                          setModalModeFilter('ALL');
                          setModalFormatFilter('ALL');
                          setModalSubjectFilter('ALL');
                          setModalStatusFilter('ALL');
                        }}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Xóa bộ lọc để xem tất cả
                      </button>
                    </div>
                  ) : (
                    modalFilteredSchedules.map((s: any) => {
                      const isActive = selectedScheduleId === String(s.id);
                      const typeBadge = getScheduleTypeBadge(s);
                      const formatBadge = getExamFormatBadge(s);
                      const statusBadge = getScheduleStatusBadge(s);
                      const code = s.subjectCode || s.subject?.subjectCode || 'MH';
                      const name = s.subjectName || s.subject?.subjectName || 'Môn học';
                      const period = s.periodName || s.examPeriod?.name || 'Kỳ thi chung';

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedScheduleId(String(s.id));
                            setPage(1);
                            setShowSchedulePicker(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${isActive
                              ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 border-l-4 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{name}</span>
                              <span className="text-[12px] tabular-nums font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                {code}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <StatusBadge status={statusBadge.key} customLabel={statusBadge.label} />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[12px] ${typeBadge.badgeClass}`}>
                                {typeBadge.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[12px] ${formatBadge.badgeClass}`}>
                                {formatBadge.label}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500">· {period}</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {s.startTime}–{s.endTime} {s.examDate ? `· ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                  <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    Đã chọn lịch thi ID: <strong className="text-slate-800 dark:text-slate-100">#{selectedScheduleId || '---'}</strong>
                  </span>
                  <Button variant="secondary" size="md" onClick={() => setShowSchedulePicker(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── 4. Search & Action Toolbar Row (Single Unified Row) ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Search input + 1 Unified Filter Popover */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm theo mã SV, họ tên, lớp..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-[12px] text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}
            </div>

            <ExamReportFilterPopover
              summaryFilters={summaryFilters}
              setSummaryFilters={setSummaryFilters}
              summaryOptions={summary?.options}
              onResetAll={resetSummaryFilters}
            />
          </div>

          {/* Right: Sort, Columns, ViewMode, Refresh */}
          <ExamReportTableToolbar
            totalCount={filteredCandidates.length}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
            onRefresh={handleRefresh}
          />
        </div>

        {/* ── 5. Candidate Status Tabs ── */}
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả thí sinh', count: tabCounts.total },
            { key: 'SUBMITTED', label: 'Đã nộp bài', count: tabCounts.submitted },
            { key: 'ABSENT', label: 'Vắng thi', count: tabCounts.absent },
            ...(tabCounts.flagged > 0 ? [{ key: 'FLAGGED', label: 'Có cảnh báo', count: tabCounts.flagged }] : []),
          ]}
          active={statusFilter}
          onChange={(key) => {
            setStatusFilter(key);
            setPage(1);
          }}
        />

        {/* Full-Width DataGrid Table */}
        {loadingReport ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedCandidates.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
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
        title={drawerCandidate?.fullName || 'Hồ sơ thí sinh thi'}
        subtitle={`MSSV: ${drawerCandidate?.studentCode || ''}`}
        avatarText={drawerCandidate?.fullName?.trim().split(' ').pop()?.slice(0, 2).toUpperCase() || 'SV'}
        badge={{
          label: drawerCandidate?.status === 'ABSENT' ? 'Vắng thi' : `Điểm số: ${drawerCandidate?.totalScore ?? '--'} / 10`,
          className: drawerCandidate?.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Họ và tên thí sinh', value: drawerCandidate?.fullName, icon: GraduationCap },
          { label: 'Mã số sinh viên', value: drawerCandidate?.studentCode, icon: GraduationCap },
          { label: 'Lớp sinh hoạt', value: drawerCandidate?.className || '---', icon: GraduationCap },
          { label: 'Trạng thái thi', value: drawerCandidate?.status === 'ABSENT' ? 'Vắng thi' : drawerCandidate?.status === 'GRADED' ? 'Đã chấm điểm' : drawerCandidate?.status === 'SUBMITTED' ? 'Đã nộp bài' : 'Chưa nộp', icon: FileCheck },
          {
            label: 'Điểm số đạt được',
            value: drawerCandidate?.status === 'ABSENT' ? '0.0 (Vắng thi)' : `${drawerCandidate?.totalScore ?? 0} / 10 điểm`,
            icon: Award,
          },
          {
            label: 'Số lần ghi nhận vi phạm',
            value: `${drawerCandidate?.violationCount || 0} lần`,
            icon: AlertTriangle,
          },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
