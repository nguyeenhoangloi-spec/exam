'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../types';

interface AppShellProps {
  user: User | null;
  title: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, title, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem('sidebar-collapsed') === 'true');
    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (hasLoadedPreference) {
      window.localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed, hasLoadedPreference]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
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
        className={`min-h-screen min-w-0 pt-[72px] transition-[margin] duration-300 ease-in-out ${
          collapsed ? 'md:ml-[76px]' : 'md:ml-[260px]'
        }`}
      >
        <Header user={user} title={title} collapsed={collapsed} onMenuClick={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
};
