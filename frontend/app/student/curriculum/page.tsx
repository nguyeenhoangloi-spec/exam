'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { AppShell } from '../../../components/AppShell';
import { Toast } from '../../../components/Toast';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Search,
  Filter,
  Award,
  Sparkles,
  Building2,
  School,
  User,
} from 'lucide-react';

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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<StatsInfo | null>(null);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
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
      setToast({
        message: err?.response?.data?.message || err.message || 'Lỗi tải khung chương trình đào tạo',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered List
  const filteredList = curriculumList.filter((item) => {
    const matchSearch =
      item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || item.type === filterType;
    const matchSemester = filterSemester === 'ALL' || String(item.recommendedSemester) === filterSemester;
    return matchSearch && matchType && matchSemester;
  });

  // Group by Semester
  const semesters = Array.from(new Set(curriculumList.map((item) => item.recommendedSemester))).sort((a, b) => a - b);

  const completionPercentage = stats?.totalCredits
    ? Math.min(100, Math.round(((stats.completedCredits || 0) / stats.totalCredits) * 100))
    : 0;

  return (
    <AppShell user={currentUser} title="Khung Chương Trình Đào Tạo Cá Nhân">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Banner Student & Major Info */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chương Trình Đào Tạo Chuẩn</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {studentInfo?.departmentName || 'Khoa / Ngành đào tạo'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {studentInfo?.fullName} ({studentInfo?.studentCode})
                </span>
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-400" />
                  Lớp: {studentInfo?.className || studentInfo?.classCode || '---'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Mã Khoa: {studentInfo?.departmentCode || '---'}
                </span>
              </div>
            </div>

            {/* Progress Card */}
            <div className="w-full md:w-72 bg-slate-800/80 border border-slate-700/60 backdrop-blur-lg p-4 rounded-xl space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Tiến độ tích lũy:</span>
                <span className="font-bold text-emerald-400">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{stats?.completedCredits || 0} tín chỉ hoàn thành</span>
                <span>/ {stats?.totalCredits || 0} TC tổng khung</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng môn trong khung</p>
              <p className="text-lg font-bold text-slate-900">{stats?.totalSubjects || 0} Môn</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng số tín chỉ</p>
              <p className="text-lg font-bold text-slate-900">{stats?.totalCredits || 0} Tín chỉ</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Môn bắt buộc</p>
              <p className="text-lg font-bold text-slate-900">{stats?.totalMandatoryCredits || 0} Tín chỉ</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Môn tự chọn</p>
              <p className="text-lg font-bold text-slate-900">{stats?.totalElectiveCredits || 0} Tín chỉ</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã môn hoặc tên môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Lọc:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:border-sky-500 focus:outline-none bg-white"
            >
              <option value="ALL">Tất cả Loại môn</option>
              <option value="MANDATORY">Môn Bắt buộc</option>
              <option value="ELECTIVE">Môn Tự chọn</option>
            </select>

            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:border-sky-500 focus:outline-none bg-white"
            >
              <option value="ALL">Tất cả Học kỳ</option>
              {semesters.map((sem) => (
                <option key={sem} value={String(sem)}>
                  Học kỳ {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body Grouped by Recommended Semester */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Đang tải Khung chương trình đào tạo...</p>
          </div>
        ) : curriculumList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Chưa có dữ liệu khung chương trình</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Khoa / Ngành của bạn hiện chưa được nhà trường cập nhật danh sách môn học vào khung đào tạo.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {semesters
              .filter((sem) => filterSemester === 'ALL' || String(sem) === filterSemester)
              .map((semester) => {
                const semItems = filteredList.filter((item) => item.recommendedSemester === semester);
                if (semItems.length === 0 && search) return null;

                const semCredits = semItems.reduce((sum, item) => sum + item.credits, 0);

                return (
                  <div
                    key={semester}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                  >
                    {/* Semester Header */}
                    <div className="flex items-center justify-between bg-slate-50/80 px-6 py-4 border-b border-slate-200/80">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                          {semester}
                        </div>
                        <h2 className="text-sm font-bold text-slate-800">
                          Học Kỳ {semester} — Khuyên Dùng
                        </h2>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200/70 text-slate-700">
                        {semItems.length} môn • {semCredits} Tín chỉ
                      </span>
                    </div>

                    {/* Table of Subjects */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-6 w-16 text-center">STT</th>
                            <th className="py-3 px-6 w-32">Mã môn</th>
                            <th className="py-3 px-6">Tên môn học</th>
                            <th className="py-3 px-6 w-24 text-center">Số TC</th>
                            <th className="py-3 px-6 w-36 text-center">Loại môn</th>
                            <th className="py-3 px-6 w-36 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {semItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-6 text-center font-medium text-slate-400">{idx + 1}</td>
                              <td className="py-3.5 px-6 font-bold text-sky-700">{item.subjectCode}</td>
                              <td className="py-3.5 px-6 font-medium text-slate-800">
                                {item.subjectName}
                                {item.note && (
                                  <p className="text-[11px] text-slate-400 italic mt-0.5">{item.note}</p>
                                )}
                              </td>
                              <td className="py-3.5 px-6 text-center font-semibold text-slate-700">
                                {item.credits} TC
                              </td>
                              <td className="py-3.5 px-6 text-center">
                                {item.type === 'MANDATORY' ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                                    Bắt buộc
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                                    Tự chọn
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 text-center">
                                {item.isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Đã học
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                    <Clock className="w-3 h-3 text-slate-400" />
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
    </AppShell>
  );
}
