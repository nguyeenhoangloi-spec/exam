'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Question } from '../../types';
import { fixHtmlImageUrls, getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { VideoLightboxModal } from '../VideoLightboxModal';
import { Maximize2, X, CheckCircle2, FileText, User, Calendar, BookOpen, Layers, HelpCircle, Hash, Award, Brain } from 'lucide-react';
import { QuestionDifficultyBadge, QuestionStatusBadge, QuestionTypeBadge } from './QuestionBadges';
import { Button } from '../ui/Button';
import { DynamicImage } from '../ui/DynamicImage';

export function QuestionDetailDialog({ question, onClose }: { question: Question | null; onClose: () => void }) {
 const [mounted, setMounted] = useState(false);
 const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
 const [videoLightbox, setVideoLightbox] = useState<{ url: string; fileName?: string } | null>(null);

 useEffect(() => {
 setMounted(true);
 }, []);

 if (!question || !mounted) return null;

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

 const content = (
 <div role="dialog" aria-modal="true" aria-label="Chi tiết câu hỏi" className="fixed inset-0 z-[100] overflow-hidden">
 {/* Dark Blur Overlay Backdrop */}
 <div
 className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
 onClick={onClose}
 />

 {/* Lightbox Modals */}
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

 {/* Right Drawer Container */}
  <div className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[620px] flex-col bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 border-l border-slate-200 dark:border-slate-700 animate-slide-left">
 {/* ── 1. Modern Gradient Header (Matching ProfileDrawer & RegradeReviewDrawer) ── */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-5 text-white shrink-0 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md font-semibold text-white border border-white/25 shadow-2xs">
 <HelpCircle className="h-6 w-6 text-white" />
 </div>

 <div className="min-w-0 flex-1 pr-2">
 <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-[18px] font-semibold leading-snug text-white line-clamp-2 break-words">
 Chi tiết Câu hỏi
 </h2>
 <span className="tabular-nums text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-lg backdrop-blur-md border border-white/25">
 {codeText}
 </span>
 </div>
 <p className="text-[13px] font-medium text-blue-100/90 mt-1.5 line-clamp-2">
 Môn học: <strong className="font-semibold text-white">{question.subject?.subjectName || 'Chưa phân loại'}</strong>
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
 title="Đóng"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* ── 2. Scrollable Content Body ── */}
  <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
 {/* Card 1: Trạng thái & Nội dung câu hỏi */}
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
 <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
 <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-500">Nội dung câu hỏi</h3>
 <QuestionStatusBadge status={question.status || 'APPROVED'} />
 </div>

 <div className="text-[15px] font-medium text-slate-900 leading-relaxed bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
 {rich ? <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(rich) }} /> : question.content}
 </div>
 </div>

 {/* Card 2: Media Attachments (if available) */}
 {question.media?.length ? (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
 <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-500">Media đính kèm</h3>
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
 <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-primary-600 ml-0.5"><polygon points="5,3 19,12 5,21" /></svg>
 </span>
 </div>
 </button>
 );
 }
 if (isAud) {
 return (
 <div key={media.id || media.url} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
 <span className="text-xs font-medium text-slate-600 max-w-[180px] truncate">{(media as any).fileName || 'Audio'}</span>
 <audio src={fullUrl} controls className="h-8 w-44" />
 </div>
 );
 }
 return (
 <div
 key={media.id || media.url}
 role="button"
 tabIndex={0}
 onClick={() => setLightboxUrl(media.url)}
 onKeyDown={(event) => {
 if (event.key === 'Enter' || event.key === ' ') {
 event.preventDefault();
 setLightboxUrl(media.url);
 }
 }}
 className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 transition hover:border-blue-400 hover:shadow-md"
 title="Bấm để xem phóng to"
 >
 <DynamicImage
 src={fullUrl}
 alt={media.altText || media.fileName}
 className="max-h-48 max-w-full rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
 />
 <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100">
 <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-xs">
 <Maximize2 className="h-4 w-4 text-blue-400" /> Phóng to
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ) : null}

 {/* Card 3: Options & Correct Answer / Explanation */}
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-2xs">
 <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-500">Danh sách đáp án</h3>
 {question.options && question.options.length > 0 ? (
 <div className="space-y-2.5">
 {question.options.map((o) => (
 <div
 key={o.id || o.order}
 className={`rounded-xl border p-3.5 transition flex items-start gap-3 ${o.isCorrect
 ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 font-medium'
 : 'border-slate-200 bg-slate-50/80 text-slate-800'
 }`}
 >
 <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${o.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-900'
 }`}>
 {o.label}
 </div>
 <div className="flex-1 min-w-0 pt-0.5 text-xs font-normal leading-normal">
 <p className="font-medium text-slate-900 text-xs">{o.content}</p>
 {o.isCorrect && (
 <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-1">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đáp án chính xác
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-slate-500 italic">Câu hỏi tự luận (không có đáp án trắc nghiệm chọn trước).</p>
 )}

 {question.explanation && (
 <div className="rounded-xl bg-blue-50/80 border border-blue-200/80 p-4 text-xs text-slate-800 space-y-1">
 <h5 className="font-semibold text-slate-900">Giải thích đáp án / Hướng dẫn chấm:</h5>
 <p className=" tabular-nums text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">{question.explanation}</p>
 </div>
 )}
 </div>

 {/* Card 4: Metadata Grid */}
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-2xs">
 <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-500">Thông tin chi tiết</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
 {/* Mã câu hỏi */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <Hash className="h-3.5 w-3.5 text-blue-600" /> Mã câu hỏi
 </span>
 <p className=" tabular-nums font-medium text-slate-900">{codeText}</p>
 </div>

 {/* Môn học */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <BookOpen className="h-3.5 w-3.5 text-blue-600" /> Môn học
 </span>
 <p className="font-semibold text-slate-900 truncate" title={question.subject?.subjectName}>
 {question.subject?.subjectName || 'Chưa gán'}
 </p>
 </div>

 {/* Điểm số */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <Award className="h-3.5 w-3.5 text-blue-600" /> Điểm số
 </span>
 <p className="font-semibold text-blue-600">{scoreText}</p>
 </div>

 {/* Độ khó */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <HelpCircle className="h-3.5 w-3.5 text-blue-600" /> Độ khó
 </span>
 <div className="pt-0.5">
 <QuestionDifficultyBadge difficulty={question.difficulty || 'MEDIUM'} />
 </div>
 </div>

 {/* Loại câu hỏi */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <FileText className="h-3.5 w-3.5 text-blue-600" /> Loại câu hỏi
 </span>
 <div className="pt-0.5">
 <QuestionTypeBadge type={question.type || 'SINGLE_CHOICE'} />
 </div>
 </div>

 {/* Mức độ tư duy */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <Brain className="h-3.5 w-3.5 text-blue-600" /> Mức độ tư duy
 </span>
 <p className="font-semibold text-slate-900">{getBloomLabel(question.bloomLevel)}</p>
 </div>

 {/* Chủ đề */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <Layers className="h-3.5 w-3.5 text-blue-600" /> Chủ đề
 </span>
 <p className="font-semibold text-slate-800 truncate">{topicText}</p>
 </div>

 {/* Người tạo */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <User className="h-3.5 w-3.5 text-blue-600" /> Người tạo
 </span>
 <p className="font-semibold text-slate-900 truncate" title={creatorName}>{creatorName}</p>
 </div>

 {/* Ngày tạo */}
 <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-1">
 <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
 <Calendar className="h-3.5 w-3.5 text-blue-600" /> Ngày tạo
 </span>
 <p className="font-medium text-slate-900">{question.createdAt ? new Date(question.createdAt).toLocaleDateString('vi-VN') : '10/08/2026'}</p>
 </div>
 </div>
 </div>
 </div>

 {/* ── 3. Standard Footer ── */}
  <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 px-6 shrink-0 flex items-center justify-end">
 <Button
 variant="secondary"
 size="md"
 onClick={onClose}
 >
 Đóng
 </Button>
 </div>
 </div>
 </div>
 );

 return createPortal(content, document.body);
}
