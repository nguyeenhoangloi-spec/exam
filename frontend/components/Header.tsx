'use client';

import React from 'react';
import { LogOut, Menu, User as UserIcon } from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  title?: string;
  collapsed: boolean;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, title = 'Hệ thống Quản lý Khảo thí', collapsed, onMenuClick }) => {
  const handleLogout = () => {
    removeAuth();
    window.location.href = '/login';
  };

  return (
    <header
      className={`fixed top-0 right-0 z-40 flex h-[72px] items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm transition-all duration-300 md:px-8 ${
        collapsed ? 'left-0 md:left-[76px]' : 'left-0 md:left-[260px]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Mở menu điều hướng" onClick={onMenuClick} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"><Menu className="h-5 w-5" /></button>
        <h2 className="truncate text-base font-bold text-gray-800 tracking-tight sm:text-xl">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <UserIcon className="w-4 h-4 text-sky-600" />
          <div className="text-xs">
            <span className="font-semibold text-gray-700">{user?.username}</span>
            <span className="text-gray-400 ml-1">({user?.role})</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};
