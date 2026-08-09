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
  X,
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
      router.push(`/student/online-exam/${res.attemptToken}/take`);
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
        <h3 className="mt-4 text-base font-bold text-slate-200">Hệ thống Giám thị đang xác thực điều kiện...</h3>
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

  const examDateStr = examInfo?.examDate ? new Date(examInfo.examDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
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
                  className="inline-flex items-center gap-1 text-[15px] font-medium text-blue-200 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Lịch thi
                </button>
                <span className="text-blue-300/60">•</span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-md bg-white/15 text-blue-100 text-[13px] font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  {examTypeBadgeText}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                {schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài Thi Trực Tuyến'}
              </h1>

              <div className="flex items-center gap-2 text-[15px] font-medium text-blue-100/90 flex-wrap">
                <span>Mã môn: <strong className="text-white font-semibold">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</strong></span>
                <span>•</span>
                <span>Kỳ thi: <strong className="text-white font-semibold">{schedule?.examPeriod?.name || examInfo?.examPeriodName || '---'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20 shrink-0 self-start sm:self-center">
              <Clock className="w-6 h-6 text-blue-200" />
              <div>
                <span className="text-[13px] font-semibold text-blue-200 uppercase tracking-wider block">Thời gian làm bài</span>
                <span className="text-xl font-bold text-white">{durationMinutes} phút</span>
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
            <h2 className="text-[20px] font-semibold text-[#0F172A]">Bạn Đã Hoàn Thành Bài Thi Này</h2>
            <p className="text-[15px] text-[#64748B] font-normal max-w-md mx-auto leading-relaxed">
              Bài thi của bạn đã được nộp thành công và lưu trữ an toàn trên hệ thống máy chủ khảo thí.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push(`/student/online-exam/${existingAttempt.id}/result`)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-medium rounded-xl shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Award className="w-4 h-4" /> Xem Kết Quả & Bảng Điểm
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {/* Thông báo lỗi nếu có */}
            {error && (
              <div className="p-5 bg-rose-50/80 text-rose-900 space-y-1">
                <div className="flex items-center gap-2 text-rose-950 font-semibold text-[15px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Thông báo từ hệ thống khảo thí:</span>
                </div>
                <p className="text-[15px] font-medium pl-6 text-rose-800 leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Khối 1: Thông tin Thí sinh & Ca thi (Rõ ràng, đầy đủ, đậm nét) ── */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-[20px] font-semibold text-[#0F172A]">
                    Thông tin Thí sinh & Phòng thi
                  </h2>
                </div>
                <span className="text-[15px] font-medium text-[#64748B]">
                  Phòng thi: <strong className="text-blue-700 font-semibold">{roomName} ({building})</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-[15px]">
                <div className="space-y-1">
                  <span className="text-[#64748B] font-semibold block text-[13px]">Họ và tên thí sinh</span>
                  <span className="font-semibold text-[#0F172A] text-[15px] block truncate">{fullName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[#64748B] font-semibold block text-[13px]">Mã sinh viên</span>
                  <span className="font-mono font-semibold text-[#0F172A] text-[15px] block">
                    {studentCode}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[#64748B] font-semibold block text-[13px]">Lớp sinh hoạt</span>
                  <span className="font-semibold text-[#0F172A] text-[15px] block">
                    {studentClass}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[#64748B] font-semibold block text-[13px]">SBD / Số ghế</span>
                  <span className="font-semibold text-[#0F172A] text-[15px] block">
                    {examNumber} • Ghế {seatNumber}
                  </span>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[#64748B] font-semibold block text-[13px]">Ca thi & Ngày thi</span>
                  <span className="font-semibold text-[#0F172A] block text-[15px]">{timeSlotStr}</span>
                  <span className="text-[13px] text-[#64748B] font-normal">{examDateStr}</span>
                </div>
              </div>
            </div>

            {/* ── Khối 2: Quy định giám sát & Tiêu chuẩn phòng thi ── */}
            <div className="p-6 space-y-3.5">
              <div className="flex items-center gap-2 pb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-[20px] font-semibold text-[#0F172A]">
                  Quy chế giám sát an toàn thi trực tuyến
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[15px]">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-blue-950 font-semibold block">Tự động lưu câu trả lời</strong>
                    <span className="text-blue-900/80 text-[13px] font-normal leading-relaxed">
                      Mỗi đáp án bạn chọn sẽ được lưu ngay lập tức về máy chủ thi.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-950 font-semibold block">Chế độ toàn màn hình</strong>
                    <span className="text-emerald-900/80 text-[13px] font-normal leading-relaxed">
                      Trình duyệt sẽ tự động chuyển sang chế độ Fullscreen khi bắt đầu làm bài.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-amber-950 font-semibold block">Cảnh báo rời bài thi</strong>
                    <span className="text-amber-900/80 text-[13px] font-normal leading-relaxed">
                      Chuyển tab hoặc mở ứng dụng khác sẽ bị ghi nhật ký giám thị.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-rose-950 font-semibold block">Khóa bài khi vi phạm</strong>
                    <span className="text-rose-900/80 text-[13px] font-normal leading-relaxed">
                      Vi phạm quá {config?.maxAllowedViolations || 5} lần sẽ tự động khóa và thu bài.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox cam kết */}
            {config?.requireRulesAcceptance !== false && (
              <div className="p-4 bg-slate-50/30">
                <label className="flex items-start gap-3 text-[15px] font-medium text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(event) => setRulesAccepted(event.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="leading-relaxed">
                    Tôi cam đoan tuân thủ nghiêm túc quy chế thi, không sử dụng tài liệu trái phép và đồng ý để hệ thống giám sát tự động trong suốt quá trình làm bài.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* ── Nút Thao tác ── */}
            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] text-[15px] font-medium transition cursor-pointer shadow-2xs active:scale-95"
              >
                Quay lại
              </button>

              <button
                type="button"
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
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-medium flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-98 cursor-pointer"
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

      {/* Popup Modal Nhập Mật khẩu Thi */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal - Gradient Xanh */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold tracking-tight text-white">Nhập Mật Khẩu Phòng Thi</h3>
                  <p className="text-[13px] text-blue-100 font-normal">Xác thực quyền truy cập trước khi vào thi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* Thông báo yêu cầu mật khẩu / lỗi (Dạng chữ phẳng, không khung) */}
              <div className="flex items-center gap-2 py-1 text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[15px] font-medium leading-normal">
                  {error || 'Kỳ thi chính thức yêu cầu nhập mật khẩu thi trước khi vào thi'}
                </span>
              </div>

              {isPasswordRequired && (
                <div className="space-y-1.5">
                  <label className="block text-[15px] font-medium text-[#0F172A]">
                    Mật khẩu đề thi <span className="text-rose-600 font-semibold">* (Giám thị đọc tại phòng)</span>
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
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none transition shadow-2xs"
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
                  <label className="block text-[15px] font-medium text-[#0F172A]">
                    Mã truy cập phòng thi <span className="text-rose-600 font-semibold">* (Bắt buộc)</span>
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
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-[15px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  void handleStartExam();
                }}
                disabled={
                  starting ||
                  (isPasswordRequired && !examPassword.trim()) ||
                  (isAccessCodeRequired && !accessCode.trim())
                }
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-[15px] rounded-xl shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                <span>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
