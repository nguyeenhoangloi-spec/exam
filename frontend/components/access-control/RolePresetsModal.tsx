'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, GraduationCap, FileCheck, Shield, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface RolePresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Array<{
    id: number;
    username: string;
    role: string;
    teacher?: { fullName: string } | null;
    student?: { fullName: string } | null;
  }>;
  onApplyPreset: (userId: number, preset: { name: string; permissionCodes: string[] }) => Promise<void>;
  saving?: boolean;
}

const PRESET_TEMPLATES = [
  {
    id: 'DEAN',
    name: 'Trưởng Khoa / Trưởng Bộ Môn',
    description: 'Chuyên trách phê duyệt câu hỏi, duyệt đề thi chính thức, xem báo cáo thống kê kỳ thi của khoa',
    icon: GraduationCap,
    color: 'blue',
    permissions: [
      'QUESTION_APPROVE',
      'EXAM_PAPER_APPROVE',
      'EXAM_REPORT_VIEW',
      'GRADE_APPEAL_REVIEW',
      'ESSAY_GRADE',
    ],
  },
  {
    id: 'GRADER',
    name: 'Cán Bộ Chấm Thi & Phúc Khảo',
    description: 'Tập trung vào công tác chấm bài thi tự luận, duyệt kết quả và giải quyết đơn phúc khảo',
    icon: FileCheck,
    color: 'emerald',
    permissions: ['ESSAY_GRADE', 'ESSAY_PUBLISH', 'GRADE_APPEAL_REVIEW'],
  },
  {
    id: 'SUPERVISOR',
    name: 'Cán Bộ Coi Thi & Giám Thị',
    description: 'Thực hiện giám sát phòng thi, điểm danh sinh viên, lập biên bản ca thi và theo dõi sự cố',
    icon: Shield,
    color: 'amber',
    permissions: ['EXAM_SUPERVISOR_MANAGE', 'EXAM_REPORT_VIEW'],
  },
  {
    id: 'CURRICULUM_LEAD',
    name: 'Chuyên Viên Ngân Hàng Đề Thi',
    description: 'Chuyên soạn thảo, ma trận đề thi và bảo mật nguồn câu hỏi trắc nghiệm/tự luận',
    icon: BookOpen,
    color: 'blue',
    permissions: ['QUESTION_APPROVE', 'EXAM_PAPER_APPROVE'],
  },
];

export function RolePresetsModal({
  isOpen,
  onClose,
  users,
  onApplyPreset,
  saving = false,
}: RolePresetsModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('DEAN');
  const [targetUserId, setTargetUserId] = useState<string>('');

  if (!isOpen) return null;

  const currentPreset = PRESET_TEMPLATES.find((p) => p.id === selectedPresetId) || PRESET_TEMPLATES[0];
  const getDisplayName = (u: any) => u.teacher?.fullName || u.student?.fullName || u.username;

  const handleApply = async () => {
    if (!targetUserId || !currentPreset) return;
    await onApplyPreset(Number(targetUserId), {
      name: currentPreset.name,
      permissionCodes: currentPreset.permissions,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="presets-modal-title"
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center p-3 overscroll-contain animate-fade-in sm:p-4"
    >
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div
        className="relative z-[101] w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] animate-in zoom-in-95 duration-200 sm:max-h-[calc(100dvh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 id="presets-modal-title" className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                Hồ Sơ Mẫu Vị Trí Chuyên Trách (Security Presets)
              </h3>
              <p className="text-type-helper text-slate-500 font-normal">
                Áp dụng nhanh gói quyền hạn chuẩn xác định sẵn cho giảng viên hoặc cán bộ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_TEMPLATES.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              const Icon = preset.icon;

              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                          {preset.name}
                        </h4>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                      {preset.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                    {preset.permissions.map((code) => (
                      <span
                        key={code}
                        className="table-badge ui-pill px-2 py-0.5 rounded-full text-type-helper font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Selection Form */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2.5">
            <label className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">
              Chọn tài khoản áp dụng mẫu [{currentPreset.name}]
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">-- Chọn tài khoản cần gán mẫu --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {getDisplayName(u)} ({u.username} – {u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
          <Button variant="ghost" size="md" onClick={onClose} disabled={saving}>
            Hủy
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={!targetUserId || saving}
            isLoading={saving}
          >
            Áp dụng hồ sơ mẫu này
          </Button>
        </div>
      </div>
    </div>
  );
}
