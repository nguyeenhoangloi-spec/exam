'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { FileText, Sparkles, Eye, Trash2 } from 'lucide-react';
import { ExamPaper, ExamSchedule } from '../../types';

export default function ExamPapersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    examScheduleId: '',
    paperCode: '001',
    durationMinutes: '60',
    easyCount: '2',
    mediumCount: '2',
    hardCount: '1',
  });

  // Modal Detail State
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [resSchedules, resPapers] = await Promise.all([
        api.get('/exam-schedules'),
        api.get('/exam-papers'),
      ]);
      setSchedules(resSchedules.data);
      setPapers(resPapers.data);
      if (resSchedules.data.length > 0) {
        setFormData((prev) => ({ ...prev, examScheduleId: resSchedules.data[0].id.toString() }));
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRandom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examScheduleId) {
      setToast({ message: 'Vui lòng chọn lịch thi.', type: 'error' });
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/exam-papers/create-random', {
        examScheduleId: parseInt(formData.examScheduleId, 10),
        paperCode: formData.paperCode,
        durationMinutes: parseInt(formData.durationMinutes, 10),
        easyCount: parseInt(formData.easyCount, 10),
        mediumCount: parseInt(formData.mediumCount, 10),
        hardCount: parseInt(formData.hardCount, 10),
      });

      setToast({ message: 'Tạo đề thi ngẫu nhiên thành công!', type: 'success' });
      fetchData();
      // Auto open detail
      setSelectedPaper(res.data);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/exam-papers/${id}`);
      setSelectedPaper(res.data);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa đề thi này?')) return;
    try {
      await api.delete(`/exam-papers/${id}`);
      setToast({ message: 'Đã xóa đề thi!', type: 'success' });
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <AppShell user={currentUser} title="Tạo đề thi ngẫu nhiên">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Creation Column */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Rút đề thi ngẫu nhiên
              </h2>

              <form onSubmit={handleCreateRandom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">1. Chọn lịch thi</label>
                  <select
                    value={formData.examScheduleId}
                    onChange={(e) => setFormData({ ...formData, examScheduleId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject?.subjectName} ({s.subject?.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mã đề thi</label>
                    <input
                      type="text"
                      required
                      value={formData.paperCode}
                      onChange={(e) => setFormData({ ...formData, paperCode: e.target.value })}
                      placeholder="Mã đề, VD: 001"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Thời gian (Phút)</label>
                    <input
                      type="number"
                      required
                      min={15}
                      max={180}
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Ma trận độ khó câu hỏi:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs font-medium text-emerald-600 block mb-1">Số câu Dễ</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.easyCount}
                        onChange={(e) => setFormData({ ...formData, easyCount: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-amber-600 block mb-1">Số câu TB</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.mediumCount}
                        onChange={(e) => setFormData({ ...formData, mediumCount: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-rose-600 block mb-1">Số câu Khó</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.hardCount}
                        onChange={(e) => setFormData({ ...formData, hardCount: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-500/25 transition duration-200 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{creating ? 'Đang khởi tạo đề...' : 'Tạo đề thi random'}</span>
                </button>
              </form>
            </div>

            {/* Existing Exam Papers List Column */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                Danh sách Đề thi đã khởi tạo
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Mã đề</th>
                      <th className="px-4 py-3">Tên đề thi</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Tổng điểm</th>
                      <th className="px-4 py-3">Số câu hỏi</th>
                      <th className="px-4 py-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          Đang tải danh sách đề thi...
                        </td>
                      </tr>
                    ) : papers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          Chưa có đề thi nào.
                        </td>
                      </tr>
                    ) : (
                      papers.map((paper) => (
                        <tr key={paper.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-extrabold text-purple-600">{paper.paperCode}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{paper.title}</td>
                          <td className="px-4 py-3 font-medium">{paper.durationMinutes} phút</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{paper.totalScore} điểm</td>
                          <td className="px-4 py-3 font-semibold">{paper._count?.questions || 0} câu</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => openDetail(paper.id)}
                              className="p-1.5 hover:bg-sky-50 text-sky-600 rounded-lg transition"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && (
                              <button
                                onClick={() => handleDelete(paper.id)}
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Exam Paper Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedPaper ? `Chi tiết Đề thi (Mã đề: ${selectedPaper.paperCode})` : 'Chi tiết đề thi'}
      >
        {selectedPaper && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-base mb-1">{selectedPaper.title}</h3>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 mt-2">
                <span>Môn thi: {selectedPaper.examSchedule?.subject?.subjectName}</span>
                <span>Thời gian làm bài: {selectedPaper.durationMinutes} phút</span>
                <span>Tổng điểm: {selectedPaper.totalScore} điểm</span>
                <span>Tổng số câu: {selectedPaper.questions?.length} câu</span>
              </div>
            </div>

            <div className="space-y-4">
              {selectedPaper.questions?.map((pq: any) => (
                <div key={pq.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <p className="font-bold text-sm text-slate-900 mb-2">
                    Câu {pq.questionOrder}. ({pq.score} điểm) {pq.question?.content}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {pq.question?.options?.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border ${
                          opt.isCorrect ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {opt.optionLabel}. {opt.optionContent}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
