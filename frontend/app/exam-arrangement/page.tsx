'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { TabBar } from '../../components/ui/TabBar';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import {
  DoorOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Monitor,
  Search,
  Sparkles,
  LayoutGrid,
  List,
  Layers,
  GraduationCap,
  Clock,
  Calendar,
  Shuffle,
  RotateCcw,
  Building2,
  Check,
  X,
  History,
  User,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Activity,
  ArrowLeftRight,
} from 'lucide-react';
import { ExamSchedule } from '../../types';
import { ArrangementSchedulePickerModal } from '../../components/exam-arrangement/ArrangementSchedulePickerModal';
import { ExamArrangementKPICards } from '../../components/exam-arrangement/ExamArrangementKPICards';
import { ExamArrangementHeader } from '../../components/exam-arrangement/ExamArrangementHeader';

type RoomAvailability = {
  id: number;
  roomCode: string;
  roomName: string;
  capacity: number;
  building: string;
  roomType: string;
  status: string;
  isAvailable: boolean;
  conflictingSubject: string | null;
  busyReason: string | null;
  isAssignedToCurrent?: boolean;
};

type ArrangementResult = {
  message: string;
  preview?: boolean;
  warnings?: string[];
  errors?: string[];
  unassigned?: Array<{ studentId: number; studentCode: string; fullName: string; reason: string }>;
  summary: {
    totalStudents: number;
    totalRoomsAssigned: number;
    subjectCode: string;
    subjectName: string;
    examDate: string;
    timeSlot: string;
  };
  details: Array<{
    id: number;
    examNumber: string;
    seatNumber: number;
    studentCode: string;
    fullName: string;
    className: string;
    departmentName?: string;
    requirementType?: string;
    requirementLabel?: string;
    roomCode: string;
    roomName: string;
    building: string;
  }>;
};

function escapeHtml(val: unknown) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Module-level cache: survives tab switch, renders instantly on remount ──
let _arrangementCache: {
  schedules: ExamSchedule[];
  selectedScheduleId: string;
  rooms: RoomAvailability[];
  selectedRoomIds: number[];
  result: ArrangementResult | null;
} | null = null;

export default function ExamArrangementPage() {
  usePageTitle('Xếp phòng thi tự động');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>(_arrangementCache?.schedules ?? []);
  const schedulesRef = useRef<ExamSchedule[]>(_arrangementCache?.schedules ?? []);
  const [rooms, setRooms] = useState<RoomAvailability[]>(_arrangementCache?.rooms ?? []);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(_arrangementCache?.selectedScheduleId ?? '');
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>(_arrangementCache?.selectedRoomIds ?? []);

  const [arranging, setArranging] = useState(false);
  const [result, setResult] = useState<ArrangementResult | null>(_arrangementCache?.result ?? null);

  const [activeTab, setActiveTab] = useState<'arrange' | 'history'>('arrange');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyActionFilter, setHistoryActionFilter] = useState('ALL');
  const [filterRoomCode, setFilterRoomCode] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showRoomGrid, setShowRoomGrid] = useState(true);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { },
  });

  const fetchRoomAvailability = useCallback(async (scheduleId: string) => {
    if (!scheduleId) return;
    try {
      const res = await api.get<RoomAvailability[]>(`/exam-arrangement/room-availability?examScheduleId=${scheduleId}`);
      setRooms(res.data);
      const availableIds = res.data.filter((r) => r.isAvailable).map((r) => r.id);
      setSelectedRoomIds(availableIds);
      // keep cache in sync
      if (_arrangementCache) {
        _arrangementCache.rooms = res.data;
        _arrangementCache.selectedRoomIds = availableIds;
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải trạng thái phòng thi', type: 'error' });
    }
  }, []);

  const fetchExistingResults = useCallback(async (scheduleId: string, customScheduleList?: any[]) => {
    if (!scheduleId) {
      setResult(null);
      return;
    }
    try {
      const res = await api.get(`/exam-arrangement/result?examScheduleId=${scheduleId}`);
      if (res.data && res.data.length > 0) {
        const details: any[] = [];
        let totalCount = 0;
        const currentSched = (customScheduleList || schedulesRef.current).find((s: any) => s.id.toString() === scheduleId);
        const fallbackSched = res.data[0]?.examSchedule || {};

        res.data.forEach((sr: any) => {
          sr.examRoomStudents?.forEach((ers: any) => {
            totalCount += 1;
            const cls = ers.student?.class;
            const className = cls?.code || cls?.name || 'CNTT-K65';
            const deptName = ers.departmentName || cls?.department?.name || 'Khoa Công nghệ thông tin';
            details.push({
              id: ers.id,
              examNumber: ers.examNumber || ers.student?.studentCode || 'SBN',
              seatNumber: ers.seatNumber,
              studentCode: ers.student?.studentCode || '---',
              fullName: ers.student?.fullName || '---',
              className,
              departmentName: deptName,
              requirementType: ers.requirementType || 'MANDATORY',
              requirementLabel: ers.requirementLabel || `${deptName} • Bắt buộc`,
              roomCode: sr.room?.roomCode || sr.examRoom?.roomCode,
              roomName: sr.room?.roomName || sr.examRoom?.roomName || sr.room?.roomCode,
              building: sr.room?.building || sr.examRoom?.building || '---',
            });
          });
        });
        if (details.length > 0) {
          const subjCode = currentSched?.subject?.subjectCode || fallbackSched?.subject?.subjectCode || '---';
          const subjName = currentSched?.subject?.subjectName || fallbackSched?.subject?.subjectName || '---';
          const exDate = currentSched?.examDate || fallbackSched?.examDate;
          const sTime = currentSched?.startTime || fallbackSched?.startTime || '';
          const eTime = currentSched?.endTime || fallbackSched?.endTime || '';

          setResult({
            message: 'Dữ liệu phân bổ chỗ ngồi hiện tại',
            preview: false,
            summary: {
              totalStudents: totalCount,
              totalRoomsAssigned: res.data.length,
              subjectCode: subjCode,
              subjectName: subjName,
              examDate: exDate ? new Date(exDate).toLocaleDateString('vi-VN') : '---',
              timeSlot: `${sTime} - ${eTime}`,
            },
            details,
          });
          setShowRoomGrid(false);
        } else {
          setResult(null);
          setShowRoomGrid(true);
        }
      } else {
        setResult(null);
        setShowRoomGrid(true);
      }
    } catch {
      setResult(null);
      setShowRoomGrid(true);
    }
  }, []);

  const fetchSchedules = useCallback(async (periodId: string) => {
    try {
      const url = periodId ? `/exam-schedules?examPeriodId=${periodId}` : '/exam-schedules';
      const res = await api.get(url);

      const sortedSchedules = [...(res.data || [])].sort((a: any, b: any) => {
        const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return Number(b.id) - Number(a.id);
      });

      setSchedules(sortedSchedules);
      schedulesRef.current = sortedSchedules;
      if (sortedSchedules.length > 0) {
        // Tự động chọn ca thi MỚI NHẤT (chưa hoàn thành) hoặc ca đầu danh sách
        const targetSched =
          sortedSchedules.find((s: any) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED') ||
          sortedSchedules[0];

        const targetSchedId = targetSched.id.toString();
        setSelectedScheduleId(targetSchedId);
        await fetchRoomAvailability(targetSchedId);
        await fetchExistingResults(targetSchedId, sortedSchedules);
        // Save to cache after full load
        _arrangementCache = {
          schedules: sortedSchedules,
          selectedScheduleId: targetSchedId,
          rooms: [],  // will be updated by fetchRoomAvailability
          selectedRoomIds: [],
          result: null,
        };
      } else {
        setSelectedScheduleId('');
        setRooms([]);
        setResult(null);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách ca thi', type: 'error' });
    }
  }, [fetchExistingResults, fetchRoomAvailability]);

  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const res = await api.get('/exam-arrangement/history');
      setHistoryLogs(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải nhật ký xếp phòng', type: 'error' });
    } finally {
      setTimeout(() => setIsHistoryLoading(false), 500);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      await fetchSchedules('');
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu ban đầu', type: 'error' });
    }
  }, [fetchSchedules]);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    if (_arrangementCache) {
      // render instantly from cache, refetch silently
      void fetchData();
    } else {
      void fetchData();
    }
    void fetchHistory();
  }, [fetchData, fetchHistory, router]);

  const handleScheduleChange = async (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setResult(null);
    setFilterClass('ALL');
    await fetchRoomAvailability(scheduleId);
    await fetchExistingResults(scheduleId, schedules);
  };

  const handleToggleRoom = (r: RoomAvailability) => {
    if (!r.isAvailable) {
      setToast({ message: `Phòng ${r.roomName || r.roomCode} bị bận (${r.busyReason}).`, type: 'error' });
      return;
    }
    if (selectedRoomIds.includes(r.id)) {
      setSelectedRoomIds(selectedRoomIds.filter((id) => id !== r.id));
    } else {
      setSelectedRoomIds([...selectedRoomIds, r.id]);
    }
  };

  const selectAvailableOnly = () => {
    const availableIds = rooms.filter((r) => r.isAvailable).map((r) => r.id);
    setSelectedRoomIds(availableIds);
    setToast({ message: `Đã chọn ${availableIds.length} phòng trống khả dụng.`, type: 'success' });
  };

  const runPreview = async () => {
    if (!selectedScheduleId) {
      setToast({ message: 'Vui lòng chọn ca thi', type: 'error' });
      return;
    }
    if (selectedRoomIds.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất 1 phòng thi trống', type: 'error' });
      return;
    }
    setArranging(true);
    try {
      const res = await api.post<ArrangementResult>('/exam-arrangement/preview', {
        examScheduleId: Number(selectedScheduleId),
        roomIds: selectedRoomIds,
      });
      setResult(res.data);
      setToast({ message: 'Đã tính toán phương án chỗ ngồi. Bấm "Lưu Phân Bổ" để ghi dữ liệu.', type: 'success' });
      // Tự động cuộn mượt mà xuống khu vực kết quả & nút lưu phân bổ (có khoảng đệm an toàn tránh che navbar)
      setTimeout(() => {
        if (resultSectionRef.current) {
          const yOffset = -90; // Chừa 90px phía trên để hiển thị trọn vẹn thanh tiêu đề và nút bấm
          const y = resultSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 150);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Lỗi khi tạo phương án xem trước';
      setToast({ message: Array.isArray(msg) ? msg.join(', ') : msg, type: 'error' });
    } finally {
      setArranging(false);
    }
  };

  const runSaveArrangement = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setArranging(true);
    try {
      const res = await api.post<ArrangementResult>('/exam-arrangement/auto-arrange', {
        examScheduleId: Number(selectedScheduleId),
        roomIds: selectedRoomIds,
        confirm: true,
      });
      setResult(res.data);
      setToast({ message: res.data.message || 'Đã lưu phương án xếp phòng thành công!', type: 'success' });
      await fetchExistingResults(selectedScheduleId);
      await fetchHistory();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Lỗi khi lưu phương án xếp phòng';
      setToast({ message: Array.isArray(msg) ? msg.join(', ') : msg, type: 'error' });
    } finally {
      setArranging(false);
    }
  };

  const handleShuffleSeats = () => {
    if (!result || !result.details?.length) return;

    const roomGroups: Record<string, typeof result.details> = {};
    result.details.forEach((d) => {
      if (!roomGroups[d.roomCode]) roomGroups[d.roomCode] = [];
      roomGroups[d.roomCode].push(d);
    });

    const shuffledDetails: typeof result.details = [];
    let globalCounter = 1;

    Object.values(roomGroups).forEach((students) => {
      const arr = [...students];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      arr.forEach((st, idx) => {
        shuffledDetails.push({
          ...st,
          seatNumber: idx + 1,
          examNumber: `SBD-${String(globalCounter++).padStart(3, '0')}`,
        });
      });
    });

    setResult({
      ...result,
      details: shuffledDetails,
    });

    setToast({
      message: 'Đã xáo trộn ngẫu nhiên chỗ ngồi và đánh lại SBD.',
      type: 'success',
    });
  };

  const handlePrintAttendanceSheet = () => {
    if (!result || !result.details?.length) {
      setToast({
        message: 'Vui lòng chọn ca thi đã có kết quả xếp phòng để in danh sách điểm danh.',
        type: 'error',
      });
      return;
    }

    const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
    const subjectName = result.summary.subjectName || (currentSched?.subject as any)?.subjectName || 'Môn thi';
    const subjectCode = result.summary.subjectCode || (currentSched?.subject as any)?.subjectCode || '';
    const examDate =
      result.summary.examDate ||
      ((currentSched as any)?.examDate
        ? new Date((currentSched as any)?.examDate).toLocaleDateString('vi-VN')
        : '---');
    const timeSlot = result.summary.timeSlot || `${currentSched?.startTime || ''} – ${currentSched?.endTime || ''}`;

    const targetRoomCode = filterRoomCode === 'ALL' ? roomSummaries[0]?.roomCode || '' : filterRoomCode;
    const filteredStudents = result.details.filter((d) => filterRoomCode === 'ALL' || d.roomCode === filterRoomCode);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredStudents
      .map(
        (st, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;font-weight:bold;">${escapeHtml(st.examNumber || `SBD-${idx + 1}`)}</td>
        <td style="text-align:center;font-family:inherit;">${escapeHtml(st.studentCode)}</td>
        <td style="font-weight:bold;">${escapeHtml(st.fullName)}</td>
        <td style="text-align:center;">${escapeHtml(st.className || 'CNTT-K65')}</td>
        <td style="text-align:center;font-weight:bold;">Ghế #${st.seatNumber}</td>
        <td style="height:32px;"></td>
        <td></td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Danh sách ký tên dự thi - ${escapeHtml(subjectName)}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', serif; font-size: 13px; color: #000; margin: 0; padding: 10px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
          .title { text-align: center; margin: 15px 0; }
          .title h2 { margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .title p { margin: 4px 0 0 0; font-size: 13px; font-style: italic; }
          .meta { margin-bottom: 15px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; }
          th { background: #f2f2f2;  font-size: 12px; }
          .footer { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
          .signature-box { width: 45%; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="text-align:center;">
            <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br/>
            <strong>TRƯỜNG ĐẠI HỌC KHOA HỌC</strong>
          </div>
          <div style="text-align:center;">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
            <u>Độc lập - Tự do - Hạnh phúc</u>
          </div>
        </div>

        <div class="title">
          <h2>DANH SÁCH THÍ SINH DỰ THI VÀ KÝ TÊN</h2>
          <p>Môn thi: ${escapeHtml(subjectName)} (${escapeHtml(subjectCode)})</p>
        </div>

        <div class="meta">
          <strong>Phòng thi:</strong> ${escapeHtml(targetRoomCode || 'Tất cả các phòng')} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Ngày thi:</strong> ${escapeHtml(examDate)} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Ca thi:</strong> ${escapeHtml(timeSlot)} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Tổng số thí sinh:</strong> ${filteredStudents.length} SV
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px;">STT</th>
              <th style="width:70px;">Số SBD</th>
              <th style="width:90px;">Mã SV</th>
              <th>Họ và Tên thí sinh</th>
              <th style="width:80px;">Lớp</th>
              <th style="width:65px;">Số Ghế</th>
              <th style="width:100px;">Chữ ký thí sinh</th>
              <th style="width:80px;">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature-box">
            <strong>CÁN BỘ COI THI 1</strong><br/>
            <i>(Ký và ghi rõ họ tên)</i>
          </div>
          <div class="signature-box">
            <strong>CÁN BỘ COI THI 2</strong><br/>
            <i>(Ký và ghi rõ họ tên)</i>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const printDoorList = () => {
    if (!result || !result.details.length) {
      setToast({
        message: 'Vui lòng chọn ca thi đã có kết quả xếp phòng để in danh sách dán cửa.',
        type: 'error',
      });
      return;
    }
    const printable = window.open('', '_blank', 'width=900,height=720');
    if (!printable) {
      setToast({ message: 'Trình duyệt đang chặn cửa sổ in.', type: 'error' });
      return;
    }
    const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
    const filterDetails = filterRoomCode === 'ALL' ? result.details : result.details.filter((d) => d.roomCode === filterRoomCode);
    const roomGroups = new Map<string, typeof filterDetails>();
    filterDetails.forEach((d) => {
      const group = roomGroups.get(d.roomCode) || [];
      group.push(d);
      roomGroups.set(d.roomCode, group);
    });
    const pages = Array.from(roomGroups.entries())
      .map(([roomCode, students]) => {
        const roomInfo = rooms.find((r) => r.roomCode === roomCode);
        const rows = students
          .map(
            (st, i) =>
              `<tr><td style="text-align:center;">${i + 1}</td><td style="text-align:center;font-weight:bold;">SBN-${String(
                i + 1
              ).padStart(3, '0')}</td><td style="font-weight:bold;color:#1e3a8a;">${escapeHtml(
                st.studentCode
              )}</td><td style="font-weight:bold;">${escapeHtml(st.fullName)}</td><td>${escapeHtml(
                st.className
              )}</td><td style="text-align:center;font-weight:bold;color:#1d4ed8;">Ghế #${st.seatNumber}</td></tr>`
          )
          .join('');
        return `<div style="page-break-after:always;padding:24px;margin-bottom:30px;border:1px solid #cbd5e1;border-radius:12px;"><div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;"><h2 style="margin:0;font-size:18px;color:#0f172a;text-transform:uppercase;">HỘI ĐỒNG KHẢO THÍ SV - DANH SÁCH THÍ SINH TẠI PHÒNG THI</h2><h1 style="margin:4px 0 0;font-size:24px;color:#2563eb;font-weight:900;">PHÒNG THI: ${escapeHtml(
          roomInfo?.roomName || roomCode
        )} (${escapeHtml(roomInfo?.building || 'Khu A')})</h1><p style="margin:4px 0 0;font-size:13px;color:#475569;">Môn thi: <strong>${escapeHtml(
          currentSched?.subject?.subjectName
        )}</strong> (${escapeHtml(currentSched?.subject?.subjectCode)}) | Ngày: ${new Date(
          currentSched?.examDate || Date.now()
        ).toLocaleDateString('vi-VN')} | Giờ: ${currentSched?.startTime}-${currentSched?.endTime}</p></div><table style="width:100%;border-collapse:collapse;font-size:12px;" border="1" cellpadding="6"><thead><tr style="background:#f1f5f9;color:#0f172a;text-align:left;"><th style="width:40px;text-align:center;">STT</th><th style="width:70px;text-align:center;">MÃ SBN</th><th style="width:100px;">MÃ SV</th><th>HỌ VÀ TÊN</th><th style="width:90px;">LỚP SH</th><th style="width:70px;text-align:center;">VỊ TRÍ</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:20px;display:flex;justify-content:space-between;font-size:12px;"><div>Tổng số thí sinh: <strong>${students.length
          }</strong> / ${roomInfo?.capacity ?? 0} chỗ</div><div>Cán bộ coi thi ký tên: ....................</div></div></div>`;
      })
      .join('');
    printable.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Danh sách dán cửa</title><style>body{font-family:'Times New Roman',Times,serif;margin:20px;color:#0f172a}@media print{body{margin:0}}</style></head><body>${pages}<script>window.onload=()=>window.print();</script></body></html>`
    );
    printable.document.close();
  };

  const handleResetArrangement = () => {
    const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
    setConfirmModal({
      isOpen: true,
      title: 'Hủy & Reset Xếp phòng thi',
      message: `Bạn có chắc chắn muốn HỦY và XÓA TOÀN BỘ dữ liệu xếp phòng cho ca thi ${currentSched?.subject?.subjectName || ''
        }? Thao tác này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-arrangement/reset/${selectedScheduleId}`);
          setToast({ message: 'Đã hủy xếp phòng cho ca thi thành công!', type: 'success' });
          setResult(null);
          setShowRoomGrid(true);
          await fetchRoomAvailability(selectedScheduleId);
          await fetchHistory();
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi khi hủy xếp phòng', type: 'error' });
        }
      },
    });
  };

  const roomSummaries = useMemo(() => {
    const summaries = new Map<string, { roomCode: string; roomName: string; building: string; assigned: number }>();
    result?.details.forEach((item) => {
      const key = item.roomCode;
      const current = summaries.get(key) || {
        roomCode: item.roomCode,
        roomName: item.roomName,
        building: item.building,
        assigned: 0,
      };
      current.assigned += 1;
      summaries.set(key, current);
    });
    return Array.from(summaries.values());
  }, [result]);

  const selectedCapacity = useMemo(
    () => rooms.filter((room) => selectedRoomIds.includes(room.id)).reduce((sum, room) => sum + room.capacity, 0),
    [rooms, selectedRoomIds]
  );

  const availableCount = useMemo(() => rooms.filter((r) => r.isAvailable).length, [rooms]);

  // List of distinct classes in the current result
  const availableClasses = useMemo(() => {
    if (!result?.details) return [];
    const classes = new Set<string>();
    result.details.forEach((d) => {
      if (d.className) classes.add(d.className);
    });
    return Array.from(classes).sort();
  }, [result]);

  const filteredDetails = useMemo(() => {
    if (!result) return [];
    let list = result.details;
    if (filterRoomCode !== 'ALL') {
      list = list.filter((d) => d.roomCode === filterRoomCode);
    }
    if (filterClass !== 'ALL') {
      list = list.filter((d) => d.className === filterClass);
    }
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.studentCode.toLowerCase().includes(q) ||
          d.className.toLowerCase().includes(q) ||
          d.examNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filterRoomCode, filterClass, studentSearchQuery, result]);

  const filteredHistoryLogs = useMemo(() => {
    let list = historyLogs;
    if (historyActionFilter !== 'ALL') {
      list = list.filter((log) => {
        const act = log.action || '';
        if (historyActionFilter === 'ARRANGE') return ['ARRANGE', 'AUTO_ARRANGE'].includes(act);
        if (historyActionFilter === 'RESET') return ['RESET_ARRANGEMENT', 'RESET'].includes(act);
        if (historyActionFilter === 'CREATE') return ['CREATE'].includes(act);
        if (historyActionFilter === 'DELETE') return ['DELETE'].includes(act);
        return act === historyActionFilter;
      });
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      list = list.filter(
        (log) =>
          (log.description && log.description.toLowerCase().includes(q)) ||
          (log.actor?.fullName && log.actor.fullName.toLowerCase().includes(q)) ||
          (log.actor?.username && log.actor.username.toLowerCase().includes(q)) ||
          (log.action && log.action.toLowerCase().includes(q))
      );
    }
    return list;
  }, [historyLogs, historyActionFilter, historySearch]);

  const currentSchedule = schedules.find((s) => s.id.toString() === selectedScheduleId);

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
        {/* ── 1. Page Header (Đồng bộ 100% với ExamScheduleHeader & ExamSupervisorHeader) ── */}
        <ExamArrangementHeader
          onPrintDoorList={printDoorList}
          onPrintAttendance={handlePrintAttendanceSheet}
        />

        {/* ── 2. Standard 5 KPI Cards (Đồng bộ 100% với ExamScheduleKPICards & ExamRoomKPICards) ── */}
        <ExamArrangementKPICards
          totalSchedules={schedules.length}
          availableRooms={availableCount}
          totalRooms={rooms.length}
          selectedCapacity={selectedCapacity}
          selectedRoomCount={selectedRoomIds.length}
          totalStudents={result ? result.summary.totalStudents : 0}
          totalAssignedRooms={roomSummaries.length}
        />

        {/* ── 3. Active Schedule Shift Banner (Đồng bộ 100% với exam-supervisors) ── */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                <GraduationCap className="h-5 w-5 stroke-[2]" />
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold bg-blue-600 text-white tracking-wide ">
                    {(currentSchedule as any)?.mode === 'MOCK' ? 'THI THỬ' : 'CHÍNH THỨC'}
                  </span>
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {currentSchedule?.subject?.subjectName || 'Chưa chọn ca thi'}
                  </h3>
                  <span className="text-xs font-normal font-medium text-slate-400">
                    #{currentSchedule?.subject?.subjectCode || 'MH'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap min-h-[20px]">
                  {currentSchedule && (
                    <>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {currentSchedule.startTime} - {currentSchedule.endTime}
                      </span>
                      {currentSchedule.examDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(currentSchedule.examDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <DoorOpen className="h-3.5 w-3.5 text-blue-600" />
                        {selectedRoomIds.length} phòng đã chọn ({selectedCapacity} chỗ)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Nút 1: Đổi Ca (Icon Button đổi ca thi) */}
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setShowSchedulePicker(true)}
                title="Đổi ca thi"
                aria-label="Đổi ca thi"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>

              {/* Nút 2: Chọn / Thu Gọn Phòng (Tầng 2: Soft Tint Pill) */}
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setShowRoomGrid((p) => !p)}
                className={
                  showRoomGrid
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80'
                }
              >
                {showRoomGrid ? 'Thu Gọn Phòng' : `Chọn Phòng (${selectedRoomIds.length})`}
              </Button>

              {/* Nút 3: Xếp Tự Động (Tầng 1: Primary Solid Blue - Nút đậm duy nhất) */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={runPreview}
                disabled={arranging}
                isLoading={arranging}
              >
                Xếp Tự Động
              </Button>
            </div>
          </div>

          {/* Expandable Room Selection Grid */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showRoomGrid
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pt-2.5">
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wider">
                        Phòng Thi Khả Dụng Trong Ca
                      </h3>
                      <span className="text-xs font-medium text-slate-500">
                        ({availableCount} phòng trống • Tổng sức chứa: {selectedCapacity} chỗ)
                      </span>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[15px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={availableCount > 0 && selectedRoomIds.length === availableCount}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = selectedRoomIds.length > 0 && selectedRoomIds.length < availableCount;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAvailableOnly();
                          } else {
                            setSelectedRoomIds([]);
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                      />
                      <span>Chọn tất cả ({selectedRoomIds.length}/{availableCount})</span>
                    </label>
                  </div>

                  {/* Lưới Thẻ Phòng */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {rooms.map((r) => {
                      const isSelected = selectedRoomIds.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            if (r.isAvailable) handleToggleRoom(r);
                          }}
                          className={`p-3 rounded-xl border transition-all select-none flex flex-col justify-between gap-1.5 ${!r.isAvailable
                            ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-65'
                            : isSelected
                              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 font-semibold ring-1 ring-blue-500 cursor-pointer shadow-2xs'
                              : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer'
                            }`}
                          title={!r.isAvailable ? r.busyReason || 'Phòng bận' : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs truncate">
                              {r.roomName || r.roomCode}
                            </span>
                            <span className="text-xs text-slate-400 font-normal">
                              {r.building}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {r.capacity} chỗ
                            </span>
                            <span
                              className={`text-xs font-semibold ${!r.isAvailable
                                ? 'text-rose-600 dark:text-rose-400'
                                : r.isAssignedToCurrent
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                            >
                              {!r.isAvailable ? 'BẬN' : r.isAssignedToCurrent ? 'ĐÃ GÁN' : 'TRỐNG'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Tab Switcher Bar ── */}
        <div className="-mt-2">
          <TabBar
            tabs={[
              { key: 'arrange', label: 'Thực hiện Xếp phòng' },
              { key: 'history', label: 'Lịch sử & Nhật ký', count: historyLogs.length },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as any)}
          />
        </div>

        {activeTab === 'arrange' ? (
          <div className="space-y-3.5 -mt-2">
            {/* ── 5. Khu Vực Kết Quả & Ma Trận Chỗ Ngồi Trực Quan ── */}
            <div
              ref={resultSectionRef}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs min-h-[480px] scroll-mt-6"
            >
              {!result ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <DoorOpen className="h-7 w-7 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Sẵn sàng phân bổ phòng thi
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md">
                      Chọn ca thi và phòng thi khả dụng ở trên, sau đó bấm <strong>&quot;Xếp Tự Động&quot;</strong> để tạo sơ đồ ma trận chỗ ngồi sinh viên.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary & Toolbar Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {result.preview ? 'Phương án phân bổ chỗ ngồi' : 'Dữ liệu phân bổ chỗ ngồi'}
                        </h3>
                        {result.preview ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                            Xem trước
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                            Chính thức
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Đã phân bổ <strong>{result.summary.totalStudents} thí sinh</strong> vào{' '}
                        <strong>{roomSummaries.length} phòng thi</strong>
                        {result.summary.timeSlot && ` (${result.summary.timeSlot})`}
                      </p>
                    </div>

                    {/* Action Buttons Toolbar Trong Khu Vực Kết Quả */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={handleResetArrangement}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5 text-rose-500" />}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800"
                      >
                        Hủy Phương Án
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={handleShuffleSeats}
                        leftIcon={<Shuffle className="h-3.5 w-3.5" />}
                      >
                        Trộn Ghế Ngẫu Nhiên
                      </Button>

                      {result.preview && (
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: 'Xác nhận lưu phương án xếp phòng',
                              message: 'Kết quả phân bổ sinh viên vào phòng sẽ được lưu chính thức vào hệ thống. Bạn có chắc chắn?',
                              type: 'info',
                              onConfirm: runSaveArrangement,
                            })
                          }
                          leftIcon={<Check className="h-3.5 w-3.5" />}
                        >
                          Lưu Phân Bổ
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filter & View Switcher Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* View Switcher Tabs */}
                      <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setViewMode('matrix')}
                          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${viewMode === 'matrix'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                          <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
                          Sơ Đồ Ghế
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${viewMode === 'table'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                          <List className="h-3.5 w-3.5 text-slate-500" />
                          Danh Sách Bảng
                        </button>
                      </div>

                      {/* Filter by Room */}
                      <FilterSelect
                        value={filterRoomCode}
                        onChange={(e) => setFilterRoomCode(e.target.value)}
                        containerClassName="min-w-[190px]"
                        options={[
                          { value: 'ALL', label: `Tất cả các phòng (${roomSummaries.length} phòng)` },
                          ...roomSummaries.map((rm) => ({
                            value: rm.roomCode,
                            label: `${rm.roomName || rm.roomCode} (${rm.assigned} SV)`,
                          })),
                        ]}
                      />

                      {/* Filter by Class (Lớp sinh hoạt) */}
                      {availableClasses.length > 1 && (
                        <FilterSelect
                          value={filterClass}
                          onChange={(e) => setFilterClass(e.target.value)}
                          containerClassName="min-w-[150px]"
                          options={[
                            { value: 'ALL', label: `Tất cả lớp (${availableClasses.length} lớp)` },
                            ...availableClasses.map((cls) => ({
                              value: cls,
                              label: `Lớp: ${cls}`,
                            })),
                          ]}
                        />
                      )}
                    </div>

                    {/* Live Student Search Box */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="Tìm mã SV, họ tên, SBD..."
                          className="h-9 pl-8 pr-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition shadow-2xs min-w-[210px]"
                        />
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        {studentSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStudentSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-xl cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {studentSearchQuery.trim() && (
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg shrink-0 border border-blue-100 dark:border-blue-900/50 animate-fadeIn">
                          Khớp {filteredDetails.length} SV
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── View 1: Sơ Đồ Phòng Máy / Giảng Đường Trực Quan (Live Lab Floor Plan) ── */}
                  {viewMode === 'matrix' && (
                    <div className="space-y-6 pt-2">
                      {roomSummaries
                        .filter((rm) => filterRoomCode === 'ALL' || rm.roomCode === filterRoomCode)
                        .map((room) => {
                          const studentsInRoom = filteredDetails.filter((d) => d.roomCode === room.roomCode);
                          const roomObj = rooms.find((r) => r.roomCode === room.roomCode);
                          const capacity = roomObj?.capacity || 40;
                          const percentFilled = Math.min(100, Math.round((studentsInRoom.length / capacity) * 100));

                          return (
                            <div
                              key={room.roomCode}
                              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-4 sm:p-5 space-y-4 shadow-2xs"
                            >
                              {/* Room Header Info */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800/80 pb-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 font-semibold shrink-0">
                                    <DoorOpen className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px]  tracking-wider">
                                        PHÒNG {room.roomName || room.roomCode}
                                      </h4>
                                      {room.building && (
                                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                          {room.building}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Đã xếp <strong>{studentsInRoom.length}</strong>/{capacity} chỗ ({percentFilled}%)
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-28 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${percentFilled}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900/50 px-2.5 py-1 rounded-lg">
                                    {studentsInRoom.length} Ghế
                                  </span>
                                </div>
                              </div>

                              {/* Bục Giảng / Bàn Giám Thị Mô Phỏng (Proctor Podium) */}
                              <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-slate-100 via-blue-50/50 to-slate-100 dark:from-slate-800/80 dark:via-blue-950/30 dark:to-slate-800/80 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 shadow-2xs">
                                <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-[12px] font-semibold  tracking-widest text-slate-700 dark:text-slate-200">
                                  BỤC GIẢNG &amp; BÀN CÁN BỘ COI THI (HƯỚNG NHÌN)
                                </span>
                              </div>

                              {/* Lưới Ghế Ngồi Tinh Xảo (Seat Matrix Grid) */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                                {studentsInRoom.map((st, sIdx) => {
                                  const isMatchingSearch =
                                    studentSearchQuery.trim() &&
                                    (st.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                                      st.studentCode.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                                      st.examNumber.toLowerCase().includes(studentSearchQuery.toLowerCase()));

                                  return (
                                    <div
                                      key={st.id ? `st-${st.id}-${sIdx}` : `st-${st.studentCode}-${st.seatNumber}-${sIdx}`}
                                      className={`rounded-xl border p-2.5 shadow-2xs transition-all text-left space-y-1.5 hover:-translate-y-0.5 hover:shadow-xs duration-150 ${isMatchingSearch
                                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/80 ring-2 ring-blue-500 animate-pulse'
                                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400'
                                        }`}
                                    >
                                      {/* Top: Ghế & Lớp */}
                                      <div className="flex items-center justify-between text-xs gap-1">
                                        <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded-md text-[12px] shrink-0">
                                          #{st.seatNumber}
                                        </span>
                                        <span className="font-semibold text-slate-500 dark:text-slate-400 text-[12px] truncate" title={st.className}>
                                          {st.className}
                                        </span>
                                      </div>

                                      {/* Middle: Họ Tên */}
                                      <p
                                        className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate"
                                        title={st.fullName}
                                      >
                                        {st.fullName}
                                      </p>

                                      {/* Bottom: MSSV & SBD */}
                                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <span className="font-normal text-slate-500 dark:text-slate-400 text-[12px]">{st.studentCode}</span>
                                        <span className="font-semibold font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded text-[12px]">
                                          {st.examNumber}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* ── View 2: Bảng Danh Sách Chi Tiết (Detailed Table) ── */}
                  {viewMode === 'table' && (
                    <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 max-h-[520px] overflow-y-auto">
                      <table className="ui-table w-full text-left text-[15px] text-slate-700 dark:text-slate-300 border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-[14px] font-medium tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                          <tr>
                            <th className="p-3">Phòng</th>
                            <th className="p-3 text-center">Vị trí</th>
                            <th className="p-3">Số Báo Danh</th>
                            <th className="p-3">Mã SV</th>
                            <th className="p-3">Họ và Tên</th>
                            <th className="p-3">Lớp SH</th>
                            <th className="p-3">Khoa / Ngành</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredDetails.map((st, dIdx) => (
                            <tr
                              key={st.id ? `tbl-${st.id}-${dIdx}` : `tbl-${st.studentCode}-${st.seatNumber}-${dIdx}`}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                            >
                              <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                                {st.roomName || st.roomCode}
                              </td>
                              <td className="p-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                                Ghế #{st.seatNumber}
                              </td>
                              <td className="p-3 font-normal font-semibold text-slate-700 dark:text-slate-300">
                                {st.examNumber}
                              </td>
                              <td className="p-3 font-normal text-slate-500 dark:text-slate-400">
                                {st.studentCode}
                              </td>
                              <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                                {st.fullName}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                {st.className || 'CNTT-K65'}
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                {(st.requirementLabel || st.departmentName || 'Khoa CNTT').split(/[•\.\·]/)[0].trim()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Tab 2: Lịch Sử & Nhật Ký Xếp Phòng ── */
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4 -mt-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Nhật ký thao tác &amp; Lịch sử Xếp phòng thi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ghi lại toàn bộ lịch sử tạo phương án, lưu vết và hủy xếp phòng thi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Làm mới nhật ký"
                >
                  <RefreshCw className={`h-4 w-4 ${isHistoryLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <FilterSelect
                  value={historyActionFilter}
                  onChange={(e) => setHistoryActionFilter(e.target.value)}
                  containerClassName="min-w-[160px]"
                  options={[
                    { value: 'ALL', label: 'Tất cả hành động' },
                    { value: 'ARRANGE', label: 'Xếp phòng' },
                    { value: 'RESET', label: 'Hủy xếp phòng' },
                    { value: 'CREATE', label: 'Tạo lịch' },
                    { value: 'DELETE', label: 'Xóa lịch' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Tìm trong nhật ký..."
                    className="h-8 pl-7 pr-7 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition shadow-2xs min-w-[200px]"
                  />
                  <Search className="h-3 w-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-xl cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {filteredHistoryLogs.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium shrink-0">
                    {filteredHistoryLogs.length} mục
                  </span>
                )}
              </div>
            </div>

            {/* Standard Table View */}
            <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
              <table className="ui-table w-full text-left text-[15px] text-slate-700 dark:text-slate-300 border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[14px] font-medium tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Thời Gian</th>
                    <th className="p-3 whitespace-nowrap">Người Thực Hiện</th>
                    <th className="p-3 whitespace-nowrap">Hành Động</th>
                    <th className="p-3">Mô Tả Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!filteredHistoryLogs.length ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">
                        {historySearch || historyActionFilter !== 'ALL'
                          ? 'Không tìm thấy nhật ký phù hợp với bộ lọc.'
                          : 'Chưa có lịch sử thao tác xếp phòng.'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryLogs.map((log: any, lIdx: number) => {
                      const act = log.action || '';
                      const isDanger = ['RESET_ARRANGEMENT', 'RESET', 'DELETE'].includes(act);
                      const cls = isDanger ? 'text-rose-600 font-semibold' : 'text-slate-900 dark:text-slate-100 font-semibold';

                      const label = (() => {
                        if (['ARRANGE', 'AUTO_ARRANGE'].includes(act)) return 'Xếp phòng';
                        if (['RESET_ARRANGEMENT', 'RESET'].includes(act)) return 'Hủy xếp phòng';
                        if (['DELETE'].includes(act)) return 'Xóa lịch';
                        if (['CREATE'].includes(act)) return 'Tạo lịch';
                        if (['UPDATE'].includes(act)) return 'Cập nhật';
                        if (['REOPEN_ENTRY'].includes(act)) return 'Mở lại thi';
                        if (['PUBLISH'].includes(act)) return 'Công bố';
                        if (['LOCK'].includes(act)) return 'Khóa ca thi';
                        if (['EXPORT'].includes(act)) return 'Xuất dữ liệu';
                        return act.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
                      })();

                      const roleLabel =
                        log.actor?.role === 'ADMIN'
                          ? 'Quản trị viên'
                          : log.actor?.role === 'TEACHER'
                            ? 'Giảng viên'
                            : log.actor?.role === 'STUDENT'
                              ? 'Sinh viên'
                              : log.actor?.role || 'Quản trị viên';
                      const username = log.actor?.username || log.actor?.fullName || 'admin';

                      return (
                        <tr key={log.id ? `log-${log.id}-${lIdx}` : `log-${lIdx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          {/* Thời gian */}
                          <td className="p-3 font-medium text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </td>

                          {/* Người thực hiện */}
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {username} <span className="text-slate-400 font-normal text-[15px]">({roleLabel})</span>
                          </td>

                          {/* Hành động */}
                          <td className="p-3 whitespace-nowrap">
                            <span className={cls}>{label}</span>
                          </td>

                          {/* Mô tả chi tiết */}
                          <td className="p-3 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {log.description}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal Popup Chọn Ca Thi Hiện Đại ── */}
      <ArrangementSchedulePickerModal
        isOpen={showSchedulePicker}
        onClose={() => setShowSchedulePicker(false)}
        schedules={schedules}
        selectedScheduleId={selectedScheduleId}
        onSelectSchedule={(schedId) => {
          void handleScheduleChange(schedId);
          setShowSchedulePicker(false);
        }}
      />

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
