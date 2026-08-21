'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  HardDrive,
  ShieldCheck,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  FolderSync,
} from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';

export interface BackupSettingsPayload {
  autoBackupEnabled: boolean;
  intervalDays: number;
  backupTime: string;
  maxRetentionCount: number;
  dualStorageEnabled: boolean;
  primaryPath?: string;
  secondaryPath?: string;
}

interface BackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: BackupSettingsPayload | null;
  onSave: (settings: BackupSettingsPayload) => Promise<void>;
  loading?: boolean;
}

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Mỗi ngày (1 ngày / lần - Khuyến nghị)', sub: 'Bảo vệ dữ liệu toàn diện mỗi đêm' },
  { value: 2, label: '2 ngày / lần', sub: 'Sao lưu định kỳ cách nhật' },
  { value: 3, label: '3 ngày / lần', sub: 'Phù hợp hệ thống tải trung bình' },
  { value: 7, label: 'Hàng tuần (7 ngày / lần)', sub: 'Sao lưu tổng kết cuối tuần' },
  { value: 14, label: '2 tuần / lần', sub: 'Chu kỳ giãn cách' },
];

const RETENTION_OPTIONS = [
  { value: 5, label: '5 bản gần nhất', sub: 'Tiết kiệm dung lượng đĩa tối đa' },
  { value: 10, label: '10 bản gần nhất (Khuyến nghị)', sub: 'Cân bằng giữa an toàn và dung lượng' },
  { value: 15, label: '15 bản gần nhất', sub: 'Lưu giữ đủ lịch sử 2 tuần' },
  { value: 20, label: '20 bản gần nhất', sub: 'Lịch sử sao lưu gần 1 tháng' },
  { value: 30, label: '30 bản gần nhất', sub: 'Lưu giữ dài hạn toàn bộ tháng' },
];

export function BackupSettingsModal({
  isOpen,
  onClose,
  initialSettings,
  onSave,
  loading = false,
}: BackupSettingsModalProps) {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [intervalDays, setIntervalDays] = useState(1);
  const [backupTime, setBackupTime] = useState('02:00');
  const [maxRetentionCount, setMaxRetentionCount] = useState(10);
  const [dualStorageEnabled, setDualStorageEnabled] = useState(true);
  const [secondaryPath, setSecondaryPath] = useState('backup-runtime/mirror_backup');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setAutoBackupEnabled(initialSettings.autoBackupEnabled !== false);
      setIntervalDays(initialSettings.intervalDays || 1);
      setBackupTime(initialSettings.backupTime || '02:00');
      setMaxRetentionCount(initialSettings.maxRetentionCount || 10);
      setDualStorageEnabled(initialSettings.dualStorageEnabled !== false);
      if (initialSettings.secondaryPath) {
        setSecondaryPath(initialSettings.secondaryPath);
      }
    }
  }, [initialSettings, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave({
        autoBackupEnabled,
        intervalDays,
        backupTime,
        maxRetentionCount,
        dualStorageEnabled,
        secondaryPath: secondaryPath.trim() || undefined,
      });
      onClose();
    } catch {
      // Error handled in caller via Toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cài đặt Tự động Sao lưu & Lưu trữ Kép"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-1">
        {/* Section 1: Lịch Tự Động Sao Lưu */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Lịch trình tự động sao lưu
            </h4>
          </div>

          {/* Toggle Bật / Tắt Tự động */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-3.5">
            <div className="space-y-0.5">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 block">
                Kích hoạt tự động sao lưu
              </span>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-medium">
                Hệ thống sẽ định kỳ tạo bản sao lưu snapshot tự động mà không cần can thiệp thủ công
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {autoBackupEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Chu kỳ sao lưu */}
              <div className="space-y-1.5">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Chu kỳ sao lưu</span>
                </label>
                <select
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-type-body text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khung giờ chạy */}
              <div className="space-y-1.5">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Khung giờ thực hiện</span>
                </label>
                <input
                  type="time"
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-type-body text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Chính Sách Lưu Giữ & Giới Hạn Bản Sao Lưu */}
        <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Chính sách lưu giữ & dọn dẹp (Retention Policy)
            </h4>
          </div>

          <div className="space-y-1.5">
            <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Số lượng bản sao lưu tối đa giữ lại</span>
            </label>
            <select
              value={maxRetentionCount}
              onChange={(e) => setMaxRetentionCount(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-type-body text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — ({opt.sub})
                </option>
              ))}
            </select>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 font-medium pt-1">
              Hệ thống sẽ giữ đúng <strong>{maxRetentionCount}</strong> bản sao lưu thành công mới nhất. Các bản cũ hơn sẽ tự động được dọn dẹp sạch sẽ ở cả 2 kho để bảo vệ dung lượng đĩa.
            </p>
          </div>
        </div>

        {/* Section 3: Lưu Trữ Kép 2 Nơi (Dual Storage Mirror) */}
        <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Cơ chế lưu trữ kép dự phòng (Dual Storage Mirror)
            </h4>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-3.5">
            <div className="space-y-0.5">
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Bật chế độ lưu 2 nơi (Mất 1 còn 1)</span>
              </span>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-medium">
                Ghi đồng thời bản sao lưu vào Kho chính và Kho dự phòng thứ 2. Tự động chuyển đổi dự phòng khi phục hồi.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={dualStorageEnabled}
                onChange={(e) => setDualStorageEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {dualStorageEnabled && (
            <div className="space-y-2 rounded-xl border border-blue-100 dark:border-blue-950 bg-blue-50/40 dark:bg-blue-950/20 p-3 text-type-body">
              <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                <FolderSync className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-type-helper">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Trạng thái phân tán kho lưu trữ:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-300 font-medium">
                    <li>
                      <strong>Kho 1 (Primary):</strong> {initialSettings?.primaryPath || 'backup-runtime/primary'}
                    </li>
                    <li>
                      <strong>Kho 2 (Mirror Replica):</strong> {secondaryPath}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving || loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || loading}
            className="flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
