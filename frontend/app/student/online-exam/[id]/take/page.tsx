'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService, AnswerItem, ProctoringEventItem } from '@/lib/services/online-exam.service';
import { Clock, Shield, Flag, CheckCircle, AlertTriangle, Wifi, WifiOff, Send, Maximize2, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { fixHtmlImageUrls, getImageUrl } from '@/lib/media-utils';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';

export default function StudentExamTakePage() {
  const router = useRouter();
  const params = useParams();
  const tokenFromUrl = params?.id as string;

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

  const eventQueue = useRef<ProctoringEventItem[]>([]);
  const pendingAnswersToSave = useRef<Record<string, AnswerItem>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      alert(e?.response?.data?.message || e?.message || 'Không thể tải tệp bài làm');
    }
  };

  useEffect(() => {
    const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
    if (!token || !attemptData?.config) return;

    const pushEvent = (eventType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') => {
      eventQueue.current.push({
        eventType,
        severity,
        metadata: { timestamp: new Date().toISOString(), pageUrl: window.location.href },
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden && attemptData.config.preventTabSwitch) {
        pushEvent('TAB_HIDDEN', 'HIGH');
      }
    };

    const handleBlur = () => {
      if (attemptData.config.preventTabSwitch) {
        pushEvent('WINDOW_BLUR', 'MEDIUM');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attemptData.config.requireFullscreen) {
        pushEvent('FULLSCREEN_EXIT', 'HIGH');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (attemptData.config.preventCopyPaste) {
        e.preventDefault();
        pushEvent('COPY_ATTEMPT', 'MEDIUM');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (attemptData.config.preventCopyPaste) {
        e.preventDefault();
        pushEvent('PASTE_ATTEMPT', 'MEDIUM');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      pushEvent('CONTEXT_MENU_ATTEMPT', 'LOW');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    const eventInterval = setInterval(async () => {
      if (eventQueue.current.length > 0) {
        const batch = [...eventQueue.current];
        eventQueue.current = [];
        try {
          const proctoringResult = await onlineExamService.recordEvents(token, batch);
          if (proctoringResult.autoSubmitted && attemptData?.attemptId) {
            sessionStorage.removeItem('attemptToken');
            router.push(`/student/online-exam/${attemptData.attemptId}/result`);
          }
        } catch (e) {
          console.warn('Failed to send proctoring events', e);
        }
      }
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(eventInterval);
    };
  }, [tokenFromUrl, attemptData, router]);

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
        alert('Chưa đồng bộ được câu trả lời. Vui lòng kiểm tra kết nối mạng rồi thử lại.');
        setSubmitting(false);
        return;
      }
      await onlineExamService.submitAttempt(token);
      sessionStorage.removeItem('attemptToken');
      router.push(`/student/online-exam/${attemptData.attemptId}/result`);
    } catch (err: any) {
      alert(err.message || 'Không thể nộp bài');
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#003896] to-[#0047BA] shadow-lg shadow-blue-500/20 text-white animate-pulse">
          <Clock className="h-7 w-7" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-slate-900">Đang tải đề thi bảo mật...</h3>
          <p className="text-xs font-medium text-slate-500">Vui lòng chờ trong giây lát để hệ thống khởi tạo phòng thi trực tuyến</p>
        </div>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200/90 p-8 rounded-2xl max-w-md w-full text-center shadow-xl space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">Không Thể Truy Cập Bài Thi</h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/student/exam-schedule')}
            className="w-full py-2.5 bg-[#003896] hover:bg-[#002d78] text-white text-xs font-black rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col select-none">
      {/* Enterprise Dark Navy Header */}
      <header className="bg-gradient-to-r from-[#003896] via-[#0047BA] to-[#003082] text-white px-4 sm:px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 font-black text-white text-base shadow-sm">
            {attemptData.paperTitle ? attemptData.paperTitle.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <span className="font-black text-white text-sm sm:text-base tracking-tight block truncate max-w-xs sm:max-w-md">
              {attemptData.paperTitle}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 bg-white/15 border border-white/20 text-sky-100 text-[10px] font-bold rounded-md">
                <Shield className="w-3 h-3 mr-1 text-emerald-300" /> Giám Sát Gian Lận Active
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Sync Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            {syncState === 'SAVED' && (
              <span className="text-emerald-200 flex items-center bg-white/10 px-3 py-1 rounded-full border border-emerald-400/30 font-bold">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-300" /> Đã tự động lưu
              </span>
            )}
            {syncState === 'SAVING' && (
              <span className="text-amber-200 flex items-center bg-white/10 px-3 py-1 rounded-full border border-amber-400/30 font-bold animate-pulse">
                <Wifi className="w-3.5 h-3.5 mr-1.5 text-amber-300" /> Đang đồng bộ...
              </span>
            )}
            {syncState === 'OFFLINE' && (
              <span className="text-rose-200 flex items-center bg-rose-500/20 px-3 py-1 rounded-full border border-rose-400/30 font-bold">
                <WifiOff className="w-3.5 h-3.5 mr-1.5 text-rose-300" /> Mất kết nối
              </span>
            )}
          </div>

          {/* Countdown Clock Box */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm sm:text-base font-black shadow-inner transition-all ${
              remainingSeconds < 300
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-900/40'
                : 'bg-white/10 backdrop-blur-md border-white/20 text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Exam Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center shadow-md shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Nộp Bài
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Question Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          {currentQ && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
              {/* Question Header Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-xl bg-[#003896] text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {currentIdx + 1}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    Mã: {currentQ.code}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-[#003896] font-bold text-xs rounded-lg border border-blue-100">
                    {currentQ.score} điểm
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.questionId)}
                  className={`flex items-center space-x-1.5 text-xs font-black px-3.5 py-2 rounded-xl border transition cursor-pointer active:scale-95 ${
                    currentAns.isFlagged
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
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
              <div className="text-slate-900 text-base sm:text-lg leading-relaxed font-bold space-y-3">
                {currentQ.contentRich && typeof currentQ.contentRich === 'object' && 'html' in currentQ.contentRich ? (
                  <div dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(String((currentQ.contentRich as { html?: string }).html || '')) }} />
                ) : (
                  currentQ.content
                )}

                {/* Media Image Attachments */}
                {currentQ.media && currentQ.media.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {currentQ.media.map((mediaItem: any, idx: number) => {
                      const fullUrl = getImageUrl(mediaItem.url);
                      return (
                        <div
                          key={mediaItem.id || idx}
                          onClick={() => setLightboxUrl(mediaItem.url)}
                          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition hover:border-blue-600 hover:shadow-md"
                          title="Bấm vào để xem ảnh phóng to"
                        >
                          <img
                            src={fullUrl}
                            alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                            className="max-h-52 rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs">
                              <Maximize2 className="h-4 w-4 text-sky-400" /> Phóng to xem rõ ảnh
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
                  <label className="block text-sm font-bold text-slate-700">Bài làm tự luận</label>
                  <textarea
                    value={currentAns.textAnswer || ''}
                    onChange={(e) => handleEssayChange(currentQ.questionId, e.target.value)}
                    className="min-h-[260px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhập bài làm của bạn..."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{(currentAns.textAnswer || '').length} ký tự · Tự động lưu khi nhập</span>
                    <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50">
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
                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                  <p className="text-sm font-bold text-slate-700">Điền đáp án vào từng chỗ trống. Hệ thống tự lưu khi bạn nhập.</p>
                  {(currentQ.blankIndexes || []).map((blankIndex: number) => (
                    <label key={blankIndex} className="block text-sm font-semibold text-slate-700">
                      Chỗ trống {blankIndex}
                      <input
                        value={currentAns.fillBlankAnswers?.find((item: any) => item.blankIndex === blankIndex)?.value || ''}
                        onChange={(event) => handleFillBlankChange(currentQ.questionId, blankIndex, event.target.value)}
                        placeholder={`Nhập đáp án cho chỗ trống ${blankIndex}`}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  ))}
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
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3.5 ${
                        isSelected
                          ? 'bg-blue-50/80 border-[#003896] text-[#003896] shadow-2xs font-bold ring-2 ring-blue-500/20'
                          : 'bg-slate-50/60 border-slate-200/90 text-slate-700 hover:bg-slate-100/90 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-${isMulti ? 'lg' : 'full'} border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSelected
                            ? 'bg-[#003896] border-[#003896] text-white font-black shadow-2xs'
                            : 'border-slate-300 bg-white text-slate-700 font-bold'
                        }`}
                      >
                        <span className="text-xs">{opt.label}</span>
                      </div>
                      <div className="text-xs sm:text-sm leading-relaxed pt-0.5 font-semibold text-slate-800">{opt.content}</div>
                    </div>
                  );
                })}
              </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-black disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Câu trước
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Câu <strong className="font-black text-slate-900">{currentIdx + 1}</strong> / {totalCount}
                </span>
                <button
                  type="button"
                  disabled={currentIdx === totalCount - 1}
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#003896] hover:bg-[#002d78] text-white text-xs font-black disabled:opacity-40 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  Câu tiếp <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Question Navigator */}
        <aside className="w-full lg:w-80 bg-white border-l border-slate-200/90 p-6 flex flex-col shrink-0 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Danh Sách Câu Hỏi</h3>
            <span className="text-[11px] font-bold text-slate-400">{answeredCount}/{totalCount} Đã xong</span>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-600 gap-1.5 pb-2">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-[#003896] mr-1.5"></span> Đã làm ({answeredCount})
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 mr-1.5"></span> Xem lại ({flaggedCount})
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300 mr-1.5"></span> Chưa làm
            </span>
          </div>

          {/* 5-Column Question Grid */}
          <div className="grid grid-cols-5 gap-2.5 p-2 overflow-y-auto flex-1 max-h-[50vh] lg:max-h-none border border-slate-100 rounded-2xl bg-slate-50/50">
            {questions.map((q: any, idx: number) => {
              const ans = answers[q.questionId];
              const isAnswered = Boolean(
                (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                (ans?.textAnswer && ans.textAnswer.trim().length > 0) ||
                Boolean(ans?.fillBlankAnswers?.some((item: any) => item.value?.trim()))
              );
              const isFlagged = Boolean(ans?.isFlagged);
              const isCurrent = idx === currentIdx;

              let btnStyle = 'bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-100 hover:border-slate-300';
              if (isFlagged) {
                btnStyle = 'bg-amber-500 text-white font-black border-amber-500 shadow-2xs hover:bg-amber-600';
              } else if (isAnswered) {
                btnStyle = 'bg-[#003896] text-white font-black border-[#003896] shadow-2xs hover:bg-[#00286b]';
              }

              if (isCurrent) {
                btnStyle += ' ring-2 ring-blue-600 ring-offset-1 z-10 font-extrabold shadow-sm scale-105';
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
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-sm w-full my-auto overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Xác Nhận Nộp Bài Thi</h3>
                <p className="text-slate-500 text-xs font-medium">Kết thúc và chuyển sang màn hình kết quả</p>
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="bg-slate-50/80 p-4 rounded-xl space-y-2 text-xs font-bold border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Tổng số câu hỏi:</span>
                <span className="font-black text-slate-900">{totalCount}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Số câu đã trả lời:</span>
                <span className="font-black">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Số câu chưa trả lời:</span>
                <span className="font-black">{totalCount - answeredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang nộp bài...' : 'Đồng Ý Nộp Bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
