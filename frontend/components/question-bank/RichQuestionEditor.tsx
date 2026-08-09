'use client';

import { Bold, Italic, List, Underline } from 'lucide-react';
import { useEffect, useRef } from 'react';

function htmlFromValue(value: unknown) {
  if (value && typeof value === 'object' && 'html' in value) return String((value as { html?: unknown }).html || '');
  return '';
}

export function RichQuestionEditor({
  value,
  fallback,
  onChange,
  placeholder,
}: {
  value?: unknown;
  fallback?: string;
  onChange: (html: string) => void;
  onFiles?: (files: File[]) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const html = htmlFromValue(value) || (fallback ? fallback.replace(/\n/g, '<br />') : '');
    if (ref.current.innerHTML !== html) ref.current.innerHTML = html;
  }, [value, fallback]);

  const command = (name: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange(ref.current?.innerHTML || '');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => command('bold')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
            title="In đậm (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => command('italic')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => command('underline')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
            title="Gạch chân (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={() => command('insertUnorderedList')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition cursor-pointer"
            title="Danh sách dấu chấm"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <span className="text-[13px] font-normal text-[#64748B]">
          Công thức: nhập giữa <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700 font-mono text-[13px]">\(...\)</code> hoặc <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700 font-mono text-[13px]">$$...$$</code>
        </span>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder || 'Nhập nội dung câu hỏi...'}
        className="min-h-[120px] p-3.5 text-[15px] font-medium text-[#0F172A] leading-6 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
