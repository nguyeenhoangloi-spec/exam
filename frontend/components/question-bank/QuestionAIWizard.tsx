'use client';
import { FilterSelect } from '../ui/FilterSelect';

import { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { Subject } from '../../types';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { Button } from '../ui/Button';
import { DynamicImage } from '../ui/DynamicImage';
import { IdentifierBadge } from '../ui/IdentifierBadge';

export function QuestionAIWizard({
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
  const [form, setForm] = useState({
    subjectId: '',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    bloomLevel: 'UNDERSTAND',
    count: 5,
    prompt: '',
  });
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileName, setFileName] = useState('');
  const [sourceImages, setSourceImages] = useState<Array<{ mimeType: string; data: string; altText?: string }>>([]);
  const [documentData, setDocumentData] = useState<{ mimeType: string; data: string } | undefined>();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setUploadStatus('Đang trích xuất nội dung từ tệp tài liệu...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/questions/ai-extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.text || res.data?.images?.length || res.data?.documentData) {
        set('prompt', res.data.text || 'Tài liệu chứa hình ảnh/scan; hệ thống sẽ phân tích trực tiếp nội dung.');
        setSourceImages(res.data?.images || []);
        setDocumentData(res.data?.documentData);
        setUploadStatus(
          `Đã trích xuất xong tệp "${file.name}" (${res.data.text?.length || 0} ký tự${res.data?.images?.length ? `, kèm ${res.data.images.length} hình ảnh` : ''
          }).`
        );
      }
    } catch (e: any) {
      setUploadStatus(`Lỗi đọc tệp: ${e.response?.data?.message || e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setFileName('');
    setUploadStatus('');
    setSourceImages([]);
    setDocumentData(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generate = async () => {
    if (busy || uploading || !form.subjectId) return;
    setBusy(true);
    setUploadStatus('');
    try {
      const r = await api.post('/questions/ai-generate', {
        ...form,
        subjectId: Number(form.subjectId),
        count: Number(form.count),
        isExtractionOnly: Boolean(form.prompt),
        images: sourceImages,
        documentData,
      });
      setItems(r.data);
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Không thể tạo câu hỏi bằng AI. Vui lòng thử lại.';
      setUploadStatus(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy || !items.length) return;
    setBusy(true);
    try {
      const saved = await api.post('/questions/ai-save', {
        questions: items.map(({ duplicate, sourceImages: _images, ...q }) => q),
      });
      const savedQuestions = Array.isArray(saved.data) ? saved.data : [];
      for (let i = 0; i < savedQuestions.length; i++) {
        const images = items[i]?.sourceImages || [];
        if (!images.length || !savedQuestions[i]?.id) continue;
        const body = new FormData();
        body.append('questionId', savedQuestions[i].id);
        images.forEach((image: any, index: number) => {
          const binary = atob(image.data);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
          body.append('files', new File([bytes], `ai-image-${i + 1}-${index + 1}`, { type: image.mimeType }));
        });
        await api.post('/questions/media/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onDone();
      onClose();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : e.message || 'Không thể lưu câu hỏi AI.';
      setUploadStatus(`Lỗi lưu câu hỏi: ${text}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Trình tạo câu hỏi bằng AI">
      <div className="space-y-4 text-slate-900">
        {/* Banner Header */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
          <div className="space-y-0.5">
            <h4 className="text-type-card leading-[26px] font-semibold text-blue-900">
              Trợ lý AI thiết kế ngân hàng câu hỏi
            </h4>
            <p className="text-type-helper font-medium text-blue-700 leading-relaxed">
              Tự động khởi tạo câu hỏi chuẩn hóa theo môn học, cấp độ Bloom & ma trận đề thi. Tải tài liệu bài giảng để AI tổng hợp tự động.
            </p>
          </div>
        </div>

        {/* Configuration Parameters Grid */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <h5 className="text-type-helper font-semibold tracking-wider text-slate-500">
            Cấu hình tham số khởi tạo
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-type-body">
            {/* Subject Select */}
            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-900">Môn học áp dụng <span className="text-rose-500">*</span></label>
              <FilterSelect containerClassName="w-full"
                value={form.subjectId}
                onChange={(e) => set('subjectId', e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer transition"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subjectCode} - {s.subjectName}
                  </option>
                ))}
              </FilterSelect>
            </div>

            {/* Question Type */}
            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-900">Hình thức câu hỏi</label>
              <FilterSelect 
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer transition"
              >
                <option value="SINGLE_CHOICE">Trắc nghiệm chọn 1 đáp án</option>
                <option value="FILL_BLANK">Điền vào chỗ trống</option>
                <option value="ESSAY">Tự luận ngắn / Luận giải</option>
              </FilterSelect>
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-900">Mức độ khó</label>
              <FilterSelect containerClassName="w-full"
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer transition"
              >
                <option value="EASY">Dễ (Cơ bản)</option>
                <option value="MEDIUM">Trung bình (Vừa phải)</option>
                <option value="HARD">Khó (Phân hóa cao)</option>
              </FilterSelect>
            </div>

            {/* Bloom Level */}
            <div className="space-y-1">
              <label className="block text-type-body font-medium text-slate-900">Cấp độ tư duy (Bloom)</label>
              <FilterSelect 
                value={form.bloomLevel}
                onChange={(e) => set('bloomLevel', e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-type-body font-normal text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer transition"
              >
                <option value="REMEMBER">Nhận biết (Remember)</option>
                <option value="UNDERSTAND">Thông hiểu (Understand)</option>
                <option value="APPLY">Vận dụng (Apply)</option>
                <option value="ANALYZE">Phân tích (Analyze)</option>
              </FilterSelect>
            </div>

            {/* Question Count */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-type-body font-medium text-slate-900">Số lượng câu hỏi tạo tự động</label>
                <span className="text-type-helper font-medium text-blue-700 px-2.5 py-0.5 ui-pill rounded-full border border-blue-200">
                  {form.count} câu
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={form.count}
                onChange={(e) => set('count', e.target.value)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* File Upload Dropzone */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5 transition hover:border-slate-400">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-type-body font-medium text-slate-900">
              Tải lên tài liệu bài giảng / đề tham khảo (PDF, Word, TXT)
            </label>
            {fileName && (
              <button
                type="button"
                onClick={clearUploadedFile}
                className="text-type-helper font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Gỡ tệp
              </button>
            )}
          </div>

          <input
            id="question-ai-source-file"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
            disabled={uploading}
            className="hidden"
          />

          <label
            htmlFor="question-ai-source-file"
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3.5 text-center cursor-pointer transition hover:border-blue-500"
          >
            {uploading ? (
              <div className="flex flex-col items-center space-y-1">
                <p className="text-type-body font-medium text-blue-700">{uploadStatus}</p>
              </div>
            ) : fileName ? (
              <div className="text-type-body font-semibold text-emerald-700">
                {fileName}
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-type-body font-medium text-slate-900">Bấm để tải tệp hoặc kéo thả vào đây</p>
                <p className="text-type-helper font-normal text-slate-500">Định dạng hỗ trợ: PDF, Word (.docx), TXT, Markdown (.md)</p>
              </div>
            )}
          </label>

          {uploadStatus && !uploading && (
            <p className="mt-1.5 text-type-helper font-medium text-blue-700">
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Prompt Input Area */}
        <div className="space-y-1">
          <label className="block text-type-body font-medium text-slate-900">
            Chủ đề chi tiết hoặc ghi chú nội dung cho AI:
          </label>
          <textarea
            rows={3}
            value={form.prompt}
            onChange={(e) => set('prompt', e.target.value)}
            placeholder="Ví dụ: Tập trung vào Chương 2 - Thuật toán sắp xếp nhanh (QuickSort), yêu cầu có câu hỏi phân tích độ phức tạp thời gian O(n log n)..."
            className="w-full h-9 rounded-xl border border-slate-200/60 bg-white dark:bg-slate-900 p-2.5 text-type-body font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          />
        </div>

        {/* Generate Button - Standard Primary Button (bg-blue-600) */}
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={busy || !form.subjectId || uploading}
          isLoading={busy}
          onClick={generate}
          className="w-full"
        >
          {busy ? 'AI đang tạo câu hỏi...' : 'Khởi tạo câu hỏi tự động bằng AI'}
        </Button>

        {/* Generated Questions List */}
        {items.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="text-type-card leading-[26px] font-semibold tracking-wider text-slate-900">
                Danh sách {items.length} câu hỏi AI vừa khởi tạo
              </h5>
              <span className="text-type-helper font-normal text-slate-500">Xem lại & chỉnh sửa trước khi lưu</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map((q, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-left shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-type-helper font-semibold text-slate-600">
                      Câu {i + 1}
                    </span>
                    {q.duplicate && (
                      <span className="inline-flex items-center gap-[6px] text-type-helper font-semibold text-warning-600">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Trùng câu</span>
                        <IdentifierBadge tone="neutral">{q.duplicate.code}</IdentifierBadge>
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={q.content}
                    onChange={(e) =>
                      setItems(items.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))
                    }
                    className="w-full h-9 rounded-xl border border-slate-200/60 bg-white dark:bg-slate-900 p-2 text-type-body font-medium text-slate-900 focus:bg-white focus:border-blue-500 transition"
                  />

                  {q.sourceImages?.length > 0 && (
                    <div className="flex flex-wrap gap-2 h-9 rounded-xl border border-slate-200/60 bg-white dark:bg-slate-900 p-2">
                      {q.sourceImages.map((image: any, imageIdx: number) => (
                        <DynamicImage
                          key={imageIdx}
                          src={`data:${image.mimeType};base64,${image.data}`}
                          alt={image.altText || `Hình minh họa ${imageIdx + 1}`}
                          className="h-20 w-28 rounded border border-slate-200 object-contain bg-white"
                        />
                      ))}
                    </div>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-type-helper font-semibold text-slate-500 tracking-wider">Các lựa chọn đáp án:</span>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {q.options.map((opt: any, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 rounded-xl border p-2 text-type-body font-medium transition ${opt.isCorrect
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-type-helper font-semibold ${opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                              {opt.label}
                            </span>
                            <span className="flex-1 text-type-body font-medium">{opt.content}</span>
                            {opt.isCorrect && (
                              <span className="text-type-helper text-emerald-700 font-medium px-1.5 py-0.5 ui-pill rounded-full">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-2 text-type-body font-normal text-blue-900">
                      <strong className="font-semibold text-blue-950">Giải thích chi tiết:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save to Question Bank - Standard Success Button */}
            <Button
              type="button"
              variant="success"
              size="md"
              disabled={busy}
              isLoading={busy}
              onClick={() => setShowSaveConfirm(true)}
              className="w-full"
            >
              {busy ? 'Đang lưu vào ngân hàng dữ liệu...' : `Lưu ${items.length} câu hỏi AI vào Ngân hàng (Bản nháp)`}
            </Button>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showSaveConfirm}
        isLoading={busy}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => {
          setShowSaveConfirm(false);
          void save();
        }}
        title="Lưu câu hỏi AI vào Ngân hàng?"
        message={`Hệ thống sẽ lưu ${items.length} câu hỏi AI đã xem trước vào Ngân hàng ở trạng thái Bản nháp. Các câu này không tự được duyệt.`}
        type="info"
        confirmText="Lưu bản nháp"
        cancelText="Hủy bỏ"
      />
    </Modal>
  );
}
