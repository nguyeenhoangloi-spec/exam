'use client';
import { useState } from 'react';
import api from '../../lib/api';
import { Subject } from '../../types';
import { Modal } from '../Modal';

export function QuestionAIWizard({ open, subjects, onClose, onDone }: { open: boolean; subjects: Subject[]; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ subjectId: '', chapterId: '', type: 'SINGLE_CHOICE', difficulty: 'MEDIUM', bloomLevel: 'UNDERSTAND', count: 5, prompt: '' });
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const subject = subjects.find(s => String(s.id) === form.subjectId);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v, ...(k === 'subjectId' ? { chapterId: '' } : {}) }));

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadStatus('Đang đọc tệp tài liệu...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/questions/ai-extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.text) {
        set('prompt', res.data.text);
        setUploadStatus(`✅ Đã đọc xong tệp "${file.name}" (${res.data.text.length} ký tự).`);
      }
    } catch (e: any) {
      setUploadStatus(`❌ Lỗi đọc tệp: ${e.response?.data?.message || e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const r = await api.post('/questions/ai-generate', { ...form, subjectId: Number(form.subjectId), count: Number(form.count) });
      setItems(r.data);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.post('/questions/ai-save', { questions: items.map(({ duplicate, ...q }) => q) });
      onDone();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="AI Wizard - Tạo câu hỏi bằng Gemini">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)} className="rounded-lg border p-2 text-sm">
            <option value="">Chọn môn</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
          </select>
          <select value={form.chapterId} onChange={e => set('chapterId', e.target.value)} className="rounded-lg border p-2 text-sm">
            <option value="">Chọn chương</option>
            {subject?.chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="rounded-lg border p-2 text-sm">
            <option value="SINGLE_CHOICE">Trắc nghiệm (1 đáp án)</option>
            <option value="MULTIPLE_CHOICE">Trắc nghiệm (Nhiều đáp án)</option>
            <option value="TRUE_FALSE">Đúng / Sai</option>
            <option value="FILL_BLANK">Điền từ</option>
            <option value="ESSAY">Tự luận</option>
          </select>
          <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="rounded-lg border p-2 text-sm">
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
          <select value={form.bloomLevel} onChange={e => set('bloomLevel', e.target.value)} className="rounded-lg border p-2 text-sm">
            <option value="REMEMBER">Nhận biết (Remember)</option>
            <option value="UNDERSTAND">Thông hiểu (Understand)</option>
            <option value="APPLY">Vận dụng (Apply)</option>
            <option value="ANALYZE">Phân tích (Analyze)</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Số câu:</span>
            <input type="number" min="1" max="20" value={form.count} onChange={e => set('count', e.target.value)} className="w-full rounded-lg border p-2 text-sm" />
          </div>
        </div>

        {/* Upload File tài liệu */}
        <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-3 text-xs">
          <label className="mb-1 block font-semibold text-violet-800">
            📄 Hoặc tải lên tệp tài liệu bài giảng (PDF, Word .docx, .txt):
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={e => handleFileUpload(e.target.files?.[0] || null)}
            disabled={uploading}
            className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-700 cursor-pointer"
          />
          {uploadStatus && <p className="mt-1 text-xs text-violet-700 font-medium">{uploadStatus}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Chủ đề hoặc nội dung tài liệu tham khảo:</label>
          <textarea
            rows={4}
            value={form.prompt}
            onChange={e => set('prompt', e.target.value)}
            placeholder="Dán nội dung bài giảng hoặc tải tệp tài liệu PDF/Word ở trên..."
            className="w-full rounded-lg border p-2.5 text-sm"
          />
        </div>

        <button
          disabled={busy || !form.chapterId || uploading}
          onClick={generate}
          className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? '⏳ AI đang sinh câu hỏi...' : '✨ Tạo câu hỏi tự động bằng Gemini'}
        </button>

        {items.map((q, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-700">Câu {i + 1}:</span>
              {q.duplicate && <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Trùng câu {q.duplicate.code}</span>}
            </div>
            <textarea
              rows={2}
              value={q.content}
              onChange={e => setItems(items.map((x, j) => j === i ? { ...x, content: e.target.value } : x))}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white font-medium"
            />
            {q.options && q.options.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-xs font-semibold text-slate-500">Đáp án (A, B, C, D):</span>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt: any, optIdx: number) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium ${
                        opt.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="flex-1">{opt.content}</span>
                      {opt.isCorrect && <span className="text-[10px] text-emerald-700 font-bold">✓ Đáp án đúng</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {q.explanation && (
              <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                💡 <span className="font-semibold">Giải thích:</span> {q.explanation}
              </p>
            )}
          </div>
        ))}

        {items.length > 0 && (
          <button disabled={busy} onClick={save} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
            💾 Lưu {items.length} câu vào ngân hàng (DRAFT)
          </button>
        )}
      </div>
    </Modal>
  );
}

