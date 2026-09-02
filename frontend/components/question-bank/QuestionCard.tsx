import React, { useState } from 'react';
import { Archive, Check, ChevronDown, ChevronUp, Copy, Eye, HelpCircle, ImageIcon, Maximize2, Pencil, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { Question } from '../../types';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { DynamicImage } from '../ui/DynamicImage';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { FillBlankInlineContent } from '../../lib/fill-blank-helper';

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const options = q.options || [];

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition space-y-3.5">
      {/* Lightbox Popup Modal for HD Image Viewing */}
      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          altText={`Hình minh họa câu hỏi mã ${q.code}`}
          onClose={() => setLightboxUrl(null)}
        />
      )}

      {/* Header Badges & Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <IdentifierBadge>{q.code}</IdentifierBadge>
          {q.subject?.subjectName && (
            <span className="rounded-full border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-type-helper font-medium text-primary-600 dark:text-primary-400 h-6 ui-pill inline-flex items-center">
              {q.subject.subjectName}
            </span>
          )}
          {q.chapter?.name && (
            <span className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-type-helper font-medium text-slate-700 dark:text-slate-300 h-6 ui-pill inline-flex items-center">
              {q.chapter.name}
            </span>
          )}
          <QuestionTypeBadge type={q.type} />
          <QuestionDifficultyBadge difficulty={q.difficulty} />
          <QuestionStatusBadge status={q.status} />
          <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 ml-1">{q.score || (q.type === 'ESSAY' ? 1.0 : 0.25)}đ</span>
        </div>

        {/* Action Buttons on Card */}
        <div className="flex items-center gap-1 shrink-0">
          {['DRAFT', 'REJECTED'].includes(q.status) && (
            <button
              title="Gửi duyệt"
              onClick={() => onAction('submit')}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition font-semibold"
            >
              <Send className="h-4 w-4" />
            </button>
          )}

          {isAdmin && q.status === 'PENDING' && (
            <>
              <button
                title="Phê duyệt câu hỏi"
                onClick={() => onAction('approve')}
                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                title="Từ chối câu hỏi"
                onClick={() => onAction('reject')}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}

          <button
            title="Xem chi tiết"
            onClick={onDetail}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <Eye className="h-4 w-4" />
          </button>

          {['DRAFT', 'REJECTED'].includes(q.status) && (
            <button
              title="Chỉnh sửa câu hỏi"
              onClick={() => onAction('edit')}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          <button
            title="Nhân bản câu hỏi"
            onClick={() => onAction('duplicate')}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <Copy className="h-4 w-4" />
          </button>

          {isAdmin && (
            <>
              {q.status === 'ARCHIVED' ? (
                <button
                  title="Khôi phục câu hỏi"
                  onClick={() => onAction('restore')}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button
                  title="Kho lưu trữ"
                  onClick={() => onAction('archive')}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}
              <button
                title="Xóa câu hỏi"
                onClick={() => onAction('delete')}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="space-y-3">
        <div
          className="text-type-body font-normal text-slate-900 dark:text-slate-100 leading-relaxed cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition"
          onClick={onDetail}
        >
          {q.contentRich && typeof q.contentRich === 'object' && 'html' in q.contentRich ? (
            <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(String((q.contentRich as { html?: string }).html || '')) }} />
          ) : (
            <FillBlankInlineContent content={q.content} fillBlankAnswers={q.fillBlankAnswers} showAnswers={false} />
          )}
        </div>

        {/* Media / Image / Video / Audio Attachments */}
        {q.media && q.media.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {q.media.map((mediaItem, idx) => {
              const fullUrl = getImageUrl(mediaItem.url);
              const mime: string = (mediaItem as any).mimeType || (mediaItem.url?.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : mediaItem.url?.match(/\.(mp3|wav|ogg)$/i) ? 'audio/mp3' : 'image/png');

              if (mime.startsWith('video/')) {
                return (
                  <div key={mediaItem.id || idx} className="w-full max-w-sm">
                    <QuestionMediaPlayer
                      src={fullUrl}
                      type="video"
                      maxPlays={0}
                      mode="REFERENCE"
                    />
                  </div>
                );
              }

              if (mime.startsWith('audio/')) {
                return (
                  <div key={mediaItem.id || idx} className="w-full max-w-sm">
                    <QuestionMediaPlayer
                      src={fullUrl}
                      type="audio"
                      maxPlays={0}
                      mode="REFERENCE"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={mediaItem.id || idx}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxUrl(mediaItem.url);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      setLightboxUrl(mediaItem.url);
                    }
                  }}
                  className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                  title="Bấm vào để xem ảnh phóng to"
                >
                  <div className="relative flex items-center justify-center">
                    <DynamicImage
                      src={fullUrl}
                      alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                      className="h-20 w-32 rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-1 right-1 flex items-center justify-center p-1 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Bấm vào để xem ảnh phóng to">
                      <Maximize2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fill Blank Answers in Card */}
      {q.type === 'FILL_BLANK' && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-type-helper font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              Đáp án điền khuyết ({(q.fillBlankAnswers || []).length || 1} ô trống)
            </span>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-type-helper font-medium text-primary-600 dark:text-primary-400 hover:text-blue-700 flex items-center gap-1 transition"
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
              {(q.fillBlankAnswers && q.fillBlankAnswers.length > 0 ? q.fillBlankAnswers : [{ blankIndex: 1, answer: 'Chưa thiết lập' }]).map((ans: any, idx: number) => {
                const bIdx = ans.blankIndex || idx + 1;
                const mainAns = ans.answer || ans.value || ans.content || '—';
                return (
                  <div
                    key={ans.id || idx}
                    className="flex items-center justify-between rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 text-type-body-sm font-normal text-slate-700 dark:text-slate-300 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="flex h-5 px-1.5 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-type-helper font-semibold text-white">
                        Ô #{bIdx}
                      </span>
                      <span className="truncate font-semibold text-emerald-800 dark:text-emerald-300">{mainAns}</span>
                    </div>
                    {ans.score !== undefined && (
                      <span className="text-type-helper font-medium text-slate-500 shrink-0">{ans.score}đ</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Options List directly in Card */}
      {options.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-type-helper font-semibold tracking-wider text-slate-500 dark:text-slate-400">
              Lựa chọn ({options.length} phương án)
            </span>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-type-helper font-medium text-primary-600 dark:text-primary-400 hover:text-blue-700 flex items-center gap-1 transition"
            >
              {showOptions ? (
                <>Thu gọn <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Hiện lựa chọn <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          {showOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {options.map((opt, idx) => {
                const label = opt.label || String.fromCharCode(65 + idx);
                return (
                  <div
                    key={opt.id || idx}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-type-body font-normal transition ${
                      opt.isCorrect
                        ? 'border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1.5 text-type-helper font-semibold ${
                          opt.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {label}
                      </span>
                      <span className={`truncate leading-tight ${opt.isCorrect ? 'font-semibold text-emerald-800 dark:text-emerald-300' : ''}`}>
                        {opt.content}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Explanation if present */}
      {q.explanation && showOptions && (
        <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 p-3 text-type-body-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">Giải thích: </strong>
            <span>{q.explanation}</span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-type-body-sm text-slate-500 dark:text-slate-400 font-normal">
        <span>
          Người tạo: <strong className="text-slate-900 dark:text-slate-100 font-medium">{q.createdBy?.username || '—'}</strong>
        </span>
        <span>
          {q.statistic?.usedCount ? `Đã dùng ${q.statistic.usedCount} lần` : 'Chưa sử dụng'}
        </span>
      </div>
    </article>
  );
}
