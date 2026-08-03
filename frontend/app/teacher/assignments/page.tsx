'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { AppShell } from '../../../components/AppShell';
import { Toast } from '../../../components/Toast';
import { ShieldCheck, Calendar, Clock, MapPin, PlusCircle } from 'lucide-react';
import { TeacherAssignmentItem } from '../../../types';

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchMyAssignments();
  }, [router]);

  const fetchMyAssignments = async () => {
    try {
      const res = await api.get('/teachers/my-assignments');
      setAssignments(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải lịch coi thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell user={currentUser} title="Lịch coi thi Giảng viên">
      <div className="flex min-h-screen flex-col min-w-0">

        <main className="p-8 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
            <div>
              <h1 className="text-xl font-bold mb-1">Chào Thầy/Cô {currentUser?.username} 👨‍🏫</h1>
              <p className="text-emerald-100 text-sm">
                Danh sách các ca coi thi được phân công. Vui lòng có mặt tại phòng thi trước 15 phút.
              </p>
            </div>

            <button
              onClick={() => router.push('/question-bank')}
              className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đóng góp câu hỏi</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Đang tra cứu lịch coi thi...</div>
          ) : assignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Chưa có lịch coi thi nào</h3>
              <p className="text-sm text-slate-400 mt-1">Hiện tại Thầy/Cô chưa có lịch phân công coi thi mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      {item.subjectCode}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        item.role === 'SUPERVISOR_1'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-4">{item.subjectName}</h3>

                  <div className="space-y-2.5 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Ngày coi thi:{' '}
                        <strong className="text-slate-800">
                          {new Date(item.examDate).toLocaleDateString('vi-VN')}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        Ca thi:{' '}
                        <strong className="text-emerald-600">
                          {item.startTime} - {item.endTime}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>
                        Phòng thi:{' '}
                        <strong className="text-slate-800">
                          {item.roomCode} ({item.roomName} - {item.building})
                        </strong>
                      </span>
                    </div>
                  </div>

                  {item.note && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      📝 Ghi chú: {item.note}
                    </div>
                  )}
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
