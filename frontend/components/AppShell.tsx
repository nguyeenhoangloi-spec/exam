'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../types';
import { canAccessPath, workspaceRoutes } from '../lib/access';

interface AppShellProps {
  user: User | null;
  title: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, title, children }) => {
  const pathname = usePathname();
  const router = useRouter();
  // Keep the server and first client render identical.  The persisted setting
  // is restored only after hydration, while the CSS rule handles the desktop
  // transition without affecting the mobile drawer.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = () => {
    setIsToggling(true);
    setCollapsed((prev) => !prev);
    setTimeout(() => setIsToggling(false), 350);
  };

  useEffect(() => {
    setCollapsed(window.localStorage.getItem('sidebar-collapsed') === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('sidebar-collapsed', String(collapsed));
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  const isDenied = Boolean(user && !canAccessPath(user.role, pathname));

  useEffect(() => {
    if (user && isDenied) {
      router.replace(workspaceRoutes[user.role]);
    }
  }, [isDenied, router, user]);

  if (isDenied) {
    return <div className="min-h-screen bg-slate-50" aria-live="polite" />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggle={handleToggle}
        isToggling={isToggling}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 z-40 bg-slate-950/55 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`app-shell-main min-h-screen min-w-0 pt-[72px] ${
          isToggling ? 'transition-[margin] duration-300 ease-in-out' : ''
        } ${collapsed ? 'md:ml-[76px]' : 'md:ml-[260px]'}`}
      >
        <Header user={user} title={title} collapsed={collapsed} onMenuClick={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
};
