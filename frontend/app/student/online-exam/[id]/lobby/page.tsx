'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Clock, ShieldCheck, AlertCircle, CheckCircle2, Monitor, ArrowRight, Award, Trophy, KeyRound, Lock, Eye, EyeOff, ShieldAlert, Sparkles, User, MapPin, Hash } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8 flex flex-col justify-center items-center">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Banner Header Navy Đậm Chất Lượng Cao */}
        <div className="bg-gradient-to-r from-slate-950 via-[#001E5C] to-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-bold text-blue-200 tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>{examTypeBadgeText}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                {schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài Thi Trực Tuyến'}
              </h1>
              <p className="text-xs text-blue-200/80 font-medium flex items-center gap-2 flex-wrap">
                <span>Mã môn: <strong className="text-white font-bold">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</strong></span>
                <span>•</span>
                <span>Kỳ thi: <strong className="text-white font-bold">{schedule?.examPeriod?.name || examInfo?.examPeriodName || '---'}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shrink-0">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
                <Clock className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <span className="text-[10px] text-blue-200 font-semibold block uppercase">Thời gian làm bài</span>
                <span className="text-sm font-black text-white">{durationMinutes} phút</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung chính của Lobby */}
        <div className="p-6 md:p-8 space-y-6">

          {/* Trường hợp Sinh viên đã thi xong */}
          {isCompleted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Bạn Đã Hoàn Thành Bài Thi Này</h2>
              <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                Bài thi của bạn đã được lưu an toàn và ghi nhận lên hệ thống khảo thí.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/student/online-exam/${existingAttempt.id}/result`)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" /> Xem Kết Quả & Điểm Thi
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Thông báo lỗi nếu có */}
              {error && (
                <div className="p-4 md:p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 space-y-1.5 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>Thông báo từ Hệ thống Giám thị:</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed pl-7 text-rose-800">{error}</p>
                </div>
              )}

              {/* Lưới Thông tin Thí sinh & Kiểm tra Yêu cầu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Thẻ Thí sinh */}
                <div className="bg-slate-50 border border-slate-200/90 p-5 rounded-2xl space-y-3.5 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <User className="w-4 h-4 text-blue-600" />
                    Thông tin Thí sinh & Phòng thi
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-semibold">Họ và tên:</span>
                      <span className="font-black text-slate-900 text-sm">{fullName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-semibold">Mã sinh viên:</span>
                      <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{studentCode}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-semibold">Khung giờ thi:</span>
                      <span className="font-bold text-slate-900">{examDateStr} ({timeSlotStr})</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500 font-semibold">Phòng thi & Địa điểm:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {roomName ? `${roomName} ${building ? `(${building})` : ''}` : 'Chưa phân phòng'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">SBD / Số ghế:</span>
                      <span className="font-extrabold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
                        {examNumber} (Ghế: {seatNumber})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thẻ Kiểm tra Yêu cầu & An toàn */}
                <div className="bg-slate-50 border border-slate-200/90 p-5 rounded-2xl space-y-3.5 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Điều kiện Kỹ thuật & An toàn
                  </h3>
                  <ul className="space-y-3 text-xs font-semibold">
                    <li className="flex items-center text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 mr-2.5 shrink-0 text-emerald-600" />
                      <span>Đồng hồ đếm ngược Server tự động</span>
                    </li>
                    <li className="flex items-center text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 mr-2.5 shrink-0 text-emerald-600" />
                      <span>Tự động lưu đáp án câu hỏi tức thì</span>
                    </li>
                    <li className="flex items-center text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                      <ShieldAlert className="w-4 h-4 mr-2.5 shrink-0 text-amber-600" />
                      <span>Giám sát chuyển tab & Toàn màn hình</span>
                    </li>
                    <li className="flex items-center text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                      <Monitor className="w-4 h-4 mr-2.5 shrink-0 text-blue-600" />
                      <span>Trình duyệt sẵn sàng</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Khối Nhập Mật Khẩu Thi (Tối quan trọng & Nổi bật) */}
              {(isPasswordRequired || isAccessCodeRequired) && (
                <div className="rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/50 p-6 shadow-md space-y-4">
                  <div className="flex items-center gap-3 border-b border-blue-200/80 pb-3">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Nhập Mật Khẩu Thi Để Vào Bài
                      </h3>
                      <p className="text-xs text-blue-800 font-semibold mt-0.5">
                        Mật khẩu được Cán bộ coi thi / Giám thị công bố tại phòng thi trước giờ phát đề.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {isPasswordRequired && (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-extrabold text-slate-900">
                          Mật khẩu thi chính thức <span className="text-rose-600 font-black">* (Bắt buộc)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="off"
                            placeholder="Nhập Mật khẩu do Giám thị cung cấp (ví dụ: 123456)"
                            value={examPassword}
                            onChange={(e) => setExamPassword(e.target.value)}
                            className="w-full rounded-xl border-2 border-blue-400 bg-white px-4 py-3.5 pr-12 text-sm font-black text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 focus:outline-none shadow-sm transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1 transition cursor-pointer"
                            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {isAccessCodeRequired && (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-extrabold text-slate-900">
                          Mã truy cập phòng thi <span className="text-rose-600 font-black">* (Bắt buộc)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            autoComplete="off"
                            placeholder="Nhập Mã truy cập phòng thi"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="w-full rounded-xl border-2 border-blue-400 bg-white px-4 py-3.5 text-sm font-black text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 focus:outline-none shadow-sm transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chấp nhận quy định thi */}
              {config?.requireRulesAcceptance !== false && (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-100/80 transition">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(event) => setRulesAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <span>
                    Tôi cam kết bảo mật nội quy, không quay chụp đề thi và chấp hành toàn bộ quy định khảo thí. Tôi hiểu hệ thống sẽ tự động giám sát và khóa bài làm nếu phát hiện vi phạm.
                  </span>
                </label>
              )}

              {/* Thanh thao tác nút bấm */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs"
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
                  className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-98 cursor-pointer"
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
            </>
          )}
        </div>
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
