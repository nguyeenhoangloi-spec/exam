'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { Plus, Check, Trash2, Filter } from 'lucide-react';
import { Question, Subject } from '../../types';

export default function QuestionBankPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    chapter: '1',
    content: '',
    difficulty: 'EASY',
    explanation: '',
    options: [
      { optionLabel: 'A', optionContent: '', isCorrect: true },
      { optionLabel: 'B', optionContent: '', isCorrect: false },
      { optionLabel: 'C', optionContent: '', isCorrect: false },
      { optionLabel: 'D', optionContent: '', isCorrect: false },
    ],
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchSubjects();
    fetchQuestions();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, subjectId: res.data[0].id.toString() }));
      }
    } catch (err) {}
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (subjectFilter) query += `subjectId=${subjectFilter}&`;
      if (difficultyFilter) query += `difficulty=${difficultyFilter}&`;
      if (statusFilter) query += `status=${statusFilter}&`;

      const res = await api.get(`/questions${query}`);
      setQuestions(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách câu hỏi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      subjectId: subjects[0]?.id?.toString() || '',
      chapter: '1',
      content: '',
      difficulty: 'EASY',
      explanation: '',
      options: [
        { optionLabel: 'A', optionContent: '', isCorrect: true },
        { optionLabel: 'B', optionContent: '', isCorrect: false },
        { optionLabel: 'C', optionContent: '', isCorrect: false },
        { optionLabel: 'D', optionContent: '', isCorrect: false },
      ],
    });
    setIsModalOpen(true);
  };

  const setCorrectOption = (index: number) => {
    const updated = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setFormData({ ...formData, options: updated });
  };

  const handleOptionChange = (index: number, content: string) => {
    const updated = [...formData.options];
    updated[index].optionContent = content;
    setFormData({ ...formData, options: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.options.some((o) => !o.optionContent.trim())) {
      setToast({ message: 'Vui lòng nhập đầy đủ nội dung các đáp án A, B, C, D.', type: 'error' });
      return;
    }

    try {
      await api.post('/questions', {
        subjectId: parseInt(formData.subjectId, 10),
        chapter: parseInt(formData.chapter, 10),
        content: formData.content,
        questionType: 'SINGLE_CHOICE',
        difficulty: formData.difficulty,
        explanation: formData.explanation,
        options: formData.options,
      });
      setToast({ message: 'Tạo câu hỏi mới thành công (chờ duyệt)!', type: 'success' });
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/questions/${id}/approve`, { status: 'APPROVED' });
      setToast({ message: 'Đã phê duyệt câu hỏi thành công!', type: 'success' });
      fetchQuestions();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setToast({ message: 'Đã xóa câu hỏi!', type: 'success' });
      fetchQuestions();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={currentUser} title="Ngân hàng câu hỏi" />

        <main className="p-8 max-w-7xl w-full mx-auto">
          {/* Filters & Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Tất cả môn học</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Tất cả độ khó</option>
                  <option value="EASY">Dễ (EASY)</option>
                  <option value="MEDIUM">Trung bình (MEDIUM)</option>
                  <option value="HARD">Khó (HARD)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ duyệt (PENDING)</option>
                  <option value="APPROVED">Đã duyệt (APPROVED)</option>
                </select>

                <button
                  onClick={fetchQuestions}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition"
                >
                  Lọc
                </button>
              </div>

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'TEACHER') && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm câu hỏi mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400">Đang tải ngân hàng câu hỏi...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                Không tìm thấy câu hỏi phù hợp.
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-sky-600">Câu {idx + 1}.</span>
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded">
                        Môn: {q.subject?.subjectName}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded">
                        Chương {q.chapter}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                          q.difficulty === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficulty === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                          q.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === 'PENDING' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'TEACHER') && (
                        <button
                          onClick={() => handleApprove(q.id)}
                          className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}
                      {currentUser?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="font-semibold text-slate-800 text-base mb-4">{q.content}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {q.options?.map((opt) => (
                      <div
                        key={opt.id || opt.optionLabel}
                        className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-3 ${
                          opt.isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs font-bold shadow-xs">
                          {opt.optionLabel}
                        </span>
                        <span>{opt.optionContent}</span>
                        {opt.isCorrect && <Check className="w-4 h-4 ml-auto text-emerald-600" />}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      💡 Giải thích: {q.explanation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm câu hỏi trắc nghiệm mới"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Môn học</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Chương</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Độ khó</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                <option value="EASY">Dễ (EASY)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="HARD">Khó (HARD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nội dung câu hỏi</label>
            <textarea
              rows={3}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Các phương án lựa chọn (Chọn 1 đáp án đúng):
            </label>
            <div className="space-y-2">
              {formData.options.map((opt, idx) => (
                <div key={opt.optionLabel} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={opt.isCorrect}
                    onChange={() => setCorrectOption(idx)}
                    className="w-4 h-4 text-sky-600"
                  />
                  <span className="font-bold text-sm w-6">{opt.optionLabel}.</span>
                  <input
                    type="text"
                    required
                    value={opt.optionContent}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Nội dung phương án ${opt.optionLabel}`}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Giải thích (không bắt buộc)</label>
            <input
              type="text"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Giải thích đáp án..."
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm"
            >
              Tạo câu hỏi
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
