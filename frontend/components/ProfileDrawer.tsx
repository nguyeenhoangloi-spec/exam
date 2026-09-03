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
  footer?: React.ReactNode;
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
  avatarText,
  badge,
  details,
  extraSections,
  maxWidth = 'lg',
  headerActions,
  footer,
}) => {
  return (
    <DetailDrawer
      role="dialog"
      className="z-[100]"
      ariaLabel="Thông tin chi tiết"
      isOpen={isOpen}
      onClose={onClose}
      showAvatar={Boolean(avatarText)}
      avatarText={avatarText}
      maxWidth={maxWidth}
      title={title || 'Chi tiết thông tin'}
      badge={
        badge ? (
          <StatusBadge
            status={badge.status || badge.label}
            customLabel={badge.label}
          />
        ) : undefined
      }
      subtitle={subtitle || undefined}
      headerActions={headerActions}
      footer={
        footer ?? (
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Đóng
            </Button>
          </div>
        )
      }
    >
      {/* Body — Bố cục danh sách thông tin chi tiết phẳng chuẩn Apple */}
      <div className="space-y-5">
        <div>
          <div className="mb-1.5">
            <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
              Thông tin chi tiết
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {(details || []).map((item, idx) => {
              const Icon = item.icon;
              const isIdentifier = /(^|\s)(mã|id|code|mssv|snapshot)/i.test(item.label);
              const isStatus = /(^|\s)(trạng thái|tình trạng)/i.test(item.label);

              return (
                <div
                  key={idx}
                  className="py-3 px-2 -mx-2 rounded-xl flex items-start justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 shrink-0 pt-0.5">
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />}
                    <span className="text-type-helper font-medium">{item.label}</span>
                  </div>

                  <div className="text-type-body font-semibold text-slate-950 dark:text-white text-right break-words max-w-[65%]">
                    {isStatus && typeof item.value === 'string' ? (
                      <StatusBadge status={item.value} />
                    ) : isIdentifier && typeof item.value === 'string' ? (
                      <IdentifierBadge tone="neutral" title={item.value}>
                        {item.value}
                      </IdentifierBadge>
                    ) : (
                      item.value ?? '—'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extra Sections — Phân tách phẳng bằng đường kẻ hairline */}
        {extraSections && extraSections.length > 0 && (
          <div className="space-y-5 pt-1">
            {extraSections.map((sec, i) => (
              <div key={i} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
                <h4 className="text-type-body font-semibold text-slate-900 dark:text-white">
                  {sec.title}
                </h4>
                <div className="text-type-body-sm font-normal text-slate-700 dark:text-slate-300">
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
