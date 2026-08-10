'use client';

import React, { useState } from 'react';
import { Eye, MoreVertical, Edit, CheckCircle2, XCircle, Trash2, HelpCircle, FileText, ImageIcon } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { RubricDialog } from './RubricDialog';
import { Question } from '../../types';
import {
  QuestionDifficultyBadge,
  QuestionStatusBadge,
  QuestionTypeBadge,
} from './QuestionBadges';
import { getImageUrl, cleanMediaFileName } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { VideoLightboxModal } from '../VideoLightboxModal';
import { AudioLightboxModal } from '../AudioLightboxModal';

interface QuestionBankTableProps {
  questions: Question[];
  selected: string[];
  viewMode?: 'list' | 'grid' | 'compact';
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (q: Question) => void;
  onAction: (q: Question, name: string) => void;
  isAdmin: boolean;
}

export function QuestionBankTable({
  questions,
  selected,
  viewMode = 'list',
  visibleColumns = {
    code: true,
    content: true,
    subject: true,
    difficulty: true,
    type: true,
    status: true,
    creator: true,
    createdAt: true,
  },
  onSelect,
  onSelectAll,
  onDetail,
  onAction,
  isAdmin,
}: QuestionBankTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [rubricQuestion, setRubricQuestion] = useState<Question | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [videoLightbox, setVideoLightbox] = useState<{ url: string; fileName?: string } | null>(null);
  const [audioLightbox, setAudioLightbox] = useState<{ url: string; fileName?: string } | null>(null);
  const allSelected = questions.length > 0 && selected.length === questions.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return dateStr;
    }
  };

  // 1. Dạng Lưới Được Format Đẳng Cấp (Grid View Mode)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {questions.map((q) => {
          const isChecked = selected.includes(q.id);
          const codeText = q.code || `QH${q.id.slice(-5).toUpperCase()}`;
          const subjectName = q.subject?.subjectName || 'Chưa gán môn';
          const creatorName = q.createdByName || (q.createdBy as any)?.teacher?.fullName || q.createdBy?.fullName || q.createdBy?.username || (q.createdById ? `User #${q.createdById}` : 'Hệ thống');

          const isEssay = q.type === 'ESSAY';
          const optionsList = Array.isArray(q.options) ? q.options : [];

          return (
            <div
              key={q.id}
              className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                }`}
            >
              <div className="space-y-2.5">
                {/* Header Row: Checkbox, Code Pill, Badges */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(q.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => onDetail(q)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-black text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer shrink-0"
                    >
                      {codeText}
                    </button>
                    <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 max-w-[110px]">
                      {subjectName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <QuestionDifficultyBadge difficulty={q.difficulty || 'MEDIUM'} />
                    <QuestionStatusBadge status={q.status || 'APPROVED'} />
                  </div>
                </div>

                {/* Content: Truncated 2 Lines */}
                <p
                  className="text-[15px] font-semibold text-[#0F172A] leading-snug cursor-pointer hover:text-[#2563EB] transition line-clamp-2 min-h-[34px]"
                  onClick={() => onDetail(q)}
                  title={q.content}
                >
                  {q.content}
                </p>

                {/* ESSAY vs MULTIPLE_CHOICE Display */}
                {isEssay ? (
                  <div className="rounded-xl bg-blue-50/80 border border-blue-200/70 p-2.5 text-[13px] font-semibold text-blue-900 space-y-1">
                    <p className="font-semibold text-blue-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Câu tự luận
                    </p>
                    <p className="text-blue-900 font-medium">
                      {q.sampleAnswer || q.explanation ? 'Đã có hướng dẫn chấm. Mở chi tiết để xem.' : 'Chưa có hướng dẫn chấm.'}
                    </p>
                  </div>
                ) : optionsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {optionsList.map((opt) => (
                      <div
                        key={opt.label + opt.content}
                        className="flex min-w-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-[#334155] transition"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-200 text-[13px] font-semibold text-[#334155]"
                        >
                          {opt.label}
                        </span>
                        <span className="truncate leading-tight text-[13px]" title={opt.content}>
                          {opt.content}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[13px] font-normal text-[#64748B]">
                <span className="truncate max-w-[180px]">
                  {creatorName} • {formatDate(q.createdAt).slice(0, 10)}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDetail(q)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === q.id ? null : q.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuId === q.id && (
                      <div
                        className="absolute right-0 bottom-full z-20 mb-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                        onMouseLeave={() => setActiveMenuId(null)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onDetail(q);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Xem chi tiết</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onAction(q, 'edit');
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 text-blue-600"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onAction(q, 'delete');
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Xóa câu hỏi</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. Dạng Thu Gọn (Compact View Mode)
  if (viewMode === 'compact') {
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#0F172A] shadow-2xs">
        <table className="w-full text-left text-[15px] text-[#334155] dark:text-slate-300 border-collapse">
          <thead className="bg-slate-50 dark:bg-[#1E293B] text-[14px] font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="p-2 whitespace-nowrap">Mã</th>
              <th scope="col" className="p-2 min-w-[280px]">Nội dung câu hỏi</th>
              <th scope="col" className="p-2 whitespace-nowrap">Môn học</th>
              <th scope="col" className="p-2 whitespace-nowrap">Độ khó</th>
              <th scope="col" className="p-2 whitespace-nowrap">Trạng thái</th>
              <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-normal">
            {questions.map((q) => {
              const isChecked = selected.includes(q.id);
              const codeText = q.code || `QH${q.id.slice(-5).toUpperCase()}`;
              return (
                <tr key={q.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
                  <td className="p-2 pl-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(q.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap font-bold text-blue-600">
                    <button type="button" onClick={() => onDetail(q)} className="rounded px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100">
                      {codeText}
                    </button>
                  </td>
                  <td className="p-2 min-w-[280px]">
                    <p className="truncate font-semibold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onDetail(q)} title={q.content}>
                      {q.content}
                    </p>
                  </td>
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{q.subject?.subjectName || 'Chưa gán môn'}</td>
                  <td className="p-2 whitespace-nowrap"><QuestionDifficultyBadge difficulty={q.difficulty || 'MEDIUM'} /></td>
                  <td className="p-2 whitespace-nowrap"><QuestionStatusBadge status={q.status || 'APPROVED'} /></td>
                  <td className="p-2 pr-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => onDetail(q)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Dạng Danh Sách Chuẩn (List View Mode - Default)
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
          <thead className="bg-slate-50 text-[14px] font-semibold uppercase tracking-wider text-[#475569] border-b border-slate-200">
            <tr>
              <th scope="col" className="p-3.5 pl-4 text-center w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã câu hỏi</th>}
              {visibleColumns.content !== false && <th scope="col" className="p-3.5 min-w-[280px]">Nội dung & Các đáp án</th>}
              {visibleColumns.subject !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Môn học</th>}
              {visibleColumns.difficulty !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Độ khó</th>}
              {visibleColumns.type !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Loại</th>}
              <th scope="col" className="p-3.5 whitespace-nowrap">Điểm</th>
              {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
              {visibleColumns.creator !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Người tạo</th>}
              {visibleColumns.createdAt !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Ngày tạo</th>}
              <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {questions.map((q, index) => {
              const isChecked = selected.includes(q.id);
              const codeText = q.code || `QH${q.id.slice(-5).toUpperCase()}`;
              const subjectName = q.subject?.subjectName || 'Chưa gán môn';
              const creatorName = q.createdByName || (q.createdBy as any)?.teacher?.fullName || q.createdBy?.fullName || q.createdBy?.username || (q.createdById ? `User #${q.createdById}` : 'Hệ thống');
              const isLastRow = index >= Math.floor(questions.length / 2);

              // Options list (A, B, C, D)
              const optionsList = q.options && q.options.length > 0 ? q.options : [];

              return (
                <tr
                  key={q.id}
                  className={`transition hover:bg-slate-50/60 dark:hover:bg-slate-800/70 ${isChecked ? 'bg-blue-50/50 dark:bg-blue-950/50' : ''
                    }`}
                >
                  {/* Checkbox */}
                  <td className="p-3.5 pl-4 text-center align-top pt-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(q.id, e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Mã câu hỏi */}
                  {visibleColumns.code !== false && (
                    <td className="p-3.5 whitespace-nowrap align-top pt-4">
                      <button
                        type="button"
                        onClick={() => onDetail(q)}
                        className="font-mono text-[14px] font-bold text-[#0F172A] dark:text-slate-100 hover:text-[#2563EB] transition cursor-pointer"
                      >
                        {codeText}
                      </button>
                    </td>
                  )}

                  {/* Nội dung câu hỏi & Các đáp án */}
                  {visibleColumns.content !== false && (
                    <td className="p-3.5 min-w-[280px] align-top">
                      <div className="space-y-1.5">
                        {/* Câu hỏi */}
                        <p
                          className="text-[15px] font-medium text-[#0F172A] dark:text-slate-100 leading-snug cursor-pointer hover:text-[#2563EB] transition line-clamp-2"
                          onClick={() => onDetail(q)}
                          title={q.content}
                        >
                          {q.content}
                        </p>

                        {/* Đáp án + Media — gộp chung 1 hàng flex-wrap */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {q.type === 'ESSAY' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
                              <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                              {q.sampleAnswer || q.explanation ? 'Có hướng dẫn chấm' : 'Chưa có hướng dẫn chấm'}
                            </span>
                          ) : (
                            optionsList.map((opt) => (
                              <span
                                key={opt.label + opt.content}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700"
                              >
                                <span className="font-extrabold text-slate-500">{opt.label}.</span>
                                <span className="truncate max-w-[120px]">{opt.content}</span>
                              </span>
                            ))
                          )}

                          {/* Media thumbnails inline */}
                          {q.media && q.media.length > 0 && q.media.map((m, idx) => {
                            const mime = m.mimeType || '';
                            const isImg = mime.startsWith('image/') || (!mime && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(m.url));
                            const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(m.url);
                            const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(m.url);

                            if (isImg) return (
                              <button
                                key={m.id || idx}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLightboxUrl(m.url); }}
                                className="group relative h-9 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-50 hover:border-blue-400 hover:shadow-md transition cursor-zoom-in shrink-0"
                                title="Bấm để xem ảnh"
                              >
                                <img
                                  src={getImageUrl(m.url)}
                                  alt={m.altText || m.fileName || 'Ảnh'}
                                  className="h-full w-full object-cover transition group-hover:scale-110"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-3.5 w-3.5"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
                                </div>
                              </button>
                            );

                            if (isVid) return (
                              <button
                                key={m.id || idx}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setVideoLightbox({ url: m.url, fileName: m.fileName }); }}
                                className="group relative h-9 w-14 overflow-hidden rounded-md bg-slate-800 hover:bg-slate-700 transition cursor-pointer shrink-0"
                                title="Bấm để xem video"
                              >
                                {/* Dùng div thay video để tránh text fallback encoding lỗi */}
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-3.5 w-3.5 opacity-70"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3V9z" fill="white" stroke="none"/></svg>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-lg group-hover:scale-110 transition">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-blue-600 ml-0.5"><polygon points="5,3 19,12 5,21" /></svg>
                                  </span>
                                </div>
                              </button>
                            );

                            if (isAud) return (
                              <button
                                key={m.id || idx}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setAudioLightbox({ url: m.url, fileName: m.fileName }); }}
                                className="group inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10.5px] font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer shrink-0"
                                title="Bấm để phát âm thanh"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-blue-600 group-hover:scale-110 transition"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                                <span>Audio</span>
                              </button>
                            );

                            return (
                              <span key={m.id || idx} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 shrink-0">
                                <ImageIcon className="h-3 w-3 text-blue-400" />
                                {cleanMediaFileName(m.fileName, 'Tập tin')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Môn học */}
                  {visibleColumns.subject !== false && (
                    <td className="p-3.5 whitespace-nowrap text-[15px] font-normal text-[#334155] dark:text-slate-300 align-top pt-4">
                      {subjectName}
                    </td>
                  )}

                  {/* Độ khó */}
                  {visibleColumns.difficulty !== false && (
                    <td className="p-3.5 whitespace-nowrap align-top pt-4">
                      <QuestionDifficultyBadge difficulty={q.difficulty || 'MEDIUM'} />
                    </td>
                  )}

                  {/* Loại */}
                  {visibleColumns.type !== false && (
                    <td className="p-3.5 whitespace-nowrap align-top pt-4">
                      <QuestionTypeBadge type={q.type || 'SINGLE_CHOICE'} />
                    </td>
                  )}

                  {/* Điểm số */}
                  <td className="p-3.5 whitespace-nowrap align-top pt-4">
                    <span className="text-[15px] font-medium text-[#0F172A] dark:text-slate-100">
                      {q.score ?? (q.type === 'ESSAY' ? 1.0 : 0.25)}đ
                    </span>
                  </td>

                  {/* Trạng thái */}
                  {visibleColumns.status !== false && (
                    <td className="p-3.5 whitespace-nowrap align-top pt-4">
                      <QuestionStatusBadge status={q.status || 'APPROVED'} />
                    </td>
                  )}

                  {/* Người tạo */}
                  {visibleColumns.creator !== false && (
                    <td className="p-3.5 whitespace-nowrap align-top pt-4">
                      <div className="flex items-center gap-1.5 text-[15px] font-normal text-[#334155] dark:text-slate-300">
                        <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-700 text-[#475569] dark:text-slate-300 flex items-center justify-center font-semibold text-[13px] border border-slate-200 dark:border-slate-600">
                          {creatorName.charAt(0).toUpperCase()}
                        </div>
                        <span>{creatorName}</span>
                      </div>
                    </td>
                  )}

                  {/* Ngày tạo */}
                  {visibleColumns.createdAt !== false && (
                    <td className="p-3.5 whitespace-nowrap text-[14px] text-[#64748B] dark:text-slate-400 font-normal align-top pt-4">
                      {formatDate(q.createdAt)}
                    </td>
                  )}

                  {/* Thao tác */}
                  <td className="p-3.5 pr-4 text-right whitespace-nowrap relative align-top pt-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {/* Detail Eye button */}
                      <button
                        type="button"
                        onClick={() => onDetail(q)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <ActionDropdownPortal>
                        {(closeMenu) => (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onDetail(q);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155] cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-[#64748B]" />
                              <span>Xem chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onAction(q, 'edit');
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#334155] cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-[#2563EB]" />
                              <span>Chỉnh sửa</span>
                            </button>

                            {q.type === 'ESSAY' && (
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  setRubricQuestion(q);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#EFF6FF] text-[#2563EB] font-medium cursor-pointer"
                              >
                                <HelpCircle className="h-4 w-4 text-[#2563EB]" />
                                <span>Cấu hình Rubric</span>
                              </button>
                            )}

                            {isAdmin && (q.status === 'PENDING' || q.status === 'DRAFT') && (
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onAction(q, 'approve');
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#F0FDF4] text-[#16A34A] font-medium cursor-pointer"
                              >
                                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                                <span>Phê duyệt</span>
                              </button>
                            )}

                            {isAdmin && q.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onAction(q, 'reject');
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FFFBEB] text-[#D97706] font-medium cursor-pointer"
                              >
                                <XCircle className="h-4 w-4 text-[#D97706]" />
                                <span>Từ chối</span>
                              </button>
                            )}

                            {isAdmin && (
                              <>
                                <div className="my-1 border-t border-[#E2E8F0]" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(q, 'delete');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-[#FEF2F2] text-[#DC2626] cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 text-[#DC2626]" />
                                  <span>Xóa câu hỏi</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </ActionDropdownPortal>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RubricDialog
        isOpen={Boolean(rubricQuestion)}
        question={rubricQuestion}
        onClose={() => setRubricQuestion(null)}
      />
      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          altText="Hình ảnh câu hỏi"
          onClose={() => setLightboxUrl(null)}
        />
      )}
      <VideoLightboxModal
        videoUrl={videoLightbox?.url ?? null}
        fileName={videoLightbox?.fileName}
        onClose={() => setVideoLightbox(null)}
      />
      <AudioLightboxModal
        audioUrl={audioLightbox?.url ?? null}
        fileName={audioLightbox?.fileName}
        onClose={() => setAudioLightbox(null)}
      />
    </>
  );
}
