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
      <button onClick={onExport} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
        <Download className="h-4 w-4 text-sky-600" />
        Xuất CSV
      </button>
      <button onClick={onImport} className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition">
        <Upload className="h-4 w-4" />
        Nhập dữ liệu
      </button>
      <button onClick={onAi} className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-3 py-2 text-sm font-medium text-white transition">
        <Sparkles className="h-4 w-4" />
        Tạo bằng AI
      </button>
      <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition">
        <Plus className="h-4 w-4" />
        Thêm câu hỏi
      </button>
    </div>
  );
}
