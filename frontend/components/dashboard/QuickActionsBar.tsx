'use client';

import React from 'react';
import { PlusCircle, Layers, FilePlus2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActionsBar() {
  const router = useRouter();

  const actions = [
    {
      id: 'create-exam',
      title: 'Tạo ca thi mới',
      subtitle: 'Lên lịch ca thi môn học',
      icon: PlusCircle,
      route: '/exam-schedules',
    },
    {
      id: 'auto-arrange',
      title: 'Xếp phòng tự động',
      subtitle: 'Phân bổ phòng máy & ca thi',
      icon: Layers,
      route: '/exam-arrangement',
    },
    {
      id: 'create-question',
      title: 'Thêm câu hỏi mới',
      subtitle: 'Soạn thảo ngân hàng đề',
      icon: FilePlus2,
      route: '/question-bank',
    },
    {
      id: 'check-conflicts',
      title: 'Kiểm tra phân công',
      subtitle: 'Giám sát & cán bộ coi thi',
      icon: ShieldCheck,
      route: '/exam-supervisors',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {actions.map((act) => {
        const Icon = act.icon;

        return (
          <button
            key={act.id}
            type="button"
            onClick={() => router.push(act.route)}
            className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300/90 dark:hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-md outline-none focus:outline-none ring-0 focus:ring-0 transition-all duration-200 text-left cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/60 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 leading-tight">
                <h4 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {act.title}
                </h4>
                <p className="text-type-helper font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {act.subtitle}
                </p>
              </div>
            </div>

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        );
      })}
    </section>
  );
}
