'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { Subject } from '../../types';
import { Modal } from '../Modal';
import { CheckCircle2, FileSpreadsheet, Sparkles, Upload, AlertCircle, FileText, Download } from 'lucide-react';

type Mode = 'table' | 'document';

const types = [
  ['SINGLE_CHOICE', 'Trắc nghiệm (1 đáp án)'],
  ['MULTIPLE_CHOICE', 'Trắc nghiệm (nhiều đáp án)'],
  ['TRUE_FALSE', 'Đúng / Sai'],
  ['FILL_BLANK', 'Điền từ'],
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
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>('table');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [aiItems, setAiItems] = useState<any[]>([]);
  const [documentImageCount, setDocumentImageCount] = useState(0);
  const [documentImages, setDocumentImages] = useState<Array<{ mimeType: string; data: string }>>([]);
  const [documentIntent, setDocumentIntent] = useState<'preserve' | 'generate'>('preserve');

  const [meta, setMeta] = useState({
    subjectId: '',
    chapterId: '',
    defaultType: 'SINGLE_CHOICE',
    defaultDifficulty: 'MEDIUM',
    defaultBloomLevel: 'UNDERSTAND',
    defaultScore: '0.25',
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
      setError('Không thể tải file mẫu CSV.');
    }
  };

  const load = async () => {
    if (!file) {
      setError('Vui lòng chọn tệp tài liệu trước khi tiếp tục.');
      return;
    }
    setBusy(true);
    setProgress(3);
    setError('');
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
        setPreview({
          rows: r.data.map((q: any, i: number) => ({
            row: i + 1,
            data: q,
            errors: [],
            duplicates: q.duplicate ? [q.duplicate] : [],
          })),
        });
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
      setError(e.response?.data?.message || e.message || 'Không thể đọc và xử lý file.');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setProgress(100);
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!file || !preview || !selected.length) return;
    setBusy(true);
    setProgress(8);
    setError('');

    try {
      if (mode === 'document') {
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
      onDone();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Không thể nhập dữ liệu vào hệ thống.');
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
    if (mode === 'document') {
      setAiItems((items) =>
        items.map((x, i) => (i === row.row - 1 ? { ...x, [key]: value } : x)),
      );
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Nhập ngân hàng câu hỏi: Tải lên → Xem trước → Lưu">
      <div className="space-y-5">
        {/* Mode Selector Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${mode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            onClick={() => {
              setMode('table');
              setPreview(null);
              setFile(null);
              setError('');
            }}
          >
            <FileSpreadsheet className="h-4 w-4" /> Bảng tính (CSV / Excel)
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${mode === 'document' ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            onClick={() => {
              setMode('document');
              setPreview(null);
              setFile(null);
              setError('');
            }}
          >
            <Sparkles className="h-4 w-4" /> Trích xuất AI từ Word / PDF
          </button>
        </div>

        {/* Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Môn học</label>
            <select
              value={meta.subjectId}
              onChange={(e) => updateMeta('subjectId', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
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
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Dạng câu hỏi</label>
            <select
              value={meta.defaultType}
              onChange={(e) => updateMeta('defaultType', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              {types.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Độ khó mặc định</label>
            <select
              value={meta.defaultDifficulty}
              onChange={(e) => updateMeta('defaultDifficulty', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              {difficulties.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Mức tư duy Bloom</label>
            <select
              value={meta.defaultBloomLevel}
              onChange={(e) => updateMeta('defaultBloomLevel', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              {blooms.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Điểm mặc định</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={meta.defaultScore}
              onChange={(e) => updateMeta('defaultScore', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              placeholder="0.25"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={meta.applyDefaultsToMissingOnly}
            onChange={(e) => updateMeta('applyDefaultsToMissingOnly', e.target.checked)}
            className="rounded border-slate-300 text-blue-600"
          />
          Chỉ sử dụng các giá trị thiết lập trên cho ô dữ liệu còn thiếu trong tệp
        </label>

        {mode === 'document' && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-900 shadow-2xs flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Trích xuất thông minh bằng Gemini AI</p>
              <p className="text-[11px] text-sky-700 mt-0.5">
                AI sẽ quét nội dung từ file Word/PDF (`.docx`, `.pdf`, `.txt`, `.md`), bóc tách câu hỏi & đáp án rồi hiển thị bản nháp để bạn kiểm tra trước khi lưu.
              </p>
              {documentImageCount > 0 && <p className="mt-1 text-[11px] font-semibold text-sky-800">Đã nhận diện {documentImageCount} thành phần hình ảnh/tài liệu và sẽ gửi kèm cho AI phân tích.</p>}
              {documentImages.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{documentImages.slice(0, 8).map((image, index) => <img key={index} src={`data:${image.mimeType};base64,${image.data}`} alt={`Hình ${index + 1}`} className="h-12 w-16 rounded border border-sky-200 object-cover" />)}</div>}
            </div>
          </div>
        )}

        {/* File Picker & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
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
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            {mode === 'table' && (
              <button
                type="button"
                onClick={template}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-white border border-slate-200 px-3 py-2 rounded-xl transition"
              >
                <Download className="h-3.5 w-3.5" /> Tải mẫu CSV
              </button>
            )}
            <button
              type="button"
              disabled={!file || busy}
              onClick={load}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${mode === 'document' ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {busy ? (
                <span>Đang xử lý {progress}%...</span>
              ) : mode === 'document' ? (
                <>
                  <Sparkles className="h-4 w-4" /> Trích xuất câu hỏi từ file
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Xem trước bảng
                </>
              )}
            </button>
          </div>
        </div>

        {busy && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-sky-700">
              <span>{mode === 'document' ? 'Gemini đang đọc và phân tích tài liệu…' : 'Đang kiểm tra dữ liệu…'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-sky-600">Không đóng cửa sổ trong khi hệ thống đang xử lý.</p>
          </div>
        )}

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview Results */}
        {preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Bản nháp câu hỏi trích xuất ({preview.rows.length} câu)
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
                    className={`rounded-2xl border p-4 text-xs space-y-3 transition ${isChecked ? 'border-sky-300 bg-sky-50/40 shadow-2xs' : 'border-slate-200 bg-white opacity-70'
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
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {q.type === 'SINGLE_CHOICE' ? 'Trắc nghiệm 1 đáp án' : q.type === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' : 'Đúng/Sai'}
                        </span>
                        <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'HARD' ? 'Khó' : 'Trung bình'}
                        </span>
                        <span className="rounded-full bg-sky-100 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                          {q.score || meta.defaultScore} điểm
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={q.content || ''}
                      onChange={(e) => editRow(r, 'content', e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                      placeholder="Nội dung câu hỏi..."
                    />

                    {Array.isArray(q.sourceImages) && q.sourceImages.length > 0 && <div className="flex flex-wrap gap-2 rounded-xl border border-sky-200 bg-sky-50 p-2">{q.sourceImages.map((image: any, index: number) => <img key={index} src={`data:${image.mimeType};base64,${image.data}`} alt={`Hình minh họa ${index + 1}`} className="h-20 w-28 rounded-lg border border-sky-200 object-contain bg-white" />)}</div>}

                    {/* Render Options Preview for Choice Questions (both Excel & AI) */}
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

                      if (!optionsList.length) return null;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                          {optionsList.map((opt: any, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition ${opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700'
                                }`}
                            >
                              <span
                                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${opt.isCorrect ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                {opt.label || String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="truncate flex-1">{opt.content}</span>
                              {opt.isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {(r.errors.length > 0 || r.duplicates.length > 0) && (
                      <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{r.errors.join(', ')}{r.duplicates.length ? ' · Cảnh báo câu hỏi bị trùng nội dung trong CSDL' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!selected.length || busy}
              onClick={confirm}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs shadow-md transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Xác nhận lưu {selected.length} câu hỏi vào Ngân hàng
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
