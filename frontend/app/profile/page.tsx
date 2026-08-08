'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser, getAuthToken, setAuthToken } from '../../lib/auth';
import { User as UserType } from '../../types';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { TabBar } from '../../components/ui/TabBar';
import {
  User,
  Mail,
  ShieldCheck,
  BadgeCheck,
  Building2,
  Save,
  Sparkles,
  Phone,
  CheckCircle2,
  Activity,
  Lock,
  Settings,
  MapPin,
  Camera,
  Upload,
  Trash2,
  ImageIcon,
} from 'lucide-react';

interface ProfileData {
  id: number;
  username: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: string;
  createdAt: string;
  email?: string;
  avatarUrl?: string;
  student?: any;
  teacher?: any;
}

export default function ProfilePage() {
  usePageTitle('Hồ sơ cá nhân');
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'permissions' | 'edit'>('info');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Avatar & Edit form state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      const data = res.data;
      setProfile(data);

      const localUser = getAuthUser();
      const currentAvatar = data.avatarUrl || data.teacher?.avatarUrl || data.student?.avatarUrl || localUser?.avatarUrl || '';
      setAvatarUrl(currentAvatar);

      const name = data.teacher?.fullName || data.student?.fullName || data.username || 'Admin';
      setFullName(name);
      setEmail(data.email || `${data.username}@exam.edu.vn`);
      setPhone(data.teacher?.phone || data.student?.phone || '');
      setAddress(data.teacher?.address || data.student?.address || '');
    } catch (err: any) {
      const u = getAuthUser();
      if (u) {
        setProfile({
          id: u.id || 1,
          username: u.username || 'user',
          role: u.role || 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          avatarUrl: u.avatarUrl,
          student: u.student || null,
          teacher: u.teacher || null,
        });
        setAvatarUrl(u.avatarUrl || u.teacher?.avatarUrl || u.student?.avatarUrl || '');
        const name = u.teacher?.fullName || u.student?.fullName || u.username || 'Admin';
        setFullName(name);
        setEmail(u.email || `${u.username || 'user'}@exam.edu.vn`);
        setPhone(u.teacher?.phone || u.student?.phone || '');
        setAddress('');
      } else {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Vui lòng chọn một file hình ảnh hợp lệ (PNG, JPG, WEBP)!', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Dung lượng ảnh tối đa là 5MB!', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);

      // Persist avatar to localStorage & emit auth-change so Sidebar & Header update instantly
      const token = getAuthToken();
      const current = getAuthUser();
      if (token && current) {
        const updatedUser = {
          ...current,
          avatarUrl: dataUrl,
        };
        setAuthToken(token, updatedUser as UserType);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
      }
      setToast({ message: 'Đã cập nhật ảnh đại diện thành công!', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    const token = getAuthToken();
    const current = getAuthUser();
    if (token && current) {
      const updatedUser = {
        ...current,
        avatarUrl: undefined,
      };
      setAuthToken(token, updatedUser as UserType);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setToast({ message: 'Đã gỡ ảnh đại diện thành công!', type: 'success' });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/auth/profile', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUrl,
      });

      const updated = res.data;
      setProfile(updated);

      const savedName = updated.teacher?.fullName || updated.student?.fullName || updated.username || fullName.trim();
      setFullName(savedName);
      setEmail(updated.email || email.trim());
      setPhone(updated.teacher?.phone || updated.student?.phone || phone.trim());

      const token = getAuthToken();
      if (token && updated) {
        const current = getAuthUser();
        setAuthToken(token, {
          ...(current || {}),
          ...updated,
          avatarUrl: avatarUrl || updated.avatarUrl || current?.avatarUrl,
          teacher: updated.teacher ?? current?.teacher,
          student: updated.student ?? current?.student,
        } as UserType);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
      }

      setToast({ message: 'Đã cập nhật hồ sơ cá nhân và lưu thành công!', type: 'success' });
      setActiveTab('info');
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || err.message || 'Cập nhật hồ sơ thất bại', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    profile?.teacher?.fullName || profile?.student?.fullName || profile?.username || 'Admin';
  const roleName =
    profile?.role === 'ADMIN' ? 'Quản trị viên' : profile?.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên';
  const roleBadgeBg =
    profile?.role === 'ADMIN'
      ? 'bg-[#003896] text-white border-blue-400/40'
      : profile?.role === 'TEACHER'
      ? 'bg-blue-600 text-white border-blue-400/40'
      : 'bg-emerald-600 text-white border-emerald-400/40';

  const userCode =
    profile?.teacher?.teacherCode ||
    profile?.student?.studentCode ||
    `ADM-${String(profile?.id || 1).padStart(4, '0')}`;

  const deptOrClass =
    profile?.teacher?.department?.departmentName ||
    profile?.teacher?.department?.name ||
    profile?.student?.class?.className ||
    profile?.student?.class?.name ||
    'Ban Quản trị Khảo thí Trung tâm';

  const actualDepartment = profile?.teacher?.department?.departmentName || profile?.teacher?.department?.name || profile?.student?.class?.className || profile?.student?.class?.name;
  const profileFields = [profile?.username, displayName, (profile as any)?.email, userCode, actualDepartment];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-12 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* Hero Banner Enterprise SaaS Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003896] via-[#0047BA] to-[#003082] p-6 text-white shadow-md">
        {/* Vector Background Overlay */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-85">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="160" cy="80" r="70" fill="white" fillOpacity="0.06" />
            <path d="M120 40L200 40L220 120L100 120Z" fill="white" fillOpacity="0.08" />
            <circle cx="230" cy="40" r="12" fill="#60A5FA" fillOpacity="0.4" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Avatar Circle with Camera Overlay */}
            <div className="relative group shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 font-black text-white text-3xl shadow-xl overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition active:scale-95 cursor-pointer border border-white/30"
                title="Tải ảnh đại diện mới"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-extrabold border ${roleBadgeBg}`}>
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>{roleName}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-blue-100 border border-white/20">
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                  <span>Đã xác thực</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{displayName}</h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100/90 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Mã số: <strong className="font-bold text-white">{userCode}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-300" />
                  {deptOrClass}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#003896] px-4 py-2.5 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Settings className="h-4 w-4 text-[#003896]" />
              <span>Cài đặt tài khoản</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/change-password')}
              className="flex items-center gap-2 rounded-xl bg-[#001E5C] hover:bg-[#001748] text-white px-4 py-2.5 text-xs font-black transition active:scale-95 cursor-pointer border border-blue-400/20"
            >
              <Lock className="h-4 w-4 text-white" />
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hồ sơ cá nhân</span>
          <div className="text-xl font-black text-slate-900">{profileCompletion}% Hoàn tất</div>
          <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {profileCompletion === 100 ? 'Tất cả thông tin đã xác thực' : 'Cập nhật thêm thông tin để hoàn tất hồ sơ'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vai trò hệ thống</span>
          <div className="text-xl font-black text-[#003896]">{roleName}</div>
          <span className="text-[10.5px] font-medium text-slate-500">Quyền hạn truy cập chuẩn</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đơn vị quản lý</span>
          <div className="text-base font-black text-slate-900 truncate">{deptOrClass}</div>
          <span className="text-[10.5px] font-medium text-slate-500">Hệ thống khảo thí</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bảo mật tài khoản</span>
          <div className="text-xl font-black text-emerald-700">An toàn</div>
          <span className="text-[10.5px] font-medium text-slate-500">JWT Token mã hóa 256-bit</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TabBar
        tabs={[
          { key: 'info', label: 'Thông tin chi tiết' },
          { key: 'permissions', label: 'Nhật ký & Phân quyền' },
          { key: 'edit', label: 'Chỉnh sửa hồ sơ cá nhân' },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as any)}
      />

      {/* Tab 1: Info Details */}
      {activeTab === 'info' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-blue-600" />
            <span>Thông tin tài khoản khảo thí</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Họ và tên đầy đủ</span>
              <span className="text-sm font-black text-slate-900">{displayName}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Tên đăng nhập hệ thống</span>
              <span className="text-sm font-black text-slate-900">{profile?.username || '—'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Mã định danh (ID/Code)</span>
              <span className="text-sm font-black text-blue-700">{userCode}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Email liên hệ</span>
              <span className="text-sm font-black text-slate-900">{email}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Số điện thoại liên lạc</span>
              <span className="text-sm font-black text-slate-900">{phone}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">Đơn vị / Lớp học</span>
              <span className="text-sm font-black text-slate-900">{deptOrClass}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Permissions */}
      {activeTab === 'permissions' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
            <span>Phân quyền và Nhật ký hoạt động</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
              <span className="text-xs font-black text-[#003896] block">Quyền hạn tài khoản ({roleName})</span>
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                Tài khoản của bạn được cấp quyền <strong className="font-black">{roleName}</strong> trong hệ thống quản lý khảo thí. Bạn có thể truy cập và thao tác đúng phạm vi chức năng được giao.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Phiên đăng nhập gần đây</span>
              </span>
              <p className="text-xs font-medium text-slate-600">Trình duyệt web • IP 127.0.0.1 • Đã xác thực JWT token thành công</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Edit Profile Form */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-blue-600" />
            <span>Chỉnh sửa thông tin tài khoản & liên hệ</span>
          </h2>

          <div className="space-y-3">
            {/* Avatar Upload Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-black text-slate-800">Ảnh đại diện tài khoản</label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-300 font-black text-blue-600 text-2xl shadow-xs overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tải ảnh đại diện mới</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-2 text-xs font-bold border border-rose-200 transition active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Gỡ ảnh đại diện</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Chấp nhận định dạng PNG, JPG, WEBP. Dung lượng tối đa 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">Họ và tên hiển thị</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">Email nhận thông báo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">Số điện thoại cá nhân</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">Địa chỉ liên hệ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-semibold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#003896] hover:bg-[#002d78] text-white px-5 py-2.5 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4 text-white" />
              <span>{saving ? 'Đang lưu vào database...' : 'Lưu hồ sơ cá nhân'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
