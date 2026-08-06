'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import {
  Users,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowLeft,
  X,
  ChevronDown,
  Activity,
  Flag,
  RotateCcw,
  PlusCircle,
  FileText,
} from 'lucide-react';

/* ─── helpers ─── */
function statusMeta(att: any) {
  if (!att) return { label: 'Chưa bắt đầu', cls: 'bg-slate-100 text-slate-600' };
  if (att.status === 'IN_PROGRESS')
    return { label: 'Đang làm bài', cls: 'bg-blue-50 text-blue-700' };
  if (att.status === 'DISCONNECTED')
    return { label: 'Mất kết nối', cls: 'bg-amber-50 text-amber-800' };
  if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(att.status))
    return { label: att.status === 'AUTO_SUBMITTED' ? 'Nộp tự động' : 'Đã nộp bài', cls: 'bg-emerald-50 text-emerald-700' };
  if (att.status === 'ABSENT') return { label: 'Vắng mặt', cls: 'bg-rose-50 text-rose-700' };
  return { label: att.status, cls: 'bg-slate-100 text-slate-600' };
}

function riskMeta(score: number) {
  if (score >= 40) return { cls: 'bg-rose-50 text-rose-700 animate-pulse', level: 'Cao' };
  if (score >= 15) return { cls: 'bg-amber-50 text-amber-800', level: 'Trung bình' };
  return { cls: 'bg-slate-100 text-slate-600', level: 'Thấp' };
}

const FILTER_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  IN_PROGRESS: 'Đang làm bài',
  FLAGGED: 'Có cảnh báo',
  SUBMITTED: 'Đã nộp',
};

export default function ProctorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleRoomId = Number(params?.scheduleRoomId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'FLAGGED' | 'SUBMITTED'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionType, setActionType] = useState<'EXTEND' | 'REOPEN' | 'FLAG' | 'RESOLVE' | null>(null);
  const [extraMinutes, setExtraMinutes] = useState(10);
  const [reason, setReason] = useState('');
  const [incidentDecision, setIncidentDecision] = useState('UNDER_REVIEW');
  const [resolutionDecision, setResolutionDecision] = useState<'REOPEN' | 'PENALTY' | 'TERMINATE'>('REOPEN');
  const [penaltyPoints, setPenaltyPoints] = useState(1);
  const [processing, setProcessing] = useState(false);
  const loadDashboardRef = useRef<((isBackground?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!scheduleRoomId) return;
    void loadDashboardRef.current?.();
    const interval = setInterval(() => { void loadDashboardRef.current?.(true); }, 3000);
    return () => clearInterval(interval);
  }, [scheduleRoomId]);

  const loadDashboard = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await onlineExamService.getLiveDashboard(scheduleRoomId);
      setData(res);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (!isBackground) setError(err.message || 'Không thể tải dashboard giám thị');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [scheduleRoomId]);
  loadDashboardRef.current = loadDashboard;

  const handleAction = async () => {
    if (!selectedStudent?.attempt?.id) return;
    try {
      setProcessing(true);
      if (actionType === 'EXTEND') await onlineExamService.extendTime(selectedStudent.attempt.id, extraMinutes, reason);
      else if (actionType === 'REOPEN') await onlineExamService.reopenAttempt(selectedStudent.attempt.id, reason);
      else if (actionType === 'FLAG') await onlineExamService.flagIncident(selectedStudent.attempt.id, reason, incidentDecision);
      else if (actionType === 'RESOLVE') await onlineExamService.resolveIncident(selectedStudent.attempt.id, resolutionDecision, penaltyPoints, reason);
      setActionType(null);
      setSelectedStudent(null);
      setReason('');
      loadDashboard(true);
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setProcessing(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Đang kết nối bảng điều khiển giám thị...</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md w-full text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Lỗi tải bảng điều khiển</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const students = data.students || [];
  const filteredStudents = students.filter((s: any) => {
    if (filter === 'IN_PROGRESS') return s.attempt?.status === 'IN_PROGRESS';
    if (filter === 'FLAGGED') return s.attempt?.isFlagged;
    if (filter === 'SUBMITTED') return ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status);
    return true;
  });

  const stats = data.stats || {};

  const KPI_CARDS = [
    { label: 'Tổng thí sinh', value: stats.total ?? 0, icon: Users, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'Đang làm bài', value: stats.inProgress ?? 0, icon: Activity, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Mất kết nối', value: stats.disconnected ?? 0, icon: WifiOff, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Đã nộp bài', value: stats.submitted ?? 0, icon: CheckCircle2, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Có cảnh báo', value: stats.flagged ?? 0, icon: ShieldAlert, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  ];

  const actionMeta: Record<string, { title: string; desc: string; icon: React.ElementType; color: string }> = {
    EXTEND: { title: 'Gia hạn thời gian làm bài', desc: 'Cộng thêm thời gian cho phiên đang thi hoặc vừa mất kết nối.', icon: Clock, color: 'text-blue-600' },
    REOPEN: { title: 'Mở lại phiên thi', desc: 'Cho phép sinh viên tiếp tục phiên thi đã kết thúc hoặc bị gián đoạn.', icon: RotateCcw, color: 'text-amber-600' },
    FLAG: { title: 'Lập biên bản sự cố vi phạm', desc: 'Ghi nhận sự cố; giám thị có thể xử lý và quyết định kết quả sau.', icon: Flag, color: 'text-rose-600' },
    RESOLVE: { title: 'Xử lý biên bản vi phạm', desc: 'Chọn mở lại, giữ điểm và trừ điểm, hoặc đình chỉ bài thi.', icon: ShieldAlert, color: 'text-violet-600' },
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <div className="w-full px-6 py-5 space-y-5 max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              {/* Status badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại
                </button>
                <span className="w-px h-3.5 bg-slate-300" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-bold uppercase tracking-wide">
                  <Activity className="w-3 h-3" />
                  Giám thị trực tiếp
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600">
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Đang cập nhật • mỗi 3 giây
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Phòng: <span className="text-blue-700">{data.roomName}</span>
                <span className="mx-2 text-slate-300">·</span>
                Môn: {data.subjectName}
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Ngày thi: {new Date(data.examDate).toLocaleDateString('vi-VN')} &nbsp;|&nbsp; Ca thi: {data.startTime} – {data.endTime}
                {lastUpdated && (
                  <span className="ml-3 text-slate-400">
                    Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {KPI_CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 shadow-2xs`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10.5px] font-bold ${color}`}>{label}</span>
                <Icon className={`w-4 h-4 ${color} opacity-60`} />
              </div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Guide banner ── */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-slate-700 font-medium">
          <span className="font-bold text-blue-700">Hướng dẫn: </span>
          <span className="text-slate-600">
            &quot;Gia hạn thời gian&quot; cộng phút cho phiên đang thi; &quot;Mở lại phiên thi&quot; cho phép tiếp tục sau khi gián đoạn; &quot;Mức cảnh báo&quot; là điểm rủi ro từ giám sát, không phải điểm bài thi.
          </span>
        </div>

        {/* ── Main table area ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          {/* Filter toolbar */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mr-1">Lọc:</span>
            {(['ALL', 'IN_PROGRESS', 'FLAGGED', 'SUBMITTED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 cursor-pointer',
                  filter === f
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100',
                ].join(' ')}
              >
                {FILTER_LABELS[f]}
                <span className={['ml-1.5 text-[10px] font-black', filter === f ? 'text-blue-200' : 'text-slate-400'].join(' ')}>
                  {f === 'ALL' && students.length}
                  {f === 'IN_PROGRESS' && students.filter((s: any) => s.attempt?.status === 'IN_PROGRESS').length}
                  {f === 'FLAGGED' && students.filter((s: any) => s.attempt?.isFlagged).length}
                  {f === 'SUBMITTED' && students.filter((s: any) => ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status)).length}
                </span>
              </button>
            ))}
            <span className="ml-auto text-[10.5px] font-semibold text-slate-400">
              {filteredStudents.length} thí sinh
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  {['SBD / Ghế', 'Họ và tên', 'Mã SV', 'Trạng thái', 'Mức cảnh báo', 'Thao tác'].map((h, i) => (
                    <th
                      key={h}
                      className={[
                        'px-5 py-3 text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wide whitespace-nowrap',
                        i === 5 ? 'text-right' : 'text-left',
                      ].join(' ')}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                      Không có thí sinh nào trong bộ lọc này
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s: any) => {
                    const att = s.attempt;
                    const riskScore = att?.riskScore || 0;
                    const { label: statusLabel, cls: statusCls } = statusMeta(att);
                    const { cls: riskCls, level: riskLevel } = riskMeta(riskScore);
                    const hasFlagged = att?.isFlagged;

                    return (
                      <tr key={s.student.id} className="hover:bg-slate-50/70 transition duration-100">
                        {/* SBD / Seat */}
                        <td className="px-5 py-3.5 font-mono font-black text-slate-900 text-xs">
                          {s.examNumber}
                          <span className="ml-1.5 text-slate-400 font-semibold">G:{s.seatNumber}</span>
                        </td>

                        {/* Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={['w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0', hasFlagged ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'].join(' ')}>
                              {s.student.fullName?.charAt(0) || '?'}
                            </div>
                            <span className="font-bold text-slate-900 text-xs">{s.student.fullName}</span>
                            {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          </div>
                        </td>

                        {/* Student code */}
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-600">
                          {s.student.studentCode}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${statusCls}`}>
                            {att?.status === 'IN_PROGRESS' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            )}
                            {statusLabel}
                            {att?.extraMinutes > 0 && (
                              <span className="ml-1 text-[9.5px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">+{att.extraMinutes}p</span>
                            )}
                          </span>
                        </td>

                        {/* Risk */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10.5px] font-mono font-bold ${riskCls}`}>
                            {riskScore} điểm
                            <span className="text-[9px] not-italic font-bold">({riskLevel})</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          {att && (
                            <div className="inline-flex items-center gap-1.5">
                              {['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && (
                                <button
                                  type="button"
                                  onClick={() => { setSelectedStudent(s); setActionType('EXTEND'); }}
                                  title="Gia hạn thời gian làm bài"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10.5px] font-bold hover:bg-blue-100 transition cursor-pointer"
                                >
                                  <Clock className="w-3 h-3" />
                                  Gia hạn
                                </button>
                              )}
                              {['DISCONNECTED', 'UNDER_REVIEW'].includes(att.status) && (
                                <button
                                  type="button"
                                  onClick={() => { setSelectedStudent(s); setActionType('REOPEN'); }}
                                  title="Mở lại phiên thi khi có sự cố"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10.5px] font-bold hover:bg-amber-100 transition cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Mở lại
                                </button>
                              )}
                              {att.isFlagged && (
                                <button
                                  type="button"
                                  onClick={() => { setSelectedStudent(s); setActionType('RESOLVE'); }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10.5px] font-bold hover:bg-emerald-100 transition cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Xử lý
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => { setSelectedStudent(s); setActionType('FLAG'); }}
                                title="Lập biên bản sự cố"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[10.5px] font-bold hover:bg-rose-100 transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                Biên bản
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════ ACTION MODAL ═══════ */}
      {actionType && selectedStudent && (() => {
        const meta = actionMeta[actionType];
        const MetaIcon = meta.icon;
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl">
              {/* Modal header */}
              <div className="flex items-start gap-3.5 p-6 border-b border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  actionType === 'EXTEND' ? 'bg-blue-50' : actionType === 'REOPEN' ? 'bg-amber-50' : actionType === 'FLAG' ? 'bg-rose-50' : 'bg-violet-50'
                }`}>
                  <MetaIcon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 leading-tight">{meta.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium leading-relaxed">{meta.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="text-slate-400 hover:text-slate-600 transition mt-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student info */}
              <div className="mx-6 mt-5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                Thí sinh: <span className="font-black text-slate-900">{selectedStudent.student.fullName}</span>
                <span className="ml-1.5 text-slate-400">({selectedStudent.student.studentCode})</span>
              </div>

              <div className="p-6 space-y-4">
                {/* Extra minutes (EXTEND) */}
                {actionType === 'EXTEND' && (
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-1.5">
                      Số phút cộng thêm
                    </label>
                    <input
                      type="number"
                      value={extraMinutes}
                      onChange={(e) => setExtraMinutes(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition"
                      min={1}
                      max={60}
                    />
                  </div>
                )}

                {/* Reopen Penalty (REOPEN) */}
                {actionType === 'REOPEN' && (
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-1.5">
                      Điểm trừ vi phạm quy chế (Penalty Points)
                    </label>
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      max={10}
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                      placeholder="Số điểm trừ (Ví dụ: 0.5, 1.0...)"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition"
                    />
                    <p className="mt-1 text-[11px] text-amber-700 font-semibold">
                      * Điểm phạt sẽ tự động trừ trực tiếp vào tổng điểm thi cuối cùng sau khi sinh viên hoàn thành bài thi.
                    </p>
                  </div>
                )}

                {/* Incident decision (FLAG) */}
                {actionType === 'FLAG' && (
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-1.5">
                      Quyết định xử lý
                    </label>
                    <div className="relative">
                      <select
                        value={incidentDecision}
                        onChange={(e) => setIncidentDecision(e.target.value)}
                        className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                      >
                        <option value="UNDER_REVIEW">Yêu cầu xem xét (UNDER_REVIEW)</option>
                        <option value="TERMINATED">Đình chỉ ngay lập tức (TERMINATED)</option>
                        <option value="WARNING">Cảnh báo (WARNING)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Resolution (RESOLVE) */}
                {actionType === 'RESOLVE' && (
                  <div className="space-y-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="text-xs font-bold text-amber-700">Sinh viên đã gửi giải trình. Chọn cách xử lý:</p>
                    <div className="relative">
                      <select
                        value={resolutionDecision}
                        onChange={(e) => setResolutionDecision(e.target.value as 'REOPEN' | 'PENALTY' | 'TERMINATE')}
                        className="w-full appearance-none border border-amber-200 bg-white rounded-xl px-3.5 py-2.5 pr-9 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400 transition cursor-pointer"
                      >
                        <option value="REOPEN">Chấp nhận giải trình, mở lại bài</option>
                        <option value="PENALTY">Giữ kết quả và trừ điểm</option>
                        <option value="TERMINATE">Đình chỉ bài thi</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    {resolutionDecision === 'PENALTY' && (
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={penaltyPoints}
                        onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                        placeholder="Số điểm trừ"
                        className="w-full border border-amber-200 bg-white rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400 transition"
                      />
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-1.5">
                    Lý do thao tác <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập nguyên nhân cụ thể..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleAction}
                    className={[
                      'px-5 py-2 rounded-xl text-white text-xs font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                      actionType === 'EXTEND' ? 'bg-blue-600 hover:bg-blue-700' :
                      actionType === 'REOPEN' ? 'bg-amber-500 hover:bg-amber-600' :
                      actionType === 'FLAG' ? 'bg-rose-600 hover:bg-rose-700' :
                      'bg-violet-600 hover:bg-violet-700',
                    ].join(' ')}
                  >
                    {processing ? (
                      <span className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
