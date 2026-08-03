'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { AppShell } from '../../../components/AppShell';
import { Toast } from '../../../components/Toast';
import { BookMarked, Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { PersonalScheduleItem } from '../../../types';

export default function StudentExamSchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<PersonalScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchMySchedule();
  }, [router]);

  const fetchMySchedule = async () => {
    try {
      const res = await api.get('/students/my-schedule');
      setSchedules(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải lịch thi cá nhân', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell user={currentUser} title="Lịch thi Cá nhân Sinh viên">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="mb-6 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <h1 className="text-xl font-bold mb-1">Lịch thi cá nhân của bạn 🎓</h1>
            <p className="text-sky-100 text-sm">
              Vui lòng kiểm tra chính xác Mã môn thi, Ngày giờ thi, Phòng thi, Số Báo Danh và Số ghế trước khi đến phòng thi.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Đang tra cứu lịch thi...</div>
          ) : schedules.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Chưa có lịch thi nào</h3>
              <p className="text-sm text-slate-400 mt-1">Hiện tại bạn chưa có lịch thi được xếp phòng.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schedules.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden hover:shadow-md transition"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-bl-full pointer-events-none"></div>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
                      {item.subjectCode}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{item.periodName}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-4">{item.subjectName}</h3>

                  <div className="space-y-2.5 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Ngày thi:{' '}
                        <strong className="text-slate-800">
                          {new Date(item.examDate).toLocaleDateString('vi-VN')}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        Thời gian:{' '}
                        <strong className="text-sky-600">
                          {item.startTime} - {item.endTime}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>
                        Địa điểm:{' '}
                        <strong className="text-slate-800">
                          {item.roomCode} ({item.roomName} - {item.building})
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Ticket className="w-4 h-4 text-slate-400" />
                      <span>
                        Số báo danh:{' '}
                        <strong className="text-emerald-600 font-extrabold text-base">{item.examNumber}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Hình thức: {item.examType}</span>
                    <span className="text-sm font-bold bg-slate-900 text-white px-3 py-1 rounded-lg">
                      Số ghế: #{item.seatNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
