'use client';

import React from 'react';
import { fixHtmlImageUrls } from '../../lib/media-utils';

interface FillBlankQuestionRendererProps {
  content: string;
  contentRich?: { html?: string } | null;
  answers?: { blankIndex: number; value: string }[];
  onChange?: (blankIndex: number, value: string) => void;
  readOnly?: boolean;
  showCorrect?: boolean;
  correctAnswers?: { blankIndex: number; answer: string; acceptedAnswers?: string[] }[];
}

export function FillBlankQuestionRenderer({
  content,
  contentRich,
  answers = [],
  onChange,
  readOnly = false,
  showCorrect = false,
  correctAnswers = [],
}: FillBlankQuestionRendererProps) {
  const rawHtml = contentRich?.html;
  const sourceText = rawHtml || content || '';

  // Regex to match any variant: {{blank_1}}, {{blank_1}, {{blank_1, {blank_1}, [[blank_1]], [blank_1]
  const tagRegex = /(\{\{?blank_\d+\}?\}?|\[\[?blank_\d+\]\]?)/gi;
  const tokens = sourceText.split(tagRegex);

  // Collect all detected blank indices
  const detectedIndices = new Set<number>();
  const matches = sourceText.match(tagRegex);
  if (matches) {
    matches.forEach((m: string) => {
      const num = m.match(/blank_(\d+)/i)?.[1];
      if (num) detectedIndices.add(Number(num));
    });
  }

  // If no indices were found in text, default to blank #1
  const allIndices = detectedIndices.size > 0 
    ? Array.from(detectedIndices).sort((a, b) => a - b)
    : [1];

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100 font-medium">
      <div className="leading-relaxed">
        {tokens.map((token, idx) => {
          const matchNum = token.match(/^[\{\[]?blank_(\d+)[\}\]]?$/i) || token.match(/blank_(\d+)/i);
          const isBlankTag = /^[\{\[]?blank_\d+[\}\]]?$/i.test(token.trim());

          if (isBlankTag && matchNum) {
            const blankIndex = Number(matchNum[1]);
            const currentVal = answers.find((a) => a.blankIndex === blankIndex)?.value || '';
            const correctObj = correctAnswers.find((c) => c.blankIndex === blankIndex);

            if (readOnly) {
              return (
                <span key={idx} className="inline-flex items-center gap-1.5 mx-1 px-2.5 py-0.5 h-9 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100">
                  <span className="text-type-helper text-slate-400">[{blankIndex}]</span>
                  <span>{currentVal || '____'}</span>
                  {showCorrect && correctObj && (
                    <span className="text-type-helper font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      (Đúng: {correctObj.answer})
                    </span>
                  )}
                </span>
              );
            }

            return (
              <span key={idx} className="inline-flex items-baseline mx-1">
                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => onChange?.(blankIndex, e.target.value)}
                  placeholder={`[Ô #${blankIndex}]...`}
                  style={{ width: `${Math.max(120, (currentVal.length + 4) * 11)}px` }}
                  className="inline-block px-3 py-1.5 text-type-body font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-500 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition shadow-xs text-center"
                />
              </span>
            );
          }

          // Normal HTML/text fragment
          if (rawHtml) {
            return (
              <span
                key={idx}
                dangerouslySetInnerHTML={{ __html: fixHtmlImageUrls(token) }}
              />
            );
          }

          return <span key={idx}>{token}</span>;
        })}
      </div>

      {/* Explicit Input Box List Block Below - Ensures student can ALWAYS see & type answer */}
      {!readOnly && (
        <div className="mt-4 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-type-helper font-semibold text-slate-700 dark:text-slate-300">
              Nhập đáp án cho từng chỗ trống ({allIndices.length} ô):
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allIndices.map((bIndex) => {
              const val = answers.find((a) => a.blankIndex === bIndex)?.value || '';
              return (
                <div key={bIndex} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition">
                  <span className="text-type-helper font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-50 dark:bg-blue-950/60 rounded-lg shrink-0">
                    Ô #{bIndex}
                  </span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => onChange?.(bIndex, e.target.value)}
                    placeholder={`Nhập câu trả lời cho ô #${bIndex}...`}
                    className="w-full text-type-body font-normal text-slate-900 dark:text-slate-100 bg-transparent outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
