import { Download, Plus, Sparkles, Upload, Printer } from 'lucide-react';
export function QuestionToolbar({ onAdd, onImport, onAi, onExport, onPrint }: { onAdd: () => void; onImport: () => void; onAi: () => void; onExport: () => void; onPrint?: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {onPrint && (
        <button onClick={onPrint} className="flex items-center gap-2 rounded-xl bg-[#1e66f5] hover:bg-blue-700 font-bold px-3.5 py-2 text-sm text-white shadow-xs transition">
          <Printer className="h-4 w-4" />
          In Báo cáo
        </button>
      )}
      <button onClick={onExport} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
        <Download className="h-4 w-4 text-[#1e66f5]" />
        Xuất CSV
      </button>
      <button onClick={onImport} className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-sm font-bold text-white transition shadow-xs">
        <Upload className="h-4 w-4" />
        Nhập dữ liệu
      </button>
      <button onClick={onAi} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1e66f5] to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-2 text-sm font-bold text-white transition shadow-xs">
        <Sparkles className="h-4 w-4" />
        Tạo bằng AI
      </button>
      <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-[#1e66f5] hover:bg-blue-700 px-3.5 py-2 text-sm font-bold text-white transition shadow-xs">
        <Plus className="h-4 w-4" />
        Thêm câu hỏi
      </button>
    </div>
  );
}
