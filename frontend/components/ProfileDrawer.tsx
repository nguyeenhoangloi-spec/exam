'use client';

import React from 'react';
import { X, User, Mail, Phone, Calendar, BookOpen, GraduationCap, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';
import { Button } from './ui/Button';
import { IdentifierBadge } from './ui/IdentifierBadge';

interface ProfileDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 title: string;
 subtitle?: string;
 avatarText?: string;
 badge?: { label: string; className: string; status?: string };
 details: { label: string; value: React.ReactNode; icon?: React.ElementType }[];
 extraSections?: { title: string; content: React.ReactNode }[];
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
}) => {
 if (!isOpen) return null;

const shortAvatar = avatarText ? avatarText.trim().slice(0, 3).toUpperCase() : 'HD';
 const isIdentifierSubtitle = typeof subtitle === 'string' && /(^|\s)(mã|id|code|snapshot)/i.test(subtitle);

 return (
    <div role="dialog" aria-modal="true" aria-label="Thông tin chi tiết" className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700">
          {/* Header - Modern Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 p-5 text-white shrink-0 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md font-semibold text-base text-white border border-white/25 shadow-2xs">
                  {shortAvatar}
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <h2 className="text-[18px] font-semibold leading-snug text-white line-clamp-2 break-words" title={title}>
                    {title}
                  </h2>

                  {badge && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {badge.status ? (
                        <StatusBadge status={badge.status} customLabel={badge.label} />
                      ) : (
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[12px] font-semibold bg-white/20 text-white backdrop-blur-md border border-white/25 ${badge.className || ''}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  )}

                  {subtitle && (
                    <div className="mt-1.5">
                      {isIdentifierSubtitle ? (
                        <IdentifierBadge tone="inverse" title={subtitle}>{subtitle}</IdentifierBadge>
                      ) : (
                        <p className="text-[13px] font-medium text-blue-100/90 tabular-nums">{subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-2xs">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Thông tin chi tiết</h3>
              <div className="grid gap-3.5">
                {details.map((item, idx) => {
                  const Icon = item.icon;
                  const isIdentifier = /(^|\s)(mã|id|code|snapshot)/i.test(item.label);
                  return (
                    <div key={idx} className="flex items-start justify-between gap-3 text-[14px]">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[13px] font-medium shrink-0 pt-0.5">
                        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
                        {item.label}:
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right text-[14px] leading-snug break-words max-w-[65%]">
                        {typeof item.value === 'string' && item.label.toLowerCase().includes('trạng thái')
                          ? <StatusBadge status={item.value} />
                          : isIdentifier && typeof item.value === 'string'
                            ? <IdentifierBadge tone="neutral" title={item.value}>{item.value}</IdentifierBadge>
                            : item.value || '---'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extra Custom Sections */}
            {extraSections && extraSections.length > 0 && (
              <div className="space-y-4">
                {extraSections.map((sec, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
                    <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-500 dark:text-slate-400">{sec.title}</h3>
                    <div>{sec.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3.5 flex items-center justify-end shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
 );
};
