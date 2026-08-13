import { Subject } from '../../types';

export type Filters = {
  subjectId: string;
  chapterId: string;
  type: string;
  difficulty: string;
  bloomLevel: string;
  status: string;
};

export function QuestionFilters({
  value,
  subjects,
  onChange,
}: {
  value: Filters;
  subjects: Subject[];
  onChange: (next: Filters) => void;
}) {
  const set = (key: keyof Filters, next: string) => onChange({ ...value, [key]: next });

  const select = 'h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-[15px] font-normal text-slate-800 dark:text-slate-200 outline-none transition focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/15 cursor-pointer';

  return (
    <div className="flex flex-wrap gap-2.5">
      {/* Chọn Môn */}
      <select className={select} value={value.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
        <option value="">Tất cả môn học</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.subjectName}
          </option>
        ))}
      </select>

      {/* Chọn Loại câu hỏi */}
      <select className={select} value={value.type} onChange={(e) => set('type', e.target.value)}>
        <option value="">Tất cả loại câu hỏi</option>
        <option value="SINGLE_CHOICE">Trắc nghiệm</option>
        <option value="ESSAY">Tự luận</option>
      </select>

      {/* Chọn Độ khó */}
      <select className={select} value={value.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
        <option value="">Tất cả độ khó</option>
        <option value="EASY">Dễ</option>
        <option value="MEDIUM">Trung bình</option>
        <option value="HARD">Khó</option>
      </select>

      {/* Chọn Mức độ Bloom */}
      <select className={select} value={value.bloomLevel} onChange={(e) => set('bloomLevel', e.target.value)}>
        <option value="">Tất cả mức độ Bloom</option>
        <option value="REMEMBER">Nhận biết</option>
        <option value="UNDERSTAND">Thông hiểu</option>
        <option value="APPLY">Vận dụng</option>
        <option value="ANALYZE">Phân tích</option>
      </select>

      {/* Chọn Trạng thái */}
      <select className={select} value={value.status} onChange={(e) => set('status', e.target.value)}>
        <option value="">Tất cả trạng thái</option>
        <option value="DRAFT">Bản nháp</option>
        <option value="PENDING">Chờ duyệt</option>
        <option value="APPROVED">Đã duyệt</option>
        <option value="REJECTED">Từ chối</option>
        <option value="ARCHIVED">Kho lưu trữ</option>
      </select>
    </div>
  );
}
