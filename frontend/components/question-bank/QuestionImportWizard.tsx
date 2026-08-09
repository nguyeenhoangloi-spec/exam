'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { Subject } from '../../types';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { FileSpreadsheet, FileText, Download, X, Sparkles, UploadCloud } from 'lucide-react';
import { Button } from '../ui/Button';

type Mode = 'table' | 'document' | 'ai_generate';

const types = [
  ['SINGLE_CHOICE', 'Trắc nghiệm'],
  ['FILL_BLANK', 'Điền vào chỗ trống'],
  ['ESSAY', 'Tự luận'],
];

const difficulties = [
  ['EASY', 'Dễ'],
  ['MEDIUM', 'Trung bình'],
  ['HARD', 'Khó'],
];

const blooms = [
  ['REMEMBER', 'Nhận biết'],
  ['UNDERSTAND', 'Thông hiểu'],
  ['APPLY', 'Vận dụng'],
  ['ANALYZE', 'Phân tích'],
];

export function QuestionImportWizard({
  open,
  subjects,
  onClose,
  onDone,
}: {
  open: boolean;
  subjects: Subject[];
  onClose: () => void;
  onDone: (msg?: any) => void;
}) {
  const [mode, setMode] = useState<Mode>('table');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(''); // kept for compatibility, error display moved to toast
  const [toast, setToast] = useState('');
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToast(''), 4000);
    setToastTimer(t);
  };
  const [aiItems, setAiItems] = useState<any[]>([]);
  const [documentImageCount, setDocumentImageCount] = useState(0);
  const [documentImages, setDocumentImages] = useState<Array<{ mimeType: string; data: string }>>([]);
  const [documentIntent, setDocumentIntent] = useState<'preserve' | 'generate'>('preserve');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiPrompt, setAiPrompt] = useState('');

  const [meta, setMeta] = useState({
    subjectId: '',
    chapterId: '',
    defaultType: 'SINGLE_CHOICE',
    defaultDifficulty: 'MEDIUM',
    defaultBloomLevel: 'UNDERSTAND',
    defaultScore: '1.0',
    applyDefaultsToMissingOnly: true,
  });

  // Chương là tùy chọn; mặc định nhập câu hỏi không phân chương.
  useEffect(() => {
    if (open && subjects.length > 0 && !meta.subjectId) {
      const firstSub = subjects[0];
      setMeta((prev) => ({
        ...prev,
        subjectId: String(firstSub.id),
        chapterId: '',
      }));
    }
    if (!open) { setDocumentImages([]); setDocumentImageCount(0); }
  }, [open, subjects, meta.subjectId]);

  const subject = useMemo(
    () => subjects.find((s) => String(s.id) === meta.subjectId),
    [subjects, meta.subjectId],
  );

  const updateMeta = (key: string, value: string | boolean) => {
    if (key === 'subjectId') {
      const selectedSub = subjects.find((s) => String(s.id) === String(value));
      setMeta((prev) => ({
        ...prev,
        subjectId: String(value),
        chapterId: '',
      }));
    } else if (key === 'defaultType') {
      setMeta((prev) => ({
        ...prev,
        defaultType: String(value),
      }));
    } else {
      setMeta((prev) => ({ ...prev, [key]: value }));
    }
  };

  const template = async () => {
    try {
      const r = await api.get('/questions/import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-nhap-cau-hoi.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      showToast('Không thể tải file mẫu CSV.');
    }
  };

  const load = async () => {
    if (!file) {
      showToast('Vui lòng chọn tệp tài liệu trước khi tiếp tục.');
      return;
    }
    setBusy(true);
    setProgress(3);
    showToast('');
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    progressTimer = setInterval(() => {
      setProgress((value) => Math.min(95, value + Math.max(1, Math.round((95 - value) / 12))));
    }, 900);

    try {
      if (mode === 'document') {
        if (!meta.subjectId) {
          throw new Error('Vui lòng chọn môn học trước khi dùng AI trích xuất.');
        }

        const f = new FormData();
        f.append('file', file);

        // Upload file and extract text
        const extracted = await api.post('/questions/ai-extract-text', f, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDocumentImages(extracted.data?.images || []);
        setDocumentImageCount((extracted.data?.images?.length || 0) + (extracted.data?.documentData ? 1 : 0));

        // Request AI Document Question Extraction using extracted text
        const instruction = documentIntent === 'preserve'
          ? 'Giữ nguyên các câu hỏi có sẵn trong tài liệu, không tự tạo thêm câu mới. Câu thiếu đáp án hoặc loại câu phải đánh dấu lỗi để người dùng sửa.'
          : 'Đây là đề cương/tài liệu học tập. Hãy tạo các câu hỏi nháp bám sát nội dung tài liệu.';
        const r = await api.post('/questions/ai-generate', {
          subjectId: Number(meta.subjectId),
          ...(meta.chapterId ? { chapterId: meta.chapterId } : {}),
          type: meta.defaultType,
          difficulty: meta.defaultDifficulty,
          bloomLevel: meta.defaultBloomLevel,
          count: 100,
          prompt: `${instruction}\n\n${extracted.data?.text || ''}`,
          isExtractionOnly: true,
          images: extracted.data?.images || [],
          documentData: extracted.data?.documentData,
        });

        setAiItems(r.data);
        const cleanedRows = (r.data || []).map((q: any, i: number) => {
          let cleanContent = String(q.content || '').trim();
          if (cleanContent.includes('","score"') || cleanContent.includes('","explanation"') || cleanContent.includes('","options"')) {
            cleanContent = cleanContent.replace(/","(score|explanation|keywords|options|fillBlankAnswers|imageIndexes)":[\s\S]*/gi, '');
          }
          cleanContent = cleanContent.replace(/^["']?\s*content["']?\s*:\s*["']?/i, '').replace(/^[{["]+|[}\]"]+$/g, '').trim();

          return {
            row: i + 1,
            data: { ...q, content: cleanContent },
            errors: [],
            duplicates: q.duplicate ? [q.duplicate] : [],
          };
        });
        setPreview({ rows: cleanedRows });
        setSelected(r.data.map((_: any, i: number) => i + 1));
      } else {
        const f = new FormData();
        f.append('file', file);
        Object.entries(meta).forEach(([k, v]) => f.append(k, String(v)));

        const r = await api.post('/questions/import/preview', f, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPreview(r.data);
        setSelected(
          r.data.rows
            .filter((x: any) => !x.errors.length)
            .map((x: any) => x.row),
        );
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || 'Không thể đọc và xử lý file.');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setProgress(100);
      setBusy(false);
    }
  };

  const generateAiQuestions = async () => {
    if (!meta.subjectId) {
      showToast('Vui lòng chọn Môn học trước khi dùng AI sinh câu hỏi.');
      return;
    }
    let fullPrompt = aiPrompt.trim();
    if (!file && !fullPrompt) {
      showToast('Vui lòng nhập nội dung Đề cương hoặc tải tệp Đề cương/Bài giảng (PDF, Word, TXT) trước khi sinh câu hỏi.');
      return;
    }

    setBusy(true);
    setProgress(5);
    showToast('');
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    progressTimer = setInterval(() => {
      setProgress((value) => Math.min(95, value + Math.max(1, Math.round((95 - value) / 10))));
    }, 800);

    try {
      let extraImages: any[] = [];
      let extraDocData: any = undefined;

      if (file) {
        const f = new FormData();
        f.append('file', file);
        const extracted = await api.post('/questions/ai-extract-text', f, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const syllabusText = extracted.data?.text || '';
        extraImages = extracted.data?.images || [];
        extraDocData = extracted.data?.documentData;
        fullPrompt = `NỘI DUNG ĐỀ CƯƠNG / TÀI LIỆU HỌC TẬP THAM KHẢO:\n${syllabusText}\n\nYÊU CẦU BỔ SUNG KHỞI TẠO CÂU HỎI: ${fullPrompt || 'Hãy sinh các câu hỏi bám sát 100% nội dung đề cương tham khảo trên.'}`;
      }

      const r = await api.post('/questions/ai-generate', {
        subjectId: Number(meta.subjectId),
        ...(meta.chapterId ? { chapterId: meta.chapterId } : {}),
        type: meta.defaultType,
        difficulty: meta.defaultDifficulty,
        bloomLevel: meta.defaultBloomLevel,
        count: Number(aiCount || 5),
        prompt: fullPrompt,
        isExtractionOnly: false,
        images: extraImages,
        documentData: extraDocData,
      });

      const generated = r.data || [];
      setAiItems(generated);
      setPreview({
        rows: generated.map((q: any, i: number) => ({
          row: i + 1,
          data: q,
          errors: [],
          duplicates: q.duplicate ? [q.duplicate] : [],
        })),
      });
      setSelected(generated.map((_: any, i: number) => i + 1));
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || 'Không thể sinh câu hỏi tự động bằng AI.');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setProgress(100);
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview || !selected.length || busy) return;
    if (mode !== 'ai_generate' && !file) return;
    setBusy(true);
    setProgress(8);
    showToast('');

    try {
      if (mode === 'document' || mode === 'ai_generate') {
        const selectedAi = aiItems.filter((_, i) => selected.includes(i + 1));
        const saved = await api.post('/questions/ai-save', {
          questions: selectedAi.map(({ duplicate, sourceImages, ...q }) => ({
            ...q,
            score: Number(q.score || meta.defaultScore),
          })),
        });
        const savedQuestions = Array.isArray(saved.data) ? saved.data : [];
        for (let i = 0; i < savedQuestions.length; i++) {
          const images = selectedAi[i]?.sourceImages || [];
          if (!images.length || !savedQuestions[i]?.id) continue;
          const form = new FormData(); form.append('questionId', savedQuestions[i].id);
          images.forEach((image: any, index: number) => {
            const binary = atob(image.data); const bytes = new Uint8Array(binary.length);
            for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
            form.append('files', new File([bytes], `ai-image-${i + 1}-${index + 1}`, { type: image.mimeType }));
          });
          await api.post('/questions/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      } else {
        const f = new FormData();
        f.append('file', file);
        f.append('hash', preview.hash);
        f.append('rows', JSON.stringify(selected));
        f.append(
          'overrides',
          JSON.stringify(
            Object.fromEntries(
              preview.rows
                .filter((r: any) => selected.includes(r.row))
                .map((r: any) => [r.row, r.data]),
            ),
          ),
        );
        Object.entries(meta).forEach(([k, v]) => f.append(k, String(v)));

        await api.post('/questions/import/confirm', f, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onDone(selected.length);
      onClose();
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || 'Không thể nhập dữ liệu vào hệ thống.');
    } finally {
      setProgress(100);
      setBusy(false);
    }
  };

  const editRow = (row: any, key: string, value: any) => {
    setPreview((p: any) => ({
      ...p,
      rows: p.rows.map((x: any) => (x.row === row.row ? { ...x, data: { ...x.data, [key]: value } } : x)),
    }));
    if (mode === 'document' || mode === 'ai_generate') {
      setAiItems((items) =>
        items.map((x, i) => (i === row.row - 1 ? { ...x, [key]: value } : x)),
      );
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Nhập ngân hàng câu hỏi: Tải lên → Xem trước → Lưu" size="3xl">
      <div className="space-y-5">
        {/* Mode Selector Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              mode === 'table'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => {
              setMode('table');
              setPreview(null);
              setFile(null);
              setError('');
            }}
          >
            Bảng tính (CSV / Excel)
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              mode === 'document'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => {
              setMode('document');
              setPreview(null);
              setFile(null);
              setError('');
            }}
          >
            Trích xuất AI từ Word / PDF
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              mode === 'ai_generate'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => {
              setMode('ai_generate');
              setPreview(null);
              setFile(null);
              setError('');
            }}
          >
            Sinh câu hỏi bằng AI
          </button>
        </div>

        {/* Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn học *</label>
            <select
              value={meta.subjectId}
              onChange={(e) => updateMeta('subjectId', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none hover:border-slate-300 transition cursor-pointer"
            >
              <option value="">-- Chọn Môn học --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chương (Tùy chọn)</label>
            <select
              value={meta.chapterId}
              onChange={(e) => updateMeta('chapterId', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none hover:border-slate-300 transition cursor-pointer"
            >
              <option value="">-- Tất cả chương / Không phân chương --</option>
              {(subject?.chapters || []).map((ch: any) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dạng câu hỏi *</label>
            <select
              value={meta.defaultType}
              onChange={(e) => updateMeta('defaultType', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none hover:border-slate-300 transition cursor-pointer"
            >
              {types.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Độ khó mặc định *</label>
            <select
              value={meta.defaultDifficulty}
              onChange={(e) => updateMeta('defaultDifficulty', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none hover:border-slate-300 transition cursor-pointer"
            >
              {difficulties.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mức tư duy Bloom *</label>
            <select
              value={meta.defaultBloomLevel}
              onChange={(e) => updateMeta('defaultBloomLevel', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none hover:border-slate-300 transition cursor-pointer"
            >
              {blooms.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={meta.applyDefaultsToMissingOnly}
                onChange={(e) => updateMeta('applyDefaultsToMissingOnly', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              Chỉ sử dụng các giá trị thiết lập trên cho ô dữ liệu còn thiếu trong tệp
            </label>
          </div>
        </div>

        {mode === 'ai_generate' && (
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[16px] font-semibold text-[#0F172A]">Trình tạo câu hỏi tự động bằng AI từ Đề cương</h4>
                <p className="text-[14px] font-normal text-[#64748B]">Tải lên hoặc nhập nội dung Đề cương / Bài giảng, AI sẽ tự động sinh danh sách câu hỏi bám sát kiến thức.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[15px] font-medium text-[#0F172A] whitespace-nowrap">Số lượng:</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value={3}>3 câu</option>
                  <option value={5}>5 câu</option>
                  <option value={10}>10 câu</option>
                  <option value={15}>15 câu</option>
                  <option value={20}>20 câu</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[15px] font-medium text-[#0F172A] mb-1.5">
                1. Tải lên tệp Đề cương / Bài giảng làm căn cứ (PDF, Word, TXT):
              </label>
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <span className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-medium text-[15px] transition shadow-xs">Choose File</span>
                <span className="text-[15px] font-medium text-[#0F172A] truncate max-w-[320px]">
                  {file ? file.name : 'Chưa đính kèm tệp...'}
                </span>
                <input
                  type="file"
                  accept=".docx,.pdf,.txt,.md"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setError('');
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-[15px] font-medium text-[#0F172A] mb-1">
                2. Nhập/Dán nội dung Đề cương hoặc Yêu cầu bổ sung cho AI:
              </label>
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Dán nội dung Đề cương chi tiết hoặc yêu cầu cụ thể (Ví dụ: Tập trung vào nội dung SQL JOIN, Indexing, Transaction...)"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[15px] font-medium text-[#0F172A] placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={busy || !meta.subjectId}
                onClick={generateAiQuestions}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {busy ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang sinh câu hỏi {progress}%...</span>
                  </>
                ) : (
                  <span>Bắt đầu Sinh câu hỏi từ Đề cương</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* File Picker & Action Bar (cho mode table va document) */}
        {mode !== 'ai_generate' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <span className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-extrabold text-xs transition shadow-xs">Choose File</span>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[320px]">
                  {file ? file.name : mode === 'table' ? 'Chưa chọn tệp (.csv, .xlsx)...' : 'Chưa chọn tệp (.docx, .pdf)...'}
                </span>
                <input
                  type="file"
                  accept={mode === 'table' ? '.csv,.xlsx' : '.docx,.pdf,.txt,.md'}
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setPreview(null);
                    setAiItems([]);
                    setDocumentImageCount(0);
                    setDocumentImages([]);
                    setError('');
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              {preview ? (
                <>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    disabled={!selected.length || busy}
                    onClick={() => setShowSaveConfirm(true)}
                  >
                    Lưu câu hỏi
                  </Button>
                </>
              ) : (
                <>
                  {mode === 'table' && (
                    <button
                      type="button"
                      onClick={template}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer px-2.5 py-1.5"
                    >
                      Tải mẫu CSV
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!file || busy}
                    onClick={load}
                    className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <span>Trích xuất</span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {busy && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {mode === 'document' ? 'Hệ thống AI đang đọc và phân tích tài liệu...' : 'Đang kiểm tra & phân tích dữ liệu...'}
              </span>
              <span className="font-black text-white bg-blue-600 rounded-full px-2.5 py-0.5 text-[11px]">
                {progress}%
              </span>
            </div>

            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>

            <p className="text-[11.5px] font-medium text-slate-500">
              Không đóng cửa sổ trong khi hệ thống AI đang xử lý.
            </p>
          </div>
        )}

        {/* Toast Error Notification */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-[110] flex max-w-[calc(100vw-2.5rem)] sm:max-w-lg items-start sm:items-center gap-3 rounded-2xl border border-white/20 px-4 py-3 text-white shadow-2xl transition-all transform slide-in-from-bottom duration-300"
            style={{ backgroundColor: '#EF4444' }}
          >
            <span className="text-[15px] font-medium leading-5 flex-1">{toast}</span>
            <button
              type="button"
              onClick={() => setToast('')}
              className="ml-2 rounded-lg p-1 hover:bg-white/15 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 shrink-0 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Preview Results */}
        {preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Bản nháp câu hỏi trích xuất ({preview.rows.length} câu)
              </h4>
              <span className="text-xs font-bold text-slate-500">
                Đã chọn {selected.length} / {preview.rows.length} câu
              </span>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {preview.rows.map((r: any) => {
                const q = r.data;
                const isChecked = selected.includes(r.row);
                return (
                  <div
                    key={r.row}
                    className={`rounded-2xl border p-4 text-xs space-y-3 transition ${isChecked ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white opacity-70'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={r.errors.length > 0}
                          checked={isChecked}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, r.row]
                                : selected.filter((x) => x !== r.row),
                            )
                          }
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span>Câu #{r.row}</span>
                      </label>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[13px] font-semibold text-[#475569]">
                          {q.type === 'ESSAY' ? 'Tự luận' : q.type === 'FILL_BLANK' ? 'Điền vào chỗ trống' : q.type === 'TRUE_FALSE' ? 'Đúng / Sai' : 'Trắc nghiệm'}
                        </span>
                        <span className="rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[13px] font-semibold text-blue-800">
                          {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'Trung bình'}
                        </span>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[13px] font-semibold text-blue-800">
                          {q.score || meta.defaultScore} điểm
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={q.content || ''}
                      onChange={(e) => editRow(r, 'content', e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                      placeholder="Nội dung câu hỏi..."
                    />

                    {Array.isArray(q.sourceImages) && q.sourceImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2">
                        {q.sourceImages.map((image: any, index: number) => (
                          <img
                            key={index}
                            src={`data:${image.mimeType};base64,${image.data}`}
                            alt={`Hình minh họa ${index + 1}`}
                            className="h-20 w-28 rounded-lg border border-blue-200 object-contain bg-white"
                          />
                        ))}
                      </div>
                    )}

                    {/* Render Fill in the Blank Answers Preview */}
                    {q.type === 'FILL_BLANK' && Array.isArray(q.fillBlankAnswers) && q.fillBlankAnswers.length > 0 && (
                      <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div className="text-[11px] font-bold text-slate-800">
                          Đáp án cho từng chỗ trống:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {q.fillBlankAnswers.map((ans: any, aIdx: number) => (
                            <div key={aIdx} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                              <span className="whitespace-nowrap text-slate-500">Ô #{ans.blankIndex || aIdx + 1}:</span>
                              <span className="font-bold text-slate-900">{ans.answer || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Render Options Preview */}
                    {(() => {
                      const optionsList =
                        Array.isArray(q.options) && q.options.length > 0
                          ? q.options
                          : ['A', 'B', 'C', 'D']
                            .filter((key) => q[`option${key}`])
                            .map((key) => {
                              const correctAnsStr = String(q.correctAnswer || '').trim().toUpperCase();
                              const isCorrect =
                                q[`correct${key}`] === 'true' ||
                                q[`correct${key}`] === true ||
                                correctAnsStr.includes(key) ||
                                (key === 'A' && (correctAnsStr === '1' || correctAnsStr.startsWith('A'))) ||
                                (key === 'B' && (correctAnsStr === '2' || correctAnsStr.startsWith('B'))) ||
                                (key === 'C' && (correctAnsStr === '3' || correctAnsStr.startsWith('C'))) ||
                                (key === 'D' && (correctAnsStr === '4' || correctAnsStr.startsWith('D')));
                              return {
                                label: key,
                                content: q[`option${key}`],
                                isCorrect,
                              };
                            });

                      if (q.type === 'ESSAY' || q.type === 'FILL_BLANK' || !optionsList.length) return null;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                          {optionsList.map((opt: any, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition ${opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                                }`}
                            >
                              <span
                                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                {opt.label || String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="truncate flex-1">{opt.content}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Explanation */}
                    <div className="space-y-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="text-[11px] font-bold text-slate-800">
                        <span>Hướng dẫn đáp án / Gợi ý chấm:</span>
                      </div>
                      <textarea
                        value={q.explanation || ''}
                        onChange={(e) => editRow(r, 'explanation', e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                        placeholder={q.type === 'ESSAY' ? 'Đáp án mẫu hoặc hướng dẫn chấm tự luận...' : 'Giải thích đáp án...'}
                      />
                    </div>

                    {(r.errors.length > 0 || r.duplicates.length > 0) && (
                      <div className="text-[11px] font-bold text-rose-600">
                        <span>{r.errors.join(', ')}{r.duplicates.length ? ' · Cảnh báo câu hỏi bị trùng nội dung trong CSDL' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showSaveConfirm}
        isLoading={busy}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => {
          setShowSaveConfirm(false);
          void confirm();
        }}
        title="Xác nhận lưu câu hỏi"
        message={`Hệ thống sẽ lưu ${selected.length} câu hỏi đã chọn ở trạng thái Bản nháp. Bạn vẫn có thể chỉnh sửa và gửi duyệt sau khi lưu.`}
        type="warning"
        confirmText="Lưu câu hỏi"
        cancelText="Quay lại kiểm tra"
      />
    </Modal>
  );
}
