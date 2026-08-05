'use client';

import React, { useState } from 'react';
import { Question } from '../../types';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { Maximize2, X, CheckCircle2, FileText, User, Calendar, BookOpen, Layers, HelpCircle } from 'lucide-react';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';

export function QuestionDetailDialog({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  if (!question) return null;

  const rich = question?.contentRich && typeof question.contentRich === 'object' && 'html' in question.contentRich ? String((question.contentRich as { html?: string }).html || '') : '';
  const codeText = question.code || `QH${question.id.slice(-5).toUpperCase()}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Right Drawer Modal */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col bg-white shadow-2xl transition-transform duration-300 border-l border-slate-200">
        {lightboxUrl && (
          <ImageLightboxModal
            imageUrl={lightboxUrl}
            altText={`Hình minh họa câu hỏi mã ${question?.code}`}
            onClose={() => setLightboxUrl(null)}
          />
        )}

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200/90 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-600 border border-blue-200">
              {codeText}
            </span>
            <QuestionStatusBadge status={question.status || 'APPROVED'} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question Content */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Nội dung câu hỏi</h4>
            <div className="text-sm font-bold text-slate-900 leading-relaxed bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              {rich ? <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(rich) }} /> : question.content}
            </div>
          </div>

          {/* Media Attachments */}
          {question.media?.length ? (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Hình ảnh đính kèm</h4>
              <div className="flex flex-wrap gap-3">
                {question.media.map((media) => {
                  const fullUrl = getImageUrl(media.url);
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
                        <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs">
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
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Danh sách đáp án</h4>
            <div className="space-y-2">
              {question.options?.map((o) => (
                <div
                  key={o.id || o.order}
                  className={`rounded-xl border p-3.5 transition flex items-start gap-3 ${
                    o.isCorrect
                      ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                    o.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {o.label}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 text-xs leading-normal">
                    <p>{o.content}</p>
                    {o.isCorrect && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 mt-1">
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
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-900">
              <h5 className="font-extrabold text-amber-950 mb-1">Giải thích đáp án:</h5>
              <p className="font-medium leading-relaxed">{question.explanation}</p>
            </div>
          )}

          {/* Metadata Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Thông tin chi tiết</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-blue-500" /> Môn học
                </span>
                <p className="font-extrabold text-slate-800">{question.subject?.subjectName || 'Chưa gán'}</p>
              </div>



              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-500" /> Độ khó
                </span>
                <div className="pt-0.5">
                  <QuestionDifficultyBadge difficulty={question.difficulty || 'MEDIUM'} />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Loại câu hỏi
                </span>
                <div className="pt-0.5">
                  <QuestionTypeBadge type={question.type || 'SINGLE_CHOICE'} />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-blue-500" /> Người tạo
                </span>
                <p className="font-extrabold text-slate-800">{question.createdByName || question.createdBy?.fullName || 'Nguyễn Văn A'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" /> Ngày tạo
                </span>
                <p className="font-extrabold text-slate-800">{question.createdAt ? new Date(question.createdAt).toLocaleDateString('vi-VN') : '24/05/2024'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}
