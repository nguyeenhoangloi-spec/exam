'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { Users, Clock, AlertTriangle, RefreshCw, ShieldAlert, PlusCircle, Unlock, FileSpreadsheet } from 'lucide-react';

export default function ProctorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleRoomId = Number(params?.scheduleRoomId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'FLAGGED' | 'SUBMITTED'>('ALL');

  // Modals action
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

    // Long polling 3s để tự động cập nhật tiến độ sinh viên theo realtime
    const interval = setInterval(() => {
      void loadDashboardRef.current?.(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [scheduleRoomId]);

  const loadDashboard = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await onlineExamService.getLiveDashboard(scheduleRoomId);
      setData(res);
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
      if (actionType === 'EXTEND') {
        await onlineExamService.extendTime(selectedStudent.attempt.id, extraMinutes, reason);
      } else if (actionType === 'REOPEN') {
        await onlineExamService.reopenAttempt(selectedStudent.attempt.id, reason);
      } else if (actionType === 'FLAG') {
        await onlineExamService.flagIncident(selectedStudent.attempt.id, reason, incidentDecision);
      } else if (actionType === 'RESOLVE') {
        await onlineExamService.resolveIncident(selectedStudent.attempt.id, resolutionDecision, penaltyPoints, reason);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-600">Đang kết nối bảng điều khiển giám thị trực tuyến...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md text-center shadow-lg">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Lỗi tải bảng điều khiển</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl"
          >
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold rounded-full uppercase tracking-wider">
                Giám Thí Trực Tiếp (Realtime)
              </span>
              <span className="flex items-center text-xs text-emerald-400 font-semibold" title="Dữ liệu tự động cập nhật mỗi 3 giây">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1.5"></span> Đang cập nhật
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Phòng: {data.roomName} - Môn: {data.subjectName}</h1>
            <p className="text-slate-600 text-xs mt-1">
              Ngày thi: {new Date(data.examDate).toLocaleDateString('vi-VN')} | Ca: {data.startTime} - {data.endTime}
            </p>
          </div>

          <button
            onClick={() => loadDashboard(false)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center self-start md:self-auto border border-slate-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Làm Mới
          </button>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="text-xs text-slate-400 font-semibold mb-1">Tổng Thí Sinh</div>
            <div className="text-2xl font-bold text-slate-900">{data.stats?.total || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="text-xs text-emerald-400 font-semibold mb-1">Đang Làm Bài</div>
            <div className="text-2xl font-bold text-emerald-400">{data.stats?.inProgress || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="text-xs text-amber-400 font-semibold mb-1">Mất Kết Nối</div>
            <div className="text-2xl font-bold text-amber-400">{data.stats?.disconnected || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="text-xs text-blue-500 font-semibold mb-1">Đã Nộp Bài</div>
            <div className="text-2xl font-bold text-blue-500">{data.stats?.submitted || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="text-xs text-rose-400 font-semibold mb-1">Có Cảnh Báo Vi Phạm</div>
            <div className="text-2xl font-bold text-rose-400">{data.stats?.flagged || 0}</div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          {(['ALL', 'IN_PROGRESS', 'FLAGGED', 'SUBMITTED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${filter === f
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
            >
              {f === 'ALL' && 'Tất Cả'}
              {f === 'IN_PROGRESS' && 'Đang Làm Bài'}
              {f === 'FLAGGED' && 'Có Cảnh Báo'}
              {f === 'SUBMITTED' && 'Đã Nộp'}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-slate-700">
          <strong className="text-blue-600">Hướng dẫn:</strong> “Gia hạn thời gian” cộng phút cho phiên đang thi; “Mở lại phiên thi” cho phép tiếp tục phiên đã kết thúc hoặc gián đoạn; “Mức cảnh báo” là điểm rủi ro từ các sự kiện giám sát, không phải điểm bài thi.
        </div>

        {/* STUDENT MONITORING TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">SBD / Ghế</th>
                  <th className="px-6 py-4">Sinh Viên</th>
                  <th className="px-6 py-4">Mã Sinh Viên</th>
                  <th className="px-6 py-4">Trạng Thái Bài Thi</th>
                  <th className="px-6 py-4">Mức cảnh báo</th>
                  <th className="px-6 py-4 text-right">Thao Tác Giám Thị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((s: any) => {
                  const att = s.attempt;
                  const riskScore = att?.riskScore || 0;

                  return (
                    <tr key={s.student.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {s.examNumber} <span className="text-xs text-slate-500">(G:{s.seatNumber})</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{s.student.fullName}</td>
                      <td className="px-6 py-4 font-mono text-blue-500">{s.student.studentCode}</td>
                      <td className="px-6 py-4">
                        {!att ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200">
                            Chưa bắt đầu
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${att.status === 'IN_PROGRESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : att.status === 'DISCONNECTED'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : att.isFlagged
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              }`}
                          >
                            {(att.status === 'IN_PROGRESS' ? 'Đang làm bài' : att.status === 'DISCONNECTED' ? 'Mất kết nối' : att.status === 'SUBMITTED' ? 'Đã nộp bài' : att.status === 'ABSENT' ? 'Vắng mặt' : att.status)} {att.extraMinutes > 0 && `(+${att.extraMinutes} phút)`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${riskScore >= 40
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                              : riskScore >= 15
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                          {riskScore} điểm
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {att && (
                          <>
                            {['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActionType('EXTEND');
                              }}
                              title="Cộng thêm thời gian làm bài khi sinh viên đang thi hoặc bị mất kết nối"
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 transition"
                            >
                              Gia hạn thời gian
                            </button>}
                            {['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'DISCONNECTED'].includes(att.status) && <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActionType('REOPEN');
                              }}
                              title="Cho phép sinh viên tiếp tục phiên thi đã kết thúc hoặc bị gián đoạn"
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 transition"
                            >
                              Mở lại phiên thi
                            </button>}
                            {att.isFlagged && (
                              <button onClick={() => { setSelectedStudent(s); setActionType('RESOLVE'); }} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 transition">
                                Xử lý vi phạm
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActionType('FLAG');
                              }}
                              title="Ghi nhận sự cố hoặc vi phạm để xử lý sau"
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition"
                            >
                              Lập biên bản
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL ACTION */}
        {actionType && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                {actionType === 'EXTEND' && 'Gia hạn thời gian làm bài'}
                {actionType === 'REOPEN' && 'Mở lại phiên thi cho sinh viên'}
                {actionType === 'FLAG' && 'Lập biên bản sự cố vi phạm'}
                {actionType === 'RESOLVE' && 'Xử lý biên bản vi phạm'}
              </h3>
              <p className="text-xs text-slate-400">
                {actionType === 'EXTEND' && 'Gia hạn chỉ cộng thêm thời gian cho phiên đang thi hoặc vừa mất kết nối.'}
                {actionType === 'REOPEN' && 'Mở lại cho phép sinh viên tiếp tục phiên thi đã kết thúc hoặc bị gián đoạn.'}
                {actionType === 'FLAG' && 'Biên bản dùng để ghi nhận sự cố; sau đó giám thị có thể xử lý và quyết định kết quả.'}
                {actionType === 'RESOLVE' && 'Chọn mở lại, giữ điểm và trừ điểm, hoặc đình chỉ bài thi.'}
              </p>
              <p className="text-xs text-slate-400">
                Thí sinh: <span className="font-semibold text-slate-900">{selectedStudent.student.fullName}</span> ({selectedStudent.student.studentCode})
              </p>

              {actionType === 'EXTEND' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số phút được cộng thêm:</label>
                  <input
                    type="number"
                    value={extraMinutes}
                    onChange={(e) => setExtraMinutes(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    min={1}
                    max={60}
                  />
                </div>
              )}

              {actionType === 'FLAG' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Quyết định xử lý:</label>
                  <select
                    value={incidentDecision}
                    onChange={(e) => setIncidentDecision(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="UNDER_REVIEW">Yêu cầu xem xét (UNDER_REVIEW)</option>
                    <option value="TERMINATED">Đình chỉ thi ngay lập tức (TERMINATED)</option>
                    <option value="WARNING">Cảnh báo (WARNING)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lý do thao tác (bắt buộc để ghi nhận):</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập nguyên nhân..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {actionType === 'RESOLVE' && (
                <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-xs text-amber-200">Sinh viên đã gửi giải trình. Chọn cách xử lý:</p>
                  <select value={resolutionDecision} onChange={(e) => setResolutionDecision(e.target.value as 'REOPEN' | 'PENALTY' | 'TERMINATE')} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900">
                    <option value="REOPEN">Chấp nhận giải trình, mở lại bài</option>
                    <option value="PENALTY">Giữ kết quả và trừ điểm</option>
                    <option value="TERMINATE">Đình chỉ bài thi</option>
                  </select>
                  {resolutionDecision === 'PENALTY' && <input type="number" min={0} max={10} value={penaltyPoints} onChange={(e) => setPenaltyPoints(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900" placeholder="Số điểm trừ" />}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  disabled={processing}
                  onClick={handleAction}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  {processing ? 'Đang xử lý...' : 'Xác Nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
