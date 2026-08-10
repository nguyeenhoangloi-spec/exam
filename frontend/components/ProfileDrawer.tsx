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
  badge?: { label: string; className: string };
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
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header - Solid Flat Color matching All Drawers */}
          <div className="bg-[#2563EB] p-5 text-white shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold text-base text-white border border-white/15">
                  {shortAvatar}
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="truncate text-[20px] font-semibold leading-[28px] text-white max-w-[220px]" title={title}>{title}</h2>
                    {badge && (
                      <span className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-0.5 text-[13px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {subtitle && <p className="truncate text-[13px] font-semibold text-blue-200 mt-1 font-mono">{subtitle}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
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
              <div className="grid gap-3">
                {details.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start justify-between gap-3 text-[15px]">
                      <span className="flex items-center gap-2 text-[#64748B] text-[13px] font-semibold shrink-0">
                        {Icon && <Icon className="h-4 w-4 text-[#64748B]" />}
                        {item.label}:
                      </span>
                      <span className="font-semibold text-[#0F172A] text-right text-[15px]">{item.value || '---'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extra Custom Sections */}
            {extraSections && extraSections.length > 0 && (
              <div className="space-y-4">
                {extraSections.map((sec, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{sec.title}</h3>
                    <div>{sec.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/90 bg-slate-50 px-6 py-4 flex items-center justify-end">
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
