import React from 'react';

export interface FillBlankAnswerItem {
  blankIndex?: number;
  answer?: string;
  score?: number;
  [key: string]: any;
}

/**
 * Format chuỗi câu hỏi điền khuyết sang dạng văn bản in ấn / Word chuẩn học thuật
 * - Khi không kèm đáp án: {{blank_1}} -> (1) ........................................
 * - Khi kèm đáp án: {{blank_1}} -> (1) [Đáp án đúng]
 */
export function formatFillBlankForPrint(
  content: string,
  fillBlankAnswers?: FillBlankAnswerItem[],
  showAnswers = false
): string {
  if (!content) return '';
  const tagRegex = /(\{\{?blank_\d+\}?\}?|\[\[?blank_\d+\]\]?)/gi;

  return content.replace(tagRegex, (match) => {
    const numMatch = match.match(/blank_(\d+)/i);
    const blankIndex = numMatch ? Number(numMatch[1]) : 1;

    if (showAnswers && fillBlankAnswers && fillBlankAnswers.length > 0) {
      const found = fillBlankAnswers.find(
        (a) => Number(a.blankIndex || 1) === blankIndex
      );
      const ansText = found?.answer || (found as any)?.text || (found as any)?.content || '';
      if (ansText) {
        return `(${blankIndex}) [${ansText}]`;
      }
    }

    return `(${blankIndex}) ........................................`;
  });
}

/**
 * Component React render nội dung câu hỏi điền khuyết trực quan
 * - Khi showAnswers = false: Hiển thị khe trống bo góc nét đứt [ 1 ] ......
 * - Khi showAnswers = true: Điền trực tiếp từ khóa đáp án đúng vào vị trí đó [ 1 ] Từ_đúng
 */
export function FillBlankInlineContent({
  content,
  fillBlankAnswers = [],
  showAnswers = false,
  className = '',
}: {
  content: string;
  fillBlankAnswers?: FillBlankAnswerItem[];
  showAnswers?: boolean;
  className?: string;
}) {
  if (!content) return null;

  const tagRegex = /(\{\{?blank_\d+\}?\}?|\[\[?blank_\d+\]\]?)/gi;
  if (!tagRegex.test(content)) {
    return <span className={className}>{content}</span>;
  }

  const tokens = content.split(tagRegex);

  return (
    <span className={`inline leading-relaxed break-words ${className}`}>
      {tokens.map((token, idx) => {
        const matchNum = token.match(/blank_(\d+)/i);
        const isBlankTag = Boolean(matchNum && /[\{\[]+blank_\d+[\}\]]+/i.test(token.trim()));

        if (isBlankTag && matchNum) {
          const blankIndex = Number(matchNum[1]);
          const found = fillBlankAnswers.find(
            (a) => Number(a.blankIndex || 1) === blankIndex
          );
          const ansText = found?.answer || (found as any)?.text || (found as any)?.content || '';

          if (showAnswers) {
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 mx-1 px-2.5 py-0.5 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/70 font-semibold text-emerald-950 dark:text-emerald-100 text-type-body align-baseline shadow-2xs"
                title={`Đáp án đúng cho ô #${blankIndex}: ${ansText || 'Chưa thiết lập'}`}
              >
                <span className="text-type-helper text-emerald-700 dark:text-emerald-400 font-semibold">
                  [{blankIndex}]
                </span>
                <span>{ansText || '(Chưa có đáp án)'}</span>
              </span>
            );
          }

          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 font-medium text-slate-600 dark:text-slate-400 text-type-body align-baseline"
              title={`Ô điền khuyết #${blankIndex}`}
            >
              <span className="text-type-helper text-slate-500 dark:text-slate-400 font-semibold">
                [{blankIndex}]
              </span>
              <span className="tracking-widest text-slate-400 select-none">
                ..........
              </span>
            </span>
          );
        }

        return <span key={idx}>{token}</span>;
      })}
    </span>
  );
}
