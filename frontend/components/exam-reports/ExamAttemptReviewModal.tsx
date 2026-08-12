'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
 X,
 CheckCircle2,
 XCircle,
 Minus,
 FileText,
 AlertTriangle,
 Clock,
 User,
 BookOpen,
 Award,
 ChevronDown,
 ChevronUp,
 Loader2,
 GraduationCap,
 Eye,
 EyeOff,
 HelpCircle,
} from 'lucide-react';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '../ui/Button';

interface ExamAttemptReviewModalProps {
 attemptId: string | null;
 onClose: () => void;
}

function OptionItem({
 label,
 text,
 isSelected,
 isCorrect,
 showAnswer,
}: {
 label: string;
 text: string;
 isSelected: boolean;
 isCorrect: boolean;
 showAnswer: boolean;
}) {
 let cls = 'border-slate-200 bg-slate-50/70 text-slate-700';
 if (showAnswer && isCorrect && isSelected) cls = 'border-emerald-400 bg-emerald-50/90 text-emerald-900 font-semibold shadow-2xs';
 else if (showAnswer && isCorrect && !isSelected) cls = 'border-emerald-300 bg-emerald-50/50 text-emerald-800 font-medium';
 else if (showAnswer && !isCorrect && isSelected) cls = 'border-rose-300 bg-rose-50/90 text-rose-800 font-medium shadow-2xs';
 else if (isSelected && !showAnswer) cls = 'border-blue-400 bg-blue-50/90 text-blue-900 font-semibold shadow-2xs';

 return (
 <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition ${cls}`}>
 <span className="font-semibold shrink-0">{label}.</span>
 <span className="flex-1 leading-relaxed">{text}</span>
 <span className="shrink-0 pt-0.5">
 {showAnswer && isCorrect && isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
 {showAnswer && isCorrect && !isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
 {showAnswer && !isCorrect && isSelected && <XCircle className="w-4 h-4 text-rose-500" />}
 {isSelected && !showAnswer && <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-2xs" />}
 </span>
 </div>
 );
}

function QuestionCard({ q, idx, showAnswer }: { q: any; idx: number; showAnswer: boolean }) {
 const [expanded, setExpanded] = useState(true);
 const sel = q.studentSelection;
 const selectedIds: string[] = sel?.selectedOptionIds || [];
 const isCorrect = sel?.isCorrect;
 const score = sel?.finalScore ?? 0;

 let statusColor = 'text-slate-400';
 let StatusIcon: any = Minus;
 if (q.type !== 'ESSAY') {
 if (showAnswer) {
 if (isCorrect) {
 statusColor = 'text-emerald-600';
 StatusIcon = CheckCircle2;
 } else if (selectedIds.length === 0) {
 statusColor = 'text-slate-400';
 StatusIcon = Minus;
 } else {
 statusColor = 'text-rose-500';
 StatusIcon = XCircle;
 }
 } else if (selectedIds.length > 0) {
 statusColor = 'text-blue-600';
 StatusIcon = CheckCircle2;
 }
 }

 const borderCls =
 showAnswer && q.type !== 'ESSAY'
 ? isCorrect
 ? 'border-emerald-200'
 : selectedIds.length === 0
 ? 'border-slate-200/90'
 : 'border-rose-200'
 : 'border-slate-200/90';

 const typeLabel =
 q.type === 'ESSAY'
 ? 'Tự luận'
 : q.type === 'FILL_BLANK'
 ? 'Điền khuyết'
 : q.type === 'TRUE_FALSE'
 ? 'Đúng / Sai'
 : 'Trắc nghiệm';

 const diffLabel = q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'Trung bình';

 return (
 <div className={`rounded-2xl border bg-white shadow-2xs overflow-hidden transition-all ${borderCls}`}>
 <button
 type="button"
 onClick={() => setExpanded(!expanded)}
 className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-slate-50/70 transition cursor-pointer"
 >
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <span className={`shrink-0 mt-0.5 ${statusColor}`}>
 <StatusIcon className="w-4 h-4" />
 </span>
 <p className="flex-1 min-w-0 text-xs font-semibold text-slate-900 leading-relaxed">
 Câu {idx + 1}: {q.content}
 </p>
 </div>
 <div className="flex items-center gap-2.5 shrink-0">
 <span
 className={`text-xs font-semibold tabular-nums ${
 showAnswer && q.type !== 'ESSAY'
 ? isCorrect
 ? 'text-emerald-700'
 : selectedIds.length === 0
 ? 'text-slate-500'
 : 'text-rose-600'
 : 'text-blue-600'
 }`}
 >
 {showAnswer ? `${score} / ${q.maxScore} điểm` : `${q.maxScore} điểm`}
 </span>
 {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
 </div>
 </button>

 {expanded && (
 <div className="border-t border-slate-100 p-4 pt-3.5 space-y-3 bg-slate-50/30 text-xs">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="rounded-md bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold border border-slate-200">
 {typeLabel}
 </span>
 <span className="rounded-md bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold border border-slate-200">
 {diffLabel}
 </span>
 </div>

 {q.type !== 'ESSAY' && q.type !== 'FILL_BLANK' && q.options?.length > 0 && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
 {q.options.map((opt: any) => (
 <OptionItem
 key={opt.id}
 label={opt.label || '?'}
 text={opt.content || opt.text || ''}
 isSelected={selectedIds.includes(opt.id)}
 isCorrect={Boolean(opt.isCorrect)}
 showAnswer={showAnswer}
 />
 ))}
 </div>
 )}

 {q.type === 'FILL_BLANK' && (
 <div className="space-y-2 bg-slate-50/80 border border-slate-200 p-3.5 rounded-xl">
 <p className="text-xs font-semibold text-slate-700 tracking-wider">
 Bài làm điền khuyết của sinh viên:
 </p>
 <div className="space-y-2">
 {((q.fillBlankAnswers && q.fillBlankAnswers.length > 0 ? q.fillBlankAnswers : [{ blankIndex: 1 }]) as any[]).map(
 (expected: any) => {
 const bIdx = expected.blankIndex || 1;
 const studentItem = (sel?.fillBlankAnswers || []).find((ans: any) => Number(ans.blankIndex) === Number(bIdx));
 const studentVal = studentItem?.value || '';
 const correctVal = expected.answer || '';
 return (
 <div
 key={bIdx}
 className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 p-3 rounded-xl text-xs"
 >
 <div className="flex items-center gap-2">
 <span className="font-semibold text-blue-600">Ô #{bIdx}:</span>
 <span className="font-semibold text-slate-900">
 {studentVal || <span className="italic font-normal text-slate-400">Bỏ trống</span>}
 </span>
 </div>
 {showAnswer && (
 <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
 <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
 Đáp án đúng: <span className="font-semibold text-emerald-800">{correctVal || '---'}</span>
 </div>
 )}
 </div>
 );
 }
 )}
 </div>
 </div>
 )}

 {q.type === 'ESSAY' && (
 <div className="space-y-2">
 <p className="text-xs font-semibold text-slate-700 tracking-wider">Bài làm tự luận của sinh viên:</p>
 <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 whitespace-pre-wrap leading-relaxed min-h-[60px] tabular-nums">
 {sel?.textAnswer || <span className="italic font-normal text-slate-400 font-sans">Sinh viên không nộp câu tự luận này</span>}
 </div>
 {showAnswer && sel?.teacherComment && (
 <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 space-y-1">
 <p className="text-xs font-semibold text-blue-800 tracking-wider">Nhận xét của Giảng viên:</p>
 <p className="text-xs text-blue-900 leading-relaxed whitespace-pre-wrap">{sel.teacherComment}</p>
 </div>
 )}
 </div>
 )}

 {showAnswer && q.explanation && (
 <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-1">
 <p className="text-xs font-semibold text-blue-900 tracking-wider">Giải thích đáp án:</p>
 <p className="text-xs text-slate-700 leading-relaxed font-normal">{q.explanation}</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}

export function ExamAttemptReviewModal({ attemptId, onClose }: ExamAttemptReviewModalProps) {
 const [mounted, setMounted] = useState(false);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [data, setData] = useState<any>(null);
 const [showAnswer, setShowAnswer] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 const load = useCallback(async () => {
 if (!attemptId) return;
 try {
 setLoading(true);
 setError(null);
 const res = await onlineExamService.getAttemptReview(attemptId);
 setData(res);
 } catch (err: any) {
 setError(err?.response?.data?.message || err.message || 'Không thể tải bài làm chi tiết.');
 } finally {
 setLoading(false);
 }
 }, [attemptId]);

 useEffect(() => {
 if (attemptId) void load();
 }, [attemptId, load]);

 if (!attemptId || !mounted) return null;

 const correct = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === true).length ?? 0;
 const wrong = data?.questions?.filter((q: any) => q.studentSelection?.isCorrect === false).length ?? 0;
 const skipped =
 data?.questions?.filter(
 (q: any) => q.studentSelection?.isCorrect === null && (q.studentSelection?.selectedOptionIds?.length ?? 0) === 0
 ).length ?? 0;

 const content = (
 <div role="dialog" aria-modal="true" aria-label="Chi tiết bài làm" className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
 {/* Dark Blur Backdrop */}
 <div
 className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
 onClick={onClose}
 />

 {/* Main Modal Container */}
 <div className="relative z-[101] w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
 {/* ── 1. Solid Blue Header (Matching ProfileDrawer & RegradeReviewDrawer) ── */}
 <div className="bg-[#2563EB] p-5 text-white shrink-0">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3.5 min-w-0 flex-1">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 font-semibold text-white border border-white/20 shadow-xs">
 <FileText className="h-6 w-6 text-white" />
 </div>

 <div className="min-w-0 flex-1 pr-2">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h2 className="truncate text-[20px] font-semibold leading-[28px] text-white">
 Xem Lại Chi Tiết Bài Thi
 </h2>
 {data?.paper?.paperCode && (
 <span className=" tabular-nums text-xs font-semibold bg-white/15 text-white px-2.5 py-0.5 rounded-lg border border-white/20">
 Mã đề: {data.paper.paperCode}
 </span>
 )}
 </div>
 {data && (
 <p className="truncate text-[13px] font-medium text-blue-100 mt-1">
 Sinh viên: <strong className="font-semibold text-white">{data.student?.fullName}</strong> ({data.student?.studentCode})
 {data.paper?.subjectName ? ` • Môn: ${data.paper.subjectName}` : ''}
 </p>
 )}
 </div>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/10 hover:text-white transition cursor-pointer"
 title="Đóng"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* ── 2. Scrollable Body Content ── */}
 <div className="flex-1 overflow-y-auto bg-slate-50/50">
 {loading && (
 <div className="flex flex-col items-center justify-center gap-3 py-20">
 <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
 <p className="text-xs font-semibold text-slate-500">Đang tải bài làm chi tiết sinh viên...</p>
 </div>
 )}

 {error && (
 <div className="flex flex-col items-center justify-center gap-3 py-20">
 <AlertTriangle className="w-10 h-10 text-rose-500" />
 <p className="text-xs font-semibold text-rose-600">{error}</p>
 <button
 type="button"
 onClick={load}
 className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
 >
 Thử lại ngay
 </button>
 </div>
 )}

 {data && !loading && (
 <div className="p-6 space-y-5">
 {/* Stat Summary Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="rounded-2xl bg-blue-50/80 border border-blue-200/80 p-4 text-center space-y-1 shadow-2xs">
 <Award className="w-5 h-5 text-blue-600 mx-auto" />
 <p className="text-xl font-semibold text-blue-700">
 {data.attemptInfo?.totalScore ?? '--'}{' '}
 <span className="text-xs font-semibold text-blue-500">/ {data.attemptInfo?.maxScore ?? 10}</span>
 </p>
 <p className="text-xs font-semibold text-blue-600">Tổng điểm</p>
 </div>

 <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-4 text-center space-y-1 shadow-2xs">
 <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
 <p className="text-xl font-semibold text-emerald-700">{correct}</p>
 <p className="text-xs font-semibold text-emerald-600">Câu đúng</p>
 </div>

 <div className="rounded-2xl bg-rose-50/80 border border-rose-200/80 p-4 text-center space-y-1 shadow-2xs">
 <XCircle className="w-5 h-5 text-rose-600 mx-auto" />
 <p className="text-xl font-semibold text-rose-700">{wrong}</p>
 <p className="text-xs font-semibold text-rose-600">Câu sai</p>
 </div>

 <div className="rounded-2xl bg-slate-100/80 border border-slate-200/80 p-4 text-center space-y-1 shadow-2xs">
 <Minus className="w-5 h-5 text-slate-500 mx-auto" />
 <p className="text-xl font-semibold text-slate-700">{skipped}</p>
 <p className="text-xs font-semibold text-slate-500">Bỏ qua</p>
 </div>
 </div>

 {/* Sub-info Badges */}
 <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
 <span className="flex items-center gap-1.5 font-semibold text-slate-800">
 <User className="w-4 h-4 text-blue-600" />
 {data.student?.className || data.student?.classCode || 'Chính quy'}
 </span>
 <span className="flex items-center gap-1.5 font-semibold text-slate-600">
 <BookOpen className="w-4 h-4 text-blue-600" />
 Thời gian bài thi: {data.paper?.durationMinutes || 60} phút
 </span>
 <span className="flex items-center gap-1.5 font-normal text-slate-600">
 <Clock className="w-4 h-4 text-blue-600" />
 Nộp bài lúc:{' '}
 {data.attemptInfo?.submittedAt
 ? new Date(data.attemptInfo.submittedAt).toLocaleString('vi-VN')
 : 'Chưa có thông tin'}
 </span>

 {data.attemptInfo?.isFlagged && (
 <span className="flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
 <AlertTriangle className="w-4 h-4 text-amber-600" />
 Cảnh báo vi phạm — Risk Score: {data.attemptInfo?.riskScore} điểm
 </span>
 )}
 </div>

 {/* Questions List Header */}
 <div className="flex items-center justify-between pt-1">
 <h3 className="text-xs font-semibold tracking-wider text-slate-700 flex items-center gap-2">
 <FileText className="w-4 h-4 text-blue-600" />
 Chi tiết từng câu ({data.questions?.length ?? 0} câu)
 </h3>
 <button
 type="button"
 onClick={() => setShowAnswer(!showAnswer)}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
 showAnswer
 ? 'bg-amber-500 text-white hover:bg-amber-600'
 : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
 }`}
 >
 {showAnswer ? (
 <>
 <EyeOff className="w-3.5 h-3.5" />
 Ẩn đáp án
 </>
 ) : (
 <>
 <Eye className="w-3.5 h-3.5" />
 Hiện đáp án
 </>
 )}
 </button>
 </div>

 {/* Questions List */}
 <div className="space-y-3">
 {(data.questions || []).map((q: any, idx: number) => (
 <QuestionCard key={q.questionId || idx} q={q} idx={idx} showAnswer={showAnswer} />
 ))}
 </div>

 {/* Incidents Warning Box */}
 {data.incidents?.length > 0 && (
 <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 space-y-2.5 shadow-2xs">
 <h4 className="text-xs font-semibold text-amber-900 tracking-wider flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-600" />
 Sự cố & Vi phạm ghi nhận ({data.incidents.length})
 </h4>
 <div className="space-y-2">
 {data.incidents.map((inc: any, i: number) => (
 <div
 key={inc.id || i}
 className="text-xs text-amber-900 bg-white rounded-xl border border-amber-200 p-3 leading-relaxed"
 >
 <span className="font-semibold text-amber-950">{inc.decision || 'Cảnh báo hệ thống'}:</span>{' '}
 {inc.reason}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 {/* ── 3. Standard Footer ── */}
 <div className="border-t border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between gap-3 bg-slate-50">
 {data?.questions?.some((q: any) => q.type === 'ESSAY') ? (
 <a href={`/teacher/essay-grading?attemptId=${attemptId}`}>
 <Button variant="primary" size="md" leftIcon={<FileText className="w-4 h-4" />}>
 Chấm / Sửa Điểm Tự Luận
 </Button>
 </a>
 ) : (
 <div />
 )}
 <Button variant="secondary" size="md" onClick={onClose}>
 Đóng
 </Button>
 </div>
 </div>
 </div>
 );

 return createPortal(content, document.body);
}
