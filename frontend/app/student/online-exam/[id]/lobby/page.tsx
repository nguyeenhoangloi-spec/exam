'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
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
  Calendar,
  Sparkles,
  MapPin,
  FileText,
  Radio,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
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
  const [showStartConfirm, setShowStartConfirm] = useState(false);

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
          router.push(`/student/online-exam/${attempt.attemptToken}/take`);
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

  const handleStartExam = async () => {
    if (starting) return;
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

      const res = await onlineExamService.startAttempt(
        scheduleId,
        navigator.userAgent,
        undefined,
        rulesAccepted,
        examPassword.trim() || undefined,
        accessCode.trim() || undefined,
      );
      sessionStorage.setItem('attemptToken', res.attemptToken);
      router.push(`/student/online-exam/${res.attemptToken}/take`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài thi. Vui lòng kiểm tra lại mật khẩu/mã truy cập.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500"></div>
          <ShieldCheck className="w-6 h-6 text-blue-400 absolute" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-200">Hệ thống Giám thị đang xác thực điều kiện...</h3>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

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

  const fullName = student?.fullName || '---';
  const studentCode = student?.studentCode || '---';
  const examNumber = student?.examNumber || eligibility?.roomStudentInfo?.examNumber || (schedule?.mode === 'MOCK' ? 'Thi thử tự do' : 'Chưa cấp');
  const seatNumber = student?.seatNumber || eligibility?.roomStudentInfo?.seatNumber || (schedule?.mode === 'MOCK' ? 'Tự do' : '-');
  const roomName = student?.roomName || student?.roomCode || eligibilityData?.roomStudentInfo?.roomName;
  const building = student?.building || eligibilityData?.roomStudentInfo?.building;
  const examDateStr = examInfo?.examDate ? new Date(examInfo.examDate).toLocaleDateString('vi-VN') : '---';
  const timeSlotStr = examInfo?.startTime && examInfo?.endTime ? `${examInfo.startTime} - ${examInfo.endTime}` : '---';
  const durationMinutes = examInfo?.durationMinutes || schedule?.onlineExamConfig?.examPaper?.durationMinutes || 60;

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

  const currentExamType = examInfo?.examType || schedule?.examType || eligibilityData?.schedule?.examType || 'TRAC_NGHIEM';
  const examTypeBadgeText =
    currentExamType === 'DIEN_LO' || currentExamType === 'FILL_BLANK'
      ? 'Thi Điền Khuyết Trực Tuyến'
      : currentExamType === 'TU_LUAN' || currentExamType === 'ESSAY'
        ? 'Thi Tự Luận Trực Tuyến'
        : 'Thi Trắc Nghiệm Trực Tuyến';

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-3xl space-y-5">

        {/* ── Banner Header Xanh Đậm Sắc Nét ── */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 sm:p-7 text-white shadow-md shadow-blue-900/15 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-200 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Lịch thi
                </button>
                <span className="text-blue-300/60">•</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/15 text-blue-100 text-[11px] font-black tracking-wide uppercase">
                  <Sparkles className="w-3 h-3 text-blue-300" />
                  {examTypeBadgeText}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài Thi Trực Tuyến'}
              </h1>

              <div className="flex items-center gap-2 text-xs font-semibold text-blue-100/90 flex-wrap">
                <span>Mã môn: <strong className="text-white font-black">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</strong></span>
                <span>•</span>
                <span>Kỳ thi: <strong className="text-white font-black">{schedule?.examPeriod?.name || examInfo?.examPeriodName || '---'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 shrink-0 self-start sm:self-center">
              <Clock className="w-6 h-6 text-blue-200" />
              <div>
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Thời gian làm bài</span>
                <span className="text-xl font-black text-white">{durationMinutes} phút</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trường hợp Sinh viên đã thi xong */}
        {isCompleted ? (
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 shadow-sm border border-slate-200/80">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Bạn Đã Hoàn Thành Bài Thi Này</h2>
            <p className="text-xs text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              Bài thi của bạn đã được nộp thành công và lưu trữ an toàn trên hệ thống máy chủ khảo thí.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push(`/student/online-exam/${existingAttempt.id}/result`)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Award className="w-4 h-4" /> Xem Kết Quả & Bảng Điểm
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Thông báo lỗi nếu có */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-rose-950 font-black text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Thông báo từ hệ thống khảo thí:</span>
                </div>
                <p className="text-xs font-bold pl-6 text-rose-800 leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Khối 1: Thông tin Thí sinh & Ca thi (Rõ ràng, đậm nét) ── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Thông tin Thí sinh & Phòng thi
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Phòng: <strong className="text-slate-900">{roomName ? `${roomName} ${building ? `(${building})` : ''}` : 'Chưa xếp phòng'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block text-[11px]">Họ và tên thí sinh</span>
                  <span className="font-black text-slate-900 text-sm block truncate">{fullName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block text-[11px]">Mã sinh viên</span>
                  <span className="font-mono font-black text-slate-900 text-sm block">
                    {studentCode}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block text-[11px]">SBD / Số ghế</span>
                  {examNumber && examNumber !== 'Chưa cấp' && examNumber !== '---' ? (
                    <span className="font-black text-slate-900 text-sm block">
                      {examNumber} {seatNumber !== '-' && `• Ghế ${seatNumber}`}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold text-xs italic block pt-0.5">
                      Chưa cấp số báo danh
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block text-[11px]">Ca thi & Ngày thi</span>
                  <span className="font-black text-slate-900 block">{timeSlotStr}</span>
                  <span className="text-[10.5px] text-slate-500 font-bold">{examDateStr}</span>
                </div>
              </div>
            </div>

            {/* ── Khối 2: Quy định giám sát & Tiêu chuẩn phòng thi ── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Quy chế giám sát an toàn thi trực tuyến
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-blue-950 font-bold block">Tự động lưu câu trả lời</strong>
                    <span className="text-blue-900/80 text-[11px] font-semibold leading-relaxed">
                      Mỗi đáp án bạn chọn sẽ được lưu ngay lập tức về máy chủ thi.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-950 font-bold block">Chế độ toàn màn hình</strong>
                    <span className="text-emerald-900/80 text-[11px] font-semibold leading-relaxed">
                      Trình duyệt sẽ tự động chuyển sang chế độ Fullscreen khi bắt đầu làm bài.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-amber-950 font-bold block">Cảnh báo rời bài thi</strong>
                    <span className="text-amber-900/80 text-[11px] font-semibold leading-relaxed">
                      Chuyển tab hoặc mở ứng dụng khác sẽ bị ghi nhật ký giám thị.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-rose-950 font-bold block">Khóa bài khi vi phạm</strong>
                    <span className="text-rose-900/80 text-[11px] font-semibold leading-relaxed">
                      Vi phạm quá {config?.maxAllowedViolations || 5} lần sẽ tự động khóa và thu bài.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Khối 3: Xác thực mật khẩu thi (Nếu có) ── */}
            {(isPasswordRequired || isAccessCodeRequired) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-600/80 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Mật khẩu / Mã truy cập phòng thi
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {isPasswordRequired && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Mật khẩu đề thi <span className="text-rose-600 font-bold">* (Giám thị đọc tại phòng)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="off"
                          placeholder="Nhập mật khẩu đề thi..."
                          value={examPassword}
                          onChange={(e) => setExamPassword(e.target.value)}
                          className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/70 px-4 py-3 pr-12 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 transition cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {isAccessCodeRequired && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Mã truy cập phòng thi <span className="text-rose-600 font-bold">* (Bắt buộc)</span>
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Nhập mã truy cập..."
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checkbox cam kết */}
            {config?.requireRulesAcceptance !== false && (
              <label className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(event) => setRulesAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-blue-600 cursor-pointer"
                />
                <span className="leading-relaxed">
                  Tôi cam đoan tuân thủ nghiêm túc quy chế thi, không sử dụng tài liệu trái phép và đồng ý để hệ thống giám sát tự động trong suốt quá trình làm bài.
                </span>
              </label>
            )}

            {/* ── Nút Thao tác ── */}
            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={() => setShowStartConfirm(true)}
                disabled={
                  starting ||
                  (error && !isPasswordRequired && !isAccessCodeRequired) ||
                  (config?.requireRulesAcceptance !== false && !rulesAccepted) ||
                  (isPasswordRequired && !examPassword.trim()) ||
                  (isAccessCodeRequired && !accessCode.trim())
                }
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-98 cursor-pointer"
              >
                {starting ? (
                  <span>Đang khởi tạo bài thi...</span>
                ) : (
                  <>
                    <span>Bắt đầu Làm bài thi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showStartConfirm}
        isLoading={starting}
        onClose={() => setShowStartConfirm(false)}
        onConfirm={() => {
          setShowStartConfirm(false);
          void handleStartExam();
        }}
        title="Xác nhận bắt đầu làm bài thi"
        message={`Thời gian làm bài thi ${durationMinutes} phút sẽ chính thức bắt đầu tính đếm ngược ngay sau khi bạn xác nhận. Bạn đã sẵn sàng làm bài?`}
        type="warning"
        confirmText="Bắt đầu làm bài"
        cancelText="Quay lại kiểm tra"
      />
    </div>
  );
}
