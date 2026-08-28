'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Layers,
  Trash2,
  Clock,
  X,
  FileText,
} from 'lucide-react';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Button } from '../../../components/ui/Button';
import { DataActionsDropdown } from '../../../components/ui/DataActionsDropdown';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { PaginationBar } from '../../../components/ui/PaginationBar';
import { ExamArchiveDetailModal } from '../../../components/exam-archives/ExamArchiveDetailModal';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import {
  printReport,
  getPublishedTemplatesMap,
  printBatchArchivedDossier,
  printDisposalProposal,
} from '../../../lib/export-print';

interface ArchiveSummary {
  totalArchivedSchedules: number;
  totalArchivedAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number;
  flaggedAttempts: number;
  retainedCount: number;
  disposalEligibleCount: number;
  retentionYears?: number;
}

interface ArchivedSchedule {
  id: number;
  examPeriodName: string;
  semester: string;
  schoolYear: string;
  subjectCode: string;
  subjectName: string;
  departmentName: string;
  examDate: string;
  timeSlot: string;
  examType: string;
  paperCode: string;
  archivedAttemptsCount: number;
  retentionUntil: string;
  retentionStatus: 'RETAINED' | 'ELIGIBLE_FOR_DISPOSAL';
  remainingTimeText: string;
  isEligibleForDisposal: boolean;
}

interface ArchivedAttempt {
  id: string;
  studentCode: string;
  fullName: string;
  className: string;
  totalScore: number;
  maxScore: number;
  submittedAt: string | null;
  publishedAt: string | null;
  gradedBy: string | null;
  approvedBy: string | null;
  sealHash: string;
  sealShort: string;
  isFlagged: boolean;
  penaltyPoints: number;
}

interface FilterOptions {
  examPeriods: Array<{ id: number; name: string; semester: string; schoolYear: string }>;
  departments: Array<{ id: number; name: string; code: string }>;
}

export default function ExamArchivesPage() {
  usePageTitle('Kho lưu trữ bài thi');

  const [summary, setSummary] = useState<ArchiveSummary | null>(null);
  const [schedules, setSchedules] = useState<ArchivedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<ArchivedSchedule | null>(null);
  const [attempts, setAttempts] = useState<ArchivedAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Filters
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ examPeriods: [], departments: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedRetentionStatus, setSelectedRetentionStatus] = useState<string>('');

  // Pagination states
  const [schedulePage, setSchedulePage] = useState(1);
  const [scheduleLimit, setScheduleLimit] = useState(10);
  const [attemptPage, setAttemptPage] = useState(1);
  const [attemptLimit, setAttemptLimit] = useState(10);

  // Batch Print Loading
  const [isPrintingBatch, setIsPrintingBatch] = useState(false);

  // Modal
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    api.get('/exam-archives/filter-options')
      .then((res) => setFilterOptions(res.data))
      .catch((err) => console.error('Không thể tải danh mục lọc:', err));
  }, []);

  // Load summary and schedules
  const loadArchiveData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, schedRes] = await Promise.all([
        api.get('/exam-archives/summary'),
        api.get('/exam-archives/schedules', {
          params: {
            search: searchQuery.trim() || undefined,
            examPeriodId: selectedPeriodId ? Number(selectedPeriodId) : undefined,
            departmentId: selectedDepartmentId ? Number(selectedDepartmentId) : undefined,
            retentionStatus: selectedRetentionStatus || undefined,
          },
        }),
      ]);
      setSummary(sumRes.data);
      setSchedules(schedRes.data);
    } catch (err) {
      console.error('Không thể tải dữ liệu kho lưu trữ:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedPeriodId, selectedDepartmentId, selectedRetentionStatus]);

  useEffect(() => {
    loadArchiveData();
    getPublishedTemplatesMap().catch(() => {});
  }, [loadArchiveData]);

  // Load attempts when a schedule is selected
  const handleSelectSchedule = async (sched: ArchivedSchedule) => {
    setSelectedSchedule(sched);
    setAttemptPage(1);
    setLoadingAttempts(true);
    try {
      const res = await api.get(`/exam-archives/schedules/${sched.id}/attempts`, {
        params: { search: searchQuery.trim() || undefined },
      });
      setAttempts(res.data.attempts || []);
    } catch (err) {
      console.error('Không thể tải danh sách bài thi ca thi:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleBackToSchedules = () => {
    setSelectedSchedule(null);
    setAttempts([]);
    setAttemptPage(1);
  };

  const handleOpenDetail = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setIsModalOpen(true);
  };

  // In trọn bộ túi hồ sơ bài thi của ca thi
  const handlePrintBatchDossier = async () => {
    if (!selectedSchedule) return;
    setIsPrintingBatch(true);
    try {
      const res = await api.get(`/exam-archives/schedules/${selectedSchedule.id}/batch-dossier`);
      printBatchArchivedDossier(res.data);
    } catch (err) {
      console.error('Không thể trích xuất trọn bộ túi bài thi:', err);
    } finally {
      setIsPrintingBatch(false);
    }
  };

  // Lập biên bản đề xuất tiêu hủy bài thi đã hết niên hạn 2 năm
  const handlePrintDisposalProposal = async (scheduleId: number) => {
    try {
      const res = await api.get(`/exam-archives/schedules/${scheduleId}/disposal-proposal`);
      printDisposalProposal(res.data);
    } catch (err) {
      console.error('Không thể lập biên bản đề xuất tiêu hủy bài thi:', err);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPeriodId('');
    setSelectedDepartmentId('');
    setSelectedRetentionStatus('');
    setSchedulePage(1);
    setAttemptPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedPeriodId || selectedDepartmentId || selectedRetentionStatus
  );

  // Paginated slices
  const paginatedSchedules = useMemo(() => {
    const start = (schedulePage - 1) * scheduleLimit;
    return schedules.slice(start, start + scheduleLimit);
  }, [schedules, schedulePage, scheduleLimit]);

  const paginatedAttempts = useMemo(() => {
    const start = (attemptPage - 1) * attemptLimit;
    return attempts.slice(start, start + attemptLimit);
  }, [attempts, attemptPage, attemptLimit]);

  // Xuất Excel bảng điểm ca thi
  const handleExportExcel = () => {
    if (!selectedSchedule || attempts.length === 0) return;

    exportToFormattedExcel({
      templateCode: 'EXAM_ARCHIVE_LIST',
      filename: `KHO_LUU_TRU_${selectedSchedule.subjectCode}.xlsx`,
      title: 'BẢNG ĐIỂM BÀI THI LƯU TRỮ ĐÃ CÔNG BỐ',
      metaInfo: [
        { label: 'Môn học', value: `${selectedSchedule.subjectName} (${selectedSchedule.subjectCode})` },
        { label: 'Kỳ thi', value: selectedSchedule.examPeriodName },
        { label: 'Ngày thi', value: `${new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')} (${selectedSchedule.timeSlot})` },
        { label: 'Tổng số bài thi', value: `${attempts.length} bài` },
        { label: 'Niên hạn lưu trữ', value: `Đến ${new Date(selectedSchedule.retentionUntil).toLocaleDateString('vi-VN')} (${selectedSchedule.remainingTimeText})` },
      ],
      columns: [
        { header: 'STT', width: 8, align: 'center' },
        { header: 'Mã SV', width: 14, align: 'center' },
        { header: 'Họ và Tên', width: 25 },
        { header: 'Lớp', width: 14, align: 'center' },
        { header: 'Điểm Số', width: 12, align: 'center' },
        { header: 'Mã Niêm Phong (Hash)', width: 18, align: 'center' },
        { header: 'Cán Bộ Duyệt', width: 20 },
      ],
      rows: attempts.map((a, idx) => [
        idx + 1,
        a.studentCode,
        a.fullName,
        a.className,
        a.totalScore,
        a.sealShort,
        a.approvedBy || 'Hội đồng Khảo thí',
      ]),
      signers: [
        { title: 'CÁN BỘ CHẤM THI', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu lưu trữ)' },
      ],
    });
  };

  // In bảng điểm dán túi bài
  const handlePrintList = () => {
    if (!selectedSchedule || attempts.length === 0) return;

    printReport({
      templateCode: 'EXAM_ARCHIVE_LIST',
      title: 'DANH SÁCH BÀI THI LƯU TRỮ ĐÃ NIÊM PHONG',
      metaInfo: [
        { label: 'Môn học', value: `${selectedSchedule.subjectName} (${selectedSchedule.subjectCode})` },
        { label: 'Kỳ thi', value: selectedSchedule.examPeriodName },
        { label: 'Ngày thi', value: `${new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')} (${selectedSchedule.timeSlot})` },
        { label: 'Tổng số bài', value: `${attempts.length} bài thi lưu trữ` },
        { label: 'Niên hạn lưu trữ', value: `Hết hạn ngày ${new Date(selectedSchedule.retentionUntil).toLocaleDateString('vi-VN')} (${selectedSchedule.remainingTimeText})` },
      ],
      columns: [
        { header: 'STT', width: '6%', align: 'center' },
        { header: 'Mã SV', width: '14%', align: 'center' },
        { header: 'Họ và Tên', width: '28%' },
        { header: 'Lớp', width: '14%', align: 'center' },
        { header: 'Điểm', width: '10%', align: 'center' },
        { header: 'Mã Niêm Phong', width: '14%', align: 'center' },
        { header: 'Cán Bộ Duyệt', width: '14%' },
      ],
      rows: attempts.map((a, idx) => [
        idx + 1,
        a.studentCode,
        a.fullName,
        a.className,
        a.totalScore,
        a.sealShort,
        a.approvedBy || 'Hội đồng Khảo thí',
      ]),
      signers: [
        { title: 'CÁN BỘ CHẤM THI', subtitle: '(Ký và ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu xác nhận)' },
      ],
    });
  };

  // Xuất Excel danh mục các ca thi đã lưu trữ
  const exportSummaryExcel = () => {
    if (schedules.length === 0) return;
    exportToFormattedExcel({
      templateCode: 'EXAM_ARCHIVE_LIST',
      filename: `DANH_MUC_CA_THI_LUU_TRU_${new Date().toISOString().slice(0, 10)}.xlsx`,
      title: 'DANH MỤC CA THI LƯU TRỮ ĐÃ NIÊM PHONG',
      metaInfo: [
        { label: 'Tổng số ca thi', value: `${schedules.length} ca thi` },
        { label: 'Tổng số bài thi lưu', value: `${summary?.totalArchivedAttempts ?? 0} bài` },
        { label: 'Ngày xuất dữ liệu', value: new Date().toLocaleDateString('vi-VN') },
      ],
      columns: [
        { header: 'STT', width: 8, align: 'center' },
        { header: 'Mã Môn', width: 14, align: 'center' },
        { header: 'Tên Học Phần', width: 28 },
        { header: 'Khoa Đào Tạo', width: 22 },
        { header: 'Kỳ Thi', width: 25 },
        { header: 'Ngày Thi', width: 14, align: 'center' },
        { header: 'Ca Thi', width: 14, align: 'center' },
        { header: 'Số Bài Lưu', width: 12, align: 'center' },
        { header: 'Niên Hạn Lưu Trữ', width: 22 },
      ],
      rows: schedules.map((s, idx) => [
        idx + 1,
        s.subjectCode,
        s.subjectName,
        s.departmentName || '',
        `${s.examPeriodName} (${s.schoolYear})`,
        s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : '',
        s.timeSlot,
        s.archivedAttemptsCount,
        s.isEligibleForDisposal ? 'Đủ niên hạn tiêu hủy' : s.remainingTimeText,
      ]),
      signers: [
        { title: 'CÁN BỘ LẬP BẢNG', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu lưu trữ)' },
      ],
    });
  };

  // In danh mục ca thi lưu trữ
  const printSchedulesReport = () => {
    if (schedules.length === 0) return;
    printReport({
      templateCode: 'EXAM_ARCHIVE_LIST',
      title: 'DANH MỤC CA THI LƯU TRỮ ĐÃ CÔNG BỐ',
      metaInfo: [
        { label: 'Tổng số ca thi', value: `${schedules.length} ca thi` },
        { label: 'Tổng số bài thi lưu', value: `${summary?.totalArchivedAttempts ?? 0} bài thi` },
        { label: 'Thời gian trích xuất', value: new Date().toLocaleDateString('vi-VN') },
      ],
      columns: [
        { header: 'STT', width: '6%', align: 'center' },
        { header: 'Mã Môn', width: '12%', align: 'center' },
        { header: 'Học Phần', width: '28%' },
        { header: 'Kỳ Thi', width: '22%' },
        { header: 'Ngày Thi', width: '14%', align: 'center' },
        { header: 'Số Bài', width: '8%', align: 'center' },
        { header: 'Niên Hạn', width: '10%' },
      ],
      rows: schedules.map((s, idx) => [
        idx + 1,
        s.subjectCode,
        s.subjectName,
        s.examPeriodName,
        s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : '',
        s.archivedAttemptsCount,
        s.isEligibleForDisposal ? 'Hết hạn' : s.remainingTimeText,
      ]),
      signers: [
        { title: 'CÁN BỘ LẬP BẢNG', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký, đóng dấu xác nhận)' },
      ],
    });
  };

  return (
    <main className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6 space-y-5">
      {/* Header chuẩn hóa toàn hệ thống - Đồng bộ 100% với ExamReportHeader, TeacherHeader */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-type-page font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
            Kho lưu trữ bài thi
          </h1>
          <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            {selectedSchedule
              ? `${selectedSchedule.subjectName} (${selectedSchedule.subjectCode}) · ${selectedSchedule.examPeriodName} · ${selectedSchedule.schoolYear}`
              : 'Quản lý và trích lục hồ sơ bài thi đã công bố niêm phong theo quy chế khảo thí'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedSchedule && (
            <button
              type="button"
              onClick={handleBackToSchedules}
              title="Quay lại danh sách ca thi"
              aria-label="Quay lại danh sách ca thi"
              className="group flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.9} />
            </button>
          )}

          {/* Icon in ấn & xuất dữ liệu chuẩn mực DataActionsDropdown đồng bộ toàn hệ thống */}
          <DataActionsDropdown
            onExportExcel={selectedSchedule ? handleExportExcel : exportSummaryExcel}
            onPrint={selectedSchedule ? handlePrintList : printSchedulesReport}
            printLabel={selectedSchedule ? 'In bảng điểm' : 'In báo cáo'}
            customItems={
              selectedSchedule
                ? [
                    {
                      label: 'In túi bài thi',
                      icon: <Layers className="h-4 w-4 text-blue-600" />,
                      onClick: handlePrintBatchDossier,
                    },
                  ]
                : []
            }
          />
        </div>
      </div>

      {/* Filter Toolbar (Flat, Clean & Responsive, đồng bộ với toàn hệ thống) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSchedulePage(1);
              setAttemptPage(1);
            }}
            placeholder={
              selectedSchedule
                ? 'Tìm theo MSSV, họ và tên thí sinh...'
                : 'Tìm theo tên môn, mã học phần, kỳ thi...'
            }
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-type-body text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSchedulePage(1);
                setAttemptPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Modern FilterSelect dropdowns on Schedule list */}
        {!selectedSchedule && (
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              size="md"
              value={selectedPeriodId}
              onChange={(e) => {
                setSelectedPeriodId(e.target.value);
                setSchedulePage(1);
              }}
              className="min-w-[170px]"
            >
              <option value="">Tất cả kỳ thi</option>
              {filterOptions.examPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.schoolYear})
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              size="md"
              value={selectedDepartmentId}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value);
                setSchedulePage(1);
              }}
              className="min-w-[180px]"
            >
              <option value="">Tất cả khoa đào tạo</option>
              {filterOptions.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              size="md"
              value={selectedRetentionStatus}
              onChange={(e) => {
                setSelectedRetentionStatus(e.target.value);
                setSchedulePage(1);
              }}
              className="min-w-[170px]"
            >
              <option value="">Tất cả niên hạn</option>
              <option value="RETAINED">Còn trong hạn (&lt; {summary?.retentionYears || 2} năm)</option>
              <option value="ELIGIBLE_FOR_DISPOSAL">Đủ hạn tiêu hủy (&ge; {summary?.retentionYears || 2} năm)</option>
            </FilterSelect>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-type-meta h-10 px-3 text-slate-500 hover:text-slate-800"
              >
                Đặt lại
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedSchedule ? (
        /* View 1: Danh sách các ca thi đã lưu trữ */
        <>
          <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50/60 dark:bg-slate-800/60 text-type-body-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="p-3.5 pl-4 text-center w-12 font-medium">STT</th>
                  <th scope="col" className="p-3.5 min-w-[220px] font-medium">Học phần</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap font-medium">Kỳ thi / Niên khóa</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap font-medium">Ngày thi và Ca thi</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap text-center font-medium">Bài thi lưu</th>
                  <th scope="col" className="p-3.5 pr-4 whitespace-nowrap text-right font-medium">Niên hạn lưu trữ ({summary?.retentionYears || 2} năm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Đang tải danh sách ca thi lưu trữ...
                    </td>
                  </tr>
                ) : paginatedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Chưa có ca thi nào hoàn tất công bố và chuyển vào kho lưu trữ phù hợp điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((s, idx) => (
                    <tr
                      key={s.id}
                      onClick={() => handleSelectSchedule(s)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5 pl-4 text-center text-slate-400 font-normal">
                        {(schedulePage - 1) * scheduleLimit + idx + 1}
                      </td>
                      <td className="p-3.5 font-normal">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {s.subjectName}
                        </div>
                        <div className="text-type-meta text-slate-500 dark:text-slate-400 tabular-nums">
                          {s.subjectCode} {s.departmentName ? `· ${s.departmentName}` : ''}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-normal text-slate-600 dark:text-slate-400">
                        {s.examPeriodName} · {s.schoolYear}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-normal text-slate-600 dark:text-slate-400">
                        {s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : ''} ({s.timeSlot})
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center font-normal tabular-nums">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {s.archivedAttemptsCount} bài
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 whitespace-nowrap font-normal">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {s.isEligibleForDisposal ? (
                              <span className="text-amber-600 dark:text-amber-400">Đủ niên hạn tiêu hủy</span>
                            ) : (
                              <span>{s.remainingTimeText}</span>
                            )}
                          </div>
                          <span className="text-type-meta text-slate-400 dark:text-slate-500">
                            {s.isEligibleForDisposal ? 'Hết hạn: ' : 'Đến ngày: '}
                            {s.retentionUntil ? new Date(s.retentionUntil).toLocaleDateString('vi-VN') : '—'}
                          </span>
                          {s.isEligibleForDisposal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintDisposalProposal(s.id);
                              }}
                              className="mt-1 h-7 px-2.5 inline-flex items-center gap-1.5 rounded-xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors text-type-meta font-medium cursor-pointer"
                              title={`Lập biên bản đề xuất tiêu hủy bài thi hết hạn ${summary?.retentionYears || 2} năm`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Lập BB tiêu hủy</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang danh mục ca thi (nằm ngoài khung theo chuẩn toàn hệ thống) */}
          {schedules.length > 0 && (
            <PaginationBar
              page={schedulePage}
              totalPages={Math.max(1, Math.ceil(schedules.length / scheduleLimit))}
              limit={scheduleLimit}
              totalItems={schedules.length}
              unit="ca thi"
              onPage={setSchedulePage}
              onLimit={(l) => {
                setScheduleLimit(l);
                setSchedulePage(1);
              }}
            />
          )}
        </>
      ) : (
        /* View 2: Danh sách bài thi của sinh viên trong ca thi đã chọn */
        <>
          <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50/60 dark:bg-slate-800/60 text-type-body-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="p-3.5 pl-4 text-center w-12 font-medium">STT</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap font-medium">Mã sinh viên</th>
                  <th scope="col" className="p-3.5 min-w-[180px] font-medium">Họ và Tên thí sinh</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap font-medium">Lớp</th>
                  <th scope="col" className="p-3.5 whitespace-nowrap text-center font-medium">Điểm số</th>
                  <th scope="col" className="p-3.5 pr-4 whitespace-nowrap text-right font-medium">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {loadingAttempts ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Đang trích xuất bài thi từ kho lưu trữ...
                    </td>
                  </tr>
                ) : paginatedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Không tìm thấy bài thi nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  paginatedAttempts.map((att, idx) => (
                    <tr
                      key={att.id}
                      onClick={() => handleOpenDetail(att.id)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5 pl-4 text-center text-slate-400 font-normal">
                        {(attemptPage - 1) * attemptLimit + idx + 1}
                      </td>
                      <td className="p-3.5 whitespace-nowrap tabular-nums font-normal text-slate-800 dark:text-slate-200">
                        {att.studentCode}
                      </td>
                      <td className="p-3.5 font-normal text-slate-900 dark:text-slate-100">
                        {att.fullName}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-normal text-slate-600 dark:text-slate-400">{att.className}</td>
                      <td className="p-3.5 whitespace-nowrap text-center font-normal">
                        <span className="inline-flex items-center justify-center gap-1.5 tabular-nums font-semibold text-slate-950 dark:text-slate-50">
                          <span>{att.totalScore}đ</span>
                          <span title={`Mã niêm phong số: ${att.sealHash}`} className="inline-flex items-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 whitespace-nowrap text-right font-normal tabular-nums text-slate-500">
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleTimeString('vi-VN')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang danh sách bài thi ca thi (nằm ngoài khung theo chuẩn toàn hệ thống) */}
          {attempts.length > 0 && (
            <PaginationBar
              page={attemptPage}
              totalPages={Math.max(1, Math.ceil(attempts.length / attemptLimit))}
              limit={attemptLimit}
              totalItems={attempts.length}
              unit="bài thi"
              onPage={setAttemptPage}
              onLimit={(l) => {
                setAttemptLimit(l);
                setAttemptPage(1);
              }}
            />
          )}
        </>
      )}

      {/* Modal Xem Hồ Sơ Bài Thi Lưu Trữ */}
      <ExamArchiveDetailModal
        attemptId={selectedAttemptId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAttemptId(null);
        }}
      />
    </main>
  );
}
