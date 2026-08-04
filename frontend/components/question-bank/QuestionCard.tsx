import { Archive, Check, Copy, Eye, Pencil, RotateCcw, Send, Trash2, X } from 'lucide-react';
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
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <b className="text-sky-700">{q.code}</b>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {q.subject?.subjectName}
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {q.chapter?.name}
          </span>
          <QuestionTypeBadge type={q.type} />
          <QuestionDifficultyBadge difficulty={q.difficulty} />
          <QuestionStatusBadge status={q.status} />
        </div>

        {/* Action Buttons on Card */}
        <div className="flex items-center gap-1">
          {/* Submit button for DRAFT questions */}
          {['DRAFT', 'REJECTED'].includes(q.status) && (
            <button
              title="Gửi duyệt"
              onClick={() => onAction('submit')}
              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition font-semibold"
            >
              <Send className="h-4 w-4" />
            </button>
          )}

          {/* Approve & Reject buttons for ADMIN only */}
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

          {/* Restore / Archive / Delete buttons for ADMIN only */}
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

      <button onClick={onDetail} className="mt-3.5 text-left font-semibold text-slate-800 hover:text-sky-700 block transition">
        {q.content}
      </button>

      <p className="mt-3 text-xs text-slate-500 font-medium">
        Người tạo: <strong className="text-slate-700">{q.createdBy?.username || '—'}</strong> ·{' '}
        {q.statistic?.usedCount ? `Đã dùng ${q.statistic.usedCount} lần` : 'Chưa sử dụng'}
      </p>
    </article>
  );
}
