'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { Toast } from '../../components/Toast';
import {
  Settings,
  Bell,
  Shield,
  Moon,
  Sun,
  Monitor,
  Globe,
  Save,
  Lock,
  Volume2,
  CheckCircle2,
  Sliders,
  Sparkles,
  Smartphone,
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

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-12 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Banner Enterprise SaaS Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003896] via-[#0047BA] to-[#003082] p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Cài đặt tài khoản</h1>
              <p className="text-xs font-semibold text-blue-100/80">Tùy chỉnh thông báo, giao diện theme và bảo mật cá nhân</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Giao diện (Theme)</span>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100">{isDarkMode ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}</div>
          <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">Tự động đồng bộ</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kênh thông báo</span>
          <div className="text-lg font-black text-[#003896] dark:text-blue-400">Email & Hệ thống</div>
          <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Đã bật nhắc lịch thi
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ngôn ngữ hiển thị</span>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100">Tiếng Việt (VN)</div>
          <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">Mặc định hệ thống</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trạng thái bảo mật</span>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">Đã mã hóa</div>
          <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">Phiên làm việc an toàn</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${activeTab === 'notifications'
            ? 'border-[#003896] dark:border-blue-400 text-[#003896] dark:text-blue-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Bell className="h-4 w-4" />
          <span>Cấu hình thông báo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`pb-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${activeTab === 'appearance'
            ? 'border-[#003896] dark:border-blue-400 text-[#003896] dark:text-blue-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Giao diện & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${activeTab === 'security'
            ? 'border-[#003896] dark:border-blue-400 text-[#003896] dark:text-blue-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Shield className="h-4 w-4" />
          <span>Bảo mật & Quyền riêng tư</span>
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSaveSettings}>
        {/* Tab 1: Notifications */}
        {activeTab === 'notifications' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-blue-600" />
              <span>Thiết lập thông báo tự động</span>
            </h2>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Thông báo qua Email</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Gửi email thông báo khi có phân công coi thi hoặc lịch thi mới</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-[#003896] focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Nhắc nhở lịch thi trước 24 giờ</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Tự động gửi thông báo nhắc ca thi trên giao diện web</span>
                </div>
                <input
                  type="checkbox"
                  checked={examReminder}
                  onChange={(e) => setExamReminder(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-[#003896] focus:ring-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Âm thanh thông báo</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Phát âm thanh nhẹ khi có thông báo hệ thống mới</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlert}
                  onChange={(e) => setSoundAlert(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-[#003896] focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Appearance & Theme */}
        {activeTab === 'appearance' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-blue-600" />
              <span>Tùy chỉnh chế độ hiển thị & Theme</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block flex items-center gap-1.5">
                    {isDarkMode ? <Moon className="h-4 w-4 text-purple-600" /> : <Sun className="h-4 w-4 text-amber-500" />}
                    Chế độ Dark Mode (Giao diện tối)
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Chuyển đổi giao diện sáng / tối cho toàn bộ màn hình</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-[#003896]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">Ngôn ngữ giao diện</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 p-3 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                >
                  <option value="vi">Tiếng Việt (Mặc định)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Privacy */}
        {activeTab === 'security' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-blue-600" />
              <span>Thiết lập bảo mật phiên đăng nhập</span>
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Thời gian tự động đăng xuất (Timeout)</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-2">Tự động hủy phiên đăng nhập nếu không có thao tác</span>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 p-2.5 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                >
                  <option value="30">30 phút không hoạt động</option>
                  <option value="60">60 phút không hoạt động (Mặc định)</option>
                  <option value="120">120 phút không hoạt động</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 block">Mã hóa mật khẩu & Session</span>
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">Mật khẩu được mã hóa Bcrypt 10-rounds an toàn tuyệt đối</span>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#003896] hover:bg-[#002d78] text-white px-6 py-2.5 text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Save className="h-4 w-4 text-white" />
            <span>Lưu thiết lập cài đặt</span>
          </button>
        </div>
      </form>
    </div>
  );
}
