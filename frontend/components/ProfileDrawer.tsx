'use client';

import React from 'react';
import { StatusBadge } from './common/StatusBadge';
import { Button } from './ui/Button';
import { IdentifierBadge } from './ui/IdentifierBadge';
import { DetailDrawer } from './ui/DetailDrawer';

export interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  avatarText?: string;
  badge?: { label: string; className?: string; status?: string };
  details: { label: string; value: React.ReactNode; icon?: React.ElementType }[];
  extraSections?: { title: string; content: React.ReactNode }[];
  maxWidth?: 'md' | 'lg';
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  avatarText = 'SV',
  badge,
  details,
  extraSections,
  maxWidth = 'md',
}) => {
  return (
    <DetailDrawer
      ariaLabel="role='dialog' className='z-[100]'"
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      avatarText={avatarText}
      maxWidth={maxWidth === 'lg' ? 'max-w-[540px]' : 'md'}
      badge={
        badge ? (
          <StatusBadge
            status={badge.status || badge.label}
            customLabel={badge.label}
            variant="pill"
            className={badge.className}
          />
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-end">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      {/* Body — Liền mạch, Typography Đậm đà Sắc nét */}
      <div>
        {/* Tiêu đề mục có thanh nhấn xanh thương hiệu */}
        <div className="flex items-center gap-2 mb-3">
          <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
          <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
            Thông tin chi tiết
          </h3>
        </div>

        {/* Danh sách thông tin dạng đường kẻ liền mạch */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {(details || []).map((item, idx) => {
            const Icon = item.icon;
            const isIdentifier = /(^|\s)(mã|id|code|snapshot)/i.test(item.label);

            return (
              <div
                key={idx}
                className="py-3 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 group"
              >
                {/* Cột Trái: Icon + Label rõ nét */}
                <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-type-body-sm font-semibold shrink-0">
                  {Icon && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>

                {/* Cột Phải: Giá trị đậm nét */}
                <span className="font-semibold text-slate-900 dark:text-white text-right text-type-body leading-snug break-words max-w-[62%]">
                  {typeof item.value === 'string' && item.label.toLowerCase().includes('trạng thái') ? (
                    <StatusBadge status={item.value} />
                  ) : isIdentifier && typeof item.value === 'string' ? (
                    <IdentifierBadge tone="neutral" title={item.value}>
                      {item.value}
                    </IdentifierBadge>
                  ) : (
                    item.value || '---'
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Custom Sections */}
      {extraSections && extraSections.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {extraSections.map((sec, i) => (
            <div key={i} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-1 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                  {sec.title}
                </h3>
              </div>
              <div className="text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                {sec.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </DetailDrawer>
  );
};

