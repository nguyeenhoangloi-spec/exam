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

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="relative bg-slate-900 px-6 py-6 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3.5 pr-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-lg font-bold text-white shadow-lg">
                {avatarText}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="truncate text-lg font-bold text-white max-w-[180px]" title={title}>{title}</h2>
                  {badge && (
                    <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {subtitle && <p className="truncate text-xs font-medium text-slate-300">{subtitle}</p>}
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
          <div className="border-t border-slate-200 bg-slate-50 p-4 text-right">
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
