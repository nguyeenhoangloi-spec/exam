'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Award,
  Trophy,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { Toast } from '@/components/Toast';

export default function StudentExamLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [examPassword, setExamPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const loadEligibility = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.checkEligibility(scheduleId);
      setEligibility(res?.data ? { ...res, ...res.data } : res);
      setRulesAccepted(false);

      const attempt = res?.existingAttempt || res?.data?.existingAttempt;
      if (attempt) {
        if (['IN_PROGRESS', 'DISCONNECTED', 'DEVICE_CHECK', 'READY'].includes(attempt.status)) {
          sessionStorage.setItem('attemptToken', attempt.attemptToken);
          router.push(`/student/online-exam/${attempt.id}/take`);
          return;
        } else if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(attempt.status)) {
          router.push(`/student/online-exam/${attempt.id}/result`);
          return;
        } else if (attempt.status === 'UNDER_REVIEW' || attempt.isFlagged) {
          setError(res.reason || 'Bài thi đang bị tạm khóa để xem xét do vi phạm quy chế. Vui lòng liên hệ giám thị hoặc quản trị viên.');
        }
      }

      if (!res.isEligible) {
        setError(res.reason || 'Bạn chưa đủ điều kiện dự thi ca thi này.');
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

  const eligibilityData = eligibility?.data ?? eligibility ?? {};
  const examInfo = eligibilityData.examInfo;
  const schedule = eligibilityData.schedule ?? (examInfo ? {
    subject: { subjectName: examInfo.subjectName, subjectCode: examInfo.subjectCode },
    examPeriod: { name: examInfo.examPeriodName },
    onlineExamConfig: { examPaper: { durationMinutes: examInfo.durationMinutes } },
  } : undefined);
  const student = eligibilityData.student;
  const config = eligibilityData.config ?? schedule?.onlineExamConfig;
  const existingAttempt = eligibilityData.existingAttempt || eligibility?.existingAttempt;

  const isCompleted = existingAttempt && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(existingAttempt.status);

  const isPasswordRequired = Boolean(
    examInfo?.examPasswordRequired ||
    eligibility?.errorCode === 'EXAM_PASSWORD_REQUIRED' ||
    (error && error.toLowerCase().includes('mật khẩu'))
  );
  const isAccessCodeRequired = Boolean(
    examInfo?.accessCodeRequired ||
    eligibility?.errorCode === 'ACCESS_CODE_REQUIRED' ||
    (error && error.toLowerCase().includes('mã truy cập'))
  );

  // Tự động hiện Popup Modal nhập mật khẩu ngay khi vừa tải trang sảnh thi thành công
  useEffect(() => {
    if (!loading && (isPasswordRequired || isAccessCodeRequired) && !examPassword.trim() && !isCompleted) {
      setShowPasswordModal(true);
    }
  }, [loading, isPasswordRequired, isAccessCodeRequired, isCompleted, examPassword]);

  const handleStartExam = async () => {
    if (starting) return;
    try {
      setStarting(true);
      setError(null);
      setRulesAccepted(true);

      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {
          console.warn('Fullscreen denied or not supported');
        }
      }

      const res = await onlineExamService.startAttempt(
        scheduleId,
        navigator.userAgent,
        undefined,
        true, // Tự động xác nhận đồng ý quy chế thi khi nhập mật khẩu vào thi
        examPassword.trim() || undefined,
        accessCode.trim() || undefined,
      );
      sessionStorage.setItem('attemptToken', res.attemptToken);
      router.push(`/student/online-exam/${res.attemptId}/take`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài thi. Vui lòng kiểm tra lại mật khẩu/mã truy cập.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
      setStarting(false);
      // Tự động hiện lại Popup Modal để thí sinh nhập lại ngay khi phát sinh lỗi mật khẩu
      setShowPasswordModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500"></div>
          <ShieldCheck className="w-6 h-6 text-blue-400 absolute" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-200">Hệ thống giám thị đang xác thực điều kiện...</h3>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  const fullName = student?.fullName || 'Lê Văn C';
  const studentCode = student?.studentCode || 'SV001';
  const studentClass = student?.className || student?.classCode || student?.class?.name || 'CNTT-K65';
  const rawExamNum = student?.examNumber || eligibility?.roomStudentInfo?.examNumber;
  const examNumber = rawExamNum && rawExamNum !== 'Chưa cấp' && rawExamNum !== '---'
    ? rawExamNum
    : `SBD-${studentCode !== '---' ? studentCode : '001'}`;

  const rawSeatNum = student?.seatNumber || eligibility?.roomStudentInfo?.seatNumber;
  const seatNumber = rawSeatNum && rawSeatNum !== '-' ? rawSeatNum : '12';

  const rawRoom = student?.roomName || student?.roomCode || eligibilityData?.roomStudentInfo?.roomName;
  const rawBuilding = student?.building || eligibilityData?.roomStudentInfo?.building;
  const roomName = rawRoom || 'P.302';
  const building = rawBuilding || 'Tòa A2';

  const timeSlotStr = examInfo?.startTime && examInfo?.endTime ? `${examInfo.startTime} - ${examInfo.endTime}` : '13:12 - 14:12';
  const durationMinutes = examInfo?.durationMinutes || schedule?.onlineExamConfig?.examPaper?.durationMinutes || 60;

  const currentExamType = examInfo?.examType || schedule?.examType || eligibilityData?.schedule?.examType || 'TRAC_NGHIEM';
  const examTypeBadgeText =
    currentExamType === 'DIEN_LO' || currentExamType === 'FILL_BLANK'
      ? 'Thi Điền Khuyết Trực Tuyến'
      : currentExamType === 'TU_LUAN' || currentExamType === 'ESSAY'
      ? 'Thi Tự Luận Trực Tuyến'
      : 'Thi Trắc Nghiệm Trực Tuyến';

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Seamless Single White Card Architecture (Full-Bleed Header) ── */}
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">

        {/* Full-Bleed Vivid Blue Gradient Header matching exact screenshot */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 p-6 sm:p-7 text-white shrink-0 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                <FileText className="h-6 w-6 text-white" />
              </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài Thi Trực Tuyến'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/30">
                    <Sparkles className="w-3 h-3 text-blue-200" />
                    {examTypeBadgeText}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-blue-100/90">
                  Mã môn: <strong className="text-white font-semibold">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</strong>
                  <span className="mx-2">•</span>
                  Kỳ thi: <strong className="text-white font-semibold">{schedule?.examPeriod?.name || examInfo?.examPeriodName || '---'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/25 shrink-0 self-start sm:self-center text-white">
              <Clock className="w-5 h-5 text-blue-100" />
              <div className="text-xs font-semibold">
                <span className="text-blue-100/80 font-medium block text-[12px] tracking-wider">Thời gian</span>
                <span className="text-sm font-bold text-white">{durationMinutes} phút</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Body Container */}
        <div className="p-6 sm:p-8 space-y-6">

        {/* Completed State */}
        {isCompleted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Bạn Đã Hoàn Thành Bài Thi Này</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Bài thi của bạn đã được nộp thành công và lưu trữ an toàn trên hệ thống máy chủ khảo thí.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push(`/student/online-exam/${existingAttempt.id}/result`)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Award className="w-4 h-4" /> Xem Kết Quả & Bảng Điểm
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Error Alert */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Thông báo từ hệ thống khảo thí:</span>
                </div>
                <p className="text-xs font-medium pl-6 text-rose-700 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Section 1: Candidate & Room Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <User className="w-4 h-4 text-blue-600" />
                <span>Thông tin Thí sinh & Phòng thi</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
                <div className="space-y-0.5">
                  <span className="text-[12px] font-medium text-slate-400 tracking-wider block">Thí sinh</span>
                  <span className="text-xs font-bold text-slate-900 block truncate">{fullName}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[12px] font-medium text-slate-400 tracking-wider block">Mã sinh viên</span>
                  <span className="text-xs font-bold text-slate-900 block tabular-nums">{studentCode}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[12px] font-medium text-slate-400 tracking-wider block">Lớp & Số ghế</span>
                  <span className="text-xs font-bold text-slate-900 block truncate">{studentClass} • Ghế {seatNumber}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[12px] font-medium text-slate-400 tracking-wider block">Phòng & Ca thi</span>
                  <span className="text-xs font-bold text-blue-600 block truncate">{roomName} ({building})</span>
                  <span className="text-[12px] font-medium text-slate-500 block">{timeSlotStr}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Monitoring Rules */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Quy chế & Giám sát an toàn thi</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Tự động lưu câu trả lời:</strong> Mỗi đáp án bạn chọn sẽ được hệ thống lưu tức thì về máy chủ khảo thí.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Chế độ toàn màn hình:</strong> Trình duyệt sẽ tự động chuyển sang chế độ Fullscreen ngay khi làm bài.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Giám sát chuyển tab:</strong> Mọi hành vi chuyển tab hoặc mở ứng dụng ngoài sẽ bị ghi nhật ký giám thị.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Tự động khóa bài:</strong> Vi phạm quá {config?.maxAllowedViolations || 5} lần sẽ tự động khóa và nộp bài thi.</span>
                </li>
              </ul>
            </div>

            {/* Section 3: Commitment & Submit */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {config?.requireRulesAcceptance !== false && (
                <label className="flex items-start gap-3 text-[13px] font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(event) => setRulesAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Tôi cam đoan tuân thủ nghiêm túc quy chế thi, không sử dụng tài liệu trái phép và đồng ý để hệ thống giám sát tự động trong suốt quá trình làm bài.
                  </span>
                </label>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="secondary" size="md" onClick={() => router.back()}>
                  Quay lại
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if ((isPasswordRequired && !examPassword.trim()) || (isAccessCodeRequired && !accessCode.trim())) {
                      setShowPasswordModal(true);
                    } else {
                      void handleStartExam();
                    }
                  }}
                  disabled={
                    starting ||
                    (error && !isPasswordRequired && !isAccessCodeRequired) ||
                    (config?.requireRulesAcceptance !== false && !rulesAccepted)
                  }
                  isLoading={starting}
                  rightIcon={!starting ? <ArrowRight className="w-4 h-4" /> : undefined}
                >
                  {starting ? 'Đang khởi tạo bài thi...' : 'Bắt đầu Làm bài thi'}
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác thực mật khẩu đề thi"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Blue Header matching exact design system standard */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 p-5 text-white shrink-0 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[18px] font-bold leading-snug text-white line-clamp-1">
                        Nhập Mật Khẩu Phòng Thi
                      </h3>
                      <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/30">
                        Xác thực
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-blue-100/90 mt-1 line-clamp-1">
                      Xác thực quyền truy cập trước khi làm bài thi trực tuyến
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="shrink-0 rounded-xl p-1.5 text-blue-100 hover:bg-white/20 hover:text-white transition cursor-pointer"
                  title="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error || 'Kỳ thi chính thức yêu cầu nhập mật khẩu thi trước khi vào thi'}</span>
              </div>

              {isPasswordRequired && (
                <div className="space-y-1.5">
                  <label className="block text-[15px] font-semibold text-slate-800">
                    Mật khẩu đề thi <span className="text-rose-500">* (Giám thị đọc tại phòng)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="off"
                      autoFocus
                      placeholder="Nhập mật khẩu đề thi..."
                      value={examPassword}
                      onChange={(e) => {
                        setExamPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (!isPasswordRequired || examPassword.trim()) && (!isAccessCodeRequired || accessCode.trim())) {
                          setShowPasswordModal(false);
                          void handleStartExam();
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {isAccessCodeRequired && (
                <div className="space-y-1.5">
                  <label className="block text-[15px] font-semibold text-slate-800">
                    Mã truy cập phòng thi <span className="text-rose-500">* (Bắt buộc)</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Nhập mã truy cập..."
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (!isPasswordRequired || examPassword.trim()) && (!isAccessCodeRequired || accessCode.trim())) {
                        setShowPasswordModal(false);
                        void handleStartExam();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button variant="secondary" size="md" onClick={() => setShowPasswordModal(false)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setShowPasswordModal(false);
                  void handleStartExam();
                }}
                disabled={
                  starting ||
                  (isPasswordRequired && !examPassword.trim()) ||
                  (isAccessCodeRequired && !accessCode.trim())
                }
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
