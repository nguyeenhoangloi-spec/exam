'use client';

import React from 'react';
import { X, User, Mail, Phone, Calendar, BookOpen, GraduationCap, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './common/StatusBadge';
import { Button } from './ui/Button';

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

 return (
    <div role="dialog" aria-modal="true" aria-label="Thông tin chi tiết" className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header - Modern Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 p-5 text-white shrink-0 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 font-bold text-base text-white border border-white/20 shadow-xs">
                  {shortAvatar}
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <h2 className="text-[18px] font-bold leading-snug text-white line-clamp-2 break-words" title={title}>
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
                    <p className="text-[13px] font-medium text-blue-100/90 mt-1.5 tabular-nums">
                      {subtitle}
                    </p>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 shadow-2xs">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">Thông tin chi tiết</h3>
              <div className="grid gap-3.5">
                {details.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start justify-between gap-3 text-[14px]">
                      <span className="flex items-center gap-2 text-slate-500 text-[13px] font-semibold shrink-0 pt-0.5">
                        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
                        {item.label}:
                      </span>
                      <span className="font-semibold text-slate-900 text-right text-[14px] leading-snug break-words max-w-[65%]">
                        {typeof item.value === 'string' && item.label.toLowerCase().includes('trạng thái')
                          ? <StatusBadge status={item.value} />
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
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{sec.title}</h3>
                    <div>{sec.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/90 bg-white px-6 py-3.5 flex items-center justify-end shrink-0">
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
