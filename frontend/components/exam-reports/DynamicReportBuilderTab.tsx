'use client';

import { MetaSeparator } from '@/components/ui/InlineMeta';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/Button';
import {
  FormulaEditorModal,
  DynamicColumnDefinition,
} from './FormulaEditorModal';
import {
  ReportTemplatePickerModal,
  SavedReportTemplate,
  SYSTEM_PRESET_TEMPLATES,
} from './ReportTemplatePickerModal';
import { evaluateFormula, STANDARD_REPORT_VARIABLES } from '../../lib/formula-engine';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { Toast } from '../Toast';
import {
  Trash2,
  MoveUp,
  MoveDown,
  Edit2,
  Eye,
  FileSpreadsheet,
  Printer,
  FileText,
  Bookmark,
  FileDown,
  Sparkles,
} from 'lucide-react';

const SAVED_TEMPLATES_STORAGE_KEY = 'exam_custom_report_templates_v2';

interface DynamicReportBuilderTabProps {
  candidates?: any[];
  scheduleInfo?: any;
  onRefreshData?: () => void;
}

export function DynamicReportBuilderTab({
  candidates = [],
}: DynamicReportBuilderTabProps) {
  // Active Template state
  const [currentTemplate, setCurrentTemplate] = useState<SavedReportTemplate>(SYSTEM_PRESET_TEMPLATES[0]);
  const [columns, setColumns] = useState<DynamicColumnDefinition[]>(SYSTEM_PRESET_TEMPLATES[0].columns);
  const [headerConfig, setHeaderConfig] = useState(SYSTEM_PRESET_TEMPLATES[0].headerConfig);
  const [signers, setSigners] = useState(SYSTEM_PRESET_TEMPLATES[0].signers);
  const [footerNotes, setFooterNotes] = useState(SYSTEM_PRESET_TEMPLATES[0].footerNotes || '');

  // Page orientation for preview & export
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Saved templates from localStorage
  const [customTemplates, setCustomTemplates] = useState<SavedReportTemplate[]>([]);

  // Modals state
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<DynamicColumnDefinition | null>(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Busy state for exports (prevent duplicate triggers)
  const [busyExport, setBusyExport] = useState<'XLSX' | 'CSV' | 'PRINT' | ''>('');

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_TEMPLATES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCustomTemplates(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-switch orientation if columns count exceeds threshold
  useEffect(() => {
    const activeColsCount = columns.filter((c) => c.visible !== false).length;
    if (activeColsCount >= 7 && pageOrientation === 'portrait') {
      setPageOrientation('landscape');
    }
  }, [columns, pageOrientation]);

  // Save custom templates to storage
  const saveCustomTemplatesToStorage = (list: SavedReportTemplate[]) => {
    setCustomTemplates(list);
    try {
      localStorage.setItem(SAVED_TEMPLATES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  };

  // Sample data fallback if no live candidates
  const sampleCandidates = useMemo(() => {
    if (candidates && candidates.length > 0) return candidates;
    return [
      {
        studentId: 1,
        studentCode: 'SV2025001',
        fullName: 'Nguyễn Văn An',
        className: 'CNTT-K48A',
        totalScore: 8.5,
        maxScore: 10,
        bonusScore: 1.0,
        penaltyScore: 0,
        violationCount: 0,
        status: 'GRADED',
      },
      {
        studentId: 2,
        studentCode: 'SV2025002',
        fullName: 'Trần Thị Bình',
        className: 'CNTT-K48A',
        totalScore: 4.5,
        maxScore: 10,
        bonusScore: 0.5,
        penaltyScore: 0,
        violationCount: 0,
        status: 'GRADED',
      },
      {
        studentId: 3,
        studentCode: 'SV2025003',
        fullName: 'Lê Hoàng Cường',
        className: 'CNTT-K48B',
        totalScore: 9.2,
        maxScore: 10,
        bonusScore: 1.0,
        penaltyScore: 0,
        violationCount: 0,
        status: 'GRADED',
      },
      {
        studentId: 4,
        studentCode: 'SV2025004',
        fullName: 'Phạm Minh Đức',
        className: 'CNTT-K48B',
        totalScore: 3.0,
        maxScore: 10,
        bonusScore: 0,
        penaltyScore: 1.0,
        violationCount: 1,
        status: 'GRADED',
      },
      {
        studentId: 5,
        studentCode: 'SV2025005',
        fullName: 'Võ Thị Em',
        className: 'CNTT-K48A',
        totalScore: 6.8,
        maxScore: 10,
        bonusScore: 0.5,
        penaltyScore: 0,
        violationCount: 0,
        status: 'GRADED',
      },
    ];
  }, [candidates]);

  // Compute live spreadsheet rows with safe formula engine
  const computedTableData = useMemo(() => {
    return sampleCandidates.map((row, index) => {
      const rowResult: Record<string, any> = { ...row, stt: index + 1 };

      columns.forEach((col) => {
        if (col.type === 'FORMULA' && col.formula) {
          const evaluated = evaluateFormula(col.formula, rowResult);
          if (typeof evaluated === 'number' && col.decimals !== undefined) {
            rowResult[col.id] = Number(evaluated.toFixed(col.decimals));
          } else {
            rowResult[col.id] = evaluated;
          }
        }
      });

      return rowResult;
    });
  }, [sampleCandidates, columns]);

  // Summary statistics for table footer
  const summaryStats = useMemo(() => {
    const total = computedTableData.length;
    if (total === 0) {
      return { total: 0, avg: '0.00', max: '0.0', min: '0.0', passCount: 0, passRate: '0.0%' };
    }

    const scores = computedTableData
      .map((r) => Number(r.totalScore))
      .filter((s) => !isNaN(s) && s !== null && s !== undefined);

    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = scores.length ? (sum / scores.length).toFixed(2) : '0.00';
    const max = scores.length ? Math.max(...scores).toFixed(1) : '0.0';
    const min = scores.length ? Math.min(...scores).toFixed(1) : '0.0';
    const passCount = scores.filter((s) => s >= 4.0).length;
    const passRate = scores.length ? `${((passCount / scores.length) * 100).toFixed(1)}%` : '0.0%';

    return { total, avg, max, min, passCount, passRate };
  }, [computedTableData]);

  // Handle template switch
  const handleSelectTemplate = (template: SavedReportTemplate) => {
    setCurrentTemplate(template);
    setColumns(template.columns);
    setHeaderConfig(template.headerConfig);
    setSigners(template.signers);
    setFooterNotes(template.footerNotes || '');
    setToast({ message: `Đã áp dụng mẫu "${template.name}"`, type: 'success' });
  };

  // Handle save current as template
  const handleSaveAsNewTemplate = (name: string, description: string) => {
    const newTpl: SavedReportTemplate = {
      id: `custom_tpl_${Date.now()}`,
      name,
      description,
      headerConfig,
      columns,
      signers,
      footerNotes,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTpl, ...customTemplates];
    saveCustomTemplatesToStorage(updated);
    setCurrentTemplate(newTpl);
    setToast({ message: `Đã lưu mẫu báo cáo "${name}" thành công!`, type: 'success' });
  };

  // Handle delete custom template
  const handleDeleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    saveCustomTemplatesToStorage(updated);
    setToast({ message: 'Đã xóa mẫu báo cáo.', type: 'success' });
  };

  // Column operations
  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const next = [...columns];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setColumns(next);
  };

  const handleDeleteColumn = (colId: string) => {
    if (columns.length <= 1) {
      setToast({ message: 'Báo cáo cần có ít nhất 1 cột.', type: 'error' });
      return;
    }
    setColumns(columns.filter((c) => c.id !== colId));
  };

  const handleSaveColumnFromModal = (newCol: DynamicColumnDefinition) => {
    if (editingColumn) {
      setColumns(columns.map((c) => (c.id === editingColumn.id ? newCol : c)));
      setToast({ message: `Đã cập nhật cột "${newCol.header}"`, type: 'success' });
    } else {
      setColumns([...columns, newCol]);
      setToast({ message: `Đã thêm cột công thức "${newCol.header}"`, type: 'success' });
    }
    setEditingColumn(null);
  };

  // Add standard field column
  const handleAddStandardField = (key: string, label: string) => {
    if (columns.some((c) => c.key === key)) {
      setToast({ message: `Cột "${label}" đã có trong bảng.`, type: 'error' });
      return;
    }
    const newCol: DynamicColumnDefinition = {
      id: key,
      key,
      header: label,
      type: 'FIELD',
      align: key.includes('Score') || key === 'stt' ? 'center' : 'left',
      visible: true,
    };
    setColumns([...columns, newCol]);
    setToast({ message: `Đã thêm cột "${label}"`, type: 'success' });
  };

  // Export handlers
  const handleExportExcel = async () => {
    setBusyExport('XLSX');
    try {
      const activeCols = columns.filter((c) => c.visible !== false);
      const rows = computedTableData.map((row) =>
        activeCols.map((c) => {
          const val = row[c.id] ?? row[c.key];
          return val !== undefined && val !== null ? val : '—';
        })
      );

      await exportToFormattedExcel({
        filename: `${headerConfig.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        title: headerConfig.title,
        subtitle: headerConfig.subtitle,
        institutionName: headerConfig.institutionName,
        facultyName: headerConfig.facultyName,
        motto: headerConfig.motto,
        columns: activeCols.map((c) => ({
          header: c.header,
          align: c.align || 'left',
        })),
        rows,
        signers: signers.map((s) => ({ title: s.title, subtitle: s.subtitle })),
        footerNotes,
      });

      setToast({ message: 'Đã xuất file Excel thành công!', type: 'success' });
    } catch {
      setToast({ message: 'Không thể xuất file Excel.', type: 'error' });
    } finally {
      setBusyExport('');
    }
  };

  const handleExportCsv = () => {
    setBusyExport('CSV');
    try {
      const activeCols = columns.filter((c) => c.visible !== false);
      const headers = activeCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
      const rows = computedTableData.map((row) =>
        activeCols
          .map((c) => {
            const val = row[c.id] ?? row[c.key];
            const strVal = val !== undefined && val !== null ? String(val) : '';
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(',')
      );

      const csvContent = `\uFEFF${headers}\n${rows.join('\n')}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `${headerConfig.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({ message: 'Đã tải xuống file CSV!', type: 'success' });
    } catch {
      setToast({ message: 'Không thể xuất file CSV.', type: 'error' });
    } finally {
      setBusyExport('');
    }
  };

  const handlePrint = () => {
    setBusyExport('PRINT');
    try {
      const activeCols = columns.filter((c) => c.visible !== false);
      const rows = computedTableData.map((row) =>
        activeCols.map((c) => {
          const val = row[c.id] ?? row[c.key];
          return val !== undefined && val !== null ? val : '—';
        })
      );

      printReport({
        title: headerConfig.title,
        subtitle: headerConfig.subtitle,
        institutionName: headerConfig.institutionName,
        facultyName: headerConfig.facultyName,
        orientation: pageOrientation,
        pageSize: 'A4',
        columns: activeCols.map((c) => ({
          header: c.header,
          align: c.align || 'left',
        })),
        rows,
        signers: signers.map((s) => ({ title: s.title, subtitle: s.subtitle })),
        footerNotes,
      });
    } finally {
      setBusyExport('');
    }
  };

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Main Toolbar: Seamless Single-Bar Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                {currentTemplate.name}
              </span>
              {currentTemplate.isSystemPreset ? (
                <span className="ui-pill text-type-helper font-medium px-2.5 py-0.5 rounded-full border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300">
                  Mẫu hệ thống
                </span>
              ) : (
                <span className="ui-pill text-type-helper font-medium px-2.5 py-0.5 rounded-full border border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                  Mẫu riêng
                </span>
              )}
            </div>
            <p className="text-type-body-sm text-slate-500 dark:text-slate-400 font-normal">
              {currentTemplate.description || 'Tự do cấu hình công thức, cột và xem trước kết quả trực quan.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsTemplatePickerOpen(true)}
            leftIcon={<Bookmark className="h-4 w-4" />}
          >
            Quản lý & Đổi mẫu
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCsv}
            disabled={!!busyExport}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Xuất CSV
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handlePrint}
            disabled={!!busyExport}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            In / PDF
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleExportExcel}
            disabled={!!busyExport}
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            className="min-w-[170px]"
          >
            {busyExport === 'XLSX' ? 'Đang tạo Excel...' : 'Xuất File Excel (.xlsx)'}
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Column & Formula Manager (5 Cols) + Right Live Preview (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Dedicated Column Structure & Formula Manager */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            {/* Header with Soft Accent CTA for Formula Creation */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">
                  Cấu trúc Cột ({columns.length})
                </h3>
                <p className="text-type-helper text-slate-500 font-normal">
                  Sắp xếp, sửa tiêu đề hoặc tạo cột công thức tính toán.
                </p>
              </div>

              {/* Soft Accent Button (Tier 2) per Button Hierarchy 2026 */}
              <Button
                variant="soft"
                size="sm"
                onClick={() => {
                  setEditingColumn(null);
                  setIsFormulaModalOpen(true);
                }}
              >
                + Thêm Cột Công Thức
              </Button>
            </div>

            {/* Column List with Clean Hairline Divider */}
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/80">
              {columns.map((col, idx) => (
                <div
                  key={col.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-2 text-type-body-sm"
                >
                  <div className="flex items-center gap-2 flex-1 truncate">
                    <span className="tabular-nums text-type-helper text-slate-400 w-4 text-center font-medium">
                      {idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {col.header}
                        </span>
                        {col.type === 'FORMULA' ? (
                          <span className="ui-pill text-type-helper font-medium px-2.5 py-0.5 rounded-full border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                            Công thức
                          </span>
                        ) : (
                          <span className="ui-pill text-type-helper font-medium px-2.5 py-0.5 rounded-full border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                            Gốc
                          </span>
                        )}
                      </div>
                      {col.formula && (
                        <p className="text-type-helper text-slate-500 truncate pt-0.5" title={col.formula}>
                          {col.formula}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions per column */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveColumn(idx, 'up')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Di chuyển lên"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === columns.length - 1}
                      onClick={() => handleMoveColumn(idx, 'down')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Di chuyển xuống"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>

                    {col.type === 'FORMULA' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingColumn(col);
                          setIsFormulaModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 transition ml-0.5 cursor-pointer"
                        title="Chỉnh sửa công thức"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 transition ml-0.5 cursor-pointer"
                      title="Xóa cột này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Standard Variables Footer */}
            <div className="p-3.5 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800">
              <p className="text-type-helper font-semibold text-slate-700 dark:text-slate-300 mb-2">
                + Thêm nhanh trường dữ liệu gốc:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_REPORT_VARIABLES.filter((v) => !columns.some((c) => c.key === v.key)).map(
                  (v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleAddStandardField(v.key, v.label)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-type-helper font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shadow-2xs"
                    >
                      + {v.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Realtime Interactive Live Spreadsheet Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <h3 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">
                Bảng Xem Trước Trực Quan (Live Preview)
              </h3>
            </div>

            {/* Orientation & Stats Switcher */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 p-0.5 text-type-body-sm font-medium">
                <button
                  type="button"
                  onClick={() => setPageOrientation('portrait')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    pageOrientation === 'portrait'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Khổ Dọc
                </button>
                <button
                  type="button"
                  onClick={() => setPageOrientation('landscape')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    pageOrientation === 'landscape'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Khổ Ngang
                </button>
              </div>

              <span className="text-type-helper text-slate-400 font-normal">
                {computedTableData.length} thí sinh
              </span>
            </div>
          </div>

          {/* Virtual Paper Sheet Container */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6 overflow-x-auto min-h-[500px]">
            {/* 1. Header Đơn vị & Quốc hiệu (Inherited from Template) */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                  {headerConfig.institutionName}
                </p>
                <p className="text-type-body-sm font-semibold text-slate-700 dark:text-slate-300">
                  {headerConfig.facultyName}
                </p>
                <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-1" />
              </div>
              <div>
                <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                  Cộng hòa Xã hội Chủ nghĩa Việt Nam
                </p>
                <p className="text-type-body-sm font-semibold text-slate-700 dark:text-slate-300 underline">
                  Độc lập - Tự do - Hạnh phúc
                </p>
              </div>
            </div>

            {/* 2. Tiêu đề Báo Cáo */}
            <div className="text-center space-y-1">
              <h2 className="text-type-section font-semibold text-slate-950 dark:text-white tracking-tight">
                {headerConfig.title}
              </h2>
              {headerConfig.subtitle && (
                <p className="text-type-body font-normal text-slate-600 dark:text-slate-400">
                  {headerConfig.subtitle}
                </p>
              )}
            </div>

            {/* 3. Bảng Dữ liệu Động với các Cột Công thức & Dòng Thống kê Tổng kết */}
            <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="ui-table w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-type-body-sm font-semibold text-slate-700 dark:text-slate-200">
                    {columns.map((c) => (
                      <th
                        key={c.id}
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          c.align === 'center'
                            ? 'text-center'
                            : c.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                        }`}
                      >
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-type-body font-normal">
                  {computedTableData.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {columns.map((c) => {
                        const val = row[c.id] ?? row[c.key];
                        return (
                          <td
                            key={c.id}
                            className={`py-2.5 px-3 whitespace-nowrap tabular-nums ${
                              c.align === 'center'
                                ? 'text-center'
                                : c.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                            } ${
                              c.type === 'FORMULA'
                                ? 'font-medium text-blue-700 dark:text-blue-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {val !== undefined && val !== null ? String(val) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>

                {/* Table Footer Summary Statistics Row */}
                <tfoot>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-semibold text-type-body-sm text-slate-900 dark:text-slate-100">
                    <td colSpan={2} className="py-2.5 px-3 text-left">
                      TỔNG CỘNG ({summaryStats.total} Thí sinh)
                    </td>
                    <td
                      colSpan={Math.max(1, columns.length - 2)}
                      className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums"
                    >
                      Điểm TB: <span className="font-semibold text-blue-600">{summaryStats.avg}</span>
                      <MetaSeparator />
                      Cao nhất: <span className="font-semibold text-emerald-600">{summaryStats.max}</span>
                      <MetaSeparator />
                      Thấp nhất: <span className="font-semibold text-rose-600">{summaryStats.min}</span>
                      <MetaSeparator />
                      Đạt: <span className="font-semibold text-emerald-600">{summaryStats.passCount}/{summaryStats.total} ({summaryStats.passRate})</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4. Footer Chữ Ký (Inherited from Template) */}
            <div className="pt-6">
              <div
                className="grid gap-4 text-center"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(1, signers.length)}, minmax(0, 1fr))`,
                }}
              >
                {signers.map((s, sIdx) => (
                  <div key={sIdx} className="space-y-12">
                    <div>
                      <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                        {s.title}
                      </p>
                      {s.subtitle && (
                        <p className="text-type-helper text-slate-400 font-normal italic">
                          {s.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="h-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Editor Modal */}
      {isFormulaModalOpen && (
        <FormulaEditorModal
          isOpen={isFormulaModalOpen}
          onClose={() => {
            setIsFormulaModalOpen(false);
            setEditingColumn(null);
          }}
          onSave={handleSaveColumnFromModal}
          initialColumn={editingColumn}
        />
      )}

      {/* Template Picker & Save Modal */}
      {isTemplatePickerOpen && (
        <ReportTemplatePickerModal
          isOpen={isTemplatePickerOpen}
          onClose={() => setIsTemplatePickerOpen(false)}
          onSelectTemplate={handleSelectTemplate}
          onSaveCurrentAsTemplate={handleSaveAsNewTemplate}
          customTemplates={customTemplates}
          onDeleteTemplate={handleDeleteCustomTemplate}
          currentTemplateName={currentTemplate.name}
        />
      )}
    </div>
  );
}
