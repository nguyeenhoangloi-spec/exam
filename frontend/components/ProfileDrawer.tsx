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
  details: { label: string; value: React.ReactNode; icon?: React.ElementType; fullWidth?: boolean }[];
  extraSections?: { title: string; content: React.ReactNode }[];
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;
  headerActions?: React.ReactNode;
}

/**
 * ProfileDrawer - Component xem chi tiết thực thể (Thùng rác, Lớp học, Khoa, Phòng thi, Ca thi...)
 * - Kế thừa 100% hoạt ảnh 60 FPS mượt mà từ DetailDrawer
 * - Bố cục phẳng hiện đại chuẩn Apple / Linear
 */
export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  details,
  extraSections,
  maxWidth = 'lg',
  headerActions,
}) => {
  const idMatch = typeof subtitle === 'string' ? subtitle.match(/^(?:mã(?:\s+[a-zà-ỹ]+)*|mssv|id|code)\s*:\s*(.+)$/i) : null;
  const cleanSubtitle = idMatch ? null : subtitle;
  const identifierCode = idMatch ? idMatch[1].trim() : null;

  return (
    <DetailDrawer
      ariaLabel="role='dialog' className='z-[100]'"
      isOpen={isOpen}
      onClose={onClose}
      showAvatar={false}
      maxWidth={maxWidth}
      title={
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="text-type-card font-semibold text-slate-950 dark:text-white">
            {title || 'Chi tiết thông tin'}
          </span>

          {badge && (
            <StatusBadge
              status={badge.status || badge.label}
              customLabel={badge.label}
            />
          )}

          {identifierCode && (
            <IdentifierBadge tone="neutral" title={identifierCode}>
              {identifierCode}
            </IdentifierBadge>
          )}

          {cleanSubtitle && (
            <>
              <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
              <span className="text-type-body-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                {cleanSubtitle}
              </span>
            </>
          )}
        </div>
      }
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      {/* Body — Bố cục danh sách thông tin chi tiết */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3.5">
            <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
            <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
              Thông tin chi tiết
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(details || []).map((item, idx) => {
              const Icon = item.icon;
              const isIdentifier = /(^|\s)(mã|id|code|mssv|snapshot)/i.test(item.label);
              const isStatus = /(^|\s)(trạng thái|tình trạng)/i.test(item.label);

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    item.fullWidth ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />}
                    <span className="text-type-helper font-medium">{item.label}</span>
                  </div>

                  <div className="text-type-body font-semibold text-slate-950 dark:text-white break-words">
                    {isStatus && typeof item.value === 'string' ? (
                      <StatusBadge status={item.value} />
                    ) : isIdentifier && typeof item.value === 'string' ? (
                      <IdentifierBadge tone="neutral" title={item.value}>
                        {item.value}
                      </IdentifierBadge>
                    ) : (
                      item.value ?? '---'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extra Sections */}
        {extraSections && extraSections.length > 0 && (
          <div className="space-y-5 pt-2">
            {extraSections.map((sec, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-1 rounded-full bg-blue-600 shrink-0" />
                  <h4 className="text-type-body font-semibold text-slate-900 dark:text-white">
                    {sec.title}
                  </h4>
                </div>
                <div className="text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailDrawer>
  );
};
