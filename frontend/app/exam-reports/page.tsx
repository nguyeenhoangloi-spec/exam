'use client';
import { FilterSelect } from '../../components/ui/FilterSelect';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { downloadCsv } from '../../lib/export-csv';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
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
import { ExamReportBulkAction } from '../../components/exam-reports/ExamReportBulkAction';
import { ExamReportSummaryTab, SummaryData } from '../../components/exam-reports/ExamReportSummaryTab';
import { TabBar } from '../../components/ui/TabBar';
import { PageSkeleton } from '../../components/ui/Skeleton';

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


const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Đã nộp bài',
  AUTO_SUBMITTED: 'Tự động nộp bài',
  GRADED: 'Đã chấm điểm',
  UNDER_REVIEW: 'Đang xem xét',
  IN_PROGRESS: 'Đang làm bài',
  ABSENT: 'Vắng thi',
};

function formatCandidateStatus(status?: string): string {
  return CANDIDATE_STATUS_LABELS[String(status || '').toUpperCase()] || 'Chưa xác định';
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

    const startParts = (s.startTime || '00:00').split(':').map((v) => parseInt(v, 10));
    const endParts = (s.endTime || '23:59').split(':').map((v) => parseInt(v, 10));

    const startH = Number.isFinite(startParts[0]) ? startParts[0] : 0;
    const startM = Number.isFinite(startParts[1]) ? startParts[1] : 0;
    const endH = Number.isFinite(endParts[0]) ? endParts[0] : 23;
    const endM = Number.isFinite(endParts[1]) ? endParts[1] : 59;

    const startDateTime = new Date(y, m - 1, d, startH, startM, 0, 0);
    const endDateTime = new Date(y, m - 1, d, endH, endM, 0, 0);

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
  usePageTitle('Báo cáo & Thống kê');
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');

  const [activeMainTab, setActiveMainTab] = useState<'summary' | 'schedule'>(
    viewParam === 'schedule' ? 'schedule' : 'summary'
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [report, setReport] = useState<GradeReportResponse | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFilters, setSummaryFilters] = useState({
    examPeriodId: searchParams.get('examPeriodId') || 'ALL',
    subjectId: searchParams.get('subjectId') || 'ALL',
    departmentId: searchParams.get('departmentId') || 'ALL',
    classId: searchParams.get('classId') || 'ALL',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
  });
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // Chỉ chọn ca mặc định khi chưa có ca được chọn từ URL hoặc từ tab Thống kê kỳ thi.
  // Không để lần tải lại danh sách ghi đè ca chính thức người dùng vừa chọn.

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewParam === 'schedule') {
      setActiveMainTab('schedule');
    } else if (viewParam === 'summary') {
      setActiveMainTab('summary');
    }
  }, [viewParam]);

  useEffect(() => {
    const paramScheduleId = searchParams.get('scheduleId');
    if (paramScheduleId) {
      setSelectedScheduleId(paramScheduleId);
    }
  }, [searchParams]);

  const handleMainTabChange = (key: string) => {
    const nextTab = key as 'summary' | 'schedule';
    setActiveMainTab(nextTab);
    router.push(`/exam-reports?view=${nextTab}`, { scroll: false });
  };

  const handleSelectScheduleFromSummary = (scheduleId: number) => {
    setSelectedScheduleId(String(scheduleId));
    setActiveMainTab('schedule');
    router.push(`/exam-reports?view=schedule&scheduleId=${scheduleId}`, { scroll: false });
  };

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

  const modalFilteredSchedules = useMemo(() => {
    return schedules
      .filter((s: any) => {
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
      })
      .sort((a: any, b: any) => {
        const timeA = new Date(`${(a.examDate || '').split('T')[0]}T${a.startTime || '00:00'}:00`).getTime() || 0;
        const timeB = new Date(`${(b.examDate || '').split('T')[0]}T${b.startTime || '00:00'}:00`).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [schedules, modalSearch, modalModeFilter, modalFormatFilter, modalSubjectFilter, modalStatusFilter]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState('score_desc');
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
      const response = await api.get<SummaryData>(`/exam-reports/summary?${params.toString()}`);
      setSummary(response.data);
    } catch (error: any) {
      setToast({ message: error.message || 'Không tải được thống kê tổng hợp.', type: 'error' });
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryFilters]);

  useEffect(() => {
    if (activeMainTab !== 'summary') return;
    const params = new URLSearchParams({ view: 'summary' });
    Object.entries(summaryFilters).forEach(([key, value]) => {
      if (value && value !== 'ALL') params.set(key, value);
    });
    router.replace(`/exam-reports?${params.toString()}`, { scroll: false });
  }, [activeMainTab, router, summaryFilters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const response = await api.get<ExamSchedule[]>('/exam-reports/schedules');
      const data = response.data || [];
      setSchedules(data);
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

  useEffect(() => {
    if (!selectedScheduleId && !searchParams.get('scheduleId') && schedules.length > 0) {
      const sorted = [...schedules].sort((a: any, b: any) => {
        const timeA = new Date(`${(a.examDate || '').split('T')[0]}T${a.startTime || '00:00'}:00`).getTime() || 0;
        const timeB = new Date(`${(b.examDate || '').split('T')[0]}T${b.startTime || '00:00'}:00`).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
      setSelectedScheduleId(String(sorted[0].id));
    }
  }, [schedules, selectedScheduleId, searchParams]);

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
      `"${formatCandidateStatus(c.status)}"`,
      c.status === 'ABSENT' ? 'Vắng thi' : c.totalScore,
      c.submittedAt ? `"${new Date(c.submittedAt).toLocaleString('vi-VN')}"` : '—',
      c.violationCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    downloadCsv(`Bao_Cao_Diem_${report.schedule.subjectCode}_Ca_${report.schedule.id}.csv`, csvContent);
    setToast({ message: 'Đã xuất file Bảng điểm CSV thành công!', type: 'success' });
  };

  const exportSummaryExcel = async () => {
    if (!summary) {
      setToast({ message: 'Chưa có dữ liệu tổng hợp để xuất.', type: 'error' });
      return;
    }
    await exportToFormattedExcel({
      filename: `Bao_Cao_Tong_Ket_Khao_Thi_${new Date().toISOString().slice(0, 10)}.xls`,
      templateCode: 'EXAM_SUMMARY_REPORT',
      title: 'BÁO CÁO TỔNG KẾT KHẢO THÍ',
      subtitle: `Kỳ thi Học kỳ 1 – Năm học 2025–2026, tổng số ${summary.stats.totalSchedules} ca thi`,
      columns: [
        { header: 'STT', align: 'center', width: 6 },
        { header: 'Kỳ thi', width: 22 },
        { header: 'Mã môn', width: 14 },
        { header: 'Môn học', width: 24 },
        { header: 'Khoa', width: 20 },
        { header: 'Ngày thi', align: 'center', width: 14 },
        { header: 'Được gán', align: 'center', width: 12 },
        { header: 'Đã nộp', align: 'center', width: 12 },
        { header: 'Vắng', align: 'center', width: 10 },
        { header: 'Chưa chấm', align: 'center', width: 12 },
        { header: 'Bất thường', align: 'center', width: 12 },
        { header: 'Điểm TB', align: 'center', width: 12 },
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
 <td style="text-align: center; border: 1px solid #000000; padding: 5px 6px;">${idx + 1}</td>
 <td style="border: 1px solid #000000; padding: 5px 6px; font-weight: bold;">${escapeHtml(c.studentCode)}</td>
 <td style="border: 1px solid #000000; padding: 5px 6px;">${escapeHtml(c.fullName)}</td>
 <td style="border: 1px solid #000000; padding: 5px 6px;">${escapeHtml(c.className)}</td>
 <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${formatCandidateStatus(c.status)}</td>
 <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center; font-weight: bold; font-size: 10.5pt; color: #000000;">${c.status === 'ABSENT' ? 'Vắng' : c.totalScore}</td>
 <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString('vi-VN') : '—'}</td>
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
 body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; color: #000000; padding: 15px; margin: 0; }
 .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
 .title { text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 10px 0 6px 0; }
 .meta { font-size: 10pt; margin-bottom: 12px; line-height: 1.5; color: #000000; border-bottom: 1px solid #000000; padding-bottom: 6px; }
 table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; table-layout: fixed; page-break-inside: auto; }
 table.data-table thead { display: table-header-group; }
 table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
 table.data-table th { border: 1px solid #000000; background-color: transparent; padding: 6px; text-align: center; color: #000000; font-weight: bold; }
 table.data-table td { border: 1px solid #000000; padding: 5px 6px; color: #000000; word-break: break-word; }
 @media print { body { padding: 0; } @page { size: A4 portrait; margin: 10mm; } }
 </style>
 </head>
 <body>
 <table class="header-table">
   <tr>
     <td style="width:50%; text-align:center; vertical-align:top; border:none; padding:0;">
       <div style="font-weight:bold; font-size:10.5pt;">TRƯỜNG ĐẠI HỌC NAM CẦN THƠ</div>
       <div style="font-size:10pt;">KHOA CÔNG NGHỆ THÔNG TIN</div>
       <div style="border-top:1px solid #000; display:inline-block; width:110px; margin-top:2px;"></div>
     </td>
     <td style="width:50%; text-align:center; vertical-align:top; border:none; padding:0;">
       <div style="font-weight:bold; font-size:10.5pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
       <div style="font-weight:bold; font-size:10pt; font-style:italic;">Độc lập - Tự do - Hạnh phúc</div>
       <div style="border-top:1px solid #000; display:inline-block; width:110px; margin-top:2px;"></div>
     </td>
   </tr>
 </table>
 <div class="title">BẢNG TỔNG HỢP KẾT QUẢ ĐIỂM THI CA THI</div>
 <div class="meta">
 <p style="margin:2px 0;"><strong>Môn học:</strong> ${escapeHtml(report.schedule.subjectName)} (${escapeHtml(report.schedule.subjectCode)})</p>
 <p style="margin:2px 0;"><strong>Kỳ thi:</strong> ${escapeHtml(report.schedule.periodName)}, <strong>Ngày thi:</strong> ${report.schedule.examDate} (${report.schedule.startTime} – ${report.schedule.endTime})</p>
 </div>
 <table class="data-table">
 <thead>
 <tr>
 <th style="width: 40px;">STT</th>
 <th style="width: 90px;">Mã Sinh Viên</th>
 <th>Họ và Tên</th>
 <th style="width: 100px;">Lớp Học</th>
 <th style="width: 90px;">Trạng Thái</th>
 <th style="width: 70px;">Điểm Thi</th>
 <th style="width: 80px;">Giờ Nộp</th>
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

  if (loadingSchedules && !schedules.length && !summary) {
    return <PageSkeleton hasKPIs={true} variant="table" />;
  }

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen animate-in fade-in-0 duration-200">
        {/* Header */}
        <ExamReportHeader
          title={activeMainTab === 'summary' ? 'Tổng báo cáo' : 'Bảng điểm chi tiết ca thi'}
          subtitle={
            activeMainTab === 'summary'
              ? 'Tổng hợp, tạo và xuất báo cáo khảo thí theo nhu cầu trong phạm vi được phép'
              : 'Xem kết quả điểm thi chi tiết, tỷ lệ đạt, thống kê vi phạm và xuất báo cáo ca thi'
          }
          onExport={activeMainTab === 'schedule' ? exportSummaryCsv : undefined}
          onExportExcel={activeMainTab === 'schedule' ? exportSummaryExcel : undefined}
          onPrint={activeMainTab === 'schedule' ? printOfficialReport : undefined}
        />

        {/* KPI Cards chuẩn mực của hệ thống - Giữ nguyên không đụng */}
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

        {activeMainTab === 'summary' ? (
          <ExamReportSummaryTab
            summary={summary}
            loading={summaryLoading}
            filters={summaryFilters}
            setFilters={setSummaryFilters}
            onSelectSchedule={handleSelectScheduleFromSummary}
            onRefresh={fetchSummary}
          />
        ) : (
          <>
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
              <div role="dialog" aria-modal="true" aria-label="Chọn Lịch thi để xem Báo cáo" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop" onClick={() => setShowSchedulePicker(false)} />
                <div className="relative z-[101] w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] animate-modal-dialog will-change-transform sm:max-h-[calc(100dvh-2rem)]">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
                    <div>
                      <p className="text-type-section font-semibold text-slate-900 tracking-tight">Chọn Lịch thi để xem Báo cáo</p>
                      <p className="text-type-helper text-slate-500 font-semibold mt-1">
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
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-type-body font-normal text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                      />
                      {modalSearch && (
                        <button
                          type="button"
                          onClick={() => setModalSearch('')}
                          className="absolute right-3 top-2 text-type-helper text-slate-400 hover:text-slate-600 cursor-pointer"
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
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-type-body font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
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
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-type-body font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[200px]"
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
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-type-body font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
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
                    <div className="flex items-center justify-between text-type-helper font-semibold text-slate-400 px-1">
                      <span>
                        Hiển thị {modalFilteredSchedules.length} / {schedules.length} ca thi
                      </span>
                    </div>

                    {modalFilteredSchedules.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-type-helper font-semibold text-slate-500">Không tìm thấy ca thi phù hợp với bộ lọc hiện tại.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearch('');
                            setModalModeFilter('ALL');
                            setModalFormatFilter('ALL');
                            setModalSubjectFilter('ALL');
                            setModalStatusFilter('ALL');
                          }}
                          className="mt-2 text-type-helper font-semibold text-blue-600 hover:underline cursor-pointer"
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
                              : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800/60'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">{name}</span>
                                <span className="text-type-helper tabular-nums font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                  {code}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <StatusBadge status={statusBadge.key} customLabel={statusBadge.label} />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between text-type-helper text-slate-500 dark:text-slate-400 gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-type-helper ${typeBadge.badgeClass}`}>
                                  {typeBadge.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-type-helper ${formatBadge.badgeClass}`}>
                                  {formatBadge.label}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500">| {period}</span>
                              </div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {s.startTime}–{s.endTime}{s.examDate ? ` | ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                    <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">
                      Đã chọn lịch thi ID: <strong className="text-slate-800 dark:text-slate-100">#{selectedScheduleId || '---'}</strong>
                    </span>
                    <Button variant="secondary" size="md" onClick={() => setShowSchedulePicker(false)}>
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. Candidate Status Tabs ── */}
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

            {/* ── 5. Search & Action Toolbar Row (Single Unified Row) ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
              <div className="relative flex-1 max-w-xl min-w-[240px]">
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
                  className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                />

                {/* Embedded actions on right edge of search input */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {search ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                      title="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <kbd
                      className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                      onClick={() => searchInputRef.current?.focus()}
                      title="Nhấn phím / để tìm nhanh"
                    >
                      /
                    </kbd>
                  )}

                  <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

                  <ExamReportFilterPopover
                    summaryFilters={summaryFilters}
                    setSummaryFilters={setSummaryFilters}
                    summaryOptions={summary?.options}
                    onResetAll={resetSummaryFilters}
                  />
                </div>
              </div>

              {/* Right: Sort, Columns, Refresh */}
              <ExamReportTableToolbar
                totalCount={filteredCandidates.length}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                visibleColumns={visibleColumns}
                onColumnToggle={handleColumnToggle}
                onRefresh={handleRefresh}
              />
            </div>

            {/* Full-Width DataGrid Table */}
            {loadingReport ? (
              <div className="space-y-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : !paginatedCandidates.length ? (
              <div className="rounded-2xl border border-slate-200/60 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
                Không tìm thấy thí sinh phù hợp trong ca thi này.
              </div>
            ) : (
              <ExamReportTable
                candidates={paginatedCandidates}
                selected={selected}
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

            {/* Floating Bulk Action Bar */}
            <ExamReportBulkAction
              selectedCount={selected.length}
              totalCount={filteredCandidates.length}
              allSelected={selected.length === filteredCandidates.length && filteredCandidates.length > 0}
              onToggleAll={() =>
                setSelected(selected.length === filteredCandidates.length ? [] : filteredCandidates.map((c) => c.studentId))
              }
              onExportExcel={() => {
                const selectedCandidates = filteredCandidates.filter((c) => selected.includes(c.studentId));
                const columns = [
                  { header: 'STT', width: 8, align: 'center' as const },
                  { header: 'Mã SV', width: 15 },
                  { header: 'Họ và tên thí sinh', width: 25 },
                  { header: 'Lớp sinh hoạt', width: 18 },
                  { header: 'Trạng thái', width: 15, align: 'center' as const },
                  { header: 'Điểm số', width: 12, align: 'center' as const },
                  { header: 'Vi phạm', width: 10, align: 'center' as const },
                ];
                const rows = selectedCandidates.map((c, idx) => [
                  idx + 1,
                  c.studentCode,
                  c.fullName,
                  c.className || '---',
                  c.status,
                  c.status === 'ABSENT' ? 'Vắng' : c.totalScore,
                  c.violationCount || 0,
                ]);
                exportToFormattedExcel({
                  filename: 'Bang_diem_thi_sinh_da_chon.xls',
                  title: 'KẾT QUẢ THI THÍ SINH ĐÃ CHỌN',
                  subtitle: `Môn: ${report?.schedule?.subjectName || ''} | Đã trích xuất ${selectedCandidates.length} thí sinh`,
                  columns,
                  rows,
                });
                setToast({ message: `Đã xuất ${selected.length} kết quả thi ra Excel`, type: 'success' });
              }}
              onPrint={() => {
                const selectedCandidates = filteredCandidates.filter((c) => selected.includes(c.studentId));
                printReport({
                  title: 'BẢNG ĐIỂM THÍ SINH ĐÃ CHỌN',
                  subtitle: `Môn: ${report?.schedule?.subjectName || ''} (${report?.schedule?.subjectCode || ''}) - Ngày thi: ${report?.schedule?.examDate ? new Date(report.schedule.examDate).toLocaleDateString('vi-VN') : '---'}`,
                  metaInfo: [
                    { label: 'Số lượng thí sinh', value: String(selectedCandidates.length) },
                  ],
                  columns: [
                    { header: 'STT', width: '40px' },
                    { header: 'Mã SV', width: '90px', align: 'center' },
                    { header: 'Họ và tên', width: '200px' },
                    { header: 'Lớp', width: '100px', align: 'center' },
                    { header: 'Trạng thái', width: '100px', align: 'center' },
                    { header: 'Điểm', width: '70px', align: 'center' },
                  ],
                  rows: selectedCandidates.map((c, idx) => [
                    idx + 1,
                    c.studentCode,
                    c.fullName,
                    c.className || '---',
                    c.status === 'ABSENT' ? 'Vắng thi' : 'Đã nộp',
                    c.status === 'ABSENT' ? '0.0' : String(c.totalScore),
                  ]),
                });
              }}
              onClear={() => setSelected([])}
            />
          </>
        )}
      </main>

      {/* Candidate Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerCandidate)}
        onClose={() => setDrawerCandidate(null)}
        title={drawerCandidate?.fullName || 'Hồ sơ thí sinh thi'}
        subtitle={drawerCandidate?.studentCode ? `MSSV: ${drawerCandidate.studentCode}` : ''}
        avatarText={drawerCandidate?.fullName?.trim().split(' ').pop()?.slice(0, 2).toUpperCase() || 'SV'}
        badge={drawerCandidate?.status ? {
          status: drawerCandidate.status,
          label: drawerCandidate.status === 'ABSENT' ? 'Vắng thi' : drawerCandidate.status === 'GRADED' ? 'Đã chấm điểm' : drawerCandidate.status === 'SUBMITTED' ? 'Đã nộp bài' : 'Chưa nộp',
        } : undefined}
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
