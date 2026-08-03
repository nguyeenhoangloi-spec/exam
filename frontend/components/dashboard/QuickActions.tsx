'use client';

import { BarChart3, BookPlus, CalendarPlus, ClipboardPlus, FilePlus2, Import, ShieldCheck, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

const actions = [
  { title: 'Tạo kỳ thi', description: 'Mở kỳ thi mới', icon: CalendarPlus, route: '/exam-periods?action=create' },
  { title: 'Tạo lịch thi', description: 'Lập lịch môn thi', icon: ClipboardPlus, route: '/exam-schedules?action=create' },
  { title: 'Xếp phòng thi', description: 'Sắp chỗ tự động', icon: UsersRound, route: '/exam-arrangement' },
  { title: 'Phân công giám thị', description: 'Bố trí coi thi', icon: ShieldCheck, route: '/exam-supervisors' },
  { title: 'Tạo câu hỏi', description: 'Thêm câu hỏi mới', icon: BookPlus, route: '/question-bank?action=create' },
  { title: 'Tạo đề thi', description: 'Rút đề ngẫu nhiên', icon: FilePlus2, route: '/exam-papers' },
  { title: 'Import câu hỏi', description: 'Nhập dữ liệu CSV', icon: Import, route: '/question-bank?action=import' },
  { title: 'Xem báo cáo', description: 'Tổng hợp hệ thống', icon: BarChart3, route: '/reports' },
];

export function QuickActions() {
  const router = useRouter();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
      <div className="mb-4">
        <h2 className="font-bold text-slate-900">Tác vụ quản trị nhanh</h2>
        <p className="text-xs text-slate-500">Đi tới chức năng thường dùng</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ title, description, icon: Icon, route }) => (
          <button
            key={title}
            type="button"
            onClick={() => router.push(route)}
            className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-800">{title}</span>
              <span className="block truncate text-[10px] text-slate-500">{description}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
