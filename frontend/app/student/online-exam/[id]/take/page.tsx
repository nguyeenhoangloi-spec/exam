'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService, AnswerItem, ProctoringEventItem } from '@/lib/services/online-exam.service';
import { Clock, Shield, Flag, CheckCircle, CheckCircle2, AlertTriangle, Wifi, WifiOff, Send, Maximize2, ChevronLeft, ChevronRight, HelpCircle, X, Info } from 'lucide-react';
import { fixHtmlImageUrls, getImageUrl } from '@/lib/media-utils';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { Toast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/Button';
import { FillBlankQuestionRenderer } from '@/components/question-bank/FillBlankQuestionRenderer';
import { QuestionMediaPlayer } from '@/components/exam/QuestionMediaPlayer';
import { DynamicImage } from '@/components/ui/DynamicImage';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { BookOpen, User, Ticket, FileText, Layers } from 'lucide-react';

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
  const flushPendingAnswersRef = useRef<(() => Promise<boolean>) | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showExamProfileDrawer, setShowExamProfileDrawer] = useState(false);

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
      setIsSubmitted(true);
      const synced = await flushPendingAnswersRef.current?.();
      if (!synced || Object.keys(pendingAnswersToSave.current).length > 0) {
        throw new Error('Chưa đồng bộ được câu trả lời trước khi tự động nộp bài.');
      }
      await onlineExamService.submitAttempt(token);
      router.push(`/student/online-exam/${attemptData.attemptId}/result`);
    } catch (err) {
      console.error('Auto submit failed:', err);
      setIsSubmitted(false);
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
    if (!token) return false;
    if (payloadBatch.length === 0) return true;
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
    flushPendingAnswersRef.current = flushPendingAnswers;
  }, [flushPendingAnswers]);

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
      const synced = await flushPendingAnswers();
      if (!synced || Object.keys(pendingAnswersToSave.current).length > 0) {
        throw new Error('Chưa đồng bộ được câu trả lời. Vui lòng kiểm tra kết nối mạng rồi thử lại.');
      }
      await onlineExamService.submitAttempt(token);
      setIsSubmitted(true);
      router.push(`/student/online-exam/${attemptData.attemptId}/result`);
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Không thể nộp bài' });
      setSubmitting(false);
      setIsSubmitted(false);
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

  if (submitting || isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <h3 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">Đã nộp bài thi thành công</h3>
          <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400">Đang chuyển tiếp đến trang kết quả...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 text-white animate-pulse">
          <Clock className="h-7 w-7" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">Đang tải đề thi bảo mật...</h3>
          <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400">Vui lòng chờ trong giây lát để hệ thống khởi tạo phòng thi trực tuyến</p>
        </div>
      </div>
    );
  }

  if ((error || !attemptData) && !isSubmitted && !submitting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-xl space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">Không thể truy cập bài thi</h2>
            <p className="text-slate-500 dark:text-slate-400 text-type-helper font-normal leading-relaxed">{error}</p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => router.push('/student/exam-schedule')}
          >
            Quay về lịch thi
          </Button>
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
        <div
          onClick={() => setShowExamProfileDrawer(true)}
          className="flex items-center space-x-3.5 cursor-pointer group"
          title="Bấm để xem chi tiết thông tin ca thi & quy chế"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 font-semibold text-white text-type-body shadow-sm group-hover:bg-white/20 transition">
            {attemptData.paperTitle ? attemptData.paperTitle.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <span className="font-semibold text-white text-type-body-sm sm:text-type-body tracking-tight block truncate max-w-xs sm:max-w-md group-hover:text-blue-200 transition">
              {attemptData.paperTitle}
            </span>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="ui-pill ui-pill-solid inline-flex items-center px-2.5 py-0.5 bg-amber-400/20 border border-amber-300/40 text-amber-200 text-type-helper font-medium rounded-full">
                <FileText className="w-3.5 h-3.5 mr-1 text-amber-300" /> Mã đề: {attemptData.paperCode || '101'}
              </span>
              <span className="ui-pill ui-pill-solid inline-flex items-center px-2.5 py-0.5 bg-white/15 border border-white/20 text-blue-100 text-type-helper font-medium rounded-full">
                <Shield className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Giám sát trực tuyến kích hoạt
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-4 sm:space-x-5">
          {/* Sync Status Badge - Chỉ hiển thị khi Đang đồng bộ hoặc Mất kết nối */}
          <div className="hidden sm:flex items-center text-type-body font-medium">
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
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl tabular-nums text-type-body-sm sm:text-type-body font-semibold transition-all ${
              remainingSeconds < 300
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-950/40'
                : 'bg-white/15 text-white backdrop-blur-xs'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Button Báo cáo sự cố */}
          <button
            type="button"
            onClick={() => setShowIncidentModal(true)}
            className="px-3 py-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 font-semibold text-type-helper rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Gửi báo cáo sự cố kỹ thuật cho giám thị"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Báo sự cố</span>
          </button>

          {/* Submit Exam Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-type-helper rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
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
                  <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold text-type-body-sm shadow-xs">
                    {currentIdx + 1}
                  </span>
                  <IdentifierBadge tone="neutral">Mã: {currentQ.code}</IdentifierBadge>
                  <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-300">
                    {currentQ.score} điểm
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.questionId)}
                  className={`flex items-center space-x-1.5 text-type-helper font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer active:scale-95 ${currentAns.isFlagged
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
                <div className="text-slate-900 dark:text-slate-100 text-type-reading font-semibold space-y-3">
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
                        const examMediaMode = attemptData?.mediaMode || (attemptData?.mediaMaxPlays === 0 ? 'REFERENCE' : 'STRICT_EXAM');
                        const examMaxPlays = attemptData?.mediaMaxPlays !== undefined ? attemptData?.mediaMaxPlays : (mediaItem.maxPlays !== undefined ? mediaItem.maxPlays : 2);

                        if (mime.startsWith('video/')) {
                          return (
                            <QuestionMediaPlayer
                              key={mediaItem.id || idx}
                              attemptId={tokenFromUrl}
                              questionId={currentQ.questionId}
                              src={fullUrl}
                              type="video"
                              fileName={mediaItem.fileName}
                              maxPlays={examMaxPlays}
                              mode={examMediaMode}
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
                              maxPlays={examMaxPlays}
                              mode={examMediaMode}
                            />
                          );
                        }
                        // Default: image
                        return (
                          <div
                            key={mediaItem.id || idx}
                            onClick={() => setLightboxUrl(mediaItem.url)}
                            className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                            title="Bấm vào để xem ảnh phóng to"
                          >
                            <DynamicImage
                              src={fullUrl}
                              alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                              className="max-h-52 rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Phóng to xem ảnh">
                              <Maximize2 className="h-4.5 w-4.5 text-white" />
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
                    <div className="flex items-center justify-between">
                      <label className="block text-type-body font-medium text-slate-700 dark:text-slate-300">
                        Nội dung bài làm tự luận
                      </label>
                      <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                        {(currentAns.textAnswer || '').length} ký tự
                      </span>
                    </div>
                    <textarea
                      value={currentAns.textAnswer || ''}
                      onChange={(e) => handleEssayChange(currentQ.questionId, e.target.value)}
                      className="min-h-[220px] h-[260px] w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-type-reading font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/40"
                      placeholder="Nhập trực tiếp câu trả lời tự luận của bạn vào đây..."
                    />
                    <div className="flex items-center justify-between text-type-helper text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Tự động lưu bài làm theo thời gian thực khi bạn nhập
                      </span>
                    </div>
                  </div>
                ) : currentQ.type === 'FILL_BLANK' ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 text-type-helper text-slate-700 dark:text-slate-200">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="leading-relaxed font-normal">
                      <strong className="font-semibold text-slate-900 dark:text-slate-100">Hướng dẫn:</strong> Nhập trực tiếp đáp án vào từng ô trống trong câu hỏi phía trên. Hệ thống tự động ghi nhận và lưu bài làm của bạn khi bạn nhập.
                    </p>
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
                            <span className="text-type-helper">{opt.label}</span>
                          </div>
                          <div className="text-type-reading pt-0.5 font-normal text-slate-800 dark:text-slate-200">{opt.content}</div>
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
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-type-body font-medium disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="h-4 w-4" /> Câu trước
                  </button>
                  <span className="text-type-body font-medium text-slate-500 dark:text-slate-400">
                    Câu <strong className="font-semibold text-slate-900 dark:text-slate-100">{currentIdx + 1}</strong> / {totalCount}
                  </span>
                  <button
                    type="button"
                    disabled={currentIdx === totalCount - 1}
                    onClick={() => setCurrentIdx((prev) => prev + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-type-body font-medium disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-xs"
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
              <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">Danh sách câu hỏi</h3>
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">{answeredCount}/{totalCount} đã hoàn thành</span>
            </div>

            {/* Legend Indicators */}
            <div className="flex items-center justify-between text-type-helper font-medium text-slate-500 dark:text-slate-400 gap-1 pb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Đã làm ({answeredCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Xem lại ({flaggedCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span> Chưa làm
              </span>
            </div>

            {/* 5-Column Question Grid */}
            <div className="grid grid-cols-5 gap-2.5 p-2.5 content-start auto-rows-max overflow-y-auto max-h-[55vh] border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
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
                    className={`h-9.5 w-full rounded-xl border text-type-helper flex items-center justify-center relative transition duration-150 cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                    {isFlagged && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-200 rounded-full"></span>}
                  </button>
                );
              })}
            </div>

            {/* Quick Exam Tips & Guidance note */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-1.5 text-type-helper text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Lưu ý khi làm bài</span>
              </div>
              <p className="text-type-helper font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                Hệ thống tự động lưu bài làm liên tục. Bạn có thể bấm chọn trực tiếp số câu ở bảng trên để chuyển nhanh qua lại giữa các câu.
              </p>
            </div>
          </aside>
        </div>

 {/* Submit Confirmation Modal */}
 <Modal
    isOpen={showSubmitModal}
    onClose={() => setShowSubmitModal(false)}
    title="Xác nhận nộp bài thi?"
    size="md"
  >
    <div className="space-y-4">
      <p className="text-type-helper sm:text-type-body-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
        Bạn có chắc chắn muốn nộp bài thi? Sau khi nộp bài, hệ thống sẽ khóa bài làm và tính điểm ngay lập tức.
      </p>

      {/* Statistics Summary - Layout phẳng với đường phân cách thanh mảnh */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-type-helper sm:text-type-body-sm">
        <div className="flex items-center justify-between py-2.5 text-slate-600 dark:text-slate-400">
          <span>Tổng số câu hỏi</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{totalCount}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 text-blue-600 dark:text-blue-400">
          <span>Số câu đã trả lời</span>
          <span className="font-semibold tabular-nums">{answeredCount}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 text-amber-600 dark:text-amber-400">
          <span>Số câu chưa trả lời</span>
          <span className="font-semibold tabular-nums">{totalCount - answeredCount}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="secondary"
          size="md"
          disabled={submitting}
          onClick={() => setShowSubmitModal(false)}
        >
          Tiếp tục làm bài
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={submitting}
          isLoading={submitting}
          onClick={handleSubmitExam}
        >
          Đồng ý nộp bài
        </Button>
      </div>
    </div>
  </Modal>

  {/* Modal Báo cáo Sự cố Kỹ thuật */}
  <Modal
    isOpen={showIncidentModal}
    onClose={() => setShowIncidentModal(false)}
    title="Báo cáo sự cố kỹ thuật"
    size="md"
  >
    <div className="space-y-4">
      <p className="text-type-helper sm:text-type-body-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
        Gửi yêu cầu trợ giúp tới giám thị phòng thi nếu gặp trục trặc kỹ thuật trong quá trình làm bài.
      </p>

      <div className="space-y-2">
        <label className="block text-type-body font-medium text-slate-800 dark:text-slate-100">
          Chọn loại sự cố gặp phải:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Sự cố mất mạng / Wifi', 'Màn hình không phản hồi', 'Không hiển thị ảnh / media', 'Sự cố thiết bị cá nhân'].map((quickMsg) => (
            <button
              key={quickMsg}
              type="button"
              onClick={() => setIncidentText(quickMsg)}
              className={`p-2.5 rounded-xl text-left text-type-helper font-medium border transition cursor-pointer ${
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

      <div className="space-y-1.5">
        <label className="block text-type-body font-medium text-slate-800 dark:text-slate-100">
          Mô tả chi tiết:
        </label>
        <textarea
          rows={3}
          value={incidentText}
          onChange={(e) => setIncidentText(e.target.value)}
          placeholder="Mô tả cụ thể vấn đề bạn đang gặp phải..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition resize-none shadow-2xs"
        />
      </div>

      {incidentMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-type-helper font-semibold text-center">
          {incidentMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="secondary"
          size="md"
          disabled={sendingIncident}
          onClick={() => setShowIncidentModal(false)}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={sendingIncident || !incidentText.trim()}
          isLoading={sendingIncident}
          onClick={handleSendIncident}
        >
          Gửi báo cáo sự cố
        </Button>
      </div>
    </div>
  </Modal>

  {/* ── MODAL 1: CẢNH BÁO VI PHẠM QUY CHẾ THI ── */}
  {violationModal.isOpen && (
    <div role="dialog" aria-modal="true" aria-label="Cảnh báo vi phạm quy chế thi" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl overflow-hidden animate-modal-dialog will-change-transform">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">Cảnh báo vi phạm quy chế thi</h3>
            <p className="text-type-helper text-slate-500 dark:text-slate-400">Hệ thống giám sát phòng thi trực tuyến</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">Hành vi ghi nhận:</span>
            <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {violationModal.reason}
            </p>
          </div>

          <div className="flex items-center justify-between py-2.5 border-y border-slate-100 dark:border-slate-800 text-type-helper">
            <span className="text-slate-600 dark:text-slate-400">Số lần vi phạm:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {violationModal.violationCount} / {violationModal.maxAllowed} lần
            </span>
          </div>

          <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed">
            Vui lòng không thoát toàn màn hình hoặc chuyển sang ứng dụng khác. Nếu vi phạm quá {violationModal.maxAllowed} lần, bài thi sẽ tự động khóa và nộp bài.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              setViolationModal((prev) => ({ ...prev, isOpen: false }));
              if (attemptData?.config?.requireFullscreen && !document.fullscreenElement) {
                try {
                  document.documentElement.requestFullscreen();
                } catch {}
              }
            }}
          >
            Tiếp tục làm bài
          </Button>
        </div>
      </div>
    </div>
  )}

  {/* ── MODAL 2: BÀI THI ĐÃ ĐƯỢC NỘP TỰ ĐỘNG DO VI PHẠM ── */}
  {violationSubmittedModal.isOpen && (
    <div role="dialog" aria-modal="true" aria-label="Bài thi đã bị khóa" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-modal-backdrop">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl overflow-hidden animate-modal-dialog will-change-transform">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">Bài thi đã được nộp tự động</h3>
            <p className="text-type-helper text-slate-500 dark:text-slate-400">Vượt quá số lần vi phạm quy chế cho phép</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <p className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              Bạn đã vi phạm quy chế thi <span className="text-rose-600 dark:text-rose-400 font-semibold">{violationSubmittedModal.violationCount}/{violationSubmittedModal.maxAllowed}</span> lần cho phép.
            </p>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed">
              Toàn bộ dữ liệu bài làm và nhật ký giám sát đã được gửi về cho giám thị phòng thi.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            rightIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => {
              setIsSubmitted(true);
              router.push(`/student/online-exam/${violationSubmittedModal.attemptId || attemptData?.attemptId}/result`);
            }}
          >
            Xem kết quả bài thi
          </Button>
        </div>
      </div>
    </div>
  )}

      {/* Candidate & Paper Profile Drawer */}
      <ProfileDrawer
        isOpen={showExamProfileDrawer}
        onClose={() => setShowExamProfileDrawer(false)}
        title={attemptData?.paperTitle || 'Bài thi trực tuyến'}
        subtitle="Hệ thống khảo thí trực tuyến"
        avatarText={attemptData?.paperTitle?.slice(0, 2)?.toUpperCase() || 'BT'}
        badge={{
          label: 'Đang làm bài',
          status: 'IN_PROGRESS',
        }}
        details={[
          { label: 'Tên đề thi', value: attemptData?.paperTitle || '---', icon: BookOpen },
          { label: 'Tổng số câu hỏi', value: `${questions?.length || 0} câu hỏi`, icon: Layers },
          { label: 'Tiến độ làm bài', value: `${answeredCount} / ${totalCount} câu đã trả lời` },
          { label: 'Thời gian còn lại', value: formatTime(remainingSeconds), icon: Clock },
          { label: 'Số lần cảnh báo vi phạm', value: `${violationCountRef.current} / 5 lần cho phép`, icon: Shield },
        ]}
        extraSections={[
          {
            title: 'Lưu ý giám sát an toàn thi',
            content: (
              <div className="space-y-2 text-type-helper text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                <p>• Mọi thay đổi đáp án được tự động đồng bộ tức thời với máy chủ.</p>
                <p>• Không bấm F5, không chuyển tab hoặc mở ứng dụng ngoài để tránh bị ghi nhận vi phạm quy chế.</p>
              </div>
            ),
          },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
 </div>
 );
}
