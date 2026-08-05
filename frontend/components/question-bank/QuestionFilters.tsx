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

  const select = 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 cursor-pointer';

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
        <option value="SINGLE_CHOICE">Trắc nghiệm (1 đáp án)</option>
        <option value="MULTIPLE_CHOICE">Trắc nghiệm (Nhiều đáp án)</option>
        <option value="TRUE_FALSE">Đúng / Sai</option>
        <option value="FILL_BLANK">Điền từ vào chỗ trống</option>
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
        <option value="ARCHIVED">Ngừng sử dụng</option>
      </select>
    </div>
  );
}
