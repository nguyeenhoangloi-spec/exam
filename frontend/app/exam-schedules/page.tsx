'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { AppShell } from '../../components/AppShell';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { KPICards, KPICardItem } from '../../components/KPICards';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  BookOpen,
  Monitor,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Users,
  Sparkles,
  XCircle,
  RotateCcw,
  Unlock,
} from 'lucide-react';
import { ExamSchedule, ExamPeriod, Subject } from '../../types';

export default function ExamSchedulesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [trashSchedules, setTrashSchedules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoProposal, setAutoProposal] = useState<any | null>(null);
  const [selectedAutoSubjectIds, setSelectedAutoSubjectIds] = useState<number[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerSchedule, setDrawerSchedule] = useState<ExamSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [questionCount, setQuestionCount] = useState('40');
  const [autoEndTime, setAutoEndTime] = useState(false);
  const [formData, setFormData] = useState({
    examPeriodId: '',
    subjectId: '',
    examDate: '2026-08-15',
    startTime: '08:00',
    endTime: '09:30',
    examType: 'TRAC_NGHIEM',
    note: '',
  });

  // Toast & Confirm
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
    type: 'danger',
    onConfirm: () => {},
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const [resPeriods, resSubjects, resSchedules, resTrash] = await Promise.all([
        api.get('/exam-periods'),
        api.get('/subjects'),
        api.get('/exam-schedules'),
        getAuthUser()?.role === 'ADMIN' ? api.get('/exam-schedules/trash') : Promise.resolve({ data: [] }),
      ]);
      setPeriods(resPeriods.data);
      setSubjects(resSubjects.data);
      setSchedules(resSchedules.data);
      setTrashSchedules(resTrash.data);
      if (resPeriods.data.length > 0) {
        setSelectedPeriodId(resPeriods.data[0].id.toString());
      }
      const params = new URLSearchParams(window.location.search);
      const authUser = getAuthUser();
      if (params.get('action') === 'create' && authUser?.role === 'ADMIN') {
        setEditingSchedule(null);
        setQuestionCount('40');
        setAutoEndTime(true);
        setFormData({
          examPeriodId: resPeriods.data[0]?.id ? String(resPeriods.data[0].id) : '',
          subjectId: resSubjects.data[0]?.id ? String(resSubjects.data[0].id) : '',
          examDate: new Date().toISOString().split('T')[0],
          startTime: '08:00',
          endTime: '09:30',
          examType: 'TRAC_NGHIEM',
          note: 'Thi trắc nghiệm máy tính',
        });
        setIsModalOpen(true);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    void fetchInitialData();
  }, [fetchInitialData, router]);

  const filteredSchedules = schedules.filter((s) => {
    const matchPeriod = selectedPeriodId ? String(s.examPeriodId) === selectedPeriodId : true;
    const subName = s.subject?.subjectName || '';
    const subCode = s.subject?.subjectCode || '';
    const matchSearch =
      subName.toLowerCase().includes(search.toLowerCase()) ||
      subCode.toLowerCase().includes(search.toLowerCase());
    return matchPeriod && matchSearch;
  });
  const filteredTrashSchedules = trashSchedules.filter((s) => {
    const matchPeriod = selectedPeriodId ? String(s.examPeriodId) === selectedPeriodId : true;
    const value = `${s.subject?.subjectName || ''} ${s.subject?.subjectCode || ''}`.toLowerCase();
    return matchPeriod && value.includes(search.toLowerCase());
  });
  const displaySchedules = activeTab === 'trash' ? filteredTrashSchedules : filteredSchedules;

  const openAddModal = () => {
    setEditingSchedule(null);
    setQuestionCount('40');
    setAutoEndTime(true);
    setFormData({
      examPeriodId: selectedPeriodId || (periods[0]?.id ? String(periods[0].id) : ''),
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '09:30',
      examType: 'TRAC_NGHIEM',
      note: 'Thi trắc nghiệm máy tính',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sch: ExamSchedule) => {
    setEditingSchedule(sch);
    setQuestionCount(sch.endTime === '09:30' ? '60' : '40');
    setAutoEndTime(false);
    setFormData({
      examPeriodId: String(sch.examPeriodId),
      subjectId: String(sch.subjectId),
      examDate: sch.examDate ? new Date(sch.examDate).toISOString().split('T')[0] : '',
      startTime: sch.startTime || '08:00',
      endTime: sch.endTime || '09:30',
      examType: sch.examType || 'TRAC_NGHIEM',
      note: sch.note || '',
    });
    setIsModalOpen(true);
  };

  const durationForQuestions = (value: string) => (value === '60' ? 90 : 60);
  const endTimeFromStart = (start: string, minutes: number) => {
    const [hour, minute] = start.split(':').map(Number);
    const total = hour * 60 + minute + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  const changeStartTime = (startTime: string) => setFormData((previous) => ({
    ...previous,
    startTime,
    ...(autoEndTime ? { endTime: endTimeFromStart(startTime, durationForQuestions(questionCount)) } : {}),
  }));
  const changeQuestionCount = (value: string) => {
    setQuestionCount(value);
    if (autoEndTime) setFormData((previous) => ({ ...previous, endTime: endTimeFromStart(previous.startTime, durationForQuestions(value)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        examPeriodId: Number(formData.examPeriodId),
        subjectId: Number(formData.subjectId),
      };
      if (editingSchedule) {
        await api.patch(`/exam-schedules/${editingSchedule.id}`, payload);
        setToast({ message: 'Cập nhật lịch thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-schedules', payload);
        setToast({ message: 'Tạo lịch thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      void fetchInitialData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const previewAutoSchedule = async () => {
    if (!selectedPeriodId) return;
    setAutoLoading(true);
    try {
      const res = await api.post('/exam-schedules/auto-preview', { examPeriodId: Number(selectedPeriodId) });
      setAutoProposal(res.data);
      setSelectedAutoSubjectIds(res.data.proposals.map((proposal: any) => proposal.subjectId));
      setToast({ message: 'Đã tạo phương án xếp lịch xem trước. Chưa ghi dữ liệu.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tạo phương án xếp lịch', type: 'error' });
    } finally {
      setAutoLoading(false);
    }
  };

  const acceptAutoSchedule = async () => {
    if (!autoProposal?.proposals?.length) return;
    setAutoLoading(true);
    try {
      const proposals = autoProposal.proposals
        .filter((proposal: any) => selectedAutoSubjectIds.includes(proposal.subjectId))
        .map((proposal: any) => ({ examPeriodId: proposal.examPeriodId, subjectId: proposal.subjectId, examDate: proposal.examDate, startTime: proposal.startTime, endTime: proposal.endTime, examType: proposal.examType }));
      if (!proposals.length) return;
      await api.post('/exam-schedules/auto-apply', { proposals });
      setAutoProposal(null);
      setSelectedAutoSubjectIds([]);
      setToast({ message: 'Đã lưu phương án xếp lịch tự động.', type: 'success' });
      await fetchInitialData();
    } catch (err: any) {
      setToast({ message: err.message || 'Phương án đã thay đổi, vui lòng xem lại', type: 'error' });
    } finally {
      setAutoLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    const sch = schedules.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Đưa lịch vào thùng rác',
      message: `Đưa lịch thi môn ${sch?.subject?.subjectName || ''} vào thùng rác? Dữ liệu phòng, giám thị và đề thi liên quan sẽ được giữ để khôi phục.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-schedules/${id}`);
          setToast({ message: 'Đã đưa lịch thi vào thùng rác.', type: 'success' });
          void fetchInitialData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const handleCancel = (id: number) => {
    const sch = schedules.find((schedule) => schedule.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Hủy lịch thi',
      message: `Hủy lịch thi môn ${sch?.subject?.subjectName || ''}? Dữ liệu phòng, giám thị và đề thi vẫn được giữ để tra cứu.`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.patch(`/exam-schedules/${id}`, { status: 'CANCELLED' });
          setToast({ message: 'Đã hủy lịch thi. Dữ liệu lịch sử vẫn được giữ.', type: 'success' });
          void fetchInitialData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const handleRestore = (id: number) => {
    const schedule = trashSchedules.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục lịch thi',
      message: `Khôi phục lịch thi môn ${schedule?.subject?.subjectName || ''}? Hệ thống sẽ kiểm tra lại toàn bộ xung đột trước khi khôi phục.`,
      type: 'info',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/exam-schedules/${id}/restore`);
          setToast({ message: 'Đã khôi phục lịch thi thành công.', type: 'success' });
          await fetchInitialData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const handleReopenEntry = (id: number) => {
    const schedule = schedules.find((item) => item.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Mở lại thời gian vào thi',
      message: `Mở lại cho sinh viên vào thi môn ${schedule?.subject?.subjectName || ''} trong 60 phút? Thao tác này sẽ được ghi vào lịch sử quản trị.`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/exam-schedules/${id}/reopen-entry`, { minutes: 60 });
          setToast({ message: 'Đã mở lại thời gian vào thi trong 60 phút.', type: 'success' });
          await fetchInitialData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  const exportCsv = () => {
    const headers = 'Môn thi,Mã môn,Ngày thi,Giờ thi,Hình thức,Ghi chú\n';
    const rows = filteredSchedules
      .map(
        (s) =>
          `"${s.subject?.subjectName || ''}","${s.subject?.subjectCode || ''}","${
            s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : ''
          }","${s.startTime} - ${s.endTime}","${
            s.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm Online' : 'Tự luận'
          }","${s.note || ''}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_lich_thi.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAssignedRooms = schedules.reduce((total, schedule) => total + (schedule.examScheduleRooms?.length || 0), 0);
  const totalSupervisorSlots = totalAssignedRooms * 2;
  const totalAssignedSupervisors = schedules.reduce(
    (total, schedule) => total + (schedule.examScheduleRooms || []).reduce(
      (roomTotal: number, scheduleRoom: any) => roomTotal + (scheduleRoom._count?.supervisors || 0),
      0,
    ),
    0,
  );
  const publishedSchedules = schedules.filter((schedule) => schedule.status === 'SCHEDULED' || schedule.status === 'ONGOING').length;

  const kpiItems: KPICardItem[] = [
    { title: 'Tổng ca thi đã lập', value: schedules.length, subtext: 'Tất cả các môn thi', icon: Calendar, color: 'sky' },
    { title: 'Thi trắc nghiệm máy', value: schedules.filter((s) => s.examType === 'TRAC_NGHIEM').length, subtext: 'Chấm điểm tự động', icon: Monitor, color: 'emerald' },
    { title: 'Giám thị phân công', value: `${totalAssignedSupervisors}/${totalSupervisorSlots}`, subtext: totalSupervisorSlots ? 'Số vị trí giám thị đã gán' : 'Chưa xếp phòng thi', icon: Users, color: 'indigo' },
    { title: 'Lịch đang hiệu lực', value: publishedSchedules, subtext: 'Lịch đã lập hoặc đang diễn ra', icon: CheckCircle2, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Lịch thi">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Xếp ca thi, ngày thi, hình thức thi trắc nghiệm và gán phòng máy tính</p>
          </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-medium text-sm shadow-xs transition"
              >
                <Download className="h-4 w-4" /> Xuất Danh sách
              </button>
              {currentUser?.role === 'ADMIN' && (
                <>
                <button type="button" onClick={() => void previewAutoSchedule()} disabled={autoLoading} className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                  <Sparkles className="h-4 w-4" /> {autoLoading ? 'Đang đề xuất...' : 'Xếp lịch tự động'}
                </button>
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition"
                >
                  <Plus className="h-4 w-4" /> Thêm Ca thi Mới
                </button>
                </>
              )}
            </div>
          </div>

          {autoProposal && currentUser?.role === 'ADMIN' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-bold">Phương án xếp lịch xem trước · điểm {autoProposal.score}/100</p><p className="text-xs">{autoProposal.rationale}</p></div>
                <button type="button" onClick={() => void acceptAutoSchedule()} disabled={autoLoading || !selectedAutoSubjectIds.length} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Xác nhận lưu đã chọn</button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {autoProposal.proposals.map((proposal: any) => <label key={proposal.subjectId} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white p-2 text-xs"><input type="checkbox" checked={selectedAutoSubjectIds.includes(proposal.subjectId)} onChange={(event) => setSelectedAutoSubjectIds((current) => event.target.checked ? [...current, proposal.subjectId] : current.filter((id) => id !== proposal.subjectId))} /><span><b>{proposal.subjectCode}</b> · {new Date(proposal.examDate).toLocaleDateString('vi-VN')} · {proposal.startTime}-{proposal.endTime}</span></label>)}
              </div>
              {autoProposal.unassigned?.length > 0 && <p className="mt-2 text-rose-700">Chưa thể xếp {autoProposal.unassigned.length} môn.</p>}
            </div>
          )}

          {/* KPI Analytics Header */}
          <KPICards items={kpiItems} />

          {currentUser?.role === 'ADMIN' && <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <button type="button" onClick={() => setActiveTab('active')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'active' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Đang hoạt động ({schedules.length})</button>
            <button type="button" onClick={() => setActiveTab('trash')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'trash' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Thùng rác ({trashSchedules.length})</button>
          </div>}

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Tên môn học, Mã môn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Kỳ thi:</span>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="">Tất cả Kỳ thi</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Đang tải lịch thi...</div>
            ) : displaySchedules.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy ca thi phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Môn thi</th>
                      <th className="p-4">Ngày thi</th>
                      <th className="p-4">Giờ thi</th>
                      <th className="p-4">Hình thức</th>
                      <th className="p-4">Ghi chú</th>
                      <th className="p-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {displaySchedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p>{sch.subject?.subjectName || '---'}</p>
                            <p className="text-xs text-sky-700 font-semibold">{sch.subject?.subjectCode}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-700">
                          {sch.examDate ? new Date(sch.examDate).toLocaleDateString('vi-VN') : '---'}
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-900">
                          {sch.startTime} - {sch.endTime}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                            <Monitor className="h-3.5 w-3.5" /> {sch.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm Online' : 'Tự luận'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">{activeTab === 'trash' ? <>{(sch as any).deletedBy?.username || 'ADMIN'} · {(sch as any).deletedAt ? new Date((sch as any).deletedAt).toLocaleString('vi-VN') : '---'}<br />Phòng: {sch.examScheduleRooms?.length || 0} · Đề: {(sch as any).examPapers?.length || 0}</> : (sch.note || '---')}</td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDrawerSchedule(sch)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Xem chi tiết ca thi"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {currentUser?.role === 'ADMIN' && activeTab === 'trash' && <button onClick={() => handleRestore(sch.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Khôi phục lịch"><RotateCcw className="h-4 w-4" /></button>}
                            {currentUser?.role === 'ADMIN' && activeTab === 'active' && (
                              <>
                                <button
                                  onClick={() => openEditModal(sch)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(sch.id)}
                                  className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                  title="Hủy lịch (giữ dữ liệu)"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                {sch.examType === 'TRAC_NGHIEM' && (
                                  <button
                                    onClick={() => handleReopenEntry(sch.id)}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                    title="Mở lại thời gian vào thi"
                                  >
                                    <Unlock className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(sch.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Chỉnh sửa Ca thi' : 'Tạo Ca thi Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Môn thi</label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="">-- Chọn Môn thi --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectName} ({sub.subjectCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ngày thi</label>
              <input
                type="date"
                required
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hình thức thi</label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="TRAC_NGHIEM">Trắc nghiệm Online</option>
                <option value="TU_LUAN">Tự luận Giấy</option>
              </select>
            </div>
          </div>

          {!editingSchedule && <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <label className="block text-xs font-bold uppercase text-sky-700 mb-1">Số câu dự kiến</label>
            <select value={questionCount} onChange={(e) => changeQuestionCount(e.target.value)} className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none">
              <option value="40">40 câu (60 phút)</option>
              <option value="60">60 câu (90 phút)</option>
            </select>
            <p className="mt-1 text-xs text-sky-700">Giờ kết thúc sẽ tự động tính theo giờ bắt đầu.</p>
          </div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => changeStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giờ kết thúc</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => { setAutoEndTime(false); setFormData({ ...formData, endTime: e.target.value }); }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ghi chú</label>
            <input
              type="text"
              placeholder="VD: Mang theo thẻ sinh viên"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 text-sm font-semibold transition shadow-sm"
            >
              Lưu Ca thi
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSchedule)}
        onClose={() => setDrawerSchedule(null)}
        title={drawerSchedule?.subject?.subjectName || ''}
        subtitle={`Mã môn: ${drawerSchedule?.subject?.subjectCode}`}
        avatarText={drawerSchedule?.subject?.subjectCode ? drawerSchedule.subject.subjectCode.slice(0, 2) : 'LT'}
        badge={{ label: 'Đã xếp lịch', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }}
        details={[
          { label: 'Môn thi', value: drawerSchedule?.subject?.subjectName, icon: BookOpen },
          { label: 'Mã môn', value: drawerSchedule?.subject?.subjectCode },
          {
            label: 'Ngày thi',
            value: drawerSchedule?.examDate ? new Date(drawerSchedule.examDate).toLocaleDateString('vi-VN') : '---',
            icon: Calendar,
          },
          { label: 'Khung giờ', value: `${drawerSchedule?.startTime} - ${drawerSchedule?.endTime}`, icon: Clock },
          { label: 'Hình thức thi', value: drawerSchedule?.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm Online' : 'Tự luận' },
          { label: 'Ghi chú', value: drawerSchedule?.note || 'Không có' },
        ]}
      />

      {/* Confirm Popup */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
