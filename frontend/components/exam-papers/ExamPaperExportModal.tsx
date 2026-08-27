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

export function ExamPaperExportModal({
  isOpen,
  onClose,
  basePaper,
  defaultVariantCount = 3,
}: ExamPaperExportModalProps) {
  const maxAvailableVariants = basePaper?.variantCount || defaultVariantCount || 3;
  const [variantCount, setVariantCount] = useState<number>(maxAvailableVariants);
  const [startCode, setStartCode] = useState<string>('101');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (basePaper) {
      const codeNum = basePaper.paperCode.replace(/\D/g, '') || '101';
      setStartCode(codeNum);
      const paperMax = basePaper.variantCount || defaultVariantCount || 3;
      setVariantCount(paperMax);
    }
  }, [basePaper, defaultVariantCount]);

  if (!isOpen || !basePaper) return null;

  const startNum = parseInt(startCode.replace(/\D/g, ''), 10) || 101;
  const count = Math.max(1, Math.min(variantCount || 1, maxAvailableVariants));
  const endNum = startNum + count - 1;

  // Danh sách các mã đề dự kiến sinh ra
  const generatedCodes = Array.from({ length: count }, (_, i) => String(startNum + i));
  const codeRangeLabel = count === 1 ? `${startNum}` : `${startNum} - ${endNum}`;

  // Tạo các nút chọn nhanh từ 1 đến tối đa số mã của bộ đề
  const presetNumbers = Array.from({ length: maxAvailableVariants }, (_, i) => i + 1);

  const handleExportWord = async () => {
    try {
      setIsProcessing(true);
      if (count === 1) {
        exportBulkExamPapersToWord([basePaper], includeAnswerKey, basePaper.subjectCode);
      } else {
        const variants = generateShuffledPaperVariants(basePaper, count, startNum);
        exportBulkExamPapersToWord(variants, includeAnswerKey, basePaper.subjectCode);
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsProcessing(true);
      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      let targetPapers: ExamPaperExportData[] = [];

      if (count === 1) {
        targetPapers = [basePaper];
      } else {
        targetPapers = generateShuffledPaperVariants(basePaper, count, startNum);
      }

      const printOptionsList: PrintExamPaperOptions[] = targetPapers.map((p) => ({
        subjectName: p.subjectName,
        subjectCode: p.subjectCode,
        paperCode: p.paperCode,
        durationMinutes: p.durationMinutes,
        totalScore: p.totalScore,
        showAnswers: includeAnswerKey,
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
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{basePaper.subjectName}</strong> ({basePaper.subjectCode})
          </div>
          <span className="shrink-0 font-normal">
            {basePaper.questions.length} câu ({basePaper.durationMinutes} phút)
          </span>
        </div>

        {/* Cấu hình Số lượng & Mã bắt đầu */}
        <div className="space-y-3">
          {/* Số lượng mã đề */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-type-body font-medium text-slate-800 dark:text-slate-200">
              Số lượng mã đề
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setVariantCount(Math.max(1, count - 1))}
                disabled={count <= 1}
                className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center text-type-body-sm"
              >
                −
              </button>
              <div className="h-8 min-w-[3.5rem] px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-type-body font-semibold text-blue-600 dark:text-blue-400 shadow-2xs">
                {count} / {maxAvailableVariants}
              </div>
              <button
                type="button"
                onClick={() => setVariantCount(Math.min(maxAvailableVariants, count + 1))}
                disabled={count >= maxAvailableVariants}
                className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center text-type-body-sm"
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
                className="w-20 h-8 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-type-body font-semibold focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                Dải mã: <strong className="font-semibold text-blue-600 dark:text-blue-400">{codeRangeLabel}</strong>
              </span>
            </div>
          </div>
        </div>

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

