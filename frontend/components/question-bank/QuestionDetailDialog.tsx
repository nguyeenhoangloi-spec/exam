'use client';

import React, { useState } from 'react';
import { Question } from '../../types';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { VideoLightboxModal } from '../VideoLightboxModal';
import { Maximize2, X, CheckCircle2, FileText, User, Calendar, BookOpen, Layers, HelpCircle, Hash, Award, Brain } from 'lucide-react';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';
import { Button } from '../ui/Button';

export function QuestionDetailDialog({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [videoLightbox, setVideoLightbox] = useState<{ url: string; fileName?: string } | null>(null);

  if (!question) return null;

  const rich = question?.contentRich && typeof question.contentRich === 'object' && 'html' in question.contentRich ? String((question.contentRich as { html?: string }).html || '') : '';
  const codeText = question.code || `QH${question.id.slice(-5).toUpperCase()}`;

  const creatorName =
    question.createdByName ||
    (question.createdBy as any)?.teacher?.fullName ||
    question.createdBy?.fullName ||
    question.createdBy?.username ||
    (question.createdById ? `User #${question.createdById}` : 'Hệ thống');

  const getBloomLabel = (level?: string) => {
    if (level === 'REMEMBER') return 'Ghi nhớ';
    if (level === 'UNDERSTAND') return 'Thông hiểu';
    if (level === 'APPLY') return 'Vận dụng';
    if (level === 'ANALYZE') return 'Phân tích';
    return 'Thông hiểu';
  };

  const scoreText = question.score !== undefined && question.score !== null ? `${question.score} điểm` : '1.0 điểm';
  const topicText = (question as any).topic || (question as any).chapter?.chapterName || 'Chưa phân loại';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Right Drawer Modal */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[580px] flex-col bg-white shadow-2xl transition-transform duration-300 border-l border-slate-200">
        {lightboxUrl && (
          <ImageLightboxModal
            imageUrl={lightboxUrl}
            altText={`Hình minh họa câu hỏi mã ${question?.code}`}
            onClose={() => setLightboxUrl(null)}
          />
        )}
        <VideoLightboxModal
          videoUrl={videoLightbox?.url ?? null}
          fileName={videoLightbox?.fileName}
          onClose={() => setVideoLightbox(null)}
        />

        {/* Drawer Header - Solid Flat Color matching All Drawers */}
        <div className="border-b border-slate-200 bg-white p-5 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[15px] font-semibold text-[#0F172A]">
              {codeText}
            </span>
            <QuestionStatusBadge status={question.status || 'APPROVED'} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question Content */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Nội dung câu hỏi</h4>
            <div className="text-[15px] font-medium text-[#0F172A] leading-relaxed bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              {rich ? <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(rich) }} /> : question.content}
            </div>
          </div>

          {/* Media Attachments */}
          {question.media?.length ? (
            <div className="space-y-2">
              <h4 className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Media đính kèm</h4>
              <div className="flex flex-wrap gap-3">
                {question.media.map((media) => {
                  const fullUrl = getImageUrl(media.url);
                  const mime: string = (media as any).mimeType || '';
                  const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(media.url);
                  const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(media.url);

                  if (isVid) {
                    return (
                      <button
                        key={media.id || media.url}
                        type="button"
                        onClick={() => setVideoLightbox({ url: media.url, fileName: media.fileName })}
                        className="group relative h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-2xs hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                      >
                        <video src={fullUrl} className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#2563EB] ml-0.5"><polygon points="5,3 19,12 5,21" /></svg>
                          </span>
                        </div>
                      </button>
                    );
                  }
                  if (isAud) {
                    return (
                      <div key={media.id || media.url} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-[13px] font-medium text-[#64748B] max-w-[180px] truncate">{(media as any).fileName || 'Audio'}</span>
                        <audio src={fullUrl} controls className="h-8 w-44" />
                      </div>
                    );
                  }
                  // Default: image
                  return (
                    <div
                      key={media.id || media.url}
                      onClick={() => setLightboxUrl(media.url)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 transition hover:border-blue-400 hover:shadow-md"
                      title="Bấm để xem phóng to"
                    >
                      <img
                        src={fullUrl}
                        alt={media.altText || media.fileName}
                        className="max-h-48 max-w-full rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-[13px] font-medium text-white shadow-lg backdrop-blur-xs">
                          <Maximize2 className="h-4 w-4 text-blue-400" /> Phóng to
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Options & Correct Answer */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Danh sách đáp án</h4>
            <div className="space-y-2">
              {question.options?.map((o) => (
                <div
                  key={o.id || o.order}
                  className={`rounded-xl border p-3.5 transition flex items-start gap-3 ${o.isCorrect
                    ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 font-medium'
                    : 'border-slate-200 bg-slate-50 text-[#334155]'
                    }`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${o.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-[#0F172A]'
                    }`}>
                    {o.label}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 text-[15px] font-normal leading-normal">
                    <p>{o.content}</p>
                    {o.isCorrect && (
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700 mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đáp án chính xác
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-4 text-[14px] text-[#334155]">
              <h5 className="font-semibold text-[#0F172A] mb-1">Giải thích đáp án:</h5>
              <p className="font-normal leading-relaxed">{question.explanation}</p>
            </div>
          )}

          {/* Metadata Cards */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Thông tin chi tiết</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[14px]">
              {/* Mã câu hỏi */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-[#2563EB]" /> Mã câu hỏi
                </span>
                <p className="font-mono font-bold text-[#0F172A]">{codeText}</p>
              </div>

              {/* Môn học */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-[#2563EB]" /> Môn học
                </span>
                <p className="font-semibold text-[#0F172A] truncate" title={question.subject?.subjectName}>
                  {question.subject?.subjectName || 'Chưa gán'}
                </p>
              </div>

              {/* Điểm số */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-[#2563EB]" /> Điểm số
                </span>
                <p className="font-semibold text-[#2563EB]">{scoreText}</p>
              </div>

              {/* Độ khó */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-[#2563EB]" /> Độ khó
                </span>
                <div className="pt-0.5">
                  <QuestionDifficultyBadge difficulty={question.difficulty || 'MEDIUM'} />
                </div>
              </div>

              {/* Loại câu hỏi */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-[#2563EB]" /> Loại câu hỏi
                </span>
                <div className="pt-0.5">
                  <QuestionTypeBadge type={question.type || 'SINGLE_CHOICE'} />
                </div>
              </div>

              {/* Mức độ tư duy */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5 text-[#2563EB]" /> Mức độ tư duy
                </span>
                <p className="font-semibold text-[#0F172A]">{getBloomLabel(question.bloomLevel)}</p>
              </div>

              {/* Chủ đề */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-[#2563EB]" /> Chủ đề
                </span>
                <p className="font-medium text-[#334155] truncate">{topicText}</p>
              </div>

              {/* Người tạo */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#2563EB]" /> Người tạo
                </span>
                <p className="font-semibold text-[#0F172A] truncate" title={creatorName}>{creatorName}</p>
              </div>

              {/* Ngày tạo */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[13px] font-medium text-[#64748B] flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#2563EB]" /> Ngày tạo
                </span>
                <p className="font-medium text-[#0F172A]">{question.createdAt ? new Date(question.createdAt).toLocaleDateString('vi-VN') : '24/05/2024'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </>
  );
}
