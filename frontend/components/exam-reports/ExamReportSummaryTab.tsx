'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Columns3,
  FileSpreadsheet,
  FileText,
  GripVertical,
  History,
  Pencil,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  Users,
  X,
  Edit2,
  Calculator,
} from 'lucide-react';
import api from '../../lib/api';
import { printReport } from '../../lib/export-print';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { exportCsvData } from '../../lib/export-csv';
import { Toast } from '../Toast';
import { TabBar, TabItem } from '../ui/TabBar';
import { DataActionsDropdown } from '../ui/DataActionsDropdown';
import { Button } from '../ui/Button';
import { PaginationBar } from '../ui/PaginationBar';
import { DynamicColumnDefinition } from './FormulaEditorModal';
import { evaluateFormula, FormulaVariable } from '../../lib/formula-engine';

export interface SummaryScheduleRow {
  id: number;
  examPeriodId: number;
  periodName: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  departmentId: number;
  departmentName: string;
  examDate: string;
  assigned: number;
  submitted: number;
  graded: number;
  absent: number;
  ungraded: number;
  flagged: number;
  passCount: number;
  avgScore: number;
}

export interface SummaryData {
  filters: Record<string, unknown>;
  stats: {
    totalExams: number;
    totalSchedules: number;
    totalAssigned: number;
    totalSubmitted: number;
    totalGraded: number;
    totalAbsent: number;
    totalUngraded: number;
    totalFlagged: number;
    passCount: number;
    passRate: number;
    avgScore: number;
    scoreDistribution: {
      excellent: number;
      good: number;
      fair: number;
      average: number;
      poor: number;
      totalGraded: number;
    };
  };
  schedules: SummaryScheduleRow[];
  options: {
    classes: Array<{ id: number; name: string }>;
    periods: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; code: string; name: string }>;
    departments: Array<{ id: number; name: string }>;
  };
}

export interface SummaryFilters {
  examPeriodId: string;
  subjectId: string;
  departmentId: string;
  classId: string;
  fromDate: string;
  toDate: string;
}

interface CatalogItem {
  type: string;
  name: string;
  description: string;
  group: string;
  formats: string[];
}

interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface ReportPreview {
  type: string;
  title: string;
  description: string;
  generatedAt: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  totalRows: number;
}

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  format: string;
  totalRows: number;
  createdAt: string;
}

interface Props {
  summary: SummaryData | null;
  loading: boolean;
  filters: SummaryFilters;
  setFilters: React.Dispatch<React.SetStateAction<SummaryFilters>>;
  onSelectSchedule: (id: number) => void;
  onRefresh: () => void;
}

const HISTORY_KEY = 'exam_report_export_history';

export const MINISTRY_PRESET_LABELS: Record<string, string> = {
  periodName: 'Học kỳ / Đợt thi',
  subjectCode: 'Mã học phần',
  subjectName: 'Tên học phần',
  departmentName: 'Khoa / Đơn vị QL',
  examDate: 'Ngày thi',
  assigned: 'Tổng số thí sinh',
  submitted: 'Số bài nộp',
  graded: 'Đã chấm thi',
  absent: 'Vắng thi',
  ungraded: 'Chưa chấm',
  flagged: 'Vi phạm / Gắn cờ',
  avgScore: 'Điểm TB học phần',
  passRate: 'Tỷ lệ đạt (%)',
  range: 'Dải phân bố điểm',
  classification: 'Xếp loại học lực',
  count: 'Số lượng bài thi',
  rate: 'Tỷ trọng (%)',
  studentCode: 'Mã sinh viên (MSSV)',
  studentName: 'Họ và tên sinh viên',
  className: 'Lớp sinh hoạt',
  status: 'Trạng thái xử lý',
  originalScore: 'Điểm công bố',
  revisedScore: 'Điểm sau phúc khảo',
  createdAt: 'Ngày tiếp nhận',
};

import Link from 'next/link';

export function ExamReportSummaryTab({
  summary,
  filters,
  setFilters,
  onSelectSchedule,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'builder' | 'history'>('overview');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [type, setType] = useState('EXAM_SUMMARY');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [scoreRounding, setScoreRounding] = useState<'0.1' | '0.25' | '0.5'>('0.1');
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [collapseConfig, setCollapseConfig] = useState(false);
  const [openTemplateMenu, setOpenTemplateMenu] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const templateBtnRef = useRef<HTMLButtonElement>(null);
  const [templateMenuStyle, setTemplateMenuStyle] = useState<React.CSSProperties>({});

  // Evaluation & Rule Settings Directly in Left Sidebar (Giải pháp 1: Bỏ hẳn Popup)
  const [passThreshold, setPassThreshold] = useState<number>(5.0);
  const [examWeight, setExamWeight] = useState<number>(70);
  const [bonusWeight, setBonusWeight] = useState<number>(30);
  const [enabledRules, setEnabledRules] = useState<{
    passFail: boolean;
    moetLevels: boolean;
    weighted: boolean;
    letterGrade: boolean;
    grade4: boolean;
    rate: boolean;
  }>({
    passFail: true,
    moetLevels: false,
    weighted: false,
    letterGrade: false,
    grade4: false,
    rate: false,
  });

  // Tự động sinh danh sách cột tính toán dựa trên cấu hình ở Sidebar
  const customFormulaColumns: DynamicColumnDefinition[] = useMemo(() => {
    const list: DynamicColumnDefinition[] = [];

    if (enabledRules.passFail) {
      list.push({
        id: 'calc_pass_fail',
        key: 'calc_pass_fail',
        header: 'Kết quả',
        type: 'FORMULA',
        formula: `IF({totalScore} >= ${passThreshold}, "ĐẠT", "KHÔNG ĐẠT")`,
        align: 'center',
        decimals: 2,
        visible: true,
      });
    }

    if (enabledRules.moetLevels) {
      list.push({
        id: 'calc_moet_levels',
        key: 'calc_moet_levels',
        header: 'Xếp loại',
        type: 'FORMULA',
        formula: 'CLASSIFICATION({totalScore})',
        align: 'center',
        decimals: 2,
        visible: true,
      });
    }

    if (enabledRules.weighted) {
      const w1 = Number((examWeight / 100).toFixed(2));
      const w2 = Number((bonusWeight / 100).toFixed(2));
      list.push({
        id: 'calc_weighted',
        key: 'calc_weighted',
        header: 'Điểm tổng kết',
        type: 'FORMULA',
        formula: `ROUND({totalScore} * ${w1} + {bonusScore} * ${w2}, 2)`,
        align: 'right',
        decimals: 2,
        visible: true,
      });
    }

    if (enabledRules.letterGrade) {
      list.push({
        id: 'calc_letter_grade',
        key: 'calc_letter_grade',
        header: 'Điểm chữ',
        type: 'FORMULA',
        formula: 'LETTER_GRADE({totalScore})',
        align: 'center',
        decimals: 2,
        visible: true,
      });
    }

    if (enabledRules.grade4) {
      list.push({
        id: 'calc_grade_4',
        key: 'calc_grade_4',
        header: 'Điểm hệ 4',
        type: 'FORMULA',
        formula: 'GRADE4({totalScore})',
        align: 'center',
        decimals: 2,
        visible: true,
      });
    }

    if (enabledRules.rate) {
      list.push({
        id: 'calc_rate',
        key: 'calc_rate',
        header: 'Tỷ lệ nộp bài',
        type: 'FORMULA',
        formula: 'ROUND(({submitted} / {assigned}) * 100, 1)',
        align: 'right',
        decimals: 1,
        visible: true,
      });
    }

    return list;
  }, [enabledRules, passThreshold, examWeight, bonusWeight]);

  // Tự động thêm các cột được tích chọn vào columns hiển thị
  useEffect(() => {
    const dynamicKeys = customFormulaColumns.map((c) => c.key);
    if (dynamicKeys.length > 0) {
      setColumns((prev) => {
        const set = new Set(prev);
        dynamicKeys.forEach((k) => set.add(k));
        return Array.from(set);
      });
    }
  }, [customFormulaColumns]);

  const availableVariablesForFormula: FormulaVariable[] = useMemo(() => {
    if (!preview?.columns) return [];
    const textKeys = [
      'studentCode',
      'fullName',
      'className',
      'status',
      'subjectCode',
      'subjectName',
      'periodName',
      'departmentName',
      'examDate',
      'range',
      'classification',
      'createdAt',
    ];
    return preview.columns.map((c) => ({
      key: c.key,
      label: customLabels[c.key] || c.label,
      type: textKeys.includes(c.key) ? ('string' as const) : ('number' as const),
      sampleValue: textKeys.includes(c.key) ? 'Mẫu' : 8.5,
    }));
  }, [preview, customLabels]);

  const allColumns = useMemo(() => {
    if (!preview) return [];
    const baseCols = preview.columns.map((c) => ({
      key: c.key,
      label: c.label,
      align: c.align,
      isFormula: false,
      formula: undefined as string | undefined,
      decimals: undefined as number | undefined,
    }));
    const formulaCols = customFormulaColumns.map((fc) => ({
      key: fc.key,
      label: fc.header,
      align: fc.align || 'center',
      isFormula: true,
      formula: fc.formula,
      decimals: fc.decimals,
    }));
    return [...baseCols, ...formulaCols];
  }, [preview, customFormulaColumns]);

  const renderReportCell = (c: any, row: Record<string, any>) => {
    if (c.isFormula && c.formula) {
      const res = evaluateFormula(c.formula, row);
      if (res === null || res === undefined) return '—';
      if (typeof res === 'number') {
        return Number.isInteger(res) ? String(res) : res.toFixed(c.decimals ?? 1);
      }
      return String(res);
    }
    return row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '—';
  };

  const applyMinistryPreset = () => {
    setCustomLabels({ ...MINISTRY_PRESET_LABELS });
    setNotice({ type: 'success', message: 'Đã áp dụng bộ nhãn tiêu chuẩn Bộ GD&ĐT.' });
  };

  const resetCustomLabels = () => {
    setCustomLabels({});
    setNotice({ type: 'success', message: 'Đã khôi phục nhãn cột mặc định của hệ thống.' });
  };

  const handleUpdateLabel = (key: string, newLabel: string) => {
    setCustomLabels((prev) => {
      if (!newLabel.trim()) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: newLabel.trim() };
    });
  };

  const updateTemplateMenuPosition = useCallback(() => {
    if (!templateBtnRef.current) return;
    const rect = templateBtnRef.current.getBoundingClientRect();
    const width = 288; // w-72
    let left = rect.right - width;
    if (left < 16) left = 16;
    const top = rect.bottom + 6;
    setTemplateMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!openTemplateMenu) return;
    updateTemplateMenuPosition();
    const handleScrollOrResize = () => updateTemplateMenuPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openTemplateMenu, updateTemplateMenuPosition]);

  const [openColumnMenu, setOpenColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const columnBtnRef = useRef<HTMLButtonElement>(null);
  const [columnMenuStyle, setColumnMenuStyle] = useState<React.CSSProperties>({});

  const updateColumnMenuPosition = useCallback(() => {
    if (!columnBtnRef.current) return;
    const rect = columnBtnRef.current.getBoundingClientRect();
    const width = 380; // w-[380px]
    let left = rect.right - width;
    if (left < 16) left = 16;
    const top = rect.bottom + 6;
    setColumnMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!openColumnMenu) return;
    updateColumnMenuPosition();
    const handleScrollOrResize = () => updateColumnMenuPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openColumnMenu, updateColumnMenuPosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        templateMenuRef.current &&
        !templateMenuRef.current.contains(event.target as Node) &&
        templateBtnRef.current &&
        !templateBtnRef.current.contains(event.target as Node)
      ) {
        setOpenTemplateMenu(false);
      }
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node) &&
        columnBtnRef.current &&
        !columnBtnRef.current.contains(event.target as Node)
      ) {
        setOpenColumnMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api
      .get<CatalogItem[]>('/exam-reports/catalog')
      .then((r) => setCatalog(r.data))
      .catch((e: Error) => setNotice({ type: 'error', message: e.message }));
    try {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
    } catch {
      setHistory([]);
    }
  }, []);

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      setHistory([]);
      setHistoryPage(1);
      setNotice({ type: 'success', message: 'Đã xóa toàn bộ lịch sử xuất báo cáo trên thiết bị.' });
    } catch {
      // ignore
    }
  };

  const deleteHistoryItem = (id: string) => {
    try {
      const next = history.filter((item) => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
      setNotice({ type: 'success', message: 'Đã xóa bản ghi lịch sử.' });
    } catch {
      // ignore
    }
  };

  const reopenHistoryItem = (item: HistoryItem) => {
    setType(item.type);
    setTitle(item.title);
    setPreview(null);
    setColumns([]);
    setTab('builder');
    setNotice({ type: 'success', message: `Đã nạp cấu hình "${item.title}". Nhấn "Xem trước báo cáo" để tạo dữ liệu mới nhất.` });
  };

  const requestFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters)
          .filter(([, v]) => v && v !== 'ALL')
          .map(([k, v]) => [k, k.endsWith('Id') ? Number(v) : v]),
      ),
    [filters],
  );

  const loadPreview = useCallback(async () => {
    setBusy('preview');
    setNotice(null);
    try {
      const baseColumnsToSend = columns.filter((k) => !k.startsWith('calc_'));
      const r = await api.post<ReportPreview>('/exam-reports/preview', {
        type,
        filters: requestFilters,
        columns: baseColumnsToSend.length ? baseColumnsToSend : undefined,
        title: title.trim() || undefined,
        customLabels: Object.keys(customLabels).length ? customLabels : undefined,
        scoreRounding,
        passThreshold,
      });
      setPreview(r.data);
      const baseKeys = r.data.columns.map((c) => c.key);
      const formulaKeys = customFormulaColumns.map((fc) => fc.key);
      setColumns((prev) => {
        const baseSelected = prev.filter((k) => baseKeys.includes(k));
        const activeBase = baseSelected.length > 0 ? baseSelected : baseKeys;
        return Array.from(new Set([...activeBase, ...formulaKeys]));
      });
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Không tạo được bản xem trước.' });
    } finally {
      setBusy('');
    }
  }, [columns, customFormulaColumns, customLabels, passThreshold, requestFilters, scoreRounding, title, type]);

  const choose = (item: CatalogItem) => {
    setType(item.type);
    setTitle(item.name);
    setPreview(null);
    setColumns([]);
    setTab('builder');
    setOpenTemplateMenu(false);
  };

  const exportFile = async (format: 'CSV' | 'XLSX') => {
    if (!preview) return;
    setBusy(format);
    setNotice(null);
    try {
      if (customFormulaColumns.length > 0) {
        const activeCols = allColumns.filter((c) => columns.includes(c.key));
        const exportHeaders = activeCols.map((c) => customLabels[c.key] || c.label);
        const exportRows = preview.rows.map((row) =>
          activeCols.map((c) => renderReportCell(c, row))
        );

        if (format === 'XLSX') {
          await exportToFormattedExcel({
            filename: `Bao_Cao_${new Date().toISOString().slice(0, 10)}.xlsx`,
            title: preview.title || title || 'BÁO CÁO KHẢO THÍ TỔNG HỢP',
            subtitle: `Thời điểm lập: ${new Date(preview.generatedAt).toLocaleString('vi-VN')}, ${preview.totalRows} bản ghi`,
            columns: activeCols.map((c) => ({
              header: customLabels[c.key] || c.label,
              align: c.align || 'left',
            })),
            rows: exportRows,
            footerNotes: 'Báo cáo trích xuất từ Hệ thống Quản lý Khảo thí EMS.',
            templateCode: type,
          });
        } else {
          exportCsvData(
            `Bao_Cao_${new Date().toISOString().slice(0, 10)}.csv`,
            exportHeaders,
            exportRows,
          );
        }

        const item: HistoryItem = {
          id: `${Date.now()}-${format}`,
          title: preview.title || title || 'Báo cáo khảo thí',
          type,
          format,
          totalRows: preview.totalRows || 0,
          createdAt: new Date().toISOString(),
        };
        setHistory((current) => {
          const next = [item, ...current].slice(0, 30);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          return next;
        });
        setNotice({ type: 'success', message: `Đã tạo file ${format} với đầy đủ các cột công thức tính toán.` });
      } else {
        const r = await api.post(
          '/exam-reports/export',
          {
            type,
            format,
            filters: requestFilters,
            columns: columns.length ? columns : undefined,
            title: title.trim() || undefined,
            customLabels: Object.keys(customLabels).length ? customLabels : undefined,
            scoreRounding,
            passThreshold,
          },
          { responseType: 'blob' },
        );
        const disposition = String(r.headers['content-disposition'] || '');
        const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        const filename = encoded
          ? decodeURIComponent(encoded)
          : `Bao_Cao_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
        const url = URL.createObjectURL(r.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        const item: HistoryItem = {
          id: `${Date.now()}-${format}`,
          title: preview?.title || title || 'Báo cáo khảo thí',
          type,
          format,
          totalRows: preview?.totalRows || 0,
          createdAt: new Date().toISOString(),
        };
        setHistory((current) => {
          const next = [item, ...current].slice(0, 30);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          return next;
        });
        setNotice({ type: 'success', message: `Đã tạo file ${format} theo đúng phạm vi đang chọn.` });
      }
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Không xuất được báo cáo.' });
    } finally {
      setBusy('');
    }
  };

  const printPreview = () => {
    if (!preview) return;
    const selectedCols = allColumns.filter((c) => columns.includes(c.key));
    const ok = printReport({
      title: preview.title,
      subtitle: `Thời điểm lập: ${new Date(preview.generatedAt).toLocaleString('vi-VN')}, ${preview.totalRows} bản ghi`,
      orientation: selectedCols.length > 6 ? 'landscape' : 'portrait',
      columns: selectedCols.map((c) => ({
        header: customLabels[c.key] || c.label,
        align: c.align,
        width: ['periodName', 'subjectName', 'departmentName'].includes(c.key)
          ? '18%'
          : ['subjectCode', 'examDate'].includes(c.key)
            ? '11%'
            : '7%',
      })),
      rows: preview.rows.map((row) => selectedCols.map((c) => renderReportCell(c, row))),
      footerNotes: 'Dữ liệu chính thức trong phạm vi được phép truy cập.',
      templateCode: type,
    });
    if (!ok) setNotice({ type: 'error', message: 'Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.' });
  };

  const schedules = useMemo(() => {
    const key = search.trim().toLocaleLowerCase('vi');
    return (summary?.schedules || [])
      .filter(
        (r) =>
          !key ||
          [r.subjectCode, r.subjectName, r.periodName, r.departmentName].some((v) =>
            v.toLocaleLowerCase('vi').includes(key),
          ),
      )
      .slice(0, 8);
  }, [search, summary?.schedules]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyLimit;
    return history.slice(start, start + historyLimit);
  }, [history, historyPage, historyLimit]);

  const navigationTabs = useMemo<TabItem<'overview' | 'builder' | 'history'>[]>(
    () => [
      { key: 'overview', label: 'Tổng quan ca thi' },
      { key: 'builder', label: 'Tạo báo cáo danh mục' },
      { key: 'history', label: 'Lịch sử xuất', count: history.length || undefined },
    ],
    [history.length],
  );

  return (
    <div className="space-y-5">
      {notice && <Toast message={notice.message} type={notice.type} onClose={() => setNotice(null)} />}

      {/* ── 1. TabBar Chuẩn Hệ Thống (Đồng bộ 100% với activity-logs & settings) ── */}
      <TabBar<'overview' | 'builder' | 'history'>
        tabs={navigationTabs}
        active={tab}
        onChange={setTab}
        variant="line"
      />

      {/* ── TAB 1: BẢNG CA THI GẦN ĐÂY (PHẲNG, LIỀN MẠCH, THOÁNG ĐÃNG) ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Unified Search & Action Toolbar Row (Chuẩn đồng bộ 100% với các trang khác) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Left: Search Bar with 40px height, shortcut /, clear X button */}
            <div className="relative flex-1 max-w-xl min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã môn, tên môn, kỳ thi, khoa..."
                className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-12 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
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
              </div>
            </div>

            {/* Right: Mẫu báo cáo dropdown button (Pure Ghost Button) */}
            <div className="relative shrink-0">
              <button
                ref={templateBtnRef}
                type="button"
                onClick={() => setOpenTemplateMenu((v) => !v)}
                className={`h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl text-type-body font-medium transition cursor-pointer select-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${openTemplateMenu
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                title="Chọn mẫu báo cáo"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Mẫu báo cáo</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${openTemplateMenu ? 'rotate-180 text-slate-600 dark:text-slate-300' : ''
                    }`}
                />
              </button>

              {/* Menu Popover qua Portal */}
              {openTemplateMenu &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div
                    ref={templateMenuRef}
                    style={templateMenuStyle}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-30 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-2">
                      <p className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                        Chọn mẫu báo cáo
                      </p>
                      <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                        Mở nhanh cấu hình và xem trước dữ liệu
                      </p>
                    </div>

                    <div className="pt-1 space-y-0.5 max-h-80 overflow-y-auto custom-scrollbar">
                      {catalog.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => choose(item)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {item.name}
                            </p>
                            <p className="text-type-helper text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href="/admin/document-templates"
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-type-body-sm font-medium text-blue-600 dark:text-blue-400 transition-colors cursor-pointer group"
                      >
                        <span>Quản lý & Thiết kế biểu mẫu in</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>,
                  document.body,
                )}
            </div>
          </div>

          {/* Bảng Ca thi gần đây (Khung Bảng Duy Nhất, phẳng và liền mạch) */}
          <div className="ui-table-wrap rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <table className="ui-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-5">Môn thi & Khoa</th>
                  <th className="py-3.5 px-5">Kỳ thi</th>
                  <th className="py-3.5 px-5">Ngày thi</th>
                  <th className="py-3.5 px-5 text-center">Tiến độ chấm</th>
                  <th className="py-3.5 px-5 text-center">Điểm TB</th>
                  <th className="py-3.5 px-5 text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {schedules.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectSchedule(r.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                          {r.subjectName}
                        </span>
                        <span className="table-meta text-type-helper text-slate-400 font-normal tabular-nums">
                          ({r.subjectCode})
                        </span>
                      </div>
                      <p className="table-meta text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                        {r.departmentName}
                      </p>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap text-type-body text-slate-700 dark:text-slate-300">
                      {r.periodName}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap text-type-body tabular-nums text-slate-500 dark:text-slate-400">
                      {new Date(r.examDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className="text-type-body font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {r.graded}/{r.submitted} bài
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap text-type-body font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {r.avgScore}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <ArrowUpRight className="h-4 w-4 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: TẠO BÁO CÁO THEO MẪU (1 KHUNG DUY NHẤT CHIA 2 BÊN LIỀN NHAU) ── */}
      {tab === 'builder' && (
        <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col xl:flex-row">
          {/* CỘT TRÁI: Cấu hình báo cáo (Sliding drawer êm ái, nội dung giữ nguyên kích thước cố định để chống giật chữ và tràn bóng) */}
          <aside
            aria-label="Cấu hình báo cáo"
            className={`transition-[width,opacity] duration-300 ease-in-out shrink-0 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between ${collapseConfig
                ? 'w-0 opacity-0 pointer-events-none'
                : 'w-full xl:w-[320px] 2xl:w-[340px] opacity-100 border-b xl:border-b-0 xl:border-r border-slate-100 dark:border-slate-800'
              }`}
          >
            {/* Lớp bọc bên trong có kích thước cố định, chống bóp méo text và tràn shadow khi thu phóng */}
            <div className="w-[320px] 2xl:w-[340px] flex flex-col justify-between min-h-full shrink-0">
              <div className="flex flex-col space-y-4">
                {/* Header Cột Trái: Cùng padding top pt-4 để thẳng hàng với Cột Phải */}
                <div className="px-5 pt-4 pb-0 shrink-0">
                  <h2 className="text-type-section font-semibold text-slate-900 dark:text-white truncate leading-6">
                    Cấu hình báo cáo
                  </h2>
                  <p className="text-type-helper text-slate-400 font-normal truncate mt-0.5 leading-5">
                    Chọn phạm vi dữ liệu để xem trước
                  </p>
                </div>

                {/* Form fields */}
                <div className="px-5 space-y-4">
                  <Select
                    label="Loại báo cáo"
                    value={type}
                    onChange={(v) => {
                      setType(v);
                      setPreview(null);
                      setColumns([]);
                    }}
                    options={catalog.map((i) => ({ value: i.type, label: i.name }))}
                    all={false}
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-type-body font-medium text-slate-900 dark:text-slate-100">
                      Tiêu đề báo cáo
                    </span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={catalog.find((i) => i.type === type)?.name}
                      className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition shadow-2xs"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <Select
                      label="Kỳ thi"
                      value={filters.examPeriodId}
                      onChange={(v) => setFilters((f) => ({ ...f, examPeriodId: v }))}
                      options={summary?.options.periods.map((i) => ({ value: String(i.id), label: i.name })) || []}
                    />
                    <Select
                      label="Môn học"
                      value={filters.subjectId}
                      onChange={(v) => setFilters((f) => ({ ...f, subjectId: v }))}
                      options={
                        summary?.options.subjects.map((i) => ({ value: String(i.id), label: `[${i.code}] ${i.name}` })) || []
                      }
                    />
                    <Select
                      label="Khoa"
                      value={filters.departmentId}
                      onChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))}
                      options={summary?.options.departments.map((i) => ({ value: String(i.id), label: i.name })) || []}
                    />
                    <Select
                      label="Lớp học"
                      value={filters.classId}
                      onChange={(v) => setFilters((f) => ({ ...f, classId: v }))}
                      options={summary?.options.classes.map((i) => ({ value: String(i.id), label: i.name })) || []}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <DateInput
                      label="Từ ngày"
                      value={filters.fromDate}
                      onChange={(v) => setFilters((f) => ({ ...f, fromDate: v }))}
                    />
                    <DateInput
                      label="Đến ngày"
                      value={filters.toDate}
                      onChange={(v) => setFilters((f) => ({ ...f, toDate: v }))}
                    />
                  </div>

                  {/* ── TIÊU CHUẨN ĐÁNH GIÁ & QUY CÁCH TÍNH (TRỰC TIẾP TẠI SIDEBAR) ── */}
                  <div className="pt-3 space-y-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-type-body font-semibold text-slate-900 dark:text-slate-100">
                      Tiêu chuẩn đánh giá
                    </span>

                    {/* Mức điểm đạt */}
                    <div className="space-y-1">
                      <span className="block text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
                        Điểm đạt tối thiểu
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={passThreshold}
                          onChange={(e) => setPassThreshold(Number(e.target.value) || 5.0)}
                          className="h-10 w-24 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500 transition shadow-2xs"
                        />
                        <span className="text-type-helper text-slate-400 font-normal">/ 10 điểm</span>
                      </div>
                    </div>

                    {/* Tỷ lệ điểm hệ số */}
                    <div className="space-y-1">
                      <span className="block text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
                        Tỷ lệ điểm hệ số (%)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={examWeight}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setExamWeight(val);
                              setBonusWeight(Math.max(0, 100 - val));
                            }}
                            className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500 transition shadow-2xs"
                          />
                          <span className="text-type-helper text-slate-500">% Thi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={bonusWeight}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setBonusWeight(val);
                              setExamWeight(Math.max(0, 100 - val));
                            }}
                            className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-type-body font-semibold text-blue-600 outline-none focus:border-blue-500 transition shadow-2xs"
                          />
                          <span className="text-type-helper text-slate-500">% Cần</span>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách các cột đánh giá nhanh */}
                    <div className="space-y-2 pt-1">
                      <span className="block text-type-helper font-medium text-slate-600 dark:text-slate-400">
                        Cột bổ sung vào bảng:
                      </span>
                      <label className="flex items-center gap-2 text-type-body font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enabledRules.passFail}
                          onChange={(e) => setEnabledRules((prev) => ({ ...prev, passFail: e.target.checked }))}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span>Cột Kết quả (Đạt / Không đạt)</span>
                      </label>
                      <label className="flex items-center gap-2 text-type-body font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enabledRules.moetLevels}
                          onChange={(e) => setEnabledRules((prev) => ({ ...prev, moetLevels: e.target.checked }))}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span>Cột Xếp loại học lực (Bộ GD&ĐT)</span>
                      </label>
                      <label className="flex items-center gap-2 text-type-body font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enabledRules.weighted}
                          onChange={(e) => setEnabledRules((prev) => ({ ...prev, weighted: e.target.checked }))}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span>Cột Điểm tổng kết hệ số</span>
                      </label>
                      <label className="flex items-center gap-2 text-type-body font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enabledRules.letterGrade}
                          onChange={(e) => setEnabledRules((prev) => ({ ...prev, letterGrade: e.target.checked }))}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span>Cột Điểm Chữ (A, B, C, D, F)</span>
                      </label>
                      <label className="flex items-center gap-2 text-type-body font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enabledRules.grade4}
                          onChange={(e) => setEnabledRules((prev) => ({ ...prev, grade4: e.target.checked }))}
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span>Cột Thang điểm 4.0</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={loadPreview}
                  isLoading={busy === 'preview'}
                  className="w-full justify-center h-10"
                >
                  Xem trước báo cáo
                </Button>
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: Bảng xem trước dữ liệu (Dính liền trong khung) */}
          <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900">
            {/* Header Toolbar phẳng nền trắng tinh gọn không đường cắt dưới */}
            <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setCollapseConfig(!collapseConfig)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title={collapseConfig ? 'Mở rộng cột cấu hình' : 'Thu gọn cột cấu hình'}
                >
                  <ChevronLeft
                    className={`h-4 w-4 transition-transform duration-200 ease-in-out ${collapseConfig ? 'rotate-180' : ''
                      }`}
                  />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-type-section font-semibold text-slate-900 dark:text-white truncate leading-6">
                      {preview?.title || 'Bản xem trước dữ liệu'}
                    </h2>
                    {preview && (
                      <span className="text-type-helper text-slate-400 font-normal tabular-nums shrink-0">
                        ({preview.totalRows} bản ghi)
                      </span>
                    )}
                  </div>
                  <p className="text-type-helper text-slate-400 font-normal truncate mt-0.5 leading-5">
                    {preview
                      ? `Tạo lúc ${new Date(preview.generatedAt).toLocaleString('vi-VN')} | Đang xuất ${columns.length}/${preview.columns.length} cột`
                      : 'Thiết lập cấu hình bên trái rồi nhấn Xem trước báo cáo'}
                  </p>
                </div>
              </div>

              {preview && (
                <div className="flex items-center gap-2">
                  {/* Smart Column Selector Popover - Tối giản, thanh lịch, trung tính */}
                  <div className="relative">
                    <button
                      ref={columnBtnRef}
                      type="button"
                      onClick={() => setOpenColumnMenu((v) => !v)}
                      className={`h-9 inline-flex items-center gap-1.5 px-2 rounded-xl text-type-body-sm font-medium transition cursor-pointer select-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${openColumnMenu
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      title="Tùy chỉnh cột xuất file"
                    >
                      <Columns3 className="h-4 w-4 text-slate-400" />
                      <span>Cột xuất file</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${openColumnMenu ? 'rotate-180 text-slate-600 dark:text-slate-300' : ''
                          }`}
                      />
                    </button>

                    {/* Popover Dropdown qua Portal */}
                    {openColumnMenu &&
                      typeof document !== 'undefined' &&
                      createPortal(
                        <div
                          ref={columnMenuRef}
                          style={columnMenuStyle}
                          className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
                        >
                          {/* Header Popover & Hàng nút tác vụ nhanh */}
                          <div className="space-y-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="px-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-type-body font-semibold text-slate-900 dark:text-white leading-5">
                                  Tùy biến cột & nhãn
                                </h3>
                                <span className="text-type-helper text-slate-400 dark:text-slate-500 font-normal tabular-nums">
                                  [{columns.length}/{allColumns.length}]
                                </span>
                              </div>
                              <p className="text-type-helper text-slate-400 dark:text-slate-500 font-normal mt-0.5 leading-4">
                                Tùy chỉnh cột hiển thị & chỉnh sửa tên tiêu đề
                              </p>
                            </div>

                            {/* Hàng 3 nút thao tác thanh mảnh, căn bằng lề 2 bên */}
                            <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5">
                              <div className="flex items-center gap-1.5 text-type-helper font-normal">
                                <button
                                  type="button"
                                  onClick={() => setColumns(allColumns.map((c) => c.key))}
                                  className="min-h-0 p-0 bg-transparent text-type-helper font-normal text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                  Chọn tất cả
                                </button>
                                <span className="text-slate-300 dark:text-slate-600 select-none text-type-helper">|</span>
                                <button
                                  type="button"
                                  onClick={() => setColumns([])}
                                  className="min-h-0 p-0 bg-transparent text-type-helper font-normal text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                  Bỏ chọn
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  resetCustomLabels();
                                  setColumns(allColumns.map((c) => c.key));
                                }}
                                className="min-h-0 p-0 bg-transparent text-type-helper font-normal inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Khôi phục trạng thái và tên cột ban đầu"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Đặt lại mặc định</span>
                              </button>
                            </div>
                          </div>

                          {/* Danh sách cột phẳng hoàn toàn không viền, chỉ đổi màu nhẹ khi hover */}
                          <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                            {allColumns.map((c) => {
                              const isChecked = columns.includes(c.key);
                              const currentLabel = customLabels[c.key] || c.label;
                              const isCustomized = Boolean(customLabels[c.key] && customLabels[c.key] !== c.label);
                              const isEditing = editingLabelKey === c.key;

                              return (
                                <div
                                  key={c.key}
                                  className="group/item flex items-center justify-between gap-2 py-1.5 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {/* Icon tay nắm ::: */}
                                    <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0 select-none group-hover/item:text-slate-400 dark:group-hover/item:text-slate-500 cursor-grab" />

                                    {/* Checkbox [✓] */}
                                    <input
                                      id={`col-toggle-${c.key}`}
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        setColumns((prev) =>
                                          prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key],
                                        )
                                      }
                                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer shrink-0"
                                    />

                                    {!isEditing ? (
                                      <label
                                        htmlFor={`col-toggle-${c.key}`}
                                        className="flex items-center min-w-0 flex-1 cursor-pointer select-none"
                                      >
                                        <span
                                          className={`text-type-body-sm truncate ${
                                            isChecked
                                              ? 'font-medium text-slate-900 dark:text-slate-100'
                                              : 'text-slate-400 dark:text-slate-500 font-normal'
                                          }`}
                                        >
                                          {currentLabel}
                                        </span>
                                        {c.isFormula && (
                                          <span className="ml-1.5 ui-pill text-type-helper font-medium px-2 py-0.5 rounded-full border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400 shrink-0">
                                            Công thức
                                          </span>
                                        )}
                                        {isCustomized && !c.isFormula && (
                                          <span className="ml-1.5 text-type-badge font-normal text-blue-600 dark:text-blue-400 shrink-0">
                                            (Đã sửa)
                                          </span>
                                        )}
                                      </label>
                                    ) : (
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <input
                                          autoFocus
                                          type="text"
                                          defaultValue={currentLabel}
                                          onBlur={(e) => {
                                            handleUpdateLabel(c.key, e.target.value);
                                            setEditingLabelKey(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleUpdateLabel(c.key, (e.target as HTMLInputElement).value);
                                              setEditingLabelKey(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingLabelKey(null);
                                            }
                                          }}
                                          className="h-8 w-full rounded-xl border border-blue-500 bg-white dark:bg-slate-900 px-2.5 text-type-body font-normal text-slate-900 dark:text-slate-100 outline-none shadow-2xs"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Nút bút chì đổi tên nhãn cho mọi cột */}
                                    {!isEditing && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingLabelKey(c.key)}
                                        className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl cursor-pointer shrink-0"
                                        title={`Đổi tên tiêu đề "${currentLabel}"`}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>,
                        document.body,
                      )}
                  </div>

                  <DataActionsDropdown
                    onExportExcel={() => exportFile('XLSX')}
                    onExportCsv={() => exportFile('CSV')}
                    onPrint={printPreview}
                    printLabel="In báo cáo"
                  />
                </div>
              )}
            </div>

            {!preview ? (
              <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3 border border-slate-200/60 dark:border-slate-700">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-semibold text-type-body text-slate-900 dark:text-white">
                  Chưa có bản xem trước
                </p>
                <p className="mt-1 max-w-md text-type-helper text-slate-400">
                  Vui lòng chọn loại báo cáo và các điều kiện lọc bên trái, sau đó nhấn &ldquo;Xem trước báo cáo&rdquo; để kiểm tra dữ liệu trước khi xuất file.
                </p>
              </div>
            ) : (
              <>
                {/* Thông báo thanh mảnh khi có cột bị ẩn */}
                {columns.length < allColumns.length && (
                  <div className="px-5 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-type-helper text-slate-600 dark:text-slate-400 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span>Đang ẩn <strong>{allColumns.length - columns.length}</strong> cột trong bản xem trước và file xuất.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setColumns(allColumns.map((c) => c.key))}
                      className="font-medium text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                    >
                      Hiện lại tất cả ({allColumns.length} cột)
                    </button>
                  </div>
                )}

                {/* Bảng xem trước dữ liệu phẳng tràn viền */}
                <div className="w-full overflow-x-auto max-h-[640px] custom-scrollbar flex-1">
                  <table className="ui-table w-full min-w-[760px] text-type-body text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                      <tr className="border-b border-slate-200/90 dark:border-slate-700">
                        {allColumns
                          .filter((c) => columns.includes(c.key))
                          .map((c) => {
                            const headerLabel = customLabels[c.key] || c.label;
                            return (
                              <th
                                key={c.key}
                                className="group/th py-3 px-4 text-type-body-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 whitespace-nowrap select-none"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span>{headerLabel}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setColumns((prev) => prev.filter((k) => k !== c.key));
                                    }}
                                    className="min-h-0 min-w-0 p-0.5 opacity-0 group-hover/th:opacity-100 hover:scale-125 active:scale-95 transition-all text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0"
                                    title={`Ẩn cột "${headerLabel}" khỏi file xuất`}
                                  >
                                    <X className="h-3 w-3 stroke-[2.5]" />
                                  </button>
                                </div>
                              </th>
                            );
                          })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                          {allColumns
                            .filter((c) => columns.includes(c.key))
                            .map((c) => (
                              <td
                                key={c.key}
                                className={`py-3.5 px-4 text-type-body text-slate-800 dark:text-slate-200 ${c.align === 'right' ? 'text-right tabular-nums' : ''
                                  }`}
                              >
                                {renderReportCell(c, row)}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!preview.rows.length && (
                    <p className="p-10 text-center text-type-body text-slate-400">
                      Không tìm thấy dữ liệu nào phù hợp với phạm vi lọc đã chọn.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: LỊCH SỬ XUẤT BÁO CÁO (Phẳng Liền Mạch Không Đường Cắt Dưới) ── */}
      {tab === 'history' && (
        <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
          {/* Header Toolbar bên trong khung (Không đường cắt dưới) */}
          <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-type-section font-semibold text-slate-900 dark:text-white truncate">
                  Lịch sử xuất báo cáo trên thiết bị
                </h2>
                {history.length > 0 && (
                  <span className="text-type-helper text-slate-400 font-normal tabular-nums shrink-0">
                    ({history.length} bản ghi)
                  </span>
                )}
              </div>
              <p className="text-type-helper text-slate-400 font-normal truncate mt-0.5">
                Nhật ký các thao tác xuất file chính thức được lưu trên trình duyệt này
              </p>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-type-helper font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
                title="Xóa toàn bộ lịch sử lưu trên máy này"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Dọn dẹp lịch sử</span>
              </button>
            )}
          </div>

          {/* Bảng Dữ liệu Phẳng */}
          <div className="w-full overflow-x-auto flex-1">
            <table className="ui-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-5">Tên báo cáo</th>
                  <th className="py-3.5 px-5 text-center">Định dạng</th>
                  <th className="py-3.5 px-5 text-center">Số bản ghi</th>
                  <th className="py-3.5 px-5 text-right">Thời gian xuất</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div>
                        <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                          {item.title}
                        </span>
                        <p className="table-meta text-type-helper text-slate-400 font-normal mt-0.5">
                          {catalog.find((c) => c.type === item.type)?.name || item.type}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <span
                        className={`table-badge inline-flex items-center px-2.5 py-0.5 rounded-full ui-pill text-type-helper font-medium ${item.format === 'XLSX'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800'
                          }`}
                      >
                        {item.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center whitespace-nowrap text-type-body tabular-nums text-slate-700 dark:text-slate-300">
                      {item.totalRows}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap tabular-nums">
                      <div className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                        {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="table-meta text-type-helper text-slate-400 font-normal">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => reopenHistoryItem(item)}
                          className="table-meta text-type-helper font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Nạp lại cấu hình này sang Tab Tạo báo cáo"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>Mở lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.id)}
                          className="table-meta text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Xóa bản ghi này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!history.length && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <p className="text-type-body font-medium">Chưa có báo cáo nào được xuất trên thiết bị này</p>
                <p className="text-type-helper text-slate-400 mt-1">Khi bạn xuất file Excel hoặc CSV, lịch sử sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>

          {/* Thanh phân trang PaginationBar nằm bên trong đáy khung */}
          {history.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
              <PaginationBar
                page={historyPage}
                totalPages={Math.ceil(history.length / historyLimit) || 1}
                limit={historyLimit}
                totalItems={history.length}
                unit="báo cáo"
                onPage={(p) => setHistoryPage(p)}
                onLimit={(l) => {
                  setHistoryLimit(l);
                  setHistoryPage(1);
                }}
                limitOptions={[10, 20, 50]}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  all = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  all?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-type-body font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition shadow-2xs cursor-pointer"
      >
        {all && <option value="ALL">Tất cả</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-type-body font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition shadow-2xs"
      />
    </label>
  );
}
