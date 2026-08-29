'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { SlidingSegmentedControl } from '../../components/ui/SlidingSegmentedControl';
import { ViewModeSegmentedControl } from '../../components/ui/ViewModeSegmentedControl';
import { PageSkeleton } from '../../components/ui/Skeleton';
import {
  DoorOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  Printer,
  Loader2,
} from 'lucide-react';
import { ExamSchedule } from '../../types';
import { ArrangementSchedulePickerModal } from '../../components/exam-arrangement/ArrangementSchedulePickerModal';
import { ExamArrangementKPICards } from '../../components/exam-arrangement/ExamArrangementKPICards';
import { ExamArrangementHeader } from '../../components/exam-arrangement/ExamArrangementHeader';
import { ClassSelectorPopover } from '../../components/exam-arrangement/ClassSelectorPopover';
import { RoomSelectorPopover } from '../../components/exam-arrangement/RoomSelectorPopover';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';

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

type ScheduleClass = {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  departmentName: string;
  studentCount: number;
};

type ArrangementResult = {
  message: string;
  preview?: boolean;
  warnings?: string[];
  errors?: string[];
  unassigned?: Array<{ studentId: number; studentCode: string; fullName: string; reason: string }>;
  autoAddedRooms?: Array<{ id: number; roomCode: string; roomName: string; capacity: number }>;
  effectiveRoomIds?: number[];
  roomBreakdowns?: Array<{
    roomId: number;
    roomCode: string;
    roomName: string;
    building: string;
    capacity: number;
    studentCount: number;
    classes: Array<{ className: string; count: number }>;
  }>;
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
  scheduleClasses: ScheduleClass[];
  selectedClassIds: number[];
  result: ArrangementResult | null;
} | null = null;

export default function ExamArrangementPage() {
  usePageTitle('Xếp phòng thi');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>(_arrangementCache?.schedules ?? []);
  const schedulesRef = useRef<ExamSchedule[]>(_arrangementCache?.schedules ?? []);
  const [rooms, setRooms] = useState<RoomAvailability[]>(_arrangementCache?.rooms ?? []);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(_arrangementCache?.selectedScheduleId ?? '');
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>(_arrangementCache?.selectedRoomIds ?? []);
  const [scheduleClasses, setScheduleClasses] = useState<ScheduleClass[]>(_arrangementCache?.scheduleClasses ?? []);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>(_arrangementCache?.selectedClassIds ?? []);
  const [arranging, setArranging] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(!_arrangementCache || !_arrangementCache.schedules.length);
  const [result, setResult] = useState<ArrangementResult | null>(_arrangementCache?.result ?? null);

  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [filterRoomCode, setFilterRoomCode] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showRoomGrid, setShowRoomGrid] = useState(true);
  const [drawerStudentDetail, setDrawerStudentDetail] = useState<any | null>(null);
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
    type: 'info',
    onConfirm: () => {},
  });

  const fetchScheduleClasses = useCallback(async (scheduleId: string) => {
    if (!scheduleId) return;
    try {
      const res = await api.get(`/exam-arrangement/classes?examScheduleId=${scheduleId}`);
      const clsList: ScheduleClass[] = res.data?.classes || [];
      setScheduleClasses(clsList);
      const clsIds = clsList.map((c) => c.id);
      setSelectedClassIds(clsIds);
      if (_arrangementCache) {
        _arrangementCache.scheduleClasses = clsList;
        _arrangementCache.selectedClassIds = clsIds;
      }
    } catch {
      setScheduleClasses([]);
      setSelectedClassIds([]);
      if (_arrangementCache) {
        _arrangementCache.scheduleClasses = [];
        _arrangementCache.selectedClassIds = [];
      }
    }
  }, []);

  const fetchRoomAvailability = useCallback(async (scheduleId: string) => {
    if (!scheduleId) return;
    try {
      const res = await api.get<RoomAvailability[]>(`/exam-arrangement/room-availability?examScheduleId=${scheduleId}`);
      setRooms(res.data);
      const availableIds = res.data.filter((r) => r.isAvailable).map((r) => r.id);
      setSelectedRoomIds(availableIds);
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
      if (_arrangementCache) _arrangementCache.result = null;
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
              requirementLabel: ers.requirementLabel || `${deptName} (Bắt buộc)`,
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

          const arrangementData: ArrangementResult = {
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
          };

          setResult(arrangementData);
          setShowRoomGrid(false);
          if (_arrangementCache) {
            _arrangementCache.result = arrangementData;
          }
        } else {
          setResult(null);
          setShowRoomGrid(true);
          if (_arrangementCache) {
            _arrangementCache.result = null;
          }
        }
      } else {
        setResult(null);
        setShowRoomGrid(true);
        if (_arrangementCache) {
          _arrangementCache.result = null;
        }
      }
    } catch {
      setResult(null);
      setShowRoomGrid(true);
      if (_arrangementCache) {
        _arrangementCache.result = null;
      }
    }
  }, []);

  const fetchSchedules = useCallback(async (periodId: string) => {
    setIsLoadingSchedule(true);
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
        const targetSched =
          sortedSchedules.find((s: any) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED') ||
          sortedSchedules[0];

        const targetSchedId = targetSched.id.toString();
        setSelectedScheduleId(targetSchedId);

        _arrangementCache = {
          schedules: sortedSchedules,
          selectedScheduleId: targetSchedId,
          rooms: _arrangementCache?.rooms ?? [],
          selectedRoomIds: _arrangementCache?.selectedRoomIds ?? [],
          scheduleClasses: _arrangementCache?.scheduleClasses ?? [],
          selectedClassIds: _arrangementCache?.selectedClassIds ?? [],
          result: _arrangementCache?.result ?? null,
        };

        await Promise.all([
          fetchRoomAvailability(targetSchedId),
          fetchScheduleClasses(targetSchedId),
          fetchExistingResults(targetSchedId, sortedSchedules),
        ]);
      } else {
        setSelectedScheduleId('');
        setRooms([]);
        setScheduleClasses([]);
        setSelectedClassIds([]);
        setResult(null);
        _arrangementCache = {
          schedules: [],
          selectedScheduleId: '',
          rooms: [],
          selectedRoomIds: [],
          scheduleClasses: [],
          selectedClassIds: [],
          result: null,
        };
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách ca thi', type: 'error' });
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [fetchExistingResults, fetchRoomAvailability, fetchScheduleClasses]);

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
    void fetchData();
  }, [fetchData, router]);

  const handleScheduleChange = async (scheduleId: string) => {
    if (!scheduleId || scheduleId === selectedScheduleId) return;
    setSelectedScheduleId(scheduleId);
    if (_arrangementCache) {
      _arrangementCache.selectedScheduleId = scheduleId;
    }
    setIsLoadingSchedule(true);
    setFilterClass('ALL');
    setStudentSearchQuery('');
    try {
      const scheduleList = schedulesRef.current.length > 0 ? schedulesRef.current : schedules;
      await Promise.all([
        fetchRoomAvailability(scheduleId),
        fetchScheduleClasses(scheduleId),
        fetchExistingResults(scheduleId, scheduleList),
      ]);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu ca thi:', err);
    } finally {
      setIsLoadingSchedule(false);
    }
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

  const totalSelectedClassStudents = useMemo(() => {
    if (scheduleClasses.length === 0) return 0;
    return scheduleClasses
      .filter((c) => selectedClassIds.includes(c.id))
      .reduce((sum, c) => sum + c.studentCount, 0);
  }, [scheduleClasses, selectedClassIds]);

  const runPreview = async () => {
    if (!selectedScheduleId) {
      setToast({ message: 'Vui lòng chọn ca thi', type: 'error' });
      return;
    }
    if (selectedRoomIds.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất 1 phòng thi trống', type: 'error' });
      return;
    }
    if (scheduleClasses.length > 0 && selectedClassIds.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất 1 lớp tham gia thi', type: 'error' });
      return;
    }
    setArranging(true);
    try {
      const res = await api.post<ArrangementResult>('/exam-arrangement/preview', {
        examScheduleId: Number(selectedScheduleId),
        roomIds: selectedRoomIds,
        classIds: selectedClassIds.length === scheduleClasses.length ? undefined : selectedClassIds,
      });
      setResult(res.data);
      if (_arrangementCache) _arrangementCache.result = res.data;
      if (res.data.effectiveRoomIds?.length) setSelectedRoomIds(res.data.effectiveRoomIds);
      setToast({ message: 'Đã tính toán phương án chỗ ngồi dồn lớp. Bấm "Lưu Phân Bổ" để ghi dữ liệu.', type: 'success' });
      setTimeout(() => {
        if (resultSectionRef.current) {
          const yOffset = -90;
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
        roomIds: result?.effectiveRoomIds || selectedRoomIds,
        classIds: selectedClassIds.length === scheduleClasses.length ? undefined : selectedClassIds,
        confirm: true,
      });
      setResult(res.data);
      if (_arrangementCache) _arrangementCache.result = res.data;
      setToast({ message: res.data.message || 'Đã lưu phương án xếp phòng thành công!', type: 'success' });
      await fetchExistingResults(selectedScheduleId);
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

    const updatedResult = {
      ...result,
      details: shuffledDetails,
    };
    setResult(updatedResult);
    if (_arrangementCache) _arrangementCache.result = updatedResult;

    setToast({
      message: 'Đã xáo trộn ngẫu nhiên chỗ ngồi và đánh lại SBD.',
      type: 'success',
    });
  };

  const handlePrintDoorList = () => {
    if (!result || !result.details?.length) {
      setToast({
        message: 'Vui lòng chọn ca thi đã có kết quả xếp phòng để in danh sách dán cửa.',
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
    const roomObj = rooms.find((r) => r.roomCode === targetRoomCode);
    const roomTitle = roomObj ? `${roomObj.roomName || roomObj.roomCode} (${roomObj.building || ''})` : targetRoomCode;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = filteredStudents
      .map(
        (st, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;font-weight:bold;">${escapeHtml(st.examNumber || `SBD-${idx + 1}`)}</td>
        <td style="text-align:center;">${escapeHtml(st.studentCode)}</td>
        <td style="font-weight:bold;">${escapeHtml(st.fullName)}</td>
        <td style="text-align:center;">${escapeHtml(st.className || 'CNTT-K65')}</td>
        <td style="text-align:center;font-weight:bold;">Ghế #${st.seatNumber}</td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Danh sách dán cửa phòng thi - ${escapeHtml(roomTitle)}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; margin: 0; padding: 15px; line-height: 1.35; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
          .header-table td { vertical-align: top; border: none; padding: 0; }
          .title { text-align: center; margin: 10px 0 6px; }
          .title h2 { margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #000000; }
          .title h3 { margin: 4px 0 0 0; font-size: 12pt; font-weight: bold; color: #000000; }
          .meta { margin-bottom: 12px; line-height: 1.5; font-size: 10pt; color: #000000; border-bottom: 1px solid #000000; padding-bottom: 6px; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; page-break-inside: auto; }
          table.data-table thead { display: table-header-group; }
          table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
          table.data-table th { border: 1px solid #000000; background: transparent; padding: 6px; font-size: 10pt; font-weight: bold; color: #000000; text-align: center; }
          table.data-table td { border: 1px solid #000000; padding: 5px 6px; font-size: 10pt; color: #000000; word-break: break-word; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width:50%; text-align:center; vertical-align:top; border:none; padding:0;">
              <div style="font-weight:bold; font-size:10.5pt;">TRƯỜNG ĐẠI HỌC NAM CẦN THƠ</div>
              <div style="font-size:10pt;">HỘI ĐỒNG THI HỌC KỲ</div>
              <div style="border-top:1px solid #000; display:inline-block; width:110px; margin-top:2px;"></div>
            </td>
            <td style="width:50%; text-align:center; vertical-align:top; border:none; padding:0;">
              <div style="font-weight:bold; font-size:10.5pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-weight:bold; font-size:10pt; font-style:italic;">Độc lập - Tự do - Hạnh phúc</div>
              <div style="border-top:1px solid #000; display:inline-block; width:110px; margin-top:2px;"></div>
            </td>
          </tr>
        </table>

        <div class="title">
          <h2>DANH SÁCH THÍ SINH PHÒNG THI</h2>
          <h3>PHÒNG THI: ${escapeHtml(roomTitle)}</h3>
        </div>

        <div class="meta">
          <strong>Môn thi:</strong> ${escapeHtml(subjectName)} (${escapeHtml(subjectCode)})<br/>
          <strong>Ngày thi:</strong> ${escapeHtml(examDate)} | <strong>Giờ thi:</strong> ${escapeHtml(timeSlot)}<br/>
          <strong>Tổng số thí sinh:</strong> ${filteredStudents.length} sinh viên
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width:6%;">STT</th>
              <th style="width:14%;">SBD</th>
              <th style="width:16%;">Mã SV</th>
              <th style="width:34%;">Họ và Tên</th>
              <th style="width:16%;">Lớp</th>
              <th style="width:14%;">Chỗ ngồi</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
        <td style="height:30px;"></td>
        <td></td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Danh sách ký tên dự thi - ${escapeHtml(subjectName)}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; margin: 0; padding: 15px; line-height: 1.35; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
          .header-table td { vertical-align: top; border: none; padding: 0; }
          .title { text-align: center; margin: 10px 0 6px; }
          .title h2 { margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #000000; }
          .title p { margin: 4px 0 0 0; font-size: 10.5pt; font-style: italic; color: #000000; }
          .meta { margin-bottom: 12px; line-height: 1.5; font-size: 10pt; color: #000000; border-bottom: 1px solid #000000; padding-bottom: 6px; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; page-break-inside: auto; }
          table.data-table thead { display: table-header-group; }
          table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
          table.data-table th { border: 1px solid #000000; background: transparent; padding: 6px; font-size: 10pt; font-weight: bold; color: #000000; text-align: center; }
          table.data-table td { border: 1px solid #000000; padding: 5px 6px; font-size: 10pt; color: #000000; word-break: break-word; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width:50%; text-align:center; vertical-align:top; border:none; padding:0;">
              <div style="font-weight:bold; font-size:10.5pt;">TRƯỜNG ĐẠI HỌC NAM CẦN THƠ</div>
              <div style="font-size:10pt;">HỘI ĐỒNG THI HỌC KỲ</div>
              <div style="border-top:1px solid #000; display:inline-block; width:110px; margin-top:2px;"></div>
            </td>
            <td style="width:50%; text-align:center; vertical-align:top; border:none; padding:0;">
              <div style="font-weight:bold; font-size:10.5pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-weight:bold; font-size:10pt; font-style:italic;">Độc lập - Tự do - Hạnh phúc</div>
              <div style="border-top:1px solid #000; display:inline-block; width:110px; margin-top:2px;"></div>
            </td>
          </tr>
        </table>

        <div class="title">
          <h2>DANH SÁCH THÍ SINH DỰ THI VÀ KÝ TÊN</h2>
          <p>Môn thi: ${escapeHtml(subjectName)} (${escapeHtml(subjectCode)})</p>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width:5%;">STT</th>
              <th style="width:11%;">SBD</th>
              <th style="width:12%;">Mã SV</th>
              <th style="width:26%;">Họ và Tên</th>
              <th style="width:12%;">Lớp</th>
              <th style="width:10%;">Chỗ ngồi</th>
              <th style="width:14%;">Chữ ký</th>
              <th style="width:10%;">Ghi chú</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleResetArrangement = () => {
    const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
    setConfirmModal({
      isOpen: true,
      title: 'Hủy xếp phòng ca thi?',
      message: `Bạn có chắc chắn muốn HỦY và XÓA TOÀN BỘ dữ liệu xếp phòng cho ca thi ${currentSched?.subject?.subjectName || ''}? Thao tác này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-arrangement/reset/${selectedScheduleId}`);
          setToast({ message: 'Đã hủy xếp phòng cho ca thi thành công!', type: 'success' });
          setResult(null);
          if (_arrangementCache) _arrangementCache.result = null;
          setShowRoomGrid(true);
          await fetchRoomAvailability(selectedScheduleId);
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

  const totalSelectedStudents = useMemo(
    () => scheduleClasses.filter((c) => selectedClassIds.includes(c.id)).reduce((sum, c) => sum + c.studentCount, 0),
    [scheduleClasses, selectedClassIds]
  );

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

  const currentSchedule = schedules.find((s) => s.id.toString() === selectedScheduleId);

  if (isLoadingSchedule && !schedules.length) {
    return <PageSkeleton hasKPIs={true} variant="table" />;
  }

  return (
    <>
      <main className="w-full px-4 sm:px-6 py-6 space-y-5 min-h-screen bg-slate-50/50 dark:bg-slate-950 ">
        <ExamArrangementHeader
          onPrintDoorList={handlePrintDoorList}
          onPrintAttendance={handlePrintAttendanceSheet}
        />

        <ExamArrangementKPICards
          totalSchedules={schedules.length}
          availableRooms={availableCount}
          totalRooms={rooms.length}
          selectedCapacity={selectedCapacity}
          selectedRoomCount={selectedRoomIds.length}
          totalStudents={result?.summary?.totalStudents || 0}
          totalAssignedRooms={result?.summary?.totalRoomsAssigned || 0}
        />

        {/* ── MÀN HÌNH THỰC HIỆN XẾP PHÒNG THI ── */}
        <div className="space-y-4">
          {/* ── THANH ĐIỀU KHIỂN & THAO TÁC PHẲNG 1 DÒNG DUY NHẤT ── */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 min-h-[44px]">
            {/* Trái: Thông tin Ca thi chuẩn mẫu */}
            <div className="space-y-0.5 min-w-0">
              {/* Hàng 1: Badge Trạng thái nổi bật + Tên Môn + #Mã Môn + Icon ⇄ */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 ui-pill ui-pill-solid rounded-full text-type-helper font-medium bg-blue-600 text-white tracking-wide">
                  {result?.preview ? 'XEM TRƯỚC' : 'CHÍNH THỨC'}
                </span>
                <h2 className="text-type-body font-semibold text-slate-900 dark:text-white truncate">
                  {currentSchedule?.subject?.subjectName || 'Chưa chọn ca thi'}
                </h2>
                <span className="text-type-helper font-medium text-slate-400 dark:text-slate-500">
                  #{currentSchedule?.subject?.subjectCode || '---'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSchedulePicker(true)}
                  className="p-1 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                  title="Đổi ca thi khác"
                  aria-label="Đổi ca thi"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Hàng 2: Ngày thi | Giờ thi | Số phòng */}
              <div className="flex items-center gap-2.5 text-type-helper text-slate-500 dark:text-slate-400 flex-wrap font-normal">
                {currentSchedule?.examDate && (
                  <span>{new Date(currentSchedule.examDate).toLocaleDateString('vi-VN')}</span>
                )}
                {currentSchedule?.startTime && currentSchedule?.endTime && (
                  <>
                    {currentSchedule.examDate && <span>|</span>}
                    <span>{currentSchedule.startTime} – {currentSchedule.endTime}</span>
                  </>
                )}
                <span>|</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {result?.summary?.totalRoomsAssigned || selectedRoomIds.length || 0} phòng thi
                </span>
              </div>
            </div>

            {/* Phải: Toolbar điều khiển chính (nằm nhất quán trên cùng) */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {isLoadingSchedule ? (
                <div className="h-10 w-48 rounded-xl bg-slate-100 dark:bg-slate-800/80 animate-pulse border border-slate-200/50 dark:border-slate-700/50" />
              ) : result ? (
                /* Khi đã có kết quả: Tìm kiếm + Switch View + Cấu hình lại + Lưu */
                <>
                  {/* Ô tìm kiếm sinh viên */}
                  <div className="relative w-44 sm:w-52">
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm SV..."
                      className="h-10 w-full pl-9 pr-8 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 text-type-body text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    />
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-xl cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Icon Toggle Sơ Đồ / Bảng (SlidingSegmentedControl đồng bộ chuẩn hệ thống) */}
                  <ViewModeSegmentedControl<'matrix' | 'table'>
                    viewMode={viewMode}
                    onChange={setViewMode}
                    supportedModes={['matrix', 'table']}
                  />

                  {/* Nút Cấu hình lại (Ghost button) */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setResult(null);
                      if (_arrangementCache) _arrangementCache.result = null;
                    }}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    Cấu hình lại
                  </Button>

                  {/* Nút Lưu Phân Bổ */}
                  {result.preview && (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'Lưu phương án xếp phòng thi?',
                          message: 'Kết quả phân bổ sinh viên vào phòng sẽ được lưu chính thức vào hệ thống. Bạn có chắc chắn muốn thực hiện?',
                          type: 'info',
                          onConfirm: runSaveArrangement,
                        })
                      }
                    >
                      Lưu phân bổ
                    </Button>
                  )}
                </>
              ) : (
                /* Khi chưa xếp: Nút CTA [ Xếp tự động ] ở góc trên bên phải */
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={runPreview}
                  disabled={arranging || selectedClassIds.length === 0 || selectedRoomIds.length === 0 || totalSelectedStudents > selectedCapacity}
                  isLoading={arranging}
                >
                  Xếp tự động
                </Button>
              )}
            </div>
          </div>

          {/* ── KHU VỰC SƠ ĐỒ / KẾT QUẢ ── */}
          {isLoadingSchedule ? (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center shadow-2xs flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
                Đang tải dữ liệu ca thi...
              </p>
            </div>
          ) : !result ? (
            /* ── HERO SETUP BOARD: Cấu hình phân bổ 2 cột trực quan ── */
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden space-y-0">
              {/* Board Header */}
              <div className="p-5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                    <h3 className="text-type-body font-semibold text-slate-900 dark:text-white">
                      Cấu hình phân bổ phòng thi
                    </h3>
                  </div>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 ml-3">
                    Chọn danh sách lớp học phần và các phòng thi trống trước khi xếp chỗ
                  </p>
                </div>

                {/* Trạng thái kiểm tra sức chứa thời gian thực */}
                <div className="flex items-center gap-4 text-type-helper flex-wrap shrink-0">
                  {totalSelectedStudents === 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Vui lòng chọn lớp học phần
                    </span>
                  ) : selectedRoomIds.length === 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Vui lòng chọn phòng thi
                    </span>
                  ) : totalSelectedStudents <= selectedCapacity ? (
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Đủ chỗ: <strong>{totalSelectedStudents} sinh viên</strong> ({selectedCapacity} chỗ ngồi)
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Thiếu chỗ: Cần <strong>{totalSelectedStudents} chỗ</strong>, đã chọn <strong>{selectedCapacity} chỗ</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Board Body: 2 Columns (Phẳng - Flat Divider First) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
                {/* CỘT 1: LỚP HỌC PHẦN */}
                <div className="p-4 sm:p-5 space-y-2 flex flex-col">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span className="text-type-body font-semibold text-slate-900 dark:text-white">
                        Lớp học phần tham gia
                      </span>
                      <span className="text-type-helper text-slate-500 dark:text-slate-400 tabular-nums">
                        ({selectedClassIds.length}/{scheduleClasses.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-type-helper font-medium">
                      <button
                        type="button"
                        onClick={() => setSelectedClassIds(scheduleClasses.map((c) => c.id))}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">/</span>
                      <button
                        type="button"
                        onClick={() => setSelectedClassIds([])}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {scheduleClasses.length === 0 ? (
                    <div className="py-12 text-center text-type-helper text-slate-400">
                      Chưa có lớp học phần nào trong ca thi này
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
                      {scheduleClasses.map((c) => {
                        const isChecked = selectedClassIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer select-none first:pt-1.5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedClassIds([...selectedClassIds, c.id]);
                                  } else {
                                    setSelectedClassIds(selectedClassIds.filter((id) => id !== c.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <p className={`text-type-body-sm truncate ${isChecked ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-normal text-slate-600 dark:text-slate-400'}`}>
                                  {c.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {c.code && (
                                    <IdentifierBadge tone="neutral" size="sm">
                                      {c.code}
                                    </IdentifierBadge>
                                  )}
                                  {c.departmentName && (
                                    <span className="text-type-helper text-slate-400 dark:text-slate-500 truncate">
                                      {c.departmentName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-3">
                              <span className="text-type-helper font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                                {c.studentCount} sinh viên
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CỘT 2: PHÒNG THI KHẢ DỤNG */}
                <div className="p-4 sm:p-5 space-y-2 flex flex-col">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span className="text-type-body font-semibold text-slate-900 dark:text-white">
                        Phòng thi khả dụng
                      </span>
                      <span className="text-type-helper text-slate-500 dark:text-slate-400 tabular-nums">
                        ({selectedRoomIds.length}/{availableCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-type-helper font-medium">
                      <button
                        type="button"
                        onClick={() => setSelectedRoomIds(rooms.filter((r) => r.isAvailable).map((r) => r.id))}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Tất cả khả dụng
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">/</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRoomIds([])}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {rooms.length === 0 ? (
                    <div className="py-12 text-center text-type-helper text-slate-400">
                      Không có phòng thi nào trong hệ thống
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
                      {rooms.map((r) => {
                        const isChecked = selectedRoomIds.includes(r.id);
                        const isAvail = r.isAvailable;
                        const roomTypeName =
                          r.roomType === 'THI_LY_THUYET'
                            ? 'Thi lý thuyết'
                            : r.roomType === 'THI_MAY_TINH'
                            ? 'Thi máy tính'
                            : r.roomType === 'THUC_HANH'
                            ? 'Thực hành'
                            : r.roomType || 'Phòng thi';
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-colors select-none first:pt-1.5 ${
                              !isAvail
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                disabled={!isAvail}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRoomIds([...selectedRoomIds, r.id]);
                                  } else {
                                    setSelectedRoomIds(selectedRoomIds.filter((id) => id !== r.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-type-body-sm truncate ${isChecked ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-normal text-slate-600 dark:text-slate-400'}`}>
                                    {r.roomName || r.roomCode}
                                  </p>
                                  <span className="text-type-helper text-slate-400 dark:text-slate-500">
                                    (Tòa {r.building})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-type-helper">
                                  <span className="text-slate-400 dark:text-slate-500">{roomTypeName}</span>
                                  <span className="text-slate-300 dark:text-slate-700">,</span>
                                  {isAvail ? (
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Trống theo ca</span>
                                  ) : (
                                    <span className="text-rose-600 dark:text-rose-400 font-medium truncate max-w-[160px]" title={r.busyReason || 'Đang bận'}>
                                      Bận: {r.busyReason || 'Trùng lịch'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-3">
                              <span className="text-type-helper font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                                {r.capacity} chỗ
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── View 1: Sơ Đồ Phòng Máy Trực Quan (Live Lab Floor Plan) ── */}
              {viewMode === 'matrix' && (
                <div className="space-y-4">
                  {roomSummaries
                    .filter((rm) => filterRoomCode === 'ALL' || rm.roomCode === filterRoomCode)
                    .map((room) => {
                      const studentsInRoom = filteredDetails.filter((d) => d.roomCode === room.roomCode);
                      const roomObj = rooms.find((r) => r.roomCode === room.roomCode);
                      const capacity = roomObj?.capacity || 15;
                      const percentFilled = Math.min(100, Math.round((studentsInRoom.length / capacity) * 100));

                      // Tính tóm tắt lớp ghép
                      const classMap = new Map<string, number>();
                      studentsInRoom.forEach((st) => {
                        const cName = st.className || 'Khác';
                        classMap.set(cName, (classMap.get(cName) || 0) + 1);
                      });
                      const classBreakdowns = Array.from(classMap.entries());

                      return (
                        <div
                          key={room.roomCode}
                          className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
                        >
                          {/* Header của phòng thi phẳng & sang trọng */}
                          <div className="p-3.5 sm:px-5 sm:py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/40 dark:bg-slate-850/40">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="h-3.5 w-1 rounded-full bg-blue-600 shrink-0" />
                              <h4 className="text-type-body font-semibold text-slate-900 dark:text-white">
                                {room.roomName || `Phòng ${room.roomCode}`}
                              </h4>
                              <span className="text-type-helper text-slate-400 dark:text-slate-500">
                                (Mã: {room.roomCode}{room.building ? `, Tòa ${room.building}` : ''})
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span className="text-type-helper text-slate-500 dark:text-slate-400">
                                Ghép {classBreakdowns.length} lớp học phần
                              </span>
                            </div>

                            {/* Thống kê số chỗ ngồi phẳng */}
                            <div className="flex items-center gap-1.5 text-type-helper text-slate-600 dark:text-slate-300 font-medium tabular-nums shrink-0">
                              <span>Đã xếp <strong>{studentsInRoom.length}/{capacity}</strong> chỗ ({percentFilled}%)</span>
                            </div>
                          </div>

                          {/* Sơ đồ ma trận chỗ ngồi (Live Seat Matrix) */}
                          <div className="p-4 sm:p-5">
                            {/* Dải Bục Giảng nét đứt trang nhã */}
                            <div className="relative flex py-2 items-center justify-center mb-3">
                              <div className="flex-grow border-t border-dashed border-slate-200 dark:border-slate-800" />
                              <span className="flex-shrink mx-3 text-type-helper font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5 select-none">
                                <Monitor className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                Bục giảng &amp; Hướng nhìn cán bộ coi thi
                              </span>
                              <div className="flex-grow border-t border-dashed border-slate-200 dark:border-slate-800" />
                            </div>

                            {/* Lưới Ghế Ngồi Phẳng & Tinh Gọn */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                              {Array.from({ length: capacity }).map((_, idx) => {
                                const seatNum = idx + 1;
                                const student = studentsInRoom.find((s) => s.seatNumber === seatNum);

                                return (
                                  <div
                                    key={seatNum}
                                    onClick={() => student && setDrawerStudentDetail(student)}
                                    className={`rounded-xl border p-2.5 transition text-left flex flex-col justify-between min-h-[72px] ${
                                      student
                                        ? 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-blue-500/80 hover:bg-slate-50/50 dark:hover:bg-slate-850 cursor-pointer select-none'
                                        : 'bg-slate-50/30 dark:bg-slate-850/20 border-dashed border-slate-200/60 dark:border-slate-800/60 select-none'
                                    }`}
                                  >
                                    {/* Hàng 1: Số ghế + Lớp học phần */}
                                    <div className="flex items-center justify-between gap-1.5 text-type-helper min-w-0">
                                      <span
                                        className={`text-type-helper font-semibold tabular-nums shrink-0 ${
                                          student
                                            ? 'text-slate-600 dark:text-slate-300'
                                            : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                      >
                                        #{seatNum}
                                      </span>
                                      {student && (
                                        <span
                                          className="text-type-helper text-slate-400 dark:text-slate-500 font-normal truncate min-w-0 flex-1 text-right"
                                          title={student.className}
                                        >
                                          {student.className}
                                        </span>
                                      )}
                                    </div>

                                    {/* Hàng 2: Họ tên sinh viên */}
                                    {student ? (
                                      <p
                                        className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight py-0.5"
                                        title={student.fullName}
                                      >
                                        {student.fullName}
                                      </p>
                                    ) : (
                                      <div className="text-center py-1 text-type-helper text-slate-300 dark:text-slate-600">
                                        Trống
                                      </div>
                                    )}

                                    {/* Hàng 3: MSSV + SBD (Phẳng, không hộp màu) */}
                                    {student && (
                                      <div className="flex items-center justify-between text-type-helper pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-500 dark:text-slate-400 font-normal tabular-nums">
                                          {student.studentCode}
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                          {student.examNumber}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ── View 2: Bảng Danh Sách Sinh Viên ── */}
              {viewMode === 'table' && (
                <div className="ui-table-wrap overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-type-body-sm font-medium tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">SBD</th>
                        <th className="px-4 py-3 whitespace-nowrap">Mã SV</th>
                        <th className="px-4 py-3">Họ và Tên</th>
                        <th className="px-4 py-3 whitespace-nowrap">Lớp</th>
                        <th className="px-4 py-3 whitespace-nowrap">Phòng Thi</th>
                        <th className="px-4 py-3 whitespace-nowrap">Số Ghế</th>
                        <th className="px-4 py-3">Khoa / Viện</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDetails.map((st) => (
                        <tr
                          key={st.id}
                          onClick={() => setDrawerStudentDetail(st)}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {st.examNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {st.studentCode}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {st.fullName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {st.className}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {st.roomName || st.roomCode}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            #{st.seatNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
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
      </main>

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

      <ProfileDrawer
        isOpen={Boolean(drawerStudentDetail)}
        onClose={() => setDrawerStudentDetail(null)}
        title={drawerStudentDetail?.fullName || 'Chi tiết vị trí thi'}
        subtitle={drawerStudentDetail?.studentCode ? `MSSV: ${drawerStudentDetail.studentCode}` : ''}
        avatarText={drawerStudentDetail?.fullName?.trim().split(' ').pop()?.slice(0, 2).toUpperCase() || 'SV'}
        details={[
          { label: 'Họ và tên thí sinh', value: drawerStudentDetail?.fullName, icon: User },
          { label: 'Mã số sinh viên', value: drawerStudentDetail?.studentCode, icon: User },
          { label: 'Số báo danh (SBD)', value: drawerStudentDetail?.examNumber, icon: ShieldCheck },
          { label: 'Vị trí chỗ ngồi', value: `Ghế #${drawerStudentDetail?.seatNumber || '--'}`, icon: DoorOpen },
          { label: 'Phòng thi', value: `${drawerStudentDetail?.roomName || drawerStudentDetail?.roomCode || '---'} ${drawerStudentDetail?.building ? `(${drawerStudentDetail.building})` : ''}`, icon: Building2 },
          { label: 'Lớp sinh hoạt', value: drawerStudentDetail?.className || '---', icon: GraduationCap },
          { label: 'Khoa / Viện', value: drawerStudentDetail?.departmentName || '---', icon: Building2 },
        ]}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
