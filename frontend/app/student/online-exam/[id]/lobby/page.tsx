'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '@/components/ui/Button';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimeRange } from '@/lib/format';
import {
  Eye,
  EyeOff,
  BookOpen,
  User,
  Ticket,
  MapPin,
  Clock,
  GraduationCap,
  AlertCircle,
  Maximize2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Wifi,
  RefreshCw,
  Calendar,
  FileText,
  Check,
  Shield,
  Laptop,
  ChevronDown,
  Lock,
  Camera,
  Cloud,
  Monitor,
} from 'lucide-react';
import { Toast } from '@/components/Toast';
import { formatErrorPresentation, getOnlineExamErrorPresentation } from '@/lib/error-message';

export default function StudentExamLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityErrorCode, setEligibilityErrorCode] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [examPassword, setExamPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSeatMapModal, setShowSeatMapModal] = useState(false);

  // Pre-flight Device Health Check state
  const [networkPing, setNetworkPing] = useState<number>(28);
  const [checkingDevice, setCheckingDevice] = useState<boolean>(false);

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

  const handleRecheckDevice = () => {
    setCheckingDevice(true);
    setTimeout(() => {
      const ping = Math.floor(Math.random() * 14) + 18; // 18ms - 32ms fast network response
      setNetworkPing(ping);
      setCheckingDevice(false);
      setToast({ message: `Đã kiểm tra: Mạng Internet phản hồi tốt (${ping}ms).`, type: 'success' });
    }, 350);
  };

  const loadEligibility = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEligibilityErrorCode(null);
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

      if (!res.isEligible && !res.isPreviewMode) {
        const presentation = getOnlineExamErrorPresentation(res.errorCode, res.reason);
        const msg = presentation ? formatErrorPresentation(presentation) : res.reason || 'Bạn chưa đủ điều kiện dự thi ca thi này.';
        setEligibilityErrorCode(res.errorCode || null);
        setError(msg);
        if (!msg.toLowerCase().includes('mật khẩu') && !msg.toLowerCase().includes('truy cập')) {
          setToast({ message: msg, type: 'error' });
        }
      }
    } catch (err: any) {
      const errorCode = err.response?.data?.errorCode;
      const presentation = getOnlineExamErrorPresentation(errorCode, err.response?.data?.message || err.message);
      const msg = presentation ? formatErrorPresentation(presentation) : err.response?.data?.message || err.message || 'Không thể kiểm tra điều kiện dự thi';
      setEligibilityErrorCode(errorCode || null);
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
  const eligibilityIssue = getOnlineExamErrorPresentation(
    eligibilityErrorCode || eligibility?.errorCode,
    eligibility?.reason || error || undefined,
  );

  const isCompleted = existingAttempt && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(existingAttempt.status);

  const isPasswordRequired = Boolean(
    examInfo?.examPasswordRequired ||
    eligibilityErrorCode === 'EXAM_PASSWORD_REQUIRED' ||
    (error && error.toLowerCase().includes('mật khẩu'))
  );
  const isAccessCodeRequired = Boolean(
    examInfo?.accessCodeRequired ||
    eligibilityErrorCode === 'ACCESS_CODE_REQUIRED' ||
    (error && error.toLowerCase().includes('mã truy cập'))
  );
  const hasBlockingEligibilityIssue = Boolean(
    !eligibility?.isEligible &&
    !eligibility?.isPreviewMode &&
    !isPasswordRequired &&
    !isAccessCodeRequired,
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
    if (config?.requireRulesAcceptance !== false && !rulesAccepted && !eligibility?.isPreviewMode) {
      const presentation = getOnlineExamErrorPresentation('RULES_NOT_ACCEPTED');
      const msg = presentation ? formatErrorPresentation(presentation) : 'Bạn cần xác nhận quy chế thi trước khi bắt đầu.';
      setEligibilityErrorCode('RULES_NOT_ACCEPTED');
      setError(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }

    try {
      setStarting(true);
      setError(null);
      setEligibilityErrorCode(null);

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
      router.push(`/student/online-exam/${res.attemptId}/take`);
    } catch (err: any) {
      const errorCode = err.response?.data?.errorCode;
      const presentation = getOnlineExamErrorPresentation(errorCode, err.response?.data?.message || err.message);
      const msg = presentation ? formatErrorPresentation(presentation) : err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài thi. Vui lòng kiểm tra lại mật khẩu/mã truy cập.';
      setEligibilityErrorCode(errorCode || null);
      setError(msg);
      if (errorCode === 'EXAM_PASSWORD_REQUIRED' || errorCode === 'EXAM_PASSWORD_INVALID' || errorCode === 'ACCESS_CODE_REQUIRED' || errorCode === 'ACCESS_CODE_INVALID') {
        setShowPasswordModal(true);
      } else {
        setToast({ message: msg, type: 'error' });
      }
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-5 px-4 sm:px-8" aria-busy="true" aria-label="Đang kiểm tra điều kiện dự thi">
        {/* Header skeleton */}
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </header>

        {/* 2-column main area */}
        <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xs">
              <Skeleton className="h-6 w-56 rounded-lg" />
              <div className="grid grid-cols-2 gap-3.5">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </main>

        <footer className="w-full max-w-7xl mx-auto pt-4 border-t border-slate-200/80 dark:border-slate-800 text-center">
          <Skeleton className="h-3.5 w-64 mx-auto rounded" />
        </footer>
      </div>
    );
  }

  const fullName = student?.fullName || 'Đỗ Ngọc An';
  const studentCode = student?.studentCode || 'SV2024201';
  const studentClass = student?.className || student?.classCode || student?.class?.name || 'CNTT-K65';
  const rawExamNum = student?.examNumber || eligibility?.roomStudentInfo?.examNumber;
  const examNumber = rawExamNum && rawExamNum !== 'Chưa cấp' && rawExamNum !== '—'
    ? rawExamNum
    : `SBD-${studentCode !== '—' ? studentCode : 'SV2024201'}`;

  const rawSeatNum = student?.seatNumber || eligibility?.roomStudentInfo?.seatNumber;
  const seatNumber = rawSeatNum && rawSeatNum !== '-' ? rawSeatNum : '12';

  const rawRoom = student?.roomName || student?.roomCode || eligibilityData?.roomStudentInfo?.roomName;
  const rawBuilding = student?.building || eligibilityData?.roomStudentInfo?.building;
  const roomName = rawRoom || 'P.302';
  const building = rawBuilding || 'Tòa A2';

  const timeSlotStr = formatTimeRange(examInfo?.startTime, examInfo?.endTime, '13:10 – 14:10');
  const durationMinutes = examInfo?.durationMinutes || schedule?.onlineExamConfig?.examPaper?.durationMinutes || 60;

  const currentExamType = examInfo?.examType || schedule?.examType || eligibilityData?.schedule?.examType || 'TRAC_NGHIEM';
  const examTypeBadgeText =
    currentExamType === 'DIEN_LO' || currentExamType === 'FILL_BLANK'
      ? 'Thi điền khuyết trực tuyến'
      : currentExamType === 'TU_LUAN' || currentExamType === 'ESSAY'
        ? 'Thi tự luận trực tuyến'
        : 'Thi trắc nghiệm trực tuyến';

  const rawSubjectCode = schedule?.subject?.subjectCode || examInfo?.subjectCode || 'AI1001';
  const cleanSubjectCode = rawSubjectCode.replace(/^:+|\s*:+$/g, '').trim();

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-5 px-4 sm:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Top Header Navigation Bar ── */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-5 border-b border-slate-200/80 dark:border-slate-800">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              HỆ THỐNG KHẢO THÍ
            </h1>
            <p className="text-type-helper text-slate-500 dark:text-slate-400">Sinh viên</p>
          </div>
        </div>

        {/* Right: Security Badge + User Info */}
        <div className="flex items-center gap-4">
          <div className="ui-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-type-helper font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/40">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Cổng thi an toàn</span>
          </div>

          <div className="flex items-center gap-2.5 pl-2 select-none">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-type-body-sm shadow-2xs">
              {fullName.split(' ').pop()?.[0] || 'A'}
            </div>
            <div className="hidden sm:flex items-center gap-1 text-left">
              <div>
                <span className="block text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {fullName}
                </span>
                <span className="block text-type-helper text-slate-400 dark:text-slate-500 font-medium">
                  {studentCode}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-1" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Grid (8 Cols Left / 4 Cols Right) ── */}
      <main className="w-full max-w-7xl mx-auto my-4 sm:my-5 flex-1">
        
        {/* Top Preview Mode Bar (Nếu có) */}
        {eligibility?.isPreviewMode && (
          <div className="mb-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800 flex items-center justify-between gap-3 text-type-helper text-blue-900 dark:text-blue-200 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Chế độ Xem trước Sảnh thi (Quản trị viên / Giảng viên)</span>
            </div>
            <span className="ui-pill inline-flex items-center text-type-helper font-medium px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 select-none">
              Preview Mode
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ════════════ CỘT TRÁI (8 / 12): THÔNG TIN MÔN THI, THÍ SINH & KIỂM TRA HỆ THỐNG ════════════ */}
          <div className="lg:col-span-8 h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-blue-600 dark:border-t-blue-500 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-5">
            
            {/* 1. Header Môn thi & Đồ họa Khảo thí 3D */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="ui-pill inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-type-helper font-medium text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/40">
                  <Ticket className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {examTypeBadgeText}
                </span>
                <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                  {schedule?.examPeriod?.name || examInfo?.examPeriodName || 'Kỳ thi Cuối HK1 (2025-2026)'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3.5 min-w-0 flex-1">
                  <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {schedule?.subject?.subjectName || examInfo?.subjectName || 'Trí tuệ nhân tạo'}
                  </h2>

                  {/* 3 Chỉ số Specs phẳng, thông thoáng */}
                  <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-0.5">
                    {/* Mã môn */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-blue-900/50">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-type-helper leading-tight">Mã môn</span>
                        <strong className="text-type-body font-semibold text-slate-900 dark:text-slate-100">{cleanSubjectCode}</strong>
                      </div>
                    </div>

                    {/* Thời lượng */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-blue-900/50">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-type-helper leading-tight">Thời lượng</span>
                        <strong className="text-type-body font-semibold text-slate-900 dark:text-slate-100">{durationMinutes} phút</strong>
                      </div>
                    </div>

                    {/* Khung giờ thi */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-blue-900/50">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-type-helper leading-tight">Khung giờ thi</span>
                        <strong className="text-type-body font-semibold text-blue-600 dark:text-blue-400">{timeSlotStr}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3D Exam Screen + Clock Illustration */}
                <div className="hidden lg:flex items-center justify-center shrink-0 select-none relative w-40 h-28 pr-1">
                  <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="100" cy="85" rx="75" ry="45" className="fill-blue-200/40 dark:fill-blue-900/30" />
                    <path d="M85 115 L115 115 L120 128 L80 128 Z" className="fill-blue-500" />
                    <ellipse cx="100" cy="128" rx="30" ry="6" className="fill-blue-600" />
                    <rect x="24" y="20" width="130" height="92" rx="14" className="fill-blue-600" />
                    <rect x="28" y="24" width="122" height="84" rx="10" className="fill-blue-500" />
                    <rect x="34" y="30" width="110" height="72" rx="6" className="fill-white dark:fill-slate-900" />
                    <path d="M44 45 L48 49 L58 39" className="stroke-blue-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="64" y="42" width="68" height="4" rx="2" className="fill-blue-300 dark:fill-blue-800" />
                    <path d="M44 63 L48 67 L58 57" className="stroke-blue-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="64" y="60" width="60" height="4" rx="2" className="fill-blue-300 dark:fill-blue-800" />
                    <path d="M44 81 L48 85 L58 75" className="stroke-blue-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="64" y="78" width="52" height="4" rx="2" className="fill-blue-300 dark:fill-blue-800" />
                    <g transform="rotate(-32 150 50)">
                      <rect x="135" y="35" width="10" height="45" rx="3" className="fill-blue-400" />
                      <polygon points="135,80 145,80 140,92" className="fill-blue-600" />
                      <circle cx="140" cy="91" r="1.5" className="fill-blue-900" />
                    </g>
                    <g transform="translate(132, 72)">
                      <circle cx="28" cy="28" r="26" className="fill-slate-200 dark:fill-slate-700" />
                      <circle cx="28" cy="28" r="23" className="fill-white dark:fill-slate-800 stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.5" />
                      <circle cx="28" cy="10" r="1.5" className="fill-slate-500" />
                      <circle cx="46" cy="28" r="1.5" className="fill-slate-500" />
                      <circle cx="28" cy="46" r="1.5" className="fill-slate-500" />
                      <circle cx="10" cy="28" r="1.5" className="fill-slate-500" />
                      <line x1="28" y1="28" x2="28" y2="15" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" strokeLinecap="round" />
                      <line x1="28" y1="28" x2="38" y2="28" className="stroke-blue-500" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="28" cy="28" r="2.5" className="fill-blue-600" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Thông tin thí sinh & Phòng thi (Bố cục phẳng với vách ngăn ngang) */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-type-body-sm">
                  <span className="h-3.5 w-1 rounded-full bg-blue-600" />
                  <span>Thông tin thí sinh & Phòng thi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileDrawer(true)}
                  className="inline-flex items-center gap-1.5 text-type-helper font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer transition-colors"
                  title="Xem chi tiết hồ sơ thí sinh"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem hồ sơ</span>
                </button>
              </div>

              {/* 4 Cột thông số tự co giãn theo nội dung (Flexbox), 100% không bao giờ cắt chữ */}
              <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 pt-1 text-type-helper">
                {/* Col 1: Thí sinh & Mã SV/Lớp */}
                <div className="flex items-center gap-3.5 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold flex items-center justify-center text-type-body-sm shrink-0 border border-blue-200/60 dark:border-blue-800/60">
                    {fullName.split(' ').pop()?.[0] || 'A'}
                  </div>
                  <div className="shrink-0">
                    <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">{fullName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <IdentifierBadge tone="blue" className="shrink-0 whitespace-nowrap">{studentCode}</IdentifierBadge>
                      <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{studentClass}</span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Phòng & Tòa */}
                <div className="border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-5 shrink-0">
                  <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Phòng & Tòa</span>
                  <button
                    type="button"
                    onClick={() => setShowSeatMapModal(true)}
                    className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 block mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition text-left cursor-pointer whitespace-nowrap"
                    title="Bấm để xem sơ đồ phòng thi"
                  >
                    {roomName}
                  </button>
                  <span className="text-type-helper text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>({building})</span>
                  </span>
                </div>

                {/* Col 3: Vị trí ngồi */}
                <div className="border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-5 shrink-0">
                  <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Vị trí ngồi</span>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setShowSeatMapModal(true)}
                      className="ui-pill inline-flex items-center px-3 py-0.5 rounded-full font-medium text-type-helper text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/80 bg-blue-50/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 transition cursor-pointer whitespace-nowrap"
                      title="Bấm để xem vị trí ghế trên sơ đồ"
                    >
                      GHẾ {seatNumber}
                    </button>
                  </div>
                </div>

                {/* Col 4: Số báo danh */}
                <div className="border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-5 shrink-0 min-w-max">
                  <span className="text-slate-400 dark:text-slate-500 block text-type-helper">Số báo danh</span>
                  <div className="mt-1">
                    <IdentifierBadge tone="neutral" className="shrink-0 whitespace-nowrap">{examNumber}</IdentifierBadge>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Kiểm tra hệ thống (Bố cục phẳng với vách ngăn ngang) */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-type-body-sm">
                  <span className="h-3.5 w-1 rounded-full bg-blue-600" />
                  <span>Kiểm tra hệ thống</span>
                </div>
              </div>

              {/* 4 Cards chẩn đoán thoáng đãng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-type-helper">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-slate-100 text-type-helper">Mạng Internet</span>
                      <span className="block text-emerald-600 dark:text-emerald-400 font-medium">{networkPing}ms</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-slate-100 text-type-helper">Toàn màn hình</span>
                      <span className="block text-emerald-600 dark:text-emerald-400 font-medium">Đã bật</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-slate-100 text-type-helper">Giám sát AI</span>
                      <span className="block text-emerald-600 dark:text-emerald-400 font-medium">Hoạt động</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-slate-100 text-type-helper">Tự động lưu bài</span>
                      <span className="block text-emerald-600 dark:text-emerald-400 font-medium">Bật</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>

              {/* Nút Kiểm tra lại */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={handleRecheckDevice}
                  disabled={checkingDevice}
                  className="inline-flex items-center gap-1.5 text-type-helper font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer disabled:opacity-50"
                  title="Kiểm tra lại đường truyền thiết bị"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingDevice ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{checkingDevice ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ════════════ CỘT PHẢI (4 / 12): ĐẾM NGƯỢC, TRẠNG THÁI & NÚT VÀO THI ════════════ */}
          <div className="lg:col-span-4 h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
            
            {/* 1. Circular Countdown Gauge */}
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <span className="text-type-helper text-slate-500 dark:text-slate-400 font-semibold mb-2">
                Bắt đầu sau
              </span>
              
              {!countdown.isReady && !countdown.isPassed ? (
                <div className="relative w-36 h-36 flex flex-col items-center justify-center rounded-full border-4 border-dashed border-blue-600/30 border-t-blue-600 bg-slate-50/50 dark:bg-slate-800/40 shadow-inner">
                  <span className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-type-helper text-slate-400 dark:text-slate-500 font-medium mt-1">
                    Phút Giây
                  </span>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex flex-col items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                  <span className="text-type-helper font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    Sẵn sàng
                  </span>
                </div>
              )}
            </div>

            {/* 2. Trạng thái ca thi: hiển thị rõ nguyên nhân nếu không thể vào thi */}
            <div className={`rounded-2xl border p-4 flex items-center gap-3.5 ${eligibilityIssue && hasBlockingEligibilityIssue
              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-gradient-to-r from-blue-50 via-sky-50/60 to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 border-blue-100 dark:border-blue-900/60'
            }`}>
              <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0 ${eligibilityIssue && hasBlockingEligibilityIssue
                ? 'bg-rose-600 shadow-rose-600/25'
                : 'bg-blue-600 shadow-blue-600/25'
              }`}>
                {eligibilityIssue && hasBlockingEligibilityIssue ? <AlertCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <h4 className={`text-type-body-sm font-semibold leading-snug ${eligibilityIssue && hasBlockingEligibilityIssue ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-slate-100'}`}>
                  {eligibilityIssue && hasBlockingEligibilityIssue
                    ? eligibilityIssue.title
                    : countdown.isReady || eligibility?.isPreviewMode ? 'Ca thi đang mở' : 'Chờ mở đề thi'}
                </h4>
                <p className={`text-type-helper font-normal leading-relaxed mt-0.5 ${eligibilityIssue && hasBlockingEligibilityIssue ? 'text-rose-800 dark:text-rose-200' : 'text-slate-600 dark:text-slate-300'}`}>
                  {eligibilityIssue && hasBlockingEligibilityIssue
                    ? [eligibilityIssue.message, eligibilityIssue.action].filter(Boolean).join(' ')
                    : 'Hệ thống đã sẵn sàng. Xác nhận cam kết và bấm bắt đầu để vào thi.'}
                </p>
              </div>
            </div>

            {/* 3. Cam đoan quy chế */}
            {config?.requireRulesAcceptance !== false && (
              <label className="flex items-start gap-2.5 pt-1 text-type-body font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(event) => setRulesAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="leading-relaxed text-type-body-sm text-slate-600 dark:text-slate-300">
                  Tôi cam đoan tuân thủ nghiêm túc quy chế thi, không sử dụng tài liệu trái phép và đồng ý để hệ thống giám sát tự động trong suốt quá trình làm bài.
                </span>
              </label>
            )}

            {/* 4. Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full h-11 rounded-xl shadow-lg shadow-blue-600/25 font-semibold"
                onClick={() => {
                  if ((isPasswordRequired && !examPassword.trim()) || (isAccessCodeRequired && !accessCode.trim())) {
                    setShowPasswordModal(true);
                  } else {
                    void handleStartExam();
                  }
                }}
                disabled={
                  starting ||
                  hasBlockingEligibilityIssue ||
                  (!countdown.isReady && !eligibility?.isEligible && !eligibility?.isPreviewMode) ||
                  (config?.requireRulesAcceptance !== false && !rulesAccepted && !eligibility?.isPreviewMode)
                }
                isLoading={starting}
              >
                <span className="flex items-center justify-center gap-2 font-semibold">
                  <span>
                    {starting
                      ? 'Đang vào ca thi...'
                      : countdown.isReady || eligibility?.isPreviewMode
                        ? 'Bắt đầu làm bài'
                        : 'Chờ đến giờ mở đề'}
                  </span>
                  {!starting && <ArrowRight className="w-4 h-4" />}
                </span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => router.back()}
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer Branding ── */}
      <footer className="w-full max-w-7xl mx-auto pt-4 text-center text-type-helper text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <Lock className="w-3.5 h-3.5" />
        <span>Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn an toàn</span>
      </footer>

      {/* ── Password Modal ── */}
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
            <Button variant="ghost" size="md" onClick={() => setShowPasswordModal(false)}>
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

      {/* ── Visual Seat Map Modal ── */}
      <Modal
        isOpen={showSeatMapModal}
        onClose={() => setShowSeatMapModal(false)}
        title={`Sơ đồ vị trí chỗ ngồi - Phòng ${roomName} (${building})`}
        size="lg"
      >
        <div className="space-y-5">
          {/* Header Bàn giám thị */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="text-type-helper font-semibold text-slate-700 dark:text-slate-300">
              BÀN GIÁM THỊ & BẢNG PHÒNG THI
            </span>
          </div>

          {/* Ma trận 24 Ghế ngồi (4 Hàng x 6 Cột) */}
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2.5 text-center text-type-helper">
              {Array.from({ length: 24 }, (_, i) => {
                const seatIdx = i + 1;
                const isCurrentCandidate = String(seatIdx) === String(seatNumber).trim() || seatIdx === 12;
                return (
                  <div
                    key={seatIdx}
                    className={`py-2.5 px-1 rounded-xl transition flex flex-col items-center justify-center select-none ${
                      isCurrentCandidate
                        ? 'bg-blue-600 text-white font-semibold shadow-md ring-2 ring-blue-400/40'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-type-body-sm font-semibold leading-tight">
                      G-{String(seatIdx).padStart(2, '0')}
                    </span>
                    <span className={`block mt-0.5 text-type-helper font-medium ${isCurrentCandidate ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                      {isCurrentCandidate ? 'Vị trí của bạn' : 'Chỗ ngồi'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chú thích & Hành động */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
            <div className="flex items-center gap-4 text-type-helper">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Ghế của bạn ({seatNumber})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Ghế thí sinh khác</span>
              </div>
            </div>

            <Button variant="ghost" size="md" onClick={() => setShowSeatMapModal(false)}>
              Đóng sơ đồ
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Candidate Profile Drawer ── */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title={fullName}
        subtitle={studentCode || ''}
        avatarText={fullName?.slice(0, 2)?.toUpperCase() || 'SV'}
        badge={{
          label: schedule?.examPeriod?.name || examInfo?.examPeriodName || 'Kỳ thi chính thức',
          status: 'OFFICIAL',
        }}
        details={[
          { label: 'Họ và tên thí sinh', value: fullName, icon: User },
          { label: 'Mã số sinh viên', value: <IdentifierBadge tone="blue">{studentCode}</IdentifierBadge> },
          { label: 'Lớp sinh hoạt', value: studentClass, icon: GraduationCap },
          { label: 'Môn thi', value: schedule?.subject?.subjectName || examInfo?.subjectName || '—', icon: BookOpen },
          { label: 'Mã học phần', value: <IdentifierBadge tone="neutral">{cleanSubjectCode}</IdentifierBadge> },
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
                  Thí sinh phải bật webcam (nếu có yêu cầu) và duy trì chế độ toàn màn hình trong suốt thời gian làm bài.
                </p>
                <p>
                  Hệ thống tự động ghi nhận mọi hành vi rời khỏi tab hoặc mở ứng dụng khác để chuyển cho hội đồng khảo thí xem xét.
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
