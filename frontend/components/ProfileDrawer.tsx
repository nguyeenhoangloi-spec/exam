'use client';

import React from 'react';
import { X, User, Mail, Phone, Calendar, BookOpen, GraduationCap, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 px-6 py-4 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3.5 pr-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/20 text-sm font-black text-white shadow-xs tracking-wider">
                {shortAvatar}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="truncate text-base font-bold text-white max-w-[200px]" title={title}>{title}</h2>
                  {badge && (
                    <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {subtitle && <p className="truncate text-xs font-medium text-blue-100">{subtitle}</p>}
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin chi tiết</h3>
              <div className="grid gap-3">
                {details.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
                        {item.label}:
                      </span>
                      <span className="font-semibold text-slate-900 text-right break-words">{item.value || '---'}</span>
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
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-right">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-100 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
