import React, { useState } from 'react';
import { Question } from '../../types';
import { Modal } from '../Modal';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { Maximize2 } from 'lucide-react';

export function QuestionDetailDialog({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const rich = question?.contentRich && typeof question.contentRich === 'object' && 'html' in question.contentRich ? String((question.contentRich as { html?: string }).html || '') : '';

  return (
    <Modal isOpen={Boolean(question)} onClose={onClose} title={question?.code || 'Chi tiết câu hỏi'}>
      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          altText={`Hình minh họa câu hỏi mã ${question?.code}`}
          onClose={() => setLightboxUrl(null)}
        />
      )}

      {question && (
        <div className="space-y-5">
          <div>
            <div className="font-bold text-base leading-relaxed text-slate-900">
              {rich ? <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(rich) }} /> : question.content}
            </div>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {question.subject?.subjectName} · {question.chapter?.name}
            </p>
          </div>

          {/* Question Media */}
          {question.media?.length ? (
            <div className="flex flex-wrap gap-3">
              {question.media.map((media) => {
                const fullUrl = getImageUrl(media.url);
                return (
                  <div
                    key={media.id || media.url}
                    onClick={() => setLightboxUrl(media.url)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 transition hover:border-sky-400 hover:shadow-md"
                    title="Bấm để xem phóng to"
                  >
                    <img
                      src={fullUrl}
                      alt={media.altText || media.fileName}
                      className="max-h-64 max-w-full rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs">
                        <Maximize2 className="h-4 w-4 text-sky-400" /> Phóng to ảnh
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Options */}
          <div className="space-y-2">
            {question.options?.map((o) => (
              <div
                key={o.id || o.order}
                className={`rounded-xl border p-3.5 transition ${
                  o.isCorrect ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <div>
                  <b className="text-sky-700 font-bold">{o.label}.</b> {o.content}
                </div>
                {o.media?.length ? (
                  <div className="mt-2.5 flex gap-2">
                    {o.media.map((media) => {
                      const fullUrl = getImageUrl(media.url);
                      return (
                        <img
                          key={media.id || media.url}
                          src={fullUrl}
                          alt={media.altText || media.fileName}
                          onClick={() => setLightboxUrl(media.url)}
                          className="h-20 rounded-lg border object-contain bg-white cursor-pointer hover:border-sky-400 transition"
                          title="Bấm để phóng to"
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <b className="font-extrabold text-amber-950">Giải thích: </b> {question.explanation}
            </div>
          )}

          {/* Stats */}
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
            <b>Thống kê: </b>
            {question.statistic?.usedCount
              ? `${question.statistic.usedCount} lần sử dụng; tỷ lệ đúng ${
                  question.statistic.correctRate == null ? 'chưa có' : `${Math.round(question.statistic.correctRate * 100)}%`
                }`
              : 'Chưa sử dụng'}
          </div>
        </div>
      )}
    </Modal>
  );
}
