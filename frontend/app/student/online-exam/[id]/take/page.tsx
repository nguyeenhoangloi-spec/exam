'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService, AnswerItem, ProctoringEventItem } from '@/lib/services/online-exam.service';
import { Clock, Shield, Flag, CheckCircle, AlertTriangle, Wifi, WifiOff, Send, Maximize2 } from 'lucide-react';
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
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds: string[]; textAnswer: string; isFlagged: boolean; version: number }>>({});
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
            isFlagged: ans.isFlaggedForReview || false,
            version: ans.version || 1,
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

  const triggerAutoSave = useCallback(
    (questionId: string, selectedOptionIds: string[], textAnswer: string, isFlagged: boolean, currentVersion: number) => {
      const token = tokenFromUrl || sessionStorage.getItem('attemptToken');
      if (!token) return;

      const newVersion = currentVersion + 1;
      const item: AnswerItem = {
        questionId,
        selectedOptionIds,
        textAnswer,
        isFlaggedForReview: isFlagged,
        version: newVersion,
        clientTimestamp: new Date().toISOString(),
      };

      pendingAnswersToSave.current[questionId] = item;
      setSyncState('SAVING');

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        try {
          const payloadBatch = Object.values(pendingAnswersToSave.current);
          if (payloadBatch.length === 0) return;

          await onlineExamService.saveAnswers(token, payloadBatch);
          pendingAnswersToSave.current = {};
          setSyncState('SAVED');
        } catch (err) {
          console.error('Auto save failed:', err);
          setSyncState('OFFLINE');
        }
      }, 1000);
    },
    [tokenFromUrl],
  );

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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-300">Đang tải đề thi bảo mật...</span>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không Thể Truy Cập Bài Thi</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/student/exam-schedule')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl"
          >
            Về Lịch Thi
          </button>
        </div>
      </div>
    );
  }

  const questions = attemptData.questions || [];
  const currentQ = questions[currentIdx];
  const currentAns = answers[currentQ?.questionId] || { selectedOptionIds: [], textAnswer: '', isFlagged: false };

  const totalCount = questions.length;
  const answeredCount = Object.values(answers).filter((a) => a.selectedOptionIds && a.selectedOptionIds.length > 0).length;
  const flaggedCount = Object.values(answers).filter((a) => a.isFlagged).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col select-none">
      <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-slate-900 text-lg tracking-tight">{attemptData.paperTitle}</span>
          <span className="hidden md:inline-flex items-center px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium rounded-full">
            <Shield className="w-3.5 h-3.5 mr-1" /> Giám Sát Chống Gian Lận
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-xs">
            {syncState === 'SAVED' && (
              <span className="text-emerald-400 flex items-center bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã lưu
              </span>
            )}
            {syncState === 'SAVING' && (
              <span className="text-amber-400 flex items-center bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse">
                <Wifi className="w-3.5 h-3.5 mr-1" /> Đang lưu...
              </span>
            )}
            {syncState === 'OFFLINE' && (
              <span className="text-rose-400 flex items-center bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <WifiOff className="w-3.5 h-3.5 mr-1" /> Mất kết nối
              </span>
            )}
          </div>

          <div
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border font-mono text-base font-bold ${remainingSeconds < 300
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                : 'bg-amber-50 border-amber-200 text-amber-600'
              }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center shadow-lg shadow-emerald-600/20 transition"
          >
            <Send className="w-4 h-4 mr-1.5" /> Nộp Bài
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          {currentQ && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentIdx + 1}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Mã: {currentQ.code}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200">
                    {currentQ.score} điểm
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFlag(currentQ.questionId)}
                  className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${currentAns.isFlagged
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{currentAns.isFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

              {lightboxUrl && (
                <ImageLightboxModal
                  imageUrl={lightboxUrl}
                  altText={`Hình minh họa câu hỏi mã ${currentQ.code}`}
                  onClose={() => setLightboxUrl(null)}
                />
              )}

              <div className="text-slate-800 text-base md:text-lg leading-relaxed font-bold mb-4 space-y-3">
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
                          className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 transition hover:border-blue-500 hover:shadow-md"
                          title="Bấm vào để xem ảnh phóng to"
                        >
                          <img
                            src={fullUrl}
                            alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                            className="max-h-48 rounded-lg object-contain bg-white transition duration-200 group-hover:scale-105"
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

              <div className="space-y-3 mb-8">
                {currentQ.options?.map((opt: any) => {
                  const isSelected = currentAns.selectedOptionIds?.includes(opt.id);
                  const isMulti = currentQ.type === 'MULTIPLE_CHOICE';

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.questionId, opt.id, isMulti)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-${isMulti ? 'md' : 'full'
                          } border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-200 bg-white text-slate-700'
                          }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                      </div>
                      <div className="text-sm md:text-base leading-relaxed">{opt.content}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold disabled:opacity-40 transition"
                >
                  ← Câu trước
                </button>
                <span className="text-xs text-slate-500">
                  Câu {currentIdx + 1} / {totalCount}
                </span>
                <button
                  disabled={currentIdx === totalCount - 1}
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold disabled:opacity-40 transition"
                >
                  Câu tiếp →
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Danh Sách Câu Hỏi</h3>

          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-200">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded bg-blue-600 mr-1.5"></span> Đã làm ({answeredCount})
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded bg-amber-500 mr-1.5"></span> Xem lại ({flaggedCount})
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 mr-1.5"></span> Chưa làm
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 overflow-y-auto flex-1 max-h-[60vh] md:max-h-none pr-1">
            {questions.map((q: any, idx: number) => {
              const ans = answers[q.questionId];
              const isAnswered = ans?.selectedOptionIds && ans.selectedOptionIds.length > 0;
              const isFlagged = ans?.isFlagged;
              const isCurrent = idx === currentIdx;

              let btnStyle = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100';
              if (isFlagged) {
                btnStyle = 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold';
              } else if (isAnswered) {
                btnStyle = 'bg-blue-600 border-blue-500 text-white font-bold';
              }

              if (isCurrent) {
                btnStyle += ' ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950';
              }

              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-10 rounded-xl border text-xs flex items-center justify-center relative transition ${btnStyle}`}
                >
                  {idx + 1}
                  {isFlagged && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>}
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác Nhận Nộp Bài Thi</h3>
            <p className="text-slate-400 text-sm mb-6">Bạn có chắc chắn muốn kết thúc và nộp bài thi ngay bây giờ?</p>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm mb-6 border border-slate-200">
              <div className="flex justify-between text-slate-300">
                <span>Tổng số câu hỏi:</span>
                <span className="font-semibold text-slate-900">{totalCount}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Số câu đã trả lời:</span>
                <span className="font-semibold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Số câu chưa trả lời:</span>
                <span className="font-semibold">{totalCount - answeredCount}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
              >
                Tiếp tục làm bài
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center"
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
