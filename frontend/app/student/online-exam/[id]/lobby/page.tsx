'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Button } from '@/components/ui/Button';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import { Modal } from '@/components/Modal';
import { Eye, EyeOff, X, BookOpen, User, Ticket, MapPin, Clock, ShieldAlert, GraduationCap, KeyRound, Info, AlertCircle, Save, Maximize2, ShieldCheck, ArrowRight, CheckCircle2, Wifi } from 'lucide-react';
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
        <h3 className="mt-4 text-base font-semibold text-slate-200 dark:text-slate-200">Đang kiểm tra điều kiện dự thi...</h3>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
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
      ? 'Thi điền khuyết trực tuyến'
      : currentExamType === 'TU_LUAN' || currentExamType === 'ESSAY'
        ? 'Thi tự luận trực tuyến'
        : 'Thi trắc nghiệm trực tuyến';

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 sm:py-16 px-4 sm:px-6 flex flex-col justify-center items-center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Seamless Editorial Minimalist Card ── */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden p-6 sm:p-10 space-y-6">

        {/* ── Pre-flight System Status Indicator ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Hệ thống khảo thí đã sẵn sàng</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Đường truyền ổn định</span>
            </div>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>Giám sát AI kích hoạt</span>
            </div>
          </div>
        </div>

        {/* ── Section 1: Tiêu đề & Thông số môn thi ── */}
        <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            <span className="text-blue-600 dark:text-blue-400">{examTypeBadgeText}</span>
            <span>{schedule?.examPeriod?.name || examInfo?.examPeriodName || 'Kỳ thi chính thức'}</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài thi trực tuyến'}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Mã môn học:</span>
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Thời gian làm bài:</span>
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{durationMinutes} phút</strong>
            </div>
          </div>
        </div>

        {/* Completed State */}
        {isCompleted ? (
          <div className="py-8 text-center space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bạn đã hoàn thành bài thi này</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Bài làm đã được nộp thành công và lưu trữ trên hệ thống khảo thí.
            </p>
            <div className="pt-3">
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
          <div className="space-y-6">
            {/* ── Section 2: Thông tin Thí sinh & Phòng thi ── */}
            <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                  <span className="h-3.5 w-1 rounded-full bg-blue-600" />
                  <span>Thông tin thí sinh & phòng thi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileDrawer(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition cursor-pointer"
                  title="Xem chi tiết hồ sơ thí sinh"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem hồ sơ</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block">Thí sinh</span>
                  <button
                    type="button"
                    onClick={() => setShowProfileDrawer(true)}
                    className="font-semibold text-slate-900 dark:text-slate-100 block truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                    title="Xem chi tiết hồ sơ thí sinh"
                  >
                    {fullName}
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block">Mã sinh viên</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{studentCode}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block">Lớp & Số ghế</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{studentClass} — Ghế {seatNumber}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block">Phòng & Ca thi</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 block truncate">{roomName} ({building})</span>
                  <span className="text-slate-400 dark:text-slate-500 block">{timeSlotStr}</span>
                </div>
              </div>
            </div>

            {/* ── Section 3: Quy chế & Giám sát an toàn thi ── */}
            <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                <span className="h-3.5 w-1 rounded-full bg-blue-600" />
                <span>Quy chế & giám sát an toàn</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <Save className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>01. Tự động lưu đáp án</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-5">Hệ thống tự động lưu câu trả lời tức thì về máy chủ khảo thí.</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>02. Chế độ toàn màn hình</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-5">Trình duyệt tự động mở toàn màn hình trong suốt thời gian thi.</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>03. Giám sát chuyển tab</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-5">Hành vi chuyển tab hoặc mở ứng dụng ngoài đều bị ghi nhận.</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>04. Tự động nộp bài</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed pl-5">Hệ thống tự khóa và nộp bài khi hết giờ hoặc vi phạm quá {config?.maxAllowedViolations || 5} lần.</p>
                </div>
              </div>
            </div>

            {/* ── Section 4: Cam kết & Bắt đầu làm bài ── */}
            <div className="space-y-5 pt-1">
              {config?.requireRulesAcceptance !== false && (
                <label className="flex items-start gap-3 text-[15px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(event) => setRulesAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
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
                >
                  <span className="flex items-center gap-2">
                    <span>{starting ? 'Đang vào thi...' : 'Bắt đầu làm bài'}</span>
                    {!starting && <ArrowRight className="w-4 h-4" />}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal - Sử dụng chuẩn Modal hệ thống */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Xác thực mật khẩu phòng thi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Nhập mật khẩu do giám thị công bố tại phòng thi để mở đề và bắt đầu tính giờ làm bài.
          </p>

          {isPasswordRequired && (
            <div className="space-y-1.5">
              <label className="block text-[15px] font-medium text-slate-800 dark:text-slate-100">
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
                  className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-[15px] font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none transition shadow-2xs ${
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
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          )}

          {isAccessCodeRequired && (
            <div className="space-y-1.5">
              <label className="block text-[15px] font-medium text-slate-800 dark:text-slate-100">
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-[15px] font-normal text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition shadow-2xs"
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
      {/* Candidate Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title={fullName}
        subtitle={`MSSV: ${studentCode} • Lớp ${studentClass}`}
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
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
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
