'use client';

import { MetaSeparator } from '@/components/ui/InlineMeta';

import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl';
import { DynamicColumnDefinition } from './FormulaEditorModal';
import {
  Bookmark,
  Plus,
  Trash2,
  Check,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

export interface SavedReportTemplate {
  id: string;
  name: string;
  description?: string;
  headerConfig: {
    institutionName: string;
    facultyName: string;
    motto: string;
    title: string;
    subtitle: string;
  };
  columns: DynamicColumnDefinition[];
  signers: Array<{ title: string; subtitle?: string; name?: string }>;
  footerNotes?: string;
  isSystemPreset?: boolean;
  createdAt: string;
}

export const SYSTEM_PRESET_TEMPLATES: SavedReportTemplate[] = [
  {
    id: 'preset_standard_university',
    name: 'Bảng điểm tổng hợp Đại học (Chuẩn Quy chế Đào tạo)',
    description: 'Bao gồm Điểm thang 10, Điểm thang 4, Điểm chữ và Xếp loại học lực chính thức.',
    headerConfig: {
      institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
      facultyName: 'KHOA CÔNG NGHỆ THÔNG TIN',
      motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
      title: 'BẢNG TỔNG HỢP ĐIỂM THI HỌC PHẦN',
      subtitle: 'Học kỳ 1 – Năm học 2025–2026',
    },
    columns: [
      { id: 'stt', key: 'stt', header: 'STT', type: 'FIELD', align: 'center', visible: true },
      { id: 'studentCode', key: 'studentCode', header: 'Mã sinh viên', type: 'FIELD', align: 'center', visible: true },
      { id: 'fullName', key: 'fullName', header: 'Họ và tên thí sinh', type: 'FIELD', align: 'left', visible: true },
      { id: 'className', key: 'className', header: 'Lớp sinh hoạt', type: 'FIELD', align: 'left', visible: true },
      { id: 'totalScore', key: 'totalScore', header: 'Điểm thi (/10)', type: 'FIELD', align: 'center', visible: true },
      { id: 'calc_grade4', key: 'calc_grade4', header: 'Thang 4', type: 'FORMULA', formula: 'GRADE4({totalScore})', align: 'center', decimals: 1, visible: true },
      { id: 'calc_letter', key: 'calc_letter', header: 'Điểm chữ', type: 'FORMULA', formula: 'LETTER_GRADE({totalScore})', align: 'center', visible: true },
      { id: 'calc_class', key: 'calc_class', header: 'Xếp loại', type: 'FORMULA', formula: 'CLASSIFICATION({totalScore})', align: 'center', visible: true },
      { id: 'calc_status', key: 'calc_status', header: 'Kết quả', type: 'FORMULA', formula: 'IF({totalScore} >= 4.0, "ĐẠT", "HỌC LẠI")', align: 'center', visible: true },
    ],
    signers: [
      { title: 'NGƯỜI LẬP BẢNG', subtitle: '(Ký và ghi rõ họ tên)' },
      { title: 'TRƯỜNG BỘ MÔN', subtitle: '(Ký và ghi rõ họ tên)' },
      { title: 'TRƯỞNG KHOA', subtitle: '(Ký, đóng dấu)' },
    ],
    footerNotes: 'Điểm số được tính toán tự động và công nhận theo quy chế khảo thí hiện hành.',
    isSystemPreset: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_weighted_course',
    name: 'Báo cáo Điểm Học phần có Trọng số Quá trình (30% QT + 70% Thi)',
    description: 'Tự động tính Điểm trung bình môn học kết hợp điểm quá trình/chuyên cần và thi kết thúc.',
    headerConfig: {
      institutionName: 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ',
      facultyName: 'PHÒNG ĐÀO TẠO & KHẢO THÍ',
      motto: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
      title: 'BÁO CÁO KẾT QUẢ HỌC PHẦN TOÀN KHÓA',
      subtitle: 'Áp dụng công thức trọng số 30/70',
    },
    columns: [
      { id: 'stt', key: 'stt', header: 'STT', type: 'FIELD', align: 'center', visible: true },
      { id: 'studentCode', key: 'studentCode', header: 'Mã sinh viên', type: 'FIELD', align: 'center', visible: true },
      { id: 'fullName', key: 'fullName', header: 'Họ và tên thí sinh', type: 'FIELD', align: 'left', visible: true },
      { id: 'bonusScore', key: 'bonusScore', header: 'Điểm QT (30%)', type: 'FIELD', align: 'center', visible: true },
      { id: 'totalScore', key: 'totalScore', header: 'Điểm Thi (70%)', type: 'FIELD', align: 'center', visible: true },
      { id: 'calc_tbm', key: 'calc_tbm', header: 'Điểm TBM (10)', type: 'FORMULA', formula: 'ROUND(({bonusScore} * 0.3) + ({totalScore} * 0.7), 2)', align: 'center', decimals: 2, visible: true },
      { id: 'calc_grade4', key: 'calc_grade4', header: 'Điểm Hệ 4', type: 'FORMULA', formula: 'GRADE4(ROUND(({bonusScore} * 0.3) + ({totalScore} * 0.7), 2))', align: 'center', decimals: 1, visible: true },
      { id: 'calc_result', key: 'calc_result', header: 'Ghi chú', type: 'FORMULA', formula: 'IF(ROUND(({bonusScore} * 0.3) + ({totalScore} * 0.7), 2) >= 5, "Qua môn", "Thi lại")', align: 'center', visible: true },
    ],
    signers: [
      { title: 'CÁN BỘ CHẤM THI', subtitle: '(Ký, ghi rõ họ tên)' },
      { title: 'TRƯỞNG PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký, đóng dấu)' },
    ],
    footerNotes: 'Điểm thành phần đã được kiểm duyệt đối chiếu với sổ điểm gốc.',
    isSystemPreset: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

interface ReportTemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SavedReportTemplate) => void;
  onSaveCurrentAsTemplate: (name: string, description: string) => void;
  customTemplates: SavedReportTemplate[];
  onDeleteTemplate: (id: string) => void;
  currentTemplateName?: string;
}

export function ReportTemplatePickerModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onSaveCurrentAsTemplate,
  customTemplates,
  onDeleteTemplate,
  currentTemplateName,
}: ReportTemplatePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'picker' | 'save_new'>('picker');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const allTemplates = [...SYSTEM_PRESET_TEMPLATES, ...customTemplates];

  const handleSave = () => {
    if (!newTemplateName.trim()) return;
    onSaveCurrentAsTemplate(newTemplateName.trim(), newTemplateDesc.trim());
    setNewTemplateName('');
    setNewTemplateDesc('');
    setActiveTab('picker');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản lý Mẫu Báo Cáo & Xuất Dữ Liệu Tùy Biến"
      subtitle="Lựa chọn mẫu báo cáo chuẩn có sẵn hoặc lưu lại mẫu thiết kế riêng của Khoa / Bộ môn."
      size="xl"
    >
      <div className="space-y-4 py-1">
        {/* Navigation Tabs (Sliding Segmented Control) */}
        <SlidingSegmentedControl<'picker' | 'save_new'>
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
          fullWidth
          size="md"
          options={[
            { value: 'picker', label: 'Danh sách Mẫu', count: allTemplates.length },
            { value: 'save_new', label: 'Lưu cấu hình thành Mẫu mới', icon: Plus },
          ]}
        />

        {activeTab === 'picker' ? (
          <div className="max-h-[440px] overflow-y-auto pr-1 custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
            {allTemplates.map((tpl) => {
              const isCurrent = currentTemplateName === tpl.name;
              return (
                <div
                  key={tpl.id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/70 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                        {tpl.name}
                      </h4>
                      {tpl.isSystemPreset ? (
                        <span className="ui-pill text-type-helper font-medium px-2 py-0.5 rounded-full border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300">
                          Mẫu hệ thống
                        </span>
                      ) : (
                        <span className="ui-pill text-type-helper font-medium px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                          Mẫu riêng đã lưu
                        </span>
                      )}
                      {isCurrent && (
                        <span className="ui-pill ui-pill-solid text-type-helper font-medium px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Đang áp dụng
                        </span>
                      )}
                    </div>

                    {tpl.description && (
                      <p className="text-type-body-sm text-slate-500 dark:text-slate-400 font-normal">
                        {tpl.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-type-helper text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap">
                      <span>{tpl.columns.length} cột</span>
                      <MetaSeparator />
                      <span>{tpl.signers.length} người ký</span>
                      <MetaSeparator />
                      <span className="truncate max-w-xs">{tpl.headerConfig.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {!tpl.isSystemPreset && (
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                        title="Xóa mẫu riêng này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => {
                        onSelectTemplate(tpl);
                        onClose();
                      }}
                    >
                      {isCurrent ? 'Đang dùng' : 'Áp dụng'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                Tên Mẫu báo cáo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Mẫu bảng điểm Khoa CNTT - Học kỳ 1, Mẫu điểm thưởng Đào tạo..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                Mô tả mục đích sử dụng (tùy chọn)
              </label>
              <textarea
                rows={3}
                placeholder="Ghi chú về công thức, cách tính điểm hoặc quy định áp dụng..."
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 text-type-body-sm text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Toàn bộ cấu hình cột, công thức tính toán, tiêu đề văn bản và danh sách người ký đang thiết lập sẽ được lưu lại nguyên vẹn để tải nhanh cho các đợt thi sau.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setActiveTab('picker')}>
                Quay lại danh sách
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!newTemplateName.trim()}
                onClick={handleSave}
              >
                Lưu Mẫu Báo Cáo
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
