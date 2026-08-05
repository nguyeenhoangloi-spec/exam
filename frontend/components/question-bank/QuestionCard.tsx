import React, { useState } from 'react';
import { Archive, Check, CheckCircle2, ChevronDown, ChevronUp, Copy, Eye, HelpCircle, Pencil, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { Question } from '../../types';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';

export function QuestionCard({
  question: q,
  selected,
  onSelect,
  onDetail,
  onAction,
  isAdmin,
}: {
  question: Question;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onDetail: () => void;
  onAction: (action: string) => void;
  isAdmin: boolean;
}) {
  const [showOptions, setShowOptions] = useState(true);
  const options = q.options || [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition space-y-3.5">
      {/* Header Badges & Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <b className="text-[#1e66f5] font-mono text-sm">{q.code}</b>
          {q.subject?.subjectName && (
            <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-extrabold text-sky-800">
              {q.subject.subjectName}
            </span>
          )}
          {q.chapter?.name && (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {q.chapter.name}
            </span>
          )}
          <QuestionTypeBadge type={q.type} />
          <QuestionDifficultyBadge difficulty={q.difficulty} />
          <QuestionStatusBadge status={q.status} />
        </div>

        {/* Action Buttons on Card */}
        <div className="flex items-center gap-1 shrink-0">
          {['DRAFT', 'REJECTED'].includes(q.status) && (
            <button
              title="Gửi duyệt"
              onClick={() => onAction('submit')}
              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition font-semibold"
            >
              <Send className="h-4 w-4" />
            </button>
          )}

          {isAdmin && q.status === 'PENDING' && (
            <>
              <button
                title="Phê duyệt câu hỏi"
                onClick={() => onAction('approve')}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                title="Từ chối câu hỏi"
                onClick={() => onAction('reject')}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}

          <button
            title="Xem chi tiết"
            onClick={onDetail}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Eye className="h-4 w-4" />
          </button>

          {['DRAFT', 'REJECTED'].includes(q.status) && (
            <button
              title="Chỉnh sửa câu hỏi"
              onClick={() => onAction('edit')}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          <button
            title="Nhân bản câu hỏi"
            onClick={() => onAction('duplicate')}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Copy className="h-4 w-4" />
          </button>

          {isAdmin && (
            <>
              {q.status === 'ARCHIVED' ? (
                <button
                  title="Khôi phục câu hỏi"
                  onClick={() => onAction('restore')}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button
                  title="Lưu trữ câu hỏi"
                  onClick={() => onAction('archive')}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}
              <button
                title="Xóa câu hỏi"
                onClick={() => onAction('delete')}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="text-sm font-bold text-slate-900 leading-relaxed cursor-pointer hover:text-[#1e66f5] transition" onClick={onDetail}>
        {q.contentRich && typeof q.contentRich === 'object' && 'html' in q.contentRich ? <div dangerouslySetInnerHTML={{ __html: String((q.contentRich as { html?: string }).html || '') }} /> : q.content}
        {q.media?.length ? <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-sky-700"><img src={q.media[0].url} alt={q.media[0].altText || ''} className="h-12 w-16 rounded-lg border object-cover" /> Có hình ảnh</div> : null}
      </div>

      {/* Options List directly in Card */}
      {options.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Đáp án ({options.length} lựa chọn)
            </span>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
            >
              {showOptions ? (
                <>Thu gọn <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Hiện đáp án <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          {showOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {options.map((opt, idx) => {
                const label = opt.label || String.fromCharCode(65 + idx);
                const isCorrect = opt.isCorrect;
                return (
                  <div
                    key={opt.id || idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                      isCorrect
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className={`h-6 min-w-6 px-1.5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="truncate leading-tight">{opt.content}</span>
                    </div>

                    {isCorrect && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đúng
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Explanation if present */}
      {q.explanation && showOptions && (
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-950">Giải thích: </strong>
            <span>{q.explanation}</span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Người tạo: <strong className="text-slate-700 font-bold">{q.createdBy?.username || '—'}</strong>
        </span>
        <span>
          {q.statistic?.usedCount ? `Đã dùng ${q.statistic.usedCount} lần` : 'Chưa sử dụng'}
        </span>
      </div>
    </article>
  );
}
