'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Clock, ShieldCheck, AlertCircle, CheckCircle2, Monitor, ArrowRight, Award, Trophy, KeyRound } from 'lucide-react';

export default function StudentExamLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [examPassword, setExamPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');

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
      setError(err.response?.data?.message || err.message || 'Không thể bắt đầu làm bài thi');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Đang kiểm tra điều kiện dự thi...</span>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="border-b border-slate-100 pb-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold rounded-full uppercase tracking-wider">
              Thi Trắc Nghiệm Trực Tuyến
            </span>
            <h1 className="text-2xl font-black mt-2 text-slate-900">{schedule?.subject?.subjectName || examInfo?.subjectName || 'Bài Thi Trực Tuyến'}</h1>
            <p className="text-slate-500 text-xs font-medium mt-1">
              Mã môn: <strong className="text-slate-700">{schedule?.subject?.subjectCode || examInfo?.subjectCode || '---'}</strong> | Kỳ thi: <strong className="text-slate-700">{schedule?.examPeriod?.name || examInfo?.examPeriodName || '---'}</strong>
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 shrink-0">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold">Thời gian: {durationMinutes} phút</span>
          </div>
        </div>

        {/* If Student Already Finished The Exam */}
        {isCompleted ? (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl mb-8 text-center space-y-4 shadow-sm">
            <Trophy className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-xl font-black text-slate-900">Bạn Đã Hoàn Thành Bài Thi Này</h2>
            <p className="text-xs text-slate-600 font-medium">
              Bài thi của bạn đã được gửi về hệ thống và ghi nhận kết quả.
            </p>
            <div className="pt-2">
              <button
                onClick={() => router.push(`/student/online-exam/${existingAttempt.id}/result`)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition inline-flex items-center gap-2"
              >
                <Award className="w-4 h-4" /> Xem Kết Quả & Điểm Thi
              </button>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 space-y-1.5 shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>Thông báo từ Hệ thống Giám thị:</span>
                </div>
                <p className="text-xs font-bold leading-relaxed pl-7 text-rose-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50/80 border border-slate-200 p-5 rounded-2xl">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Thông tin Thí sinh & Ca thi</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">Họ và tên:</span>
                    <span className="font-bold text-slate-900">{fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">Mã sinh viên:</span>
                    <span className="font-mono font-bold text-blue-600">{studentCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">Khung giờ thi:</span>
                    <span className="font-bold text-slate-800">{examDateStr} ({timeSlotStr})</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 font-medium">Phòng thi & Địa điểm:</span>
                    <span className="font-bold text-slate-800">
                      {roomName ? `${roomName} ${building ? `(${building})` : ''}` : 'Chưa phân phòng thi'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">SBD / Số ghế:</span>
                    <span className="font-bold text-blue-700">
                      {examNumber} (Ghế: {seatNumber})
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200 p-5 rounded-2xl">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Kiểm tra Yêu cầu Bài thi</h3>
                <ul className="space-y-2.5 text-xs font-semibold">
                  <li className="flex items-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
                    Đồng hồ đếm ngược Server tự động
                  </li>
                  <li className="flex items-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
                    Tự động lưu đáp án khi chọn
                  </li>
                  <li className={`flex items-center ${config?.preventTabSwitch !== false ? 'text-amber-800' : 'text-slate-600'}`}>
                    <ShieldCheck className="w-4 h-4 mr-2 shrink-0 text-amber-600" />
                    Giám sát chuyển tab & toàn màn hình
                  </li>
                  <li className="flex items-center text-slate-700">
                    <Monitor className="w-4 h-4 mr-2 shrink-0 text-blue-600" />
                    Trình duyệt đã sẵn sàng
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 text-amber-900 text-xs shadow-xs">
              <p className="font-bold mb-1 text-amber-950">Nội quy thi nghiêm ngặt:</p>
              <p className="text-amber-800 leading-relaxed font-medium">
                Hệ thống tự động ghi nhận mọi hành vi chuyển tab, thoát toàn màn hình, mở công cụ lập trình hoặc mất kết nối.
                Bài thi sẽ bị tự động khóa và nộp nếu vi phạm quá số lần quy định.
              </p>
            </div>

            {(isPasswordRequired || isAccessCodeRequired) && (
              <div className="mb-6 rounded-2xl border-2 border-blue-400 bg-blue-50 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Xác thực Quyền dự thi
                </h3>

                {isPasswordRequired && (
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">
                      Mật khẩu thi chính thức <span className="text-rose-600 font-extrabold">* (Bắt buộc)</span>
                    </label>
                    <input
                      type="password"
                      autoComplete="off"
                      placeholder="Nhập Mật khẩu thi do Giám thị/Giảng viên phổ biến"
                      value={examPassword}
                      onChange={(e) => setExamPassword(e.target.value)}
                      className="w-full rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                    />
                    <p className="mt-1 text-[11px] text-blue-800 font-semibold">
                      Vui lòng nhập Mật khẩu thi chính thức được Cán bộ coi thi phổ biến trước giờ làm bài.
                    </p>
                  </div>
                )}

                {isAccessCodeRequired && (
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">
                      Mã truy cập phòng thi <span className="text-rose-600 font-extrabold">* (Bắt buộc)</span>
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Nhập Mã truy cập phòng thi"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="w-full rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {config?.requireRulesAcceptance !== false && (
              <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs font-semibold text-slate-800 shadow-xs hover:bg-blue-50 transition">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(event) => setRulesAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-blue-600 rounded"
                />
                <span>
                  Tôi đã đọc, hiểu và đồng ý chấp hành toàn bộ quy định thi. Tôi hiểu hệ thống có thể ghi nhận vi phạm và tự động khóa hoặc nộp bài theo quy chế.
                </span>
              </label>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Quay lại
              </button>
              <button
                onClick={handleStartExam}
                disabled={
                  starting ||
                  (error && !isPasswordRequired && !isAccessCodeRequired) ||
                  (config?.requireRulesAcceptance !== false && !rulesAccepted) ||
                  (isPasswordRequired && !examPassword.trim()) ||
                  (isAccessCodeRequired && !accessCode.trim())
                }
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center shadow-md shadow-blue-600/20 transition cursor-pointer"
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
          </>
        )}
      </div>
    </div>
  );
}
