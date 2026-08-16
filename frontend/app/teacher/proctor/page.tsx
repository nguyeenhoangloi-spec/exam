'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CalendarClock, DoorOpen, RefreshCw, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { formatDate, formatTimeHHmm } from '@/lib/format';
import { usePageTitle } from '@/components/PageTitleContext';
import { Button } from '@/components/ui/Button';

type ProctorRoom = {
  id: number;
  scheduleId?: number;
  subjectCode?: string;
  subjectName?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  roomCode?: string;
  roomName?: string;
  building?: string;
  status?: string;
  studentCount?: number;
  supervisorCount?: number;
};

function mapTeacherAssignment(item: any): ProctorRoom | null {
  const roomId = Number(item?.examScheduleRoomId);
  if (!Number.isFinite(roomId)) return null;

  return {
    id: roomId,
    scheduleId: Number(item?.scheduleId) || undefined,
    subjectCode: item?.subjectCode,
    subjectName: item?.subjectName,
    examDate: item?.examDate,
    startTime: item?.startTime,
    endTime: item?.endTime,
    roomCode: item?.roomCode,
    roomName: item?.roomName,
    building: item?.building,
    status: item?.status,
  };
}

function mapAdminSchedule(schedule: any): ProctorRoom[] {
  return (schedule?.examScheduleRooms || []).flatMap((room: any) => {
    const roomId = Number(room?.id || room?.examScheduleRoomId);
    if (!Number.isFinite(roomId)) return [];

    return [{
      id: roomId,
      scheduleId: Number(schedule?.id) || undefined,
      subjectCode: schedule?.subject?.subjectCode,
      subjectName: schedule?.subject?.subjectName,
      examDate: schedule?.examDate,
      startTime: schedule?.startTime,
      endTime: schedule?.endTime,
      roomCode: room?.room?.roomCode,
      roomName: room?.room?.roomName,
      building: room?.room?.building,
      status: schedule?.status,
      studentCount: room?._count?.examRoomStudents,
      supervisorCount: room?._count?.supervisors,
    } satisfies ProctorRoom];
  });
}

export default function ProctorRoomSelectionPage() {
  usePageTitle('Chọn phòng giám sát');
  const router = useRouter();
  const [rooms, setRooms] = useState<ProctorRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRooms = useCallback(async () => {
    const user = getAuthUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (user.role === 'ADMIN') {
        const response = await api.get('/exam-schedules', { params: { noCache: true } });
        const schedules = Array.isArray(response.data) ? response.data : [];
        setRooms(schedules.flatMap(mapAdminSchedule));
      } else {
        const response = await api.get('/teachers/my-assignments', { params: { noCache: true } });
        const assignments = Array.isArray(response.data) ? response.data : [];
        setRooms(assignments.map(mapTeacherAssignment).filter(Boolean) as ProctorRoom[]);
      }
    } catch (requestError: any) {
      setRooms([]);
      setError(requestError?.message || 'Không thể tải danh sách phòng giám sát.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  return (
    <div className="min-h-[calc(100vh-4rem)] space-y-6 bg-slate-50 p-6 dark:bg-slate-950">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Giám sát phòng thi</h1>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Chọn phòng thi để mở bảng giám sát trực tiếp.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          isLoading={loading}
          onClick={() => void loadRooms()}
        >
          Làm mới
        </Button>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-live="polite" aria-label="Đang tải phòng giám sát">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      )}

      {!error && !loading && rooms.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Video className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">Chưa có phòng cần giám sát</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-700 dark:text-slate-300">
            Danh sách phòng sẽ xuất hiện khi có lịch thi hoặc phân công coi thi phù hợp.
          </p>
        </div>
      )}

      {!error && !loading && rooms.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-blue-700 dark:text-blue-300">
                    {room.subjectCode || 'Chưa có mã môn'}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-base font-semibold text-slate-950 dark:text-white">
                    {room.subjectName || 'Chưa có tên môn'}
                  </h2>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  <DoorOpen className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
                  <span>{formatDate(room.examDate)} · {formatTimeHHmm(room.startTime)}–{formatTimeHHmm(room.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
                  <span>{room.roomCode || room.roomName || 'Chưa xác định phòng'}{room.building ? ` · ${room.building}` : ''}</span>
                </div>
                {(room.studentCount !== undefined || room.supervisorCount !== undefined) && (
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {room.studentCount ?? 0} thí sinh · {room.supervisorCount ?? 0} giám thị
                  </p>
                )}
              </div>

              <div className="mt-auto flex justify-end pt-5">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => router.push(`/teacher/proctor/${room.id}`)}
                >
                  Mở giám sát
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
