'use client';

import React, { useState } from 'react';
import { Eye, MoreVertical, Edit, CheckCircle2, XCircle, Trash2, Check } from 'lucide-react';
import { Question } from '../../types';
import {
  QuestionDifficultyBadge,
  QuestionStatusBadge,
  QuestionTypeBadge,
} from './QuestionBadges';

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
  const allSelected = questions.length > 0 && selected.length === questions.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '24/05/2026 15:57';
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
          const subjectName = q.subject?.subjectName || 'An toàn thông tin';
          const creatorName = q.createdByName || q.createdBy?.fullName || 'Nguyễn Văn A';

          const optionsList = q.options && q.options.length > 0 ? q.options : [
            { label: 'A', content: 'Phương án A', isCorrect: true },
            { label: 'B', content: 'Phương án B', isCorrect: false },
            { label: 'C', content: 'Phương án C', isCorrect: false },
            { label: 'D', content: 'Phương án D', isCorrect: false },
          ];

          return (
            <div
              key={q.id}
              className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${
                isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
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
                  className="text-xs font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition line-clamp-2 min-h-[34px]"
                  onClick={() => onDetail(q)}
                  title={q.content}
                >
                  {q.content}
                </p>

                {/* Options 2-Column Balanced Compact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {optionsList.map((opt) => (
                    <div
                      key={opt.label + opt.content}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition min-w-0 ${
                        opt.isCorrect
                          ? 'bg-emerald-100/90 text-emerald-950 border border-emerald-300 shadow-2xs font-extrabold'
                          : 'bg-slate-50 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <span
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${
                          opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="truncate leading-tight" title={opt.content}>
                        {opt.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[10.5px] font-semibold text-slate-500">
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
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th scope="col" className="p-2 pl-3 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
          <tbody className="divide-y divide-slate-100 font-medium">
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
                  <td className="p-2 whitespace-nowrap font-semibold text-slate-700">{q.subject?.subjectName || 'Toán cao cấp'}</td>
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="w-full text-left text-xs text-slate-700 border-collapse">
        <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
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
            {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái</th>}
            {visibleColumns.creator !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Người tạo</th>}
            {visibleColumns.createdAt !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Ngày tạo</th>}
            <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {questions.map((q) => {
            const isChecked = selected.includes(q.id);
            const codeText = q.code || `QH${q.id.slice(-5).toUpperCase()}`;
            const subjectName = q.subject?.subjectName || 'An toàn thông tin';
            const creatorName = q.createdByName || q.createdBy?.fullName || 'Nguyễn Văn A';

            // Options list (A, B, C, D)
            const optionsList = q.options && q.options.length > 0 ? q.options : [
              { label: 'A', content: 'Phương án A', isCorrect: true },
              { label: 'B', content: 'Phương án B', isCorrect: false },
              { label: 'C', content: 'Phương án C', isCorrect: false },
              { label: 'D', content: 'Phương án D', isCorrect: false },
            ];

            return (
              <tr
                key={q.id}
                className={`transition hover:bg-blue-50/40 ${
                  isChecked ? 'bg-blue-50/60' : ''
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
                  <td className="p-3.5 whitespace-nowrap font-bold text-blue-600 align-top pt-4">
                    <button
                      type="button"
                      onClick={() => onDetail(q)}
                      className="rounded-md bg-blue-50 px-2 py-0.5 hover:bg-blue-100 transition cursor-pointer"
                    >
                      {codeText}
                    </button>
                  </td>
                )}

                {/* Nội dung câu hỏi & Các đáp án */}
                {visibleColumns.content !== false && (
                  <td className="p-3.5 min-w-[280px] align-top">
                    <div className="space-y-2">
                      <p
                        className="text-xs font-bold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
                        onClick={() => onDetail(q)}
                        title={q.content}
                      >
                        {q.content}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {optionsList.map((opt) => (
                          <span
                            key={opt.label + opt.content}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              opt.isCorrect
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {opt.isCorrect && <Check className="h-3 w-3 text-emerald-600 shrink-0" />}
                            <span className="font-extrabold">{opt.label}.</span>
                            <span className="truncate max-w-[160px]">{opt.content}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                )}

                {/* Môn học */}
                {visibleColumns.subject !== false && (
                  <td className="p-3.5 whitespace-nowrap font-semibold text-slate-700 align-top pt-4">
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

                {/* Trạng thái */}
                {visibleColumns.status !== false && (
                  <td className="p-3.5 whitespace-nowrap align-top pt-4">
                    <QuestionStatusBadge status={q.status || 'APPROVED'} />
                  </td>
                )}

                {/* Người tạo */}
                {visibleColumns.creator !== false && (
                  <td className="p-3.5 whitespace-nowrap text-slate-700 font-semibold align-top pt-4">
                    {creatorName}
                  </td>
                )}

                {/* Ngày tạo */}
                {visibleColumns.createdAt !== false && (
                  <td className="p-3.5 whitespace-nowrap text-[11px] text-slate-500 font-semibold align-top pt-4">
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
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* 3 Dots Menu button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === q.id ? null : q.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === q.id && (
                        <div
                          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-bold text-slate-700 space-y-0.5 text-left"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDetail(q);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
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
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            <Edit className="h-3.5 w-3.5 text-blue-600" />
                            <span>Chỉnh sửa</span>
                          </button>

                          {isAdmin && (q.status === 'PENDING' || q.status === 'DRAFT') && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onAction(q, 'approve');
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-emerald-50 text-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Phê duyệt</span>
                            </button>
                          )}

                          {isAdmin && q.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onAction(q, 'reject');
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-700"
                            >
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                              <span>Từ chối</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onAction(q, 'delete');
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-rose-50 text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa câu hỏi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
