'use client';

import React, { useEffect, useState } from 'react';
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
  const [actionType, setActionType] = useState<'EXTEND' | 'REOPEN' | 'FLAG' | null>(null);
  const [extraMinutes, setExtraMinutes] = useState(10);
  const [reason, setReason] = useState('');
  const [incidentDecision, setIncidentDecision] = useState('UNDER_REVIEW');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!scheduleRoomId) return;
    loadDashboard();

    // Long polling 3s để tự động cập nhật tiến độ sinh viên theo realtime
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [scheduleRoomId]);

  const loadDashboard = async (isBackground = false) => {
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
  };

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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-slate-300">Đang kết nối Dashboard Giám Thị trực tuyến...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Lỗi Tải Dashboard</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full uppercase tracking-wider">
                Giám Thí Trực Tiếp (Realtime)
              </span>
              <span className="flex items-center text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1.5"></span> Live
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2">Phòng: {data.roomName} - Môn: {data.subjectName}</h1>
            <p className="text-slate-400 text-xs mt-1">
              Ngày thi: {new Date(data.examDate).toLocaleDateString('vi-VN')} | Ca: {data.startTime} - {data.endTime}
            </p>
          </div>

          <button
            onClick={() => loadDashboard(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center self-start md:self-auto border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Làm Mới
          </button>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 font-semibold mb-1">Tổng Thí Sinh</div>
            <div className="text-2xl font-bold text-white">{data.stats?.total || 0}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-emerald-400 font-semibold mb-1">Đang Làm Bài</div>
            <div className="text-2xl font-bold text-emerald-400">{data.stats?.inProgress || 0}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-amber-400 font-semibold mb-1">Mất Kết Nối</div>
            <div className="text-2xl font-bold text-amber-400">{data.stats?.disconnected || 0}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-indigo-400 font-semibold mb-1">Đã Nộp Bài</div>
            <div className="text-2xl font-bold text-indigo-400">{data.stats?.submitted || 0}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-rose-400 font-semibold mb-1">Có Cảnh Báo Vi Phạm</div>
            <div className="text-2xl font-bold text-rose-400">{data.stats?.flagged || 0}</div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          {(['ALL', 'IN_PROGRESS', 'FLAGGED', 'SUBMITTED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {f === 'ALL' && 'Tất Cả'}
              {f === 'IN_PROGRESS' && 'Đang Làm Bài'}
              {f === 'FLAGGED' && 'Có Cảnh Báo'}
              {f === 'SUBMITTED' && 'Đã Nộp'}
            </button>
          ))}
        </div>

        {/* STUDENT MONITORING TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">SBD / Ghế</th>
                  <th className="px-6 py-4">Sinh Viên</th>
                  <th className="px-6 py-4">Mã Sinh Viên</th>
                  <th className="px-6 py-4">Trạng Thái Bài Thi</th>
                  <th className="px-6 py-4">Risk Score</th>
                  <th className="px-6 py-4 text-right">Thao Tác Giám Thị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStudents.map((s: any) => {
                  const att = s.attempt;
                  const riskScore = att?.riskScore || 0;

                  return (
                    <tr key={s.student.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {s.examNumber} <span className="text-xs text-slate-500">(G:{s.seatNumber})</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-100">{s.student.fullName}</td>
                      <td className="px-6 py-4 font-mono text-indigo-400">{s.student.studentCode}</td>
                      <td className="px-6 py-4">
                        {!att ? (
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                            Chưa bắt đầu
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                              att.status === 'IN_PROGRESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : att.status === 'DISCONNECTED'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : att.isFlagged
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            }`}
                          >
                            {att.status} {att.extraMinutes > 0 && `(+${att.extraMinutes}m)`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                            riskScore >= 40
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                              : riskScore >= 15
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {riskScore} pts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {att && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActionType('EXTEND');
                              }}
                              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/30 transition"
                            >
                              + Phút Thi
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActionType('REOPEN');
                              }}
                              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30 transition"
                            >
                              Mở Lại
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActionType('FLAG');
                              }}
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-medium rounded-lg border border-rose-500/30 transition"
                            >
                              Biên Bản
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">
                {actionType === 'EXTEND' && 'Gia Hạn Thời Gian Làm Bài'}
                {actionType === 'REOPEN' && 'Cho Phép Vào Thi Lại (Mở Lại Phiên)'}
                {actionType === 'FLAG' && 'Lập Biên Bản Sự Cố Vi Phạm'}
              </h3>
              <p className="text-xs text-slate-400">
                Thí sinh: <span className="font-semibold text-slate-200">{selectedStudent.student.fullName}</span> ({selectedStudent.student.studentCode})
              </p>

              {actionType === 'EXTEND' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số phút gia hạn thêm:</label>
                  <input
                    type="number"
                    value={extraMinutes}
                    onChange={(e) => setExtraMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UNDER_REVIEW">Yêu cầu xem xét (UNDER_REVIEW)</option>
                    <option value="TERMINATED">Đình chỉ thi ngay lập tức (TERMINATED)</option>
                    <option value="WARNING">Cảnh báo (WARNING)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lý do thao tác (Ghi log audit):</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập nguyên nhân..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  disabled={processing}
                  onClick={handleAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
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
