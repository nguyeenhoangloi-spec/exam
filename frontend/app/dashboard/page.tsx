'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { Users, GraduationCap, BookOpen, Clock, DoorOpen, HelpCircle } from 'lucide-react';
import { User } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalExamSchedules: 0,
    totalExamRooms: 0,
    pendingQuestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role !== 'ADMIN') {
      if (currentUser.role === 'TEACHER') router.push('/teacher/assignments');
      else router.push('/student/exam-schedule');
      return;
    }
    setUser(currentUser);

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/dashboard-stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Tổng sinh viên', value: stats.totalStudents, icon: Users, color: 'bg-blue-500', link: '/students' },
    { title: 'Tổng giảng viên', value: stats.totalTeachers, icon: GraduationCap, color: 'bg-emerald-500', link: '/teachers' },
    { title: 'Tổng môn học', value: stats.totalSubjects, icon: BookOpen, color: 'bg-purple-500', link: '/subjects' },
    { title: 'Tổng lịch thi', value: stats.totalExamSchedules, icon: Clock, color: 'bg-amber-500', link: '/exam-schedules' },
    { title: 'Tổng phòng thi', value: stats.totalExamRooms, icon: DoorOpen, color: 'bg-indigo-500', link: '/exam-rooms' },
    { title: 'Câu hỏi chờ duyệt', value: stats.pendingQuestions, icon: HelpCircle, color: 'bg-rose-500', link: '/question-bank' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} title="Admin Dashboard - Thống kê tổng quan" />

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Chào mừng trở lại, {user?.username}! 👋</h1>
            <p className="text-slate-500 text-sm mt-1">Tổng hợp báo cáo và trạng thái các danh mục trong hệ thống khảo thí.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm p-6 border border-gray-100"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => router.push(card.link)}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-slate-100 flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 group-hover:text-sky-600 transition">
                        {card.value}
                      </h3>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl ${card.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-200`}>
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions Panel */}
          <div className="mt-10 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-2">Tác vụ quản trị nhanh</h3>
            <p className="text-slate-400 text-sm mb-6">Thực hiện các thao tác quản lý lịch thi, phân phòng và tạo đề thi.</p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/exam-arrangement')}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold shadow-md transition"
              >
                Xếp phòng thi tự động
              </button>
              <button
                onClick={() => router.push('/exam-supervisors')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold shadow-md transition"
              >
                Phân công giám thị
              </button>
              <button
                onClick={() => router.push('/exam-papers')}
                className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold shadow-md transition"
              >
                Rút đề thi ngẫu nhiên
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
