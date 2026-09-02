'use client';

import React, { useState } from 'react';
import { Eye, Edit, CheckCircle2, XCircle, Trash2, FileText, BookOpen, Sliders, Maximize2 } from 'lucide-react';
import { ActionDropdownPortal } from '../common/ActionDropdownPortal';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { RubricDialog } from './RubricDialog';
import { Question } from '../../types';
import {
  QuestionDifficultyBadge,
  QuestionStatusBadge,
  QuestionTypeBadge,
} from './QuestionBadges';
import { getImageUrl } from '../../lib/media-utils';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { VideoLightboxModal } from '../VideoLightboxModal';
import { AudioLightboxModal } from '../AudioLightboxModal';
import { DynamicImage } from '../ui/DynamicImage';
import { QuestionMediaPlayer } from '../exam/QuestionMediaPlayer';
import { FillBlankInlineContent } from '../../lib/fill-blank-helper';

interface QuestionBankTableProps {
  questions: Question[];
  selected: string[];
  visibleColumns?: Record<string, boolean>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDetail: (q: Question) => void;
  onAction: (q: Question, name: string) => void;
  isAdmin: boolean;
  onRubricSaved?: () => void;
}

export function QuestionBankTable({
  questions,
  selected,
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
  onRubricSaved,
}: QuestionBankTableProps) {
  const [rubricQuestion, setRubricQuestion] = useState<Question | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [videoLightbox, setVideoLightbox] = useState<{ url: string; fileName?: string } | null>(null);
  const [audioLightbox, setAudioLightbox] = useState<{ url: string; fileName?: string } | null>(null);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (qId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setExpandedQuestionIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

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

  return (
    <>
      <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-apple-card">
        <table className="ui-table w-full text-left text-type-body text-slate-700 border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/90 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="py-3.5 pl-3 pr-2 text-center w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {visibleColumns.code !== false && <th scope="col" className="px-2 py-3.5 whitespace-nowrap">Mã câu hỏi</th>}
              {visibleColumns.content !== false && <th scope="col" className="px-3 py-3.5 min-w-[240px]">Nội dung & Các đáp án</th>}
              {visibleColumns.subject !== false && <th scope="col" className="px-2.5 py-3.5 whitespace-nowrap">Môn học</th>}
              {visibleColumns.difficulty !== false && <th scope="col" className="px-2 py-3.5 whitespace-nowrap">Độ khó</th>}
              {visibleColumns.type !== false && <th scope="col" className="px-2 py-3.5 whitespace-nowrap">Loại</th>}
              <th scope="col" className="px-2 py-3.5 whitespace-nowrap text-center">Điểm</th>
              {visibleColumns.status !== false && <th scope="col" className="px-2 py-3.5 whitespace-nowrap">Trạng thái</th>}
              {visibleColumns.creator !== false && <th scope="col" className="px-2.5 py-3.5 whitespace-nowrap">Người tạo</th>}
              {visibleColumns.createdAt !== false && <th scope="col" className="px-2.5 py-3.5 whitespace-nowrap">Ngày tạo</th>}
              <th scope="col" className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {questions.map((q) => {
              const isChecked = selected.includes(q.id);
              const codeText = q.code || `QH${q.id.slice(-5).toUpperCase()}`;
              const subjectName = q.subject?.subjectName || 'Chưa gán môn';
              const creatorName = q.createdByName || (q.createdBy as any)?.teacher?.fullName || q.createdBy?.fullName || q.createdBy?.username || (q.createdById ? `User #${q.createdById}` : 'Hệ thống');
              const optionsList = q.options && q.options.length > 0 ? q.options : [];

              return (
                <tr
                  key={q.id}
                  className={`group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/70 ${isChecked ? 'bg-blue-50/50 dark:bg-blue-950/50' : ''
                    }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 pl-3 pr-2 text-center align-top pt-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onSelect(q.id, e.target.checked)}
                      className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Mã câu hỏi */}
                  {visibleColumns.code !== false && (
                    <td className="px-2 py-3.5 whitespace-nowrap align-top pt-4">
                      <button
                        type="button"
                        onClick={() => onDetail(q)}
                        className="tabular-nums text-type-body leading-[22px] font-normal text-slate-900 dark:text-slate-100 hover:text-primary-600 transition cursor-pointer"
                      >
                        <IdentifierBadge>{codeText}</IdentifierBadge>
                      </button>
                    </td>
                  )}

                  {/* Nội dung câu hỏi & Các đáp án */}
                  {visibleColumns.content !== false && (
                    <td className="px-3 py-3.5 min-w-[240px] align-top">
                      <div className="space-y-2">
                        {/* Tầng 1: Nội dung câu hỏi 2 dòng mượt mà & Chữ Xem thêm nằm ngay cuối dòng 2 */}
                        {(() => {
                          const isExpanded = !!expandedQuestionIds[q.id];
                          const isLong = (q.content || '').length > 70 || (q.content || '').includes('\n');

                          return (
                            <div className="relative">
                              <div
                                className={`overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                  isExpanded ? 'max-h-[800px]' : 'max-h-[48px]'
                                }`}
                              >
                                <div className="text-type-body font-medium text-slate-900 dark:text-slate-100 leading-[24px] break-words">
                                  <span
                                    className="cursor-pointer"
                                    onClick={() => onDetail(q)}
                                  >
                                    <FillBlankInlineContent content={q.content} fillBlankAnswers={q.fillBlankAnswers} showAnswers={false} />
                                  </span>
                                  {isLong && isExpanded && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(q.id, e);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          toggleExpand(q.id, e as any);
                                        }
                                      }}
                                      className="table-action text-type-body font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer select-none outline-none inline ml-1"
                                    >
                                      (Thu gọn)
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isLong && !isExpanded && (
                                <div className="absolute right-0 bottom-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors pl-2 text-type-body font-medium leading-[24px]">
                                  <span className="text-slate-900 dark:text-slate-100 select-none">... </span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(q.id, e);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        toggleExpand(q.id, e as any);
                                      }
                                    }}
                                    className="table-action text-type-body font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer select-none outline-none inline"
                                  >
                                    Xem thêm
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Tầng 2: Dải Đáp án Trắc nghiệm hoặc Điền khuyết */}
                        {q.type === 'FILL_BLANK' ? (
                          (() => {
                            const fbList =
                              Array.isArray(q.fillBlankAnswers) && q.fillBlankAnswers.length > 0
                                ? q.fillBlankAnswers
                                : Array.isArray((q as any).answers) && (q as any).answers.length > 0
                                  ? (q as any).answers
                                  : [];
                            if (!fbList.length) return null;

                            return (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {fbList.map((ans: any, aIdx: number) => {
                                  const bIdx = ans.blankIndex || aIdx + 1;
                                  const mainAns = ans.answer || ans.value || ans.content || '—';
                                  return (
                                    <span
                                      key={ans.id || aIdx}
                                      className="ui-pill table-badge inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 text-type-helper font-medium text-emerald-900 dark:text-emerald-200 shadow-2xs max-w-[200px]"
                                      title={`Ô trống #${bIdx}: ${mainAns}`}
                                    >
                                      <span className="table-badge flex h-4.5 px-1.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-type-helper font-medium text-white">
                                        Ô #{bIdx}
                                      </span>
                                      <span className="table-badge truncate font-medium text-emerald-800 dark:text-emerald-300">
                                        {mainAns}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })()
                        ) : q.type !== 'ESSAY' && optionsList.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 w-full max-w-3xl">
                            {optionsList.map((opt) => (
                              <span
                                key={opt.label + opt.content}
                                className={`table-badge inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-type-helper font-medium w-full min-w-0 shadow-2xs transition-colors ${opt.isCorrect
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                  }`}
                                title={`${opt.label}. ${opt.content}${opt.isCorrect ? ' (Đáp án đúng)' : ''}`}
                              >
                                <span
                                  className={`table-badge flex h-5 w-5 min-w-[20px] shrink-0 items-center justify-center rounded text-type-helper font-medium ${opt.isCorrect
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-200/90 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                  {opt.label}
                                </span>
                                <span
                                  className={`table-badge truncate leading-tight flex-1 ${opt.isCorrect ? 'font-medium text-emerald-900 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                  {opt.content}
                                </span>
                                {opt.isCorrect && (
                                  <CheckCircle2 className="table-badge h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto" />
                                )}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {/* Tầng 3: Dải Đa phương tiện đính kèm (Media Attachment Strip) - Khung chuẩn đồng nhất */}
                        {q.media && q.media.length > 0 && (
                          <div className="table-action flex flex-wrap items-center gap-2.5 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                            {q.media.map((m, idx) => {
                              const mime = m.mimeType || '';
                              const isImg = mime.startsWith('image/') || (!mime && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(m.url));
                              const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(m.url);
                              const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(m.url);
                              const fullUrl = getImageUrl(m.url);

                              if (isImg) return (
                                <div
                                  key={m.id || idx}
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxUrl(m.url);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setLightboxUrl(m.url);
                                    }
                                  }}
                                  className="group relative flex h-[130px] w-full max-w-[240px] items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-900/95 p-1 transition duration-200 hover:border-blue-400 dark:hover:border-blue-500 cursor-zoom-in shadow-2xs shrink-0 select-none"
                                  title="Bấm để phóng to xem ảnh"
                                >
                                  <DynamicImage
                                    src={fullUrl}
                                    alt={m.altText || 'Hình minh họa'}
                                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 rounded-lg bg-slate-900/75 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                                    <Maximize2 className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </div>
                              );

                              if (isVid) return (
                                <div
                                  key={m.id || idx}
                                  className="h-[130px] w-full max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-black shadow-2xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <QuestionMediaPlayer
                                    src={fullUrl}
                                    type="video"
                                    fileName={m.fileName}
                                    maxPlays={0}
                                    mode="REFERENCE"
                                  />
                                </div>
                              );

                              if (isAud) return (
                                <div
                                  key={m.id || idx}
                                  className="h-[130px] w-full max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-900 shadow-2xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <QuestionMediaPlayer
                                    src={fullUrl}
                                    type="audio"
                                    fileName={m.fileName}
                                    maxPlays={0}
                                    mode="REFERENCE"
                                  />
                                </div>
                              );

                              return (
                                <span key={m.id || idx} className="table-badge ui-pill inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 text-type-helper font-medium text-slate-600 dark:text-slate-400 shrink-0">
                                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                                  Tệp đính kèm
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Môn học */}
                  {visibleColumns.subject !== false && (
                    <td className="px-2.5 py-3.5 align-top pt-4">
                      <div
                        className="inline-block max-w-[140px]"
                        title={subjectName}
                      >
                        <span className="block truncate text-type-body font-medium text-slate-800 dark:text-slate-200">
                          {subjectName}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Độ khó */}
                  {visibleColumns.difficulty !== false && (
                    <td className="px-2 py-3.5 whitespace-nowrap align-top pt-4">
                      <QuestionDifficultyBadge difficulty={q.difficulty || 'MEDIUM'} />
                    </td>
                  )}

                  {/* Loại */}
                  {visibleColumns.type !== false && (
                    <td className="px-2 py-3.5 whitespace-nowrap align-top pt-4">
                      <QuestionTypeBadge type={q.type || 'SINGLE_CHOICE'} />
                    </td>
                  )}

                  {/* Điểm số */}
                  <td className="px-2 py-3.5 whitespace-nowrap align-top pt-4 text-center">
                    <span className="text-type-body font-medium text-slate-900 dark:text-slate-100">
                      {q.score ?? (q.type === 'ESSAY' ? 1.0 : 0.25)}đ
                    </span>
                  </td>

                  {/* Trạng thái */}
                  {visibleColumns.status !== false && (
                    <td className="px-2 py-3.5 whitespace-nowrap align-top pt-4">
                      <QuestionStatusBadge status={q.status || 'APPROVED'} />
                    </td>
                  )}

                  {/* Người tạo */}
                  {visibleColumns.creator !== false && (
                    <td className="px-2.5 py-3.5 whitespace-nowrap align-top pt-4">
                      <div className="flex items-center gap-1.5 text-type-body font-normal text-slate-700 dark:text-slate-300">
                        <div className="table-avatar h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-medium text-type-body border border-slate-200 dark:border-slate-600">
                          {creatorName.charAt(0).toUpperCase()}
                        </div>
                        <span>{creatorName}</span>
                      </div>
                    </td>
                  )}

                  {/* Ngày tạo */}
                  {visibleColumns.createdAt !== false && (
                    <td className="table-meta px-2.5 py-3.5 whitespace-nowrap text-type-body text-slate-500 dark:text-slate-400 font-normal align-top pt-4">
                      {formatDate(q.createdAt)}
                    </td>
                  )}

                  {/* Thao tác */}
                  <td className="py-3.5 pl-2 pr-4 text-right whitespace-nowrap relative align-top pt-3.5">
                    <div className="flex items-center justify-end">
                      <ActionDropdownPortal>
                        {(closeMenu) => (
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onDetail(q);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <span>Xem chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onAction(q, 'edit');
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <span>Chỉnh sửa</span>
                            </button>

                            {q.type === 'ESSAY' && (
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  setRubricQuestion(q);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Sliders className="h-4 w-4 text-slate-500 dark:text-slate-400" />
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
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <XCircle className="h-4 w-4 text-amber-500" />
                                <span>Từ chối</span>
                              </button>
                            )}

                            {isAdmin && (
                              <>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeMenu();
                                    onAction(q, 'delete');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-type-body font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-150 cursor-pointer select-none group"
                                >
                                  <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors shrink-0" strokeWidth={1.5} />
                                  <span>Xóa</span>
                                </button>
                              </>
                            )}
                          </div>
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
        onSuccess={onRubricSaved}
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
