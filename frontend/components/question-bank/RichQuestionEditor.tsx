'use client';

import { Bold, ImagePlus, Italic, List, Underline } from 'lucide-react';
import { useEffect, useRef } from 'react';

function htmlFromValue(value: unknown) {
  if (value && typeof value === 'object' && 'html' in value) return String((value as { html?: unknown }).html || '');
  return '';
}

export function RichQuestionEditor({ value, fallback, onChange, onFiles, placeholder }: { value?: unknown; fallback?: string; onChange: (html: string) => void; onFiles?: (files: File[]) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const html = htmlFromValue(value) || (fallback ? fallback.replace(/\n/g, '<br />') : '');
    if (ref.current.innerHTML !== html) ref.current.innerHTML = html;
  }, [value, fallback]);
  const command = (name: string, arg?: string) => { ref.current?.focus(); document.execCommand(name, false, arg); onChange(ref.current?.innerHTML || ''); };
  const insertImage = () => { const url = window.prompt('URL ảnh minh họa'); if (url) command('insertImage', url); };
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 p-1.5">
      <button type="button" onClick={() => command('bold')} className="rounded p-1.5 hover:bg-slate-200" title="In đậm"><Bold className="h-4 w-4" /></button>
      <button type="button" onClick={() => command('italic')} className="rounded p-1.5 hover:bg-slate-200" title="In nghiêng"><Italic className="h-4 w-4" /></button>
      <button type="button" onClick={() => command('underline')} className="rounded p-1.5 hover:bg-slate-200" title="Gạch chân"><Underline className="h-4 w-4" /></button>
      <button type="button" onClick={() => command('insertUnorderedList')} className="rounded p-1.5 hover:bg-slate-200" title="Danh sách"><List className="h-4 w-4" /></button>
      <button type="button" onClick={insertImage} className="rounded p-1.5 hover:bg-slate-200" title="Chèn ảnh bằng URL"><ImagePlus className="h-4 w-4" /></button>
      {onFiles ? <label className="cursor-pointer rounded p-1.5 hover:bg-slate-200" title="Tải ảnh lên"><ImagePlus className="h-4 w-4" /><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []))} /></label> : null}
      <span className="ml-2 text-[11px] text-slate-500">Công thức: nhập giữa <code>\\( ... \\)</code> hoặc <code>$$ ... $$</code></span>
    </div>
    <div ref={ref} contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)} data-placeholder={placeholder} className="min-h-[120px] p-3 text-sm leading-6 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]" />
  </div>;
}
