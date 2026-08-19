'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '@/components/ui/Button';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { Modal } from '@/components/Modal';
import {
  Eye,
  EyeOff,
  BookOpen,
  User,
  Ticket,
  MapPin,
  Clock,
  ShieldAlert,
  GraduationCap,
  AlertCircle,
  Save,
  Maximize2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Wifi,
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
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Live Countdown State
  const [countdown, setCountdown] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isReady: boolean;
    isPassed: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isReady: true,
    isPassed: false,
  });

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
          const msg = res.reason || 'Bài thi đang bị tạm khóa để xem xét do vi phạm quy chế. Vui lòng liên hệ giám thị hoặc quản trị viên.';
          setError(msg);
          setToast({ message: msg, type: 'error' });
        }
      }

      if (!res.isEligible) {
        const msg = res.reason || 'Bạn chưa đủ điều kiện dự thi ca thi này.';
        setError(msg);
        if (!msg.toLowerCase().includes('mật khẩu') && !msg.toLowerCase().includes('truy cập')) {
          setToast({ message: msg, type: 'error' });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể kiểm tra điều kiện dự thi';
      setError(msg);
      if (!msg.toLowerCase().includes('mật khẩu') && !msg.toLowerCase().includes('truy cập')) {
        setToast({ message: msg, type: 'error' });
      }
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
  const schedule = React.useMemo(() => {
    return eligibilityData.schedule ?? (examInfo ? {
      subject: { subjectName: examInfo.subjectName, subjectCode: examInfo.subjectCode },
      examPeriod: { name: examInfo.examPeriodName },
      onlineExamConfig: { examPaper: { durationMinutes: examInfo.durationMinutes } },
      startTime: examInfo.startTime,
      endTime: examInfo.endTime,
      examDate: examInfo.examDate,
      examType: examInfo.examType,
    } : undefined);
  }, [eligibilityData.schedule, examInfo]);
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

  // Live Countdown Calculation
  useEffect(() => {
    if (!eligibility) return;

    const calculateCountdown = () => {
      let startStr = examInfo?.startTime || schedule?.startTime;
      const dateStr = examInfo?.examDate || schedule?.examDate;
      const endStr = examInfo?.endTime || schedule?.endTime;

      if (!startStr && error) {
        const match = error.match(/(\d{1,2}:\d{2})/);
        if (match) startStr = match[1];
      }
      if (!startStr && eligibility?.reason) {
        const match = eligibility.reason.match(/(\d{1,2}:\d{2})/);
        if (match) startStr = match[1];
      }

      if (!startStr) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, isReady: true, isPassed: false });
        return;
      }

      const now = new Date();
      const nowTime = now.getTime();

      const targetDate = dateStr ? new Date(dateStr) : new Date();
      const [sh, sm] = startStr.split(':').map(Number);
      targetDate.setHours(sh || 0, sm || 0, 0, 0);

      let targetEndTime: Date | null = null;
      if (endStr) {
        targetEndTime = dateStr ? new Date(dateStr) : new Date();
        const [eh, em] = endStr.split(':').map(Number);
        targetEndTime.setHours(eh || 0, em || 0, 0, 0);
      }

      const diffStart = targetDate.getTime() - nowTime;
      const diffEnd = targetEndTime ? targetEndTime.getTime() - nowTime : 1000;

      if (diffEnd < 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, isReady: false, isPassed: true });
      } else if (diffStart > 0) {
        const hours = Math.floor(diffStart / (1000 * 60 * 60));
        const minutes = Math.floor((diffStart % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffStart % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds, isReady: false, isPassed: false });
      } else {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, isReady: true, isPassed: false });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eligibility, examInfo, schedule, error]);

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
        true,
        examPassword.trim() || undefined,
        accessCode.trim() || undefined,
      );
      sessionStorage.setItem('attemptToken', res.attemptToken);
      router.push(`/student/online-exam/${res.attemptId}/take`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài thi. Vui lòng kiểm tra lại mật khẩu/mã truy cập.';
      setError(msg);
      if (msg.toLowerCase().includes('mật khẩu') || msg.toLowerCase().includes('truy cập')) {
        setShowPasswordModal(true);
      } else {
        setToast({ message: msg, type: 'error' });
      }
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/20 border-t-blue-500"></div>
        <h3 className="mt-4 text-type-body font-semibold text-slate-200 dark:text-slate-200">Đang kiểm tra điều kiện dự thi...</h3>
        <p className="text-type-helper text-slate-400 dark:text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
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

  const timeSlotStr = examInfo?.startTime && examInfo?.endTime ? `${examInfo.startTime} - ${examInfo.endTime}` : '11:04 - 12:04';
  const durationMinutes = examInfo?.durationMinutes || schedule?.onlineExamConfig?.examPaper?.durationMinutes || 60;

  const currentExamType = examInfo?.examType || schedule?.examType || eligibilityData?.schedule?.examType || 'TRAC_NGHIEM';
  const examTypeBadgeText =
    currentExamType === 'DIEN_LO' || currentExamType === 'FILL_BLANK'
      ? 'Thi điền khuyết trực tuyến'
      : currentExamType === 'TU_LUAN' || currentExamType === 'ESSAY'
        ? 'Thi tự luận trực tuyến'
        : 'Thi trắc nghiệm trực tuyến';

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 sm:py-12 px-4 sm:px-6 flex flex-col justify-center items-center overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* ── Ambient Background Glow & High-tech Grid Pattern ── */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-blue-400/10 via-slate-400/5 to-transparent blur-3xl pointer-events-none" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Top Platform Branding Header ── */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between gap-3 text-type-helper text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <div className="w-6 h-6 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-tight">Hệ thống Khảo thí Điện tử</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Cổng thi an toàn</span>
        </div>
      </div>

      {/* ── Main Exam Hall Cockpit Card ── */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">

        {/* ── Pre-flight System Status Indicator ── */}
        <div className="bg-slate-50/80 dark:bg-slate-800/50 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-type-helper text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Hệ thống khảo thí đã sẵn sàng</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Đường truyền ổn định
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Giám sát AI kích hoạt
            </span>
          </div>
        </div>

        {/* ── Section 1: Hero Môn Thi & Kỳ Thi ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="ui-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-type-helper font-medium text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              <BookOpen className="w-3.5 h-3.5" />
              {examTypeBadgeText}
            </span>
            <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">
              {schedule?.examPeriod?.name || examInfo?.examPeriodName || 'Kỳ thi chính thức'}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-type-section sm:text-type-section font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài thi trực tuyến'}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-type-helper text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">Mã môn học:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">Thời gian làm bài:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{durationMinutes} phút</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">Hình thức:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Trực tuyến trên máy tính</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Completed State (Nếu đã làm xong) ── */}
        {isCompleted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-type-card font-semibold text-slate-900 dark:text-slate-100">Bạn đã hoàn thành bài thi này</h2>
            <p className="text-type-helper sm:text-type-body-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Bài làm đã được nộp thành công và lưu trữ trên hệ thống khảo thí.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => router.push(`/student/online-exam/${existingAttempt.id}/result`)}
              >
                Xem kết quả bài thi
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Section 3: Thẻ Dự Thi Điện Tử (Digital Admit Pass) ── */}
            <div className="p-6 sm:p-8 space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <h2 className="text-type-helper font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                    Thẻ dự thi & Vị trí phòng thi
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileDrawer(true)}
                  className="inline-flex items-center gap-1.5 text-type-helper font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                  title="Xem chi tiết hồ sơ thí sinh"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem hồ sơ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Thí sinh & SBD */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-semibold text-type-body-sm">
                      {fullName.split(' ').pop()?.[0] || 'SV'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-type-helper font-medium text-slate-400 dark:text-slate-500 block">Thí sinh</span>
                      <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{fullName}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-type-helper">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Mã sinh viên</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{studentCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Lớp học</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{studentClass}</span>
                    </div>
                  </div>
                </div>

                {/* Phòng thi & Số ghế NỔI BẬT */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-type-helper font-medium text-slate-400 dark:text-slate-500 block">Phòng & Tòa nhà</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">{roomName} ({building})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-type-helper font-medium text-slate-400 dark:text-slate-500 block">Vị trí ngồi</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 ui-pill rounded-full font-medium text-type-helper text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                        GHẾ {seatNumber}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-type-helper">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Số báo danh</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{examNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Khung giờ thi</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 block">{timeSlotStr}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 4: Live Countdown Timer & Trạng Thái Ca Thi ── */}
            <div className="p-6 sm:p-8 space-y-4">
              {!countdown.isReady && !countdown.isPassed ? (
                <div className="rounded-2xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-5 sm:p-6 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-type-helper font-semibold text-amber-800 dark:text-amber-300">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Ca thi chưa bắt đầu — Tự động mở đề khi đến giờ</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-type-section font-semibold text-slate-900 dark:text-slate-100 tabular-nums shadow-xs">
                        {String(countdown.hours).padStart(2, '0')}
                      </div>
                      <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mt-1">Giờ</span>
                    </div>
                    <span className="text-type-section font-semibold text-amber-500 pb-4">:</span>
                    <div className="flex flex-col items-center">
                      <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-type-section font-semibold text-slate-900 dark:text-slate-100 tabular-nums shadow-xs">
                        {String(countdown.minutes).padStart(2, '0')}
                      </div>
                      <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mt-1">Phút</span>
                    </div>
                    <span className="text-type-section font-semibold text-amber-500 pb-4">:</span>
                    <div className="flex flex-col items-center">
                      <div className="w-14 sm:w-16 h-12 sm:h-14 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-type-section font-semibold text-amber-600 dark:text-amber-400 tabular-nums shadow-xs">
                        {String(countdown.seconds).padStart(2, '0')}
                      </div>
                      <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mt-1">Giây</span>
                    </div>
                  </div>
                  <p className="text-type-helper text-slate-600 dark:text-slate-400">
                    Vui lòng giữ nguyên cửa sổ này, nút làm bài sẽ được kích hoạt vào đúng <strong>{examInfo?.startTime || 'giờ quy định'}</strong>.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-type-body-sm font-semibold text-emerald-900 dark:text-emerald-200">Ca thi đang mở — Sẵn sàng vào thi</h3>
                      <p className="text-type-helper text-emerald-700 dark:text-emerald-400 mt-0.5">Xác nhận quy chế bên dưới và bấm nút bắt đầu để mở đề thi.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 5: Quy Chế Làm Bài & Giám Sát An Toàn (4 Thẻ Tính Năng) ── */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-blue-600" />
                <h2 className="text-type-helper font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                  Quy chế làm bài & Giám sát an toàn
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-type-helper text-slate-900 dark:text-slate-100">
                    <div className="w-6 h-6 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Save className="w-3.5 h-3.5" />
                    </div>
                    <span>1. Tự động lưu đáp án</span>
                  </div>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
                    Hệ thống tự động lưu từng câu trả lời lên máy chủ ngay khi chọn.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-type-helper text-slate-900 dark:text-slate-100">
                    <div className="w-6 h-6 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <span>2. Chế độ toàn màn hình</span>
                  </div>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
                    Trình duyệt bắt buộc mở toàn màn hình để đảm bảo tập trung tối đa.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-type-helper text-slate-900 dark:text-slate-100">
                    <div className="w-6 h-6 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <span>3. Giám sát chuyển tab</span>
                  </div>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
                    Hành vi rời màn hình hoặc mở ứng dụng khác đều bị ghi lại.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-type-helper text-slate-900 dark:text-slate-100">
                    <div className="w-6 h-6 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>4. Tự động thu & nộp bài</span>
                  </div>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
                    Hệ thống tự nộp bài khi hết giờ hoặc vi phạm quá {config?.maxAllowedViolations || 5} lần.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 6: Khung Cam Đoan & Nút Hành Động ── */}
            <div className="p-6 sm:p-8 space-y-5 bg-slate-50/60 dark:bg-slate-900/60">
              {config?.requireRulesAcceptance !== false && (
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-type-body font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none shadow-2xs hover:border-blue-400 transition">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(event) => setRulesAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-lg border-slate-300 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className="leading-relaxed">
                    Tôi cam đoan tuân thủ nghiêm túc quy chế thi, không sử dụng tài liệu trái phép và đồng ý để hệ thống giám sát tự động trong suốt quá trình làm bài.
                  </span>
                </label>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button variant="secondary" size="md" onClick={() => router.back()}>
                  Quay lại
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  className="px-8 shadow-lg shadow-blue-600/20"
                  onClick={() => {
                    if ((isPasswordRequired && !examPassword.trim()) || (isAccessCodeRequired && !accessCode.trim())) {
                      setShowPasswordModal(true);
                    } else {
                      void handleStartExam();
                    }
                  }}
                  disabled={
                    starting ||
                    (!countdown.isReady && !eligibility?.isEligible) ||
                    (error && !isPasswordRequired && !isAccessCodeRequired && !countdown.isReady) ||
                    (config?.requireRulesAcceptance !== false && !rulesAccepted)
                  }
                  isLoading={starting}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span>{starting ? 'Đang vào ca thi...' : 'Bắt đầu làm bài'}</span>
                    {!starting && <ArrowRight className="w-4 h-4" />}
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Password Modal (Chuẩn Modal Hệ Thống) ── */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Xác thực mật khẩu phòng thi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-type-helper sm:text-type-body-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Nhập mật khẩu do giám thị công bố tại phòng thi để mở đề và bắt đầu tính giờ làm bài.
          </p>

          {isPasswordRequired && (
            <div className="space-y-1.5">
              <label className="block text-type-body font-medium text-slate-800 dark:text-slate-100">
                Mật khẩu đề thi <span className="text-rose-500">*</span>
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
                  className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-type-body font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition shadow-2xs ${
                    error
                      ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-type-helper font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          )}

          {isAccessCodeRequired && (
            <div className="space-y-1.5">
              <label className="block text-type-body font-medium text-slate-800 dark:text-slate-100">
                Mã truy cập phòng thi <span className="text-rose-500">*</span>
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setShowPasswordModal(false)}>
              Hủy bỏ
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
              Vào làm bài
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Candidate Profile Drawer ── */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title={fullName}
        subtitle={studentCode ? `MSSV: ${studentCode}` : ''}
        avatarText={fullName?.slice(0, 2)?.toUpperCase() || 'SV'}
        badge={{
          label: schedule?.examPeriod?.name || examInfo?.examPeriodName || 'Kỳ thi chính thức',
          status: 'OFFICIAL',
        }}
        details={[
          { label: 'Họ và tên thí sinh', value: fullName, icon: User },
          { label: 'Mã số sinh viên', value: <IdentifierBadge tone="blue">{studentCode}</IdentifierBadge> },
          { label: 'Lớp sinh hoạt', value: studentClass, icon: GraduationCap },
          { label: 'Môn thi', value: schedule?.subject?.subjectName || examInfo?.subjectName || '---', icon: BookOpen },
          { label: 'Mã học phần', value: <IdentifierBadge tone="neutral">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</IdentifierBadge> },
          { label: 'Phòng thi', value: `${roomName} (${building})`, icon: MapPin },
          { label: 'Số báo danh (SBD)', value: <IdentifierBadge tone="neutral">{examNumber}</IdentifierBadge>, icon: Ticket },
          { label: 'Vị trí ghế ngồi', value: `Ghế số ${seatNumber}` },
          { label: 'Khung giờ thi', value: timeSlotStr, icon: Clock },
          { label: 'Thời lượng làm bài', value: `${durationMinutes} phút` },
        ]}
        extraSections={[
          {
            title: 'Quy chế phòng thi trực tuyến',
            content: (
              <div className="space-y-2 text-type-helper text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                <p>
                  • Thí sinh phải bật webcam (nếu có yêu cầu) và duy trì chế độ toàn màn hình trong suốt thời gian làm bài.
                </p>
                <p>
                  • Hệ thống tự động ghi nhận mọi hành vi rời khỏi tab hoặc mở ứng dụng khác để chuyển cho hội đồng khảo thí xem xét.
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
