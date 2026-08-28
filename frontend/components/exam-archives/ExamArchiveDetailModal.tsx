'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Printer,
  FileText,
  Loader2,
  Download,
  Copy,
  Check,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui/Button';
import { printArchivedDossier, getPublishedTemplatesMap } from '../../lib/export-print';

interface ArchivedAttemptDetail {
  id: string;
  student: {
    id: number;
    studentCode: string;
    fullName: string;
    className: string;
    departmentName: string;
  };
  schedule: {
    subjectCode: string;
    subjectName: string;
    examPeriodName: string;
    semester: string;
    schoolYear: string;
    examDate: string | null;
    timeSlot: string;
  };
  paperInfo: {
    title: string;
    paperCode: string;
    durationMinutes: number;
  };
  submission: {
    startTime: string | null;
    submittedAt: string | null;
    publishedAt: string | null;
    totalScore: number | null;
    maxScore: number;
    penaltyPoints: number;
    penaltyReason: string | null;
    isFlagged: boolean;
    gradedBy: string | null;
    approvedBy: string | null;
  };
  digitalSeal: {
    algorithm: string;
    sealHash: string;
    sealedAt: string | null;
    status: string;
  };
  questions: Array<{
    questionId: number | string;
    index: number;
    code: string;
    content: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'ESSAY' | string;
    maxScore: number;
    fillBlankAnswers?: Array<{
      blankIndex: number;
      answer: string;
      score: number;
    }>;
    studentAnswer: {
      selectedOptionIds: Array<number | string>;
      textAnswer: string | null;
      fillBlankAnswers?: Record<string, string> | null;
      fillBlankResult?: Record<string, boolean> | null;
      submissionFiles: Array<{ id: number; fileName: string; url: string; fileSize?: number }>;
      autoScore?: number | null;
      manualScore?: number | null;
      finalScore: number;
      teacherComment: string | null;
    };
    options: Array<{
      id: number | string;
      label: string;
      content: string;
      isCorrect: boolean;
    }>;
  }>;
  proctoringEventsCount: number;
  incidentsCount: number;
}

interface ExamArchiveDetailModalProps {
  attemptId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExamArchiveDetailModal({ attemptId, isOpen, onClose }: ExamArchiveDetailModalProps) {
  const [data, setData] = useState<ArchivedAttemptDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/exam-archives/attempts/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Không thể tải chi tiết bài thi lưu trữ:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && attemptId) {
      fetchDetail(attemptId);
      getPublishedTemplatesMap().catch(() => {});
    } else {
      setData(null);
    }
  }, [isOpen, attemptId, fetchDetail]);

  const handleCopyHash = () => {
    if (!data?.digitalSeal?.sealHash) return;
    navigator.clipboard.writeText(data.digitalSeal.sealHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    if (data) {
      printArchivedDossier(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Phẳng Chuẩn Hệ Thống */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-type-title-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                Hồ sơ bài thi
              </h3>
              <p className="text-type-meta text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {data
                  ? `${data.student.fullName} · ${data.student.studentCode} · ${data.schedule.subjectName}`
                  : 'Đang nạp dữ liệu hồ sơ...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-type-body font-medium">Đang trích xuất hồ sơ bài thi từ kho lưu trữ...</p>
            </div>
          ) : data ? (
            <>
              {/* Tóm tắt Thí sinh & Điểm số (Bố cục phẳng, không lồng card xám) */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-type-body font-medium text-slate-900 dark:text-slate-100">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-type-title-sm">{data.student.fullName}</span>
                    <span className="text-type-meta tabular-nums text-slate-500 font-normal">({data.student.studentCode})</span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-type-meta text-slate-700 dark:text-slate-300 font-normal">{data.student.className}</span>
                    {data.student.departmentName && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-type-meta text-slate-700 dark:text-slate-300 font-normal">{data.student.departmentName}</span>
                      </>
                    )}
                  </div>
                  <p className="text-type-meta text-slate-500 dark:text-slate-400">
                    Học phần: <strong className="font-medium text-slate-900 dark:text-slate-100">{data.schedule.subjectName}</strong> ({data.schedule.subjectCode}) · Nộp bài lúc {data.submission.submittedAt ? new Date(data.submission.submittedAt).toLocaleTimeString('vi-VN') : '—'} ({data.submission.submittedAt ? new Date(data.submission.submittedAt).toLocaleDateString('vi-VN') : ''})
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-type-meta text-slate-500 dark:text-slate-400 block">Điểm chính thức</span>
                  <div className="text-type-title-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {data.submission.totalScore !== null ? data.submission.totalScore : 0}
                    <span className="text-type-body-sm font-normal text-slate-400"> / {data.submission.maxScore}đ</span>
                  </div>
                </div>
              </div>

              {/* Dòng Chứng Thực Niêm Phong Phẳng (Loại bỏ hoàn toàn khung xanh, tinh gọn và sang trọng) */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-type-meta text-slate-700 dark:text-slate-300 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Mã niêm phong SHA-256:
                  </span>
                  <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100 select-all truncate max-w-[200px] sm:max-w-[320px]" title={data.digitalSeal.sealHash}>
                    {data.digitalSeal.sealHash}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Sao chép toàn bộ mã SHA-256"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {copiedHash && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Đã chép
                    </span>
                  )}
                </div>

                <div className="text-slate-500">
                  Duyệt bởi: <strong className="font-medium text-slate-900 dark:text-slate-100">{data.submission.approvedBy || 'Hội đồng Khảo thí'}</strong>
                </div>
              </div>

              {/* Danh sách câu hỏi & bài làm (Bố cục phẳng, phân tách bằng đường kẻ hairline) */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                    Bài làm chi tiết ({data.questions.length} câu hỏi)
                  </h4>
                  <span className="text-type-meta text-slate-400">Snapshot bất biến</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.questions.map((q) => {
                    const isEssay = q.type === 'ESSAY';
                    const isFillBlank = q.type === 'FILL_BLANK' || (Array.isArray(q.fillBlankAnswers) && q.fillBlankAnswers.length > 0);
                    const hasOptions = Array.isArray(q.options) && q.options.length > 0;

                    return (
                      <div key={String(q.questionId)} className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-type-body-sm font-semibold text-blue-600 dark:text-blue-400">
                                Câu {q.index}
                              </span>
                              <span className="text-type-meta tabular-nums text-slate-400">[{q.code}]</span>
                              <span className="text-type-meta text-slate-500">· {q.maxScore} điểm</span>
                            </div>
                            <p className="text-type-body font-normal text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                              {q.content}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-type-meta font-medium tabular-nums px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                              {q.studentAnswer.finalScore} / {q.maxScore}đ
                            </span>
                          </div>
                        </div>

                        {/* 1. Đáp án trắc nghiệm (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE) */}
                        {!isEssay && !isFillBlank && hasOptions && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt) => {
                              const isSelected = q.studentAnswer.selectedOptionIds.map(String).includes(String(opt.id));
                              const isCorrect = opt.isCorrect;

                              let cardStyle =
                                'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200';
                              if (isSelected && isCorrect) {
                                cardStyle =
                                  'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-medium';
                              } else if (isSelected && !isCorrect) {
                                cardStyle =
                                  'border-rose-300 bg-rose-50/40 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-medium';
                              } else if (!isSelected && isCorrect) {
                                cardStyle =
                                  'border-emerald-300/80 border-dashed bg-emerald-50/15 text-emerald-900 dark:text-emerald-300';
                              }

                              return (
                                <div
                                  key={String(opt.id)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-type-body-sm leading-relaxed ${cardStyle}`}
                                >
                                  <span className="font-semibold shrink-0">{opt.label}.</span>
                                  <span className="flex-1">{opt.content}</span>
                                  {isSelected && isCorrect && (
                                    <span className="text-type-meta text-emerald-600 dark:text-emerald-400 font-medium shrink-0 flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Đúng
                                    </span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="text-type-meta text-rose-600 dark:text-rose-400 font-medium shrink-0 flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5" />
                                      Sai
                                    </span>
                                  )}
                                  {!isSelected && isCorrect && (
                                    <span className="text-type-meta text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                                      Đáp án đúng
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 2. Câu hỏi điền khuyết (FILL_BLANK) */}
                        {isFillBlank && (
                          <div className="space-y-2 pt-1">
                            <div className="text-type-meta font-medium text-slate-500 dark:text-slate-400">
                              Đáp án điền khuyết:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.fillBlankAnswers?.map((fb) => {
                                const studentFilled =
                                  (q.studentAnswer.fillBlankAnswers && (q.studentAnswer.fillBlankAnswers[String(fb.blankIndex)] || q.studentAnswer.fillBlankAnswers[fb.blankIndex]))
                                  || q.studentAnswer.textAnswer;
                                const isMatch = studentFilled && fb.answer && String(studentFilled).trim().toLowerCase() === String(fb.answer).trim().toLowerCase();

                                return (
                                  <div
                                    key={fb.blankIndex}
                                    className={`p-3 rounded-xl border text-type-body-sm space-y-1.5 ${
                                      isMatch
                                        ? 'border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100'
                                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-slate-900 dark:text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-type-meta text-slate-500">
                                      <span className="font-semibold text-blue-600 dark:text-blue-400">Vị trí [Ô {fb.blankIndex}]</span>
                                      <span className="tabular-nums font-medium">{fb.score}đ</span>
                                    </div>
                                    <div className="text-type-body-sm flex items-center justify-between gap-2">
                                      <div>
                                        <span className="text-slate-500">Thí sinh điền: </span>
                                        <strong className="font-semibold text-slate-900 dark:text-slate-100">
                                          {studentFilled || '(Bỏ trống)'}
                                        </strong>
                                      </div>
                                      {isMatch ? (
                                        <span className="text-type-meta text-emerald-600 font-medium inline-flex items-center gap-1">
                                          <CheckCircle className="w-3.5 h-3.5" /> Đúng
                                        </span>
                                      ) : (
                                        <span className="text-type-meta text-rose-500 font-medium inline-flex items-center gap-1">
                                          <XCircle className="w-3.5 h-3.5" /> Chưa khớp
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-type-meta text-slate-500 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                                      <span>Đáp án chuẩn: </span>
                                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                        {fb.answer}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. Bài làm tự luận (ESSAY) */}
                        {isEssay && (
                          <div className="space-y-2 pt-1">
                            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 text-type-body-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                              <span className="font-medium text-slate-500 dark:text-slate-400 block mb-1">
                                Nội dung bài làm của thí sinh:
                              </span>
                              {q.studentAnswer.textAnswer || '(Thí sinh không nhập nội dung văn bản)'}
                            </div>

                            {q.studentAnswer.teacherComment && (
                              <div className="p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/20 text-type-meta text-blue-950 dark:text-blue-200">
                                <strong>Nhận xét của cán bộ chấm:</strong> {q.studentAnswer.teacherComment}
                              </div>
                            )}

                            {Array.isArray(q.studentAnswer.submissionFiles) && q.studentAnswer.submissionFiles.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {q.studentAnswer.submissionFiles.map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white text-type-meta font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{file.fileName}</span>
                                    <Download className="w-3 h-3 text-slate-400" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. Fallback cho textAnswer thông thường nếu chưa hiển thị */}
                        {!isEssay && !isFillBlank && !hasOptions && q.studentAnswer.textAnswer && (
                          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 text-type-body-sm text-slate-900 dark:text-slate-100">
                            <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">
                              Câu trả lời của thí sinh:
                            </span>
                            <div className="font-semibold">{q.studentAnswer.textAnswer}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-type-body">Không tìm thấy thông tin bài thi.</div>
          )}
        </div>

        {/* Footer Phẳng & Tinh Gọn */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-type-meta text-slate-400">
            Snapshot bài thi
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrint}
              disabled={!data}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              In hồ sơ
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
