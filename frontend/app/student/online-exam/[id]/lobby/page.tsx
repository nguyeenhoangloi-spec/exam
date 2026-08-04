'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Clock, ShieldCheck, AlertCircle, CheckCircle2, Monitor, ArrowRight } from 'lucide-react';

export default function StudentExamLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const loadEligibility = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.checkEligibility(scheduleId);
      // Normalize the backend envelope so the existing presentation fields
      // (schedule, student, roomStudentInfo, config) remain available at the
      // top level while preserving the original response for diagnostics.
      setEligibility(res?.data ? { ...res, ...res.data } : res);
      setRulesAccepted(false);

      if (!res.isEligible) {
        setError(res.reason || 'Bạn chưa đủ điều kiện dự thi ca thi này.');
      }

      if (res.existingAttempt && ['IN_PROGRESS', 'DISCONNECTED'].includes(res.existingAttempt.status)) {
        sessionStorage.setItem('attemptToken', res.existingAttempt.attemptToken);
        router.push(`/student/online-exam/${res.existingAttempt.attemptToken}/take`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể kiểm tra điều kiện dự thi');
    } finally {
      setLoading(false);
    }
  }, [router, scheduleId]);

  useEffect(() => {
    if (!scheduleId) return;
    void loadEligibility();
  }, [loadEligibility, scheduleId]);

  const handleStartExam = async () => {
    try {
      setStarting(true);
      setError(null);

      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {
          console.warn('Fullscreen denied or not supported');
        }
      }

      const res = await onlineExamService.startAttempt(scheduleId, navigator.userAgent, undefined, rulesAccepted);
      sessionStorage.setItem('attemptToken', res.attemptToken);
      router.push(`/student/online-exam/${res.attemptToken}/take`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài thi');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-lg">Đang kiểm tra điều kiện dự thi...</span>
      </div>
    );
  }

  // Eligibility API trả dữ liệu nghiệp vụ trong `data`; fallback shape cũ
  // giúp Lobby tương thích trong thời gian backend/frontend được cập nhật.
  const eligibilityData = eligibility?.data ?? eligibility ?? {};
  const examInfo = eligibilityData.examInfo;
  const schedule = eligibilityData.schedule ?? (examInfo ? {
    subject: { subjectName: examInfo.subjectName, subjectCode: examInfo.subjectCode },
    examPeriod: { name: examInfo.examPeriodName },
    onlineExamConfig: { examPaper: { durationMinutes: examInfo.durationMinutes } },
  } : undefined);
  const student = eligibilityData.student;
  const config = eligibilityData.config ?? schedule?.onlineExamConfig;
  const paper = config?.examPaper ?? schedule?.onlineExamConfig?.examPaper;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="border-b border-slate-800 pb-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full uppercase tracking-wider">
              Thi Trắc Nghiệm Trực Tuyến
            </span>
            <h1 className="text-2xl font-bold mt-2 text-white">{schedule?.subject?.subjectName}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Mã môn: {schedule?.subject?.subjectCode} | Kỳ thi: {schedule?.examPeriod?.name}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/50">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium">Thời gian: {schedule?.onlineExamConfig?.examPaper?.durationMinutes || 60} phút</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Thông tin Thí sinh</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Họ và tên:</span>
                <span className="font-semibold text-slate-200">{student?.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Mã sinh viên:</span>
                <span className="font-mono font-semibold text-indigo-400">{student?.studentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SBD / Số ghế:</span>
                <span className="font-medium text-slate-200">
                  {eligibility?.roomStudentInfo?.examNumber || 'Chưa xếp'} (Ghế: {eligibility?.roomStudentInfo?.seatNumber || '-'})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Kiểm tra Yêu cầu Bài thi</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                Đồng hồ đếm ngược Server tự động
              </li>
              <li className="flex items-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                Tự động lưu đáp án khi chọn
              </li>
              <li className={`flex items-center ${config?.preventTabSwitch !== false ? 'text-amber-400' : 'text-slate-400'}`}>
                <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
                Giám sát chuyển tab & toàn màn hình
              </li>
              <li className="flex items-center text-slate-300">
                <Monitor className="w-4 h-4 mr-2 shrink-0 text-indigo-400" />
                Trình duyệt đã sẵn sàng
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-8 text-amber-300/90 text-sm">
          <p className="font-semibold mb-1">⚠️ Nội quy thi nghiêm ngặt:</p>
          <p className="text-amber-400/80 leading-relaxed">
            Hệ thống tự động ghi nhận mọi hành vi chuyển tab, thoát toàn màn hình, mở công cụ lập trình hoặc mất kết nối.
            Bài thi sẽ bị tự động khóa và nộp nếu vi phạm quá số lần quy định.
          </p>
        </div>

        {config?.requireRulesAcceptance !== false && (
          <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(event) => setRulesAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-500"
            />
            <span>
              Tôi đã đọc, hiểu và đồng ý chấp hành toàn bộ quy định thi. Tôi hiểu hệ thống có thể ghi nhận vi phạm và tự động khóa hoặc nộp bài theo quy chế.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition"
          >
            Quay lại
          </button>
          <button
            onClick={handleStartExam}
            disabled={starting || !eligibility?.isEligible || (config?.requireRulesAcceptance !== false && !rulesAccepted)}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center shadow-lg shadow-indigo-600/30 transition"
          >
            {starting ? (
              <span>Đang khởi tạo bài thi...</span>
            ) : (
              <>
                <span>Bắt đầu Làm bài</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
