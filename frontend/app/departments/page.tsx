'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Building2,
  Users,
  GraduationCap,
  Search,
  Eye,
  CheckCircle2,
  BookOpen,
  BookmarkCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Department, Subject } from '../../types';

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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerDepartment, setDrawerDepartment] = useState<Department | null>(null);
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

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [resDepts, resSubs] = await Promise.all([
        api.get('/departments'),
        api.get('/subjects'),
      ]);
      setDepartments(resDepts.data);
      setAllSubjects(resSubs.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách khoa', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculum = useCallback(async (deptId: number) => {
    setLoadingCurriculum(true);
    try {
      const res = await api.get(`/departments/${deptId}/curriculum`);
      setCurriculumList(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tải khung chương trình', type: 'error' });
    } finally {
      setLoadingCurriculum(false);
    }
  }, []);

  const openCurriculumModal = (dept: Department) => {
    setCurriculumDept(dept);
    setAddCurriculumForm({ subjectId: '', type: 'MANDATORY', recommendedSemester: '1', note: '' });
    loadCurriculum(dept.id);
  };

  const handleAddSubjectToCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumDept || !addCurriculumForm.subjectId) return;
    try {
      await api.post(`/departments/${curriculumDept.id}/curriculum`, {
        subjectId: Number(addCurriculumForm.subjectId),
        type: addCurriculumForm.type,
        recommendedSemester: Number(addCurriculumForm.recommendedSemester),
        note: addCurriculumForm.note,
      });
      setToast({ message: 'Đã thêm môn học vào khung chương trình đào tạo!', type: 'success' });
      setAddCurriculumForm({ subjectId: '', type: 'MANDATORY', recommendedSemester: '1', note: '' });
      loadCurriculum(curriculumDept.id);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleRemoveFromCurriculum = async (subjectId: number) => {
    if (!curriculumDept) return;
    try {
      await api.delete(`/departments/${curriculumDept.id}/curriculum/${subjectId}`);
      setToast({ message: 'Đã xóa môn khỏi khung chương trình đào tạo!', type: 'success' });
      loadCurriculum(curriculumDept.id);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingDepartment(null);
    setFormData({ code: '', name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({ code: dept.code, name: dept.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await api.patch(`/departments/${editingDepartment.id}`, formData);
        setToast({ message: 'Cập nhật khoa thành công!', type: 'success' });
      } else {
        await api.post('/departments', formData);
        setToast({ message: 'Thêm khoa mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const dept = departments.find((d) => d.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Khoa',
      message: `Bạn có chắc chắn muốn xóa khoa ${dept?.name || ''}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/departments/${id}`);
          setToast({ message: 'Đã xóa khoa thành công!', type: 'success' });
          fetchData();
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      },
    });
  };

  // KPI Items
  const kpiItems: KPICardItem[] = [
    { title: 'Tổng số Khoa/Viện', value: departments.length, subtext: 'Trực thuộc Trường', icon: Building2, color: 'sky' },
    { title: 'Khoa đang hiển thị', value: filteredDepartments.length, subtext: search ? 'Theo điều kiện tìm kiếm' : 'Toàn bộ danh sách', icon: GraduationCap, color: 'indigo' },
    { title: 'Mã khoa hợp lệ', value: departments.filter((department) => Boolean(department.code?.trim())).length, subtext: 'Có mã định danh', icon: Users, color: 'emerald' },
    { title: 'Đơn vị có tên', value: departments.filter((department) => Boolean(department.name?.trim())).length, subtext: 'Dữ liệu đã khai báo tên', icon: CheckCircle2, color: 'purple' },
  ];

  return (
    <AppShell user={currentUser} title="Quản lý Khoa & Khung chương trình">
      <main className="w-full px-6 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Quản lý các khoa chuyên môn, bộ môn và khung chương trình đào tạo theo ngành</p>
          </div>
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-[#1e66f5] hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition"
            >
              <Plus className="h-4 w-4" /> Thêm Khoa mới
            </button>
          )}
        </div>

        {/* KPI Analytics Header */}
        <KPICards items={kpiItems} />

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã khoa, Tên Khoa / Viện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách khoa...</div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">Không tìm thấy khoa phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Mã Khoa</th>
                    <th className="p-4">Tên Khoa / Viện</th>
                    <th className="p-4">Khung chương trình đào tạo</th>
                    <th className="p-4 pr-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDepartments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-bold text-sky-700">{d.code}</td>
                      <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-xs">
                          <Building2 className="h-4 w-4" />
                        </div>
                        {d.name}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openCurriculumModal(d)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200/80"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Khung Đào tạo Ngành
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDrawerDepartment(d)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Xem chi tiết khoa"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {currentUser?.role === 'ADMIN' && (
                            <>
                              <button
                                onClick={() => openEditModal(d)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(d.id)}
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
        title={editingDepartment ? 'Chỉnh sửa Khoa' : 'Thêm Khoa Mới'}
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
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên Khoa / Viện</label>
            <input
              type="text"
              required
              placeholder="VD: Khoa Công nghệ thông tin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Lưu Khoa
            </button>
          </div>
        </form>
      </Modal>

      {/* Curriculum Modal */}
      <Modal
        isOpen={Boolean(curriculumDept)}
        onClose={() => setCurriculumDept(null)}
        title={`Khung Chương Trình Đào Tạo — ${curriculumDept?.name || ''}`}
      >
        <div className="space-y-6 max-w-3xl">
          {/* Add Subject Form */}
          {currentUser?.role === 'ADMIN' && (
            <form onSubmit={handleAddSubjectToCurriculum} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-sky-600" /> Thêm Môn vào Khung đào tạo Ngành
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Môn học</label>
                  <select
                    required
                    value={addCurriculumForm.subjectId}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, subjectId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subjectCode} - {s.subjectName} ({s.credits} tín chỉ)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phân loại môn</label>
                  <select
                    value={addCurriculumForm.type}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, type: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-sky-500 focus:outline-none"
                  >
                    <option value="MANDATORY">Bắt buộc</option>
                    <option value="ELECTIVE">Tự chọn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Học kỳ khuyến nghị</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={addCurriculumForm.recommendedSemester}
                    onChange={(e) => setAddCurriculumForm({ ...addCurriculumForm, recommendedSemester: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  Thêm vào Khung
                </button>
              </div>
            </form>
          )}

          {/* Curriculum List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-600">Danh sách Môn trong Khung đào tạo ({curriculumList.length} môn)</span>
            </div>
            {loadingCurriculum ? (
              <div className="p-8 text-center text-xs text-slate-500">Đang tải khung chương trình...</div>
            ) : curriculumList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Khoa chưa khai báo môn học nào trong Khung chương trình đào tạo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="p-3">Mã môn</th>
                      <th className="p-3">Tên môn học</th>
                      <th className="p-3 text-center">Tín chỉ</th>
                      <th className="p-3 text-center">Phân loại</th>
                      <th className="p-3 text-center">Học kỳ Gợi ý</th>
                      {currentUser?.role === 'ADMIN' && <th className="p-3 text-right">Xóa</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {curriculumList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-sky-700">{item.subject.subjectCode}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.subject.subjectName}</td>
                        <td className="p-3 text-center font-bold">{item.subject.credits} TC</td>
                        <td className="p-3 text-center">
                          {item.type === 'MANDATORY' ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                              Bắt buộc
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                              Tự chọn
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">HK {item.recommendedSemester}</td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveFromCurriculum(item.subjectId)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Xóa môn khỏi khung"
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

      {/* Department Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerDepartment)}
        onClose={() => setDrawerDepartment(null)}
        title={drawerDepartment?.name || ''}
        subtitle={`Mã đơn vị: ${drawerDepartment?.code}`}
        avatarText={drawerDepartment?.code ? drawerDepartment.code.slice(0, 2) : 'KH'}
        badge={{ label: 'Khoa Chuyên Môn', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }}
        details={[
          { label: 'Mã khoa', value: drawerDepartment?.code, icon: Building2 },
          { label: 'Tên khoa / viện', value: drawerDepartment?.name },
          { label: 'Trưởng khoa đại diện', value: 'GS.TS Nguyễn Văn A', icon: GraduationCap },
          { label: 'Trạng thái hoạt động', value: 'Hoạt động bình thường' },
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
