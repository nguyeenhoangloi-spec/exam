import React, { useState } from 'react';
import { Archive, Check, ChevronDown, ChevronUp, Copy, Eye, HelpCircle, ImageIcon, Maximize2, Pencil, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { Question } from '../../types';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { DynamicImage } from '../ui/DynamicImage';

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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition space-y-3.5">
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
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <b className="text-[#2563EB] font-mono tabular-nums text-[14px] font-semibold">{q.code}</b>
          {q.subject?.subjectName && (
            <span className="rounded-[8px] bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[13px] font-medium text-[#2563EB] h-6 inline-flex items-center">
              {q.subject.subjectName}
            </span>
          )}
          {q.chapter?.name && (
            <span className="rounded-[8px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[13px] font-medium text-[#334155] h-6 inline-flex items-center">
              {q.chapter.name}
            </span>
          )}
          <QuestionTypeBadge type={q.type} />
          <QuestionDifficultyBadge difficulty={q.difficulty} />
          <QuestionStatusBadge status={q.status} />
          <span className="text-[14px] font-semibold text-[#0F172A] ml-1">{q.score || (q.type === 'ESSAY' ? 1.0 : 0.25)}đ</span>
        </div>

        {/* Action Buttons on Card */}
        <div className="flex items-center gap-1 shrink-0">
          {['DRAFT', 'REJECTED'].includes(q.status) && (
            <button
              title="Gửi duyệt"
              onClick={() => onAction('submit')}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold"
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
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
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
                  title="Kho lưu trữ"
                  onClick={() => onAction('archive')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
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
      <div className="space-y-3">
        <div
          className="text-[15px] font-medium text-[#0F172A] leading-relaxed cursor-pointer hover:text-[#2563EB] transition"
          onClick={onDetail}
        >
          {q.contentRich && typeof q.contentRich === 'object' && 'html' in q.contentRich ? (
            <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(String((q.contentRich as { html?: string }).html || '')) }} />
          ) : (
            q.content
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
                  <div key={mediaItem.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-black shadow-2xs">
                    <video src={fullUrl} controls className="h-24 w-44 object-cover rounded-xl" />
                  </div>
                );
              }

              if (mime.startsWith('audio/')) {
                return (
                  <div key={mediaItem.id || idx} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-2xs">
                    <span className="text-[13px] font-medium text-[#64748B] max-w-[140px] truncate">
                      {mediaItem.fileName || `Audio ${idx + 1}`}
                    </span>
                    <audio src={fullUrl} controls className="h-8 w-44" />
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
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 transition hover:border-blue-400 hover:shadow-md"
                  title="Bấm vào để xem ảnh phóng to"
                >
                  <div className="relative flex items-center justify-center">
                    <DynamicImage
                      src={fullUrl}
                      alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                      className="h-20 w-32 rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[13px] font-medium text-white shadow-lg backdrop-blur-xs">
                        <Maximize2 className="h-3.5 w-3.5 text-blue-400" /> Xem rõ ảnh
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[13px] font-normal text-[#64748B]">
                    <ImageIcon className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span className="truncate max-w-[110px]">{mediaItem.fileName || `Hình ${idx + 1}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Options List directly in Card */}
      {options.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#64748B]">
              Lựa chọn ({options.length} phương án)
            </span>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-[13px] font-medium text-[#2563EB] hover:text-blue-700 flex items-center gap-1 transition"
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
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-[15px] font-normal text-[#334155] transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200 px-1.5 text-[13px] font-semibold text-[#0F172A]"
                      >
                        {label}
                      </span>
                      <span className="truncate leading-tight">{opt.content}</span>
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
        <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3 text-[14px] text-[#334155] flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-[#0F172A]">Giải thích: </strong>
            <span>{q.explanation}</span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[14px] text-[#64748B] font-normal">
        <span>
          Người tạo: <strong className="text-[#0F172A] font-medium">{q.createdBy?.username || '—'}</strong>
        </span>
        <span>
          {q.statistic?.usedCount ? `Đã dùng ${q.statistic.usedCount} lần` : 'Chưa sử dụng'}
        </span>
      </div>
    </article>
  );
}
