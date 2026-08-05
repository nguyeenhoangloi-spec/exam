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
import { Department, Subject } from '../../types';
import { Building2, Search, X, Plus, Trash2, BookOpen, GraduationCap, Users } from 'lucide-react';

import { DepartmentHeader } from '../../components/departments/DepartmentHeader';
import { DepartmentKPICards } from '../../components/departments/DepartmentKPICards';
import { DepartmentTableToolbar } from '../../components/departments/DepartmentTableToolbar';
import { DepartmentTable } from '../../components/departments/DepartmentTable';
import { DepartmentPaginationBar } from '../../components/departments/DepartmentPaginationBar';

interface CurriculumItem {
  id: number;
  departmentId: number;
  subjectId: number;
  type: 'MANDATORY' | 'ELECTIVE';
  recommendedSemester: number;
  note: string | null;
  subject: {
    id: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    department?: { id: number; name: string; code: string };
  };
}

export default function DepartmentsPage() {
  usePageTitle('Quản lý Khoa & Khung chương trình');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    subjectsCount: true,
    classesCount: true,
    teachersCount: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerDepartment, setDrawerDepartment] = useState<Department | null>(null);

  // Department Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });

  // Curriculum Modal State
  const [curriculumDept, setCurriculumDept] = useState<Department | null>(null);
  const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [addCurriculumForm, setAddCurriculumForm] = useState({
    subjectId: '',
    type: 'MANDATORY' as 'MANDATORY' | 'ELECTIVE',
    recommendedSemester: '1',
    note: '',
  });

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
      const [resDepts, resSubs] = await Promise.all([
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
      ]);
      setDepartments(resDepts.data || []);
      setAllSubjects(resSubs.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách khoa', type: 'error' });
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
    const total = departments.length;
    const totalSubjects = departments.reduce((acc, curr: any) => acc + (curr.subjectsCount ?? curr.subjects?.length ?? 0), 0);
    const totalClasses = departments.reduce((acc, curr: any) => acc + (curr.classesCount ?? curr.classes?.length ?? 0), 0);
    const totalTeachers = departments.reduce((acc, curr: any) => acc + (curr.teachersCount ?? curr.teachers?.length ?? 0), 0);
    return {
      total,
      totalSubjects: totalSubjects || allSubjects.length,
      totalClasses,
      totalTeachers,
      curriculumCount: totalSubjects,
    };
  }, [departments, allSubjects]);

  // Filter & Sort Departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((d) => {
        const matchSearch =
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.code.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
      })
      .sort((a: any, b: any) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'name_asc') return a.name.localeCompare(b.name, 'vi');
        if (sortOrder === 'subjects_desc') {
          const sA = a.subjectsCount ?? a.subjects?.length ?? 0;
          const sB = b.subjectsCount ?? b.subjects?.length ?? 0;
          return sB - sA;
        }
        return b.id - a.id;
      });
  }, [departments, search, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / limit));
  const paginatedDepartments = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredDepartments.slice(start, start + limit);
  }, [filteredDepartments, page, limit]);

  // Department Actions
  const openAddModal = () => {
    setEditingDepartment(null);
    setFormData({ code: '', name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDepartment(d);
    setFormData({ code: d.code, name: d.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await api.patch(`/departments/${editingDepartment.id}`, formData);
        setToast({ message: 'Cập nhật Khoa thành công!', type: 'success' });
      } else {
        await api.post('/departments', formData);
        setToast({ message: 'Tạo Khoa mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi lưu thông tin Khoa', type: 'error' });
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id: number) => {
    const item = departments.find((d) => d.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Khoa đào tạo',
      message: `Bạn có chắc chắn muốn xóa khoa ${item?.name || ''}? Thao tác này sẽ ảnh hưởng tới các lớp học và sinh viên trực thuộc!`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/departments/${id}`);
          setToast({ message: 'Đã xóa Khoa thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi xóa Khoa', type: 'error' });
        }
      },
    });
  };

  // Curriculum Actions
  const fetchCurriculum = async (deptId: number) => {
    setLoadingCurriculum(true);
    try {
      const res = await api.get(`/departments/${deptId}/curriculum`);
      setCurriculumList(res.data || []);
    } catch {
      setCurriculumList([]);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const handleOpenCurriculumModal = (d: Department) => {
    setCurriculumDept(d);
    setAddCurriculumForm({
      subjectId: '',
      type: 'MANDATORY',
      recommendedSemester: '1',
      note: '',
    });
    fetchCurriculum(d.id);
  };

  const handleAddCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumDept || !addCurriculumForm.subjectId) return;
    try {
      await api.post(`/departments/${curriculumDept.id}/curriculum`, {
        subjectId: Number(addCurriculumForm.subjectId),
        type: addCurriculumForm.type,
        recommendedSemester: Number(addCurriculumForm.recommendedSemester),
        note: addCurriculumForm.note || undefined,
      });
      setToast({ message: 'Thêm môn học vào khung chương trình thành công!', type: 'success' });
      setAddCurriculumForm({ subjectId: '', type: 'MANDATORY', recommendedSemester: '1', note: '' });
      fetchCurriculum(curriculumDept.id);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Lỗi khi thêm môn học vào khung chương trình', type: 'error' });
    }
  };

  const handleRemoveCurriculum = async (curriculumId: number) => {
    if (!curriculumDept) return;
    try {
      await api.delete(`/departments/${curriculumDept.id}/curriculum/${curriculumId}`);
      setToast({ message: 'Đã xóa môn học khỏi khung chương trình!', type: 'success' });
      fetchCurriculum(curriculumDept.id);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi xóa môn khỏi khung', type: 'error' });
    }
  };

  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Mã Khoa', width: 15 },
      { header: 'Tên Khoa đào tạo', width: 35 },
      { header: 'Số môn học', width: 15, align: 'center' as const },
      { header: 'Số lớp học', width: 15, align: 'center' as const },
      { header: 'Số giảng viên', width: 15, align: 'center' as const },
    ];

    const rows = filteredDepartments.map((d: any, idx) => [
      idx + 1,
      d.code,
      d.name,
      d.subjectsCount ?? d.subjects?.length ?? 0,
      d.classesCount ?? d.classes?.length ?? 0,
      d.teachersCount ?? d.teachers?.length ?? 0,
    ]);

    exportToFormattedExcel({
      filename: 'Danh_sach_khoa.xls',
      title: 'DANH SÁCH KHOA ĐÀO TẠO',
      subtitle: 'Trích xuất dữ liệu danh mục Khoa & Khung chương trình',
      columns,
      rows,
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH KHOA ĐÀO TẠO',
      subtitle: 'Danh sách tổng hợp các Khoa và chỉ số đào tạo',
      metaInfo: [
        { label: 'Tổng số Khoa', value: String(departments.length) },
        { label: 'Tổng số môn học', value: String(kpiData.totalSubjects) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã Khoa', width: '90px' },
        { header: 'Tên Khoa đào tạo', width: '220px' },
        { header: 'Môn học', width: '90px', align: 'center' },
        { header: 'Lớp học', width: '90px', align: 'center' },
        { header: 'Giảng viên', width: '100px', align: 'center' },
      ],
      rows: filteredDepartments.map((d: any, idx) => [
        idx + 1,
        d.code,
        d.name,
        d.subjectsCount ?? d.subjects?.length ?? 0,
        d.classesCount ?? d.classes?.length ?? 0,
        d.teachersCount ?? d.teachers?.length ?? 0,
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <DepartmentHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <DepartmentKPICards
          total={kpiData.total}
          totalSubjects={kpiData.totalSubjects}
          totalClasses={kpiData.totalClasses}
          totalTeachers={kpiData.totalTeachers}
          curriculumCount={kpiData.curriculumCount}
        />

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã khoa, Tên khoa đào tạo..."
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
        </div>

        {/* Dynamic Table Action Toolbar */}
        <DepartmentTableToolbar
          totalCount={filteredDepartments.length}
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
        ) : !paginatedDepartments.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
            Không tìm thấy Khoa phù hợp.
          </div>
        ) : (
          <DepartmentTable
            departments={paginatedDepartments}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedDepartments.map((d) => d.id) : [])
            }
            onDetail={setDrawerDepartment}
            onOpenCurriculum={handleOpenCurriculumModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <DepartmentPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredDepartments.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      </main>

      {/* Edit/Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartment ? 'Chỉnh sửa Khoa Đào tạo' : 'Tạo Khoa Đào tạo Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mã Khoa</label>
            <input
              type="text"
              required
              placeholder="VD: CNTT"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Khoa Đào tạo</label>
            <input
              type="text"
              required
              placeholder="VD: Khoa Công nghệ Thông tin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
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
              Lưu Thông Tin
            </button>
          </div>
        </form>
      </Modal>

      {/* Curriculum Modal */}
      <Modal
        isOpen={Boolean(curriculumDept)}
        onClose={() => setCurriculumDept(null)}
        title={`Khung Chương trình Đào tạo - ${curriculumDept?.name || ''}`}
      >
        <div className="space-y-5">
          {currentUser?.role === 'ADMIN' && (
            <form onSubmit={handleAddCurriculum} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Thêm Môn học vào Khung CTDT</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <select
                    required
                    value={addCurriculumForm.subjectId}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, subjectId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none"
                  >
                    <option value="">-- Chọn Môn học --</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.subjectCode}] {s.subjectName} ({s.credits} TC)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={addCurriculumForm.type}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none"
                  >
                    <option value="MANDATORY">Bắt buộc</option>
                    <option value="ELECTIVE">Tự chọn</option>
                  </select>
                </div>

                <div>
                  <select
                    value={addCurriculumForm.recommendedSemester}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, recommendedSemester: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Học kỳ {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Ghi chú (Tùy chọn)..."
                  value={addCurriculumForm.note}
                  onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, note: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-extrabold transition cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm vào Khung</span>
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase text-slate-500">Danh sách Môn học trong Khung</span>
            {loadingCurriculum ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">Đang tải danh sách môn học...</div>
            ) : curriculumList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
                Chưa có môn học nào trong Khung chương trình đào tạo của khoa này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Mã môn</th>
                      <th className="p-3">Tên môn học</th>
                      <th className="p-3 text-center">Số TC</th>
                      <th className="p-3 text-center">Loại môn</th>
                      <th className="p-3 text-center">Học kỳ</th>
                      {currentUser?.role === 'ADMIN' && <th className="p-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {curriculumList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-blue-600">{item.subject?.subjectCode}</td>
                        <td className="p-3 font-bold text-slate-900">{item.subject?.subjectName}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">{item.subject?.credits} TC</td>
                        <td className="p-3 text-center">
                          {item.type === 'MANDATORY' ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 border border-rose-200">
                              Bắt buộc
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 border border-emerald-200">
                              Tự chọn
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">HK {item.recommendedSemester}</td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveCurriculum(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa khỏi khung"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Department Detail Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerDepartment)}
        onClose={() => setDrawerDepartment(null)}
        title={drawerDepartment?.name || 'Chi tiết Khoa đào tạo'}
        subtitle={`Mã khoa: ${drawerDepartment?.code || ''}`}
        avatarText={drawerDepartment?.code || 'KH'}
        badge={{
          label: 'Đang đào tạo',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Tên Khoa', value: drawerDepartment?.name, icon: Building2 },
          { label: 'Mã Khoa', value: drawerDepartment?.code },
          {
            label: 'Số môn học',
            value: `${(drawerDepartment as any)?.subjectsCount ?? (drawerDepartment as any)?.subjects?.length ?? 0} môn`,
            icon: BookOpen,
          },
          {
            label: 'Số lớp học',
            value: `${(drawerDepartment as any)?.classesCount ?? (drawerDepartment as any)?.classes?.length ?? 0} lớp`,
            icon: GraduationCap,
          },
          {
            label: 'Số giảng viên',
            value: `${(drawerDepartment as any)?.teachersCount ?? (drawerDepartment as any)?.teachers?.length ?? 0} cán bộ`,
            icon: Users,
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
