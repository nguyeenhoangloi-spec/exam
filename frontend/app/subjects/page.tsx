'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { Subject, Department } from '../../types';
import { BookOpen, Building2, Search, X, UserPlus, CheckCircle2, Award, ChevronDown } from 'lucide-react';

import { SubjectHeader } from '../../components/subjects/SubjectHeader';
import { SubjectKPICards } from '../../components/subjects/SubjectKPICards';
import { SubjectTableToolbar } from '../../components/subjects/SubjectTableToolbar';
import { SubjectTable } from '../../components/subjects/SubjectTable';
import { SubjectPaginationBar } from '../../components/subjects/SubjectPaginationBar';

export default function SubjectsPage() {
  usePageTitle('Quản lý Môn học');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    subjectCode: true,
    subjectName: true,
    credits: true,
    department: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerSubject, setDrawerSubject] = useState<Subject | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: '3',
    departmentId: '',
  });

  // Student Enrollment State
  const [enrollSubject, setEnrollSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [enrollData, setEnrollData] = useState({ semester: 'HK1', schoolYear: '2025-2026' });
  const [enrollLoading, setEnrollLoading] = useState(false);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSubjects, resDepts] = await Promise.all([
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
      ]);
      setSubjects(resSubjects.data || []);
      setDepartments(resDepts.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách môn học', type: 'error' });
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
    fetchData();
  }, [fetchData, router]);

  // Compute DYNAMIC KPI Metrics from real API data
  const kpiData = useMemo(() => {
    const total = subjects.length;
    const totalCredits = subjects.reduce((acc, curr) => acc + (curr.credits || 0), 0);
    const setDept = new Set(subjects.map((s) => s.departmentId).filter(Boolean));
    const threeCreditCount = subjects.filter((s) => s.credits === 3).length;
    const questionCount = subjects.filter((s: any) => (s.questions?.length || 0) > 0 || (s._count?.questions || 0) > 0).length;
    return {
      total,
      totalCredits,
      totalDepartments: setDept.size || departments.length,
      threeCreditCount,
      questionCount,
    };
  }, [subjects, departments]);

  // Filter & Sort Subjects
  const filteredSubjects = useMemo(() => {
    return subjects
      .filter((s) => {
        const matchSearch =
          s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
          s.subjectCode.toLowerCase().includes(search.toLowerCase());
        const matchDept = selectedDeptId ? String(s.departmentId) === selectedDeptId : true;
        return matchSearch && matchDept;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.subjectName.localeCompare(b.subjectName, 'vi');
        if (sortOrder === 'credits_desc') return b.credits - a.credits;
        return b.id - a.id;
      });
  }, [subjects, search, selectedDeptId, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / limit));
  const paginatedSubjects = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSubjects.slice(start, start + limit);
  }, [filteredSubjects, page, limit]);

  // Subject Actions
  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      subjectCode: '',
      subjectName: '',
      credits: '3',
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setFormData({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      credits: String(s.credits),
      departmentId: s.departmentId ? String(s.departmentId) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        subjectCode: formData.subjectCode,
        subjectName: formData.subjectName,
        credits: Number(formData.credits),
        departmentId: Number(formData.departmentId),
      };

      if (editingSubject) {
        await api.patch(`/subjects/${editingSubject.id}`, payload);
        setToast({ message: 'Cập nhật môn học thành công!', type: 'success' });
      } else {
        await api.post('/subjects', payload);
        setToast({ message: 'Thêm môn học mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi lưu thông tin môn học', type: 'error' });
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id: number) => {
    const item = subjects.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Môn học',
      message: `Bạn có chắc chắn muốn xóa môn ${item?.subjectName || ''}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/subjects/${id}`);
          setToast({ message: 'Đã xóa môn học thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi xóa môn học', type: 'error' });
        }
      },
    });
  };

  // Student Enrollment Handlers
  const handleOpenEnrollModal = async (s: Subject) => {
    setEnrollSubject(s);
    setSelectedStudentIds([]);
    setEnrollLoading(true);
    try {
      const res = await api.get('/students');
      setStudents(res.data || []);
    } catch {
      setStudents([]);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollSubject || selectedStudentIds.length === 0) return;
    try {
      await api.post('/student-subjects/bulk', {
        subjectId: enrollSubject.id,
        studentIds: selectedStudentIds,
        semester: enrollData.semester,
        schoolYear: enrollData.schoolYear,
      });
      setToast({
        message: `Đã gán thành công ${selectedStudentIds.length} sinh viên vào môn ${enrollSubject.subjectName}!`,
        type: 'success',
      });
      setEnrollSubject(null);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Lỗi khi gán sinh viên đăng ký môn học', type: 'error' });
    }
  };

  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Mã môn học', width: 15 },
      { header: 'Tên môn học', width: 35 },
      { header: 'Số tín chỉ', width: 12, align: 'center' as const },
      { header: 'Khoa đào tạo', width: 25 },
    ];

    const rows = filteredSubjects.map((s: any, idx) => [
      idx + 1,
      s.subjectCode,
      s.subjectName,
      s.credits,
      s.department?.name || s.departmentName || '',
    ]);

    exportToFormattedExcel({
      filename: 'Danh_sach_mon_hoc.xls',
      title: 'DANH SÁCH MÔN HỌC HỆ THỐNG',
      subtitle: 'Trích xuất dữ liệu danh mục môn học',
      columns,
      rows,
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH MÔN HỌC',
      subtitle: 'Danh sách môn học và phân bổ tín chỉ',
      metaInfo: [
        { label: 'Tổng số môn học', value: String(subjects.length) },
        { label: 'Tổng số tín chỉ', value: `${kpiData.totalCredits} TC` },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã Môn', width: '90px' },
        { header: 'Tên Môn học', width: '220px' },
        { header: 'Số TC', width: '70px', align: 'center' },
        { header: 'Khoa đào tạo', width: '180px' },
      ],
      rows: filteredSubjects.map((s: any, idx) => [
        idx + 1,
        s.subjectCode,
        s.subjectName,
        `${s.credits} TC`,
        s.department?.name || s.departmentName || '',
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <SubjectHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <SubjectKPICards
          total={kpiData.total}
          totalCredits={kpiData.totalCredits}
          totalDepartments={kpiData.totalDepartments}
          threeCreditCount={kpiData.threeCreditCount}
          questionCount={kpiData.questionCount}
        />

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã môn, Tên môn học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Khoa đào tạo:</span>
            <div className="relative">
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả các Khoa</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Table Action Toolbar */}
        <SubjectTableToolbar
          totalCount={filteredSubjects.length}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onRefresh={fetchData}
        />

        {/* Full-Width DataGrid Table */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedSubjects.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
            Không tìm thấy môn học phù hợp.
          </div>
        ) : (
          <SubjectTable
            subjects={paginatedSubjects}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedSubjects.map((s) => s.id) : [])
            }
            onDetail={setDrawerSubject}
            onEnroll={handleOpenEnrollModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <SubjectPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredSubjects.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      </main>

      {/* Edit/Add Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Chỉnh sửa Môn học' : 'Tạo Môn học Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Môn học</label>
            <input
              type="text"
              required
              placeholder="VD: INT101"
              value={formData.subjectCode}
              onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Môn học</label>
            <input
              type="text"
              required
              placeholder="VD: Lập trình Căn bản"
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Số Tín chỉ</label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Khoa đào tạo</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn Khoa --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 text-sm font-black transition shadow-xs cursor-pointer"
            >
              Lưu Môn Học
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Enrollment Modal */}
      <Modal
        isOpen={Boolean(enrollSubject)}
        onClose={() => setEnrollSubject(null)}
        title={`Gán Sinh viên đăng ký - ${enrollSubject?.subjectName || ''}`}
      >
        <form onSubmit={handleEnrollSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Học kỳ</label>
              <select
                value={enrollData.semester}
                onChange={(e) => setEnrollData({ ...enrollData, semester: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
              >
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
                <option value="HK3">Học kỳ Hè</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Năm học</label>
              <input
                type="text"
                value={enrollData.schoolYear}
                onChange={(e) => setEnrollData({ ...enrollData, schoolYear: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Chọn sinh viên đăng ký ({selectedStudentIds.length} đã chọn)</label>
            {enrollLoading ? (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold">Đang tải danh sách sinh viên...</div>
            ) : students.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Không tìm thấy dữ liệu sinh viên trong hệ thống.</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {students.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-bold transition ${
                        isChecked ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelectedStudentIds(
                              e.target.checked ? [...selectedStudentIds, st.id] : selectedStudentIds.filter((x) => x !== st.id),
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>
                          [{st.studentCode}] {st.fullName} - {st.class?.name || 'Chưa gán lớp'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEnrollSubject(null)}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={selectedStudentIds.length === 0}
              className="px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-black transition cursor-pointer shadow-xs"
            >
              Xác nhận Gán Sinh viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Subject Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSubject)}
        onClose={() => setDrawerSubject(null)}
        title={drawerSubject?.subjectName || 'Chi tiết môn học'}
        subtitle={`Mã môn: ${drawerSubject?.subjectCode || ''}`}
        avatarText={drawerSubject?.subjectCode?.slice(0, 3) || 'MH'}
        badge={{
          label: `${drawerSubject?.credits || 3} Tín chỉ`,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }}
        details={[
          { label: 'Tên môn học', value: drawerSubject?.subjectName, icon: BookOpen },
          { label: 'Mã môn học', value: drawerSubject?.subjectCode },
          { label: 'Số tín chỉ', value: `${drawerSubject?.credits || 3} TC`, icon: Award },
          {
            label: 'Khoa đào tạo',
            value: drawerSubject?.department?.name || (drawerSubject as any)?.departmentName || 'Chưa gán Khoa',
            icon: Building2,
          },
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
    </>
  );
}
