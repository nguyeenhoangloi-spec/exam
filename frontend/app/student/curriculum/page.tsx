'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { TabBar } from '../../../components/ui/TabBar';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Search,
  Award,
  Sparkles,
  Building2,
  School,
  User,
  X,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';

/* ─── Types ─── */
interface CurriculumItem {
  id: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  type: 'MANDATORY' | 'ELECTIVE';
  recommendedSemester: number;
  note?: string;
  isCompleted?: boolean;
}

interface StudentInfo {
  id: number;
  studentCode: string;
  fullName: string;
  className: string;
  classCode: string;
  departmentName: string;
  departmentCode: string;
}

interface StatsInfo {
  totalSubjects: number;
  totalCredits: number;
  totalMandatoryCredits: number;
  totalElectiveCredits: number;
  completedCredits: number;
  completedSubjects: number;
}

export default function StudentCurriculumPage() {
  usePageTitle('Khung Chương Trình Đào Tạo Cá Nhân');
  const router = useRouter();

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<StatsInfo | null>(null);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) { router.push('/login'); return; }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/my-curriculum');
      setStudentInfo(res.data.student);
      setStats(res.data.stats);
      setCurriculumList(res.data.curriculum || []);
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || err.message || 'Lỗi tải khung chương trình đào tạo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const semesters = useMemo(
    () => Array.from(new Set(curriculumList.map((i) => i.recommendedSemester))).sort((a, b) => a - b),
    [curriculumList]
  );

  const filteredList = useMemo(() => curriculumList.filter((item) => {
    const matchSearch = item.subjectCode.toLowerCase().includes(search.toLowerCase()) || item.subjectName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || item.type === filterType;
    const matchSemester = filterSemester === 'ALL' || String(item.recommendedSemester) === filterSemester;
    return matchSearch && matchType && matchSemester;
  }), [curriculumList, search, filterType, filterSemester]);

  const completionPercentage = stats?.totalCredits
    ? Math.min(100, Math.round(((stats.completedCredits || 0) / stats.totalCredits) * 100))
    : 0;

  const KPI = [
    { label: 'Tổng môn trong khung', value: `${stats?.totalSubjects ?? 0} môn`, icon: BookOpen, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Tổng số tín chỉ', value: `${stats?.totalCredits ?? 0} TC`, icon: Layers, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Môn bắt buộc', value: `${stats?.totalMandatoryCredits ?? 0} TC`, icon: Award, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Môn tự chọn', value: `${stats?.totalElectiveCredits ?? 0} TC`, icon: GraduationCap, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
  ];

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1E40AF] border border-white/10 p-6 text-white shadow-xl">
          {/* BG decorations */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-400/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -left-8 bottom-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[70px] pointer-events-none" />
          <GraduationCap className="absolute -bottom-8 -right-8 w-48 h-48 text-white/[0.05] rotate-12 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Info */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-blue-200 text-[10.5px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3" />
                Chương Trình Đào Tạo Chuẩn
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                {studentInfo?.departmentName || 'Khoa / Ngành đào tạo'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-300" />
                  {studentInfo?.fullName || '---'} ({studentInfo?.studentCode || '---'})
                </span>
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-blue-300" />
                  Lớp: {studentInfo?.className || studentInfo?.classCode || '---'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                  Mã Khoa: {studentInfo?.departmentCode || '---'}
                </span>
              </div>
            </div>

            {/* Progress card */}
            <div className="w-full lg:w-72 shrink-0 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Tiến độ tích lũy tín chỉ</span>
                <span className="text-lg font-black text-blue-100">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/60 font-semibold">
                <span><span className="text-white/90 font-black">{stats?.completedCredits ?? 0}</span> TC hoàn thành</span>
                <span>/ <span className="text-white/90 font-black">{stats?.totalCredits ?? 0}</span> TC tổng khung</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/15">
                <div className="text-center">
                  <p className="text-lg font-black text-white">{stats?.completedSubjects ?? 0}</p>
                  <p className="text-[10px] text-white/55 font-semibold">Môn đã hoàn thành</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-white">{(stats?.totalSubjects ?? 0) - (stats?.completedSubjects ?? 0)}</p>
                  <p className="text-[10px] text-white/55 font-semibold">Môn chưa học</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards Standardized White Flat ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI.map(({ label, value, icon: Icon, iconBg }) => (
            <div
              key={label}
              className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {label}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {value}
                </p>
              </div>

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg} transition-transform group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter / Search Toolbar ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo mã môn hoặc tên môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter tabs */}
          <TabBar
            tabs={[
              { key: 'ALL', label: 'Tất cả loại môn' },
              { key: 'MANDATORY', label: 'Môn bắt buộc' },
              { key: 'ELECTIVE', label: 'Môn tự chọn' },
            ]}
            active={filterType}
            onChange={setFilterType}
          />

          {/* Semester filter */}
          <div className="relative">
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer transition"
            >
              <option value="ALL">Tất cả học kỳ</option>
              {semesters.map((sem) => (
                <option key={sem} value={String(sem)}>Học kỳ {sem}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          <span className="ml-auto text-[10.5px] font-bold text-slate-400 shrink-0">
            {filteredList.length} môn học
          </span>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Đang tải Khung chương trình đào tạo...</p>
          </div>
        ) : curriculumList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800">Chưa có dữ liệu khung chương trình</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm">
              Khoa / Ngành của bạn hiện chưa được nhà trường cập nhật danh sách môn học vào khung đào tạo.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {semesters
              .filter((sem) => filterSemester === 'ALL' || String(sem) === filterSemester)
              .map((semester) => {
                const semItems = filteredList.filter((item) => item.recommendedSemester === semester);
                if (semItems.length === 0 && search) return null;

                const semCredits = semItems.reduce((s, i) => s + i.credits, 0);
                const semCompleted = semItems.filter((i) => i.isCompleted).length;
                const semPct = semItems.length > 0 ? Math.round((semCompleted / semItems.length) * 100) : 0;

                return (
                  <div key={semester} className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
                    {/* Semester header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 px-5 py-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                          {semester}
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-slate-800 leading-tight">Học Kỳ {semester}</h2>
                          <p className="text-[10.5px] font-semibold text-slate-500">
                            {semItems.length} môn học &nbsp;•&nbsp; {semCredits} tín chỉ
                          </p>
                        </div>
                      </div>

                      {/* Semester mini progress */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${semPct}%` }}
                            />
                          </div>
                          <span className="text-[10.5px] font-black text-slate-600">{semPct}%</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[10.5px] font-bold">
                          {semCompleted}/{semItems.length} hoàn thành
                        </span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-blue-100">
                          <tr className="bg-blue-50">
                            {['#', 'Mã môn', 'Tên môn học', 'Số TC', 'Loại môn', 'Trạng thái'].map((h, i) => (
                              <th
                                key={h}
                                className={[
                                  'py-2.5 px-5 text-[10px] font-extrabold text-blue-700 uppercase tracking-wide',
                                  i === 0 || i === 3 ? 'text-center' : i === 4 || i === 5 ? 'text-center' : 'text-left',
                                ].join(' ')}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {semItems.map((item, idx) => (
                            <tr key={item.id} className={['hover:bg-slate-50/60 transition duration-100', item.isCompleted ? 'opacity-80' : ''].join(' ')}>
                              {/* # */}
                              <td className="py-3.5 px-5 text-center text-[10.5px] font-bold text-slate-400">{idx + 1}</td>

                              {/* Code */}
                              <td className="py-3.5 px-5">
                                <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                  {item.subjectCode}
                                </span>
                              </td>

                              {/* Name */}
                              <td className="py-3.5 px-5">
                                <p className="text-xs font-bold text-slate-800">{item.subjectName}</p>
                                {item.note && (
                                  <p className="text-[10.5px] text-slate-400 italic mt-0.5">{item.note}</p>
                                )}
                              </td>

                              {/* Credits */}
                              <td className="py-3.5 px-5 text-center">
                                <span className="text-xs font-black text-slate-700">{item.credits}</span>
                                <span className="text-[10px] text-slate-400 font-semibold ml-0.5">TC</span>
                              </td>

                              {/* Type */}
                              <td className="py-3.5 px-5 text-center">
                                {item.type === 'MANDATORY' ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Bắt buộc
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Tự chọn
                                  </span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-5 text-center">
                                {item.isCompleted ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Đã học
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    Chưa tích lũy
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </>
  );
}
