'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService, AnswerItem, ProctoringEventItem } from '@/lib/services/online-exam.service';
import { Clock, Shield, Flag, CheckCircle, AlertTriangle, Wifi, WifiOff, Send, Maximize2, ChevronLeft, ChevronRight, HelpCircle, X } from 'lucide-react';
import { fixHtmlImageUrls, getImageUrl } from '@/lib/media-utils';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { Toast } from '@/components/Toast';
import { FillBlankQuestionRenderer } from '@/components/question-bank/FillBlankQuestionRenderer';
import { QuestionMediaPlayer } from '@/components/exam/QuestionMediaPlayer';
import { DynamicImage } from '@/components/ui/DynamicImage';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';

export default function StudentExamTakePage() {
  const router = useRouter();
  const params = useParams();
  const tokenFromUrl = typeof window !== 'undefined' ? sessionStorage.getItem('attemptToken') : null;

  const [attemptData, setAttemptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds: string[]; textAnswer: string; textAnswerRich?: Record<string, unknown>; fillBlankAnswers?: Array<{ blankIndex: number; value: string }>; isFlagged: boolean; version: number; files?: any[] }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const [syncState, setSyncState] = useState<'SAVED' | 'SAVING' | 'OFFLINE'>('SAVED');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // States báo cáo sự cố khẩn cấp
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  const [sendingIncident, setSendingIncident] = useState(false);
  const [incidentMsg, setIncidentMsg] = useState<string | null>(null);

  // States cảnh báo vi phạm quy chế thi trực quan cho sinh viên
  const [violationModal, setViolationModal] = useState<{
    isOpen: boolean;
    reason: string;
    eventType: string;
    violationCount: number;
    maxAllowed: number;
  }>({
    isOpen: false,
    reason: '',
    eventType: '',
    violationCount: 0,
    maxAllowed: 5,
  });

  const [violationSubmittedModal, setViolationSubmittedModal] = useState<{
    isOpen: boolean;
    reason: string;
    violationCount: number;
    maxAllowed: number;
    attemptId: string;
  }>({
    isOpen: false,
    reason: '',
    violationCount: 0,
    maxAllowed: 5,
    attemptId: '',
  });

  const handleSendIncident = async () => {
    if (!incidentText.trim()) return;
    try {
      setSendingIncident(true);
      await onlineExamService.submitAppeal(attemptData?.attemptId || tokenFromUrl, incidentText.trim());
      setIncidentMsg('Đã gửi báo cáo sự cố thành công cho Giám thị.');
      setTimeout(() => {
        setShowIncidentModal(false);
        setIncidentText('');
        setIncidentMsg(null);
      }, 1500);
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể gửi báo cáo sự cố', type: 'error' });
    } finally {
      setSendingIncident(false);
    }
  };

  const eventQueue = useRef<ProctoringEventItem[]>([]);
  const pendingAnswersToSave = useRef<Record<string, AnswerItem>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const violationCountRef = useRef<number>(0);

  const handleAutoSubmit = useCallback(async () => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token || !attemptData) return;

    try {
      await onlineExamService.submitAttempt(token);
      router.push(`/student/online-exam/${attemptData.attemptId}/result`);
    } catch (err) {
      console.error('Auto submit failed:', err);
    }
  }, [attemptData, router, tokenFromUrl]);

  useEffect(() => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token) {
      setError('Không tìm thấy token bài thi hợp lệ');
      setLoading(false);
      return;
    }
    loadQuestions(token);
  }, [tokenFromUrl]);

  const loadQuestions = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await onlineExamService.getAttemptQuestions(token);
      setAttemptData(data);
      setRemainingSeconds(data.remainingSeconds);
      if (typeof data?.violationCount === 'number') {
        violationCountRef.current = data.violationCount;
      }

      const initialAnswers: Record<string, any> = {};
      if (data.savedAnswers) {
        data.savedAnswers.forEach((ans: any) => {
          initialAnswers[ans.questionId] = {
            selectedOptionIds: ans.selectedOptionIds || [],
            textAnswer: ans.textAnswer || '',
            textAnswerRich: ans.textAnswerRich || undefined,
            fillBlankAnswers: ans.fillBlankAnswers || [],
            isFlagged: ans.isFlaggedForReview || false,
            version: ans.version || 1,
            files: ans.files || [],
          };
        });
      }
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || 'Không thể tải đề thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (remainingSeconds <= 0 || !attemptData) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, attemptData, handleAutoSubmit]);

  useEffect(() => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token) return;

    const hbInterval = setInterval(async () => {
      try {
        const hb = await onlineExamService.heartbeat(token);
        if (hb.status === 'AUTO_SUBMITTED' || hb.remainingSeconds === 0) {
          handleAutoSubmit();
        }
      } catch (e) {
        console.warn('Heartbeat failed', e);
      }
    }, 15000);

    return () => clearInterval(hbInterval);
  }, [handleAutoSubmit, tokenFromUrl]);

  const flushPendingAnswers = useCallback(async () => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    const payloadBatch = Object.values(pendingAnswersToSave.current);
    if (!token || payloadBatch.length === 0) return false;
    try {
      await onlineExamService.saveAnswers(token, payloadBatch);
      pendingAnswersToSave.current = {};
      setSyncState('SAVED');
      return true;
    } catch (err) {
      console.error('Auto save failed:', err);
      setSyncState('OFFLINE');
      return false;
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    const handleOnline = () => { void flushPendingAnswers(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushPendingAnswers]);

  const triggerAutoSave = useCallback(
    (questionId: string, selectedOptionIds: string[], textAnswer: string, isFlagged: boolean, currentVersion: number, textAnswerRich?: Record<string, unknown>, fillBlankAnswers?: Array<{ blankIndex: number; value: string }>) => {
      const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
      if (!token) return;

      const newVersion = currentVersion + 1;
      const item: AnswerItem = {
        questionId,
        selectedOptionIds,
        textAnswer,
        textAnswerRich,
        fillBlankAnswers,
        isFlaggedForReview: isFlagged,
        version: newVersion,
        clientTimestamp: new Date().toISOString(),
      };

      pendingAnswersToSave.current[questionId] = item;
      setSyncState('SAVING');

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => { void flushPendingAnswers(); }, 1000);
    },
    [flushPendingAnswers, tokenFromUrl],
  );

  const handleEssayChange = (questionId: string, textAnswer: string) => {
    const current = answers[questionId] || { selectedOptionIds: [], textAnswer: '', isFlagged: false, version: 0 };
    const version = (current.version || 0) + 1;
    setAnswers((prev) => ({ ...prev, [questionId]: { ...current, textAnswer, version } }));
    triggerAutoSave(questionId, current.selectedOptionIds || [], textAnswer, current.isFlagged, current.version || 0);
  };

  const handleFillBlankChange = (questionId: string, blankIndex: number, value: string) => {
    const current = answers[questionId] || { selectedOptionIds: [], textAnswer: '', fillBlankAnswers: [], isFlagged: false, version: 0 };
    const fillBlankAnswers = [...(current.fillBlankAnswers || []).filter(item => item.blankIndex !== blankIndex), { blankIndex, value }]
      .sort((a, b) => a.blankIndex - b.blankIndex);
    const version = (current.version || 0) + 1;
    setAnswers(prev => ({ ...prev, [questionId]: { ...current, fillBlankAnswers, version } }));
    triggerAutoSave(questionId, current.selectedOptionIds || [], current.textAnswer || '', current.isFlagged, current.version || 0, undefined, fillBlankAnswers);
  };

  const handleEssayFile = async (questionId: string, file?: File) => {
    if (!file) return;
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token) return;
    try {
      setSyncState('SAVING');
      const uploaded = await onlineExamService.uploadEssayFile(token, questionId, file);
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...(prev[questionId] || { selectedOptionIds: [], textAnswer: '', isFlagged: false, version: 0 }), files: [...(prev[questionId]?.files || []), uploaded] },
      }));
      setSyncState('SAVED');
    } catch (e: any) {
      setSyncState('OFFLINE');
      setToast({
        type: 'error',
        message: e?.response?.data?.message || e?.message || 'Không thể tải tệp bài làm',
      });
    }
  };

  const reportViolation = useCallback(async (eventType: string, reasonText: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token || !attemptData?.config) return;

    const eventItem: ProctoringEventItem = {
      eventType,
      severity,
      metadata: { timestamp: new Date().toISOString(), pageUrl: window.location.href, reason: reasonText },
    };

    violationCountRef.current += 1;
    const maxAllowed = attemptData?.config?.maxAllowedViolations || 5;

    try {
      const proctoringResult = await onlineExamService.recordEvents(token, [eventItem]);
      const finalCount = typeof proctoringResult?.violationCount === 'number'
        ? proctoringResult.violationCount
        : violationCountRef.current;
      const finalMax = proctoringResult?.maxAllowedViolations || maxAllowed;
      violationCountRef.current = finalCount;

      if (proctoringResult?.autoSubmitted || proctoringResult?.isTerminated || finalCount >= finalMax) {
        setViolationSubmittedModal({
          isOpen: true,
          reason: reasonText,
          violationCount: Math.max(finalCount, finalMax),
          maxAllowed: finalMax,
          attemptId: attemptData.attemptId,
        });
      } else {
        setViolationModal({
          isOpen: true,
          reason: reasonText,
          eventType,
          violationCount: finalCount,
          maxAllowed: finalMax,
        });
      }
    } catch (err) {
      console.warn('Failed to record violation event:', err);
      const finalCount = violationCountRef.current;
      if (finalCount >= maxAllowed) {
        setViolationSubmittedModal({
          isOpen: true,
          reason: reasonText,
          violationCount: finalCount,
          maxAllowed,
          attemptId: attemptData.attemptId,
        });
      } else {
        setViolationModal({
          isOpen: true,
          reason: reasonText,
          eventType,
          violationCount: finalCount,
          maxAllowed,
        });
      }
    }
  }, [attemptData, tokenFromUrl]);

  useEffect(() => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token || !attemptData?.config) return;

    let lastEventTime = 0;
    const triggerViolation = (type: string, reason: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') => {
      const now = Date.now();
      if (now - lastEventTime < 2500) return; // Chống spam 2.5s
      lastEventTime = now;
      reportViolation(type, reason, severity);
    };

    const handleVisibilityChange = () => {
      if (document.hidden && attemptData.config.preventTabSwitch) {
        triggerViolation('TAB_HIDDEN', 'Bạn vừa chuyển sang tab khác hoặc ẩn cửa sổ làm bài thi!', 'HIGH');
      }
    };

    const handleBlur = () => {
      if (attemptData.config.preventTabSwitch && !document.hidden) {
        triggerViolation('WINDOW_BLUR', 'Bạn vừa click mở ứng dụng khác ngoài giao diện bài thi!', 'MEDIUM');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attemptData.config.requireFullscreen) {
        triggerViolation('FULLSCREEN_EXIT', 'Bạn vừa thoát khỏi chế độ Toàn màn hình (Fullscreen)!', 'HIGH');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (attemptData.config.preventCopyPaste) {
        e.preventDefault();
        triggerViolation('COPY_ATTEMPT', 'Hệ thống phát hiện thao tác Sao chép nội dung bài làm!', 'MEDIUM');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (attemptData.config.preventCopyPaste) {
        e.preventDefault();
        triggerViolation('PASTE_ATTEMPT', 'Hệ thống phát hiện thao tác Dán nội dung vào bài thi!', 'MEDIUM');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('CONTEXT_MENU_ATTEMPT', 'Hệ thống chặn thao tác click chuột phải (Context Menu)!', 'LOW');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [tokenFromUrl, attemptData, reportViolation]);

  const handleSelectOption = (questionId: string, optionId: string, isMultipleChoice: boolean) => {
    const current = answers[questionId] || { selectedOptionIds: [], textAnswer: '', isFlagged: false, version: 0 };
    let newSelected: string[] = [];

    if (isMultipleChoice) {
      newSelected = current.selectedOptionIds.includes(optionId)
        ? current.selectedOptionIds.filter((id) => id !== optionId)
        : [...current.selectedOptionIds, optionId];
    } else {
      newSelected = [optionId];
    }

    const newVersion = current.version + 1;
    const updated = { ...current, selectedOptionIds: newSelected, version: newVersion };
    setAnswers((prev) => ({ ...prev, [questionId]: updated }));

    triggerAutoSave(questionId, newSelected, current.textAnswer, current.isFlagged, current.version);
  };

  const handleToggleFlag = (questionId: string) => {
    const current = answers[questionId] || { selectedOptionIds: [], textAnswer: '', isFlagged: false, version: 0 };
    const newFlag = !current.isFlagged;
    const updated = { ...current, isFlagged: newFlag, version: current.version + 1 };
    setAnswers((prev) => ({ ...prev, [questionId]: updated }));

    triggerAutoSave(questionId, current.selectedOptionIds, current.textAnswer, newFlag, current.version);
  };

  const handleSubmitExam = async () => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token) return;

    try {
      setSubmitting(true);
      await flushPendingAnswers();
      if (Object.keys(pendingAnswersToSave.current).length > 0) {
        setToast({
          type: 'error',
          message: 'Chưa đồng bộ được câu trả lời. Vui lòng kiểm tra kết nối mạng rồi thử lại.',
        });
      }
      await onlineExamService.submitAttempt(token);
      sessionStorage.removeItem('attemptToken');
      router.push(`/student/online-exam/${attemptData.attemptId}/result`);
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Không thể nộp bài' });
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 text-white animate-pulse">
          <Clock className="h-7 w-7" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Đang tải đề thi bảo mật...</h3>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Vui lòng chờ trong giây lát để hệ thống khởi tạo phòng thi trực tuyến</p>
        </div>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-xl space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Không Thể Truy Cập Bài Thi</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/student/exam-schedule')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            Quay Về Lịch Thi
          </button>
        </div>
      </div>
    );
  }

  const questions = attemptData.questions || [];
  const currentQ = questions[currentIdx];
  const currentAns = answers[currentQ?.questionId] || { selectedOptionIds: [], textAnswer: '', fillBlankAnswers: [] as Array<{ blankIndex: number; value: string }>, isFlagged: false, version: 0 };

  const totalCount = questions.length;
  const answeredCount = Object.values(answers).filter((a) => (a.selectedOptionIds && a.selectedOptionIds.length > 0) || Boolean(a.textAnswer?.trim()) || Boolean(a.fillBlankAnswers?.some(item => item.value.trim()))).length;
  const flaggedCount = Object.values(answers).filter((a) => a.isFlagged).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col select-none">
      {/* Enterprise Dark Navy Header */}
      <header className="bg-primary-800 text-white px-4 sm:px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 font-semibold text-white text-base shadow-sm">
            {attemptData.paperTitle ? attemptData.paperTitle.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <span className="font-semibold text-white text-sm sm:text-base tracking-tight block truncate max-w-xs sm:max-w-md">
              {attemptData.paperTitle}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2.5 py-0.5 bg-white/15 border border-white/20 text-blue-100 text-[13px] font-semibold rounded-md">
                <Shield className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Giám Sát Gian Lận Active
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-4 sm:space-x-5">
          {/* Sync Status Badge - Chỉ hiển thị khi Đang đồng bộ hoặc Mất kết nối (Đã bỏ chữ 'Đã tự động lưu') */}
          <div className="hidden sm:flex items-center text-[15px] font-medium">
            {syncState === 'SAVING' && (
              <span className="text-amber-300 flex items-center gap-1.5 animate-pulse">
                <Wifi className="w-3.5 h-3.5 text-amber-400" /> Đang đồng bộ...
              </span>
            )}
            {syncState === 'OFFLINE' && (
              <span className="text-rose-300 flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" /> Mất kết nối
              </span>
            )}
          </div>

          {/* Countdown Clock Box - Ô đếm ngược thời gian tinh tế */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl tabular-nums text-sm sm:text-base font-semibold transition-all ${
              remainingSeconds < 300
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-950/40'
                : 'bg-white/15 text-white backdrop-blur-xs'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Button Báo cáo sự cố - Nút Ghost phụ không dùng viền khung */}
          <button
            type="button"
            onClick={() => setShowIncidentModal(true)}
            className="px-3 py-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Gửi báo cáo sự cố kỹ thuật cho Giám thị"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Báo sự cố</span>
          </button>

          {/* Submit Exam Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp Bài</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Question Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          {currentQ && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              {/* Question Header Status */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-xs">
                    {currentIdx + 1}
                  </span>
                  <IdentifierBadge tone="neutral">Mã: {currentQ.code}</IdentifierBadge>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {currentQ.score} điểm
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.questionId)}
                  className={`flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer active:scale-95 ${currentAns.isFlagged
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${currentAns.isFlagged ? 'fill-white' : ''}`} />
                  <span>{currentAns.isFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

 {/* Lightbox for enlarge images */}
 {lightboxUrl && (
 <ImageLightboxModal
 imageUrl={lightboxUrl}
 altText={`Hình minh họa câu hỏi mã ${currentQ.code}`}
 onClose={() => setLightboxUrl(null)}
 />
 )}

 {/* Question Text / Rich Text Content */}
 <div className="text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-relaxed font-semibold space-y-3">
 {currentQ.type === 'FILL_BLANK' ? (
 <FillBlankQuestionRenderer
 content={currentQ.content}
 contentRich={currentQ.contentRich}
 answers={currentAns.fillBlankAnswers || []}
 onChange={(blankIndex, value) => handleFillBlankChange(currentQ.questionId, blankIndex, value)}
 />
 ) : currentQ.contentRich && typeof currentQ.contentRich === 'object' && 'html' in currentQ.contentRich ? (
 <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(String((currentQ.contentRich as { html?: string }).html || '')) }} />
 ) : (
 currentQ.content
 )}

 {/* Media Attachments */}
 {currentQ.media && currentQ.media.length > 0 && (
 <div className="flex flex-wrap items-center gap-3 pt-2">
 {currentQ.media.map((mediaItem: any, idx: number) => {
 const fullUrl = getImageUrl(mediaItem.url);
 const mime: string = mediaItem.mimeType || '';
 if (mime.startsWith('video/')) {
 return (
 <QuestionMediaPlayer
 key={mediaItem.id || idx}
 attemptId={tokenFromUrl}
 questionId={currentQ.questionId}
 src={fullUrl}
 type="video"
 fileName={mediaItem.fileName}
 maxPlays={mediaItem.maxPlays || 2}
 />
 );
 }
 if (mime.startsWith('audio/')) {
 return (
 <QuestionMediaPlayer
 key={mediaItem.id || idx}
 attemptId={tokenFromUrl}
 questionId={currentQ.questionId}
 src={fullUrl}
 type="audio"
 fileName={mediaItem.fileName}
 maxPlays={mediaItem.maxPlays || 2}
 />
 );
 }
 // Default: image
 return (
 <div
 key={mediaItem.id || idx}
 onClick={() => setLightboxUrl(mediaItem.url)}
 className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 transition hover:border-blue-600 hover:shadow-md"
 title="Bấm vào để xem ảnh phóng to"
 >
 <DynamicImage
 src={fullUrl}
 alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
 className="max-h-52 rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
 />
 <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100">
 <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xs">
 <Maximize2 className="h-4 w-4 text-blue-400" /> Phóng to xem rõ ảnh
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Answer area */}
 {currentQ.type === 'ESSAY' ? (
 <div className="space-y-3 pt-2">
 <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300">Bài làm tự luận</label>
 <textarea
 value={currentAns.textAnswer || ''}
 onChange={(e) => handleEssayChange(currentQ.questionId, e.target.value)}
 className="min-h-[260px] w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-[15px] leading-7 text-slate-800 dark:text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
 placeholder="Nhập bài làm của bạn..."
 />
 <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
 <span>{(currentAns.textAnswer || '').length} ký tự · Tự động lưu khi nhập</span>
 <label className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
 Đính kèm PDF/DOCX/JPG/PNG
 <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleEssayFile(currentQ.questionId, e.target.files?.[0])} />
 </label>
 </div>
 {(currentAns as any).files && (currentAns as any).files.length > 0 && (
 <div className="space-y-1 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
 {(currentAns as any).files.map((file: any) => <div key={file.id || file.url}>📎 {file.fileName || 'Tệp bài làm'}</div>)}
 </div>
 )}
 </div>
 ) : currentQ.type === 'FILL_BLANK' ? (
 <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-4 text-xs font-normal text-slate-600 dark:text-slate-300 space-y-1">
 <p>💡 <strong>Hướng dẫn:</strong> Nhập trực tiếp đáp án vào từng ô trống trong câu hỏi phía trên. Hệ thống tự động ghi nhận và lưu bài làm của bạn khi bạn nhập.</p>
 </div>
 ) : (
 <div className="space-y-3 pt-2">
 {currentQ.options?.map((opt: any) => {
 const isSelected = currentAns.selectedOptionIds?.includes(opt.id);
 const isMulti = currentQ.type === 'MULTIPLE_CHOICE';

 return (
 <div
 key={opt.id}
 onClick={() => handleSelectOption(currentQ.questionId, opt.id, isMulti)}
 className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3.5 ${isSelected
 ? 'bg-blue-50/80 border-blue-600 text-blue-700 shadow-2xs font-medium ring-2 ring-blue-500/20'
 : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
 }`}
 >
 <div
 className={`w-7 h-7 rounded-${isMulti ? 'lg' : 'full'} border flex items-center justify-center shrink-0 mt-0.5 transition ${isSelected
 ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-2xs'
 : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium'
 }`}
 >
 <span className="text-xs">{opt.label}</span>
 </div>
 <div className="text-xs sm:text-sm leading-relaxed pt-0.5 font-normal text-slate-800 dark:text-slate-200">{opt.content}</div>
 </div>
 );
 })}
 </div>
 )}

 {/* Pagination Controls */}
 <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
 <button
 type="button"
 disabled={currentIdx === 0}
 onClick={() => setCurrentIdx((prev) => prev - 1)}
 className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-[15px] font-medium disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-2xs"
 >
 <ChevronLeft className="h-4 w-4" /> Câu trước
 </button>
 <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">
 Câu <strong className="font-semibold text-slate-900 dark:text-slate-100">{currentIdx + 1}</strong> / {totalCount}
 </span>
 <button
 type="button"
 disabled={currentIdx === totalCount - 1}
 onClick={() => setCurrentIdx((prev) => prev + 1)}
 className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-xs"
 >
 Câu tiếp <ChevronRight className="h-4 w-4" />
 </button>
 </div>
 </div>
 )}
 </main>

 {/* Sidebar Question Navigator */}
 <aside className="w-full lg:w-80 bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-700 p-6 flex flex-col shrink-0 space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
 <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Danh Sách Câu Hỏi</h3>
 <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{answeredCount}/{totalCount} Đã xong</span>
 </div>

 {/* Legend Badges */}
 <div className="flex flex-wrap items-center justify-between text-[13px] font-medium text-slate-500 dark:text-slate-400 gap-1.5 pb-2">
 <span className="flex items-center">
 <span className="w-2.5 h-2.5 rounded bg-blue-600 mr-1.5"></span> Đã làm ({answeredCount})
 </span>
 <span className="flex items-center">
 <span className="w-2.5 h-2.5 rounded bg-amber-500 mr-1.5"></span> Xem lại ({flaggedCount})
 </span>
 <span className="flex items-center">
 <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 mr-1.5"></span> Chưa làm
 </span>
 </div>

 {/* 5-Column Question Grid */}
 <div className="grid grid-cols-5 gap-2.5 p-2 overflow-y-auto flex-1 max-h-[50vh] lg:max-h-none border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
 {questions.map((q: any, idx: number) => {
 const ans = answers[q.questionId];
 const isAnswered = Boolean(
 (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
 (ans?.textAnswer && ans.textAnswer.trim().length > 0) ||
 Boolean(ans?.fillBlankAnswers?.some((item: any) => item.value?.trim()))
 );
 const isFlagged = Boolean(ans?.isFlagged);
 const isCurrent = idx === currentIdx;

 let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600';
 if (isFlagged) {
 btnStyle = 'bg-amber-500 text-white font-semibold border-amber-500 shadow-2xs hover:bg-amber-600';
 } else if (isAnswered) {
 btnStyle = 'bg-blue-600 text-white font-semibold border-blue-600 shadow-2xs hover:bg-blue-700';
 }

 if (isCurrent) {
 btnStyle += ' ring-2 ring-blue-600 ring-offset-1 z-10 font-semibold shadow-sm scale-105';
 }

 return (
 <button
 key={q.questionId}
 type="button"
 onClick={() => setCurrentIdx(idx)}
 className={`h-9.5 rounded-xl border text-xs flex items-center justify-center relative transition duration-150 cursor-pointer ${btnStyle}`}
 >
 {idx + 1}
 {isFlagged && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-200 rounded-full"></span>}
 </button>
 );
 })}
 </div>
 </aside>
 </div>

 {/* Submit Confirmation Modal */}
 {showSubmitModal && (
 <div role="dialog" aria-modal="true" aria-label="Xác nhận nộp bài" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
 <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-2xl max-w-md w-full my-auto overflow-hidden shadow-2xl space-y-0">
 {/* Header */}
 <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-blue-700 p-5 text-white shrink-0 shadow-xs">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3.5 min-w-0 flex-1">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
 <Send className="h-6 w-6 text-white" />
 </div>
 <div className="min-w-0 flex-1 pr-2">
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-[18px] font-semibold leading-snug text-white line-clamp-1">
 Xác Nhận Nộp Bài Thi
 </h3>
 <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/30">
 Nộp bài
 </span>
 </div>
 <p className="text-[13px] font-medium text-blue-100/90 mt-1 line-clamp-1">
 Hoàn thành làm bài và chuyển sang màn hình kết quả
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setShowSubmitModal(false)}
 className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
 title="Đóng"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* Statistics Summary */}
 <div className="p-5 space-y-3.5">
 <div className="bg-slate-50/90 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 text-xs font-normal border border-slate-200/70 dark:border-slate-700">
 <div className="flex justify-between text-slate-500 dark:text-slate-400">
 <span>Tổng số câu hỏi:</span>
 <span className="font-semibold text-slate-900 dark:text-slate-100">{totalCount}</span>
 </div>
 <div className="flex justify-between text-primary-600 dark:text-primary-400">
 <span>Số câu đã trả lời:</span>
 <span className="font-semibold">{answeredCount}</span>
 </div>
             <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Số câu chưa trả lời:</span>
              <span className="font-semibold">{totalCount - answeredCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowSubmitModal(false)}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Tiếp tục làm bài
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitExam}
              className="h-9 px-5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang nộp bài...' : 'Đồng Ý Nộp Bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Modal Báo cáo Sự cố Kỹ thuật */}
  {showIncidentModal && (
    <div role="dialog" aria-modal="true" aria-label="Báo cáo sự cố kỹ thuật" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Báo cáo sự cố kỹ thuật</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Gửi yêu cầu trợ giúp tới Giám thị phòng thi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIncidentModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-2">Chọn loại sự cố gặp phải:</label>
            <div className="grid grid-cols-2 gap-2">
              {['Sự cố mất mạng / Wifi', 'Màn hình không phản hồi', 'Không hiển thị ảnh / media', 'Sự cố thiết bị cá nhân'].map((quickMsg) => (
                <button
                  key={quickMsg}
                  type="button"
                  onClick={() => setIncidentText(quickMsg)}
                  className={`p-2.5 rounded-xl text-left text-xs font-medium border transition cursor-pointer ${
                    incidentText === quickMsg
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-blue-50/40 hover:border-blue-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mô tả chi tiết:</label>
            <textarea
              rows={3}
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Mô tả cụ thể vấn đề bạn đang gặp phải..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-[15px] font-normal text-slate-800 dark:text-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition resize-none"
            />
          </div>

          {incidentMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold text-center">
              {incidentMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              disabled={sendingIncident}
              onClick={() => setShowIncidentModal(false)}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={sendingIncident || !incidentText.trim()}
              onClick={handleSendIncident}
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {sendingIncident ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── MODAL 1: CẢNH BÁO VI PHẠM QUY CHẾ THI ── */}
  {violationModal.isOpen && (
    <div role="dialog" aria-modal="true" aria-label="Cảnh báo vi phạm quy chế thi" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cảnh báo vi phạm quy chế thi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hệ thống giám sát phòng thi trực tuyến</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hành vi ghi nhận:</span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {violationModal.reason}
            </p>
          </div>

          <div className="flex items-center justify-between py-2.5 border-y border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Số lần vi phạm:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {violationModal.violationCount} / {violationModal.maxAllowed} lần
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Vui lòng không thoát toàn màn hình hoặc chuyển sang ứng dụng khác. Nếu vi phạm quá {violationModal.maxAllowed} lần, bài thi sẽ tự động khóa và nộp bài.
          </p>

          <button
            type="button"
            onClick={() => {
              setViolationModal((prev) => ({ ...prev, isOpen: false }));
              if (attemptData?.config?.requireFullscreen && !document.fullscreenElement) {
                try {
                  document.documentElement.requestFullscreen();
                } catch {}
              }
            }}
            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 text-center cursor-pointer"
          >
            Đã hiểu và tiếp tục làm bài
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ── MODAL 2: BÀI THI ĐÃ ĐƯỢC NỘP TỰ ĐỘNG DO VI PHẠM ── */}
  {violationSubmittedModal.isOpen && (
    <div role="dialog" aria-modal="true" aria-label="Bài thi đã bị khóa" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bài thi đã được nộp tự động</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Vượt quá số lần vi phạm quy chế cho phép</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              Bạn đã vi phạm quy chế thi {violationSubmittedModal.violationCount}/{violationSubmittedModal.maxAllowed} lần cho phép.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Toàn bộ dữ liệu bài làm và nhật ký giám sát đã được gửi về cho giám thị phòng thi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('attemptToken');
              router.push(`/student/online-exam/${violationSubmittedModal.attemptId || attemptData?.attemptId}/result`);
            }}
            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Xem kết quả bài thi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
 </div>
 );
}
