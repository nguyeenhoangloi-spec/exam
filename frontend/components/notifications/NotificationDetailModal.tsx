'use client';

import React from 'react';
import { Bell, Calendar, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';

export interface NotificationDetailItem {
  id: string;
  title: string;
  desc: string;
  href?: string;
  createdAt?: string;
  type?: string;
}

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationDetailItem | null;
  onNavigate?: (href: string) => void;
}

export function NotificationDetailModal({
  isOpen,
  onClose,
  notification,
  onNavigate,
}: NotificationDetailModalProps) {
  if (!notification) return null;

  const isScheduleChange = notification.title.toLowerCase().includes('dời') || notification.desc.toLowerCase().includes('dời');
  const isCancelled = notification.title.toLowerCase().includes('hủy') || notification.desc.toLowerCase().includes('hủy');

  const handleGoToPage = () => {
    onClose();
    if (notification.href && onNavigate) {
      onNavigate(notification.href);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết thông báo"
      subtitle="Thông báo hệ thống khảo thí"
      size="md"
    >
      <div className="space-y-4 text-type-body">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/60">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            isCancelled
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              : isScheduleChange
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
          }`}>
            {isCancelled ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isScheduleChange ? (
              <Calendar className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-type-body text-slate-900 dark:text-slate-100 leading-snug">
              {notification.title}
            </h3>
            <div className="flex items-center gap-2 text-type-helper text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{notification.createdAt ? new Date(notification.createdAt).toLocaleString('vi-VN') : 'Vừa nhận'}</span>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
          <label className="ui-label block text-type-body font-medium text-slate-700 dark:text-slate-300">
            Nội dung thông báo
          </label>
          <p className="text-type-body font-normal text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
            {notification.desc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>

          {notification.href && (
            <Button
              type="button"
              variant="primary"
              onClick={handleGoToPage}
            >
              <span>Đi đến trang liên quan</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
