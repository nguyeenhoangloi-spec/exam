'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import { CheckCircle2, AlertCircle, FileText, Send, ArrowLeft } from 'lucide-react';

export default function StudentExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  const loadResult = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await onlineExamService.getAttemptResult(attemptId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải kết quả bài thi');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    void loadResult();
  }, [attemptId, loadResult]);

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    try {
      setSubmittingAppeal(true);
      await onlineExamService.submitAppeal(attemptId, appealReason);
      setAppealSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Không thể gửi giải trình');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-600">Đang tải thông tin kết quả...</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Không Thể Tải Kết Quả</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/student/exam-schedule')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl"
          >
            Về Lịch Thi
          </button>
        </div>
      </div>
    );
  }

  const isUnderReview = result.status === 'UNDER_REVIEW' || result.isFlagged;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        <div className="text-center pb-8 border-b border-slate-200">
          {isUnderReview ? (
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-700">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {isUnderReview ? 'Bài Thi Cần Được Xem Xét' : 'Hoàn Thành Bài Thi Trực Tuyến'}
          </h1>
          <p className="text-slate-600 text-sm">
            {isUnderReview
              ? 'Hệ thống nhận thấy có một số sự kiện rủi ro cần cán bộ coi thi phê duyệt.'
              : 'Bài thi của bạn đã được lưu và gửi về hệ thống thành công.'}
          </p>
        </div>

        <div className="my-8 space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-3 text-sm">
              <span className="text-slate-600">Trạng thái bài thi:</span>
              <span className="font-semibold text-blue-700">{result.status === 'UNDER_REVIEW' ? 'Đang được xem xét' : result.status === 'GRADED' ? 'Đã chấm điểm' : result.status === 'SUBMITTED' ? 'Đã nộp bài' : result.status}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3 text-sm">
              <span className="text-slate-600">Thời điểm nộp bài:</span>
              <span className="font-medium text-slate-700">
                {result.submittedAt ? new Date(result.submittedAt).toLocaleString('vi-VN') : 'Mới đây'}
              </span>
            </div>

            {result.totalScore !== undefined && result.totalScore !== null ? (
              <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-bold">
                <span className="text-slate-700">Điểm số đạt được:</span>
                <span className="text-emerald-700 text-2xl font-mono">
                  {result.totalScore} / {result.maxScore || 10} điểm
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 text-xs">
                <strong>Quy chế công bố điểm thi:</strong> Điểm số chính thức sẽ được công bố sau khi ca thi kết thúc{result.examEndTime ? ` (Dự kiến lúc ${result.examEndTime})` : ''}.
              </div>
            )}
          </div>
        </div>

        {isUnderReview && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl mb-8">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Gửi Giải Trình Sự Cố
            </h3>
            <p className="text-xs text-amber-700 mb-4">
              Nếu bài thi bị gián đoạn do rớt mạng, lỗi trình duyệt hoặc lý do khách quan, bạn có thể gửi giải trình bên dưới.
            </p>

            {appealSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 text-xs font-semibold">
                ✓ Đã gửi giải trình thành công. Giám thị sẽ tiến hành xem xét biên bản.
              </div>
            ) : (
              <form onSubmit={handleSendAppeal} className="space-y-4">
                <textarea
                  rows={3}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do sự cố xảy ra..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl flex items-center transition"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submittingAppeal ? 'Đang gửi...' : 'Gửi Giải Trình'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => router.push('/student/exam-schedule')}
            className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay về Lịch Thi
          </button>
        </div>
      </div>
    </div>
  );
}
