'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import { TabBar } from '../../components/ui/TabBar';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import {
  Settings,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Save,
  Lock,
  CheckCircle2,
  Sliders,
  Sparkles,
  User,
  Clock,
} from 'lucide-react';

export default function SettingsPage() {
  usePageTitle('Cài đặt tài khoản');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'notifications' | 'appearance' | 'security'>('notifications');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Notification settings
  const [emailNotify, setEmailNotify] = useState(true);
  const [examReminder, setExamReminder] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Appearance settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [language, setLanguage] = useState('vi');

  // Security settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);

    try {
      // Load theme preference
      const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
      setIsDarkMode(isDark);

      // Load notification preferences
      const notifRaw = localStorage.getItem('settings_notifications');
      if (notifRaw) {
        const n = JSON.parse(notifRaw);
        if (typeof n.emailNotify === 'boolean') setEmailNotify(n.emailNotify);
        if (typeof n.examReminder === 'boolean') setExamReminder(n.examReminder);
        if (typeof n.soundAlert === 'boolean') setSoundAlert(n.soundAlert);
        if (typeof n.weeklyReport === 'boolean') setWeeklyReport(n.weeklyReport);
      }

      // Load language
      const savedLang = localStorage.getItem('settings_language');
      if (savedLang) setLanguage(savedLang);

      // Load security preferences
      const secRaw = localStorage.getItem('settings_security');
      if (secRaw) {
        const s = JSON.parse(secRaw);
        if (typeof s.twoFactor === 'boolean') setTwoFactor(s.twoFactor);
        if (s.sessionTimeout) setSessionTimeout(s.sessionTimeout);
      }
    } catch (e) {
      /* ignore corrupted localStorage */
    }
  }, [router]);

  const toggleDarkMode = useCallback((checked: boolean) => {
    setIsDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Persist notification preferences
      localStorage.setItem(
        'settings_notifications',
        JSON.stringify({ emailNotify, examReminder, soundAlert, weeklyReport }),
      );
      // Persist language
      localStorage.setItem('settings_language', language);
      // Persist security preferences
      localStorage.setItem('settings_security', JSON.stringify({ twoFactor, sessionTimeout }));
      setToast({ message: 'Đã lưu cấu hình cài đặt hệ thống thành công!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Không thể lưu cấu hình cài đặt. Vui lòng thử lại.', type: 'error' });
    }
  };

  // 4 Standardized KPI Cards with uniform min-height & balanced sizing
  const kpis = [
    {
      key: 'theme',
      title: 'Giao diện (Theme)',
      value: isDarkMode ? 'Giao diện Tối' : 'Giao diện Sáng',
      subtext: 'Tự động đồng bộ hệ thống',
      progressPercent: 100,
      icon: isDarkMode ? Moon : Sun,
    },
    {
      key: 'notifications',
      title: 'Kênh thông báo',
      value: emailNotify ? 'Email & Web' : 'Chỉ trên Web',
      subtext: examReminder ? 'Đã bật nhắc lịch thi trước 24h' : 'Chưa bật nhắc lịch thi',
      progressPercent: emailNotify ? 100 : 50,
      icon: Bell,
    },
    {
      key: 'language',
      title: 'Ngôn ngữ hiển thị',
      value: language === 'vi' ? 'Tiếng Việt (VN)' : 'English (US)',
      subtext: 'Mặc định toàn hệ thống',
      progressPercent: 100,
      icon: Globe,
    },
    {
      key: 'security',
      title: 'Trạng thái bảo mật',
      value: 'Đã mã hóa',
      subtext: `Phiên đăng nhập ${sessionTimeout} phút`,
      progressPercent: 100,
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-12 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Banner Enterprise SaaS Style (Consistent Height & Actions) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 p-6 text-white shadow-md">
        {/* Vector Background Overlay */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-32 opacity-85">
          <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="160" cy="80" r="70" fill="white" fillOpacity="0.06" />
            <path d="M120 40L200 40L220 120L100 120Z" fill="white" fillOpacity="0.08" />
            <circle cx="230" cy="40" r="12" fill="var(--ui-chart-primary-light)" fillOpacity="0.4" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-type-page font-semibold leading-[36px] text-white tracking-tight">Cài đặt tài khoản</h1>
              <p className="text-type-body font-normal leading-[22px] text-blue-100/90">Tùy chỉnh thông báo, giao diện theme và bảo mật cá nhân</p>
            </div>
          </div>

          {/* Quick Action Sibling Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-blue-700 px-4 py-2 text-type-body font-medium shadow-sm transition active:scale-95 cursor-pointer"
            >
              <User className="h-4 w-4 text-blue-700" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/change-password')}
              className="flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-type-body font-medium transition active:scale-95 cursor-pointer border border-blue-400/20"
            >
              <Lock className="h-4 w-4 text-white" />
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Standardized KPI Statistic Cards (Uniform Height & Balanced Typography) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((spec) => {
          const Icon = spec.icon;
          return (
            <div
              key={spec.key}
              className="group relative flex flex-col justify-between min-h-[118px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {spec.title}
                  </span>
                  <div className="text-type-section font-semibold leading-[28px] tracking-tight text-slate-900 dark:text-slate-100 truncate">
                    {spec.value}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Micro Progress Track */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(spec.progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={spec.subtext}
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {spec.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Navigation Tabs */}
      <TabBar
        tabs={[
          { key: 'notifications', label: 'Cấu hình thông báo' },
          { key: 'appearance', label: 'Giao diện & Theme' },
          { key: 'security', label: 'Bảo mật & Quyền riêng tư' },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as any)}
      />

      {/* Form Container */}
      <form onSubmit={handleSaveSettings}>
        {/* Tab 1: Notifications */}
        {activeTab === 'notifications' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
            <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Thiết lập thông báo tự động</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition">
                <div className="space-y-0.5">
                  <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">Thông báo qua Email</span>
                  <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block">Gửi email thông báo khi có phân công coi thi hoặc lịch thi mới</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition">
                <div className="space-y-0.5">
                  <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">Nhắc nhở lịch thi trước 24 giờ</span>
                  <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block">Tự động gửi thông báo nhắc ca thi trên giao diện web</span>
                </div>
                <input
                  type="checkbox"
                  checked={examReminder}
                  onChange={(e) => setExamReminder(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition">
                <div className="space-y-0.5">
                  <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">Âm thanh thông báo</span>
                  <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block">Phát âm thanh nhẹ khi có thông báo hệ thống mới</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlert}
                  onChange={(e) => setSoundAlert(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Appearance & Theme */}
        {activeTab === 'appearance' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
            <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Tùy chỉnh chế độ hiển thị & Theme</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {isDarkMode ? <Moon className="h-4 w-4 text-blue-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                    Chế độ Dark Mode (Giao diện tối)
                  </span>
                  <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block">Chuyển đổi giao diện sáng / tối cho toàn bộ màn hình</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDarkMode(!isDarkMode)}
                  role="switch"
                  aria-checked={isDarkMode}
                  aria-label="Chuyển chế độ sáng tối"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDarkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-type-body font-medium text-slate-800 dark:text-slate-200">Ngôn ngữ giao diện</label>
                <FilterSelect
                  containerClassName="w-full"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full"
                >
                  <option value="vi">Tiếng Việt (Mặc định)</option>
                  <option value="en">English (US)</option>
                </FilterSelect>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Privacy */}
        {activeTab === 'security' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
            <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Thiết lập bảo mật phiên đăng nhập</span>
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">Thời gian tự động đăng xuất (Timeout)</span>
                <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block mb-2">Tự động hủy phiên đăng nhập nếu không có thao tác</span>
                <FilterSelect
                  containerClassName="w-full"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full"
                >
                  <option value="30">30 phút không hoạt động</option>
                  <option value="60">60 phút không hoạt động (Mặc định)</option>
                  <option value="120">120 phút không hoạt động</option>
                </FilterSelect>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-type-body font-medium text-emerald-900 dark:text-emerald-100 block">Mã hóa mật khẩu & Session</span>
                  <span className="text-type-helper font-normal text-emerald-700 dark:text-emerald-400 block">Mật khẩu được mã hóa Bcrypt 10-rounds an toàn tuyệt đối</span>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-slate-200/90 dark:border-slate-800 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="h-4 w-4 text-white" />}
          >
            Lưu thiết lập cài đặt
          </Button>
        </div>
      </form>
    </div>
  );
}
