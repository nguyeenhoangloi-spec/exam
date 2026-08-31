'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Shuffle } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { ExamPaperExportData, generateShuffledPaperVariants } from '@/lib/export-docx';
import { printBulkExamPapers, PrintExamPaperOptions } from '@/lib/export-print';

interface ExamPaperExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  basePaper: ExamPaperExportData | null;
  defaultVariantCount?: number;
}

function getExamTypeLabel(paper: ExamPaperExportData | null): string {
  if (!paper) return 'Đề thi';
  if (paper.examType === 'TU_LUAN') return 'Tự luận';
  if (paper.examType === 'TRAC_NGHIEM') return 'Trắc nghiệm';

  const typeSet = new Set(paper.questions.map((q) => q.type));
  if (typeSet.size === 0) return 'Đề thi';
  if (typeSet.size === 1) {
    if (typeSet.has('MULTIPLE_CHOICE') || typeSet.has('SINGLE_CHOICE')) return 'Trắc nghiệm';
    if (typeSet.has('FILL_BLANK')) return 'Điền khuyết';
    if (typeSet.has('TRUE_FALSE')) return 'Đúng/Sai';
    if (typeSet.has('ESSAY')) return 'Tự luận';
    return 'Trắc nghiệm';
  }

  const names: string[] = [];
  if (typeSet.has('MULTIPLE_CHOICE') || typeSet.has('SINGLE_CHOICE')) names.push('Trắc nghiệm');
  if (typeSet.has('FILL_BLANK')) names.push('Điền khuyết');
  if (typeSet.has('TRUE_FALSE')) names.push('Đúng/Sai');
  if (typeSet.has('ESSAY')) names.push('Tự luận');

  return names.join(' + ');
}

export function ExamPaperExportModal({
  isOpen,
  onClose,
  basePaper,
  defaultVariantCount = 1,
}: ExamPaperExportModalProps) {
  const isEssay = basePaper?.examType === 'TU_LUAN' || Boolean(basePaper?.questions.every((q) => q.type === 'ESSAY'));
  const maxAvailableVariants = isEssay ? 1 : (basePaper?.variantCount || defaultVariantCount || 4);
  const [variantCount, setVariantCount] = useState<number>(1);
  const [startCode, setStartCode] = useState<string>('101');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(false);
  const [duplexCutLine, setDuplexCutLine] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (basePaper) {
      const codeNum = basePaper.paperCode.replace(/\D/g, '') || '101';
      setStartCode(codeNum);
      const isEssayPaper = basePaper.examType === 'TU_LUAN' || basePaper.questions.every((q) => q.type === 'ESSAY');
      const initialCount = isEssayPaper ? 1 : (basePaper.variantCount || defaultVariantCount || 1);
      setVariantCount(initialCount);
    }
  }, [basePaper, defaultVariantCount]);

  if (!isOpen || !basePaper) return null;

  const startNum = parseInt(startCode.replace(/\D/g, ''), 10) || 101;
  const count = isEssay ? 1 : Math.max(1, Math.min(variantCount || 1, maxAvailableVariants));
  const endNum = startNum + count - 1;

  // Danh sách các mã đề dự kiến sinh ra
  const codeRangeLabel = count === 1 ? `${startNum}` : `${startNum} - ${endNum}`;

  const handlePrint = async () => {
    try {
      setIsProcessing(true);
      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const targetPapers = count === 1 ? [basePaper] : generateShuffledPaperVariants(basePaper, count, startNum);

      const printOptionsList: PrintExamPaperOptions[] = targetPapers.map((p) => ({
        subjectName: p.subjectName,
        subjectCode: p.subjectCode,
        paperCode: p.paperCode,
        durationMinutes: p.durationMinutes,
        totalScore: p.totalScore,
        showAnswers: includeAnswerKey,
        examType: isEssay ? 'TU_LUAN' : 'TRAC_NGHIEM',
        essayHeaderMode: duplexCutLine ? 'ANONYMIZED_CUT' : 'STANDARD',
        duplexPrinting: duplexCutLine,
        questions: p.questions.map((q, idx) => ({
          index: q.order || idx + 1,
          content: q.content,
          score: q.score,
          type: q.type,
          media: (q as any).media,
          fillBlankAnswers: q.fillBlankAnswers,
          correctAnswer: q.correctAnswer,
          options: q.options.map((opt, oIdx) => ({
            key: opt.label || optionLetters[oIdx] || String(oIdx + 1),
            text: opt.content,
            isCorrect: opt.isCorrect,
            media: (opt as any).media,
          })),
          answerExplanation: q.explanation,
        })),
      }));

      printBulkExamPapers(printOptionsList);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="In đề thi & Xuất PDF"
      size="md"
    >
      <div className="space-y-4">
        {/* Tóm tắt thông tin đề thi */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-type-title-sm">
              {basePaper.subjectName} ({basePaper.subjectCode})
            </div>
            <span className="inline-flex items-center rounded-xl bg-blue-50 px-2 py-0.5 text-type-helper font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              {getExamTypeLabel(basePaper)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-type-helper text-slate-500 dark:text-slate-400">
            <span>Mã gốc: <strong className="text-slate-800 dark:text-slate-200">{basePaper.paperCode}</strong></span>
            <span>|</span>
            <span>{basePaper.questions.length} câu</span>
            <span>|</span>
            <span>{basePaper.durationMinutes} phút</span>
          </div>
        </div>

        {/* Tùy chọn sinh mã đảo đề thi (Dành cho Trắc nghiệm) */}
        {!isEssay && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-type-body font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shuffle className="h-4 w-4 text-blue-600" />
                Số lượng mã đề đảo
              </label>
              <span className="text-type-helper text-slate-400">
                (Tối đa {maxAvailableVariants} mã)
              </span>
            </div>

            {/* Stepper chọn số lượng mã đảo phẳng và tinh gọn */}
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl border border-slate-200/90 bg-slate-50/50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                {[1, 2, 3, 4].filter((n) => n <= maxAvailableVariants).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setVariantCount(num)}
                    className={`px-3.5 py-1.5 rounded-xl text-type-body font-medium transition cursor-pointer ${
                      count === num
                        ? 'bg-white text-blue-600 shadow-2xs dark:bg-slate-800 dark:text-blue-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {num} mã
                  </button>
                ))}
              </div>

              <div className="text-type-helper text-slate-500 dark:text-slate-400">
                Dải mã: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{codeRangeLabel}</strong>
              </div>
            </div>

            {/* Ô nhập mã đề bắt đầu */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-type-body font-medium text-slate-700 dark:text-slate-300">
                Mã bắt đầu:
              </span>
              <input
                type="text"
                value={startCode}
                onChange={(e) => setStartCode(e.target.value.replace(/\D/g, ''))}
                className="w-24 rounded-xl border border-slate-200 px-2.5 py-1 text-center font-medium text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                placeholder="101"
              />
            </div>
          </div>
        )}

        {/* Tùy chọn Đầu phách & In 2 mặt (Duplex) */}
        {isEssay && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={duplexCutLine}
                onChange={(e) => setDuplexCutLine(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer accent-blue-600 shrink-0"
              />
              <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                Đầu phách rọc phách bảo mật &amp; In 2 mặt (Khóa vùng phách)
              </span>
            </label>
          </div>
        )}

        {/* Checkbox kèm bảng ma trận đáp án */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 cursor-pointer accent-blue-600 shrink-0"
            />
            <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
              Kèm bảng ma trận đáp án ở cuối trang
            </span>
          </label>
        </div>

        {/* Nút In đề thi chính duy nhất */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handlePrint}
            disabled={isProcessing}
            isLoading={isProcessing}
            leftIcon={<Printer className="h-4 w-4 text-white" />}
            className="w-full justify-center"
          >
            In đề thi / Lưu PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
