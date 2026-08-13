'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { TabBar } from '../../components/ui/TabBar';
import { Button } from '../../components/ui/Button';
import {
 Layers,
 Sparkles,
 CheckCircle,
 DoorOpen,
 Zap,
 Users,
 CheckCircle2,
 AlertCircle,
 History,
 Trash2,
 Printer,
 Grid,
 List,
 RotateCcw,
 Shuffle,
} from 'lucide-react';
import { ExamSchedule } from '../../types';

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

export default function ExamArrangementPage() {
 usePageTitle('Xếp phòng thi tự động');
 const router = useRouter();
 const [currentUser, setCurrentUser] = useState<any>(null);
 const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
 const [rooms, setRooms] = useState<RoomAvailability[]>([]);

 const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
 const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

 const [arranging, setArranging] = useState(false);
 const [result, setResult] = useState<ArrangementResult | null>(null);

 const [activeTab, setActiveTab] = useState<'arrange' | 'history'>('arrange');
 const [historyLogs, setHistoryLogs] = useState<any[]>([]);
 const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');
 const [filterRoomCode, setFilterRoomCode] = useState<string>('ALL');
 const [showSchedulePicker, setShowSchedulePicker] = useState(false);

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
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải trạng thái phòng thi', type: 'error' });
 }
 }, []);

 const fetchExistingResults = useCallback(async (scheduleId: string, customScheduleList?: any[]) => {
 if (!scheduleId) { setResult(null); return; }
 try {
 const res = await api.get(`/exam-arrangement/result?examScheduleId=${scheduleId}`);
 if (res.data && res.data.length > 0) {
 const details: any[] = [];
 let totalCount = 0;
 const currentList = customScheduleList || schedules;
 const currentSched = currentList.find((s: any) => s.id.toString() === scheduleId);
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
 message: 'Dữ liệu xếp phòng hiện tại từ hệ thống',
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
 } else {
 setResult(null);
 }
 } else {
 setResult(null);
 }
 } catch {
 setResult(null);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const fetchSchedules = useCallback(async (periodId: string) => {
 try {
 const url = periodId ? `/exam-schedules?examPeriodId=${periodId}` : '/exam-schedules';
 const res = await api.get(url);

 // Sắp xếp ca thi mới nhất lên đầu tiên (Ngày thi mới nhất hoặc ID tạo mới nhất giảm dần)
 const sortedSchedules = [...(res.data || [])].sort((a: any, b: any) => {
 const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
 const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
 if (dateB !== dateA) return dateB - dateA;
 return b.id - a.id;
 });

 setSchedules(sortedSchedules);
 if (sortedSchedules.length > 0) {
 // Tự động ưu tiên gợi ý ca thi đã có kết quả xếp phòng, nếu chưa có thì lấy ca mới nhất
 const targetSched =
 sortedSchedules.find((s: any) => s.examScheduleRooms && s.examScheduleRooms.length > 0) ||
 sortedSchedules.find((s: any) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED') ||
 sortedSchedules[0];

 const targetSchedId = targetSched.id.toString();
 setSelectedScheduleId(targetSchedId);
 await fetchRoomAvailability(targetSchedId);
 await fetchExistingResults(targetSchedId, sortedSchedules);
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
 const res = await api.get('/exam-arrangement/history');
 setHistoryLogs(res.data);
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải nhật ký xếp phòng', type: 'error' });
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
 if (!u) { router.push('/login'); return; }
 setCurrentUser(u);
 void fetchData();
 void fetchHistory();
 }, [fetchData, fetchHistory, router]);

 const handleScheduleChange = async (scheduleId: string) => {
 setSelectedScheduleId(scheduleId);
 setResult(null);
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
 setToast({ message: `Đã chọn ${availableIds.length} phòng trống.`, type: 'success' });
 };

 const runPreview = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedScheduleId) { setToast({ message: 'Vui lòng chọn ca thi', type: 'error' }); return; }
 if (selectedRoomIds.length === 0) { setToast({ message: 'Vui lòng chọn ít nhất 1 phòng thi trống', type: 'error' }); return; }
 setArranging(true);
 setResult(null);
 try {
 const res = await api.post<ArrangementResult>('/exam-arrangement/preview', {
 examScheduleId: Number(selectedScheduleId),
 roomIds: selectedRoomIds,
 });
 setResult(res.data);
 setToast({ message: 'Đã tạo phương án xem trước. Bấm "Xác nhận lưu" để ghi dữ liệu.', type: 'success' });
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

 // Group by roomCode
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
 message: 'Đã trộn ghế ngẫu nhiên và đánh lại SBD.',
 type: 'success',
 });
 };

 const handlePrintAttendanceSheet = () => {
 if (!result || !result.details?.length) return;

 const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
 const subjectName = result.summary.subjectName || (currentSched?.subject as any)?.subjectName || 'Môn thi';
 const subjectCode = result.summary.subjectCode || (currentSched?.subject as any)?.subjectCode || '';
 const examDate = result.summary.examDate || ((currentSched as any)?.examDate ? new Date((currentSched as any)?.examDate).toLocaleDateString('vi-VN') : '---');
 const timeSlot = result.summary.timeSlot || `${currentSched?.startTime || ''} – ${currentSched?.endTime || ''}`;

 const targetRoomCode = filterRoomCode === 'ALL' ? (roomSummaries[0]?.roomCode || '') : filterRoomCode;
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
 th { background: #f2f2f2; text-transform: uppercase; font-size: 12px; }
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

 const handleResetArrangement = () => {
 const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
 setConfirmModal({
 isOpen: true,
 title: 'Hủy & Reset Xếp phòng thi',
 message: `Bạn có chắc chắn muốn HỦY và XÓA TOÀN BỘ dữ liệu xếp phòng cho ca thi ${currentSched?.subject?.subjectName || ''}? Thao tác này không thể hoàn tác.`,
 type: 'danger',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.delete(`/exam-arrangement/reset/${selectedScheduleId}`);
 setToast({ message: 'Đã hủy xếp phòng cho ca thi thành công!', type: 'success' });
 setResult(null);
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
 const current = summaries.get(key) || { roomCode: item.roomCode, roomName: item.roomName, building: item.building, assigned: 0 };
 current.assigned += 1;
 summaries.set(key, current);
 });
 return Array.from(summaries.values());
 }, [result]);

 const selectedCapacity = useMemo(
 () => rooms.filter((room) => selectedRoomIds.includes(room.id)).reduce((sum, room) => sum + room.capacity, 0),
 [rooms, selectedRoomIds],
 );

 const availableCount = useMemo(() => rooms.filter((r) => r.isAvailable).length, [rooms]);

 const filteredDetails = useMemo(() => {
 if (!result) return [];
 if (filterRoomCode === 'ALL') return result.details;
 return result.details.filter((d) => d.roomCode === filterRoomCode);
 }, [filterRoomCode, result]);

 const printDoorList = () => {
 if (!result || !result.details.length) return;
 const printable = window.open('', '_blank', 'width=900,height=720');
 if (!printable) { setToast({ message: 'Trình duyệt đang chặn cửa sổ in.', type: 'error' }); return; }
 const currentSched = schedules.find((s) => s.id.toString() === selectedScheduleId);
 const filterDetails = filterRoomCode === 'ALL' ? result.details : result.details.filter((d) => d.roomCode === filterRoomCode);
 const roomGroups = new Map<string, typeof filterDetails>();
 filterDetails.forEach((d) => {
 const group = roomGroups.get(d.roomCode) || [];
 group.push(d);
 roomGroups.set(d.roomCode, group);
 });
 const pages = Array.from(roomGroups.entries()).map(([roomCode, students]) => {
 const roomInfo = rooms.find((r) => r.roomCode === roomCode);
 const rows = students.map((st, i) => `<tr><td style="text-align:center;">${i + 1}</td><td style="text-align:center;font-weight:bold;">SBN-${String(i + 1).padStart(3, '0')}</td><td style="font-weight:bold;color:#1e3a8a;">${escapeHtml(st.studentCode)}</td><td style="font-weight:bold;">${escapeHtml(st.fullName)}</td><td>${escapeHtml(st.className)}</td><td style="text-align:center;font-weight:bold;color:#1d4ed8;">Ghế #${st.seatNumber}</td></tr>`).join('');
 return `<div style="page-break-after:always;padding:24px;margin-bottom:30px;border:1px solid #cbd5e1;border-radius:12px;"><div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;"><h2 style="margin:0;font-size:18px;text-transform:uppercase;color:#0f172a;">HỘI ĐỒNG KHẢO THÍ SV - DANH SÁCH THÍ SINH TẠI PHÒNG THI</h2><h1 style="margin:4px 0 0;font-size:24px;color:#2563eb;font-weight:900;">PHÒNG THI: ${escapeHtml(roomInfo?.roomName || roomCode)} (${escapeHtml(roomInfo?.building || 'Khu A')})</h1><p style="margin:4px 0 0;font-size:13px;color:#475569;">Môn thi: <strong>${escapeHtml(currentSched?.subject?.subjectName)}</strong> (${escapeHtml(currentSched?.subject?.subjectCode)}) | Ngày: ${new Date(currentSched?.examDate || Date.now()).toLocaleDateString('vi-VN')} | Giờ: ${currentSched?.startTime}-${currentSched?.endTime}</p></div><table style="width:100%;border-collapse:collapse;font-size:12px;" border="1" cellpadding="6"><thead><tr style="background:#f1f5f9;color:#0f172a;text-align:left;"><th style="width:40px;text-align:center;">STT</th><th style="width:70px;text-align:center;">MÃ SBN</th><th style="width:100px;">MÃ SV</th><th>HỌ VÀ TÊN</th><th style="width:90px;">LỚP SH</th><th style="width:70px;text-align:center;">VỊ TRÍ</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:20px;display:flex;justify-content:space-between;font-size:12px;"><div>Tổng số thí sinh: <strong>${students.length}</strong> / ${roomInfo?.capacity ?? 0} chỗ</div><div>Cán bộ coi thi ký tên: ....................</div></div></div>`;
 }).join('');
 printable.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Danh sách dán cửa</title><style>body{font-family:'Times New Roman',Times,serif;margin:20px;color:#0f172a}@media print{body{margin:0}}</style></head><body>${pages}<script>window.onload=()=>window.print();</script></body></html>`);
 printable.document.close();
 };

 return (
 <>
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
 {/* Header */}
 <div className="space-y-1">
 <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 tracking-tight">
 Xếp phòng thi tự động
 </h1>
 <p className="text-[15px] font-normal leading-[22px] text-slate-500">
 Tự động phân bổ sinh viên vào phòng máy tính, kiểm tra phòng trống thời gian thực & lưu lịch sử
 </p>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
 {[
 {
 title: 'Ca thi đang chọn',
 value: selectedScheduleId ? 'Đã chọn' : 'Chưa chọn',
 subtext: `${schedules.length} ca thi trong kỳ`,
 icon: Zap,
 iconBg: 'bg-blue-50 text-primary-600 border-blue-100',
 },
 {
 title: 'Phòng thi khả dụng',
 value: `${availableCount}/${rooms.length}`,
 subtext: 'Trạng thái rảnh trong khung giờ',
 icon: DoorOpen,
 iconBg: 'bg-blue-50 text-primary-600 border-blue-100',
 },
 {
 title: 'Sức chứa đã chọn',
 value: `${selectedCapacity} chỗ`,
 subtext: `${selectedRoomIds.length} phòng đang được chọn`,
 icon: Users,
 iconBg: 'bg-blue-50 text-primary-600 border-blue-100',
 },
 {
 title: 'Kết quả phân bổ',
 value: result ? `${result.summary.totalStudents} SV` : 'Chưa xếp',
 subtext: result ? `${roomSummaries.length} phòng được xếp` : 'Bấm kích hoạt để bắt đầu',
 icon: CheckCircle2,
 iconBg: 'bg-blue-50 text-primary-600 border-blue-100',
 },
 ].map((item) => {
 const IconComponent = item.icon;
 return (
 <div
 key={item.title}
 className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1">
 <span className="text-[13px] font-semibold text-slate-500 tracking-wider">{item.title}</span>
 <p className="text-[32px] font-bold text-slate-900 leading-[38px]">{item.value}</p>
 </div>
 <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
 <IconComponent className="h-5 w-5" />
 </div>
 </div>
 <span className="text-[13px] font-normal text-slate-500 mt-2">{item.subtext}</span>
 </div>
 );
 })}
 </div>

 {/* Tab Switcher Bar */}
 <div className="border-b border-slate-200/80">
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
 /* Main Arrangement Form & Matrix Workspace */
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
 {/* Left Column: Parameter Selection & Room Availability */}
 <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-5 lg:sticky lg:top-5 self-start">
 <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-400">
 THAM SỐ THUẬT TOÁN
 </h3>

 <form onSubmit={runPreview} className="space-y-4">
 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1.5">Ca thi Cần Xếp phòng</label>

 {/* Custom popup trigger */}
 <button
 type="button"
 onClick={() => setShowSchedulePicker(true)}
 disabled={schedules.length === 0}
 className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs font-semibold text-left text-slate-800 hover:bg-white hover:border-blue-400 transition cursor-pointer disabled:opacity-60 shadow-2xs"
 >
 <span className={selectedScheduleId ? 'text-slate-800 truncate font-semibold' : 'text-slate-400 font-medium'}>
 {selectedScheduleId
 ? (() => { const s = schedules.find((x) => x.id.toString() === selectedScheduleId); return s ? `[${s.subject?.subjectCode}] ${s.subject?.subjectName} \u00b7 ${s.startTime}\u2013${s.endTime}` : '-- Chọn ca thi --'; })()
 : schedules.length === 0 ? '(Chưa có ca thi nào)' : '-- Chọn ca thi --'}
 </span>
 <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </button>

 {/* Modal popup */}
 {showSchedulePicker && (
 <>
 <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowSchedulePicker(false)} />
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
 <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">

 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 bg-primary-600 text-white">
 <div>
 <p className="text-lg font-semibold text-white tracking-tight">Chọn Ca thi</p>
 <p className="text-xs font-semibold text-blue-100 mt-0.5">
 {schedules.filter((s: any) => !s.examScheduleRooms?.length).length} ca chưa xếp
 · {schedules.filter((s: any) => s.examScheduleRooms?.length).length} ca đã xếp phòng
 </p>
 </div>
 <button type="button" onClick={() => setShowSchedulePicker(false)}
 className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-100 hover:text-white hover:bg-blue-700/80 transition cursor-pointer">
 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>

 {/* Body — 2 columns */}
 {(() => {
 const isScheduleExpired = (s: any) => {
 if (['COMPLETED', 'CANCELLED', 'LOCKED'].includes(s?.status)) return true;
 if (!s?.examDate) return false;
 try {
 const scheduleEnd = new Date(s.examDate);
 if (s.endTime) {
 const [h, m] = s.endTime.split(':').map(Number);
 scheduleEnd.setHours(h || 23, m || 59, 0, 0);
 } else {
 scheduleEnd.setHours(23, 59, 59, 999);
 }
 return scheduleEnd.getTime() < Date.now();
 } catch {
 return false;
 }
 };

 const pendingArrangement = schedules.filter((s: any) => !s.examScheduleRooms?.length && !isScheduleExpired(s));
 const createdArrangement = schedules.filter((s: any) => s.examScheduleRooms?.length > 0);
 const expiredArrangement = schedules.filter((s: any) => !s.examScheduleRooms?.length && isScheduleExpired(s));

 return (
 <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
 {/* LEFT: Chưa xếp phòng */}
 <div>
 <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10">
 <span className="text-[12px] font-semibold text-slate-500 tracking-wider">
 Chưa xếp phòng ({pendingArrangement.length})
 </span>
 </div>
 {pendingArrangement.length === 0 ? (
 <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Tất cả đã xếp phòng</p>
 ) : (
 pendingArrangement.map((s: any) => {
 const isActive = selectedScheduleId === s.id.toString();
 return (
 <button
 key={s.id}
 type="button"
 onClick={() => { void handleScheduleChange(s.id.toString()); setShowSchedulePicker(false); }}
 className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''
 }`}
 >
 <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
 {s.mode === 'MOCK' ? '[THI THỬ] ' : '[CHÍNH THỨC] '}
 {s.subject?.subjectName}
 </p>
 <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
 {s.subject?.subjectCode} · {s.startTime}–{s.endTime}
 {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
 </p>
 </button>
 );
 })
 )}

 {/* Section Ca thi Đã quá hạn */}
 {expiredArrangement.length > 0 && (
 <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 pt-2">
 <div className="px-4 py-1.5 bg-slate-200/60 dark:bg-slate-700/60">
 <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-300 tracking-wider">
 📁 Đã quá hạn / Đã kết thúc ({expiredArrangement.length})
 </span>
 </div>
 {expiredArrangement.map((s: any) => (
 <div
 key={s.id}
 className="w-full text-left px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 cursor-not-allowed select-none"
 >
 <div className="flex items-center justify-between gap-1">
 <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
 {s.subject?.subjectName}
 </p>
 <span className="shrink-0 rounded-md bg-amber-100 text-amber-800 text-[12px] font-semibold px-1.5 py-0.5">
 Đã quá hạn
 </span>
 </div>
 <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
 {s.subject?.subjectCode} · {s.startTime}–{s.endTime}
 {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* RIGHT: Đã xếp phòng */}
 <div>
 <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10">
 <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-300 tracking-wider">
 Đã xếp phòng ({createdArrangement.length})
 </span>
 </div>
 {createdArrangement.length === 0 ? (
 <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Chưa có</p>
 ) : (
 createdArrangement.map((s: any) => {
 const isActive = selectedScheduleId === s.id.toString();
 const roomCount = s.examScheduleRooms?.length || 0;
 return (
 <button
 key={s.id}
 type="button"
 onClick={() => { void handleScheduleChange(s.id.toString()); setShowSchedulePicker(false); }}
 className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''
 }`}
 >
 <div className="flex items-center gap-2">
 <p className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
 {s.subject?.subjectName}
 </p>
 <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[12px] font-semibold px-1.5 py-0.5">
 {roomCount} phòng
 </span>
 </div>
 <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
 {s.subject?.subjectCode} · {s.startTime}–{s.endTime}
 {s.examDate ? ` · ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
 </p>
 </button>
 );
 })
 )}
 </div>
 </div>
 );
 })()}

 {/* Footer */}
 <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
 <Button type="button" variant="secondary" size="md" onClick={() => setShowSchedulePicker(false)}>
 Đóng
 </Button>
 </div>
 </div>
 </div>
 </>
 )}

 {(() => {
 const current = schedules.find((s) => s.id.toString() === selectedScheduleId);
 if ((current as any)?.mode === 'MOCK') {
 return (
 <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium space-y-1 shadow-2xs">
 <p className="font-semibold text-blue-950">Ca Thi Thử (MOCK)</p>
 <p className="leading-relaxed text-blue-800">
 Ca thi này áp dụng hình thức thi thử trực tuyến tự do. Sinh viên có thể tham gia thi trực tuyến mà không bắt buộc phải xếp phòng thi máy hay chia số báo danh.
 </p>
 </div>
 );
 }
 return null;
 })()}

 {schedules.length === 0 && (
 <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 shadow-2xs">
 <p className="font-semibold flex items-center gap-1.5 text-amber-800">
 <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
 Kỳ thi này hiện chưa có ca thi nào
 </p>
 <p className="mt-1 text-[12px] text-amber-700 leading-relaxed">
 Vui lòng chọn <strong>&quot;Tất cả kỳ thi&quot;</strong> hoặc sang trang quản lý lịch thi để lập ca thi mới.
 </p>
 <button
 type="button"
 onClick={() => router.push('/exam-schedules?action=create')}
 className="mt-2 text-[12px] font-semibold text-blue-700 hover:text-blue-900 underline"
 >
 + Chuyển đến quản lý lịch thi để tạo ca thi
 </button>
 </div>
 )}
 </div>

 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="block text-[15px] font-medium text-slate-500">Phòng thi Khả dụng (Thời gian thực)</label>
 <button type="button" onClick={selectAvailableOnly} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
 Chọn phòng trống ({availableCount})
 </button>
 </div>

 <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
 {rooms.map((r: any) => {
 const isSelected = selectedRoomIds.includes(r.id);
 return (
 <div
 key={r.id}
 onClick={() => {
 if (r.isAvailable) handleToggleRoom(r);
 }}
 className={`flex items-center justify-between p-3 rounded-xl border transition text-xs select-none ${
 !r.isAvailable
 ? 'border-slate-200/60 bg-slate-50 text-slate-400 cursor-not-allowed opacity-75'
 : isSelected
 ? 'border-blue-500 bg-blue-50/90 text-blue-950 font-semibold shadow-2xs cursor-pointer'
 : 'border-slate-200/90 bg-white hover:border-slate-300 text-slate-800 font-semibold cursor-pointer'
 }`}
 title={!r.isAvailable ? (r.busyReason || 'Phòng không khả dụng') : undefined}
 >
 <div className="flex items-center gap-2 min-w-0">
 <DoorOpen className={`h-4 w-4 shrink-0 ${!r.isAvailable ? 'text-slate-700' : isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
 <span className="truncate font-semibold">{r.roomName || r.roomCode}</span>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-xs font-semibold text-slate-900">{r.capacity} chỗ</span>
 <span className={`text-xs font-semibold ${
 !r.isAvailable
 ? 'text-rose-600'
 : r.isAssignedToCurrent
 ? 'text-blue-600'
 : 'text-emerald-600'
 }`}>
 {!r.isAvailable ? (r.busyReason || 'BẬN') : r.isAssignedToCurrent ? 'ĐÃ GÁN' : 'TRỐNG'}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
 <Button
 type="submit"
 variant="primary"
 size="md"
 disabled={arranging || selectedRoomIds.length === 0}
 isLoading={arranging}
 className="flex-1 w-full"
 >
 Xem sắp xếp
 </Button>

 {result && (
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={handleResetArrangement}
 className="flex-1 w-full"
 >
 Hủy phương án
 </Button>
 )}
 </div>
 </form>
 </div>

 {/* Right Column: Results & Interactive Matrix View */}
 <div className="lg:col-span-2 space-y-5">
 <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs min-h-[500px] flex flex-col justify-between">
 <div>
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
 <h3 className="text-sm font-semibold tracking-wider text-slate-800 flex items-center gap-2">
 <CheckCircle className="h-4 w-4 text-blue-600" /> Kết quả & Ma trận Chỗ ngồi
 </h3>

 {result && (
 <div className="flex flex-wrap items-center gap-2">
 {/* View Switcher */}
 <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
 <button
 type="button"
 onClick={() => setViewMode('matrix')}
 className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
 >
 <Grid className="h-3.5 w-3.5" /> Sơ đồ chỗ ngồi
 </button>
 <button
 type="button"
 onClick={() => setViewMode('table')}
 className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
 >
 <List className="h-3.5 w-3.5" /> Danh sách bảng
 </button>
 </div>

 {/* Print Door List */}
 <button
 type="button"
 onClick={printDoorList}
 className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
 >
 <Printer className="h-3.5 w-3.5 text-blue-600" /> In dán cửa (A4)
 </button>
 </div>
 )}
 </div>

 {!result ? (
 <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
 <Sparkles className="h-12 w-12 text-slate-700 mb-3" />
 <p className="text-sm font-medium">Chọn Ca thi và các phòng trống bên trái, bấm &quot;Xem trước phương án&quot; để tạo ma trận chỗ ngồi tự động</p>
 </div>
 ) : (
 <div className="space-y-5">
 {/* Summary Banner */}
 <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs font-semibold">
 <div>
 <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
 <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {result.message}
 </p>
 <p className="mt-1 text-slate-600 font-medium">
 Môn thi: <strong className="text-slate-800">{result.summary.subjectName}</strong> ({result.summary.subjectCode}) · Ngày: {result.summary.examDate} ({result.summary.timeSlot})
 </p>
 <p className="mt-0.5 text-slate-600">
 Đã xếp: <strong className="text-slate-900">{result.summary.totalStudents} thí sinh</strong> vào <strong className="text-slate-900">{roomSummaries.length} phòng thi</strong>.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={handleShuffleSeats}
 leftIcon={<Shuffle className="h-3.5 w-3.5" />}
 title="Trộn ngẫu nhiên thí sinh các lớp ngồi xen kẽ chống nhìn bài"
 >
 Trộn ghế ngẫu nhiên
 </Button>

 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={handlePrintAttendanceSheet}
 leftIcon={<Printer className="h-3.5 w-3.5" />}
 title="In danh sách thí sinh dự thi và ký tên A4 theo chuẩn Bộ GD&ĐT"
 >
 In Danh sách ký tên A4
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
 message: 'Kết quả sẽ được ghi chính thức vào cơ sở dữ liệu. Bạn có chắc chắn?',
 type: 'warning',
 onConfirm: runSaveArrangement,
 })
 }
 leftIcon={<CheckCircle className="h-4 w-4" />}
 >
 Xác nhận lưu phương án
 </Button>
 )}
 </div>
 </div>

 {/* Filter by Room */}
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-slate-500">Lọc theo Phòng:</span>
 <select
 value={filterRoomCode}
 onChange={(e) => setFilterRoomCode(e.target.value)}
 className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[15px] font-medium text-slate-800 focus:bg-white cursor-pointer"
 >
 <option value="ALL">Tất cả các phòng ({roomSummaries.length} phòng)</option>
 {roomSummaries.map((rm) => (
 <option key={rm.roomCode} value={rm.roomCode}>
 {rm.roomName || rm.roomCode} ({rm.assigned} SV)
 </option>
 ))}
 </select>
 </div>
 <span className="text-xs font-semibold text-slate-500">Hiển thị {filteredDetails.length} thí sinh</span>
 </div>

 {/* View Mode 1: Seat Grid Matrix */}
 {viewMode === 'matrix' && (
 <div className="space-y-6 max-h-[580px] overflow-y-auto pr-1.5 no-scrollbar">
 {roomSummaries
 .filter((rm) => filterRoomCode === 'ALL' || rm.roomCode === filterRoomCode)
 .map((room) => {
 const studentsInRoom = result.details.filter((d) => d.roomCode === room.roomCode);
 const roomObj = rooms.find((r) => r.roomCode === room.roomCode);
 return (
 <div key={room.roomCode} className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
 <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
 <div className="flex items-center gap-2">
 <DoorOpen className="h-4 w-4 text-blue-600" />
 <h4 className="font-semibold text-slate-900 text-sm">
 PHÒNG {room.roomName || room.roomCode} ({room.building})
 </h4>
 </div>
 <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
 {studentsInRoom.length} / {roomObj?.capacity || 40} Ghế đã xếp
 </span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 pt-1">
 {studentsInRoom.map((st, sIdx) => (
 <div
 key={st.id ? `st-${st.id}-${sIdx}` : `st-${st.studentCode}-${st.seatNumber}-${sIdx}`}
 className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs hover:border-blue-300 transition text-left space-y-1"
 >
 <div className="flex items-center justify-between text-[12px]">
 <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
 Ghế #{st.seatNumber}
 </span>
 <span className="font-medium text-slate-400">{st.className}</span>
 </div>
 <p className="font-semibold text-slate-900 text-xs truncate" title={st.fullName}>{st.fullName}</p>
 <p className="text-[12px] font-semibold text-slate-500 tabular-nums">{st.studentCode}</p>
 {(st.requirementLabel || st.departmentName) && (
 <div className="pt-0.5">
 <p className="font-semibold text-slate-800 text-xs truncate" title={st.requirementLabel || st.departmentName}>
 {(st.requirementLabel || st.departmentName || '').split(/[•\.\·]/)[0].trim()}
 </p>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* View Mode 2: Detailed Table */}
 {viewMode === 'table' && (
  <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200 max-h-[580px] overflow-y-auto">
  <table className="ui-table w-full text-left text-[15px] text-slate-700 border-collapse">
 <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
 <tr>
 <th className="p-3.5">Phòng</th>
 <th className="p-3.5 text-center">Vị trí</th>
 <th className="p-3.5">Mã SV</th>
 <th className="p-3.5">Họ và tên</th>
 <th className="p-3.5">Lớp SH</th>
 <th className="p-3.5">Khung Đào tạo Ngành</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {filteredDetails.map((st, dIdx) => (
 <tr key={st.id ? `tbl-${st.id}-${dIdx}` : `tbl-${st.studentCode}-${st.seatNumber}-${dIdx}`} className="hover:bg-slate-50/60 transition">
 <td className="p-3.5 font-medium text-slate-900">{st.roomName || st.roomCode}</td>
 <td className="p-3.5 text-center font-medium text-primary-600">Ghế #{st.seatNumber}</td>
 <td className="p-3.5">
 <span className=" tabular-nums font-medium text-[15px] leading-[22px] text-slate-900">
 {st.studentCode}
 </span>
 </td>
 <td className="p-3.5 font-medium text-slate-900">{st.fullName}</td>
 <td className="p-3.5 font-normal text-slate-700">
 {st.className && st.className !== '---' ? st.className : 'CNTT-K65'}
 </td>
 <td className="p-3.5 font-normal text-slate-700 whitespace-nowrap">
 {(st.requirementLabel || st.departmentName || 'Khoa Công nghệ thông tin').split(/[•\.\·]/)[0].trim()}
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
 </div>
 </div>
 ) : (
 /* Tab 2: Arrangement Audit Logs & History */
 <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div>
 <h3 className="text-[20px] font-semibold text-slate-900">
 Nhật ký thao tác & Lịch sử Xếp phòng thi
 </h3>
 <p className="text-[15px] text-slate-500 font-normal mt-0.5">
 Ghi lại toàn bộ lịch sử tạo phương án, lưu vết và hủy xếp phòng thi
 </p>
 </div>
 <button
 type="button"
 onClick={fetchHistory}
 className="text-[14px] font-medium text-primary-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
 >
 Tải lại Nhật ký
 </button>
 </div>

  <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200/80">
  <table className="ui-table w-full text-left text-[15px] text-slate-700 border-collapse">
 <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
 <tr>
 <th className="p-3.5">Thời gian</th>
 <th className="p-3.5">Người thực hiện</th>
 <th className="p-3.5">Hành động</th>
 <th className="p-3.5">Mô tả chi tiết</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {!historyLogs.length ? (
 <tr>
 <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Chưa có lịch sử thao tác xếp phòng.</td>
 </tr>
 ) : (
 historyLogs.map((log: any, lIdx: number) => {
  const actInfo = (() => {
  const act = log.action || '';
  if (['ARRANGE', 'AUTO_ARRANGE'].includes(act)) return { label: 'Xếp phòng', cls: 'text-emerald-600 font-medium' };
  if (['RESET_ARRANGEMENT', 'RESET'].includes(act)) return { label: 'Hủy xếp phòng', cls: 'text-rose-600 font-medium' };
  if (['DELETE'].includes(act)) return { label: 'Xóa lịch', cls: 'text-rose-600 font-medium' };
  if (['CREATE'].includes(act)) return { label: 'Tạo lịch', cls: 'text-blue-600 font-medium' };
  if (['UPDATE'].includes(act)) return { label: 'Cập nhật', cls: 'text-blue-600 font-medium' };
  if (['REOPEN_ENTRY'].includes(act)) return { label: 'Mở lại thi', cls: 'text-blue-600 font-medium' };
  if (['PUBLISH'].includes(act)) return { label: 'Công bố', cls: 'text-emerald-600 font-medium' };
  if (['LOCK'].includes(act)) return { label: 'Khóa ca thi', cls: 'text-amber-600 font-medium' };
  if (['EXPORT'].includes(act)) return { label: 'Xuất dữ liệu', cls: 'text-slate-600 font-medium' };

  const formatted = act.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
  return { label: formatted, cls: 'text-slate-600 font-medium' };
  })();

 const roleLabel = log.actor?.role === 'ADMIN' ? 'Quản trị viên' : log.actor?.role === 'TEACHER' ? 'Giảng viên' : log.actor?.role === 'STUDENT' ? 'Sinh viên' : (log.actor?.role || 'Quản trị viên');
 const username = log.actor?.username || log.actor?.fullName || 'admin';

 return (
 <tr key={log.id ? `log-${log.id}-${lIdx}` : `log-${lIdx}`} className="hover:bg-blue-50/40 transition">
 <td className="p-3.5 font-medium text-slate-500 whitespace-nowrap">
 {new Date(log.createdAt).toLocaleString('vi-VN')}
 </td>
 <td className="p-3.5 font-medium text-slate-800 whitespace-nowrap">
 {username} <span className="text-slate-400 font-medium text-[15px] leading-[22px]">({roleLabel})</span>
 </td>
 <td className="p-3.5 whitespace-nowrap">
  <span className={`inline-flex items-center gap-1.5 text-[15px] leading-[22px] font-medium ${actInfo.cls}`}>
  <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
  {actInfo.label}
  </span>
 </td>
 <td className="p-3.5 text-slate-700 font-medium leading-relaxed">{log.description}</td>
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

 {/* Confirm Modal */}
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
