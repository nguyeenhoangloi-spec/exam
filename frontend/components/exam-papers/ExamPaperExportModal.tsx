'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/Button';
import { FileText, Printer, Download, Sparkles } from 'lucide-react';
import { ExamPaperExportData, generateShuffledPaperVariants, exportBulkExamPapersToWord } from '@/lib/export-docx';
import { printBulkExamPapers, PrintExamPaperOptions } from '@/lib/export-print';

interface ExamPaperExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  basePaper: ExamPaperExportData | null;
  defaultVariantCount?: number;
}

function getPaperTypeSummary(basePaper: ExamPaperExportData | null): string {
  if (!basePaper) return 'Trắc nghiệm';
  const questions = basePaper.questions || [];
  if (questions.length === 0) {
    if (basePaper.examType === 'TU_LUAN') return 'Tự luận';
    if (basePaper.examType === 'DIEN_KHUYET' || basePaper.examType === 'DIEN_LO' || basePaper.examType === 'FILL_BLANK') return 'Điền khuyết';
    return 'Trắc nghiệm';
  }

  const typeSet = new Set(
    questions.map((q) => {
      const t = (q.type || '').toUpperCase();
      if (t === 'FILL_BLANK' || t === 'DIEN_KHUYET' || t === 'DIEN_LO' || t === 'DIEN_KHUYES' || t === 'DIEN') return 'FILL_BLANK';
      if (t === 'ESSAY' || t === 'TU_LUAN') return 'ESSAY';
      if (t === 'TRUE_FALSE' || t === 'DUNG_SAI') return 'TRUE_FALSE';
      return 'MULTIPLE_CHOICE';
    })
  );

  if (typeSet.size === 1) {
    if (typeSet.has('FILL_BLANK')) return 'Điền khuyết';
    if (typeSet.has('ESSAY')) return 'Tự luận';
    if (typeSet.has('TRUE_FALSE')) return 'Đúng/Sai';
    return 'Trắc nghiệm';
  }

  const names: string[] = [];
  if (typeSet.has('MULTIPLE_CHOICE')) names.push('Trắc nghiệm');
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

  const handleExportWord = async () => {
    try {
      setIsProcessing(true);
      const targetPapers = count === 1 ? [basePaper] : generateShuffledPaperVariants(basePaper, count, startNum);
      const customOpts = {
        examType: isEssay ? 'TU_LUAN' : 'TRAC_NGHIEM',
        essayHeaderMode: (duplexCutLine ? 'ANONYMIZED_CUT' : 'STANDARD') as 'ANONYMIZED_CUT' | 'STANDARD',
        duplexPrinting: duplexCutLine,
      };
      await exportBulkExamPapersToWord(targetPapers, includeAnswerKey, basePaper.subjectCode, customOpts);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

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
          fillBlankAnswers: q.fillBlankAnswers,
          correctAnswer: q.correctAnswer,
          options: q.options.map((opt, oIdx) => ({
            key: opt.label || optionLetters[oIdx] || String(oIdx + 1),
            text: opt.content,
            isCorrect: opt.isCorrect,
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
      title="Xuất và in đề thi"
      size="sm"
    >
      <div className="space-y-4 py-1">
        {/* Tóm tắt môn học 1 dòng không dùng dấu chấm */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 text-type-helper text-slate-600 dark:text-slate-400">
          <div className="truncate font-medium">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{basePaper.subjectName}</span> ({basePaper.subjectCode})
          </div>
          <span className="shrink-0 font-normal">
            {basePaper.questions.length} câu | {basePaper.durationMinutes} phút | {getPaperTypeSummary(basePaper)}
          </span>
        </div>

        {/* Cấu hình Số lượng & Mã bắt đầu (Chỉ hiển thị cho đề Trắc nghiệm có trộn đề) */}
        {!isEssay && (
          <div className="space-y-3">
            {/* Số lượng mã đề */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                Số lượng mã đề
              </span>
              <div className="inline-flex items-center rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setVariantCount(Math.max(1, count - 1))}
                  disabled={count <= 1}
                  className="h-7 w-7 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center text-type-body-sm"
                >
                  −
                </button>
                <span className="min-w-[3rem] px-2 text-center text-type-body font-semibold text-slate-900 dark:text-slate-100">
                  {count} <span className="font-normal text-slate-400">/ {maxAvailableVariants}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVariantCount(Math.min(maxAvailableVariants, count + 1))}
                  disabled={count >= maxAvailableVariants}
                  className="h-7 w-7 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center text-type-body-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Mã khởi đầu & Dải mã xem trước */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                Mã khởi đầu
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={startCode}
                  onChange={(e) => setStartCode(e.target.value)}
                  placeholder="101"
                  className="w-16 h-8 text-center rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-type-body font-semibold focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none transition"
                />
                <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                  (Dải mã: <span className="font-semibold text-slate-800 dark:text-slate-200">{codeRangeLabel}</span>)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tuỳ chọn rọc phách cho đề Tự luận */}
        {isEssay && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={duplexCutLine}
                onChange={(e) => setDuplexCutLine(e.target.checked)}
                className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
                Đầu phách rọc phách bảo mật &amp; In 2 mặt (Khóa vùng phách)
              </span>
            </label>
          </div>
        )}

        {/* Checkbox kèm bảng ma trận đáp án */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
              Kèm bảng ma trận đáp án ở cuối file
            </span>
          </label>
        </div>

        {/* 2 Nút hành động cân đối và tinh gọn */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handlePrint}
            disabled={isProcessing}
            leftIcon={<Printer className="h-4 w-4 text-slate-700 dark:text-slate-300" />}
            className="w-full justify-center"
          >
            In đề thi
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleExportWord}
            disabled={isProcessing}
            leftIcon={<Download className="h-4 w-4 text-white" />}
            className="w-full justify-center"
          >
            {isProcessing ? 'Đang xuất...' : 'Tải file Word'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

