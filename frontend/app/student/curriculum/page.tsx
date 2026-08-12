'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/ui/Button';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import {
 BookOpen,
 CheckCircle2,
 Clock,
 GraduationCap,
 Layers,
 Search,
 Award,
 Sparkles,
 Building2,
 School,
 User,
 X,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 SlidersHorizontal,
 List,
 LayoutGrid,
 RefreshCw,
 Printer,
 Download,
 Eye,
 Check,
 BookMarked,
 Info,
} from 'lucide-react';

/* ─── Types ─── */
interface CurriculumItem {
 id: number;
 subjectId: number;
 subjectCode: string;
 subjectName: string;
 credits: number;
 type: 'MANDATORY' | 'ELECTIVE';
 recommendedSemester: number;
 note?: string;
 isCompleted?: boolean;
}

interface StudentInfo {
 id: number;
 studentCode: string;
 fullName: string;
 className: string;
 classCode: string;
 departmentName: string;
 departmentCode: string;
}

interface StatsInfo {
 totalSubjects: number;
 totalCredits: number;
 totalMandatoryCredits: number;
 totalElectiveCredits: number;
 completedCredits: number;
 completedSubjects: number;
}

export default function StudentCurriculumPage() {
 usePageTitle('Khung chương trình đào tạo');
 const router = useRouter();

 const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
 const [stats, setStats] = useState<StatsInfo | null>(null);
 const [curriculumList, setCurriculumList] = useState<CurriculumItem[]>([]);
 const [loading, setLoading] = useState(true);

 // Filters & Search
 const [search, setSearch] = useState('');
 const [filterType, setFilterType] = useState('ALL');
 const [filterSemester, setFilterSemester] = useState('ALL');
 const [filterStatus, setFilterStatus] = useState('ALL');

 // Toolbar & View state
 const [sortOrder, setSortOrder] = useState('semester_asc');
 const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
 const [openColumnMenu, setOpenColumnMenu] = useState(false);
 const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
 code: true,
 name: true,
 semester: true,
 credits: true,
 type: true,
 status: true,
 });

 // Selection & Pagination
 const [selected, setSelected] = useState<number[]>([]);
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(8);

 // Detail Modal
 const [detailItem, setDetailItem] = useState<CurriculumItem | null>(null);
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

 const fetchData = useCallback(async () => {
 const authUser = getAuthUser();
 const defaultStudent = {
 id: authUser?.student?.id || authUser?.id || 1,
 studentCode: authUser?.student?.studentCode || authUser?.username || 'sv048',
 fullName: authUser?.student?.fullName || (authUser as any)?.fullName || authUser?.username || 'sv048',
 className: authUser?.student?.class?.name || 'CNTT-K18A',
 classCode: authUser?.student?.class?.code || 'CNTT-K18A',
 departmentName: authUser?.student?.class?.department?.name || 'Công nghệ thông tin',
 departmentCode: authUser?.student?.class?.department?.code || 'CNTT',
 };

 try {
 setLoading(true);
 const res = await api.get('/students/my-curriculum');
 setStudentInfo(res.data.student || defaultStudent);
 setStats(res.data.stats);
 setCurriculumList(res.data.curriculum || []);
 } catch (err: any) {
 setStudentInfo(defaultStudent);
 setToast({
 message: err?.response?.data?.message || err.message || 'Lỗi tải khung chương trình đào tạo',
 type: 'error',
 });
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
 fetchData();
 }, [router, fetchData]);

 const semesters = useMemo(
 () => Array.from(new Set(curriculumList.map((i) => i.recommendedSemester))).sort((a, b) => a - b),
 [curriculumList]
 );

 // Filtered & Sorted list
 const filteredList = useMemo(() => {
 let result = curriculumList.filter((item) => {
 const matchSearch =
 item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
 item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
 (item.note || '').toLowerCase().includes(search.toLowerCase());
 const matchType = filterType === 'ALL' || item.type === filterType;
 const matchSemester = filterSemester === 'ALL' || String(item.recommendedSemester) === filterSemester;
 const matchStatus =
 filterStatus === 'ALL' ||
 (filterStatus === 'COMPLETED' && item.isCompleted) ||
 (filterStatus === 'INCOMPLETE' && !item.isCompleted);
 return matchSearch && matchType && matchSemester && matchStatus;
 });

 // Sorting
 result = [...result].sort((a, b) => {
 if (sortOrder === 'semester_asc') return a.recommendedSemester - b.recommendedSemester;
 if (sortOrder === 'semester_desc') return b.recommendedSemester - a.recommendedSemester;
 if (sortOrder === 'name_asc') return a.subjectName.localeCompare(b.subjectName, 'vi');
 if (sortOrder === 'name_desc') return b.subjectName.localeCompare(a.subjectName, 'vi');
 if (sortOrder === 'credits_desc') return b.credits - a.credits;
 if (sortOrder === 'credits_asc') return a.credits - b.credits;
 return a.id - b.id;
 });

 return result;
 }, [curriculumList, search, filterType, filterSemester, filterStatus, sortOrder]);

 // Pagination calculations
 const totalItems = filteredList.length;
 const totalPages = Math.max(1, Math.ceil(totalItems / limit));
 const currentItems = useMemo(() => {
 const start = (page - 1) * limit;
 return filteredList.slice(start, start + limit);
 }, [filteredList, page, limit]);

 const allSelected = currentItems.length > 0 && currentItems.every((i) => selected.includes(i.id));

 const handleSelectAll = (checked: boolean) => {
 if (checked) {
 const pageIds = currentItems.map((i) => i.id);
 setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
 } else {
 const pageIds = new Set(currentItems.map((i) => i.id));
 setSelected((prev) => prev.filter((id) => !pageIds.has(id)));
 }
 };

 const handleSelectOne = (id: number, checked: boolean) => {
 if (checked) {
 setSelected((prev) => [...prev, id]);
 } else {
 setSelected((prev) => prev.filter((item) => item !== id));
 }
 };

 const completionPercentage = stats?.totalCredits
 ? Math.min(100, Math.round(((stats.completedCredits || 0) / stats.totalCredits) * 100))
 : 0;

 const KPI_CARDS = [
 {
 title: 'Tổng số môn học',
 value: stats?.totalSubjects ?? 0,
 subtext: `${stats?.completedSubjects ?? 0} môn đã hoàn thành`,
 icon: BookOpen,
 iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
 unit: ' môn',
 },
 {
 title: 'Tổng số tín chỉ',
 value: stats?.totalCredits ?? 0,
 subtext: `${stats?.completedCredits ?? 0} TC đã tích lũy (${completionPercentage}%)`,
 icon: Layers,
 iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
 unit: ' TC',
 },
 {
 title: 'Môn bắt buộc',
 value: stats?.totalMandatoryCredits ?? 0,
 subtext: 'Khối kiến thức cốt lõi',
 icon: Award,
 iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
 unit: ' TC',
 },
 {
 title: 'Môn tự chọn',
 value: stats?.totalElectiveCredits ?? 0,
 subtext: 'Chuyên ngành tự chọn',
 icon: GraduationCap,
 iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
 unit: ' TC',
 },
 {
 title: 'Tiến độ đào tạo',
 value: completionPercentage,
 subtext: `${(stats?.totalSubjects ?? 0) - (stats?.completedSubjects ?? 0)} môn chưa tích lũy`,
 icon: CheckCircle2,
 iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
 unit: '%',
 },
 ];

 const handlePrintReport = () => {
 printReport({
 title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO CÁ NHÂN',
 subtitle: `Sinh viên: ${studentInfo?.fullName || ''} (${studentInfo?.studentCode || ''}) - Lớp: ${studentInfo?.className || ''} - Khoa: ${studentInfo?.departmentName || ''}`,
 metaInfo: [
 { label: 'Tổng số môn học', value: `${stats?.totalSubjects ?? 0} môn` },
 { label: 'Tổng số tín chỉ', value: `${stats?.totalCredits ?? 0} TC` },
 { label: 'Đã hoàn thành', value: `${stats?.completedCredits ?? 0} TC (${completionPercentage}%)` },
 ],
 columns: [
 { header: 'STT', width: '40px' },
 { header: 'Học kỳ', width: '70px', align: 'center' },
 { header: 'Mã môn', width: '80px', align: 'center' },
 { header: 'Tên môn học', width: '220px' },
 { header: 'Số TC', width: '60px', align: 'center' },
 { header: 'Loại môn', width: '90px', align: 'center' },
 { header: 'Trạng thái', width: '100px', align: 'center' },
 ],
 rows: filteredList.map((item, idx) => [
 idx + 1,
 `HK ${item.recommendedSemester}`,
 item.subjectCode,
 item.subjectName,
 `${item.credits} TC`,
 item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn',
 item.isCompleted ? 'Đã học' : 'Chưa tích lũy',
 ]),
 signers: [
 { title: 'SINH VIÊN', subtitle: '(Ký và ghi rõ họ tên)' },
 { title: 'PHÒNG ĐÀO TẠO & KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
 ],
 });
 };

 const handleExportExcel = () => {
 exportToFormattedExcel({
 filename: `Khung_chuong_trinh_${studentInfo?.studentCode || 'sinh_vien'}`,
 title: 'KHUNG CHƯƠNG TRÌNH ĐÀO TẠO CÁ NHÂN',
 subtitle: `Sinh viên: ${studentInfo?.fullName} (${studentInfo?.studentCode}) · Lớp: ${studentInfo?.className} · Khoa: ${studentInfo?.departmentName}`,
 columns: [
 { header: 'STT', width: 8, align: 'center' },
 { header: 'Học kỳ', width: 14, align: 'center' },
 { header: 'Mã môn học', width: 14, align: 'center' },
 { header: 'Tên môn học', width: 35, align: 'left' },
 { header: 'Số tín chỉ', width: 12, align: 'center' },
 { header: 'Loại môn', width: 16, align: 'center' },
 { header: 'Trạng thái', width: 16, align: 'center' },
 { header: 'Ghi chú', width: 25, align: 'left' },
 ],
 rows: filteredList.map((item, idx) => [
 idx + 1,
 `Học kỳ ${item.recommendedSemester}`,
 item.subjectCode,
 item.subjectName,
 `${item.credits} TC`,
 item.type === 'MANDATORY' ? 'Bắt buộc' : 'Tự chọn',
 item.isCompleted ? 'Đã học' : 'Chưa tích lũy',
 item.note || '',
 ]),
 });
 };

 const columnsList = [
 { key: 'code', label: 'Mã môn học' },
 { key: 'name', label: 'Tên môn học' },
 { key: 'semester', label: 'Học kỳ đào tạo' },
 { key: 'credits', label: 'Số tín chỉ' },
 { key: 'type', label: 'Loại môn' },
 { key: 'status', label: 'Trạng thái' },
 ];

 const handleColumnToggle = (key: string) => {
 setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
 };

 const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;
 const endItem = Math.min(page * limit, totalItems);

 const paginationPages: (number | string)[] = [];
 if (totalPages <= 7) {
 for (let i = 1; i <= totalPages; i++) paginationPages.push(i);
 } else {
 paginationPages.push(1);
 if (page > 3) paginationPages.push('...');
 const start = Math.max(2, page - 1);
 const end = Math.min(totalPages - 1, page + 1);
 for (let i = start; i <= end; i++) {
 if (!paginationPages.includes(i)) paginationPages.push(i);
 }
 if (page < totalPages - 2) paginationPages.push('...');
 if (!paginationPages.includes(totalPages)) paginationPages.push(totalPages);
 }

 return (
 <>
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">

 {/* ── 1. Standard Page Header ── */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
 <div className="space-y-1">
 <h1 className="text-[28px] font-semibold leading-[36px] text-[#0F172A] tracking-tight">
 Khung Chương Trình Đào Tạo
 </h1>
 <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
 Sinh viên: <strong className="text-[#0F172A] font-semibold">{studentInfo?.fullName || '---'}</strong> ({studentInfo?.studentCode || '---'}) &nbsp;•&nbsp; Lớp: <strong className="text-[#0F172A] font-semibold">{studentInfo?.className || studentInfo?.classCode || '---'}</strong> &nbsp;•&nbsp; Khoa: {studentInfo?.departmentName || studentInfo?.departmentCode || '---'}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2.5">
 <Button
 variant="secondary"
 size="md"
 onClick={handleExportExcel}
 leftIcon={<Download className="h-4 w-4 text-[#64748B]" />}
 >
 Xuất Excel
 </Button>

 <Button
 variant="secondary"
 size="md"
 onClick={handlePrintReport}
 leftIcon={<Printer className="h-4 w-4 text-[#64748B]" />}
 >
 In Khung Đào Tạo
 </Button>
 </div>
 </div>

 {/* ── 2. Standard 5 KPI Cards Row ── */}
 <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
 {KPI_CARDS.map((item) => {
 const IconComponent = item.icon;
 return (
 <div
 key={item.title}
 className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1">
 <span className="text-[13px] font-semibold text-[#64748B] tracking-wider">
 {item.title}
 </span>
 <p className="text-[32px] font-semibold text-[#0F172A] leading-[38px]">
 {item.value.toLocaleString('vi-VN')}
 {item.unit || ''}
 </p>
 </div>

 <div
 className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}
 >
 <IconComponent className="h-5 w-5" />
 </div>
 </div>

 <span className="text-[13px] font-normal text-[#64748B] mt-2">
 {item.subtext}
 </span>
 </div>
 );
 })}
 </div>

 {/* ── 3. Standard Filter Card Toolbar ── */}
 <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {/* Search Input */}
 <div className="relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
 <input
 type="text"
 placeholder="Tìm theo mã môn, tên môn học..."
 value={search}
 onChange={(e) => {
 setSearch(e.target.value);
 setPage(1);
 }}
 className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-[15px] font-medium text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none transition"
 />
 {search && (
 <button
 type="button"
 onClick={() => setSearch('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Semester Filter */}
 <div className="relative">
 <select
 value={filterSemester}
 onChange={(e) => {
 setFilterSemester(e.target.value);
 setPage(1);
 }}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer transition"
 >
 <option value="ALL">Tất cả học kỳ đào tạo</option>
 {semesters.map((sem) => (
 <option key={sem} value={String(sem)}>
 Học kỳ {sem}
 </option>
 ))}
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
 </div>

 {/* Type Filter */}
 <div className="relative">
 <select
 value={filterType}
 onChange={(e) => {
 setFilterType(e.target.value);
 setPage(1);
 }}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer transition"
 >
 <option value="ALL">Tất cả loại môn học</option>
 <option value="MANDATORY">Môn bắt buộc</option>
 <option value="ELECTIVE">Môn tự chọn</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
 </div>

 {/* Status Filter */}
 <div className="relative">
 <select
 value={filterStatus}
 onChange={(e) => {
 setFilterStatus(e.target.value);
 setPage(1);
 }}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer transition"
 >
 <option value="ALL">Tất cả trạng thái tích lũy</option>
 <option value="COMPLETED">Đã hoàn thành (Đã học)</option>
 <option value="INCOMPLETE">Chưa tích lũy tín chỉ</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
 </div>
 </div>
 </div>

 {/* ── 4. Standard Table Toolbar (Total Count, Sort, Column Toggle, View Mode, Refresh) ── */}
 <div className="flex flex-wrap items-center justify-between gap-3 py-1">
 <span className="text-[15px] font-normal text-[#334155]">
 <span className="font-semibold text-[#0F172A]">{totalItems.toLocaleString('vi-VN')}</span> môn học trong khung
 </span>

 <div className="flex items-center gap-2">
 {/* Sort */}
 <div className="relative">
 <select
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value)}
 className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
 >
 <option value="semester_asc">Học kỳ: Tăng dần</option>
 <option value="semester_desc">Học kỳ: Giảm dần</option>
 <option value="name_asc">Tên môn: A - Z</option>
 <option value="name_desc">Tên môn: Z - A</option>
 <option value="credits_desc">Số tín chỉ: Cao nhất</option>
 <option value="credits_asc">Số tín chỉ: Thấp nhất</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
 </div>

 {/* Column Selector */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpenColumnMenu(!openColumnMenu)}
 className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95"
 >
 <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
 <span>Chọn cột</span>
 <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
 </button>

 {openColumnMenu && (
 <div
 className="absolute right-0 top-full z-30 mt-1.5 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-xs space-y-2"
 onMouseLeave={() => setOpenColumnMenu(false)}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
 <span className="font-semibold text-slate-900 text-xs">Hiển thị cột</span>
 <span className="text-[12px] text-slate-400 font-medium">Click để ẩn/hiện</span>
 </div>

 <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
 {columnsList.map((col) => {
 const isVisible = visibleColumns[col.key] !== false;
 return (
 <label
 key={col.key}
 className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 cursor-pointer font-semibold text-slate-700 select-none transition"
 >
 <span className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isVisible}
 onChange={() => handleColumnToggle(col.key)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <span className={isVisible ? 'text-slate-900' : 'text-slate-400 line-through'}>
 {col.label}
 </span>
 </span>
 {isVisible && <Check className="h-3.5 w-3.5 text-blue-600" />}
 </label>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* View Mode Group */}
 <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
 <button
 type="button"
 onClick={() => setViewMode('list')}
 className={`rounded-lg p-1.5 transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700'
 }`}
 title="Dạng Danh sách chuẩn"
 >
 <List className="h-4 w-4" />
 </button>
 <button
 type="button"
 onClick={() => setViewMode('grid')}
 className={`rounded-lg p-1.5 transition cursor-pointer ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700'
 }`}
 title="Dạng Lưới card"
 >
 <LayoutGrid className="h-4 w-4" />
 </button>
 <button
 type="button"
 onClick={() => setViewMode('compact')}
 className={`rounded-lg p-1.5 transition cursor-pointer ${viewMode === 'compact' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700'
 }`}
 title="Dạng Thu gọn"
 >
 <Layers className="h-4 w-4" />
 </button>
 </div>

 {/* Refresh */}
 <button
 type="button"
 onClick={fetchData}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition active:scale-95 cursor-pointer select-none"
 title="Làm mới dữ liệu"
 >
 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
 </button>
 </div>
 </div>

 {/* ── 5. Standard Content (List / Grid / Compact) ── */}
 {loading ? (
 <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3">
 <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
 <p className="text-xs font-semibold text-slate-500">Đang tải Khung chương trình đào tạo...</p>
 </div>
 ) : totalItems === 0 ? (
 <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
 <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
 <BookOpen className="w-7 h-7 text-slate-400" />
 </div>
 <h3 className="text-base font-semibold text-slate-800">Không tìm thấy môn học nào</h3>
 <p className="text-xs font-medium text-slate-500 max-w-sm">
 Không có môn học nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
 </p>
 </div>
 ) : viewMode === 'grid' ? (
 /* ── 5.1 Grid View Mode ── */
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
 {currentItems.map((item) => {
 const isChecked = selected.includes(item.id);
 return (
 <div
 key={item.id}
 className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
 }`}
 >
 <div className="space-y-2.5">
 <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => handleSelectOne(item.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <button
 type="button"
 onClick={() => setDetailItem(item)}
 className=" tabular-nums font-medium text-xs text-[#475569] hover:text-blue-600 transition cursor-pointer"
 >
 {item.subjectCode}
 </button>
 </div>

 <span className="text-[13px] font-semibold text-[#64748B]">
 HK {item.recommendedSemester}
 </span>
 </div>

 <div>
 <h4
 onClick={() => setDetailItem(item)}
 className="text-sm font-semibold text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition"
 >
 {item.subjectName}
 </h4>
 {item.note && <p className="text-xs text-slate-400 font-normal mt-0.5 italic truncate">{item.note}</p>}
 </div>

 <div className="space-y-1 text-xs text-slate-600 font-medium pt-1">
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Số tín chỉ:</span>
 <strong className="font-semibold text-slate-900">{item.credits} TC</strong>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Loại môn:</span>
 {item.type === 'MANDATORY' ? (
 <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
 <Award className="h-3.5 w-3.5 text-blue-600" /> Bắt buộc
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
 <GraduationCap className="h-3.5 w-3.5 text-blue-500" /> Tự chọn
 </span>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
 {item.isCompleted ? (
 <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đã học
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
 <Clock className="h-3.5 w-3.5 text-slate-400" /> Chưa tích lũy
 </span>
 )}

 <Button
 variant="ghost"
 size="sm"
 onClick={() => setDetailItem(item)}
 leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
 >
 Chi tiết
 </Button>
 </div>
 </div>
 );
 })}
 </div>
 ) : viewMode === 'compact' ? (
 /* ── 5.2 Compact View Mode ── */
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th scope="col" className="p-2 pl-3 text-center w-8">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => handleSelectAll(e.target.checked)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 <th scope="col" className="p-2 whitespace-nowrap">Mã môn</th>
 <th scope="col" className="p-2 min-w-[200px]">Tên môn học</th>
 <th scope="col" className="p-2 whitespace-nowrap text-center">Học kỳ</th>
 <th scope="col" className="p-2 whitespace-nowrap text-center">Số TC</th>
 <th scope="col" className="p-2 whitespace-nowrap">Loại môn</th>
 <th scope="col" className="p-2 whitespace-nowrap">Trạng thái</th>
 <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {currentItems.map((item) => {
 const isChecked = selected.includes(item.id);
 return (
 <tr key={item.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
 <td className="p-2 pl-3 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => handleSelectOne(item.id, e.target.checked)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>
 <td className="p-2 whitespace-nowrap">
 <span className=" tabular-nums font-medium text-[15px] leading-[22px] text-[#475569]">
 {item.subjectCode}
 </span>
 </td>
 <td className="p-2 min-w-[200px]">
 <p
 className="truncate font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
 onClick={() => setDetailItem(item)}
 >
 {item.subjectName}
 </p>
 </td>
 <td className="p-2 whitespace-nowrap text-center font-semibold text-slate-700">HK {item.recommendedSemester}</td>
 <td className="p-2 whitespace-nowrap text-center font-semibold text-slate-900">{item.credits} TC</td>
 <td className="p-2 whitespace-nowrap">
 {item.type === 'MANDATORY' ? (
 <span className="inline-flex items-center gap-1 text-[15px] leading-[22px] font-semibold text-slate-700">
 <Award className="h-3.5 w-3.5 text-blue-600" /> Bắt buộc
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[15px] leading-[22px] font-semibold text-slate-700">
 <GraduationCap className="h-3.5 w-3.5 text-blue-500" /> Tự chọn
 </span>
 )}
 </td>
 <td className="p-2 whitespace-nowrap">
 {item.isCompleted ? (
 <span className="inline-flex items-center gap-1 text-[15px] leading-[22px] font-semibold text-slate-700">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đã học
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[15px] leading-[22px] font-semibold text-slate-400">
 <Clock className="h-3.5 w-3.5 text-slate-400" /> Chưa tích lũy
 </span>
 )}
 </td>
 <td className="p-2 pr-3 text-right whitespace-nowrap">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setDetailItem(item)}
 leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
 >
 Chi tiết
 </Button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 /* ── 5.3 Standard List View Mode (Default Table) ── */
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th scope="col" className="p-3.5 pl-4 text-center w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => handleSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã môn</th>}
 {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[240px]">Tên môn học & Mô tả</th>}
 {visibleColumns.semester !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Học kỳ đào tạo</th>}
 {visibleColumns.credits !== false && <th scope="col" className="p-3.5 whitespace-nowrap text-center">Số tín chỉ</th>}
 {visibleColumns.type !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Loại môn</th>}
 {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái tích lũy</th>}
 <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {currentItems.map((item) => {
 const isChecked = selected.includes(item.id);
 return (
 <tr
 key={item.id}
 className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}
 >
 {/* Checkbox */}
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => handleSelectOne(item.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {/* Code */}
 {visibleColumns.code !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <button
 type="button"
 onClick={() => setDetailItem(item)}
 className=" tabular-nums font-medium text-[15px] leading-[22px] text-[#475569] hover:text-blue-600 transition cursor-pointer"
 >
 {item.subjectCode}
 </button>
 </td>
 )}

 {/* Name */}
 {visibleColumns.name !== false && (
 <td className="p-3.5 min-w-[240px]">
 <p
 onClick={() => setDetailItem(item)}
 className="font-semibold text-slate-900 text-[15px] leading-[22px] cursor-pointer hover:text-blue-600 transition"
 >
 {item.subjectName}
 </p>
 {item.note && (
 <p className="text-[15px] leading-[22px] text-slate-400 font-normal mt-0.5 italic">{item.note}</p>
 )}
 </td>
 )}

 {/* Semester */}
 {visibleColumns.semester !== false && (
 <td className="p-3.5 whitespace-nowrap text-center">
 <span className="text-[15px] leading-[22px] font-semibold text-slate-800">
 Học kỳ {item.recommendedSemester}
 </span>
 </td>
 )}

 {/* Credits */}
 {visibleColumns.credits !== false && (
 <td className="p-3.5 whitespace-nowrap text-center">
 <span className="font-semibold text-slate-900 text-[15px] leading-[22px]">{item.credits}</span>
 <span className="text-slate-500 font-medium ml-1 text-[15px] leading-[22px]">TC</span>
 </td>
 )}

 {/* Type */}
 {visibleColumns.type !== false && (
 <td className="p-3.5 whitespace-nowrap">
 {item.type === 'MANDATORY' ? (
 <span className="inline-flex items-center gap-1.5 text-[15px] leading-[22px] whitespace-nowrap select-none text-slate-700 font-semibold">
 <Award className="h-4 w-4 shrink-0 text-blue-600" />
 Bắt buộc
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 text-[15px] leading-[22px] whitespace-nowrap select-none text-slate-700 font-semibold">
 <GraduationCap className="h-4 w-4 shrink-0 text-blue-500" />
 Tự chọn
 </span>
 )}
 </td>
 )}

 {/* Status */}
 {visibleColumns.status !== false && (
 <td className="p-3.5 whitespace-nowrap">
 {item.isCompleted ? (
 <span className="inline-flex items-center gap-1.5 text-[15px] leading-[22px] whitespace-nowrap select-none text-slate-700 font-semibold">
 <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
 Đã học
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 text-[15px] leading-[22px] whitespace-nowrap select-none text-slate-500 font-semibold">
 <Clock className="h-4 w-4 shrink-0 text-slate-400" />
 Chưa tích lũy
 </span>
 )}
 </td>
 )}

 {/* Actions */}
 <td className="p-3.5 pr-4 text-right whitespace-nowrap">
 <div className="flex items-center justify-end gap-1">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setDetailItem(item)}
 leftIcon={<Eye className="w-3.5 h-3.5 text-slate-400" />}
 >
 Chi tiết
 </Button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* ── 6. Standard Pagination Bar (Hiển thị 1 - X trong Y Môn học, Page Buttons, Rows Per Page) ── */}
 {totalItems > 0 && (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
 <p className="text-xs font-semibold text-slate-500">
 Hiển thị <span className="font-semibold text-slate-900">{startItem}</span> -{' '}
 <span className="font-semibold text-slate-900">{endItem}</span> trong{' '}
 <span className="font-semibold text-slate-900">{totalItems.toLocaleString('vi-VN')}</span> Môn học
 </p>

 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1">
 <button
 type="button"
 disabled={page <= 1}
 onClick={() => setPage(page - 1)}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
 title="Trang trước"
 >
 <ChevronLeft className="h-4 w-4" />
 </button>

 {paginationPages.map((p, idx) => {
 if (p === '...') {
 return (
 <span key={`dots-${idx}`} className="px-1 text-xs font-semibold text-slate-400">
 ...
 </span>
 );
 }

 const pNum = Number(p);
 const isCurrent = pNum === page;

 return (
 <button
 key={pNum}
 type="button"
 onClick={() => setPage(pNum)}
 className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${isCurrent
 ? 'bg-blue-600 text-white shadow-xs'
 : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
 }`}
 >
 {pNum}
 </button>
 );
 })}

 <button
 type="button"
 disabled={page >= totalPages}
 onClick={() => setPage(page + 1)}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
 title="Trang sau"
 >
 <ChevronRight className="h-4 w-4" />
 </button>
 </div>

 {/* Rows Per Page Dropdown */}
 <div className="relative">
 <select
 value={limit}
 onChange={(e) => {
 setLimit(Number(e.target.value));
 setPage(1);
 }}
 className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
 >
 <option value={8}>8 dòng / trang</option>
 <option value={15}>15 dòng / trang</option>
 <option value={25}>25 dòng / trang</option>
 <option value={50}>50 dòng / trang</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
 </div>
 </div>
 </div>
 )}

 {/* ── 7. Detail Course Drawer ── */}
 <ProfileDrawer
 isOpen={Boolean(detailItem)}
 onClose={() => setDetailItem(null)}
 title={detailItem?.subjectName || ''}
 subtitle={`Mã môn: ${detailItem?.subjectCode}`}
 avatarText={detailItem?.subjectCode?.slice(0, 2) || 'CT'}
 badge={{
 label: `Học kỳ ${detailItem?.recommendedSemester}`,
 className: 'bg-blue-50 text-blue-700 border border-blue-200',
 }}
 details={[
 { label: 'Tên môn học', value: detailItem?.subjectName, icon: BookOpen },
 { label: 'Mã môn học', value: detailItem?.subjectCode, icon: Info },
 { label: 'Học kỳ đào tạo', value: detailItem ? `Học kỳ ${detailItem.recommendedSemester}` : '', icon: BookMarked },
 { label: 'Số tín chỉ', value: detailItem ? `${detailItem.credits} Tín chỉ` : '', icon: Layers },
 { label: 'Phân loại môn', value: detailItem?.type === 'MANDATORY' ? 'Môn bắt buộc' : 'Môn tự chọn', icon: Award },
 ...(detailItem?.note ? [{ label: 'Ghi chú', value: detailItem.note }] : []),
 ]}
 extraSections={detailItem ? [
 {
 title: 'Trạng thái tích lũy',
 content: detailItem.isCompleted ? (
 <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
 <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
 <div>
 <p className="text-[13px] font-semibold text-emerald-800">Đã hoàn thành</p>
 <p className="text-[12px] text-emerald-600 font-medium mt-0.5">Sinh viên đã tích lũy đủ tín chỉ môn học này</p>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
 <Clock className="h-5 w-5 text-slate-400 shrink-0" />
 <div>
 <p className="text-[13px] font-semibold text-slate-700">Chưa tích lũy</p>
 <p className="text-[12px] text-slate-500 font-medium mt-0.5">Cần đăng ký học theo đúng kế hoạch đào tạo</p>
 </div>
 </div>
 ),
 },
 ] : undefined}
 />

 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
 </main>
 </>
 );
}
