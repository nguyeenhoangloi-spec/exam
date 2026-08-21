'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Layers,
  Save,
  ShieldCheck,
  FolderSync,
  HardDrive,
} from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { FilterSelect } from '../ui/FilterSelect';

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
  { value: 1, label: 'Mỗi ngày' },
  { value: 2, label: '2 ngày / lần' },
  { value: 3, label: '3 ngày / lần' },
  { value: 7, label: 'Hàng tuần' },
  { value: 14, label: '2 tuần / lần' },
];

const RETENTION_OPTIONS = [
  { value: 5, label: '5 bản' },
  { value: 10, label: '10 bản' },
  { value: 15, label: '15 bản' },
  { value: 20, label: '20 bản' },
  { value: 30, label: '30 bản' },
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
      // Error handled in caller
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cài đặt tự động sao lưu"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-slate-800">
        {/* 1. Lịch tự động sao lưu */}
        <div className="py-4 first:pt-1 space-y-3.5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="autoBackupToggle" className="text-type-body font-medium text-slate-900 dark:text-slate-100 block cursor-pointer">
                Tự động sao lưu
              </label>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                Tạo bản sao lưu định kỳ theo lịch trình
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="autoBackupToggle"
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
              <div className="space-y-1.5">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Chu kỳ</span>
                </label>
                <FilterSelect
                  value={String(intervalDays)}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  fullWidth
                  fitTriggerWidth
                  size="md"
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </FilterSelect>
              </div>

              <div className="space-y-1.5">
                <label className="text-type-body font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Thời gian thực hiện</span>
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

        {/* 2. Số lượng lưu giữ */}
        <div className="py-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <label className="text-type-body font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Số bản sao lưu tối đa</span>
              </label>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                Tự động dọn dẹp các bản sao lưu cũ hơn
              </p>
            </div>
            <FilterSelect
              value={String(maxRetentionCount)}
              onChange={(e) => setMaxRetentionCount(Number(e.target.value))}
              size="md"
              containerClassName="w-full sm:w-44"
              align="right"
              fitTriggerWidth
            >
              {RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </FilterSelect>
          </div>
        </div>

        {/* 3. Lưu trữ kép dự phòng */}
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="dualStorageToggle" className="text-type-body font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Lưu trữ kép dự phòng</span>
              </label>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                Tự động nhân bản snapshot sang thư mục dự phòng
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="dualStorageToggle"
                type="checkbox"
                checked={dualStorageEnabled}
                onChange={(e) => setDualStorageEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Vị trí lưu trữ */}
          <div className="text-type-body-sm space-y-2 pt-1">
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-blue-600 shrink-0" />
                Kho chính
              </span>
              <code className="text-type-helper px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                {initialSettings?.primaryPath ? (initialSettings.primaryPath.includes('primary') ? 'backup-runtime/primary' : initialSettings.primaryPath) : 'backup-runtime/primary'}
              </code>
            </div>

            {dualStorageEnabled && (
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FolderSync className="h-4 w-4 text-emerald-600 shrink-0" />
                  Kho dự phòng
                </span>
                <code className="text-type-helper px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                  {secondaryPath ? (secondaryPath.includes('mirror_backup') ? 'backup-runtime/mirror_backup' : secondaryPath) : 'backup-runtime/mirror_backup'}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4">
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
            leftIcon={<Save className="h-4 w-4" />}
            isLoading={isSaving}
            disabled={loading}
          >
            Lưu cấu hình
          </Button>
        </div>
      </form>
    </Modal>
  );
}
